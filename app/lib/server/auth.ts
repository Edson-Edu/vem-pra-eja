import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { compare } from "bcryptjs";
import type { NextRequest } from "next/server";
import { consultar } from "./db";
import { origemPermitida } from "./http";

export const COOKIE_SESSAO = "vempraeja_admin_session";
const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000;

type Administrador = { id: string; email: string; senha_hash: string; ativo: boolean };
export type SessaoAdministrativa = { id: string; administradorId: string; email: string; csrfToken: string; expiraEm: string };

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const tokenSeguro = () => randomBytes(32).toString("hex");

function compararTokens(recebido: string, esperado: string) {
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function autenticar(email: string, senha: string) {
  const resultado = await consultar<Administrador>(
    "select id, email, senha_hash, ativo from public.administradores where email = lower($1) limit 1",
    [email.trim()],
  );
  const administrador = resultado.rows[0];
  if (!administrador?.ativo || !(await compare(senha, administrador.senha_hash))) return null;
  return administrador;
}

export async function criarSessao(administradorId: string) {
  const token = tokenSeguro();
  const csrfToken = tokenSeguro();
  const expiraEm = new Date(Date.now() + DURACAO_SESSAO_MS);
  await consultar("delete from public.sessoes_administrativas where expira_em < now() - interval '7 days' or revogada_em < now() - interval '7 days'");
  await consultar(
    `insert into public.sessoes_administrativas (administrador_id, token_hash, csrf_token, expira_em)
     values ($1, $2, $3, $4)`,
    [administradorId, hashToken(token), csrfToken, expiraEm],
  );
  return { token, csrfToken, expiraEm };
}

export async function obterSessao(request: NextRequest): Promise<SessaoAdministrativa | null> {
  const token = request.cookies.get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  const resultado = await consultar<{ id: string; administrador_id: string; email: string; csrf_token: string; expira_em: Date }>(
    `select s.id, s.administrador_id, a.email, s.csrf_token, s.expira_em
       from public.sessoes_administrativas s
       join public.administradores a on a.id = s.administrador_id
      where s.token_hash = $1 and s.revogada_em is null and s.expira_em > now() and a.ativo is true
      limit 1`,
    [hashToken(token)],
  );
  const sessao = resultado.rows[0];
  if (!sessao) return null;
  void consultar("update public.sessoes_administrativas set ultimo_acesso_em = now() where id = $1", [sessao.id]).catch(() => undefined);
  return { id: sessao.id, administradorId: sessao.administrador_id, email: sessao.email, csrfToken: sessao.csrf_token, expiraEm: sessao.expira_em.toISOString() };
}

export async function exigirAdministrador(request: NextRequest, validarCsrf = false) {
  const sessao = await obterSessao(request);
  if (!sessao) return { erro: "Acesso não autorizado.", status: 401 as const };
  if (validarCsrf) {
    const recebido = request.headers.get("x-csrf-token") ?? "";
    if (!origemPermitida(request) || !compararTokens(recebido, sessao.csrfToken)) return { erro: "Requisição administrativa inválida.", status: 403 as const };
  }
  return { sessao };
}

export async function revogarSessao(request: NextRequest) {
  const token = request.cookies.get(COOKIE_SESSAO)?.value;
  if (token) await consultar("update public.sessoes_administrativas set revogada_em = now() where token_hash = $1", [hashToken(token)]);
}

function chaveDoLimite(request: NextRequest, email: string) {
  const segredo = process.env.LOGIN_RATE_LIMIT_SECRET || process.env.RATE_LIMIT_SECRET || "desenvolvimento-local";
  const ip = process.env.TRUST_PROXY === "true" ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() : request.headers.get("x-real-ip");
  return createHmac("sha256", segredo).update(`${ip || "local"}:${email.trim().toLowerCase()}`).digest("hex");
}

export async function loginEstaLiberado(request: NextRequest, email: string) {
  const chave = chaveDoLimite(request, email);
  const resultado = await consultar<{ bloqueado_ate: Date | null }>("select bloqueado_ate from public.limites_login where chave = $1", [chave]);
  return { chave, liberado: !resultado.rows[0]?.bloqueado_ate || resultado.rows[0].bloqueado_ate.getTime() <= Date.now() };
}

export async function registrarFalhaDeLogin(chave: string) {
  await consultar(
    `insert into public.limites_login (chave, tentativas, janela_iniciada_em)
     values ($1, 1, now())
     on conflict (chave) do update set
       tentativas = case when public.limites_login.janela_iniciada_em < now() - interval '15 minutes' then 1 else public.limites_login.tentativas + 1 end,
       janela_iniciada_em = case when public.limites_login.janela_iniciada_em < now() - interval '15 minutes' then now() else public.limites_login.janela_iniciada_em end,
       bloqueado_ate = case when (case when public.limites_login.janela_iniciada_em < now() - interval '15 minutes' then 1 else public.limites_login.tentativas + 1 end) >= 5 then now() + interval '15 minutes' else null end`,
    [chave],
  );
}

export async function limparFalhasDeLogin(chave: string) {
  await consultar("delete from public.limites_login where chave = $1", [chave]);
}


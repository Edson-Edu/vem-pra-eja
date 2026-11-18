import "server-only";

import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { EscolaAdministrativaEntrada } from "../validacao";
import { consultar, transacao } from "./db";

type LinhaEscola = {
  id: string; nome: string; niveis_oferecidos: string[]; whatsapp: string | null; telefone_contato: string | null;
  email_contato: string | null; latitude: number; longitude: number; cidade: string; image_url: string | null;
  bairro: string; sigla: string | null; endereco: string | null; ativa: boolean;
};
type LinhaTurno = { id: string; escola_id: string; turno: string; horario: string | null; descricao: string | null; auxilios: string | null; nivel_do_turno: string; dias_aula: string | null };
type LinhaBeneficio = { turno_id: string; beneficio_id: string; nome: string; descricao_padrao: string; descricao_local: string };

function separarEndereco(endereco: string | null) {
  const partes = String(endereco ?? "").split(",").map((parte) => parte.trim()).filter(Boolean);
  return { rua: partes[0] ?? "", numero: partes[1] ?? "", complemento: partes.slice(2).join(", ") };
}

function separarHorario(horario: string | null) {
  const partes = String(horario ?? "").match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  return { inicio: partes?.[1] ?? "", fim: partes?.[2] ?? "" };
}

const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] as const;
function diaPorAbreviacao(valor: string | null, ultimo: boolean) {
  const pedacos = String(valor ?? "").split(/\s*[-–]\s*/);
  const texto = pedacos[ultimo ? pedacos.length - 1 : 0] ?? "";
  const indice = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].findIndex((item) => texto.toLocaleLowerCase().startsWith(item));
  return indice >= 0 ? dias[indice] : "";
}

function nomeSemSigla(nome: string, sigla: string | null) {
  if (!sigla) return nome;
  return nome.replace(new RegExp(`^${sigla.split("").join("\\.?")}\\.?\\s*`, "i"), "").replace(/^[–-]\s*/, "").trim() || nome;
}

function imagensDaEscola(valor: string | null) {
  const imagens = valor?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
  return imagens.length ? imagens : ["/marca/vem-pra-eja-logo-3.png"];
}

async function carregarBase(apenasAtivas: boolean, nivel?: string | null, id?: string | null) {
  const parametros: unknown[] = [];
  const filtros: string[] = [];
  if (apenasAtivas) filtros.push("ativa is true");
  if (nivel) { parametros.push(nivel); filtros.push(`$${parametros.length} = any(niveis_oferecidos)`); }
  if (id) { parametros.push(id); filtros.push(`id = $${parametros.length}`); }
  const escolas = (await consultar<LinhaEscola>(`select * from public.escolas${filtros.length ? ` where ${filtros.join(" and ")}` : ""} order by nome`, parametros)).rows;
  const ids = escolas.map((escola) => escola.id);
  if (!ids.length) return { escolas, turnos: [] as LinhaTurno[], beneficios: [] as LinhaBeneficio[] };
  const turnos = (await consultar<LinhaTurno>("select * from public.turnos_escola where escola_id = any($1::uuid[]) order by escola_id, turno, horario", [ids])).rows;
  const idsTurnos = turnos.map((turno) => turno.id);
  const beneficios = idsTurnos.length ? (await consultar<LinhaBeneficio>(
    `select tb.turno_id, tb.beneficio_id, b.nome, b.descricao_padrao, tb.descricao_local
       from public.turnos_beneficios tb join public.beneficios_catalogo b on b.id = tb.beneficio_id
      where tb.turno_id = any($1::uuid[]) order by b.nome`, [idsTurnos],
  )).rows : [];
  return { escolas, turnos, beneficios };
}

export async function escolasPublicas(nivel?: string | null, id?: string | null) {
  const base = await carregarBase(true, nivel, id);
  return base.escolas.map((escola) => ({
    id: escola.id,
    nome: escola.nome,
    bairro: escola.bairro,
    cidade: escola.cidade,
    endereco: escola.endereco ?? "",
    latitude: Number(escola.latitude),
    longitude: Number(escola.longitude),
    imagem: imagensDaEscola(escola.image_url)[0],
    imagens: imagensDaEscola(escola.image_url),
    niveis: escola.niveis_oferecidos,
    whatsapp: escola.whatsapp,
    telefoneContato: escola.telefone_contato,
    emailContato: escola.email_contato,
    turnos: base.turnos.filter((turno) => turno.escola_id === escola.id).map((turno) => {
      const vinculados = base.beneficios.filter((item) => item.turno_id === turno.id);
      const auxilios = vinculados.length ? vinculados.map((item) => item.nome) : String(turno.auxilios ?? "").split(",").map((item) => item.trim()).filter(Boolean);
      return { id: turno.id, turno: turno.turno, horario: turno.horario ?? "A combinar", diasAula: turno.dias_aula ?? "A combinar", descricao: turno.descricao ?? "", auxilios, nivel: turno.nivel_do_turno };
    }),
  }));
}

export async function dadosAdministrativos() {
  const [base, catalogo] = await Promise.all([
    carregarBase(false),
    consultar<{ id: string; nome: string; descricao_padrao: string }>("select id, nome, descricao_padrao from public.beneficios_catalogo order by nome"),
  ]);
  return {
    catalogo: catalogo.rows.map((item) => ({ id: item.id, nome: item.nome, descricao: item.descricao_padrao })),
    escolas: base.escolas.map((escola) => {
      const endereco = separarEndereco(escola.endereco);
      return {
        id: escola.id, sigla: escola.sigla ?? "", nome: nomeSemSigla(escola.nome, escola.sigla), cidade: escola.cidade,
        bairro: escola.bairro, ...endereco, whatsapp: escola.whatsapp ?? "", latitude: String(escola.latitude), longitude: String(escola.longitude),
        niveis: escola.niveis_oferecidos, fotos: escola.image_url?.split(",").map((item) => item.trim()).filter(Boolean) ?? [""], ativa: escola.ativa,
        turnos: base.turnos.filter((turno) => turno.escola_id === escola.id).map((turno) => ({
          id: turno.id, nivel: turno.nivel_do_turno, turno: turno.turno, ...separarHorario(turno.horario),
          diaInicio: diaPorAbreviacao(turno.dias_aula, false), diaFim: diaPorAbreviacao(turno.dias_aula, true), comoFunciona: turno.descricao ?? "",
          beneficios: base.beneficios.filter((item) => item.turno_id === turno.id).map((item) => ({ beneficioId: item.beneficio_id, descricaoLocal: item.descricao_local || item.descricao_padrao })),
        })),
      };
    }),
  };
}

const abreviacoes = { Segunda: "Seg", Terça: "Ter", Quarta: "Qua", Quinta: "Qui", Sexta: "Sex", Sábado: "Sáb", Domingo: "Dom" } as const;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function salvarEscola(entrada: EscolaAdministrativaEntrada) {
  return transacao(async (cliente) => {
    const escolaId = entrada.id ?? randomUUID();
    const nomeCompleto = [entrada.sigla, entrada.nome].filter(Boolean).join(" ");
    const endereco = [entrada.rua, entrada.numero, entrada.complemento].filter(Boolean).join(", ");
    await cliente.query(
      `insert into public.escolas (id, sigla, nome, cidade, bairro, endereco, whatsapp, telefone_contato, latitude, longitude, niveis_oferecidos, image_url, ativa)
       values ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,$10,$11,$12)
       on conflict (id) do update set sigla=excluded.sigla, nome=excluded.nome, cidade=excluded.cidade, bairro=excluded.bairro,
         endereco=excluded.endereco, whatsapp=excluded.whatsapp, telefone_contato=excluded.telefone_contato, latitude=excluded.latitude,
         longitude=excluded.longitude, niveis_oferecidos=excluded.niveis_oferecidos, image_url=excluded.image_url, ativa=excluded.ativa, updated_at=now()`,
      [escolaId, entrada.sigla || null, nomeCompleto, entrada.cidade, entrada.bairro, endereco || null, entrada.whatsapp, entrada.latitude, entrada.longitude, entrada.niveis, entrada.fotos.filter(Boolean).join(", ") || null, entrada.ativa],
    );
    const existentes = new Set((await cliente.query<{ id: string }>("select id from public.turnos_escola where escola_id=$1", [escolaId])).rows.map((item) => item.id));
    const mantidos: string[] = [];
    for (const turno of entrada.turnos) {
      const turnoId = uuid.test(turno.id) && existentes.has(turno.id) ? turno.id : randomUUID();
      mantidos.push(turnoId);
      const diasAula = `${abreviacoes[turno.diaInicio as keyof typeof abreviacoes]} - ${abreviacoes[turno.diaFim as keyof typeof abreviacoes]}`;
      await cliente.query(
        `insert into public.turnos_escola (id, escola_id, turno, horario, descricao, nivel_do_turno, dias_aula, auxilios)
         values ($1,$2,$3,$4,$5,$6,$7,$8)
         on conflict (id) do update set turno=excluded.turno, horario=excluded.horario, descricao=excluded.descricao,
           nivel_do_turno=excluded.nivel_do_turno, dias_aula=excluded.dias_aula, auxilios=excluded.auxilios`,
        [turnoId, escolaId, turno.turno, `${turno.inicio} - ${turno.fim}`, turno.comoFunciona, turno.nivel, diasAula, null],
      );
      await cliente.query("delete from public.turnos_beneficios where turno_id=$1", [turnoId]);
      for (const beneficio of turno.beneficios) await cliente.query(
        "insert into public.turnos_beneficios (turno_id, beneficio_id, descricao_local) values ($1,$2,$3)",
        [turnoId, beneficio.beneficioId, beneficio.descricaoLocal],
      );
    }
    await cliente.query("delete from public.turnos_escola where escola_id=$1 and not (id = any($2::uuid[]))", [escolaId, mantidos]);
    return escolaId;
  });
}

export async function alterarAtivacao(id: string, ativa: boolean) {
  const resultado = await consultar("update public.escolas set ativa=$2, updated_at=now() where id=$1", [id, ativa]);
  if (!resultado.rowCount) throw new Error("Escola não encontrada.");
}

export async function excluirEscola(id: string) {
  await transacao(async (cliente) => {
    const resultado = await cliente.query("delete from public.escolas where id=$1", [id]);
    if (!resultado.rowCount) throw new Error("Escola não encontrada.");
  });
}

export async function criarBeneficio(nome: string, descricao: string) {
  const resultado = await consultar<{ id: string; nome: string; descricao_padrao: string }>(
    "insert into public.beneficios_catalogo (nome, descricao_padrao) values ($1,$2) returning id,nome,descricao_padrao", [nome.trim(), descricao.trim()],
  );
  const item = resultado.rows[0];
  return { id: item.id, nome: item.nome, descricao: item.descricao_padrao };
}

export async function excluirBeneficio(id: string) {
  await transacao(async (cliente: PoolClient) => {
    const resultado = await cliente.query("delete from public.beneficios_catalogo where id=$1", [id]);
    if (!resultado.rowCount) throw new Error("Auxílio não encontrado.");
  });
}


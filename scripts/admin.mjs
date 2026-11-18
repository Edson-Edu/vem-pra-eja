import pg from "pg";
import { hash } from "bcryptjs";
import { configuracaoBanco } from "./db-config.mjs";

const [, , acao, emailInformado] = process.argv;
const email = String(emailInformado || "").trim().toLowerCase();
if (!['create', 'reset', 'deactivate'].includes(acao) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Uso: npm run admin -- <create|reset|deactivate> email@instituicao.br"); process.exit(2);
}

async function lerSenha() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (!process.stdin.isTTY) throw new Error("Use um terminal interativo ou forneça ADMIN_PASSWORD apenas no ambiente do comando.");
  process.stdout.write("Senha (mínimo 12 caracteres): ");
  process.stdin.setRawMode(true); process.stdin.resume(); process.stdin.setEncoding("utf8");
  return await new Promise((resolve) => {
    let senha = "";
    const aoDado = (tecla) => {
      if (tecla === "\r" || tecla === "\n") { process.stdin.setRawMode(false); process.stdin.pause(); process.stdin.off("data", aoDado); process.stdout.write("\n"); resolve(senha); }
      else if (tecla === "\u0003") process.exit(130);
      else if (tecla === "\u007f") senha = senha.slice(0, -1);
      else senha += tecla;
    };
    process.stdin.on("data", aoDado);
  });
}

const cliente = new pg.Client(configuracaoBanco("MIGRATION_DB"));
try {
  await cliente.connect();
  if (acao === "deactivate") {
    const resultado = await cliente.query("update public.administradores set ativo=false, atualizado_em=now() where email=$1", [email]);
    if (!resultado.rowCount) throw new Error("Conta não encontrada.");
  } else {
    const senha = await lerSenha();
    if (senha.length < 12) throw new Error("A senha precisa ter pelo menos 12 caracteres.");
    const senhaHash = await hash(senha, 12);
    if (acao === "create") await cliente.query("insert into public.administradores(email,senha_hash) values ($1,$2)", [email, senhaHash]);
    else {
      const resultado = await cliente.query("update public.administradores set senha_hash=$2, ativo=true, atualizado_em=now() where email=$1", [email, senhaHash]);
      if (!resultado.rowCount) throw new Error("Conta não encontrada.");
      await cliente.query("update public.sessoes_administrativas set revogada_em=now() where administrador_id=(select id from public.administradores where email=$1)", [email]);
    }
  }
  console.log(`Operação ${acao} concluída para ${email}.`);
} finally { await cliente.end().catch(() => undefined); }

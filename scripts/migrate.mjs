import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { configuracaoBanco } from "./db-config.mjs";

const { Client } = pg;
const cliente = new Client(configuracaoBanco("MIGRATION_DB"));
const usuarioAplicacao = process.env.APP_DB_USER || "vempraeja_app";
const senhaAplicacao = process.env.APP_DB_PASSWORD;
if (!/^[a-z_][a-z0-9_]*$/.test(usuarioAplicacao)) throw new Error("APP_DB_USER inválido.");
if (!senhaAplicacao || senhaAplicacao.length < 16) throw new Error("APP_DB_PASSWORD deve ter pelo menos 16 caracteres.");

try {
  await cliente.connect();
  await cliente.query("select pg_advisory_lock(814733201)");
  const existe = await cliente.query("select 1 from pg_roles where rolname=$1", [usuarioAplicacao]);
  const formato = existe.rowCount
    ? "select format('alter role %I with login password %L', $1::text, $2::text) comando"
    : "select format('create role %I with login password %L', $1::text, $2::text) comando";
  const comando = await cliente.query(formato, [usuarioAplicacao, senhaAplicacao]);
  await cliente.query(comando.rows[0].comando);
  await cliente.query("create table if not exists public.schema_migrations (nome text primary key, aplicado_em timestamptz not null default now())");
  const pasta = path.resolve("database/migrations");
  const arquivos = (await readdir(pasta)).filter((nome) => /^\d+.*\.sql$/.test(nome)).sort();
  for (const nome of arquivos) {
    const aplicado = await cliente.query("select 1 from public.schema_migrations where nome=$1", [nome]);
    if (aplicado.rowCount) { console.log(`já aplicada: ${nome}`); continue; }
    const sql = await readFile(path.join(pasta, nome), "utf8");
    await cliente.query("begin");
    try {
      await cliente.query(sql);
      await cliente.query("insert into public.schema_migrations(nome) values ($1)", [nome]);
      await cliente.query("commit");
      console.log(`aplicada: ${nome}`);
    } catch (erro) { await cliente.query("rollback"); throw erro; }
  }
  const papel = (await cliente.query("select format('%I', $1::text) nome", [usuarioAplicacao])).rows[0].nome;
  await cliente.query(`grant usage on schema public to ${papel}`);
  await cliente.query(`grant select,insert,update,delete on public.escolas,public.turnos_escola,public.beneficios_catalogo,public.turnos_beneficios to ${papel}`);
  await cliente.query(`grant select on public.administradores to ${papel}`);
  await cliente.query(`grant select,insert,update,delete on public.sessoes_administrativas,public.limites_login,public.metricas_agregadas to ${papel}`);
  await cliente.query(`revoke all on public.schema_migrations from ${papel}`);
  console.log("Banco atualizado sem recriar tabelas ou apagar dados.");
} finally {
  await cliente.query("select pg_advisory_unlock(814733201)").catch(() => undefined);
  await cliente.end().catch(() => undefined);
}

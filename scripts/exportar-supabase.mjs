import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

if (!process.env.SOURCE_DATABASE_URL) throw new Error("SOURCE_DATABASE_URL não configurada.");
const cliente = new pg.Client({ connectionString: process.env.SOURCE_DATABASE_URL, ssl: process.env.SOURCE_DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: true } });
const tabelas = ["escolas", "turnos_escola", "beneficios_catalogo", "turnos_beneficios"];
const saida = { versao: 1, exportadoEm: new Date().toISOString(), tabelas: {} };
try {
  await cliente.connect();
  for (const tabela of tabelas) {
    const existe = await cliente.query("select to_regclass($1) nome", [`public.${tabela}`]);
    saida.tabelas[tabela] = existe.rows[0]?.nome ? (await cliente.query(`select to_jsonb(t) item from public.${tabela} t`)).rows.map((linha) => linha.item) : [];
  }
  await mkdir("migration-data", { recursive: true });
  const arquivo = path.resolve("migration-data", `escolas-${new Date().toISOString().replaceAll(":", "-")}.json`);
  await writeFile(arquivo, JSON.stringify(saida, null, 2), { mode: 0o600 });
  console.log(`Exportação institucional criada em ${arquivo}. Tabelas de inscrições não foram lidas.`);
} finally { await cliente.end().catch(() => undefined); }

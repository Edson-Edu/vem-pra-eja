import "server-only";

import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  var __vempraejaPool: Pool | undefined;
}

function criarPool() {
  const connectionString = process.env.DATABASE_URL;
  return new Pool({
    ...(connectionString ? { connectionString } : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    }),
    max: Number(process.env.DB_POOL_MAX || "10"),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  });
}

export function pool() {
  if (!global.__vempraejaPool) global.__vempraejaPool = criarPool();
  return global.__vempraejaPool;
}

export async function consultar<T extends QueryResultRow>(texto: string, valores: unknown[] = []) {
  return pool().query<T>(texto, valores);
}

export async function transacao<T>(executar: (cliente: PoolClient) => Promise<T>) {
  const cliente = await pool().connect();
  try {
    await cliente.query("begin");
    const resultado = await executar(cliente);
    await cliente.query("commit");
    return resultado;
  } catch (erro) {
    await cliente.query("rollback");
    throw erro;
  } finally {
    cliente.release();
  }
}


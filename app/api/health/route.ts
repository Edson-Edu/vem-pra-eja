import { consultar } from "../../lib/server/db";
import { json } from "../../lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await consultar("select 1");
    return json({ status: "ok" });
  } catch {
    return json({ status: "indisponivel" }, 503);
  }
}

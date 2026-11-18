import type { NextRequest } from "next/server";
import { z } from "zod";
import { dentroDoLimite } from "../../lib/server/rate-limit";

const corpoSchema = z.object({ texto: z.string().trim().min(1).max(3000) });
const escaparXml = (valor: string) => valor.replace(/[<>&'\"]/g, (item) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[item] ?? item);

export async function POST(request: NextRequest) {
  if (!dentroDoLimite(request, "voz", 30, 60_000)) return Response.json({ erro: "Limite temporário atingido." }, { status: 429 });
  const chave = process.env.AZURE_SPEECH_KEY;
  const regiao = process.env.AZURE_SPEECH_REGION;
  if (!chave || !regiao) return Response.json({ erro: "Serviço de voz não configurado." }, { status: 503 });
  try {
    const { texto } = corpoSchema.parse(await request.json());
    const ssml = `<speak version="1.0" xml:lang="pt-BR"><voice name="pt-BR-FranciscaNeural">${escaparXml(texto)}</voice></speak>`;
    const resposta = await fetch(`https://${regiao}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": chave, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3", "User-Agent": "VemPraEJA" },
      body: ssml,
    });
    if (!resposta.ok) return Response.json({ erro: "Serviço de voz indisponível." }, { status: 502 });
    return new Response(resposta.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=300" } });
  } catch { return Response.json({ erro: "Texto inválido." }, { status: 400 }); }
}

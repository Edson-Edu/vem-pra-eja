import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

function origemPermitida(origem: string | null) {
  const permitidas = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  return origem && permitidas.includes(origem) ? origem : permitidas[0] ?? "";
}

function cabecalhosCors(request: HttpRequest) {
  const origem = origemPermitida(request.headers.get("origin"));
  return {
    ...(origem ? { "Access-Control-Allow-Origin": origem, Vary: "Origin" } : {}),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function escaparXml(texto: string) {
  return texto.replace(/[<>&'\"]/g, (caractere) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[caractere]!));
}

export async function voz(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const cors = cabecalhosCors(request);
  if (request.method === "OPTIONS") return { status: 204, headers: cors };

  const chave = process.env.AZURE_SPEECH_KEY;
  const regiao = process.env.AZURE_SPEECH_REGION;
  if (!chave || !regiao) {
    context.error("Configuração do Azure Speech ausente.");
    return { status: 503, headers: cors, jsonBody: { erro: "Serviço de áudio indisponível." } };
  }

  let texto = "";
  try {
    // A leitura manual aceita application/json e text/plain. O segundo formato
    // é um "simple request" e evita o preflight que alguns celulares bloqueiam.
    const corpo = await request.text();
    texto = String((JSON.parse(corpo) as { texto?: unknown }).texto ?? "").trim();
  } catch { /* resposta abaixo */ }
  if (!texto || texto.length > 3000) return { status: 400, headers: cors, jsonBody: { erro: "Texto de áudio inválido." } };

  const ssml = `<speak version="1.0" xml:lang="pt-BR"><voice name="pt-BR-FranciscaNeural"><prosody rate="-5%">${escaparXml(texto)}</prosody></voice></speak>`;
  try {
    const resposta = await fetch(`https://${regiao}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": chave, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3", "User-Agent": "vem-pra-eja" },
      body: ssml,
    });
    if (!resposta.ok) throw new Error(`Azure Speech respondeu ${resposta.status}`);
    return { status: 200, headers: { ...cors, "Content-Type": "audio/mpeg", "Cache-Control": "no-store" }, body: await resposta.arrayBuffer() };
  } catch (erro) {
    context.error(erro);
    return { status: 502, headers: cors, jsonBody: { erro: "Não foi possível gerar o áudio." } };
  }
}

app.http("voz", { methods: ["POST", "OPTIONS"], authLevel: "anonymous", handler: voz });

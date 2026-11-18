import { createClient } from "npm:@supabase/supabase-js@2";

const codificador = new TextEncoder();
const decodificador = new TextDecoder();

async function comPrazo<T>(operacao: Promise<T>, milissegundos = 12_000) {
  let temporizador = 0;
  try {
    return await Promise.race([
      operacao,
      new Promise<T>((_, rejeitar) => { temporizador = setTimeout(() => rejeitar(new Error("O servidor IMAP excedeu o tempo de resposta.")), milissegundos); }),
    ]);
  } finally {
    clearTimeout(temporizador);
  }
}

class ClienteImap {
  private buffer = new Uint8Array(0);
  private sequencia = 0;

  constructor(
    private readonly conexao: Deno.Conn,
    private readonly prazoFinal: number,
  ) {}

  private tempoRestante(limite = 8_000) {
    const restante = this.prazoFinal - Date.now();
    if (restante <= 0) throw new Error("A verificação IMAP atingiu o tempo máximo desta execução.");
    return Math.min(limite, restante);
  }

  private async completar() {
    const bloco = new Uint8Array(8192);
    const quantidade = await comPrazo(this.conexao.read(bloco), this.tempoRestante());
    if (quantidade === null) throw new Error("O servidor IMAP encerrou a conexão.");
    const novo = new Uint8Array(this.buffer.length + quantidade);
    novo.set(this.buffer);
    novo.set(bloco.subarray(0, quantidade), this.buffer.length);
    this.buffer = novo;
  }

  async linha() {
    while (true) {
      for (let indice = 0; indice < this.buffer.length - 1; indice++) {
        if (this.buffer[indice] === 13 && this.buffer[indice + 1] === 10) {
          const linha = decodificador.decode(this.buffer.subarray(0, indice));
          this.buffer = this.buffer.subarray(indice + 2);
          return linha;
        }
      }
      await this.completar();
    }
  }

  async bytes(quantidade: number) {
    while (this.buffer.length < quantidade) await this.completar();
    const resultado = this.buffer.slice(0, quantidade);
    this.buffer = this.buffer.subarray(quantidade);
    return resultado;
  }

  async escrever(conteudo: string) {
    const bytes = codificador.encode(`${conteudo}\r\n`);
    let enviados = 0;
    while (enviados < bytes.length) {
      enviados += await comPrazo(this.conexao.write(bytes.subarray(enviados)), this.tempoRestante());
    }
  }

  async comando(comando: string) {
    const tag = `a${++this.sequencia}`;
    await this.escrever(`${tag} ${comando}`);
    const linhas: string[] = [];
    while (true) {
      const linha = await this.linha();
      linhas.push(linha);
      if (linha.startsWith(`${tag} `)) {
        if (!linha.startsWith(`${tag} OK`)) throw new Error(`O servidor IMAP recusou ${comando.split(" ")[0]}.`);
        return linhas;
      }
    }
  }

  async buscarMensagem(uid: number) {
    const tag = `a${++this.sequencia}`;
    await this.escrever(`${tag} UID FETCH ${uid} (BODY.PEEK[])`);
    let mensagem = "";
    while (true) {
      const linha = await this.linha();
      const literal = linha.match(/\{(\d+)\}$/);
      if (literal) mensagem += decodificador.decode(await this.bytes(Number(literal[1])));
      if (linha.startsWith(`${tag} `)) {
        if (!linha.startsWith(`${tag} OK`)) throw new Error("O servidor IMAP recusou a leitura da devolução.");
        return mensagem;
      }
    }
  }
}

function aspasImap(valor: string) {
  return `"${valor.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function dadosDaDevolucao(mensagem: string) {
  const destinatario = mensagem.match(/^Final-Recipient:\s*rfc822;\s*([^\s]+)$/im)?.[1]
    ?? mensagem.match(/^Original-Recipient:\s*rfc822;\s*([^\s]+)$/im)?.[1]
    ?? mensagem.match(/<([^<>\s]+@[^<>\s]+)>:\s*Host or domain/im)?.[1]
    ?? "";
  const ids = [...mensagem.matchAll(/^Message-ID:\s*<([^>]+)>/gim)].map((resultado) => resultado[1]);
  const diagnostico = mensagem.match(/^Diagnostic-Code:\s*(.+)$/im)?.[1]
    ?? mensagem.match(/^.*Host or domain name not found.*$/im)?.[0]
    ?? mensagem.match(/^Status:\s*(.+)$/im)?.[1]
    ?? "O servidor de destino devolveu a mensagem.";
  return { destinatario: destinatario.toLowerCase(), messageId: ids.at(-1) ?? "", diagnostico: diagnostico.trim().slice(0, 400) };
}

async function localizarNotificacao(admin: ReturnType<typeof createClient>, messageId: string, destinatario: string) {
  if (messageId) {
    const { data } = await admin.from("notificacoes_email").select("id").eq("message_id", messageId).maybeSingle();
    if (data) return data.id as number;
  }
  if (destinatario) {
    const { data: direta } = await admin.from("notificacoes_email").select("id").eq("destinatario_email", destinatario).order("atualizado_em", { ascending: false }).limit(1).maybeSingle();
    if (direta) return direta.id as number;

    const { data: escolas } = await admin.from("escolas").select("id").eq("email_contato", destinatario);
    const escolasIds = (escolas ?? []).map((escola) => escola.id);
    if (escolasIds.length) {
      const { data: inscricoes } = await admin.from("inscricoes").select("id").in("escola_id", escolasIds);
      const inscricoesIds = (inscricoes ?? []).map((inscricao) => inscricao.id);
      if (inscricoesIds.length) {
        const { data } = await admin.from("notificacoes_email").select("id").in("inscricao_id", inscricoesIds).order("atualizado_em", { ascending: false }).limit(1).maybeSingle();
        if (data) return data.id as number;
      }
    }
  }
  return null;
}

async function processarFilaDeEnvio(
  admin: ReturnType<typeof createClient>,
  url: string,
  serviceRoleKey: string,
) {
  const { data: pendentes, error: erroPendentes } = await admin
    .from("notificacoes_email")
    .select("inscricao_id")
    .eq("status", "na_fila")
    .order("criado_em", { ascending: true })
    .limit(5);
  if (erroPendentes) throw erroPendentes;

  let enviados = 0;
  let falhas = 0;
  for (const item of pendentes ?? []) {
    const { data: inscricao, error: erroInscricao } = await admin
      .from("inscricoes")
      .select("*")
      .eq("id", item.inscricao_id)
      .single();
    if (erroInscricao || !inscricao) {
      falhas++;
      continue;
    }

    const envio = await fetch(`${url}/functions/v1/notificar-inscricao`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "RECOVERY", table: "inscricoes", record: inscricao }),
      signal: AbortSignal.timeout(30_000),
    }).catch(() => null);
    if (envio?.ok) enviados++;
    else falhas++;
  }
  return { pendentes: pendentes?.length ?? 0, enviados, falhas };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(JSON.stringify({ erro: "Método não permitido." }), { status: 405, headers: { "Content-Type": "application/json" } });
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const segredoDoVerificador = Deno.env.get("BOUNCE_CHECK_SECRET") ?? "";
  const autorizacaoInterna = serviceRoleKey.length > 0
    && (request.headers.get("Authorization") ?? "") === `Bearer ${serviceRoleKey}`;
  const autorizacaoDoAgendador = segredoDoVerificador.length >= 32
    && (request.headers.get("X-Bounce-Check-Secret") ?? "") === segredoDoVerificador;
  if (!autorizacaoInterna && !autorizacaoDoAgendador) {
    return new Response(JSON.stringify({ erro: "Acesso não autorizado." }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  let conexao: Deno.Conn | undefined;
  try {
    // Mantém a execução abaixo do limite do Edge Runtime. Se houver muitas
    // devoluções, as restantes são processadas na próxima rodada do agendador.
    const prazoFinal = Date.now() + 22_000;
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
    const fila = await processarFilaDeEnvio(admin, url, serviceRoleKey);
    const { data: reservada, error: erroDaReserva } = await admin.rpc("reservar_verificacao_retornos_email");
    if (erroDaReserva) throw erroDaReserva;
    if (!reservada) return new Response(JSON.stringify({ ignorado: true, fila }), { headers: { "Content-Type": "application/json" } });

    const host = Deno.env.get("IMAP_HOST")?.trim() || Deno.env.get("SMTP_HOST")?.trim() || "mail.bc.sc.gov.br";
    const porta = Number(Deno.env.get("IMAP_PORT") || "993");
    const usuario = Deno.env.get("IMAP_USER")?.trim() || Deno.env.get("SMTP_USER")?.trim();
    const senha = Deno.env.get("IMAP_PASSWORD") || Deno.env.get("SMTP_PASSWORD");
    const pasta = Deno.env.get("IMAP_MAILBOX")?.trim() || "Shared/vempraeja@bc.sc.gov.br/INBOX";
    if (!usuario || !senha) throw new Error("Credenciais IMAP não configuradas.");

    conexao = await comPrazo(Deno.connectTls({ hostname: host, port: porta }), 8_000);
    const imap = new ClienteImap(conexao, prazoFinal);
    const saudacao = await imap.linha();
    if (!saudacao.startsWith("* OK")) throw new Error("O servidor IMAP não apresentou uma saudação válida.");
    await imap.comando(`LOGIN ${aspasImap(usuario)} ${aspasImap(senha)}`);
    await imap.comando(`EXAMINE ${aspasImap(pasta)}`);
    const busca = await imap.comando('UID SEARCH HEADER FROM "MAILER-DAEMON"');
    const linhaBusca = busca.find((linha) => linha.startsWith("* SEARCH")) ?? "";
    const uids = [...linhaBusca.matchAll(/\d+/g)].map((resultado) => Number(resultado[0])).slice(-50);

    const { data: processados } = uids.length
      ? await admin.from("retornos_email_processados").select("uid").eq("pasta", pasta).in("uid", uids)
      : { data: [] as Array<{ uid: number }> };
    const conhecidos = new Set((processados ?? []).map((item) => Number(item.uid)));
    let devolvidos = 0;

    const pendentes = uids.filter((item) => !conhecidos.has(item)).slice(0, 10);
    for (const uid of pendentes) {
      if (prazoFinal - Date.now() < 3_000) break;
      const mensagem = await imap.buscarMensagem(uid);
      const dados = dadosDaDevolucao(mensagem);
      const notificacaoId = await localizarNotificacao(admin, dados.messageId, dados.destinatario);
      if (notificacaoId !== null) {
        const { error } = await admin.from("notificacoes_email").update({
          status: "falha",
          erro: `E-mail devolvido pelo servidor: ${dados.diagnostico}`,
          atualizado_em: new Date().toISOString(),
        }).eq("id", notificacaoId);
        if (error) throw error;
        devolvidos++;
      }
      await admin.from("retornos_email_processados").upsert({ pasta, uid }, { onConflict: "pasta,uid" });
    }
    if (prazoFinal - Date.now() >= 2_000) await imap.comando("LOGOUT");
    return new Response(JSON.stringify({ verificados: uids.length, devolvidos, fila }), { headers: { "Content-Type": "application/json" } });
  } catch (erro) {
    console.error(erro);
    return new Response(JSON.stringify({ erro: "Não foi possível verificar as devoluções de e-mail." }), { status: 500, headers: { "Content-Type": "application/json" } });
  } finally {
    try { conexao?.close(); } catch { /* conexão já encerrada */ }
  }
});

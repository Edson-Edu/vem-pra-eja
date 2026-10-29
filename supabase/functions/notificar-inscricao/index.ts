import { LOGO_EMAIL_BASE64 } from "./logo-email.ts";

type Inscricao = {
  id: string;
  escola_id: string;
  nivel_selecionado: string;
  turno_selecionado: string | null;
  nome_completo: string;
  cpf: string;
  idade: number | null;
  ddd: string;
  telefone: string;
  email_aluno: string | null;
  cep: string | null;
  rua: string | null;
  bairro: string | null;
  cidade: string | null;
  numero_endereco: string | null;
  created_at: string;
};

type WebhookPayload = {
  type?: string;
  table?: string;
  record?: Inscricao;
};

type Escola = {
  nome: string;
  email_contato: string;
};

const respostaJson = (corpo: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

type ConteudoEmail = {
  destinatarioEmail: string;
  destinatarioNome: string;
  assunto: string;
  texto: string;
  html: string;
  logoBase64: string;
  messageId: string;
};

const LOGO_EMAIL_CID = "vem-pra-eja-logo";
const LOGO_EMAIL_ARQUIVO = "vem-pra-eja-logo-email.png";

function variavelObrigatoria(nome: string) {
  const valor = Deno.env.get(nome)?.trim();
  if (!valor) throw new Error(`O segredo ${nome} não foi configurado.`);
  return valor;
}

async function enviarPeloMailpit(email: ConteudoEmail) {
  const mailpitUrl = Deno.env.get("MAILPIT_API_URL") ?? "http://inbucket:8025";
  const resposta = await fetch(`${mailpitUrl}/api/v1/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      From: { Email: "nao-responda@vem-pra-eja.local", Name: "Vem Pra EJA - Local" },
      To: [{ Email: email.destinatarioEmail, Name: email.destinatarioNome }],
      Subject: email.assunto,
      Text: email.texto,
      HTML: email.html,
      Attachments: [{
        Content: email.logoBase64,
        ContentID: LOGO_EMAIL_CID,
        ContentType: "image/png",
        Filename: LOGO_EMAIL_ARQUIVO,
      }],
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    throw new Error(`Mailpit recusou a mensagem (${resposta.status}): ${detalhe.slice(0, 200)}`);
  }
}

const codificador = new TextEncoder();
const decodificador = new TextDecoder();

function base64Bytes(bytes: Uint8Array) {
  const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let resultado = "";
  for (let indice = 0; indice < bytes.length; indice += 3) {
    const a = bytes[indice];
    const b = bytes[indice + 1] ?? 0;
    const c = bytes[indice + 2] ?? 0;
    const bloco = (a << 16) | (b << 8) | c;
    resultado += alfabeto[(bloco >> 18) & 63];
    resultado += alfabeto[(bloco >> 12) & 63];
    resultado += indice + 1 < bytes.length ? alfabeto[(bloco >> 6) & 63] : "=";
    resultado += indice + 2 < bytes.length ? alfabeto[bloco & 63] : "=";
  }
  return resultado;
}

function base64Utf8(valor: string) {
  return base64Bytes(codificador.encode(valor));
}

function quebrarBase64(valor: string) {
  return valor.match(/.{1,76}/g)?.join("\r\n") ?? valor;
}

function cabecalhoMime(valor: string) {
  const seguro = valor.replace(/[\r\n]+/g, " ").trim();
  return /^[\x20-\x7E]*$/.test(seguro) ? seguro : `=?UTF-8?B?${base64Utf8(seguro)}?=`;
}

function enderecoEmail(valor: string) {
  const seguro = valor.trim().toLowerCase();
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(seguro)) {
    throw new Error("Endereço de e-mail inválido para envio SMTP.");
  }
  return seguro;
}

class LeitorSmtp {
  private restante = "";
  private readonly linhas: string[] = [];

  constructor(private readonly conexao: Deno.Conn) {}

  async resposta(codigosEsperados: number[]) {
    const buffer = new Uint8Array(4096);
    while (true) {
      const quebra = this.restante.indexOf("\r\n");
      if (quebra >= 0) {
        const linha = this.restante.slice(0, quebra);
        this.restante = this.restante.slice(quebra + 2);
        this.linhas.push(linha);
        const correspondencia = linha.match(/^(\d{3})([ -])/);
        if (correspondencia?.[2] === " ") {
          const codigo = Number(correspondencia[1]);
          const resposta = this.linhas.splice(0).join("\n");
          if (!codigosEsperados.includes(codigo)) {
            throw new Error(`Servidor SMTP respondeu ${codigo}: ${resposta.slice(0, 300)}`);
          }
          return resposta;
        }
        continue;
      }

      const quantidade = await this.conexao.read(buffer);
      if (quantidade === null) throw new Error("O servidor SMTP encerrou a conexão.");
      this.restante += decodificador.decode(buffer.subarray(0, quantidade), { stream: true });
    }
  }
}

async function escrever(conexao: Deno.Conn, conteudo: string) {
  const bytes = codificador.encode(conteudo);
  let gravados = 0;
  while (gravados < bytes.length) {
    gravados += await conexao.write(bytes.subarray(gravados));
  }
}

async function comandoSmtp(
  conexao: Deno.Conn,
  leitor: LeitorSmtp,
  comando: string,
  codigosEsperados: number[],
) {
  await escrever(conexao, `${comando}\r\n`);
  return leitor.resposta(codigosEsperados);
}

function mensagemMime(email: ConteudoEmail, remetente: string, nomeRemetente: string) {
  const limiteAlternativo = `eja-alternativo-${crypto.randomUUID()}`;
  const limiteRelacionado = `eja-relacionado-${crypto.randomUUID()}`;
  const texto = email.texto.replace(/\r?\n/g, "\r\n");
  const html = email.html.replace(/\r?\n/g, "\r\n");
  return [
    `From: ${cabecalhoMime(nomeRemetente)} <${remetente}>`,
    `To: ${cabecalhoMime(email.destinatarioNome)} <${email.destinatarioEmail}>`,
    `Reply-To: ${remetente}`,
    `Subject: ${cabecalhoMime(email.assunto)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${email.messageId}>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${limiteAlternativo}"`,
    "",
    `--${limiteAlternativo}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    texto,
    `--${limiteAlternativo}`,
    `Content-Type: multipart/related; boundary="${limiteRelacionado}"`,
    "",
    `--${limiteRelacionado}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    `--${limiteRelacionado}`,
    `Content-Type: image/png; name="${LOGO_EMAIL_ARQUIVO}"`,
    "Content-Transfer-Encoding: base64",
    `Content-ID: <${LOGO_EMAIL_CID}>`,
    `Content-Disposition: inline; filename="${LOGO_EMAIL_ARQUIVO}"`,
    "",
    quebrarBase64(email.logoBase64),
    `--${limiteRelacionado}--`,
    `--${limiteAlternativo}--`,
    "",
  ].join("\r\n").replace(/^\./gm, "..");
}

async function enviarPeloSmtpInstitucional(email: ConteudoEmail) {
  const host = Deno.env.get("SMTP_HOST")?.trim() || "mail.bc.sc.gov.br";
  const porta = Number(Deno.env.get("SMTP_PORT") || "587");
  const usuario = enderecoEmail(Deno.env.get("SMTP_USER")?.trim() || "vempraeja@bc.sc.gov.br");
  const remetente = enderecoEmail(Deno.env.get("SMTP_FROM")?.trim() || usuario);
  const destinatario = enderecoEmail(email.destinatarioEmail);
  if (remetente.toLowerCase() !== "vempraeja@bc.sc.gov.br") {
    throw new Error("SMTP_FROM deve ser vempraeja@bc.sc.gov.br.");
  }

  const senha = variavelObrigatoria("SMTP_PASSWORD");
  let conexao: Deno.Conn | undefined;
  try {
    const tcp = await Deno.connect({ hostname: host, port: porta });
    conexao = tcp;
    let leitor = new LeitorSmtp(tcp);
    await leitor.resposta([220]);
    const recursos = await comandoSmtp(tcp, leitor, "EHLO vempraeja.web.app", [250]);
    if (!recursos.includes("STARTTLS")) throw new Error("O servidor SMTP não ofereceu STARTTLS.");
    await comandoSmtp(tcp, leitor, "STARTTLS", [220]);

    const tls = await Deno.startTls(tcp, { hostname: host });
    conexao = tls;
    leitor = new LeitorSmtp(tls);
    await comandoSmtp(tls, leitor, "EHLO vempraeja.web.app", [250]);
    await comandoSmtp(tls, leitor, "AUTH LOGIN", [334]);
    await comandoSmtp(tls, leitor, base64Utf8(usuario), [334]);
    await comandoSmtp(tls, leitor, base64Utf8(senha), [235]);
    await comandoSmtp(tls, leitor, `MAIL FROM:<${remetente}>`, [250]);
    await comandoSmtp(tls, leitor, `RCPT TO:<${destinatario}>`, [250, 251]);
    await comandoSmtp(tls, leitor, "DATA", [354]);
    const mime = mensagemMime(
      { ...email, destinatarioEmail: destinatario },
      remetente,
      Deno.env.get("SMTP_FROM_NAME")?.trim() || "Vem Pra EJA",
    );
    await escrever(tls, `${mime}\r\n.\r\n`);
    await leitor.resposta([250]);
    await comandoSmtp(tls, leitor, "QUIT", [221]);
  } finally {
    try {
      conexao?.close();
    } catch {
      // A conexão pode já ter sido encerrada pelo servidor.
    }
  }
}

async function enviarEmail(email: ConteudoEmail) {
  const transporte = (Deno.env.get("EMAIL_TRANSPORT") ?? "mailpit").trim().toLowerCase();
  if (transporte === "mailpit") return enviarPeloMailpit(email);
  if (transporte === "smtp") return enviarPeloSmtpInstitucional(email);
  throw new Error("EMAIL_TRANSPORT deve ser mailpit ou smtp.");
}

function escaparHtml(valor: unknown) {
  return String(valor ?? "Não informado")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function somenteNumeros(valor: string | null | undefined) {
  return (valor ?? "").replace(/\D/g, "");
}

function formatarCpf(valor: string) {
  const numeros = somenteNumeros(valor);
  return numeros.length === 11
    ? numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    : valor;
}

function formatarTelefone(ddd: string, telefone: string) {
  const numero = somenteNumeros(telefone);
  const parte = numero.length === 9
    ? numero.replace(/(\d{5})(\d{4})/, "$1-$2")
    : numero.replace(/(\d{4})(\d{4})/, "$1-$2");
  return `(${somenteNumeros(ddd)}) ${parte}`;
}

function formatarCep(valor: string | null) {
  const numeros = somenteNumeros(valor);
  return numeros.length === 8 ? numeros.replace(/(\d{5})(\d{3})/, "$1-$2") : valor;
}

function formatarEndereco(inscricao: Inscricao) {
  const linha = [inscricao.rua, inscricao.numero_endereco].filter(Boolean).join(", ");
  const local = [inscricao.bairro, inscricao.cidade].filter(Boolean).join(" - ");
  const cep = inscricao.cep ? `CEP ${formatarCep(inscricao.cep)}` : "";
  return [linha, local, cep].filter(Boolean).join(" | ") || "Não informado";
}

function linkGoogleMaps(inscricao: Inscricao) {
  const partes = [
    inscricao.rua,
    inscricao.numero_endereco,
    inscricao.bairro,
    inscricao.cidade,
    inscricao.cidade ? "SC" : null,
    formatarCep(inscricao.cep),
  ].filter((parte): parte is string => Boolean(parte?.trim()));
  if (!partes.length) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partes.join(", "))}`;
}

function linhaHtml(rotulo: string, valor: unknown) {
  return `<tr>
    <th style="width:38%;padding:12px 0;text-align:left;border-bottom:1px solid #d6e2f3;color:#5b6b82;font-size:13px;font-weight:600;vertical-align:top">${escaparHtml(rotulo)}</th>
    <td style="padding:12px 0;border-bottom:1px solid #d6e2f3;color:#1a2433;font-size:14px;font-weight:700;vertical-align:top">${escaparHtml(valor)}</td>
  </tr>`;
}

function linhaEnderecoHtml(endereco: string, linkMapa: string | null) {
  if (!linkMapa) return linhaHtml("Endereço", endereco);
  return `<tr>
    <th style="width:38%;padding:12px 0;text-align:left;border-bottom:1px solid #d6e2f3;color:#5b6b82;font-size:13px;font-weight:600;vertical-align:top">Endereço</th>
    <td style="padding:12px 0;border-bottom:1px solid #d6e2f3;font-size:14px;font-weight:700;vertical-align:top">
      <a href="${escaparHtml(linkMapa)}" target="_blank" style="color:#1e5bb8;text-decoration:underline;text-underline-offset:2px">${escaparHtml(endereco)}</a>
      <div style="margin-top:5px;color:#5b6b82;font-size:11px;font-weight:600">Abrir no Google Maps ↗</div>
    </td>
  </tr>`;
}

async function registrarSituacaoEmail(
  supabaseUrl: string,
  serviceRoleKey: string,
  inscricaoId: string,
  status: "na_fila" | "enviado" | "falha",
  erro: string | null = null,
  destinatarioEmail = "",
  destinatarioNome = "",
  messageId = "",
) {
  const agora = new Date().toISOString();
  const registro: Record<string, unknown> = {
    inscricao_id: inscricaoId,
    status,
    tentativas: 1,
    erro: erro?.slice(0, 500) ?? null,
    atualizado_em: agora,
    enviado_em: status === "enviado" ? agora : null,
  };
  if (destinatarioEmail) registro.destinatario_email = destinatarioEmail;
  if (destinatarioNome) registro.destinatario_nome = destinatarioNome;
  if (messageId) registro.message_id = messageId;
  const resposta = await fetch(`${supabaseUrl}/rest/v1/notificacoes_email?on_conflict=inscricao_id`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(registro),
  });
  if (!resposta.ok) throw new Error(`Falha ao registrar a situação do e-mail (${resposta.status}).`);
}

Deno.serve(async (requisicao) => {
  if (requisicao.method !== "POST") {
    return respostaJson({ erro: "Método não permitido." }, 405);
  }

  let inscricaoId = "";
  let supabaseUrl = "";
  let serviceRoleKey = "";
  let emailFoiEnviado = false;
  let destinatarioEmail = "";
  let destinatarioNome = "";
  let messageId = "";
  try {
    const payload = await requisicao.json() as WebhookPayload;
    const inscricaoRecebida = payload.record;

    if (payload.table !== "inscricoes" || !inscricaoRecebida?.id || !inscricaoRecebida.escola_id) {
      return respostaJson({ erro: "Payload de inscrição inválido." }, 400);
    }
    inscricaoId = inscricaoRecebida.id;

    supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Configuração interna do Supabase não encontrada.");
    }

    const [respostaInscricao, respostaNotificacao] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/inscricoes?id=eq.${encodeURIComponent(inscricaoId)}&select=*&limit=1`,
        {
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        },
      ),
      fetch(
        `${supabaseUrl}/rest/v1/notificacoes_email?inscricao_id=eq.${encodeURIComponent(inscricaoId)}&select=status&limit=1`,
        {
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        },
      ),
    ]);
    if (!respostaInscricao.ok || !respostaNotificacao.ok) {
      throw new Error("Falha na validacao interna da inscricao.");
    }
    const inscricoes = await respostaInscricao.json() as Inscricao[];
    const notificacoes = await respostaNotificacao.json() as Array<{ status: string }>;
    const inscricao = inscricoes[0];
    if (!inscricao || notificacoes[0]?.status !== "na_fila") {
      return respostaJson({ erro: "A inscricao nao possui um envio pendente." }, 409);
    }

    const respostaEscola = await fetch(
      `${supabaseUrl}/rest/v1/escolas?id=eq.${encodeURIComponent(inscricao.escola_id)}&select=nome,email_contato&limit=1`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      },
    );

    if (!respostaEscola.ok) {
      throw new Error(`Falha ao consultar a escola (${respostaEscola.status}).`);
    }

    const escolas = await respostaEscola.json() as Escola[];
    const escola = escolas[0];
    if (!escola?.email_contato) {
      throw new Error("A escola não possui e-mail de contato cadastrado.");
    }
    destinatarioEmail = escola.email_contato;
    destinatarioNome = escola.nome;
    messageId = `${crypto.randomUUID()}@bc.sc.gov.br`;
    await registrarSituacaoEmail(supabaseUrl, serviceRoleKey, inscricao.id, "na_fila", null, destinatarioEmail, destinatarioNome, messageId);

    const criadoEm = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(inscricao.created_at));
    const telefone = formatarTelefone(inscricao.ddd, inscricao.telefone);
    const endereco = formatarEndereco(inscricao);
    const linkMapa = linkGoogleMaps(inscricao);
    const enderecoTexto = linkMapa
      ? [`Endereço: ${endereco}`, `Google Maps: ${linkMapa}`]
      : [`Endereço: ${endereco}`];
    const emailAluno = inscricao.email_aluno ?? "Não informado";
    const turno = inscricao.turno_selecionado ?? "Não informado";
    const assunto = `Nova pré-inscrição | ${inscricao.nome_completo} | ${inscricao.nivel_selecionado}`;
    const texto = [
      "VEM PRA EJA — NOVA PRÉ-INSCRIÇÃO!",
      "",
      `Escola escolhida: ${escola.nome}`,
      "",
      'Olá, a plataforma "VemPraEJA" recebeu um novo cadastro. Entre em contato com a pessoa interessada para orientar os próximos passos da matrícula.',
      "",
      "DADOS DO ESTUDANTE",
      `Aluno(a): ${inscricao.nome_completo}`,
      `CPF: ${formatarCpf(inscricao.cpf)}`,
      `Idade: ${inscricao.idade ?? "Não informada"}`,
      "",
      "INTERESSE",
      `Nível: ${inscricao.nivel_selecionado}`,
      `Turno: ${turno}`,
      "",
      "CONTATO",
      `Telefone: ${telefone}`,
      `E-mail: ${emailAluno}`,
      ...enderecoTexto,
      "",
      `Pré-inscrição recebida em ${criadoEm}.`,
      "Mensagem automática do Vem Pra EJA.",
    ].join("\n");
    const logoBase64 = LOGO_EMAIL_BASE64;
    const html = `
      <div style="margin:0;padding:32px 12px;background:#f4f8fd;font-family:Arial,Helvetica,sans-serif;color:#1a2433">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;border:1px solid #d6e2f3;border-radius:18px;background:#ffffff;border-collapse:separate;overflow:hidden;box-shadow:0 8px 28px rgba(15,47,99,.10)">
          <tr>
            <td align="center" style="padding:24px 32px 20px;background:#ffffff;border-bottom:1px solid #d6e2f3">
              <img src="cid:${LOGO_EMAIL_CID}" width="230" alt="Vem pra EJA" style="display:block;width:230px;max-width:100%;height:auto;border:0">
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px;background:#1e5bb8;color:#ffffff">
              <h1 style="margin:0;font-size:28px;line-height:1.15;color:#ffffff">Nova pré-inscrição!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 32px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;border-left:5px solid #ffb400;border-radius:10px;background:#fff1c2">
                <tr><td style="padding:16px 18px">
                  <div style="margin-bottom:5px;color:#6b4500;font-size:11px;font-weight:800;letter-spacing:1px">ESCOLA ESCOLHIDA</div>
                  <div style="color:#0f2f63;font-size:19px;font-weight:800;line-height:1.35">${escaparHtml(escola.nome)}</div>
                </td></tr>
              </table>

              <p style="margin:0 0 26px;color:#1a2433;font-size:15px;line-height:1.65">Olá, a plataforma &quot;VemPraEJA&quot; recebeu um novo cadastro. Entre em contato com a pessoa interessada para orientar os próximos passos da matrícula.</p>

              <h2 style="margin:0 0 4px;color:#0f2f63;font-size:16px">Dados do estudante</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:26px;border-collapse:collapse">
                ${linhaHtml("Nome completo", inscricao.nome_completo)}
                ${linhaHtml("CPF", formatarCpf(inscricao.cpf))}
                ${linhaHtml("Idade", inscricao.idade ?? "Não informada")}
              </table>

              <h2 style="margin:0 0 10px;color:#0f2f63;font-size:16px">Interesse</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:26px;border-collapse:separate;border-spacing:0">
                <tr>
                  <td width="49%" style="padding:14px 16px;border-radius:10px;background:#e6effb;vertical-align:top">
                    <div style="margin-bottom:5px;color:#1e5bb8;font-size:11px;font-weight:800;letter-spacing:.7px">NÍVEL</div>
                    <div style="color:#0f2f63;font-size:16px;font-weight:800">${escaparHtml(inscricao.nivel_selecionado)}</div>
                  </td>
                  <td width="2%"></td>
                  <td width="49%" style="padding:14px 16px;border-radius:10px;background:#e6effb;vertical-align:top">
                    <div style="margin-bottom:5px;color:#1e5bb8;font-size:11px;font-weight:800;letter-spacing:.7px">TURNO</div>
                    <div style="color:#0f2f63;font-size:16px;font-weight:800">${escaparHtml(turno)}</div>
                  </td>
                </tr>
              </table>

              <h2 style="margin:0 0 4px;color:#0f2f63;font-size:16px">Contato</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;border-collapse:collapse">
                ${linhaHtml("Telefone / WhatsApp", telefone)}
                ${linhaHtml("E-mail", emailAluno)}
                ${linhaEnderecoHtml(endereco, linkMapa)}
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:10px;background:#f4f8fd">
                <tr><td style="padding:13px 16px;color:#5b6b82;font-size:12px;line-height:1.5">
                  Pré-inscrição recebida em <strong style="color:#0f2f63">${escaparHtml(criadoEm)}</strong>.<br>
                  Mensagem automática do Vem Pra EJA.
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </div>`;

    await enviarEmail({
      destinatarioEmail: escola.email_contato,
      destinatarioNome: escola.nome,
      assunto,
      texto,
      html,
      logoBase64,
      messageId,
    });
    emailFoiEnviado = true;

    await registrarSituacaoEmail(supabaseUrl, serviceRoleKey, inscricao.id, "enviado", null, destinatarioEmail, destinatarioNome, messageId);

    return respostaJson({ enviado: true });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    if (inscricaoId && supabaseUrl && serviceRoleKey) {
      try {
        await registrarSituacaoEmail(
          supabaseUrl,
          serviceRoleKey,
          inscricaoId,
          emailFoiEnviado ? "enviado" : "falha",
          emailFoiEnviado ? null : mensagem,
          destinatarioEmail,
          destinatarioNome,
          messageId,
        );
      } catch (erroDeRegistro) {
        console.error("Falha ao registrar o erro do e-mail:", erroDeRegistro instanceof Error ? erroDeRegistro.message : erroDeRegistro);
      }
    }
    console.error("Falha ao notificar a escola:", mensagem);
    return respostaJson({ erro: "Não foi possível enviar o e-mail da inscrição." }, 500);
  }
});

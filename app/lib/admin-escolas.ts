import { obterTokenAdministrador } from "./admin-auth";
import type { Beneficio, EscolaFormulario, Nivel, TurnoFormulario } from "../admin/PainelAdministrativo";

type Linha = Record<string, unknown>;
export type InscricaoAdministrativa = {
  id: string;
  criadaEm: string;
  nome: string;
  bairro: string;
  cidade: string;
  escolaId: string;
  escola: string;
  nivel: string;
  turno: string;
  email: string;
};

function configuracao() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = obterTokenAdministrador();
  if (!url || !chave || !token) throw new Error("Sua sessão administrativa expirou. Entre novamente.");
  return { url: url.replace(/\/$/, ""), chave, token };
}

async function requisicao(caminho: string, opcoes: RequestInit = {}) {
  const { url, chave, token } = configuracao();
  const resposta = await fetch(`${url}/rest/v1/${caminho}`, {
    ...opcoes,
    headers: { apikey: chave, Authorization: `Bearer ${token}`, ...opcoes.headers },
  });
  const corpo = await resposta.text();
  if (!resposta.ok) throw new Error(corpo || "Não foi possível concluir a operação.");
  if (!corpo.trim()) return null;
  try {
    return JSON.parse(corpo) as unknown;
  } catch {
    throw new Error("O servidor respondeu em um formato inesperado.");
  }
}

function valorTexto(valor: unknown) { return typeof valor === "string" ? valor : ""; }
function lista(valor: unknown) { return Array.isArray(valor) ? valor : []; }
function idUuid(valor: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor); }
function separarHorario(horario: string) { const partes = horario.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/); return partes ? { inicio: partes[1], fim: partes[2] } : { inicio: "", fim: "" }; }
function diaPorTexto(texto: string, final: boolean): TurnoFormulario["diaInicio"] {
  const normalizado = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const dias: Array<[TurnoFormulario["diaInicio"], string]> = [["Segunda", "seg"], ["Terça", "ter"], ["Quarta", "qua"], ["Quinta", "qui"], ["Sexta", "sex"], ["Sábado", "sab"], ["Domingo", "dom"]];
  const encontrados = dias.filter(([, termo]) => normalizado.includes(termo)).map(([dia]) => dia);
  return encontrados[final ? encontrados.length - 1 : 0] ?? "";
}
function abreviarDias(inicio: TurnoFormulario["diaInicio"], fim: TurnoFormulario["diaFim"]) {
  const abreviacoes = { Segunda: "Seg", Terça: "Ter", Quarta: "Qua", Quinta: "Qui", Sexta: "Sex", Sábado: "Sáb", Domingo: "Dom" };
  return inicio && fim ? `${abreviacoes[inicio]} - ${abreviacoes[fim]}` : "";
}
function niveis(valor: unknown): Nivel[] { return lista(valor).filter((item): item is Nivel => item === "Ensino Fundamental" || item === "Ensino Médio"); }
function separarEndereco(endereco: string) {
  const partes = endereco.split(",").map((parte) => parte.trim()).filter(Boolean);
  if (partes.length < 2) return { rua: endereco, numero: "", complemento: "" };
  return { rua: partes[0], numero: partes[1], complemento: partes.slice(2).join(", ") };
}

function mapearEscola(linha: Linha, catalogo: Beneficio[]): EscolaFormulario {
  const nomeCompleto = valorTexto(linha.nome);
  const siglaDoBanco = valorTexto(linha.sigla);
  const sigla = siglaDoBanco || ["EBM", "CEJA", "EEB", "CEM", "IFC"].find((item) => nomeCompleto.replace(/\./g, "").toUpperCase().startsWith(item)) || "";
  const siglaComPontosOpcionais = sigla.split("").join("\\.?");
  const nome = sigla ? nomeCompleto.replace(new RegExp(`^${siglaComPontosOpcionais}\\.?\\s*`, "i"), "").replace(/^[–-]\s*/, "").trim() || nomeCompleto : nomeCompleto;
  const idsPorNome = new Map(catalogo.map((beneficio) => [beneficio.nome, beneficio.id]));
  const turnos = lista(linha.turnos_escola).filter((item): item is Linha => typeof item === "object" && item !== null).map((turno) => {
    const horario = separarHorario(valorTexto(turno.horario));
    const detalhes = lista(turno.turnos_beneficios).filter((item): item is Linha => typeof item === "object" && item !== null);
    const beneficiosDetalhados = detalhes.map((detalhe) => {
      const registro = detalhe.beneficios_catalogo as Linha | null;
      return { beneficioId: valorTexto(detalhe.beneficio_id), descricaoLocal: valorTexto(detalhe.descricao_local) || valorTexto(registro?.descricao_padrao) };
    }).filter((beneficio) => beneficio.beneficioId);
    const beneficios = beneficiosDetalhados.length ? beneficiosDetalhados : valorTexto(turno.auxilios).split(",").map((item) => item.trim()).filter(Boolean).map((nomeAuxilio) => ({ beneficioId: idsPorNome.get(nomeAuxilio) ?? `legado-${nomeAuxilio}`, descricaoLocal: nomeAuxilio }));
    const nivel: Nivel = valorTexto(turno.nivel_do_turno) === "Ensino Médio" ? "Ensino Médio" : "Ensino Fundamental";
    const turnoTexto = valorTexto(turno.turno).toLowerCase();
    return { id: valorTexto(turno.id), nivel, turno: turnoTexto.includes("manh") ? "Manhã" as const : turnoTexto.includes("tarde") ? "Tarde" as const : "Noite" as const, ...horario, diaInicio: diaPorTexto(valorTexto(turno.dias_aula), false), diaFim: diaPorTexto(valorTexto(turno.dias_aula), true), comoFunciona: valorTexto(turno.descricao), beneficios };
  });
  const fotos = valorTexto(linha.image_url).split(",").map((foto) => foto.trim()).filter(Boolean);
  const endereco = separarEndereco(valorTexto(linha.endereco));
  return { id: valorTexto(linha.id), sigla, nome, cidade: valorTexto(linha.cidade) === "Balneário Camboriú" ? "Balneário Camboriú" : "Camboriú", bairro: valorTexto(linha.bairro), ...endereco, email: valorTexto(linha.email_contato), latitude: linha.latitude == null ? "" : String(linha.latitude), longitude: linha.longitude == null ? "" : String(linha.longitude), niveis: niveis(linha.niveis_oferecidos), fotos: fotos.length ? fotos : [""], ativa: linha.ativa !== false, turnos };
}

export async function carregarDadosAdministrativos() {
  const [beneficiosBrutos, escolasBrutas] = await Promise.all([
    requisicao("beneficios_catalogo?select=*&order=nome.asc"),
    requisicao("escolas?select=*,turnos_escola(*,turnos_beneficios(*,beneficios_catalogo(*)))&order=nome.asc"),
  ]);
  const catalogo = lista(beneficiosBrutos).filter((item): item is Linha => typeof item === "object" && item !== null).map((linha) => ({ id: valorTexto(linha.id), nome: valorTexto(linha.nome), descricao: valorTexto(linha.descricao_padrao) }));
  const escolas = lista(escolasBrutas).filter((item): item is Linha => typeof item === "object" && item !== null).map((linha) => mapearEscola(linha, catalogo));
  return { catalogo, escolas };
}

export async function carregarInscricoesAdministrativas(): Promise<InscricaoAdministrativa[]> {
  const [inscricoesBrutas, escolasBrutas] = await Promise.all([
    requisicao("inscricoes?select=id,created_at,nome_completo,bairro,cidade,escola_id,nivel_selecionado,turno_selecionado,email_aluno&order=created_at.desc"),
    requisicao("escolas?select=id,nome,sigla"),
  ]);
  const escolasPorId = new Map(lista(escolasBrutas).filter((item): item is Linha => typeof item === "object" && item !== null).map((escola) => {
    const sigla = valorTexto(escola.sigla);
    const nome = valorTexto(escola.nome);
    return [valorTexto(escola.id), sigla && !nome.startsWith(sigla) ? `[${sigla}] ${nome}` : nome] as const;
  }));
  return lista(inscricoesBrutas).filter((item): item is Linha => typeof item === "object" && item !== null).map((inscricao) => ({
    id: valorTexto(inscricao.id),
    criadaEm: valorTexto(inscricao.created_at),
    nome: valorTexto(inscricao.nome_completo),
    bairro: valorTexto(inscricao.bairro),
    cidade: valorTexto(inscricao.cidade),
    escolaId: valorTexto(inscricao.escola_id),
    escola: escolasPorId.get(valorTexto(inscricao.escola_id)) || "Escola não encontrada",
    nivel: valorTexto(inscricao.nivel_selecionado),
    turno: valorTexto(inscricao.turno_selecionado),
    email: valorTexto(inscricao.email_aluno),
  }));
}

function rotuloDoBeneficio(beneficio: BeneficioDoTurno, catalogo: Beneficio[]) {
  return catalogo.find((item) => item.id === beneficio.beneficioId)?.nome ?? beneficio.descricaoLocal;
}

type BeneficioDoTurno = TurnoFormulario["beneficios"][number];

export async function salvarEscolaAdministrativa(formulario: EscolaFormulario, catalogo: Beneficio[]) {
  const nomeCompleto = [formulario.sigla, formulario.nome.trim()].filter(Boolean).join(" ");
  const enderecoCompleto = [formulario.rua.trim(), formulario.numero.trim(), formulario.complemento.trim()].filter(Boolean).join(", ");
  const dadosEscola = { sigla: formulario.sigla || null, nome: nomeCompleto, cidade: formulario.cidade, bairro: formulario.bairro, endereco: enderecoCompleto, email_contato: formulario.email || null, latitude: Number(formulario.latitude), longitude: Number(formulario.longitude), niveis_oferecidos: formulario.niveis, image_url: formulario.fotos.filter((foto) => foto.trim()).join(", ") || null, ativa: formulario.ativa, updated_at: new Date().toISOString() };
  let escolaId = formulario.id;
  if (escolaId) {
    await requisicao(`escolas?id=eq.${encodeURIComponent(escolaId)}`, { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(dadosEscola) });
    await requisicao(`turnos_escola?escola_id=eq.${encodeURIComponent(escolaId)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  } else {
    const criada = await requisicao("escolas", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(dadosEscola) });
    escolaId = valorTexto(lista(criada)[0] && (lista(criada)[0] as Linha).id);
  }
  if (!escolaId) throw new Error("Não foi possível identificar a escola salva.");
  const turnosComId = formulario.turnos.map((turno) => ({ turno, id: idUuid(turno.id) ? turno.id : crypto.randomUUID() }));
  await requisicao("turnos_escola", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(turnosComId.map(({ turno, id }) => ({ id, escola_id: escolaId, turno: turno.turno, horario: `${turno.inicio} - ${turno.fim}`, dias_aula: abreviarDias(turno.diaInicio, turno.diaFim), descricao: turno.comoFunciona, auxilios: turno.beneficios.map((beneficio) => rotuloDoBeneficio(beneficio, catalogo)).filter(Boolean).join(", "), nivel_do_turno: turno.nivel }))) });
  const vinculos = turnosComId.flatMap(({ turno, id }) => turno.beneficios.filter((beneficio) => idUuid(beneficio.beneficioId)).map((beneficio) => ({ turno_id: id, beneficio_id: beneficio.beneficioId, descricao_local: beneficio.descricaoLocal })));
  if (vinculos.length) await requisicao("turnos_beneficios", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(vinculos) });
}

export async function alterarAtivacaoEscola(id: string, ativa: boolean) { await requisicao(`escolas?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ ativa, updated_at: new Date().toISOString() }) }); }
export async function excluirEscolaAdministrativa(id: string) { await requisicao(`turnos_escola?escola_id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }); await requisicao(`escolas?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }); }
export async function criarBeneficioAdministrativo(nome: string, descricao: string) { const dados = await requisicao("beneficios_catalogo", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ nome, descricao_padrao: descricao }) }); const linha = lista(dados)[0] as Linha | undefined; if (!linha) throw new Error("Não foi possível criar o auxílio."); return { id: valorTexto(linha.id), nome: valorTexto(linha.nome), descricao: valorTexto(linha.descricao_padrao) }; }
export async function excluirBeneficioAdministrativo(id: string) { await requisicao("rpc/remover_beneficio_global", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ p_beneficio_id: id }) }); }

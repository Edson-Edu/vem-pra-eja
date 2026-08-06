import type { Escola, Turno } from "./escolas";

const imagemPadrao = "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1200&auto=format&fit=crop";
const fotosFornecidas: Array<{ termo: string; urls: string[] }> = [
  { termo: "anita bernardes", urls: ["https://raw.githubusercontent.com/Edson-Edu/vem-pra-eja/main/assets/escolas/anita1.png", "https://raw.githubusercontent.com/Edson-Edu/vem-pra-eja/main/assets/escolas/anita2.png"] },
  { termo: "deputado doutel", urls: ["https://raw.githubusercontent.com/Edson-Edu/vem-pra-eja/main/assets/escolas/deputado_1.png", "https://raw.githubusercontent.com/Edson-Edu/vem-pra-eja/main/assets/escolas/deputado_2.png"] },
  { termo: "rogerio leonardo", urls: ["https://raw.githubusercontent.com/Edson-Edu/vem-pra-eja/main/assets/escolas/rogerio_1.png", "https://raw.githubusercontent.com/Edson-Edu/vem-pra-eja/main/assets/escolas/rogerio_2.png"] },
  { termo: "ceja", urls: ["https://raw.githubusercontent.com/Edson-Edu/vem-pra-eja/main/assets/escolas/ceja_1.png"] },
];

type Linha = Record<string, unknown>;
export type DadosInscricao = {
  escola_id: string; nivel_selecionado: string; turno_selecionado: string;
  nome_completo: string; cpf: string; idade: number; ddd: string; telefone: string;
  email_aluno: string | null; cep: string | null; rua: string | null; bairro: string | null;
  cidade: string | null; numero_endereco: string | null;
};

function configuracao() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) throw new Error("A configuração pública do banco não foi encontrada.");
  return { url: url.replace(/\/$/, ""), headers: { apikey: chave, Authorization: `Bearer ${chave}` } };
}

function numeroValido(valor: unknown, reserva: number) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : reserva;
}

function fotosDaEscola(linha: Linha) {
  const nome = String(linha.nome ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const cadastradas = fotosFornecidas.find((foto) => nome.includes(foto.termo))?.urls;
  if (cadastradas) return cadastradas;
  const valor = linha.fotos ?? linha.imagens ?? linha.image_url ?? linha.imagem_url ?? linha.foto_url;
  const urls = Array.isArray(valor) ? valor : typeof valor === "string" ? valor.replace(/^\{|\}$/g, "").split(",") : [];
  const validas = urls.filter((url): url is string => typeof url === "string" && /^https?:\/\//.test(url.trim())).map((url) => url.trim());
  return validas.length ? validas : [imagemPadrao];
}

function mapearEscola(linha: Linha, nivel: Turno["nivel"]): Escola {
  const imagens = fotosDaEscola(linha);
  const turnos = Array.isArray(linha.turnos_escola) ? linha.turnos_escola : [];
  return {
    id: String(linha.id), nome: String(linha.nome ?? "Escola"), bairro: String(linha.bairro ?? "Centro"), cidade: String(linha.cidade ?? "Camboriú"), endereco: String(linha.endereco ?? ""),
    latitude: numeroValido(linha.latitude, -27.0249), longitude: numeroValido(linha.longitude, -48.6508), imagem: imagens[0], imagens,
    niveis: Array.isArray(linha.niveis_oferecidos) ? linha.niveis_oferecidos as Turno["nivel"][] : [nivel],
    turnos: turnos.filter((turno): turno is Linha => typeof turno === "object" && turno !== null)
      .filter((turno) => !turno.nivel_do_turno || String(turno.nivel_do_turno).includes(nivel))
      .map((turno) => ({ id: String(turno.id), turno: String(turno.turno ?? "Noturno"), horario: String(turno.horario ?? "A combinar"), diasAula: String(turno.dias_aula ?? "A combinar"), descricao: String(turno.descricao ?? ""), auxilios: String(turno.auxilios ?? "").split(/[,\n]/).map((item) => item.trim()).filter(Boolean), nivel })),
  };
}

export async function buscarEscolas(nivel: Turno["nivel"], id?: string | null) {
  const { url, headers } = configuracao();
  const filtro = id ? `id=eq.${encodeURIComponent(id)}` : `niveis_oferecidos=cs.%7B${encodeURIComponent(nivel)}%7D`;
  const resposta = await fetch(`${url}/rest/v1/escolas?select=*,turnos_escola(*)&${filtro}`, { headers });
  if (!resposta.ok) throw new Error("Não foi possível obter as escolas.");
  const linhas = await resposta.json() as Linha[];
  return linhas.map((linha) => mapearEscola(linha, nivel));
}

export async function enviarInscricao(inscricao: DadosInscricao) {
  const { url, headers } = configuracao();
  const resposta = await fetch(`${url}/rest/v1/inscricoes`, {
    method: "POST", headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(inscricao),
  });
  if (resposta.ok) return;
  if (resposta.status === 409) throw new Error("Já existe uma inscrição para este CPF nesta escola e turno.");
  throw new Error("Não foi possível registrar a pré-inscrição.");
}

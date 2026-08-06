export type Turno = {
  id: string;
  turno: string;
  horario: string;
  diasAula: string;
  descricao: string;
  auxilios: string[];
  nivel: "Ensino Fundamental" | "Ensino Médio";
};

export type Escola = {
  id: string;
  nome: string;
  bairro: string;
  cidade: string;
  endereco: string;
  latitude: number;
  longitude: number;
  imagem: string;
  imagens?: string[];
  niveis: Turno["nivel"][];
  turnos: Turno[];
};

// Dados usados enquanto o Supabase não é ligado ao projeto web.
export const escolas: Escola[] = [
  {
    id: "ceja-camboriu",
    nome: "CEJA Camboriú",
    bairro: "Centro",
    cidade: "Camboriú",
    endereco: "Rua José Francisco Bernardes, 429",
    latitude: -27.0249,
    longitude: -48.6508,
    imagem: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1200&auto=format&fit=crop",
    niveis: ["Ensino Fundamental", "Ensino Médio"],
    turnos: [
      { id: "ceja-noite", turno: "Noturno", horario: "19:00 - 22:30", diasAula: "Segunda a quinta", descricao: "Aulas presenciais para jovens e adultos.", auxilios: ["Transporte", "Alimentação"], nivel: "Ensino Fundamental" },
      { id: "ceja-medio", turno: "Noturno", horario: "19:00 - 22:30", diasAula: "Segunda a quinta", descricao: "Conclusão do Ensino Médio na modalidade EJA.", auxilios: ["Transporte", "Alimentação"], nivel: "Ensino Médio" },
    ],
  },
  {
    id: "ebm-artur-siqueira",
    nome: "EBM Artur Siqueira",
    bairro: "Monte Alegre",
    cidade: "Camboriú",
    endereco: "Rua Monte Agulhas Negras, 680",
    latitude: -27.0115,
    longitude: -48.6475,
    imagem: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1200&auto=format&fit=crop",
    niveis: ["Ensino Fundamental"],
    turnos: [
      { id: "artur-noite", turno: "Noturno", horario: "18:30 - 22:00", diasAula: "Segunda a quinta", descricao: "Turma de Ensino Fundamental para EJA.", auxilios: ["Alimentação"], nivel: "Ensino Fundamental" },
    ],
  },
  {
    id: "cem-ivone-tersi",
    nome: "CEM Ivone Tersi Menegatti",
    bairro: "Tabuleiro",
    cidade: "Camboriú",
    endereco: "Rua Monte Neblina, 405",
    latitude: -27.0045,
    longitude: -48.6365,
    imagem: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop",
    niveis: ["Ensino Fundamental"],
    turnos: [
      { id: "ivone-noite", turno: "Noturno", horario: "19:00 - 22:20", diasAula: "Segunda a quinta", descricao: "Aulas para retomada dos estudos.", auxilios: ["Transporte", "Alimentação"], nivel: "Ensino Fundamental" },
    ],
  },
];

export function escolaPorId(id: string | null) {
  return escolas.find((escola) => escola.id === id);
}

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
  whatsapp: string | null;
};

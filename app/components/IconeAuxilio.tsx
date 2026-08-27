import { BookOpen, Bus, HandHeart, Shirt, Utensils } from "lucide-react";

/** A origem pode variar em acentos, plural e complementos do cadastro. */
export function tipoDeAuxilio(texto: string) {
  const normalizado = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/uniform|vestuario|camiseta/.test(normalizado)) return "uniforme";
  if (/livro|didatic|material escolar/.test(normalizado)) return "livros";
  if (/aliment|refeic|merenda/.test(normalizado)) return "alimentacao";
  if (/transport|onibus|passe escolar/.test(normalizado)) return "transporte";
  return "outro";
}

const icones = { uniforme: Shirt, livros: BookOpen, alimentacao: Utensils, transporte: Bus, outro: HandHeart };

export default function IconeAuxilio({ texto }: { texto: string }) {
  const tipo = tipoDeAuxilio(texto);
  const Icone = icones[tipo];
  return <Icone data-auxilio-icone={tipo} className="size-5" aria-hidden="true" />;
}

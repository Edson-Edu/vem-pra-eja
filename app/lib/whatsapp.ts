export const WHATSAPP_CONTINGENCIA = "5547989074653";

export function normalizarTelefoneBrasileiro(valor: string | null | undefined) {
  let numeros = String(valor ?? "").replace(/\D/g, "");
  if (numeros.startsWith("00")) numeros = numeros.slice(2);
  if (numeros.length === 10 || numeros.length === 11) numeros = `55${numeros}`;
  if (!/^55[1-9][0-9]{9,10}$/.test(numeros)) return null;
  const nacional = numeros.slice(2);
  const ddd = Number(nacional.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  return numeros;
}

export function formatarTelefoneBrasileiro(valor: string | null | undefined) {
  const normalizado = normalizarTelefoneBrasileiro(valor);
  if (!normalizado) return String(valor ?? "");
  const nacional = normalizado.slice(2);
  const ddd = nacional.slice(0, 2);
  const numero = nacional.slice(2);
  return numero.length === 9
    ? `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`
    : `(${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`;
}

export function mensagemDeContato(nomeEscola: string, nivel: string, turno: string) {
  return `Olá! Encontrei ${nomeEscola} pelo site VemPraEJA e gostaria de receber informações sobre a matrícula na EJA. Tenho interesse no nível ${nivel} e no turno ${turno}.`;
}

export function mensagemDeContingencia(nomeEscola: string, nivel: string, turno: string) {
  return `Olá! Estou acessando o VemPraEJA. A escola ${nomeEscola} está sem WhatsApp disponível no site e gostaria de orientação sobre a EJA. Tenho interesse no nível ${nivel} e no turno ${turno}.`;
}

export function linkDoWhatsApp(telefone: string | null | undefined, nomeEscola: string, nivel: string, turno: string) {
  const normalizado = normalizarTelefoneBrasileiro(telefone);
  if (!normalizado) return null;
  return `https://wa.me/${normalizado}?text=${encodeURIComponent(mensagemDeContato(nomeEscola, nivel, turno))}`;
}

export function linkDoWhatsAppContingencia(nomeEscola: string, nivel: string, turno: string) {
  return `https://wa.me/${WHATSAPP_CONTINGENCIA}?text=${encodeURIComponent(mensagemDeContingencia(nomeEscola, nivel, turno))}`;
}


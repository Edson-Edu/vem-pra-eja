"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { registrarVisitaPagina } from "../lib/analytics";

export default function RegistroAcessos() {
  const pagina = usePathname();

  useEffect(() => {
    if (!pagina.startsWith("/admin")) registrarVisitaPagina(pagina);
  }, [pagina]);

  return null;
}

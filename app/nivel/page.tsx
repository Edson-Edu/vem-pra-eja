"use client";

import { useRouter } from "next/navigation";
import TelaNivel from "../components/TelaNivel";

export default function PaginaNivel() {
  const router = useRouter();
  return (
    <TelaNivel
      onVoltar={() => router.replace("/")}
      onEscolher={(nivel) => router.push(`/escolas?nivel=${encodeURIComponent(nivel)}`)}
    />
  );
}

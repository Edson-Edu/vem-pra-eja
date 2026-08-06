"use client";
import { useRouter } from "next/navigation";
import TelaSucesso from "../components/TelaSucesso";

export default function PaginaSucesso() {
  const router = useRouter();
  return <TelaSucesso onInicio={() => router.replace("/")} />;
}

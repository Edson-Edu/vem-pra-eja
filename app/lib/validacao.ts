import { z } from "zod";
import { normalizarTelefoneBrasileiro } from "./whatsapp";

export const nivelSchema = z.enum(["Ensino Fundamental", "Ensino Médio"]);
export const turnoSchema = z.enum(["Manhã", "Tarde", "Noite"]);
const diaSchema = z.enum(["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo", ""]);
const horarioSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const telefoneSchema = z.string().trim().transform((valor, contexto) => {
  const normalizado = normalizarTelefoneBrasileiro(valor);
  if (!normalizado) contexto.addIssue({ code: "custom", message: "Informe um telefone brasileiro válido com DDD." });
  return normalizado ?? valor;
});

export const escolaAdministrativaSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  sigla: z.string().trim().max(12),
  nome: z.string().trim().min(2).max(180),
  cidade: z.enum(["Camboriú", "Balneário Camboriú"]),
  bairro: z.string().trim().min(2).max(120),
  rua: z.string().trim().max(180),
  numero: z.string().trim().max(30),
  complemento: z.string().trim().max(120),
  whatsapp: telefoneSchema,
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  niveis: z.array(nivelSchema).min(1).max(2),
  fotos: z.array(z.string().trim().refine((valor) => !valor || /^https?:\/\//i.test(valor), "Use uma URL HTTP ou HTTPS.")).max(10),
  ativa: z.boolean(),
  turnos: z.array(z.object({
    id: z.string().max(80),
    nivel: nivelSchema,
    turno: turnoSchema,
    inicio: horarioSchema,
    fim: horarioSchema,
    diaInicio: diaSchema.refine(Boolean, "Informe o primeiro dia de aula."),
    diaFim: diaSchema.refine(Boolean, "Informe o último dia de aula."),
    comoFunciona: z.string().trim().min(5).max(2000),
    beneficios: z.array(z.object({ beneficioId: z.string().uuid(), descricaoLocal: z.string().trim().max(1000) })),
  })).min(1),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  senha: z.string().min(12).max(200),
});

export const eventoAnalyticsSchema = z.object({
  evento: z.enum(["visitou_site", "selecionou_nivel", "visualizou_mapa", "visualizou_escola", "chegou_contato", "clicou_whatsapp"]),
  pagina: z.string().trim().max(80).optional().default(""),
  contexto: z.object({
    escolaId: z.string().uuid().optional(),
    nivel: nivelSchema.optional(),
    turno: z.string().trim().max(30).optional(),
  }).strict().optional().default({}),
});

export type EscolaAdministrativaEntrada = z.infer<typeof escolaAdministrativaSchema>;


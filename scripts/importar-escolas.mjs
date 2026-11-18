import { readFile } from "node:fs/promises";
import pg from "pg";
import { configuracaoBanco } from "./db-config.mjs";

const arquivo = process.argv[2];
if (!arquivo) throw new Error("Uso: node scripts/importar-escolas.mjs migration-data/arquivo.json");
const dados = JSON.parse(await readFile(arquivo, "utf8"));
if (!dados?.tabelas || dados.tabelas.inscricoes) throw new Error("Arquivo inválido ou contendo dados de inscrições.");
const whatsappProvisorio = "5547984400475";
const telefone = (valor) => { let numero = String(valor ?? "").replace(/\D/g, ""); if (numero.length === 10 || numero.length === 11) numero = `55${numero}`; return /^55[1-9][0-9]{9,10}$/.test(numero) ? numero : whatsappProvisorio; };
const turno = (valor) => /manh|matut/i.test(valor) ? "Manhã" : /tard|vespert/i.test(valor) ? "Tarde" : "Noite";
const cliente = new pg.Client(configuracaoBanco("MIGRATION_DB"));
try {
  await cliente.connect(); await cliente.query("begin");
  for (const item of dados.tabelas.escolas ?? []) await cliente.query(`insert into public.escolas(id,nome,niveis_oferecidos,whatsapp,telefone_contato,email_contato,latitude,longitude,cidade,image_url,bairro,sigla,endereco,ativa) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) on conflict(id) do update set nome=excluded.nome,niveis_oferecidos=excluded.niveis_oferecidos,whatsapp=excluded.whatsapp,telefone_contato=excluded.telefone_contato,email_contato=excluded.email_contato,latitude=excluded.latitude,longitude=excluded.longitude,cidade=excluded.cidade,image_url=excluded.image_url,bairro=excluded.bairro,sigla=excluded.sigla,endereco=excluded.endereco,ativa=excluded.ativa,updated_at=now()`, [item.id,item.nome,item.niveis_oferecidos ?? [],telefone(item.whatsapp ?? item.telefone_contato),telefone(item.telefone_contato ?? item.whatsapp),item.email_contato ?? null,item.latitude,item.longitude,item.cidade,item.image_url ?? null,item.bairro ?? "Centro",item.sigla ?? null,item.endereco ?? null,item.ativa !== false]);
  for (const item of dados.tabelas.beneficios_catalogo ?? []) await cliente.query("insert into public.beneficios_catalogo(id,nome,descricao_padrao) values($1,$2,$3) on conflict(id) do update set nome=excluded.nome,descricao_padrao=excluded.descricao_padrao", [item.id,item.nome,item.descricao_padrao ?? ""]);
  for (const item of dados.tabelas.turnos_escola ?? []) await cliente.query("insert into public.turnos_escola(id,escola_id,turno,horario,descricao,auxilios,nivel_do_turno,dias_aula) values($1,$2,$3,$4,$5,$6,$7,$8) on conflict(id) do update set escola_id=excluded.escola_id,turno=excluded.turno,horario=excluded.horario,descricao=excluded.descricao,auxilios=excluded.auxilios,nivel_do_turno=excluded.nivel_do_turno,dias_aula=excluded.dias_aula", [item.id,item.escola_id,turno(item.turno),item.horario ?? null,item.descricao ?? null,item.auxilios ?? null,item.nivel_do_turno ?? item.nivel,item.dias_aula ?? null]);
  for (const item of dados.tabelas.turnos_beneficios ?? []) await cliente.query("insert into public.turnos_beneficios(turno_id,beneficio_id,descricao_local) values($1,$2,$3) on conflict(turno_id,beneficio_id) do update set descricao_local=excluded.descricao_local", [item.turno_id,item.beneficio_id,item.descricao_local ?? ""]);
  await cliente.query("commit"); console.log("Dados institucionais importados em transação. Nenhuma tabela foi apagada.");
} catch (erro) { await cliente.query("rollback").catch(() => undefined); throw erro; } finally { await cliente.end().catch(() => undefined); }

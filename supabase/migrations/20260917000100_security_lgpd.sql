-- MIGRAÇÃO PREPARADA, NÃO APLICADA AUTOMATICAMENTE EM PRODUÇÃO.
-- Validar primeiro com supabase/security/auditoria.sql e em um projeto de teste.

begin;

create or replace function public.eja_usuario_administrador()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'email') = 'admin@vempraeja-novo.app', false)
$$;

revoke all on function public.eja_usuario_administrador() from public, anon;
grant execute on function public.eja_usuario_administrador() to authenticated;

alter table public.inscricoes enable row level security;
alter table public.escolas enable row level security;
alter table public.turnos_escola enable row level security;
alter table public.beneficios_catalogo enable row level security;
alter table public.turnos_beneficios enable row level security;

-- Remova apenas estas políticas se a migração precisar ser reaplicada. Políticas
-- antigas encontradas pela auditoria devem ser analisadas e removidas de forma
-- consciente; uma política permissiva adicional pode ampliar o acesso.
drop policy if exists eja_escolas_leitura_publica on public.escolas;
drop policy if exists eja_escolas_administracao on public.escolas;
drop policy if exists eja_turnos_leitura_publica on public.turnos_escola;
drop policy if exists eja_turnos_administracao on public.turnos_escola;
drop policy if exists eja_catalogo_administracao on public.beneficios_catalogo;
drop policy if exists eja_vinculos_administracao on public.turnos_beneficios;
drop policy if exists eja_inscricoes_criacao_publica on public.inscricoes;
drop policy if exists eja_inscricoes_leitura_administrativa on public.inscricoes;

create policy eja_escolas_leitura_publica
on public.escolas for select
to anon, authenticated
using (ativa is true or public.eja_usuario_administrador());

create policy eja_escolas_administracao
on public.escolas for all
to authenticated
using (public.eja_usuario_administrador())
with check (public.eja_usuario_administrador());

create policy eja_turnos_leitura_publica
on public.turnos_escola for select
to anon, authenticated
using (
  exists (
    select 1 from public.escolas
    where escolas.id = turnos_escola.escola_id
      and (escolas.ativa is true or public.eja_usuario_administrador())
  )
);

create policy eja_turnos_administracao
on public.turnos_escola for all
to authenticated
using (public.eja_usuario_administrador())
with check (public.eja_usuario_administrador());

create policy eja_catalogo_administracao
on public.beneficios_catalogo for all
to authenticated
using (public.eja_usuario_administrador())
with check (public.eja_usuario_administrador());

create policy eja_vinculos_administracao
on public.turnos_beneficios for all
to authenticated
using (public.eja_usuario_administrador())
with check (public.eja_usuario_administrador());

create policy eja_inscricoes_criacao_publica
on public.inscricoes for insert
to anon, authenticated
with check (
  char_length(btrim(nome_completo)) between 2 and 160
  and cpf ~ '^[0-9]{11}$'
  and idade between 15 and 120
  and ddd ~ '^[0-9]{2}$'
  and telefone ~ '^[0-9]{9}$'
  and nivel_selecionado in ('Ensino Fundamental', 'Ensino Médio')
  and char_length(btrim(turno_selecionado)) between 2 and 40
  and (email_aluno is null or (
    char_length(email_aluno) <= 254
    and email_aluno ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ))
  and (cep is null or cep ~ '^[0-9]{8}$')
  and (cidade is null or cidade in ('Camboriú', 'Balneário Camboriú'))
  and exists (
    select 1 from public.escolas
    where escolas.id = inscricoes.escola_id
      and escolas.ativa is true
  )
);

create policy eja_inscricoes_leitura_administrativa
on public.inscricoes for select
to authenticated
using (public.eja_usuario_administrador());

revoke all on public.inscricoes from anon;
grant insert (
  escola_id, nivel_selecionado, turno_selecionado, nome_completo, cpf, idade,
  ddd, telefone, email_aluno, cep, rua, bairro, cidade, numero_endereco
) on public.inscricoes to anon;
grant select on public.escolas, public.turnos_escola to anon;

grant select on public.inscricoes to authenticated;
grant select, insert, update, delete on
  public.escolas, public.turnos_escola,
  public.beneficios_catalogo, public.turnos_beneficios
to authenticated;

-- A função existente deve também validar eja_usuario_administrador() no corpo.
-- A auditoria mostra a assinatura exata; ajuste-a antes de executar se não for uuid.
do $$
declare
  funcao regprocedure;
begin
  for funcao in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'remover_beneficio_global'
  loop
    execute format('revoke all on function %s from public, anon', funcao);
    execute format('grant execute on function %s to authenticated', funcao);
  end loop;
end
$$;

commit;

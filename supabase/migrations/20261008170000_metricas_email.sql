-- Registra somente o estado operacional do envio, sem copiar dados pessoais.
create table public.notificacoes_email (
  id bigint generated always as identity primary key,
  inscricao_id uuid not null unique references public.inscricoes(id) on delete cascade,
  status text not null default 'na_fila' check (status in ('na_fila', 'enviado', 'falha')),
  tentativas integer not null default 0 check (tentativas >= 0),
  destinatario_email text,
  destinatario_nome text,
  message_id text,
  erro text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  enviado_em timestamptz
);

alter table public.notificacoes_email enable row level security;
revoke all on table public.notificacoes_email from public, anon, authenticated;
grant all on table public.notificacoes_email to service_role;
grant usage, select on sequence public.notificacoes_email_id_seq to service_role;

create index notificacoes_email_status_criado_em_idx on public.notificacoes_email (status, criado_em);

create or replace function public.preparar_notificacao_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notificacoes_email (inscricao_id, status)
  values (new.id, 'na_fila')
  on conflict (inscricao_id) do nothing;
  return new;
end;
$$;

revoke all on function public.preparar_notificacao_email() from public, anon, authenticated;
grant execute on function public.preparar_notificacao_email() to postgres, service_role;

drop trigger if exists "Preparar_notificacao_email" on public.inscricoes;
create trigger "Preparar_notificacao_email"
after insert on public.inscricoes
for each row execute function public.preparar_notificacao_email();

create or replace function public.estatisticas_analytics_local(p_inicio date, p_fim date)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with dados as (
    select *
    from public.eventos_analytics
    where criado_em >= (p_inicio::timestamp at time zone 'America/Sao_Paulo')
      and criado_em < ((p_fim + 1)::timestamp at time zone 'America/Sao_Paulo')
  ),
  envios as (
    select *
    from public.notificacoes_email
    where criado_em >= (p_inicio::timestamp at time zone 'America/Sao_Paulo')
      and criado_em < ((p_fim + 1)::timestamp at time zone 'America/Sao_Paulo')
  ),
  resumo as (
    select
      count(distinct visitante_id) filter (where evento = 'visitou_pagina')::int as visitas,
      count(distinct visitante_id) filter (where evento = 'escolheu_nivel')::int as escolheu_nivel,
      count(distinct visitante_id) filter (where evento = 'abriu_escola')::int as abriu_escola,
      count(distinct visitante_id) filter (where evento = 'iniciou_cadastro')::int as iniciou_cadastro,
      count(distinct visitante_id) filter (where evento = 'concluiu_inscricao')::int as concluiu_inscricao
    from dados
  ),
  resumo_emails as (
    select
      count(*) filter (where status = 'na_fila')::int as na_fila,
      count(*) filter (where status = 'enviado')::int as enviados,
      count(*) filter (where status = 'falha')::int as com_falha
    from envios
  ),
  dispositivos as (
    select dispositivo as nome, count(distinct visitante_id)::int as total
    from dados where evento = 'visitou_pagina'
    group by dispositivo order by total desc, nome
  ),
  paginas as (
    select pagina as nome, count(*)::int as total
    from dados where evento = 'visitou_pagina'
    group by pagina order by total desc, nome limit 10
  ),
  horarios as (
    select to_char(criado_em at time zone 'America/Sao_Paulo', 'YYYYMMDDHH24') as nome,
           count(distinct visitante_id)::int as total
    from dados where evento = 'visitou_pagina'
    group by 1 order by 1
  )
  select jsonb_build_object(
    'resumo', jsonb_build_object(
      'visitas', coalesce(resumo.visitas, 0),
      'escolheuNivel', coalesce(resumo.escolheu_nivel, 0),
      'abriuEscola', coalesce(resumo.abriu_escola, 0),
      'iniciouCadastro', coalesce(resumo.iniciou_cadastro, 0),
      'concluiuInscricao', coalesce(resumo.concluiu_inscricao, 0)
    ),
    'emails', jsonb_build_object(
      'naFila', coalesce(resumo_emails.na_fila, 0),
      'enviados', coalesce(resumo_emails.enviados, 0),
      'comFalha', coalesce(resumo_emails.com_falha, 0)
    ),
    'acessos', jsonb_build_object(
      'dispositivos', coalesce((select jsonb_agg(jsonb_build_object('nome', nome, 'total', total) order by total desc, nome) from dispositivos), '[]'::jsonb),
      'paginas', coalesce((select jsonb_agg(jsonb_build_object('nome', nome, 'total', total) order by total desc, nome) from paginas), '[]'::jsonb),
      'horarios', coalesce((select jsonb_agg(jsonb_build_object('nome', nome, 'total', total) order by nome) from horarios), '[]'::jsonb)
    )
  )
  from resumo cross join resumo_emails;
$$;

revoke all on function public.estatisticas_analytics_local(date, date) from public, anon, authenticated;
grant execute on function public.estatisticas_analytics_local(date, date) to service_role;

comment on table public.notificacoes_email is 'Situação do e-mail institucional enviado para a escola em cada inscrição.';

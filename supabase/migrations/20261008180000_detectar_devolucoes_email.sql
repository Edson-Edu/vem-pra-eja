alter table public.notificacoes_email
  add column if not exists message_id text;

create index if not exists notificacoes_email_message_id_idx
  on public.notificacoes_email (message_id)
  where message_id is not null;

create table public.retornos_email_processados (
  pasta text not null,
  uid bigint not null,
  processado_em timestamptz not null default now(),
  primary key (pasta, uid)
);

alter table public.retornos_email_processados enable row level security;
revoke all on table public.retornos_email_processados from public, anon, authenticated;
grant all on table public.retornos_email_processados to service_role;

comment on table public.retornos_email_processados is 'UIDs IMAP já verificados para que uma devolução não seja processada duas vezes.';

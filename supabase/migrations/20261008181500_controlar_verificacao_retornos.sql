create table public.controle_integracoes (
  chave text primary key,
  verificado_em timestamptz not null default '-infinity'::timestamptz
);

alter table public.controle_integracoes enable row level security;
revoke all on table public.controle_integracoes from public, anon, authenticated;
grant all on table public.controle_integracoes to service_role;

create or replace function public.reservar_verificacao_retornos_email()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  reservada boolean := false;
begin
  insert into public.controle_integracoes (chave, verificado_em)
  values ('retornos_email', now())
  on conflict (chave) do update
    set verificado_em = excluded.verificado_em
    where controle_integracoes.verificado_em < now() - interval '45 seconds'
  returning true into reservada;
  return coalesce(reservada, false);
end;
$$;

revoke all on function public.reservar_verificacao_retornos_email() from public, anon, authenticated;
grant execute on function public.reservar_verificacao_retornos_email() to service_role;

begin;

create table if not exists public.administradores (
  email text primary key,
  ativo boolean not null default true,
  criado_em timestamp with time zone not null default now(),
  constraint administradores_email_formato check (
    email = lower(email)
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
);

alter table public.administradores enable row level security;
revoke all on table public.administradores from public, anon, authenticated;
grant all on table public.administradores to service_role;

insert into public.administradores (email)
values ('admin@vempraeja-novo.app')
on conflict (email) do nothing;

create or replace function public.eja_usuario_administrador()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.administradores
    where email = lower(coalesce((select auth.jwt() ->> 'email'), ''))
      and ativo is true
  )
$$;

revoke all on function public.eja_usuario_administrador() from public, anon;
grant execute on function public.eja_usuario_administrador() to authenticated, service_role;

create or replace function public.eja_eh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.eja_usuario_administrador()
$$;

revoke all on function public.eja_eh_admin() from public, anon;
grant execute on function public.eja_eh_admin() to authenticated, service_role;

drop policy if exists "admin atualiza beneficios" on public.beneficios_catalogo;
drop policy if exists "admin cria beneficios" on public.beneficios_catalogo;
drop policy if exists "admin le beneficios" on public.beneficios_catalogo;
drop policy if exists "Permitir leitura publica de escolas" on public.escolas;
drop policy if exists "admin gerencia escolas" on public.escolas;
drop policy if exists "Administrador pode ler inscricoes" on public.inscricoes;
drop policy if exists "Permitir insercao publica de inscricoes" on public.inscricoes;
drop policy if exists "admin gerencia beneficios dos turnos" on public.turnos_beneficios;
drop policy if exists "Permitir leitura publica" on public.turnos_escola;
drop policy if exists "admin gerencia turnos" on public.turnos_escola;
drop policy if exists "Permitir leitura pública" on public.turnos_escola;

comment on table public.administradores is
  'Enderecos institucionais autorizados a administrar o Vem Pra EJA.';

comment on trigger "Notificar_escola_local" on public.inscricoes is
  'Solicita a Edge Function interna o envio institucional de uma nova pre-inscricao.';

commit;

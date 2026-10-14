begin;

-- O painel não oferece cadastro público. Com o signup desativado, cada conta
-- autenticada foi criada deliberadamente por um administrador no Supabase.
create or replace function public.eja_usuario_administrador()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.role()) = 'authenticated', false)
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

commit;

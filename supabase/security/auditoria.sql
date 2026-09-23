-- Auditoria somente leitura. Execute no SQL Editor do Supabase e preserve o
-- resultado junto à homologação. Este arquivo não altera objetos do banco.

select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'inscricoes', 'escolas', 'turnos_escola',
    'beneficios_catalogo', 'turnos_beneficios'
  )
order by tablename;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'inscricoes', 'escolas', 'turnos_escola',
    'beneficios_catalogo', 'turnos_beneficios'
  )
order by tablename, cmd, policyname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'inscricoes', 'escolas', 'turnos_escola',
    'beneficios_catalogo', 'turnos_beneficios'
  )
order by table_name, grantee, privilege_type;

select p.oid::regprocedure as assinatura,
       p.prosecdef as security_definer,
       has_function_privilege('anon', p.oid, 'execute') as anon_pode_executar,
       has_function_privilege('authenticated', p.oid, 'execute') as autenticado_pode_executar,
       pg_get_functiondef(p.oid) as definicao
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'remover_beneficio_global';

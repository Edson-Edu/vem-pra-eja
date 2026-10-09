begin;

-- Visitantes podem consultar somente escolas ativas.
-- A verificação administrativa fica na política administrativa separada.
drop policy if exists eja_escolas_leitura_publica
on public.escolas;

create policy eja_escolas_leitura_publica
on public.escolas
for select
to anon, authenticated
using (ativa is true);

-- Visitantes podem consultar somente turnos de escolas ativas.
drop policy if exists eja_turnos_leitura_publica
on public.turnos_escola;

create policy eja_turnos_leitura_publica
on public.turnos_escola
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.escolas as escola
    where escola.id = turnos_escola.escola_id
      and escola.ativa is true
  )
);

commit;

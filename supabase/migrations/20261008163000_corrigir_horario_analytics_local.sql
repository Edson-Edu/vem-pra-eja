-- Usa relógio de 24 horas nos gráficos (15h, e não 03h).
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
  resumo as (
    select
      count(distinct visitante_id) filter (where evento = 'visitou_pagina')::int as visitas,
      count(distinct visitante_id) filter (where evento = 'escolheu_nivel')::int as escolheu_nivel,
      count(distinct visitante_id) filter (where evento = 'abriu_escola')::int as abriu_escola,
      count(distinct visitante_id) filter (where evento = 'iniciou_cadastro')::int as iniciou_cadastro,
      count(distinct visitante_id) filter (where evento = 'concluiu_inscricao')::int as concluiu_inscricao
    from dados
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
    'acessos', jsonb_build_object(
      'dispositivos', coalesce((select jsonb_agg(jsonb_build_object('nome', nome, 'total', total) order by total desc, nome) from dispositivos), '[]'::jsonb),
      'paginas', coalesce((select jsonb_agg(jsonb_build_object('nome', nome, 'total', total) order by total desc, nome) from paginas), '[]'::jsonb),
      'horarios', coalesce((select jsonb_agg(jsonb_build_object('nome', nome, 'total', total) order by nome) from horarios), '[]'::jsonb)
    )
  )
  from resumo;
$$;

revoke all on function public.estatisticas_analytics_local(date, date) from public, anon, authenticated;
grant execute on function public.estatisticas_analytics_local(date, date) to service_role;

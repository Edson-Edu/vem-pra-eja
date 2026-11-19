create extension if not exists pgcrypto;

create table if not exists public.escolas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  niveis_oferecidos text[] not null default '{}',
  whatsapp text,
  latitude double precision not null,
  longitude double precision not null,
  cidade text not null,
  image_url text,
  bairro text not null default 'Centro',
  sigla text,
  endereco text,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint escolas_cidade_valida check (cidade in ('Camboriú', 'Balneário Camboriú')),
  constraint escolas_whatsapp_valido check (whatsapp is null or whatsapp ~ '^55[1-9][0-9]{9,10}$')
);

create table if not exists public.beneficios_catalogo (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao_padrao text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.turnos_escola (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas(id) on delete cascade,
  turno text not null,
  horario text,
  descricao text,
  auxilios text,
  nivel_do_turno text not null,
  dias_aula text default 'Seg - Qui',
  constraint turnos_nivel_valido check (nivel_do_turno in ('Ensino Fundamental', 'Ensino Médio')),
  constraint turnos_nome_valido check (turno in ('Manhã', 'Tarde', 'Noite'))
);

create index if not exists turnos_escola_escola_id_idx on public.turnos_escola(escola_id);

create table if not exists public.turnos_beneficios (
  turno_id uuid not null references public.turnos_escola(id) on delete cascade,
  beneficio_id uuid not null references public.beneficios_catalogo(id) on delete cascade,
  descricao_local text not null default '',
  primary key (turno_id, beneficio_id)
);

create table if not exists public.administradores (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  senha_hash text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint administradores_email_minusculo check (email = lower(email)),
  constraint administradores_email_formato check (email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
);

create unique index if not exists administradores_email_unico on public.administradores(lower(email));

create table if not exists public.sessoes_administrativas (
  id uuid primary key default gen_random_uuid(),
  administrador_id uuid not null references public.administradores(id) on delete cascade,
  token_hash char(64) not null unique,
  csrf_token char(64) not null,
  criado_em timestamptz not null default now(),
  ultimo_acesso_em timestamptz not null default now(),
  expira_em timestamptz not null,
  revogada_em timestamptz
);

create index if not exists sessoes_administrador_idx on public.sessoes_administrativas(administrador_id);
create index if not exists sessoes_expiracao_idx on public.sessoes_administrativas(expira_em);

create table if not exists public.limites_login (
  chave char(64) primary key,
  tentativas integer not null default 0,
  janela_iniciada_em timestamptz not null default now(),
  bloqueado_ate timestamptz
);

create table if not exists public.metricas_agregadas (
  dia date not null,
  hora smallint not null check (hora between 0 and 23),
  evento text not null,
  escola_id text not null default '',
  escola_nome text not null default '',
  nivel text not null default '',
  turno text not null default '',
  pagina text not null default '',
  dispositivo text not null default '',
  total bigint not null default 0 check (total >= 0),
  atualizado_em timestamptz not null default now(),
  primary key (dia, hora, evento, escola_id, escola_nome, nivel, turno, pagina, dispositivo),
  constraint metricas_evento_valido check (evento in (
    'visitou_site', 'selecionou_nivel', 'visualizou_mapa',
    'visualizou_escola', 'chegou_contato', 'clicou_whatsapp'
  )),
  constraint metricas_nivel_valido check (nivel = '' or nivel in ('Ensino Fundamental', 'Ensino Médio')),
  constraint metricas_dispositivo_valido check (dispositivo = '' or dispositivo in ('desktop', 'mobile', 'tablet'))
);

create index if not exists metricas_dia_evento_idx on public.metricas_agregadas(dia, evento);
create index if not exists metricas_escola_idx on public.metricas_agregadas(escola_id, evento);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'vempraeja_app') then
    grant usage on schema public to vempraeja_app;
    grant select, insert, update, delete on public.escolas, public.turnos_escola, public.beneficios_catalogo, public.turnos_beneficios to vempraeja_app;
    grant select on public.administradores to vempraeja_app;
    grant select, insert, update, delete on public.sessoes_administrativas, public.limites_login, public.metricas_agregadas to vempraeja_app;
  end if;
end
$$;


SET local check_function_bodies = off;

CREATE EXTENSION IF NOT EXISTS "pg_net" SCHEMA "extensions";

CREATE TABLE "public"."beneficios_catalogo" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "nome"             text                     NOT NULL,
  "descricao_padrao" text                     NOT NULL DEFAULT ''::text,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "beneficios_catalogo_nome_key" UNIQUE (nome),
  CONSTRAINT "beneficios_catalogo_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."beneficios_catalogo"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."escolas" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "nome"              text                     NOT NULL,
  "niveis_oferecidos" text[]                   NOT NULL,
  "email_contato"     text                     NOT NULL,
  "latitude"          double precision         NOT NULL,
  "longitude"         double precision         NOT NULL,
  "created_at"        timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "cidade"            text,
  "image_url"         text,
  "bairro"            text                     DEFAULT 'Centro'::text,
  "sigla"             text,
  "endereco"          text,
  "ativa"             boolean                  NOT NULL DEFAULT true,
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "escolas_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."escolas"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."inscricoes" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "escola_id"         uuid                     NOT NULL,
  "nivel_selecionado" text                     NOT NULL,
  "nome_completo"     text                     NOT NULL,
  "cpf"               text                     NOT NULL,
  "ddd"               text                     NOT NULL,
  "telefone"          text                     NOT NULL,
  "email_aluno"       text,
  "cidade"            text,
  "cep"               text,
  "rua"               text,
  "bairro"            text,
  "numero_endereco"   text,
  "created_at"        timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "turno_selecionado" text,
  "idade"             integer,
  CONSTRAINT "cpf_escola_turno_unico" UNIQUE (cpf, escola_id, turno_selecionado),
  CONSTRAINT "inscricoes_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."inscricoes"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."turnos_beneficios" (
  "turno_id"        uuid NOT NULL,
  "beneficio_id"    uuid NOT NULL,
  "descricao_local" text NOT NULL DEFAULT ''::text,
  CONSTRAINT "turnos_beneficios_pkey" PRIMARY KEY (turno_id, beneficio_id)
);

ALTER TABLE "public"."turnos_beneficios"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."turnos_escola" (
  "id"             uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "escola_id"      uuid,
  "turno"          text NOT NULL,
  "horario"        text,
  "descricao"      text,
  "auxilios"       text,
  "nivel_do_turno" text,
  "dias_aula"      text DEFAULT 'Seg–Qui'::text,
  CONSTRAINT "turnos_escola_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."turnos_escola"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.eja_eh_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select coalesce(auth.jwt() ->> 'email', '') = 'admin@vempraeja-novo.app';
$function$;

CREATE OR REPLACE FUNCTION public.remover_beneficio_global (
  p_beneficio_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_nome text;
begin
  if not public.eja_eh_admin() then
    raise exception 'Apenas o administrador pode remover benefícios padrão.';
  end if;

  select nome
  into v_nome
  from public.beneficios_catalogo
  where id = p_beneficio_id;

  if v_nome is null then
    raise exception 'Benefício padrão não encontrado.';
  end if;

  delete from public.turnos_beneficios
  where beneficio_id = p_beneficio_id;

  update public.turnos_escola
  set auxilios = array_to_string(
    array_remove(
      regexp_split_to_array(coalesce(auxilios, ''), '\s*,\s*'),
      v_nome
    ),
    ', '
  )
  where v_nome = any(
    regexp_split_to_array(coalesce(auxilios, ''), '\s*,\s*')
  );

  delete from public.beneficios_catalogo
  where id = p_beneficio_id;
end;
$function$;

ALTER TABLE "public"."inscricoes"
  ADD CONSTRAINT "inscricoes_escola_id_fkey" FOREIGN KEY (escola_id) REFERENCES public.escolas(id);

ALTER TABLE "public"."turnos_beneficios"
  ADD CONSTRAINT "turnos_beneficios_beneficio_id_fkey" FOREIGN KEY (beneficio_id) REFERENCES public.beneficios_catalogo(id) ON DELETE CASCADE;

ALTER TABLE "public"."turnos_escola"
  ADD CONSTRAINT "turnos_escola_escola_id_fkey" FOREIGN KEY (escola_id) REFERENCES public.escolas(id) ON DELETE CASCADE;

ALTER TABLE "public"."turnos_beneficios"
  ADD CONSTRAINT "turnos_beneficios_turno_id_fkey" FOREIGN KEY (turno_id) REFERENCES public.turnos_escola(id) ON DELETE CASCADE;

CREATE TRIGGER "Enviar_para_MakeCom"
  AFTER INSERT ON public.inscricoes
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request('https://hook.us2.make.com/ao2iy9kandxgu2o8thoxht9ve0f84nvi', 'POST', '{"Content-type":"application/json"}', '{}', '5000');

CREATE POLICY "admin atualiza beneficios" ON "public"."beneficios_catalogo"
  FOR UPDATE
  TO "authenticated"
  USING (public.eja_eh_admin())
  WITH CHECK (public.eja_eh_admin());

CREATE POLICY "admin cria beneficios" ON "public"."beneficios_catalogo"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.eja_eh_admin());

CREATE POLICY "admin le beneficios" ON "public"."beneficios_catalogo"
  FOR SELECT
  TO "authenticated"
  USING (public.eja_eh_admin());

CREATE POLICY "Permitir leitura publica de escolas" ON "public"."escolas"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "admin gerencia escolas" ON "public"."escolas"
  FOR ALL
  TO "authenticated"
  USING (public.eja_eh_admin())
  WITH CHECK (public.eja_eh_admin());

CREATE POLICY "Administrador pode ler inscricoes" ON "public"."inscricoes"
  FOR SELECT
  TO "authenticated"
  USING (public.eja_eh_admin());

CREATE POLICY "Permitir insercao publica de inscricoes" ON "public"."inscricoes"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "admin gerencia beneficios dos turnos" ON "public"."turnos_beneficios"
  FOR ALL
  TO "authenticated"
  USING (public.eja_eh_admin())
  WITH CHECK (public.eja_eh_admin());

CREATE POLICY "Permitir leitura pública" ON "public"."turnos_escola"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "admin gerencia turnos" ON "public"."turnos_escola"
  FOR ALL
  TO "authenticated"
  USING (public.eja_eh_admin())
  WITH CHECK (public.eja_eh_admin());

COMMENT ON COLUMN "public"."escolas"."cidade" IS 'Nome da cidade';

COMMENT ON COLUMN "public"."escolas"."image_url" IS 'imagens';

COMMENT ON EXTENSION "pg_net" IS 'Async HTTP';

REVOKE ALL ON FUNCTION "public"."eja_eh_admin"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."eja_eh_admin"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."remover_beneficio_global"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."remover_beneficio_global"(uuid) TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."beneficios_catalogo" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."escolas" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inscricoes" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."turnos_beneficios" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."turnos_escola" TO "anon", "authenticated", "postgres", "service_role";

-- MODELO 02 (LOCAL): substitui o webhook externo do Make pela Edge Function
-- local. Este arquivo pertence somente à branch modelo-02-local.

DROP TRIGGER IF EXISTS "Enviar_para_MakeCom" ON public.inscricoes;
DROP TRIGGER IF EXISTS "Notificar_escola_local" ON public.inscricoes;

CREATE TRIGGER "Notificar_escola_local"
AFTER INSERT ON public.inscricoes
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'http://kong:8000/functions/v1/notificar-inscricao',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '10000'
);

COMMENT ON TRIGGER "Notificar_escola_local" ON public.inscricoes IS
  'Modelo 02: envia a nova inscricao para a Edge Function local e o Mailpit.';

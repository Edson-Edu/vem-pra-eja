# Segurança e LGPD — Vem pra EJA

Revisão técnica local realizada em 17/09/2026. Este documento registra o que
foi comprovado no código e o que ainda depende de decisão institucional. Ele
não substitui a análise do encarregado de dados da instituição.

## Dados tratados

| Dado | Obrigatório | Finalidade observada no sistema |
| --- | --- | --- |
| Nome completo | Sim | Identificar a pessoa interessada |
| CPF | Sim | Evitar inscrição duplicada e identificar o cadastro |
| Idade | Sim | Validar a idade mínima para a modalidade escolhida |
| DDD e telefone | Sim | Permitir contato para concluir a matrícula |
| E-mail | Não | Canal alternativo de contato |
| CEP, rua, bairro, cidade e número | Não | Apoiar localização e atendimento |
| Escola, nível e turno | Sim | Direcionar a pré-inscrição |

O Google Analytics recebe somente eventos agregados com nível, identificador
da escola e turno. Nome, CPF, telefone, endereço e e-mail não devem ser
incluídos em eventos. A tela de sucesso não transporta mais nome ou escola na
URL, evitando que esses valores apareçam em histórico, logs e Analytics.

Ao pesquisar CEP ou rua, CEP, município e trecho da rua são enviados ao serviço
público ViaCEP. Essa comunicação deve constar no aviso de privacidade.

## Controles confirmados

- Arquivos `.env*` estão ignorados pelo Git; nenhuma chave privada é importada
  diretamente por componente React.
- A chave pública do Supabase é usada no navegador, como previsto pelo modelo
  do serviço. A segurança dos dados depende das políticas RLS do banco.
- Teste anônimo somente leitura em 17/09/2026: `escolas` respondeu com dados
  públicos; `inscricoes` respondeu HTTP 200 sem expor registros.
- Consultas administrativas usam o token autenticado do Supabase.
- A Edge Function de Analytics revalida o usuário e o e-mail administrativo.
- Exportações escapam fórmulas de planilha e conteúdo HTML.
- A função de voz escapa XML, limita o texto a 3.000 caracteres e restringe
  CORS às origens configuradas.
- O Firebase está preparado para enviar HSTS, `nosniff`, política de referência,
  restrição de enquadramento e política de permissões após a próxima publicação.
- A rota administrativa contém metadados `noindex`, `nofollow` e `nocache`.
- Next.js, `eslint-config-next` e `@next/third-parties` foram atualizados para
  16.3.5. A auditoria completa do npm terminou com zero vulnerabilidades
  conhecidas em 17/09/2026; o `override` de `nanoid` mantém a versão transitiva
  corrigida até que todos os pacotes ascendentes a adotem diretamente.

## Pendências antes da homologação institucional

1. Executar `supabase/security/auditoria.sql` no SQL Editor e guardar o
   resultado. A resposta anônima vazia é positiva, mas não prova sozinha quais
   políticas estão instaladas.
2. Revisar e aplicar a migração preparada em
   `supabase/migrations/20260917000100_security_lgpd.sql` primeiro em um projeto
   de teste. Ela não foi aplicada automaticamente no banco de produção.
3. Definir oficialmente controlador, encarregado/canal de contato, base legal,
   prazo de retenção, procedimento de correção/exclusão e compartilhamento com
   escolas. Sem essas decisões não é correto declarar conformidade LGPD.
4. Aprovar o texto de privacidade antes de acrescentá-lo ao formulário. Nenhum
   elemento visual foi inserido agora para preservar os layouts homologados.
5. Adicionar limitação de frequência à criação de inscrições e à Azure Function
   de voz. CORS reduz uso acidental por navegadores, mas não impede chamadas
   automatizadas fora deles.
6. Confirmar que a função `remover_beneficio_global` verifica a identidade
   administrativa internamente e não é executável pelo papel `anon`.
7. Trocar o administrador fixo por uma conta institucional quando a DTI a
   fornecer, exigir senha forte e habilitar MFA se disponível.
8. Definir rotina de exclusão/anonimização e backup criptografado das inscrições.

## Texto mínimo a ser aprovado pelo responsável institucional

> Usaremos seus dados para registrar seu interesse na EJA, verificar os
> requisitos da modalidade e permitir que a escola escolhida entre em contato.
> Nome, CPF, idade e telefone são necessários para a pré-inscrição; e-mail e
> endereço são opcionais. Para localizar endereços, a consulta informada pode
> ser enviada ao serviço ViaCEP. Consulte [canal institucional] para saber sobre
> acesso, correção, retenção e exclusão dos seus dados.

Os campos entre colchetes e a base legal devem ser definidos pela instituição.
Evite usar um aceite genérico como substituto de transparência ou de uma base
legal adequada.

## Revalidação recomendada

Após qualquer alteração de políticas:

1. sem login, confirmar leitura de escolas ativas e bloqueio de inscrições;
2. realizar uma pré-inscrição de teste autorizada;
3. confirmar que o administrador consegue consultar e exportar o registro;
4. confirmar que usuário não administrativo não lê nem altera dados;
5. remover o registro de teste conforme o procedimento aprovado;
6. registrar data, executor, projeto Supabase e resultado dos testes.

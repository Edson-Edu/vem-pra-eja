import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);

function carregar(arquivo, ambiente = {}, expor = []) {
  const filename = path.resolve(import.meta.dirname, '..', arquivo);
  const fonte = fs.readFileSync(filename, 'utf8') + (expor.length ? `\nexport { ${expor.join(', ')} };` : '');
  const compilado = ts.transpileModule(fonte, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  const modulo = { exports: {} };
  vm.runInNewContext(compilado, { require, module: modulo, exports: modulo.exports, ...ambiente }, { filename });
  return modulo.exports;
}

test('auxílios reconhecem acentos, plural e complementos; desconhecidos não viram ônibus', () => {
  const { tipoDeAuxilio } = carregar('app/components/IconeAuxilio.tsx');
  const casos = [
    ['Uniforme', 'uniforme'], ['UNIFORMES ESCOLARES', 'uniforme'],
    ['Livros didáticos', 'livros'], ['livro didatico', 'livros'],
    ['Auxílio material escolar', 'livros'], ['Alimentação', 'alimentacao'],
    ['Merenda', 'alimentacao'], ['Transporte escolar', 'transporte'],
    ['Ônibus', 'transporte'], ['Auxílio para mães estudantes', 'outro'],
  ];
  for (const [texto, esperado] of casos) assert.equal(tipoDeAuxilio(texto), esperado, texto);
});

test('cartao usa Auxilios na interface e no pacote de audio', () => {
  let audio = '';
  const { CartaoEscola } = carregar('app/components/TelaEscolas.tsx', {
    require: nome => nome === './BotaoAudio' ? { default: ({ texto }) => { audio = texto; return null; } }
      : nome === './useAudioDescricao' ? { textoParaAudio: texto => texto }
      : nome.startsWith('.') ? {} : require(nome),
  }, ['CartaoEscola']);
  const escola = { nome: 'Escola teste', bairro: 'Centro', cidade: 'Camboriu', imagem: '/teste.png', turnos: [{ id: 'noite', nivel: 'Ensino Fundamental', turno: 'Noite', auxilios: ['Alimentação', 'Transporte'] }] };
  const html = renderToStaticMarkup(React.createElement(CartaoEscola, { escola, nivel: 'Ensino Fundamental', leituraAtiva: true }));
  assert.ok(html.includes('AUXÍLIOS OFERECIDOS'));
  assert.ok(audio.includes('Auxílios oferecidos: Alimentação, Transporte'));
  assert.doesNotMatch(html + audio, /benef[ií]cio/i);
});

test('VLibras encontra os itens pelo novo titulo e preserva o agrupamento', () => {
  const { textoDaEscolaParaLibras, prepararTextoParaLibras } = carregar('app/components/BotaoVLibras.tsx', {
    require: nome => nome.startsWith('.') ? {} : require(nome),
  }, ['textoDaEscolaParaLibras', 'prepararTextoParaLibras']);
  const texto = textContent => ({ textContent });
  const secao = (titulo, itens) => ({ ...texto(titulo), nextElementSibling: { querySelectorAll: () => itens.map(texto) } });
  const cartao = {
    querySelector: () => texto('Escola teste'),
    querySelectorAll: () => [texto('Centro · Camboriu'), secao('TURNOS DISPONÍVEIS', ['Noite']), secao('AUXÍLIOS OFERECIDOS', ['Alimentação', 'Livros didáticos'])],
  };
  const traducao = prepararTextoParaLibras(textoDaEscolaParaLibras(cartao));
  assert.ok(traducao.includes('Auxílios oferecidos: Alimentação, LER DIDATICO'));
  assert.doesNotMatch(traducao, /benef[ií]cio/i);
});

test('etapas visuais, leitor de tela e VLibras recebem os mesmos nomes', () => {
  const Progresso = carregar('app/components/IndicadorProgresso.tsx').default;
  for (const [etapa, nome] of [[1, 'Nível'], [2, 'Escola'], [3, 'Contato']]) {
    const html = renderToStaticMarkup(React.createElement(Progresso, { etapa }));
    assert.ok(html.includes(`${etapa} de 3 · ${nome}`));
    assert.ok(html.includes(`aria-label="Etapa ${etapa} de 3: ${nome}"`));
    assert.ok(html.includes(`data-vlibras-texto="Etapa ${etapa} de 3: ${nome}"`));
  }
});

test('novo fluxo limpa a escolha anterior sem apagar preferências de acessibilidade', () => {
  const dados = new Map([
    ['eja-fluxo-iniciado', 'true'], ['eja-fluxo-nivel', 'anterior'],
    ['eja-fluxo-escola', 'anterior'], ['eja-fluxo-turno', 'anterior'],
    ['eja-escola-selecionada', 'anterior'],
    ['eja-audio-ativo', 'true'], ['eja-vlibras-ativo', 'true'],
  ]);
  const sessionStorage = { getItem: key => dados.get(key) ?? null, setItem: (key, value) => dados.set(key, value), removeItem: key => dados.delete(key) };
  carregar('app/lib/fluxo-navegacao.ts', { sessionStorage }).iniciarFluxo();
  assert.deepEqual([...dados], [['eja-audio-ativo', 'true'], ['eja-vlibras-ativo', 'true'], ['eja-fluxo-iniciado', 'true']]);
});

test('armazenamento indisponível não lança exceção no reinício', () => {
  const sessionStorage = { removeItem() { throw new Error('bloqueado'); } };
  assert.doesNotThrow(() => carregar('app/lib/fluxo-navegacao.ts', { sessionStorage }).iniciarFluxo());
});

function ambienteAssistivo(salvos = [], bloquearStorage = false) {
  const dados = new Map(salvos);
  const window = new EventTarget();
  const sessionStorage = {
    getItem(key) { if (bloquearStorage) throw Error('bloqueado'); return dados.get(key) ?? null; },
    setItem(key, valor) { if (bloquearStorage) throw Error('bloqueado'); dados.set(key, valor); },
  };
  const estado = carregar('app/components/estadoRecursosAssistivos.ts', { window, sessionStorage, CustomEvent });
  return { dados, window, sessionStorage, estado };
}

test('áudio e Libras desligam o anterior antes de ativar o próximo', () => {
  const { estado, window, dados } = ambienteAssistivo();
  const eventos = [];
  for (const evento of ['eja-acessibilidade', 'eja-vlibras-estado']) {
    window.addEventListener(evento, e => {
      assert.ok(!(dados.get('eja-audio-ativo') === 'true' && dados.get('eja-vlibras-ativo') === 'true'));
      eventos.push([evento, e.detail, estado.obterRecursoAtivo()]);
    });
  }
  let interrupcoes = 0;
  estado.registrarInterrupcaoAudio(() => { interrupcoes++; assert.equal(estado.obterRecursoAtivo(), null); });
  estado.definirRecursoAtivo('audio', true);
  estado.definirRecursoAtivo('libras', true);
  estado.definirRecursoAtivo('audio', true);
  assert.equal(interrupcoes, 1);
  assert.deepEqual(eventos, [
    ['eja-acessibilidade', true, 'audio'], ['eja-acessibilidade', false, null],
    ['eja-vlibras-estado', true, 'libras'], ['eja-vlibras-estado', false, null],
    ['eja-acessibilidade', true, 'audio'],
  ]);
});

test('sessão antiga conflitante e storage indisponível mantêm exclusividade', () => {
  const { estado, dados } = ambienteAssistivo([['eja-audio-ativo', 'true'], ['eja-vlibras-ativo', 'true']]);
  assert.equal(estado.obterRecursoAtivo(), 'libras');
  assert.equal(dados.get('eja-audio-ativo'), 'false');
  const bloqueado = ambienteAssistivo([], true).estado;
  bloqueado.definirRecursoAtivo('audio', true);
  bloqueado.definirRecursoAtivo('libras', true);
  assert.equal(bloqueado.obterRecursoAtivo(), 'libras');
});

test('erro tardio da voz não inicia síntese depois que Libras foi ativado', async () => {
  const ambiente = ambienteAssistivo();
  let rejeitarVoz;
  const requisicao = new Promise((_, rejeitar) => { rejeitarVoz = rejeitar; });
  let falas = 0;
  const Audio = class { setAttribute() {} load() {} pause() {} play() { return Promise.resolve(); } };
  Object.assign(ambiente.window, { setTimeout, clearTimeout, speechSynthesis: { cancel() {}, resume() {}, speak() { falas++; } } });
  const voz = carregar('app/components/useAudioDescricao.ts', {
    ...ambiente, Audio, Event, CustomEvent, URL, AbortController,
    process: { env: { NODE_ENV: 'development' } },
    fetch: () => requisicao,
    SpeechSynthesisUtterance: class {},
    require: nome => nome === './estadoRecursosAssistivos' ? ambiente.estado : nome === 'react'
      ? { useState: valor => [valor, () => {}], useEffect() {}, useCallback: fn => fn } : require(nome),
  });
  const pendente = voz.useAudioDescricao().alternar('Texto que ainda está carregando');
  await Promise.resolve();
  ambiente.estado.definirRecursoAtivo('libras', true);
  rejeitarVoz(Error('falha tardia'));
  await pendente;
  assert.equal(falas, 0);
  assert.equal(ambiente.estado.obterRecursoAtivo(), 'libras');
  assert.deepEqual(JSON.parse(JSON.stringify(voz.obterEstadoDaReproducao())), { carregando: false, tocando: false });
});

test('menu fica fora da abertura e permanece nas etapas do fluxo', () => {
  let pathname = '/';
  const Controles = carregar('app/components/ControlesGlobais.tsx', {
    require: nome => nome === 'next/navigation' ? { usePathname: () => pathname }
      : nome === './MenuAcessibilidade' ? { default: () => React.createElement('button', null, 'Acessibilidade') }
      : nome.startsWith('./Botao') ? { default: () => null } : require(nome),
  }).default;
  for (const rota of ['/', '/nivel', '/escolas', '/detalhes', '/admin']) {
    pathname = rota;
    const html = renderToStaticMarkup(React.createElement(Controles));
    assert.equal(html.includes('Acessibilidade'), rota !== '/' && rota !== '/admin', rota);
  }
});

test('abreviação ter vira terça-feira somente em dias de aula', () => {
  const voz = carregar('app/components/useAudioDescricao.ts', {
    require: nome => nome === './estadoRecursosAssistivos' ? {
      definirRecursoAtivo() {}, obterRecursoAtivo() { return null; },
      registrarInterrupcaoAudio() {}, armazenamentoDaSessao: { obter() { return null; } },
    } : nome === 'react' ? { useState: valor => [valor, () => {}], useEffect() {}, useCallback: fn => fn } : require(nome),
  });
  assert.equal(voz.textoParaAudio('Você precisa ter poucas faltas.'), 'Você precisa ter poucas faltas.');
  assert.equal(voz.diasDeAulaParaAudio('Seg - Ter'), 'segunda-feira até terça-feira');
});

test('fluxo público abre o WhatsApp e termina na conclusão sem formulário de dados pessoais', () => {
  const raiz = path.resolve(import.meta.dirname, '..');
  assert.equal(fs.existsSync(path.join(raiz, 'app/cadastro/page.tsx')), false);
  assert.equal(fs.existsSync(path.join(raiz, 'app/components/TelaCadastro.tsx')), false);
  const detalhes = fs.readFileSync(path.join(raiz, 'app/components/TelaDetalhes.tsx'), 'utf8');
  const conclusao = fs.readFileSync(path.join(raiz, 'app/components/TelaConclusao.tsx'), 'utf8');
  const paginaConclusao = fs.readFileSync(path.join(raiz, 'app/conclusao/page.tsx'), 'utf8');
  assert.match(detalhes, /Entrar em contato pelo WhatsApp/);
  assert.doesNotMatch(detalhes, /WhatsApp \(\{selecionado\.turno\}\)/);
  assert.match(detalhes, /rel="noopener noreferrer"/);
  assert.match(conclusao, /Agora é só conversar com a escola!/);
  assert.match(conclusao, /Abrir WhatsApp novamente/);
  assert.match(conclusao, /não garante a matrícula/);
  assert.doesNotMatch(conclusao, /mensagem (?:foi )?enviada|mensagem recebida/i);
  assert.match(paginaConclusao, /onReabrirWhatsApp/);
  assert.doesNotMatch(detalhes + conclusao + paginaConclusao, /CPF|nome_completo|enviarInscricao/);
});

test('relatório usa a impressão da página e possui layout A4 sem abrir guia vazia', () => {
  const raiz = path.resolve(import.meta.dirname, '..');
  const estatisticas = fs.readFileSync(path.join(raiz, 'app/admin/EstatisticasRelatorios.tsx'), 'utf8');
  const relatorio = fs.readFileSync(path.join(raiz, 'app/admin/RelatorioImpressao.tsx'), 'utf8');
  const exportacao = fs.readFileSync(path.join(raiz, 'app/lib/exportacao-administrativa.ts'), 'utf8');
  const css = fs.readFileSync(path.join(raiz, 'app/globals.css'), 'utf8');
  assert.match(estatisticas, /window\.print\(\)/);
  assert.doesNotMatch(estatisticas + exportacao, /window\.open|about:blank|document\.write/);
  assert.match(relatorio, /Avanço pelas etapas/);
  assert.match(relatorio, /Cliques no WhatsApp/);
  assert.match(relatorio, /Nenhuma interação agregada foi registrada/);
  assert.match(css, /@page \{ size: A4 portrait/);
  assert.match(css, /\[data-relatorio-impressao\]/);
});

test('site público explica o estado inicial sem escolas cadastradas', () => {
  const fonte = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'app/components/TelaEscolas.tsx'), 'utf8');
  assert.match(fonte, /As escolas serão cadastradas em breve/);
  assert.match(fonte, /Nenhuma escola cadastrada para este nível/);
  assert.match(fonte, /role="status"/);
});

test('galeria móvel separa o gesto horizontal da rolagem vertical e do mapa', () => {
  const fonte = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'app/components/TelaEscolas.tsx'), 'utf8');
  assert.match(fonte, /data-eja-galeria/);
  assert.match(fonte, /touch-pan-y/);
  assert.match(fonte, /setPointerCapture/);
  assert.match(fonte, /horizontal > vertical/);
  assert.match(fonte, /suprimirCliqueRef/);
  assert.match(fonte, /evento\.stopPropagation\(\)/);
  assert.doesNotMatch(fonte, /onTouchStart|onTouchEnd/);
});

test('detalhes reserva exatamente a altura observada do rodapé de contato', () => {
  const fonte = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'app/components/TelaDetalhes.tsx'), 'utf8');
  assert.match(fonte, /data-eja-conteudo-detalhes/);
  assert.match(fonte, /data-eja-rodape-contato/);
  assert.match(fonte, /ResizeObserver/);
  assert.match(fonte, /alturaRodapeContato \+ 24/);
  assert.doesNotMatch(fonte, /px-5 pb-40 pt-5/);
});

test('conclusão móvel usa fluxo natural e permite rolagem sem recortar o selo', () => {
  const tela = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'app/components/TelaConclusao.tsx'), 'utf8');
  const css = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'app/globals.css'), 'utf8');
  assert.match(tela, /overflow-x-hidden overflow-y-auto/);
  assert.match(tela, /sucesso-cartao[^\n]+overflow-visible/);
  assert.match(css, /\.sucesso-cartao \{[\s\S]*?min-height: 0;[\s\S]*?overflow: visible;/);
  assert.match(css, /\.sucesso-voltar \{ margin-top: 12px;/);
  assert.doesNotMatch(css, /\.sucesso-voltar \{ margin-top: auto/);
  assert.match(tela, /className="sucesso-icone-whatsapp"/);
  assert.match(css, /\.sucesso-selo \.sucesso-icone-whatsapp[\s\S]*?transform: none !important;/);
  assert.match(css, /\.sucesso-selo \.sucesso-icone-whatsapp svg \{ width: 100%; height: 100%; \}/);
});

test('texto institucional original permanece no cartão da escola', () => {
  const fonte = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'app/components/TelaEscolas.tsx'), 'utf8');
  assert.match(fonte, /Inscrição gratuita • Sem burocracia/);
  assert.doesNotMatch(fonte, /Consulta gratuita · contato direto com a escola/);
});

test('logos institucionais são servidas pelo próprio site', () => {
  const fonte = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'app/components/TelaAbertura.tsx'), 'utf8');
  assert.match(fonte, /src="\/marca\/vem-pra-eja-logo-2\.png"/);
  assert.match(fonte, /width=\{1882\}/);
  assert.match(fonte, /height=\{842\}/);
  assert.match(fonte, /src="\/logos\/logo_prefeitura\.png"/);
  assert.match(fonte, /src="\/logos\/logo_ifc\.png"/);
  assert.match(fonte, /data-eja-logos-institucionais/);
  assert.match(fonte, /bottom-\[max\(14px,env\(safe-area-inset-bottom\)\)\]/);
  assert.match(fonte, /eja-logo-onda/);
  assert.match(fonte, /eja-logo-marca/);
  assert.doesNotMatch(fonte, /eja-logo-halo/);
  assert.doesNotMatch(fonte, /drop-shadow/);
  assert.doesNotMatch(fonte, /mt-\[50px\]/);
  assert.doesNotMatch(fonte, /raw\.githubusercontent\.com/);
});

test('a área administrativa usa a versão da marca para fundos claros', () => {
  const fonte = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'app/admin/page.tsx'), 'utf8');
  assert.match(fonte, /src="\/marca\/vem-pra-eja-logo-3\.png"/);
  assert.match(fonte, />Área administrativa<\/h1>/);
  assert.match(fonte, /Entre com seu e-mail institucional\./);
  assert.equal([...fonte.matchAll(/<LockKeyhole/g)].length, 1);
  assert.doesNotMatch(fonte, />Login<\/h1>/);
});

test('login administrativo diferencia falhas sem enumerar contas', () => {
  const cliente = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'app/lib/admin-auth.ts'), 'utf8');
  const pagina = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'app/admin/page.tsx'), 'utf8');
  assert.match(cliente, /Não foi possível conectar ao servidor/);
  assert.match(cliente, /O servidor encontrou um problema interno/);
  assert.match(cliente, /erro\.status === 429/);
  assert.match(pagina, /Usuário ou senha inválidos/);
  assert.match(pagina, /mensagemDeErroDeLogin\(causa\)/);
  assert.doesNotMatch(cliente + pagina, /usuário não existe|e-mail não cadastrado/i);
});

test('a interface usa a paleta institucional da marca', () => {
  const css = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'app/globals.css'), 'utf8');
  for (const declaracao of [
    '--eja-cor-azul-principal: #1e5bb8',
    '--eja-cor-azul-escuro: #0f2f63',
    '--eja-cor-amarelo-marca: #ffb400',
    '--eja-cor-laranja-marca: #f08a02',
    '--eja-cor-verde-marca: #a7d86b',
    '--eja-cor-verde-escuro: #6ea83a',
    '--eja-cor-fundo-claro: #f4f8fd',
    '--eja-cor-texto-principal: #1a2433',
    '--eja-cor-texto-secundario: #5b6b82',
    '--eja-cor-borda: #d6e2f3',
    '--eja-cor-fundo-contraste: #000000',
  ]) assert.match(css, new RegExp(declaracao.replace('#', '\\#')));
  assert.match(css, /\.eja-acessibilidade-abrir[\s\S]*background: var\(--eja-cor-amarelo-marca\)/);
  assert.match(css, /\.eja-acessibilidade-cabecalho[\s\S]*background: var\(--eja-cor-azul-principal\)/);

  const telas = ['app/components/TelaDetalhes.tsx', 'app/components/TelaNivel.tsx', 'app/components/MapaEscolas.tsx']
    .map((arquivo) => fs.readFileSync(path.resolve(import.meta.dirname, '..', arquivo), 'utf8'))
    .join('\n');
  assert.doesNotMatch(telas, /#1e1b4b|#e5ddff|#0b75e8|#E44335/i);
});

test('a aplicação nova não importa funções de inscrição ou e-mail do legado', () => {
  const raiz = path.resolve(import.meta.dirname, '..');
  const arquivos = fs.readdirSync(path.join(raiz, 'app'), { recursive: true })
    .filter(nome => /\.(?:ts|tsx)$/.test(nome))
    .map(nome => fs.readFileSync(path.join(raiz, 'app', nome), 'utf8')).join('\n');
  assert.doesNotMatch(arquivos, /notificar-inscricao|reenviar-email|verificar-retornos-email|enviarInscricao/);
});

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
  for (const [etapa, nome] of [[1, 'Nível'], [2, 'Escola'], [3, 'Turno'], [4, 'Cadastro']]) {
    const html = renderToStaticMarkup(React.createElement(Progresso, { etapa }));
    assert.ok(html.includes(`${etapa} de 4 · ${nome}`));
    assert.ok(html.includes(`aria-label="Etapa ${etapa} de 4: ${nome}"`));
    assert.ok(html.includes(`data-vlibras-texto="Etapa ${etapa} de 4: ${nome}"`));
  }
  const concluido = renderToStaticMarkup(React.createElement(Progresso, { etapa: 4, concluido: true }));
  assert.ok(concluido.includes('Concluído'));
  assert.ok(concluido.includes('Cadastro concluído. Etapa 4 de 4.'));
});

test('nova inscrição limpa o fluxo anterior sem apagar preferências de acessibilidade', () => {
  const dados = new Map([
    ['eja-fluxo-iniciado', 'true'], ['eja-fluxo-nivel', 'anterior'],
    ['eja-fluxo-escola', 'anterior'], ['eja-fluxo-turno', 'anterior'],
    ['eja-escola-selecionada', 'anterior'], ['eja-inscricao-concluida', 'true'],
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
  for (const rota of ['/', '/nivel', '/escolas', '/detalhes', '/cadastro', '/sucesso', '/admin']) {
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

test('VLibras pode interagir com as abas do cadastro', () => {
  const { Secao } = carregar('app/components/TelaCadastro.tsx', {
    require: nome => nome.startsWith('.') ? { default: () => null, useAudioDescricao: () => ({}) } : require(nome),
  }, ['Secao']);
  const html = renderToStaticMarkup(React.createElement(Secao, {
    aberta: false, onAlternar() {}, icone: null, titulo: 'ENDEREÇO (opcional)',
  }, React.createElement('span', null, 'CEP')));
  assert.ok(html.includes('data-vlibras-acao="pronto"'));
  assert.ok(html.includes('aria-expanded="false"'));
  assert.ok(html.includes('ENDEREÇO (opcional)'));
});

test('conclusão não coloca dados pessoais ou escolares na URL', () => {
  const fonte = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'app/cadastro/page.tsx'), 'utf8');
  assert.match(fonte, /router\.push\("\/sucesso"\)/);
  assert.doesNotMatch(fonte, /\/sucesso\?(?:nome|escola|turno)=/);
});

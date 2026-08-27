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

function carregar(arquivo, ambiente = {}) {
  const filename = path.resolve(import.meta.dirname, '..', arquivo);
  const compilado = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
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

test('pinos próximos aparecem separados no espaço mobile sem mudar a lista original', () => {
  const { distribuirPinos } = carregar('app/lib/distribuir-pinos.ts');
  const pontos = [{ x: 198, y: 200 }, { x: 195, y: 225 }, { x: 190, y: 216 }, { x: 191, y: 212 }];
  const resultado = distribuirPinos(pontos, { esquerda: 32, direita: 358, topo: 258, base: 286 });
  for (let i = 0; i < resultado.length; i++) {
    assert.ok(resultado[i].x >= 32 && resultado[i].x <= 358);
    for (let j = 0; j < i; j++) assert.ok(Math.hypot(resultado[i].x - resultado[j].x, resultado[i].y - resultado[j].y) >= 54);
  }
  assert.equal(pontos[0].y, 200);
});

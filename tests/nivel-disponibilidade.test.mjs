import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);

function tela(buscar) {
  const estados = [];
  const referencias = [];
  let posicao = 0, referencia = 0;
  const escolhas = [], falas = [];
  const modulo = { exports: {} };
  const fonte = ts.transpileModule(fs.readFileSync('app/components/TelaNivel.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(fonte, { module: modulo, exports: modulo.exports, require: nome => {
    if (nome === 'react') return {
      useEffect: () => {},
      useRef: valor => referencias[referencia++] ?? (referencias[referencia - 1] = { current: valor }),
      useState: inicial => { const i = posicao++; if (!(i in estados)) estados[i] = inicial; return [estados[i], valor => { estados[i] = typeof valor === 'function' ? valor(estados[i]) : valor; }]; },
    };
    if (nome === '../lib/supabase-client') return { buscarEscolas: buscar };
    if (nome === './useAudioDescricao') return { textoParaAudio: x => x, useAudioDescricao: () => ({ ativo: true, falarAgora: x => falas.push(x), interromper() {} }) };
    if (nome === 'framer-motion') return { motion: { article: 'article', div: 'div', footer: 'footer' } };
    if (nome.startsWith('.')) return { default: () => null };
    return require(nome);
  } });
  const render = () => { posicao = referencia = 0; return modulo.exports.default({ onVoltar() {}, onEscolher: x => escolhas.push(x) }); };
  const elementos = (node, predicado) => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(n => elementos(n, predicado)) : [...(predicado(node) ? [node] : []), ...elementos(node.props?.children, predicado)];
  const botoes = () => elementos(render(), n => n.props?.['data-nivel-acao'] !== undefined);
  return { estados, escolhas, falas, botoes, render, elementos };
}

for (const [fundamental, medio] of [[false, true], [true, false], [false, false], [true, true]]) {
  test(`disponibilidade fundamental=${fundamental}, médio=${medio}`, async () => {
    const t = tela(async nivel => (nivel === 'Ensino Fundamental' ? fundamental : medio) ? [{ id: 1 }] : []);
    for (const [indice, disponivel] of [fundamental, fundamental, medio].entries()) {
      const antes = t.escolhas.length;
      await t.botoes()[indice].props.onClick();
      // O handler inicia a consulta assíncrona sem devolver sua Promise.
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(t.escolhas.length, antes + Number(disponivel));
      assert.equal(t.botoes()[indice].props['aria-disabled'], !disponivel);
      if (!disponivel) assert.match(t.estados[1].texto, /não há mais escolas disponíveis/);
    }
  });
}

test('reativação libera a opção e erro de rede não afirma ausência de escolas', async () => {
  let resposta = [];
  const t = tela(async () => { if (resposta instanceof Error) throw resposta; return resposta; });
  const clicar = async () => { t.botoes()[0].props.onClick(); await new Promise(resolve => setImmediate(resolve)); };
  await clicar();
  assert.equal(t.escolhas.length, 0);
  resposta = [{ id: 1 }];
  await clicar();
  assert.equal(t.escolhas.length, 1);
  resposta = new Error('offline');
  await clicar();
  assert.equal(t.escolhas.length, 1);
  assert.match(t.estados[1].texto, /Não foi possível consultar/);
  assert.equal(t.falas.at(-1), t.estados[1].texto);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const fonte = ts.transpileModule(fs.readFileSync('app/lib/whatsapp.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const modulo = { exports: {} };
vm.runInNewContext(fonte, { module: modulo, exports: modulo.exports, encodeURIComponent });
const { normalizarTelefoneBrasileiro, linkDoWhatsApp, mensagemDeContato } = modulo.exports;

test('normaliza telefone brasileiro para o padrão do wa.me', () => {
  assert.equal(normalizarTelefoneBrasileiro('(47) 98440-0475'), '5547984400475');
  assert.equal(normalizarTelefoneBrasileiro('+55 47 98440-0475'), '5547984400475');
  assert.equal(normalizarTelefoneBrasileiro('123'), null);
});

test('link usa wa.me e codifica mensagem contextual sem dados do visitante', () => {
  const mensagem = mensagemDeContato('Escola São José', 'Ensino Médio', 'Noite');
  const link = linkDoWhatsApp('(47) 98440-0475', 'Escola São José', 'Ensino Médio', 'Noite');
  assert.ok(link.startsWith('https://wa.me/5547984400475?text='));
  assert.equal(decodeURIComponent(link.split('?text=')[1]), mensagem);
  assert.doesNotMatch(mensagem, /CPF|e-mail|telefone do visitante|nome do visitante/i);
});

test('analytics do navegador não cria UUID nem armazenamento persistente', () => {
  const analytics = fs.readFileSync('app/lib/analytics.ts', 'utf8');
  assert.doesNotMatch(analytics, /randomUUID|localStorage|visitanteId|cookie/i);
  assert.match(analytics, /metricas-sessao/);
});

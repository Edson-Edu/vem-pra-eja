import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const fonte = ts.transpileModule(fs.readFileSync('app/lib/whatsapp.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const modulo = { exports: {} };
vm.runInNewContext(fonte, { module: modulo, exports: modulo.exports, encodeURIComponent });
const { normalizarTelefoneBrasileiro, linkDoWhatsApp, mensagemDeContato } = modulo.exports;

test('normaliza telefone brasileiro para o padrão do wa.me', () => {
  assert.equal(normalizarTelefoneBrasileiro('(47) 99999-9999'), '5547999999999');
  assert.equal(normalizarTelefoneBrasileiro('+55 47 99999-9999'), '5547999999999');
  assert.equal(normalizarTelefoneBrasileiro('123'), null);
});

test('link usa wa.me e codifica mensagem contextual sem dados do visitante', () => {
  const mensagem = mensagemDeContato('Escola São José', 'Ensino Médio', 'Noite');
  const link = linkDoWhatsApp('(47) 99999-9999', 'Escola São José', 'Ensino Médio', 'Noite');
  assert.ok(link.startsWith('https://wa.me/5547999999999?text='));
  assert.equal(decodeURIComponent(link.split('?text=')[1]), mensagem);
  assert.doesNotMatch(mensagem, /CPF|e-mail|telefone do visitante|nome do visitante/i);
});

test('contingência usa o número geral correto e se identifica como alternativa', () => {
  const { WHATSAPP_CONTINGENCIA, linkDoWhatsAppContingencia } = modulo.exports;
  assert.equal(WHATSAPP_CONTINGENCIA, '5547989074653');
  const link = linkDoWhatsAppContingencia('Escola Teste', 'Ensino Fundamental', 'Noite');
  assert.ok(link.startsWith('https://wa.me/5547989074653?text='));
  assert.match(decodeURIComponent(link.split('?text=')[1]), /sem WhatsApp disponível/);
});

test('WhatsApp da escola pode ficar vazio, mas valor preenchido deve ser válido', () => {
  const validacaoFonte = ts.transpileModule(fs.readFileSync('app/lib/validacao.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const validacaoModulo = { exports: {} };
  vm.runInNewContext(validacaoFonte, { module: validacaoModulo, exports: validacaoModulo.exports, require: nome => nome === './whatsapp' ? modulo.exports : require(nome) });
  const base = { id: null, sigla: '', nome: 'Escola Teste', cidade: 'Camboriú', bairro: 'Centro', rua: '', numero: '', complemento: '', whatsapp: '', latitude: -27, longitude: -48.6, niveis: ['Ensino Fundamental'], fotos: [], ativa: true, turnos: [{ id: 'novo', nivel: 'Ensino Fundamental', turno: 'Noite', inicio: '19:00', fim: '22:00', diaInicio: 'Segunda', diaFim: 'Sexta', comoFunciona: 'Aulas presenciais.', beneficios: [] }] };
  assert.equal(validacaoModulo.exports.escolaAdministrativaSchema.safeParse(base).success, true);
  assert.equal(validacaoModulo.exports.escolaAdministrativaSchema.safeParse({ ...base, whatsapp: '123' }).success, false);
});

test('analytics do navegador não cria UUID nem armazenamento persistente', () => {
  const analytics = fs.readFileSync('app/lib/analytics.ts', 'utf8');
  assert.doesNotMatch(analytics, /randomUUID|localStorage|visitanteId|cookie/i);
  assert.match(analytics, /metricas-sessao/);
});

test('número anteriormente provisório não permanece no runtime nem na documentação', () => {
  const arquivos = ['app/lib/whatsapp.ts', 'app/components/TelaDetalhes.tsx', 'README.md', 'docs/FLUXO-DE-DADOS.md'];
  const conteudo = arquivos.map(arquivo => fs.readFileSync(arquivo, 'utf8')).join('\n');
  assert.doesNotMatch(conteudo, /5547984400475/);
});

test('migration cria estrutura sem inserir escolas fictícias', () => {
  const sql = fs.readFileSync('database/migrations/001_initial.sql', 'utf8');
  assert.match(sql, /create table if not exists public\.escolas/);
  assert.doesNotMatch(sql, /insert\s+into\s+public\.escolas/i);
  assert.doesNotMatch(sql, /5547984400475|5547989074653/);
});

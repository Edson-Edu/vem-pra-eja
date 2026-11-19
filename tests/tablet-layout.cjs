const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const admin = read('app/admin/PainelAdministrativo.tsx');
const detalhes = read('app/components/TelaDetalhes.tsx');
const mapa = read('app/components/MapaEscolas.tsx');
const css = read('app/globals.css');

assert.match(admin, /matchMedia\("\(min-width: 768px\)"\)/, 'painel deve bloquear telas abaixo de 768 px');
assert.match(admin, /disponível somente em computadores/, 'painel deve explicar o bloqueio móvel');
assert.match(detalhes, /sm:grid-cols|sm:gap|sm:text/, 'detalhes deve manter adaptações para telas intermediárias');
assert.match(detalhes, /fixed inset-x-0 bottom-0/, 'ação de contato deve permanecer alcançável no celular');
assert.match(detalhes, /ResizeObserver/, 'conteúdo deve reservar a altura real da ação fixa');
assert.match(mapa, /window\.innerWidth < 768/, 'mapa deve ter enquadramento específico para celular');
assert.match(mapa, /ResizeObserver/, 'mapa deve reagir a mudanças de viewport e painéis');
assert.match(mapa, /keepBuffer: 8/, 'mapa deve preservar a margem original de tiles durante zoom e arraste');
assert.match(css, /@media[^\{]*\(min-width: 768px\)/, 'CSS deve possuir breakpoint de tablet');
assert.match(css, /\.sucesso-voltar \{ margin-top: 12px/, 'conclusão móvel não deve empurrar o botão com espaço artificial');
assert.equal(fs.existsSync(path.join(root, 'app/cadastro/page.tsx')), false, 'rota de cadastro não pode retornar');

console.log('Contratos responsivos verificados para celular, tablet e painel desktop.');

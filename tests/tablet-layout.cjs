const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { chromium } = require('C:/Users/13095814950/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const baseline = path.join(root, '.codex-backups/tablet-baseline-20260902');
const css = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8');
const tabletCss = css.slice(css.indexOf('/* Tablet segue'), css.indexOf('@keyframes nivel-revelar-pergunta'));
assert.ok(tabletCss.startsWith('/* Tablet segue'));
const output = path.join(root, '.codex-backups/tablet-20260902');
fs.mkdirSync(output, { recursive: true });
function load(file, tablet) {
  let source = fs.readFileSync(file, 'utf8');
  if (tablet && file.endsWith('TelaCadastro.tsx')) source = source.replace('[enderecoAberto, setEnderecoAberto] = useState(false)', '[enderecoAberto, setEnderecoAberto] = useState(true)');
  const module = { exports: {} };
  const localRequire = name => {
    if (name.endsWith('/useAudioDescricao')) return { useAudioDescricao: () => ({ ativo: false, falarAgora() {}, interromper() {} }), textoParaAudio: s => s };
    if (name === 'framer-motion') return { motion: new Proxy({}, { get: (_, tag) => ({ initial, animate, transition, whileHover, whileTap, ...props }) => React.createElement(tag, props) }) };
    if (name.startsWith('.')) {
      const target = path.resolve(path.dirname(file), name);
      return load(fs.existsSync(target + '.tsx') ? target + '.tsx' : target + '.ts', tablet);
    }
    return require(name);
  };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText, { module, exports: module.exports, require: localRequire, process });
  return module.exports;
}
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/fixture') {
    const tablet = Number(url.searchParams.get('width')) >= 768;
    const escola = load(path.join(root, 'app/lib/escolas.ts'), tablet).escolas[0];
    const component = load(path.join(root, 'app/components', url.searchParams.get('name') === 'nivel' ? 'TelaNivel.tsx' : 'TelaCadastro.tsx'), tablet).default;
    const html = renderToStaticMarkup(React.createElement(component, { escola, turno: escola.turnos[0], onVoltar() {}, onEscolher() {}, onSucesso() {} }));
    const styles = fs.readdirSync(path.join(baseline, '_next/static/chunks')).filter(f => f.endsWith('.css')).map(f => `<link rel="stylesheet" href="/_next/static/chunks/${f}">`).join('');
    res.setHeader('Content-Type', 'text/html');
    res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${styles}</head><body>${html}</body></html>`);
    return;
  }
  let file = path.join(baseline, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (path.relative(baseline, file).startsWith('..')) { res.writeHead(403).end(); return; }
  if (!path.extname(file)) file = path.join(file, req.headers.rsc === '1' ? 'index.txt' : 'index.html');
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
  try { res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file)); }
  catch { res.writeHead(404).end(); }
});

async function main() {
  await new Promise(resolve => server.listen(3091, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const report = [];
  try {
    for (const [width, height] of [[390,844], [767,1024], [768,1024], [820,1180], [1024,768], [1024,1366], [1279,900], [1280,900], [1440,900]]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
      const page = await context.newPage();
      page.on('pageerror', error => console.error('PAGE:', error.message));
      page.on('console', message => { if (message.type() === 'error') console.error('CONSOLE:', message.text()); });
      page.on('response', response => { if (response.status() >= 400) console.error('HTTP:', response.status(), response.url()); });
      for (const name of ['nivel', 'cadastro']) {
        await page.goto(`http://127.0.0.1:3091/fixture?name=${name}&width=${width}`);
        await page.locator(name === 'nivel' ? '[data-nivel-opcao]' : 'form[novalidate]').first().waitFor().catch(async error => { console.error(page.url(), await page.locator('body').innerText()); throw error; });
        await page.waitForTimeout(200);
        const before = await page.screenshot({ fullPage: true });
        const style = await page.addStyleTag({ content: tabletCss });
        await page.waitForTimeout(100);
        const after = await page.screenshot({ fullPage: true, path: path.join(output, `${name}-${width}x${height}.png`) });
        const tablet = width >= 768 && width <= 1279;
        if (!tablet) assert.ok(before.equals(after), `${name} changed outside tablet at ${width}`);
        const layout = await page.evaluate(() => {
          const rect = el => el ? JSON.parse(JSON.stringify(el.getBoundingClientRect())) : null;
          const cards = [...document.querySelectorAll('[data-nivel-opcao]')].map(rect);
          const submit = document.querySelector('form > button:not([type])');
          return { overflow: document.documentElement.scrollWidth > innerWidth, cards, submit: rect(submit), form: rect(document.querySelector('form')), pageHeight: document.documentElement.scrollHeight };
        });
        assert.equal(layout.overflow, false, `${name} overflows at ${width}`);
        if (tablet && layout.cards.length) {
          for (let i = 1; i < layout.cards.length; i++) assert.ok(layout.cards[i].top >= layout.cards[i-1].bottom + 19);
          assert.ok(layout.cards.every(c => c.height >= 156));
        }
        if (tablet && layout.submit) assert.ok(layout.pageHeight - layout.submit.bottom < 130, 'Submit must stay near end');
        report.push({ name, width, height, unchanged: before.equals(after), ...layout });
        await style.evaluate(el => el.remove());
      }
      await context.close();
    }
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report.map(({name,width,height,unchanged}) => ({name,width,height,unchanged})), null, 2));
  } finally { await browser.close(); server.close(); }
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });

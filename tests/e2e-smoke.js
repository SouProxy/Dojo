'use strict';
/* Teste de fumaça da UI no Chromium (Playwright pré-instalado).
 * Uso: node tests/e2e-smoke.js [pasta-de-screenshots] */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, devices } = require('playwright');

const ROOT = path.join(__dirname, '../app/src/main/assets/www');
const OUT = process.argv[2];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.gif': 'image/gif' };

function serve() {
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

function assert(cond, msg) { if (!cond) throw new Error(`FALHOU: ${msg}`); console.log(`ok - ${msg}`); }

(async () => {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}/index.html`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const shot = async (name) => { if (OUT) await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false }); };

  await page.goto(base);
  await page.waitForSelector('text=Força pesada');
  assert(await page.locator('.card.hero >> text=Próximo · Dia 1').count() === 1, 'Dia 1 sugerido como próximo treino');
  const gifsOk = await page.$$eval('img', (imgs) => imgs.every((i) => i.complete && i.naturalWidth > 0));
  assert(gifsOk, 'todos os GIFs da tela inicial carregaram');
  await shot('01-inicio');

  // Começa o treino
  await page.click('text=▶ Começar treino');
  await page.waitForSelector('#session');
  assert(await page.locator('#session .ex-name', { hasText: 'Agachamento livre' }).count() === 1, 'sessão aberta com agachamento');
  const first = page.locator('#session .card').first();
  await first.locator('input[aria-label="Carga"]').first().fill('100');
  await first.locator('input[aria-label="Repetições"]').first().fill('6');
  await first.locator('button.check').first().click();
  await page.waitForSelector('#restbar');
  assert(await page.locator('#rest-label').textContent() === 'Descanso', 'descanso iniciou após concluir a série');
  await shot('02-sessao-descanso');

  // Séries seguintes usam prefill (placeholder) → só marcar
  for (let k = 1; k < 4; k++) await first.locator('button.check').nth(k).click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('dojo.v1')).active.entries[0].sets);
  assert(stored.every((s) => s.done && s.w === 100 && s.r === 6), 'prefill repetiu 100 kg × 6 nas séries seguintes');

  await page.click('.restbar >> text=Pular');
  await page.click('.session-top >> text=Finalizar');
  await page.click('.modal button:text-is("Finalizar")');
  await page.waitForSelector('text=Treino concluído');
  await shot('03-resumo');
  await page.click('.modal button:text-is("Fechar")');

  // Próxima sessão do Dia 1: progressão sugerida
  assert(await page.locator('.card.hero >> text=Próximo · Dia 2').count() === 1, 'próximo treino virou Dia 2');
  await page.click('text=Dia 1');
  await page.waitForSelector('#session');
  const sug = await page.locator('#session .suggest').first().textContent();
  assert(sug.includes('102,5 kg') && sug.includes('105 kg'), `sugestão de progressão: "${sug}"`);
  const ph = await page.locator('#session input[aria-label="Carga"]').first().getAttribute('placeholder');
  assert(ph === '102,5', 'campo de carga pré-preenchido com a nova carga');
  await shot('04-progressao');
  await page.click('#session >> text=Descartar');
  await page.click('.modal button:text-is("Descartar")');

  // Circuito (Dia 5)
  await page.click('text=Full body e condicionamento');
  await page.waitForSelector('text=Circuito · 4 voltas');
  assert(await page.locator('#session h3', { hasText: 'Volta' }).count() === 4, 'circuito com 4 voltas');
  await shot('05-circuito');
  await page.click('#session >> text=▶ Intervalos 20/40 ×6');
  await page.waitForSelector('#runner');
  assert((await page.locator('#run-phase').textContent()).includes('Prepare'), 'timer de intervalos abriu na preparação');
  await shot('06-intervalos');
  await page.click('#runner >> text=Parar');
  await page.click('.modal button:text-is("Parar")');
  await page.click('.session-top >> button[aria-label="Minimizar"]');

  // Info do exercício (modal com GIF + cues)
  await page.click('nav >> text=Treinos');
  await page.locator('.thumbs img').first().waitFor();
  await page.click('text=Toque para continuar.');
  await page.click('#session img >> nth=0');
  await page.waitForSelector('.modal img.big');
  await shot('07-exercicio');
  await page.evaluate(() => window.dojoBack());
  assert(await page.locator('.modal').count() === 0, 'botão voltar fecha o modal');

  // Abas
  await page.evaluate(() => window.dojoBack());
  for (const [tab, txt] of [['Timer', 'Cronômetro'], ['Progresso', 'Evolução por exercício'], ['Ajustes', 'Plano de treino']]) {
    await page.click(`nav >> text=${tab}`);
    await page.waitForSelector(`text=${txt}`);
    await shot(`08-${tab.toLowerCase()}`);
  }
  await page.click('nav >> text=Progresso');
  assert(await page.locator('svg.chart').count() === 1, 'gráfico de evolução renderizado');

  // XSS: import com payload deve ser rejeitado; nome no histórico é texto puro
  await page.click('nav >> text=Ajustes');
  await page.click('text=⇧ Importar backup');
  await page.fill('.modal textarea', JSON.stringify({ app: 'dojo', version: 1, plan: { days: [] }, history: [], challenge: [], settings: {} }));
  await page.click('.modal button:text-is("Importar")');
  await page.waitForSelector('#toast:not(.hidden)');
  assert((await page.locator('#toast').textContent()).includes('inválido'), 'backup malformado rejeitado');

  // Layout: sem rolagem horizontal
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assert(!overflow, 'sem rolagem horizontal no celular');

  assert(errors.length === 0, `sem erros de console/CSP (${errors.join(' | ')})`);
  await browser.close();
  srv.close();
  console.log('\nTodos os testes de UI passaram.');
})().catch((e) => { console.error(e); process.exit(1); });

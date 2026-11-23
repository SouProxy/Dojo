'use strict';
/* Backup automático em pasta: simula a ponte nativa do Android (DojoNative) no Chromium.
 * Cenário: ativa a pasta → treina → backup automático → "reinstala" (dados zerados) → restaura.
 * Uso: node tests/e2e-backup.js */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, devices } = require('playwright');

const ROOT = path.join(__dirname, '../app/src/main/assets/www');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.gif': 'image/gif', '.png': 'image/png' };
const L = require('../app/src/main/assets/www/js/logic.js');
const D = require('../app/src/main/assets/www/js/library.js');

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

// Ponte nativa falsa: registra o que o app envia; o teste responde como o Android responderia.
const fakeBridge = () => {
  window.__sent = [];
  window.DojoNative = { postMessage: (m) => window.__sent.push(JSON.parse(m)), onmessage: null };
  window.__reply = (o) => window.DojoNative.onmessage({ data: JSON.stringify(o) });
};

(async () => {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}/index.html`;
  const browser = await chromium.launch();
  const errors = [];
  const newPage = async () => {
    const ctx = await browser.newContext({ ...devices['Pixel 7'] });
    await ctx.addInitScript(fakeBridge);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    return { ctx, page };
  };
  const sent = (page, type) => page.evaluate((t) => window.__sent.filter((m) => m.type === t), type);

  // ---------------------------------------------------------------- celular "antigo"
  const a = await newPage();
  let page = a.page;
  await page.goto(base);
  await page.waitForSelector('text=Bem-vindo ao Dojo');
  assert((await sent(page, 'backupStatus')).length === 1, 'app pergunta o status do backup ao abrir');
  await page.evaluate(() => window.__reply({ type: 'backupStatus', configured: false }));
  await page.click('text=Continuar com Toji');
  await page.click('nav >> text=Ajustes');
  await page.waitForSelector('text=Desativado');
  await page.click('button:text-is("Escolher pasta")');
  assert((await sent(page, 'pickBackupFolder')).length === 1, 'botão pede ao Android para escolher a pasta');
  await page.evaluate(() => window.__reply({ type: 'backupStatus', configured: true, name: 'Dojo' }));
  await page.waitForSelector('text=Ativo · pasta “Dojo”');
  assert(true, 'Ajustes mostra o backup ativo e a pasta');

  // treina e finaliza → backup automático
  await page.click('nav >> text=Treinos');
  await page.click('text=▶ Começar treino');
  const card = page.locator('#session .card').first();
  await card.locator('input[aria-label="Carga"]').first().fill('80');
  await card.locator('input[aria-label="Repetições"]').first().fill('5');
  await card.locator('button.check').first().click();
  await page.click('.restbar >> text=Pular');
  await page.click('.session-top >> text=Finalizar');
  await page.click('.modal button:text-is("Finalizar")');
  await page.waitForSelector('text=Treino concluído');
  await page.waitForTimeout(100);
  const backups = await sent(page, 'autoBackup');
  assert(backups.length >= 1, 'treino finalizado dispara backup automático');
  const content = backups[backups.length - 1].content;
  const parsed = JSON.parse(content);
  const v = L.validateBackup(parsed, D.EXERCISES);
  assert(v.ok && v.data.history.length === 1 && v.data.history[0].entries[0].sets[0].w === 80, 'backup gravado é válido e contém o treino');
  await page.evaluate(() => window.__reply({ type: 'autoBackup', ok: true, at: Date.now() }));
  await page.click('.modal button:text-is("Fechar")');
  await page.click('nav >> text=Ajustes');
  assert(!(await page.textContent('main')).includes('ainda não feito'), 'Ajustes mostra a hora do último backup');

  // sem nada novo, ir para segundo plano não regrava (bateria)
  const before = (await sent(page, 'autoBackup')).length;
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  assert((await sent(page, 'autoBackup')).length === before, 'sem alterações, segundo plano não regrava o backup');
  await a.ctx.close();

  // ---------------------------------------------------------------- "reinstalação": dados zerados
  const b = await newPage();
  page = b.page;
  await page.goto(base);
  await page.waitForSelector('text=Já usava o Dojo? Restaurar backup');
  await page.click('text=Já usava o Dojo? Restaurar backup');
  const pick = await sent(page, 'pickBackupFolder');
  assert(pick.length === 1 && pick[0].restore === true, 'primeiro uso oferece restaurar da pasta');
  await page.evaluate((c) => {
    window.__reply({ type: 'backupStatus', configured: true, name: 'Dojo' });
    window.__reply({ type: 'import', content: c, source: 'folder' });
  }, content);
  await page.click('.modal button:text-is("Importar")');
  await page.waitForSelector('#toast:has-text("Backup importado")');
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('dojo.v1')));
  assert(restored.history.length === 1 && restored.history[0].entries[0].sets[0].w === 80, 'treino e progresso restaurados após reinstalar');
  assert(await page.locator('text=Próximo · Dia 2').count() === 1, 'app continua do ponto certo (próximo treino: Dia 2)');
  await b.ctx.close();

  assert(errors.length === 0, `sem erros de JS (${errors.join(' | ')})`);
  await browser.close();
  srv.close();
  console.log('\nBackup automático: todos os testes passaram.');
})().catch((e) => { console.error(e); process.exit(1); });

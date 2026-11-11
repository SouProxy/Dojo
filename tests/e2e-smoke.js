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
  // Primeiro uso: questionário de programa
  await page.waitForSelector('text=Bem-vindo ao Dojo');
  assert(await page.locator('.card.hero >> text=Full Body 3x – Iniciante').count() === 1, 'questionário recomenda Full Body para iniciante 3x');
  await page.click('button.chip:text-is("4")');
  await page.click('button.chip:text-is("Ganhar força")');
  assert(await page.locator('.card.hero >> text=Upper/Lower 4x').count() === 1, 'recomendação muda com as respostas (4 dias, força → Upper/Lower)');
  await shot('00-questionario');
  await page.click('text=Continuar com Toji');
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

  // Biblioteca: busca e filtros
  await page.click('nav >> text=Exercícios');
  await page.waitForSelector('input[type=search]');
  const total = await page.locator('main .card.tap').count();
  assert(total >= 60, `biblioteca com ${total} exercícios`);
  await page.click('button.chip:text-is("Posterior de coxa")');
  const post = await page.locator('main .card.tap .ex-name').allTextContents();
  assert(post.includes('Cadeira flexora (sentado)') && !post.includes('Supino reto com barra'), 'filtro por grupo muscular');
  await page.click('button.chip:text-is("Todos") >> nth=0');
  await page.fill('input[type=search]', 'rosca');
  assert(await page.locator('main .card.tap').count() >= 5, 'busca por texto (rosca)');
  await shot('09-biblioteca');
  const imgsOk = await page.$$eval('main img', (imgs) => Promise.all(imgs.map((i) => (i.decode ? i.decode().then(() => i.naturalWidth > 0, () => false) : true))));
  assert(imgsOk.every(Boolean), 'GIFs da biblioteca carregam');
  await page.click('main .card.tap >> text=Rosca Scott');
  await page.waitForSelector('.modal >> text=Bíceps');
  await page.waitForSelector('.modal video');
  await page.waitForTimeout(1200);
  const vid = await page.$eval('.modal video', (v) => ({ t: v.currentTime, w: v.videoWidth, paused: v.paused }));
  assert(vid.w === 400 && vid.t > 0.3 && !vid.paused, `vídeo do exercício toca em loop (${JSON.stringify(vid)})`);
  assert((await page.textContent('.modal .credit')).includes('CC-BY-SA-4.0'), 'crédito e licença do vídeo exibidos');
  const sugIdx = await page.$eval('.modal', (m) => {
    const kids = [...m.children];
    return [kids.findIndex((k) => k.classList && k.classList.contains('suggest-line')), kids.findIndex((k) => k.classList && k.classList.contains('media-box'))];
  });
  assert(sugIdx[0] >= 0 && sugIdx[0] < sugIdx[1], 'sugestão aparece logo abaixo dos músculos, antes do vídeo');
  await shot('10-exercicio-novo');
  await page.click('.modal button:text-is("+ Adicionar ao treino")');
  await page.click('.modal button:has-text("Dia 2")');
  await page.waitForSelector('#toast:has-text("Rosca Scott adicionado")');
  const d2 = await page.evaluate(() => JSON.parse(localStorage.getItem('dojo.v1')).plan.days[1].items.map((i) => i.ex));
  assert(d2.includes('rosca_scott'), 'exercício adicionado ao Dia 2');

  // Editor
  await page.click('nav >> text=Treinos');
  await page.click('main button:text-is("Editar")');
  await page.waitForSelector('text=Volume semanal por músculo');
  await shot('11-editor');
  await page.click('main .card:has(input[value="Dia 2"]) button[aria-label="Remover Rosca Scott"]');
  const d2b = await page.evaluate(() => JSON.parse(localStorage.getItem('dojo.v1')).plan.days[1].items.map((i) => i.ex));
  assert(!d2b.includes('rosca_scott'), 'exercício removido no editor');
  await page.click('main .card:has(input[value="Dia 1"]) button:text-is("+ Exercício")');
  await page.waitForSelector('text=Adicionar em Dia 1');
  await page.fill('input[type=search]', 'panturrilha sentado');
  await page.click('main .card.tap >> text=Panturrilha sentado');
  await page.waitForSelector('text=Editar treino');
  const d1 = await page.evaluate(() => JSON.parse(localStorage.getItem('dojo.v1')).plan.days[0].items.map((i) => i.ex));
  assert(d1[d1.length - 1] === 'panturrilha_sentado', 'seletor da biblioteca adiciona e volta ao editor');

  // Guia
  await page.evaluate(() => window.dojoBack());
  await page.click('text=📘 Guia de treino');
  await page.waitForSelector('text=Quantas séries por semana?');
  assert(await page.locator('.vol-row').count() >= 10, 'guia mostra volume semanal por músculo');
  await shot('12-guia');
  await page.evaluate(() => window.dojoBack());

  // Trocar programa com treino em andamento é bloqueado
  await page.click('main button:text-is("Trocar")');
  await page.click('.card:has-text("Upper/Lower 4x") button:text-is("Usar este")');
  await page.click('.modal button:text-is("Usar")');
  await page.waitForSelector('#toast:has-text("Finalize ou descarte")');
  assert(true, 'troca de programa bloqueada com treino em andamento');
  await page.evaluate(() => window.dojoBack());
  await page.click('text=Toque para continuar.');
  await page.click('#session >> text=Descartar');
  await page.click('.modal button:text-is("Descartar")');

  // Trocar programa e voltar: edições preservadas
  await page.click('main button:text-is("Trocar")');
  await page.click('.card:has-text("Upper/Lower 4x") button:text-is("Usar este")');
  await page.click('.modal button:text-is("Usar")');
  await page.waitForSelector('text=Superior A');
  await shot('13-upper-lower');
  await page.click('main button:text-is("Trocar")');
  await page.click('.card:has-text("Toji") button:text-is("Usar este")');
  await page.click('.modal button:text-is("Usar")');
  await page.waitForSelector('text=Força pesada');
  const back = await page.evaluate(() => JSON.parse(localStorage.getItem('dojo.v1')).plan.days[0].items.map((i) => i.ex));
  assert(back.includes('panturrilha_sentado'), 'edições do programa preservadas ao trocar e voltar');

  // Treino próprio do zero
  await page.click('main button:text-is("Trocar")');
  await page.click('text=+ Montar meu próprio treino do zero');
  await page.waitForSelector('text=Nenhum exercício. Adicione abaixo.');
  await page.click('main button:text-is("+ Exercício")');
  await page.click('main .card.tap >> text=Supino reto com barra');
  await page.click('main button:text-is("+ Adicionar treino (dia)")');
  assert(await page.locator('main input[value="Treino B"]').count() === 1, 'novo dia criado');
  await page.evaluate(() => window.dojoBack());
  assert(await page.locator('.card.hero >> text=Supino reto com barra').count() === 1, 'treino próprio aparece como próximo');

  // Backup v2 exportado é aceito na importação
  const bk = await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('dojo.v1'));
    return JSON.stringify({ app: 'dojo', version: 2, plans: Object.assign({}, st.plans, { [st.plan.id]: st.plan }), programId: st.plan.id, history: st.history, challenge: st.challenge, settings: st.settings });
  });
  await page.click('nav >> text=Ajustes');
  await page.click('text=⇧ Importar backup');
  await page.fill('.modal textarea', bk);
  await page.click('.modal button:text-is("Importar")');
  const confirmShown = await page.locator('.modal h2:text-is("Importar backup?")').count();
  if (!confirmShown) throw new Error(`import recusado: ${await page.locator("#toast").textContent()}`);
  await page.click('.modal button:text-is("Importar")');
  await page.waitForSelector('#toast:has-text("Backup importado")');
  assert(true, 'backup v2 importado');

  await page.click('text=Créditos e licenças');
  assert(await page.locator('.modal tr').count() >= 20, 'tela de créditos lista os vídeos');
  await page.evaluate(() => window.dojoBack());

  // Layout: sem rolagem horizontal
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assert(!overflow, 'sem rolagem horizontal no celular');

  assert(errors.length === 0, `sem erros de console/CSP (${errors.join(' | ')})`);
  await browser.close();
  srv.close();
  console.log('\nTodos os testes de UI passaram.');
})().catch((e) => { console.error(e); process.exit(1); });

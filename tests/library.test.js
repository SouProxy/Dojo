'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const D = require('../app/src/main/assets/www/js/library.js');
const L = require('../app/src/main/assets/www/js/logic.js');

const GIFS = path.join(__dirname, '../app/src/main/assets/www/gifs');

test('todo exercício tem grupo, equipamento, nível, padrão, dicas e GIF existente', () => {
  for (const [id, ex] of Object.entries(D.EXERCISES)) {
    assert.ok(D.GROUPS[ex.group], `${id}: grupo`);
    assert.ok(ex.equip.length && ex.equip.every((e) => D.EQUIP[e]), `${id}: equipamento`);
    assert.ok(D.LEVELS[ex.level], `${id}: nível`);
    assert.ok(ex.def && ex.def.sets >= 1, `${id}: padrão`);
    assert.ok(ex.cues.length >= 2, `${id}: dicas`);
    for (const g of ex.gifs) assert.ok(fs.existsSync(path.join(GIFS, `${g}.gif`)), `${id}: gif ${g}`);
  }
  assert.ok(Object.keys(D.EXERCISES).length >= 80);
});

test('todos os grupos musculares têm exercícios', () => {
  for (const g of Object.keys(D.GROUPS)) {
    assert.ok(Object.values(D.EXERCISES).some((e) => e.group === g), g);
  }
});

test('programas são válidos, com uids únicos e exercícios existentes', () => {
  const uids = new Set();
  const dayIds = new Set();
  for (const p of D.PROGRAMS) {
    assert.ok(L.validPlan(p), p.id);
    assert.ok(p.daysPerWeek >= p.days.length || p.id === 'abc', p.id);
    for (const d of p.days) {
      assert.ok(!dayIds.has(d.id), `dia duplicado ${d.id}`);
      dayIds.add(d.id);
      for (const i of d.items) {
        assert.ok(D.EXERCISES[i.ex], i.ex);
        assert.ok(!uids.has(i.uid), `uid duplicado ${i.uid}`);
        uids.add(i.uid);
      }
    }
  }
});

test('programas de academia ficam na faixa de volume recomendada (≥ 6 séries/semana nos grupos grandes)', () => {
  for (const id of ['fullbody3', 'upperlower', 'abcd', 'ppl']) {
    const p = D.PROGRAMS.find((x) => x.id === id);
    const vol = L.weeklyVolume(p, D.EXERCISES);
    for (const g of ['peito', 'costas', 'quadriceps', 'posterior', 'ombros']) {
      assert.ok((vol[g] || 0) >= 6, `${id}/${g}: ${vol[g]}`);
    }
  }
  const ppl = L.weeklyVolume(D.PROGRAMS.find((x) => x.id === 'ppl'), D.EXERCISES);
  assert.ok(ppl.peito >= 12 && ppl.peito <= 26, `ppl peito ${ppl.peito}`);
});

test('recomendação de programa', () => {
  assert.equal(D.recommend({ days: 3, level: 'iniciante', place: 'academia', goal: 'hipertrofia' }), 'fullbody3');
  assert.equal(D.recommend({ days: 4, level: 'intermediario', place: 'academia', goal: 'forca' }), 'phul');
  assert.equal(D.recommend({ days: 4, level: 'avancado', place: 'academia', goal: 'forca' }), 'powerlifting');
  assert.equal(D.recommend({ days: 3, level: 'intermediario', place: 'academia', goal: 'forca' }), 'forca5x5');
  assert.equal(D.recommend({ days: 5, level: 'intermediario', place: 'academia', goal: 'hipertrofia' }), 'classico5');
  assert.equal(D.recommend({ days: 5, level: 'avancado', place: 'academia', goal: 'hipertrofia' }), 'abcde_av');
  assert.equal(D.recommend({ days: 6, level: 'avancado', place: 'academia', goal: 'hipertrofia' }), 'split6');
  assert.equal(D.recommend({ days: 6, level: 'intermediario', place: 'academia', goal: 'hipertrofia' }), 'ppl');
  assert.equal(D.recommend({ days: 3, level: 'iniciante', place: 'casa', goal: 'hipertrofia' }), 'casa');
  assert.equal(D.recommend({ days: 3, level: 'iniciante', place: 'halteres', goal: 'hipertrofia' }), 'halteres');
  for (const days of [2, 3, 4, 5, 6]) for (const level of Object.keys(D.LEVELS)) for (const place of Object.keys(D.PLACES)) {
    for (const goal of ['hipertrofia', 'forca', 'condicionamento']) {
      assert.ok(D.PROGRAMS.some((p) => p.id === D.recommend({ days, level, place, goal })));
    }
  }
});

test('volume semanal: principal conta 1, secundário 0,5; circuito conta voltas', () => {
  const plan = { days: [
    { id: 'x', name: 'A', title: 'A', mode: 'normal', items: [{ uid: 'a', ex: 'supino_reto', sets: 4, min: 6, max: 10, rest: 90 }] },
    { id: 'y', name: 'B', title: 'B', mode: 'circuit', rounds: 3, items: [{ uid: 'b', ex: 'flexao', sets: 9, min: 10, max: 10, rest: 0 }] },
  ] };
  const v = L.weeklyVolume(plan, D.EXERCISES);
  assert.equal(v.peito, 4 + 3);
  assert.equal(v.triceps, 2 + 1.5);
});

test('novo item usa o padrão do exercício e uid único', () => {
  const a = L.newItem('rosca_scott', D.EXERCISES.rosca_scott, 'dia', []);
  const b = L.newItem('rosca_scott', D.EXERCISES.rosca_scott, 'dia', [a]);
  assert.notEqual(a.uid, b.uid);
  assert.deepEqual([a.sets, a.min, a.max, a.rest], [3, 8, 12, 60]);
  assert.ok(L.newItem('esteira', D.EXERCISES.esteira, 'd', []).interval);
});

test('backup v2 válido e v1 é migrado', () => {
  const toji = D.PROGRAMS.find((p) => p.id === 'toji');
  const v2 = { app: 'dojo', version: 2, plans: { toji }, programId: 'toji', history: [], challenge: [], settings: {} };
  assert.ok(L.validateBackup(v2, D.EXERCISES).ok);
  const v1 = { app: 'dojo', version: 1, plan: toji, history: [], challenge: [], settings: {} };
  const r = L.validateBackup(v1, D.EXERCISES);
  assert.ok(r.ok);
  assert.equal(r.data.programId, 'toji');
  assert.equal(L.validateBackup({ ...v2, programId: 'nao-existe' }, D.EXERCISES).ok, false);
  assert.equal(L.validateBackup({ ...v2, plans: { '../x': { ...toji, id: '../x' } }, programId: '../x' }, D.EXERCISES).ok, false);
  assert.equal(L.validateBackup({ ...v2, plans: { toji: { ...toji, id: 'outro' } } }, D.EXERCISES).ok, false);
});

test('próximo dia ignora sessões de outros programas', () => {
  const fb = D.PROGRAMS.find((p) => p.id === 'fullbody3');
  const hist = [{ dayId: 'd3', startedAt: 9, finishedAt: 10 }, { dayId: fb.days[0].id, startedAt: 1, finishedAt: 2 }];
  assert.equal(L.nextDayIndex(fb, hist), 1);
});

test('backup com histórico real (timestamps) é aceito', () => {
  const toji = D.PROGRAMS.find((p) => p.id === 'toji');
  const now = Date.now();
  const history = [{ id: 'x1', dayId: 'd1', startedAt: now - 3600e3, finishedAt: now,
    entries: [{ uid: 'd1-agachamento', ex: 'agachamento', sets: [{ w: 100, r: 6, sec: null, m: null, done: true }] }] }];
  const r = L.validateBackup({ app: 'dojo', version: 2, plans: { toji }, programId: 'toji', history,
    challenge: [{ t: now, w: 10, r: 1 }], settings: { bodyweight: 80, step: 0.5, startDate: now } }, D.EXERCISES);
  assert.ok(r.ok, r.error);
  const bad = JSON.parse(JSON.stringify(history));
  bad[0].finishedAt = 'amanhã';
  assert.equal(L.validateBackup({ app: 'dojo', version: 2, plans: { toji }, programId: 'toji', history: bad, challenge: [], settings: {} }, D.EXERCISES).ok, false);
});

test('métricas, recordes e distribuição muscular', () => {
  const S = (w, r) => ({ w, r, sec: null, m: null, done: true });
  const day = new Date(2026, 10, 11, 10).getTime(); // quarta
  const hist = [
    { id: 'a', dayId: 'd1', startedAt: day - 7 * L.DAY_MS, finishedAt: day - 7 * L.DAY_MS + 1, entries: [{ uid: 'u', ex: 'agachamento', sets: [S(90, 8), S(90, 6)] }] },
    { id: 'b', dayId: 'd1', startedAt: day, finishedAt: day + 1, entries: [
      { uid: 'u', ex: 'agachamento', sets: [S(100, 6), S(100, 5), { ...S(120, 1), done: false }] },
      { uid: 'v', ex: 'supino_reto', sets: [S(60, 10)] }] },
  ];
  assert.equal(L.metricValue('heaviest', [S(100, 6), S(90, 8)]), 100);
  assert.equal(L.metricValue('volume', [S(100, 6), S(90, 8)]), 1320);
  assert.equal(L.metricValue('best_set', [S(100, 6), S(90, 8)]), 720);
  const pts = L.metricSeries(hist, 'agachamento', 'heaviest', 0);
  assert.deepEqual(pts.map((p) => [p.v, p.pr]), [[90, true], [100, true]]);
  assert.equal(L.metricSeries(hist, 'agachamento', 'heaviest', day - 1).length, 1, 'filtro de período');
  const recs = L.personalRecords(hist, 'agachamento', D.EXERCISES.agachamento);
  const bs = recs.find((r) => r.key === 'best_set');
  assert.deepEqual(bs.set, { w: 90, r: 8 }, '90×8 = 720 supera 100×6 = 600');
  assert.equal(recs.find((r) => r.key === 'heaviest').value, 100, 'série não concluída não conta');
  const wk = L.weekBounds(day, 0);
  assert.equal(new Date(wk.start).getDay(), 1, 'semana começa na segunda');
  assert.ok(day >= wk.start && day < wk.end);
  const m = L.muscleSets(hist, D.EXERCISES, wk.start, wk.end);
  assert.equal(m.total, 3);
  assert.equal(m.groups.quadriceps, 2);
  assert.equal(m.groups.peito, 1);
  assert.equal(m.groups.triceps, 0.5);
  assert.deepEqual(m.days, [2]);
  const prev = L.weekBounds(day, -1);
  assert.equal(L.muscleSets(hist, D.EXERCISES, prev.start, prev.end).total, 2);
  assert.deepEqual(L.metricOptions(D.EXERCISES.prancha).map((o) => o[0]), ['best_time', 'total_time']);
});

test('programas intensos de massa: volume alto nos grupos grandes e técnicas de intensidade', () => {
  for (const id of ['phul', 'maquinas5', 'arnold']) {
    const p = D.PROGRAMS.find((x) => x.id === id);
    const v = L.weeklyVolume(p, D.EXERCISES);
    for (const g of ['peito', 'costas', 'quadriceps', 'ombros']) assert.ok(v[g] >= 12, `${id}/${g}: ${v[g]}`);
    const notes = p.days.flatMap((d) => d.items.map((i) => i.note || '')).join(' ');
    assert.match(notes, /drop-set|rest-pause|Bi-set|série-topo/i, `${id}: técnicas`);
  }
});

test('programas de força usam poucas reps e descanso longo nos básicos', () => {
  for (const id of ['forca5x5', 'powerlifting', 'phul']) {
    const p = D.PROGRAMS.find((x) => x.id === id);
    const main = p.days.flatMap((d) => d.items).filter((i) => ['agachamento', 'supino_reto', 'terra'].includes(i.ex));
    assert.ok(main.length >= 2, id);
    assert.ok(main.some((i) => i.max <= 5 && i.rest >= 180), `${id}: série pesada`);
  }
  for (const p of D.PROGRAMS) assert.ok(D.FOCUS[p.focus], `${p.id}: foco`);
});

test('toda animação tem miniatura estática (listas não animam = menos bateria)', () => {
  const gifs = fs.readdirSync(GIFS).filter((f) => f.endsWith('.gif'));
  for (const g of gifs) {
    const png = path.join(__dirname, '../app/src/main/assets/www/thumbs', g.replace('.gif', '.png'));
    assert.ok(fs.existsSync(png), `miniatura de ${g}`);
    assert.ok(fs.statSync(png).size < 12 * 1024, `miniatura pequena: ${g}`);
  }
});

test('52 programas, nomes e ids únicos, todos os dias com exercícios', () => {
  assert.equal(D.PROGRAMS.length, 52);
  assert.equal(new Set(D.PROGRAMS.map((p) => p.id)).size, 52);
  assert.equal(new Set(D.PROGRAMS.map((p) => p.name)).size, 52);
  for (const p of D.PROGRAMS) {
    for (const d of p.days) {
      assert.ok(d.items.length >= 3, `${p.id}/${d.id}`);
      for (const i of d.items) {
        const t = D.EXERCISES[i.ex].type || 'reps';
        if (t === 'reps') assert.ok(i.max > 0 || (i.min === 0 && i.max === 0), `${p.id}/${i.ex}: faixa de reps ou até a falha`);
      }
    }
  }
  for (const days of [2, 3, 4, 5, 6]) assert.ok(D.PROGRAMS.some((p) => p.daysPerWeek === days), `${days} dias`);
});

test('treino clássico do usuário: segunda a sexta exatamente como pedido', () => {
  const p = D.PROGRAMS.find((x) => x.id === 'classico5');
  const fmt = (d) => d.items.map((i) => `${i.ex} ${L.prescription(i, D.EXERCISES[i.ex])}`);
  assert.deepEqual(p.days.map((d) => d.title), ['Peitoral', 'Costas', 'Pernas', 'Deltoides e trapézio', 'Braços']);
  assert.deepEqual(fmt(p.days[0]), ['supino_reto 4×6–8', 'supino_inclinado 4×10', 'supino_declinado 4×12', 'crossover 3×12', 'crucifixo 3×12']);
  assert.deepEqual(fmt(p.days[1]), ['barra_fixa 4×falha', 'remada_curvada 4×8', 'remada_cabo 4×12', 'pullover 4×10', 'terra 3×10']);
  assert.deepEqual(fmt(p.days[2]), ['agachamento 4×8', 'leg_press 4×10–12', 'stiff 4×8–10', 'cadeira_extensora 3×12', 'cadeira_flexora 3×12']);
  assert.deepEqual(fmt(p.days[3]), ['desenvolvimento 4×8', 'desenvolvimento_arnold 4×10', 'elevacao_lateral 3×12', 'encolhimento_barra 4×8', 'encolhimento 4×12']);
  assert.deepEqual(fmt(p.days[4]), ['paralelas 3×falha', 'triceps_frances 3×10', 'triceps_corda 3×12', 'rosca_direta 3×10', 'rosca_alternada 3×12', 'rosca_martelo 3×10']);
  const s6 = D.PROGRAMS.find((x) => x.id === 'split6');
  assert.deepEqual(s6.days.map((d) => d.title), ['Peito', 'Perna A – quadríceps', 'Braço', 'Costas', 'Perna B – posterior e glúteos', 'Ombros + abdômen']);
});

test('avançados são pesados de verdade: volume alto e falha/RIR nas notas', () => {
  for (const p of D.PROGRAMS.filter((x) => x.level === 'avancado' && x.place === 'academia' && x.focus === 'massa')) {
    const v = L.weeklyVolume(p, D.EXERCISES);
    const mult = p.daysPerWeek / p.days.length;
    for (const g of ['peito', 'costas', 'quadriceps']) assert.ok(v[g] * mult >= 12, `${p.id}/${g}: ${v[g] * mult}`);
    const perSession = p.days.reduce((a, d) => a + d.items.reduce((b, i) => b + i.sets, 0), 0) / p.days.length;
    assert.ok(perSession >= 18, `${p.id}: ${perSession} séries/sessão`);
    const notes = p.days.flatMap((d) => d.items.map((i) => i.note || '')).join(' ');
    assert.match(notes, /RIR 1/);
    assert.match(notes, /falha/);
  }
});

test('encontrar programa: escolhas coerentes com a recomendação e a lista', () => {
  for (const days of [2, 3, 4, 5, 6]) for (const level of Object.keys(D.LEVELS)) for (const place of Object.keys(D.PLACES)) {
    for (const goal of ['hipertrofia', 'forca', 'condicionamento']) {
      const a = { days, level, place, goal };
      const r = D.findPrograms(a);
      assert.ok(r.best, `${days}/${level}/${place}/${goal}`);
      if (!r.approx) {
        for (const p of [r.best, ...r.others]) assert.ok(D.matches(p, a), `${p.id} não deveria aparecer`);
        assert.equal(r.best.daysPerWeek, days, 'recomendação respeita os dias');
      }
      if (level === 'iniciante') assert.notEqual(r.best.level, 'avancado', 'iniciante nunca recebe avançado');
      assert.ok(r.best.place === place || (place === 'halteres' && r.best.place === 'casa'), 'respeita o local');
    }
  }
  const print = D.findPrograms({ days: 6, level: 'avancado', place: 'academia', goal: 'forca' });
  assert.equal(print.best.daysPerWeek, 6, 'caso do print: 6 dias, avançado, força → programa de 6 dias');
  assert.equal(D.findPrograms({ days: null, level: null, place: null, goal: null }).others.length, D.PROGRAMS.length - 1, 'sem escolhas: todos');
});

test('periodizado 26 semanas: plano exato e fases', () => {
  const p6 = D.PROGRAMS.find((x) => x.id === 'fh6');
  const p5 = D.PROGRAMS.find((x) => x.id === 'fh5');
  assert.equal(p6.days.length, 6);
  assert.equal(p5.days.length, 5);
  const mains = p6.days.flatMap((d) => d.items.filter((i) => i.main).map((i) => i.ex));
  assert.deepEqual(mains, ['supino_reto', 'barra_carga', 'remada_curvada', 'agachamento', 'desenvolvimento', 'terra']);
  assert.equal(L.prescription(p6.days[1].items[0], D.EXERCISES.barra_carga), '4×4–6', 'barra com carga em faixa de reps');
  // 5 dias: dia 5 removido e exercícios remanejados
  assert.ok(p5.days[0].items.some((i) => i.ex === 'triceps_corda'));
  assert.ok(p5.days[1].items.some((i) => i.ex === 'rosca_inclinada'));
  assert.ok(p5.days[3].items.some((i) => i.ex === 'puxada_alta'));
  // volume semanal dentro de ~12–20 nos grupos treinados 2x
  const v = L.weeklyVolume(p6, D.EXERCISES);
  for (const g of ['peito', 'quadriceps', 'posterior']) assert.ok(v[g] >= 12, `${g}: ${v[g]}`);
  // fases
  const ph = (w) => L.phaseInfo('fh26', w);
  assert.equal(ph(1).block.name, 'Base'); assert.equal(ph(1).rir, 3); assert.equal(ph(3).rir, 1);
  assert.ok(ph(4).deload && ph(8).deload && ph(24).deload && !ph(25).deload && !ph(26).deload);
  assert.equal(ph(9).block.name, 'Força'); assert.equal(ph(17).block.name, 'Pico');
  assert.ok(ph(25).block.taper); assert.ok(ph(26).block.test);
  const day1 = p6.days[0].items;
  const at = (w) => L.applyPhase(day1, ph(w));
  assert.deepEqual([at(1)[0].sets, at(1)[0].min, at(1)[0].max], [4, 6, 8]);
  assert.deepEqual([at(9)[0].sets, at(9)[0].min, at(9)[0].max], [5, 4, 5]);
  assert.deepEqual([at(17)[0].sets, at(17)[0].min, at(17)[0].max], [5, 2, 3]);
  assert.equal(at(17)[1].sets, 2, 'pico: acessório com 1 série a menos');
  assert.equal(at(4)[0].sets, 2, 'deload: metade das séries');
  assert.equal(at(4)[1].sets, 2);
  assert.deepEqual([at(26)[0].sets, at(26)[0].max], [1, 1], 'teste de 1RM');
  const terra = L.applyPhase(p6.days[5].items, ph(9))[0];
  assert.equal(terra.sets, 4, 'terra com uma série a menos que os outros principais');
  assert.deepEqual(L.loadRange(100, [80, 85], false, 2.5), [80, 85]);
  // semana pela data de início
  const start = new Date(2026, 0, 5, 9).getTime();
  assert.equal(L.planWeek({ periodization: 'fh26', startedAt: start }, start + 8 * 7 * L.DAY_MS).week, 9);
  assert.equal(L.planWeek({ periodization: 'fh26', startedAt: start }, start + 40 * 7 * L.DAY_MS).done, true);
  assert.equal(L.validPlan({ ...p6, periodization: 'inventado' }), false, 'backup com periodização desconhecida é rejeitado');
});

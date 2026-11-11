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
  assert.ok(Object.keys(D.EXERCISES).length >= 60);
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
  assert.equal(D.recommend({ days: 4, level: 'intermediario', place: 'academia', goal: 'forca' }), 'upperlower');
  assert.equal(D.recommend({ days: 6, level: 'avancado', place: 'academia', goal: 'hipertrofia' }), 'ppl');
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

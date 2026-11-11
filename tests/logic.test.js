'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../app/src/main/assets/www/js/logic.js');
const { EXERCISES, DEFAULT_PLAN } = require('../app/src/main/assets/www/js/data.js');

const squat = DEFAULT_PLAN.days[0].items[0]; // 4×4–6
const S = (w, r) => ({ w, r, sec: null, m: null, done: true });

test('todo item do plano aponta para um exercício e GIF existentes', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  for (const d of DEFAULT_PLAN.days) {
    for (const it of d.items) {
      assert.ok(EXERCISES[it.ex], it.ex);
      for (const g of EXERCISES[it.ex].gifs) {
        assert.ok(fs.existsSync(path.join(__dirname, '../app/src/main/assets/www/gifs', `${g}.gif`)), g);
      }
    }
  }
  assert.ok(L.validPlan(DEFAULT_PLAN));
});

test('prescrição formatada', () => {
  assert.equal(L.prescription(squat, EXERCISES.agachamento), '4×4–6');
  assert.equal(L.prescription(DEFAULT_PLAN.days[0].items[3], EXERCISES.afundo), '3×10 por perna');
  assert.equal(L.prescription(DEFAULT_PLAN.days[1].items[0], EXERCISES.barra_fixa), '4×máx');
  assert.equal(L.prescription(DEFAULT_PLAN.days[3].items[3], EXERCISES.prancha), '3×45s');
  assert.equal(L.prescription(DEFAULT_PLAN.days[4].items[0], EXERCISES.farmer), '30–40 m');
  assert.equal(L.prescription(DEFAULT_PLAN.days[4].items[1], EXERCISES.esteira), '20s forte / 40s leve ×6');
});

test('sobe 2,5–5% quando fecha todas as séries no topo da faixa', () => {
  const last = { sets: [S(100, 6), S(100, 6), S(100, 6), S(100, 6)] };
  const s = L.suggest(squat, EXERCISES.agachamento, last, { step: 0.5 });
  assert.equal(s.kind, 'up');
  assert.equal(s.weight, 102.5);
  assert.equal(s.weightHigh, 105);
});

test('mantém a carga se alguma série ficou abaixo do topo', () => {
  const last = { sets: [S(100, 6), S(100, 6), S(100, 5), S(100, 4)] };
  const s = L.suggest(squat, EXERCISES.agachamento, last, { step: 0.5 });
  assert.equal(s.kind, 'hold');
  assert.equal(s.weight, 100);
});

test('mantém a carga se faltou série', () => {
  const last = { sets: [S(100, 6), S(100, 6), S(100, 6)] };
  assert.equal(L.suggest(squat, EXERCISES.agachamento, last, {}).kind, 'hold');
});

test('incremento mínimo respeitado em cargas leves', () => {
  const item = DEFAULT_PLAN.days[3].items[1]; // elevação lateral 12–15
  const last = { sets: [S(8, 15), S(8, 15), S(8, 15)] };
  const s = L.suggest(item, EXERCISES.elevacao_lateral, last, { step: 1 });
  assert.equal(s.weight, 9);
  assert.ok(s.weightHigh >= s.weight);
});

test('barra fixa: meta de reps totais e carga após 12+', () => {
  const item = DEFAULT_PLAN.days[1].items[0];
  const a = L.suggest(item, EXERCISES.barra_fixa, { sets: [S(null, 8), S(null, 7), S(null, 6), S(null, 5)] }, {});
  assert.equal(a.kind, 'hold');
  assert.equal(a.target, 27);
  const b = L.suggest(item, EXERCISES.barra_fixa, { sets: [S(0, 12), S(0, 12), S(0, 13), S(0, 12)] }, {});
  assert.equal(b.kind, 'up');
  assert.equal(b.weight, 2.5);
  const c = L.suggest(item, EXERCISES.barra_fixa, { sets: [S(-20, 12), S(-20, 12), S(-20, 12), S(-20, 12)] }, {});
  assert.equal(c.weight, -17.5, 'reduz a assistência do graviton');
});

test('prancha: +5s quando fecha o tempo', () => {
  const item = DEFAULT_PLAN.days[3].items[3];
  const sets = [1, 2, 3].map(() => ({ w: null, r: null, sec: 45, m: null, done: true }));
  const s = L.suggest(item, EXERCISES.prancha, { sets }, {});
  assert.equal(s.kind, 'up');
  assert.equal(s.target, 50);
});

test('primeira vez', () => {
  assert.equal(L.suggest(squat, EXERCISES.agachamento, null, {}).kind, 'first');
});

test('lastEntry prioriza o mesmo item do plano e ignora séries não feitas', () => {
  const hist = [
    { id: 'a', dayId: 'd1', startedAt: 1, finishedAt: 2, entries: [{ uid: 'd1-agachamento', ex: 'agachamento', sets: [S(90, 6)] }] },
    { id: 'b', dayId: 'd1', startedAt: 5, finishedAt: 6, entries: [{ uid: 'd1-agachamento', ex: 'agachamento', sets: [{ ...S(95, 6), done: false }] }] },
  ];
  assert.equal(L.lastEntry(hist, 'd1-agachamento', 'agachamento').sets[0].w, 90);
});

test('e1RM (Epley) e estatísticas', () => {
  assert.equal(L.e1rm(100, 1), 100);
  assert.ok(Math.abs(L.e1rm(100, 6) - 120) < 1e-9);
  assert.equal(L.e1rm(0, 5), null);
  const st = L.sessionStats({ entries: [{ sets: [S(100, 5), S(100, 5), { ...S(100, 5), done: false }] }] });
  assert.deepEqual(st, { sets: 2, reps: 10, volume: 1000 });
});

test('recordes detectados', () => {
  const hist = [{ id: 'a', dayId: 'd1', startedAt: 1, finishedAt: 2, entries: [{ uid: 'x', ex: 'agachamento', sets: [S(100, 5)] }] }];
  const now = { id: 'b', dayId: 'd1', startedAt: 10, finishedAt: 20, entries: [{ uid: 'x', ex: 'agachamento', sets: [S(105, 5)] }] };
  const prs = L.prs(now, hist, EXERCISES, {});
  assert.equal(prs.length, 1);
  assert.equal(prs[0].ex, 'agachamento');
});

test('próximo dia e semana', () => {
  assert.equal(L.nextDayIndex(DEFAULT_PLAN, []), 0);
  assert.equal(L.nextDayIndex(DEFAULT_PLAN, [{ dayId: 'd5', startedAt: 1, finishedAt: 2 }]), 0);
  assert.equal(L.nextDayIndex(DEFAULT_PLAN, [{ dayId: 'd2', startedAt: 1, finishedAt: 2 }]), 2);
  const start = new Date(2026, 0, 5, 10).getTime();
  assert.equal(L.weekNumber(start, start), 1);
  assert.equal(L.weekNumber(start, start + 7 * L.DAY_MS), 2);
});

test('formatação', () => {
  assert.equal(L.fmtClock(65), '1:05');
  assert.equal(L.fmtClock(3725), '1:02:05');
  assert.equal(L.fmtRest(150), '2:30');
  assert.equal(L.fmtRest(120), '2 min');
  assert.equal(L.fmtKg(102.5), '102,5 kg');
  assert.equal(L.roundUp(102.4, 0.5), 102.5);
  assert.equal(L.roundUp(102.5, 0.5), 102.5);
});

test('validação de backup rejeita conteúdo malicioso ou malformado', () => {
  const good = { app: 'dojo', version: 1, plan: DEFAULT_PLAN, history: [], challenge: [], settings: { bodyweight: 80, step: 0.5 } };
  assert.ok(L.validateBackup(good, EXERCISES).ok);
  assert.equal(L.validateBackup(null).ok, false);
  assert.equal(L.validateBackup({ ...good, app: 'x' }).ok, false);
  assert.equal(L.validateBackup({ ...good, version: 2 }).ok, false);
  const badHist = { ...good, history: [{ id: 'a', dayId: 'd1', startedAt: 'ontem', entries: [] }] };
  assert.equal(L.validateBackup(badHist).ok, false);
  const badSet = { ...good, history: [{ id: 'a', dayId: 'd1', startedAt: 1, finishedAt: 2, entries: [{ uid: 'u', ex: 'agachamento', sets: [{ w: '<img src=x onerror=alert(1)>', r: 1, done: true }] }] }] };
  assert.equal(L.validateBackup(badSet).ok, false);
  const unknownEx = JSON.parse(JSON.stringify(good));
  unknownEx.plan.days[0].items[0].ex = '__proto__';
  assert.equal(L.validateBackup(unknownEx, EXERCISES).ok, false);
  const longName = JSON.parse(JSON.stringify(good));
  longName.plan.days[0].title = 'x'.repeat(5000);
  assert.equal(L.validateBackup(longName, EXERCISES).ok, false);
});

/* Regras puras (sem DOM): progressão, formatação, estatísticas, validação de backup.
 * Testadas com `node --test tests/`. */
(function (root) {
  'use strict';

  const DAY_MS = 24 * 60 * 60 * 1000;

  function typeOf(ex) { return (ex && ex.type) || 'reps'; }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function fmtClock(totalSec) {
    const s = Math.max(0, Math.round(totalSec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    return h > 0 ? `${h}:${pad2(m)}:${pad2(r)}` : `${m}:${pad2(r)}`;
  }

  function fmtRest(sec) {
    if (sec % 60 === 0) return `${sec / 60} min`;
    if (sec > 60) return fmtClock(sec);
    return `${sec}s`;
  }

  function fmtKg(x) {
    if (x === null || x === undefined || Number.isNaN(x)) return '–';
    const v = Math.round(x * 100) / 100;
    return `${String(v).replace('.', ',')} kg`;
  }

  function fmtNum(x, digits) {
    const v = Number(x.toFixed(digits === undefined ? 1 : digits));
    return String(v).replace('.', ',');
  }

  function range(min, max) { return min === max ? `${min}` : `${min}–${max}`; }

  function prescription(item, ex) {
    const t = typeOf(ex);
    let main;
    if (t === 'max') main = `${item.sets}×máx`;
    else if (t === 'time') main = `${item.sets}×${range(item.min, item.max)}s`;
    else if (t === 'distance') main = `${range(item.min, item.max)} m`;
    else if (t === 'interval') {
      const iv = item.interval || { work: 20, rest: 40, reps: 6 };
      main = `${iv.work}s forte / ${iv.rest}s leve ×${iv.reps}`;
    } else main = `${item.sets}×${range(item.min, item.max)}${ex.perSide ? ' por perna' : ''}`;
    return main;
  }

  function roundUp(x, step) {
    const s = step > 0 ? step : 0.5;
    return Math.round(Math.ceil(x / s - 1e-9) * s * 1000) / 1000;
  }

  function doneSets(entry) {
    return entry && Array.isArray(entry.sets) ? entry.sets.filter((s) => s && s.done) : [];
  }

  /** Último registro concluído deste item (por uid; se não houver, pelo exercício). */
  function lastEntry(history, uid, exId) {
    const sorted = (history || []).slice().sort((a, b) => b.startedAt - a.startedAt);
    for (const pass of ['uid', 'ex']) {
      for (const s of sorted) {
        const e = (s.entries || []).find((en) => (pass === 'uid' ? en.uid === uid : en.ex === exId));
        if (e && doneSets(e).length) return e;
      }
    }
    return null;
  }

  function maxOf(arr, f) {
    let best = null;
    for (const x of arr) {
      const v = f(x);
      if (typeof v === 'number' && !Number.isNaN(v) && (best === null || v > best)) best = v;
    }
    return best;
  }

  /**
   * Sugestão de progressão para a próxima sessão.
   * Regra do plano: fechou todas as séries no topo da faixa → sobe a carga 2,5–5%.
   */
  function suggest(item, ex, last, settings) {
    const step = (settings && settings.step) || 0.5;
    const t = typeOf(ex);
    if (!last) {
      if (t === 'interval') return { kind: 'first', text: 'Ajuste a velocidade dos tiros para um esforço forte de verdade.' };
      if (ex.load === 'load') return { kind: 'first', text: 'Primeira vez: escolha uma carga que deixe 1–2 reps na reserva.' };
      if (t === 'max') return { kind: 'first', text: 'Primeira vez: faça o máximo de reps limpas em cada série.' };
      return { kind: 'first', text: 'Primeira vez: foque na técnica.' };
    }
    const sets = doneSets(last);
    const complete = sets.length >= item.sets;
    const w = maxOf(sets, (s) => s.w);

    if (t === 'interval') {
      return { kind: 'hold', text: 'Completou? Na próxima, aumente um pouco a velocidade dos tiros.' };
    }
    if (t === 'time') {
      const ok = complete && sets.every((s) => (s.sec || 0) >= item.max);
      return ok
        ? { kind: 'up', target: item.max + 5, text: `Fechou ${item.max}s em todas: tente ${item.max + 5}s.` }
        : { kind: 'hold', text: `Busque ${item.max}s em todas as séries.` };
    }
    if (t === 'distance') {
      const ok = complete && sets.every((s) => (s.m || 0) >= item.max);
      if (ok && w) {
        const lo = Math.max(roundUp(w * 1.025, step), w + step);
        const hi = Math.max(roundUp(w * 1.05, step), lo);
        return { kind: 'up', weight: lo, weightHigh: hi, text: `Fechou ${item.max} m em todas: suba para ${fmtKg(lo)}–${fmtKg(hi)}.` };
      }
      return { kind: 'hold', weight: w, text: w ? `Mantenha ${fmtKg(w)} e complete ${item.max} m em todas.` : `Complete ${item.max} m em todas as voltas.` };
    }
    if (t === 'max') {
      const total = sets.reduce((a, s) => a + (s.r || 0), 0);
      if (complete && sets.every((s) => (s.r || 0) >= 12)) {
        const base = w || 0;
        const next = base < 0 ? Math.min(0, base + 2.5) : base + 2.5;
        return { kind: 'up', weight: next, text: `12+ reps em todas: ${base < 0 ? 'reduza a assistência' : 'adicione carga'} (${fmtKg(next)}).` };
      }
      return { kind: 'hold', weight: w, target: total + 1, text: `Último total: ${total} reps. Meta: ${total + 1}+ reps.` };
    }
    // reps
    const top = complete && sets.every((s) => (s.r || 0) >= item.max);
    if (ex.load === 'none') {
      return top
        ? { kind: 'up', text: `Fechou ${item.max} em todas: deixe mais lento/explosivo ou some 1–2 reps.` }
        : { kind: 'hold', text: `Busque ${item.max} reps em todas as séries.` };
    }
    if (ex.load === 'bw' && (w === null || w === 0)) {
      return top
        ? { kind: 'up', weight: 2.5, text: `Fechou ${item.max} em todas: adicione carga (+2,5 kg).` }
        : { kind: 'hold', weight: w, text: `Busque ${item.max} reps em todas as séries.` };
    }
    if (top && w !== null) {
      const lo = Math.max(roundUp(w * 1.025, step), w + step);
      const hi = Math.max(roundUp(w * 1.05, step), lo);
      return { kind: 'up', weight: lo, weightHigh: hi, text: `Topo da faixa em todas! Suba para ${fmtKg(lo)}–${fmtKg(hi)}.` };
    }
    return { kind: 'hold', weight: w, text: w !== null ? `Mantenha ${fmtKg(w)} até fechar ${item.max} reps em todas.` : `Busque ${item.max} reps em todas as séries.` };
  }

  function e1rm(w, r) {
    if (!(w > 0) || !(r > 0)) return null;
    if (r === 1) return w;
    return w * (1 + Math.min(r, 12) / 30);
  }

  function sessionStats(session) {
    let sets = 0; let reps = 0; let volume = 0;
    for (const e of session.entries || []) {
      for (const s of doneSets(e)) {
        sets += 1;
        reps += s.r || 0;
        if (s.w > 0 && s.r > 0) volume += s.w * s.r;
      }
    }
    return { sets, reps, volume: Math.round(volume) };
  }

  /** Métrica principal de evolução de um exercício. */
  function metric(ex, settings) {
    const t = typeOf(ex);
    const bw = settings && settings.bodyweight > 0 ? settings.bodyweight : 0;
    if (t === 'time') return { label: 'Melhor tempo (s)', value: (sets) => maxOf(sets, (s) => s.sec) };
    if (t === 'distance') return { label: 'Carga (kg)', value: (sets) => maxOf(sets, (s) => s.w) };
    if (t === 'interval') return { label: 'Tiros completos', value: (sets) => sets.length };
    if (t === 'max' || ex.load === 'bw') {
      if (bw) return { label: '1RM estimado (corpo + carga)', value: (sets) => maxOf(sets, (s) => e1rm(bw + (s.w || 0), s.r)) };
      return { label: 'Total de reps', value: (sets) => sets.reduce((a, s) => a + (s.r || 0), 0) };
    }
    if (ex.load === 'none') return { label: 'Total de reps', value: (sets) => sets.reduce((a, s) => a + (s.r || 0), 0) };
    return { label: '1RM estimado (kg)', value: (sets) => maxOf(sets, (s) => e1rm(s.w, s.r)) };
  }

  function series(history, exId, ex, settings) {
    const m = metric(ex, settings);
    const pts = [];
    for (const s of (history || []).slice().sort((a, b) => a.startedAt - b.startedAt)) {
      const sets = [];
      for (const e of s.entries || []) if (e.ex === exId) sets.push(...doneSets(e));
      if (!sets.length) continue;
      const v = m.value(sets);
      if (v !== null && v !== undefined) pts.push({ t: s.startedAt, v: Math.round(v * 10) / 10 });
    }
    return { label: m.label, points: pts };
  }

  /** Recordes batidos na sessão em relação ao histórico anterior. */
  function prs(session, history, exercises, settings) {
    const out = [];
    const before = (history || []).filter((h) => h.startedAt < session.startedAt && h.id !== session.id);
    const seen = new Set();
    for (const e of session.entries || []) {
      if (seen.has(e.ex)) continue;
      seen.add(e.ex);
      const ex = exercises[e.ex];
      if (!ex) continue;
      const now = series([session], e.ex, ex, settings).points[0];
      if (!now) continue;
      const prev = series(before, e.ex, ex, settings).points;
      if (!prev.length) continue;
      const best = Math.max(...prev.map((p) => p.v));
      if (now.v > best) out.push({ ex: e.ex, label: series([], e.ex, ex, settings).label, value: now.v, previous: best });
    }
    return out;
  }

  function startOfDay(ts) {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  function weekNumber(startTs, nowTs) {
    if (!startTs) return 1;
    return Math.max(1, Math.floor((startOfDay(nowTs) - startOfDay(startTs)) / (7 * DAY_MS)) + 1);
  }

  function nextDayIndex(plan, history) {
    const ids = new Set(plan.days.map((d) => d.id));
    const done = (history || []).filter((s) => s.finishedAt && ids.has(s.dayId)).sort((a, b) => b.startedAt - a.startedAt);
    if (!done.length) return 0;
    const idx = plan.days.findIndex((d) => d.id === done[0].dayId);
    return idx < 0 ? 0 : (idx + 1) % plan.days.length;
  }

  function daysUntil(ts, nowTs) {
    return Math.ceil((startOfDay(ts) - startOfDay(nowTs)) / DAY_MS);
  }


  // ------------------------------------------------------------ métricas por exercício

  /** Métricas disponíveis para um exercício (chave, rótulo, unidade). */
  function metricOptions(ex) {
    const t = typeOf(ex);
    if (t === 'time') return [['best_time', 'Melhor tempo', 's'], ['total_time', 'Tempo total', 's']];
    if (t === 'interval') return [['rounds', 'Tiros completos', '']];
    if (t === 'distance') return [['heaviest', 'Maior carga', 'kg'], ['best_distance', 'Maior distância', 'm']];
    if (ex.load === 'none') return [['best_reps', 'Mais reps (série)', 'reps'], ['total_reps', 'Total de reps', 'reps']];
    const out = [['heaviest', 'Maior carga', 'kg'], ['e1rm', '1RM estimado', 'kg'], ['best_set', 'Melhor série', 'kg×reps'], ['volume', 'Volume da sessão', 'kg']];
    if (ex.load === 'bw' || t === 'max') out.push(['best_reps', 'Mais reps (série)', 'reps'], ['total_reps', 'Total de reps', 'reps']);
    return out;
  }

  /** Valor de uma métrica para as séries concluídas de uma sessão. */
  function metricValue(key, sets) {
    const w = (s) => (typeof s.w === 'number' ? s.w : 0);
    switch (key) {
      case 'heaviest': return maxOf(sets.filter((s) => s.r > 0 || s.m > 0), (s) => s.w);
      case 'e1rm': return maxOf(sets, (s) => e1rm(s.w, s.r));
      case 'best_set': return maxOf(sets, (s) => (w(s) > 0 && s.r > 0 ? w(s) * s.r : null));
      case 'volume': { const v = sets.reduce((a, s) => a + (w(s) > 0 && s.r > 0 ? w(s) * s.r : 0), 0); return v || null; }
      case 'best_reps': return maxOf(sets, (s) => s.r);
      case 'total_reps': { const v = sets.reduce((a, s) => a + (s.r || 0), 0); return v || null; }
      case 'best_time': return maxOf(sets, (s) => s.sec);
      case 'total_time': { const v = sets.reduce((a, s) => a + (s.sec || 0), 0); return v || null; }
      case 'best_distance': return maxOf(sets, (s) => s.m);
      case 'rounds': return sets.length;
      default: return null;
    }
  }

  /** Sessões de um exercício (mais antigas primeiro) com suas séries concluídas. */
  function exerciseSessions(history, exId) {
    const out = [];
    for (const s of (history || []).slice().sort((a, b) => a.startedAt - b.startedAt)) {
      const sets = [];
      for (const e of s.entries || []) if (e.ex === exId) sets.push(...doneSets(e));
      if (sets.length) out.push({ session: s, t: s.startedAt, sets });
    }
    return out;
  }

  /** Série temporal de uma métrica; marca os pontos que bateram recorde. */
  function metricSeries(history, exId, key, sinceTs) {
    let best = -Infinity;
    const pts = [];
    for (const x of exerciseSessions(history, exId)) {
      const v = metricValue(key, x.sets);
      if (v === null || v === undefined) continue;
      const pr = v > best;
      if (pr) best = v;
      if (!sinceTs || x.t >= sinceTs) pts.push({ t: x.t, v: Math.round(v * 10) / 10, pr });
    }
    return pts;
  }

  /** Recordes pessoais de um exercício: [{key, label, unit, value, t}]. */
  function personalRecords(history, exId, ex) {
    return metricOptions(ex).map(([key, label, unit]) => {
      let best = null;
      for (const x of exerciseSessions(history, exId)) {
        const v = metricValue(key, x.sets);
        if (v !== null && v !== undefined && (best === null || v > best.value)) best = { value: Math.round(v * 10) / 10, t: x.t };
      }
      if (best && key === 'best_set') {
        for (const x of exerciseSessions(history, exId)) {
          if (x.t !== best.t) continue;
          const top = x.sets.reduce((a, s) => ((s.w || 0) * (s.r || 0) > (a ? (a.w || 0) * (a.r || 0) : -1) ? s : a), null);
          if (top) best.set = { w: top.w, r: top.r };
        }
      }
      return best ? { key, label, unit, value: best.value, t: best.t, set: best.set } : null;
    }).filter(Boolean);
  }

  // ------------------------------------------------------------ semana e distribuição muscular

  /** Início (segunda 00:00) e fim da semana que contém ts, deslocada em `offset` semanas. */
  function weekBounds(ts, offset) {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    const dow = (d.getDay() + 6) % 7; // 0 = segunda
    d.setDate(d.getDate() - dow + 7 * (offset || 0));
    const start = d.getTime();
    const e = new Date(start);
    e.setDate(e.getDate() + 7);
    return { start, end: e.getTime() };
  }

  /** Séries concluídas por grupo muscular entre [start, end). Principal = 1, secundário = 0,5. */
  function muscleSets(history, exercises, start, end) {
    const groups = {};
    const days = new Set();
    let total = 0;
    for (const s of history || []) {
      if (s.startedAt < start || s.startedAt >= end) continue;
      let any = false;
      for (const e of s.entries || []) {
        const ex = exercises[e.ex];
        const n = doneSets(e).length;
        if (!ex || !n) continue;
        any = true;
        total += n;
        if (ex.group) groups[ex.group] = (groups[ex.group] || 0) + n;
        for (const g of ex.secondary || []) groups[g] = (groups[g] || 0) + n / 2;
      }
      if (any) days.add((new Date(s.startedAt).getDay() + 6) % 7);
    }
    return { groups, total, days: [...days].sort() };
  }

  // ------------------------------------------------------------ backup

  const MAX_SESSIONS = 5000;

  function isNum(x) { return typeof x === 'number' && Number.isFinite(x); }
  function isNumOrNull(x) { return x === null || x === undefined || (isNum(x) && Math.abs(x) < 100000); }
  function isStr(x, max) { return typeof x === 'string' && x.length <= (max || 200); }

  function validSet(s) {
    return s && typeof s === 'object' && typeof s.done === 'boolean' &&
      isNumOrNull(s.w) && isNumOrNull(s.r) && isNumOrNull(s.sec) && isNumOrNull(s.m);
  }

  function validSession(s) {
    return s && typeof s === 'object' && isStr(s.id, 64) && isStr(s.dayId, 32) && isNum(s.startedAt) &&
      (s.finishedAt === null || s.finishedAt === undefined || isNum(s.finishedAt)) && Array.isArray(s.entries) && s.entries.length <= 100 &&
      s.entries.every((e) => e && isStr(e.uid, 64) && isStr(e.ex, 64) && Array.isArray(e.sets) && e.sets.length <= 50 && e.sets.every(validSet));
  }

  function validItem(i) {
    return i && isStr(i.uid, 64) && isStr(i.ex, 64) && isNum(i.sets) && i.sets >= 1 && i.sets <= 20 &&
      isNum(i.min) && isNum(i.max) && i.min >= 0 && i.max >= i.min && i.max <= 10000 && isNum(i.rest) && i.rest >= 0 && i.rest <= 3600;
  }

  function validPlan(p) {
    return p && typeof p === 'object' && (p.id === undefined || isStr(p.id, 40)) && (p.name === undefined || isStr(p.name, 80)) &&
      Array.isArray(p.days) && p.days.length >= 1 && p.days.length <= 7 &&
      p.days.every((d) => d && isStr(d.id, 32) && isStr(d.name, 60) && isStr(d.title, 80) &&
        (d.mode === 'normal' || d.mode === 'circuit') && (d.rounds === undefined || (isNum(d.rounds) && d.rounds >= 1 && d.rounds <= 8)) &&
        Array.isArray(d.items) && d.items.length <= 30 && d.items.every(validItem));
  }

  /** Converte backup v1 (um plano só) para v2 (vários planos salvos). */
  function upgradeBackup(obj) {
    if (obj && obj.version === 1 && obj.plan) {
      const id = (obj.plan && typeof obj.plan.id === 'string') ? obj.plan.id : 'toji';
      return Object.assign({}, obj, { version: 2, plans: { [id]: Object.assign({ id }, obj.plan) }, programId: id, plan: undefined });
    }
    return obj;
  }

  /** Valida um backup importado. Nunca confia no conteúdo do arquivo. */
  function validateBackup(raw, exercises) {
    if (!raw || typeof raw !== 'object' || raw.app !== 'dojo') return { ok: false, error: 'Arquivo não é um backup do Dojo.' };
    if (raw.version !== 1 && raw.version !== 2) return { ok: false, error: 'Versão de backup não suportada.' };
    if (raw.version === 1 && !validPlan(raw.plan)) return { ok: false, error: 'Plano inválido no backup.' };
    const obj = upgradeBackup(raw);
    if (!obj.plans || typeof obj.plans !== 'object' || Array.isArray(obj.plans)) return { ok: false, error: 'Planos inválidos no backup.' };
    const entries = Object.entries(obj.plans);
    if (!entries.length || entries.length > 30) return { ok: false, error: 'Planos inválidos no backup.' };
    for (const [k, p] of entries) {
      if (!isStr(k, 40) || !/^[a-z0-9_-]+$/i.test(k) || !validPlan(p) || p.id !== k) return { ok: false, error: 'Plano inválido no backup.' };
      if (exercises && !p.days.every((d) => d.items.every((i) => Object.prototype.hasOwnProperty.call(exercises, i.ex)))) {
        return { ok: false, error: 'Backup contém exercícios desconhecidos.' };
      }
    }
    if (!isStr(obj.programId, 40) || !Object.prototype.hasOwnProperty.call(obj.plans, obj.programId)) return { ok: false, error: 'Programa ativo inválido.' };
    if (!Array.isArray(obj.history) || obj.history.length > MAX_SESSIONS || !obj.history.every(validSession)) {
      return { ok: false, error: 'Histórico inválido no backup.' };
    }
    if (!Array.isArray(obj.challenge) || !obj.challenge.every((c) => c && isNum(c.t) && isNumOrNull(c.w) && isNumOrNull(c.r))) {
      return { ok: false, error: 'Registros do desafio inválidos.' };
    }
    const st = obj.settings || {};
    if (typeof st !== 'object' || !isNumOrNull(st.bodyweight) || !isNumOrNull(st.step)) return { ok: false, error: 'Configurações inválidas.' };
    return { ok: true, data: obj };
  }

  /** Séries semanais por grupo muscular (principal = 1, secundário = 0,5). */
  function weeklyVolume(plan, exercises) {
    const out = {};
    for (const d of plan.days) {
      for (const it of d.items) {
        const ex = exercises[it.ex];
        if (!ex || !ex.group) continue;
        const sets = d.mode === 'circuit' ? (d.rounds || 1) : it.sets;
        out[ex.group] = (out[ex.group] || 0) + sets;
        for (const g of ex.secondary || []) out[g] = (out[g] || 0) + sets / 2;
      }
    }
    return out;
  }

  /** Novo item de plano com a recomendação padrão do exercício. */
  function newItem(exId, ex, dayId, existing) {
    const def = ex.def || { sets: 3, min: 8, max: 12, rest: 90 };
    let n = 1;
    const taken = new Set((existing || []).map((i) => i.uid));
    while (taken.has(`${dayId}-u${n}-${exId}`)) n += 1;
    const item = { uid: `${dayId}-u${n}-${exId}`, ex: exId, sets: def.sets, min: def.min, max: def.max, rest: def.rest };
    if (typeOf(ex) === 'interval') item.interval = { work: 20, rest: 40, reps: 6 };
    return item;
  }

  const api = {
    typeOf, fmtClock, fmtRest, fmtKg, fmtNum, prescription, roundUp, doneSets, lastEntry, suggest, e1rm,
    sessionStats, metric, series, prs, weekNumber, nextDayIndex, daysUntil, validateBackup, upgradeBackup, validPlan, weeklyVolume, newItem, DAY_MS,
    metricOptions, metricValue, exerciseSessions, metricSeries, personalRecords, weekBounds, muscleSets,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DojoLogic = api;
})(typeof self !== 'undefined' ? self : this);

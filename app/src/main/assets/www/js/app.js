/* Dojo – controle de treinos. UI em JS puro; dados só no aparelho (localStorage). */
(function () {
  'use strict';

  const { EXERCISES, DEFAULT_PLAN, CHALLENGE, PROGRAMS, GROUPS, EQUIP, GUIDE, SOURCES, LEVELS, PLACES, recommend } = window.DojoData;
  const Lg = window.DojoLogic;
  const MEDIA = window.DojoMedia || {};
  const STORE_KEY = 'dojo.v1';
  const APP_VERSION = '1.2.0';

  // ================================================================ estado

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  function defaultState() {
    return {
      plan: clone(DEFAULT_PLAN),
      plans: {},
      onboarded: false,
      history: [],
      active: null,
      challenge: [],
      settings: { bodyweight: null, step: 0.5, sound: true, vibrate: true, keepAwake: true, startDate: null },
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaultState();
      const data = JSON.parse(raw);
      const st = Object.assign(defaultState(), data);
      st.settings = Object.assign(defaultState().settings, data.settings || {});
      if (!Lg.validPlan(st.plan)) st.plan = clone(DEFAULT_PLAN);
      if (!st.plan.id) st.plan.id = 'toji';          // migração da v1.0
      if (!st.plans || typeof st.plans !== 'object') st.plans = {};
      if (data.onboarded === undefined) st.onboarded = true; // quem já usava não vê o questionário
      return st;
    } catch (e) {
      console.error('Falha ao ler dados', e);
      return defaultState();
    }
  }

  let state = load();
  const ui = { tab: 'home', page: state.onboarded ? null : 'programs', sessionOpen: !!state.active, modals: [], timerMode: 'stopwatch',
    progressEx: null, runner: null, lib: { q: '', group: null, equip: null }, pickDay: null, quiz: { days: 3, level: 'iniciante', place: 'academia', goal: 'hipertrofia' } };

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      toast('Não foi possível salvar (armazenamento cheio?)');
    }
  }

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  // ================================================================ DOM util

  /** Cria elementos sem innerHTML (todo texto vira textContent → sem XSS). */
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
        else if (k === 'value') { el.value = v; if (tag === 'input') el.setAttribute('value', v); }
        else el.setAttribute(k, v === true ? '' : String(v));
      }
    }
    for (const kid of kids.flat()) {
      if (kid === null || kid === undefined || kid === false) continue;
      el.appendChild(typeof kid === 'string' || typeof kid === 'number' ? document.createTextNode(String(kid)) : kid);
    }
    return el;
  }

  function gifSrc(name) { return `gifs/${name}.gif`; }

  function parseNum(v) {
    if (v === null || v === undefined) return null;
    const s = String(v).trim().replace(',', '.');
    if (s === '' || s === '-' || s === '.') return null;
    const n = Number(s);
    return Number.isFinite(n) && Math.abs(n) < 100000 ? n : null;
  }

  function numStr(n) { return n === null || n === undefined ? '' : String(n).replace('.', ','); }

  function fmtDate(ts, opts) {
    return new Date(ts).toLocaleDateString('pt-BR', opts || { day: '2-digit', month: 'short' });
  }

  let toastTimer = null;
  function toast(msg) {
    let el = document.getElementById('toast');
    if (!el) { el = h('div', { id: 'toast', class: 'toast', role: 'status' }); document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
  }

  // ================================================================ ponte nativa
  // Objeto injetado pelo Android via WebViewCompat.addWebMessageListener, restrito à origem do app.

  const Native = {
    get available() { return !!(window.DojoNative && window.DojoNative.postMessage); },
    post(msg) { if (this.available) window.DojoNative.postMessage(JSON.stringify(msg)); },
  };
  if (window.DojoNative) {
    window.DojoNative.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (msg.type === 'import') {
        if (msg.error) toast(msg.error);
        else if (typeof msg.content === 'string') importBackupText(msg.content);
      } else if (msg.type === 'export') {
        toast(msg.ok ? 'Backup salvo.' : (msg.error || 'Backup cancelado.'));
      }
    };
  }

  function setKeepAwake(on) { Native.post({ type: 'keepAwake', on: !!on }); }

  // ================================================================ som/vibração

  let audioCtx = null;
  function unlockAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }
  document.addEventListener('pointerdown', unlockAudio, { passive: true });

  function beep(freq, ms, when) {
    if (!state.settings.sound || !audioCtx) return;
    const t0 = audioCtx.currentTime + (when || 0);
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
    o.connect(g).connect(audioCtx.destination);
    o.start(t0);
    o.stop(t0 + ms / 1000 + 0.02);
  }

  function vibrate(pattern) {
    if (!state.settings.vibrate) return;
    if (Native.available) Native.post({ type: 'vibrate', pattern });
    else if (navigator.vibrate) navigator.vibrate(pattern);
  }

  const cue = {
    tick() { beep(660, 90); },
    go() { beep(980, 160); beep(980, 160, 0.22); vibrate([0, 180, 90, 180]); },
    rest() { beep(440, 260); vibrate([0, 300]); },
    end() { beep(880, 140); beep(880, 140, 0.2); beep(1175, 260, 0.4); vibrate([0, 250, 120, 250, 120, 400]); },
  };

  // ================================================================ render raiz

  const root = document.getElementById('app');

  function render() {
    const ov = document.getElementById('session');
    const ovScroll = ov ? ov.scrollTop : 0;
    const winScroll = window.scrollY;
    root.textContent = '';
    const screens = { home: viewHome, library: viewLibrary, timer: viewTimer, progress: viewProgress, settings: viewSettings };
    const pages = { programs: viewPrograms, editor: viewEditor, guide: viewGuide };
    root.appendChild(ui.page ? pages[ui.page]() : screens[ui.tab]());
    root.appendChild(viewNav());
    if (ui.sessionOpen && state.active) root.appendChild(viewSession());
    ui.modals.forEach((m) => root.appendChild(m.el));
    if (ui.runner) root.appendChild(ui.runner.el);
    const ov2 = document.getElementById('session');
    if (ov2) ov2.scrollTop = ovScroll;
    window.scrollTo(0, winScroll);
    tick();
  }

  function viewNav() {
    const tabs = [['home', '◆', 'Treinos'], ['library', '☰', 'Exercícios'], ['timer', '◷', 'Timer'], ['progress', '▲', 'Progresso'], ['settings', '⚙', 'Ajustes']];
    return h('nav', { class: 'nav', 'aria-label': 'Navegação' },
      tabs.map(([id, ico, label]) => h('button', {
        class: ui.tab === id && !ui.page ? 'active' : '', 'aria-current': ui.tab === id && !ui.page ? 'page' : null,
        onclick: () => { ui.tab = id; ui.page = null; ui.pickDay = null; render(); window.scrollTo(0, 0); },
      }, h('span', { class: 'ico', 'aria-hidden': 'true', text: ico }), label)));
  }

  function topbar(sub) {
    return h('div', { class: 'topbar' },
      h('div', { class: 'brand' }, h('h1', null, 'DOJO', h('span', { text: '.' })), sub ? h('span', { class: 'muted small', text: sub }) : null),
      h('span', { class: 'badge gold', text: `Semana ${Lg.weekNumber(state.settings.startDate, Date.now())}` }));
  }

  // ================================================================ início

  function viewHome() {
    const plan = state.plan;
    const nextIdx = Lg.nextDayIndex(plan, state.history);
    const next = plan.days[nextIdx];
    const wrap = h('main', { class: 'screen' }, topbar(plan.short || plan.name || 'Meu treino'));
    wrap.appendChild(h('div', { class: 'card row between' },
      h('div', { class: 'grow' }, h('div', { class: 'day-num', text: 'Programa' }), h('div', { class: 'ex-name', text: plan.name || 'Meu treino' })),
      h('button', { class: 'btn sm', onclick: () => openPage('programs') }, 'Trocar'),
      h('button', { class: 'btn sm ghost', onclick: () => openPage('editor') }, 'Editar')));

    if (state.active) {
      wrap.appendChild(h('div', { class: 'card hero tap', onclick: () => { ui.sessionOpen = true; render(); } },
        h('div', { class: 'row between' },
          h('div', null, h('div', { class: 'day-num', text: 'Treino em andamento' }), h('h2', { text: `${state.active.dayName} – ${state.active.title}` })),
          h('span', { class: 'badge accent', 'data-clock': 'session' }, '')),
        h('p', { class: 'muted small', text: 'Toque para continuar.' })));
    } else if (next) {
      wrap.appendChild(dayCard(next, nextIdx, true));
    }

    wrap.appendChild(h('div', { class: 'section-title', text: 'Semana de treino' }));
    const list = h('div', { class: 'stack' });
    plan.days.forEach((d, i) => { if (state.active || i !== nextIdx) list.appendChild(dayCard(d, i, false)); });
    const restDays = 7 - plan.days.length;
    if (restDays > 0) {
      list.appendChild(h('div', { class: 'card' },
        h('div', { class: 'day-num', text: `${restDays} dia${restDays > 1 ? 's' : ''} de descanso` }),
        h('p', { class: 'muted small', text: 'Recuperação faz parte do treino: sono, comida e caminhada leve. Evite treinar o mesmo músculo pesado dois dias seguidos.' })));
    }
    wrap.appendChild(list);

    wrap.appendChild(h('div', { class: 'card tap mt', onclick: () => openPage('guide') },
      h('div', { class: 'row between' }, h('div', null, h('h3', { text: '📘 Guia de treino' }),
        h('p', { class: 'muted small', text: 'Séries por semana, divisões, progressão, descanso e segurança — e o volume do seu plano por músculo.' })),
      h('span', { class: 'muted', text: '›' }))));

    wrap.appendChild(h('div', { class: 'section-title', text: CHALLENGE.title }));
    wrap.appendChild(challengeCard());

    wrap.appendChild(h('div', { class: 'section-title', text: 'Histórico recente' }));
    const recent = state.history.slice().sort((a, b) => b.startedAt - a.startedAt).slice(0, 6);
    if (!recent.length) wrap.appendChild(h('div', { class: 'card empty', text: 'Nenhum treino ainda. Bora começar!' }));
    else wrap.appendChild(h('div', { class: 'stack' }, recent.map(historyRow)));
    wrap.appendChild(progressionNote());
    return wrap;
  }

  function progressionNote() {
    return h('div', { class: 'card', style: null },
      h('h3', { text: 'Como progredir' }),
      h('p', { class: 'muted small', text: 'Quando fechar todas as séries no topo da faixa de repetições, suba a carga de 2,5 a 5%. O app calcula e sugere a próxima carga em cada exercício.' }));
  }

  function dayCard(day, idx, featured) {
    const done = state.history.filter((s) => s.dayId === day.id && s.finishedAt);
    const last = done.sort((a, b) => b.startedAt - a.startedAt)[0];
    const card = h('div', { class: `card ${featured ? 'hero' : 'tap'}`, onclick: featured ? null : () => confirmStart(day) },
      h('div', { class: 'day-head' },
        h('div', null,
          h('div', { class: 'day-num', text: featured ? `Próximo · ${day.name}` : day.name }),
          h('h2', { text: day.title })),
        day.mode === 'circuit' ? h('span', { class: 'badge accent', text: `Circuito ${day.rounds} voltas` }) : null),
      day.items.length ? null : h('p', { class: 'muted small', text: 'Sem exercícios ainda. Toque em “Editar” para montar este treino.' }),
      h('div', { class: 'chips' }, day.items.map((it) => h('span', { class: 'chip', text: `${EXERCISES[it.ex].name} · ${Lg.prescription(it, EXERCISES[it.ex])}` }))),
      h('div', { class: 'thumbs' }, day.items.map((it) => h('img', { src: gifSrc(EXERCISES[it.ex].gifs[0]), alt: EXERCISES[it.ex].name, loading: 'lazy' }))),
      last ? h('p', { class: 'muted tiny', text: `Último: ${fmtDate(last.startedAt, { weekday: 'short', day: '2-digit', month: 'short' })}` }) : null);
    if (featured) {
      card.appendChild(h('button', { class: 'btn primary block', style: null, onclick: () => confirmStart(day) }, '▶ Começar treino'));
      card.lastChild.classList.add('mt');
    }
    return card;
  }

  function historyRow(s) {
    const day = findDay(s.dayId);
    const st = Lg.sessionStats(s);
    const dur = s.finishedAt ? Lg.fmtClock((s.finishedAt - s.startedAt) / 1000) : '–';
    return h('div', { class: 'card tap', onclick: () => openHistoryModal(s) },
      h('div', { class: 'row between' },
        h('div', null,
          h('div', { class: 'ex-name', text: day ? `${day.name} – ${day.title}` : s.dayId }),
          h('div', { class: 'muted small', text: `${fmtDate(s.startedAt, { weekday: 'short', day: '2-digit', month: 'short' })} · ${dur}` })),
        h('div', { class: 'muted small', text: `${st.sets} séries${st.volume ? ` · ${st.volume.toLocaleString('pt-BR')} kg` : ''}` })));
  }

  function challengeCard() {
    const tests = state.challenge.slice().sort((a, b) => b.t - a.t);
    const last = tests[0];
    const best = tests.reduce((b, c) => (b === null || (c.w || 0) > (b.w || 0) ? c : b), null);
    let due = null;
    if (last) due = Lg.daysUntil(last.t + CHALLENGE.everyDays * Lg.DAY_MS, Date.now());
    return h('div', { class: 'card' },
      h('div', { class: 'ex-head' },
        h('img', { src: gifSrc('barra_carga'), alt: 'Barra fixa com carga', onclick: () => openExerciseModal('barra_carga') }),
        h('div', { class: 'grow' },
          h('div', { class: 'ex-name', text: 'Barra fixa com carga' }),
          h('p', { class: 'muted small', text: CHALLENGE.text }),
          h('div', { class: 'row wrap', style: null },
            best ? h('span', { class: 'badge gold', text: `Recorde: +${Lg.fmtKg(best.w)} × ${best.r}` }) : h('span', { class: 'badge', text: 'Sem teste ainda' }),
            due === null ? null : due <= 0
              ? h('span', { class: 'badge accent', text: 'Hora de testar!' })
              : h('span', { class: 'badge', text: `Próximo teste em ${due} dia${due > 1 ? 's' : ''}` })))),
      h('button', { class: 'btn ghost block sm', onclick: openChallengeModal }, '+ Registrar teste'));
  }

  // ================================================================ sessão

  function confirmStart(day) {
    if (!day.items.length) { toast('Adicione exercícios a este treino primeiro.'); openPage('editor'); return; }
    if (state.active) {
      if (state.active.dayId === day.id) { ui.sessionOpen = true; render(); return; }
      confirmModal('Já existe um treino em andamento', `Descartar "${state.active.dayName}" e começar ${day.name}?`, 'Descartar e começar', () => startSession(day));
      return;
    }
    startSession(day);
  }

  function startSession(day) {
    const items = clone(day.items);
    const rounds = day.mode === 'circuit' ? (day.rounds || 4) : null;
    state.active = {
      id: uid(), dayId: day.id, dayName: day.name, title: day.title, mode: day.mode, rounds, roundRest: day.roundRest || 120,
      items, startedAt: Date.now(), rest: null,
      entries: items.map((it) => ({ uid: it.uid, ex: it.ex, sets: Array.from({ length: rounds || it.sets }, () => emptySet()) })),
    };
    if (!state.settings.startDate) state.settings.startDate = Date.now();
    save();
    ui.sessionOpen = true;
    if (state.settings.keepAwake) setKeepAwake(true);
    render();
    window.scrollTo(0, 0);
  }

  function emptySet() { return { w: null, r: null, sec: null, m: null, done: false }; }

  function viewSession() {
    const a = state.active;
    const ov = h('section', { class: 'overlay', id: 'session', 'aria-label': 'Treino' });
    ov.appendChild(h('div', { class: 'session-top' },
      h('button', { class: 'icon-btn', 'aria-label': 'Minimizar', onclick: () => { ui.sessionOpen = false; render(); } }, '←'),
      h('div', { class: 'grow' },
        h('div', { class: 'ex-name', text: `${a.dayName} – ${a.title}` }),
        h('div', { class: 'small muted' }, 'Tempo ', h('span', { class: 'clock', 'data-clock': 'session' }, ''))),
      h('button', { class: 'btn primary sm', onclick: finishPrompt }, 'Finalizar')));
    const body = h('div', { class: 'session-body stack' });
    if (a.mode === 'circuit') body.appendChild(circuitView(a));
    else a.items.forEach((it, i) => body.appendChild(exerciseCard(a, it, i)));
    body.appendChild(h('button', { class: 'btn ghost block', onclick: finishPrompt }, 'Finalizar treino'));
    body.appendChild(h('button', { class: 'btn danger block', onclick: () => confirmModal('Descartar treino?', 'As séries desta sessão serão apagadas.', 'Descartar', discardSession) }, 'Descartar'));
    ov.appendChild(body);
    if (a.rest) ov.appendChild(restBar());
    return ov;
  }

  function exerciseCard(a, it, i) {
    const ex = EXERCISES[it.ex];
    const last = Lg.lastEntry(state.history, it.uid, it.ex);
    const sug = Lg.suggest(it, ex, last, state.settings);
    const entry = a.entries[i];
    const doneCount = Lg.doneSets(entry).length;
    const card = h('div', { class: `card ${doneCount >= entry.sets.length ? 'done' : ''}` },
      h('div', { class: 'ex-head' },
        h('img', { src: gifSrc(ex.gifs[0]), alt: ex.name, onclick: () => openExerciseModal(it.ex) }),
        h('div', { class: 'grow' },
          h('div', { class: 'ex-name', text: ex.name }),
          h('div', { class: 'muted small', text: `${Lg.prescription(it, ex)} · descanso ${Lg.fmtRest(it.rest)}` }),
          it.note ? h('div', { class: 'tiny', text: it.note }) : null),
        h('button', { class: 'icon-btn', 'aria-label': `Como fazer ${ex.name}`, onclick: () => openExerciseModal(it.ex) }, 'ⓘ')),
      h('div', { class: `suggest ${sug.kind}`, text: sug.text }));
    const sets = h('div', { class: 'sets' });
    entry.sets.forEach((s, si) => sets.appendChild(setRow(a, it, ex, i, si, last, sug)));
    card.appendChild(sets);
    card.appendChild(h('div', { class: 'set-tools' },
      h('button', { class: 'btn ghost sm', onclick: () => { entry.sets.push(emptySet()); save(); render(); } }, '+ série'),
      entry.sets.length > 1 ? h('button', { class: 'btn ghost sm', onclick: () => { entry.sets.pop(); save(); render(); } }, '− série') : null));
    return card;
  }

  function circuitView(a) {
    const wrap = h('div', { class: 'stack' });
    wrap.appendChild(h('div', { class: 'card' },
      h('div', { class: 'row between' },
        h('div', null, h('div', { class: 'ex-name', text: `Circuito · ${a.rounds} voltas` }),
          h('div', { class: 'muted small', text: `Faça os exercícios em sequência. Descanso entre voltas: ${Lg.fmtRest(a.roundRest)}.` })),
        h('div', { class: 'row' },
          h('button', { class: 'icon-btn', 'aria-label': 'Menos uma volta', onclick: () => changeRounds(-1) }, '−'),
          h('button', { class: 'icon-btn', 'aria-label': 'Mais uma volta', onclick: () => changeRounds(1) }, '+')))));
    for (let r = 0; r < a.rounds; r++) {
      const allDone = a.entries.every((e) => e.sets[r] && e.sets[r].done);
      const card = h('div', { class: `card ${allDone ? 'done' : ''}` },
        h('div', { class: 'round-title' }, h('h3', { text: `Volta ${r + 1}` }), allDone ? h('span', { class: 'badge ok', text: 'Concluída' }) : null));
      a.items.forEach((it, i) => {
        const ex = EXERCISES[it.ex];
        const last = Lg.lastEntry(state.history, it.uid, it.ex);
        const sug = Lg.suggest(it, ex, last, state.settings);
        card.appendChild(h('div', { class: 'circuit-item' },
          h('div', { class: 'ex-head' },
            h('img', { src: gifSrc(ex.gifs[0]), alt: ex.name, onclick: () => openExerciseModal(it.ex) }),
            h('div', { class: 'grow' }, h('div', { class: 'ex-name', text: ex.name }), h('div', { class: 'muted small', text: Lg.prescription(it, ex) }))),
          r === 0 ? h('div', { class: `suggest ${sug.kind}`, text: sug.text }) : null,
          h('div', { class: 'sets' }, setRow(a, it, ex, i, r, last, sug))));
      });
      wrap.appendChild(card);
    }
    return wrap;
  }

  function changeRounds(d) {
    const a = state.active;
    const n = Math.min(8, Math.max(1, a.rounds + d));
    if (n === a.rounds) return;
    if (n < a.rounds && a.entries.some((e) => e.sets[n] && e.sets[n].done)) { toast('Essa volta já tem séries feitas.'); return; }
    a.rounds = n;
    a.entries.forEach((e) => { while (e.sets.length < n) e.sets.push(emptySet()); e.sets.length = n; });
    save();
    render();
  }

  /** Valores sugeridos para preencher a série (placeholder). */
  function prefill(entry, si, last, sug, it, ex) {
    const prev = entry.sets.slice(0, si).reverse().find((s) => s.done);
    const lastSet = last && last.sets ? Lg.doneSets(last)[si] || Lg.doneSets(last).slice(-1)[0] : null;
    let w = null;
    if (prev && prev.w !== null) w = prev.w;
    else if (sug && sug.weight !== undefined && sug.weight !== null) w = sug.weight;
    else if (lastSet && lastSet.w !== null) w = lastSet.w;
    const t = Lg.typeOf(ex);
    let r = null;
    if (t === 'reps') r = it.max;
    else if (t === 'max') r = lastSet && lastSet.r ? lastSet.r : null;
    return { w, r, sec: t === 'time' ? (sug.target || it.max) : null, m: t === 'distance' ? it.max : null };
  }

  function field(value, placeholder, unit, label, onInput) {
    return h('label', { class: 'field' },
      h('input', {
        type: 'text', inputmode: 'decimal', autocomplete: 'off', enterkeyhint: 'done', 'aria-label': label,
        value: numStr(value), placeholder: placeholder === null || placeholder === undefined ? '' : numStr(placeholder),
        oninput: (e) => onInput(parseNum(e.target.value)),
      }),
      h('span', { class: 'unit', text: unit }));
  }

  function setRow(a, it, ex, i, si, last, sug) {
    const entry = a.entries[i];
    const s = entry.sets[si];
    const t = Lg.typeOf(ex);
    const pf = prefill(entry, si, last, sug, it, ex);
    const upd = (k) => (v) => { s[k] = v; save(); };
    const label = String(si + 1);
    const cells = [];
    let cls = 'set-row';

    if (t === 'interval') {
      cls += ' one';
      const iv = it.interval || { work: 20, rest: 40, reps: 6 };
      cells.push(h('button', { class: 'btn sm', onclick: () => runInterval(iv, () => markDone(i, si, true)) }, `▶ Intervalos ${iv.work}/${iv.rest} ×${iv.reps}`));
    } else if (t === 'time') {
      cls += ' timeish';
      cells.push(field(s.sec, pf.sec, 's', 'Segundos', upd('sec')));
      cells.push(h('button', { class: 'icon-btn', 'aria-label': 'Iniciar cronômetro', onclick: () => runCountdown(pf.sec || it.max, ex.name, () => { s.sec = pf.sec || it.max; markDone(i, si, true); }) }, '▶'));
    } else if (t === 'distance') {
      cells.push(field(s.w, pf.w, 'kg', 'Carga', upd('w')));
      cells.push(field(s.m, pf.m, 'm', 'Distância', upd('m')));
    } else if (ex.load === 'none') {
      cls += ' one';
      cells.push(field(s.r, pf.r, 'reps', 'Repetições', upd('r')));
    } else {
      cells.push(field(s.w, pf.w, ex.load === 'bw' ? '+kg' : 'kg', 'Carga', upd('w')));
      cells.push(field(s.r, pf.r, 'reps', 'Repetições', upd('r')));
    }
    return h('div', { class: `${cls}${s.done ? ' done' : ''}` },
      h('span', { class: 'idx', text: label }),
      cells,
      h('button', {
        class: `check${s.done ? ' on' : ''}`, 'aria-label': s.done ? 'Desmarcar série' : 'Concluir série', 'aria-pressed': s.done ? 'true' : 'false',
        onclick: () => {
          if (!s.done) {
            if (s.w === null && pf.w !== null && ex.load !== 'none') s.w = pf.w;
            if (s.r === null && pf.r !== null) s.r = pf.r;
            if (s.sec === null && pf.sec !== null) s.sec = pf.sec;
            if (s.m === null && pf.m !== null) s.m = pf.m;
            if ((t === 'reps' || t === 'max') && !(s.r > 0)) { toast('Informe as repetições.'); return; }
            if (ex.load === 'load' && s.w === null) { toast('Informe a carga.'); return; }
          }
          markDone(i, si, !s.done);
        },
      }, '✓'));
  }

  function markDone(i, si, done) {
    const a = state.active;
    if (!a) return;
    const s = a.entries[i].sets[si];
    s.done = done;
    if (done) {
      const it = a.items[i];
      let restSec = it.rest;
      let label = 'Descanso';
      if (a.mode === 'circuit') {
        const roundDone = a.entries.every((e) => e.sets[si] && e.sets[si].done);
        if (roundDone) { restSec = si < a.rounds - 1 ? a.roundRest : 0; label = 'Descanso entre voltas'; }
      }
      const everything = a.entries.every((e) => e.sets.every((x) => x.done));
      if (everything) { a.rest = null; cue.end(); toast('Treino completo! Toque em Finalizar.'); }
      else if (restSec > 0) startRest(restSec, label);
    }
    save();
    render();
  }

  // ---------------------------------------------------------------- descanso

  function startRest(sec, label) {
    state.active.rest = { endAt: Date.now() + sec * 1000, total: sec, label, lastBeep: null, finished: false };
  }

  function restBar() {
    const r = state.active.rest;
    const adj = (d) => { r.endAt += d * 1000; r.total = Math.max(1, r.total + d); r.finished = false; save(); tick(); };
    return h('div', { class: 'restbar', id: 'restbar' },
      h('div', { class: 'inner' },
        h('div', { class: 'row between' },
          h('div', null, h('div', { class: 'small muted', id: 'rest-label', text: r.label }), h('div', { class: 'time', id: 'rest-time' }, '')),
          h('div', { class: 'row' },
            h('button', { class: 'btn sm', onclick: () => adj(-15) }, '−15'),
            h('button', { class: 'btn sm', onclick: () => adj(15) }, '+15'),
            h('button', { class: 'btn sm primary', onclick: () => { state.active.rest = null; save(); render(); } }, 'Pular'))),
        h('div', { class: 'progress' }, h('i', { id: 'rest-prog' }))));
  }

  // ---------------------------------------------------------------- finalizar

  function finishPrompt() {
    const a = state.active;
    const any = a.entries.some((e) => Lg.doneSets(e).length);
    if (!any) {
      confirmModal('Nenhuma série concluída', 'Deseja descartar este treino?', 'Descartar', discardSession);
      return;
    }
    const pending = a.entries.reduce((n, e) => n + e.sets.filter((s) => !s.done).length, 0);
    if (pending) confirmModal('Finalizar treino?', `Ainda há ${pending} série(s) não marcadas. Elas não serão salvas.`, 'Finalizar', finishSession);
    else finishSession();
  }

  function finishSession() {
    const a = state.active;
    const session = {
      id: a.id, dayId: a.dayId, startedAt: a.startedAt, finishedAt: Date.now(),
      entries: a.entries.map((e) => ({ uid: e.uid, ex: e.ex, sets: Lg.doneSets(e) })).filter((e) => e.sets.length),
    };
    const records = Lg.prs(session, state.history, EXERCISES, state.settings);
    state.history.push(session);
    state.active = null;
    save();
    setKeepAwake(false);
    ui.sessionOpen = false;
    render();
    openSummaryModal(session, records);
  }

  function discardSession() {
    state.active = null;
    save();
    setKeepAwake(false);
    ui.sessionOpen = false;
    render();
  }

  // ================================================================ modais

  function openModal(build, opts) {
    const m = { opts: opts || {} };
    const close = () => closeModal(m);
    const box = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'grab' }));
    build(box, close);
    m.el = h('div', { class: 'modal-wrap', onclick: (e) => { if (e.target === m.el) close(); } }, box);
    ui.modals.push(m);
    root.appendChild(m.el);
    return m;
  }

  function closeModal(m) {
    const i = ui.modals.indexOf(m || ui.modals[ui.modals.length - 1]);
    if (i < 0) return;
    const [mm] = ui.modals.splice(i, 1);
    mm.el.remove();
    if (mm.opts.onClose) mm.opts.onClose();
  }

  function confirmModal(title, text, okLabel, onOk) {
    openModal((box, close) => {
      box.append(h('h2', { text: title }), h('p', { class: 'muted', text }),
        h('div', { class: 'row', style: null },
          h('button', { class: 'btn ghost grow', onclick: close }, 'Cancelar'),
          h('button', { class: 'btn primary grow', onclick: () => { close(); onOk(); } }, okLabel)));
      box.lastChild.classList.add('mt');
    });
  }

  function openExerciseModal(exId) {
    const ex = EXERCISES[exId];
    let gi = 0;
    openModal((box, close) => {
      const holder = h('div', { class: 'media-box' });
      const showMedia = (name) => {
        holder.textContent = '';
        const m = MEDIA[name];
        if (m) {
          const v = h('video', { class: 'big', src: m.src, autoplay: true, loop: true, muted: true, playsinline: true, preload: 'auto',
            'aria-label': ex.name, poster: gifSrc(name) });
          v.muted = true;
          v.addEventListener('error', () => { holder.textContent = ''; holder.appendChild(h('img', { class: 'big', src: gifSrc(name), alt: ex.name })); });
          holder.append(v, h('p', { class: 'tiny muted credit', text: `Vídeo: ${m.credit} · ${m.license}` }));
          const p = v.play && v.play();
          if (p && p.catch) p.catch(() => {});
        } else {
          holder.appendChild(h('img', { class: 'big', src: gifSrc(name), alt: ex.name }));
        }
      };
      showMedia(ex.gifs[0]);
      const img = holder;
      box.append(h('h2', { text: ex.name }), h('p', { class: 'muted small', text: ex.muscles }));
      if (ex.def) {
        box.append(h('p', { class: 'small suggest-line' }, h('b', { text: 'Sugestão: ' }), `${Lg.prescription(ex.def, ex)} · descanso ${Lg.fmtRest(ex.def.rest)}`));
      }
      box.append(img);
      if (ex.gifs.length > 1) {
        const labels = ex.gifs.map((g) => (g === 'flexao' ? 'Flexão' : g === 'burpee' ? 'Burpee' : g === 'salto_caixote' ? 'Caixote' : 'Grupado'));
        const chips = h('div', { class: 'chips' });
        const paint = () => {
          chips.textContent = '';
          labels.forEach((l, k) => chips.appendChild(h('button', { class: `chip${k === gi ? ' on' : ''}`, onclick: () => { gi = k; showMedia(ex.gifs[k]); paint(); } }, l)));
        };
        paint();
        box.append(chips);
      }
      box.append(exerciseBadges(ex));
      box.append(h('h3', { class: 'mt', text: 'Execução' }), h('ol', null, ex.cues.map((c) => h('li', { text: c }))));
      if (ex.safety) box.append(h('p', { class: 'small' }, h('b', { text: 'Segurança: ' }), ex.safety));
      const pts = Lg.series(state.history, exId, ex, state.settings);
      if (pts.points.length) box.append(h('h3', { text: pts.label }), chart(pts.points));
      box.append(h('div', { class: 'row mt' },
        h('button', { class: 'btn grow', onclick: close }, 'Fechar'),
        h('button', { class: 'btn primary grow', onclick: () => { close(); addToPlanFlow(exId); } }, '+ Adicionar ao treino')));
    });
  }

  function openSummaryModal(session, records) {
    const st = Lg.sessionStats(session);
    const day = findDay(session.dayId);
    openModal((box, close) => {
      box.append(
        h('h2', { text: 'Treino concluído 💪' }),
        h('p', { class: 'muted', text: day ? `${day.name} – ${day.title}` : '' }),
        h('div', { class: 'stat-grid' },
          h('div', { class: 'stat' }, h('b', { text: Lg.fmtClock((session.finishedAt - session.startedAt) / 1000) }), h('span', { text: 'duração' })),
          h('div', { class: 'stat' }, h('b', { text: String(st.sets) }), h('span', { text: 'séries' })),
          h('div', { class: 'stat' }, h('b', { text: st.volume ? `${st.volume.toLocaleString('pt-BR')}` : '–' }), h('span', { text: 'volume (kg)' }))));
      if (records.length) {
        box.append(h('h3', { text: 'Recordes 🏆' }), h('ul', null, records.map((r) => h('li', null,
          h('span', { class: 'pr', text: EXERCISES[r.ex].name }), ` – ${r.label}: ${Lg.fmtNum(r.value)} (antes ${Lg.fmtNum(r.previous)})`))));
      }
      box.append(h('button', { class: 'btn primary block', onclick: close }, 'Fechar'));
    });
  }

  function setsSummary(e) {
    const ex = EXERCISES[e.ex];
    const t = Lg.typeOf(ex);
    return e.sets.map((s) => {
      if (t === 'time') return `${s.sec || 0}s`;
      if (t === 'distance') return `${numStr(s.w)}kg×${s.m || 0}m`;
      if (t === 'interval') return '✓';
      if (s.w !== null && s.w !== undefined && (ex.load !== 'bw' || s.w !== 0)) return `${numStr(s.w)}×${s.r}`;
      return `${s.r}`;
    }).join(' · ');
  }

  function openHistoryModal(s) {
    const day = findDay(s.dayId);
    openModal((box, close) => {
      box.append(h('h2', { text: day ? `${day.name} – ${day.title}` : s.dayId }),
        h('p', { class: 'muted small', text: new Date(s.startedAt).toLocaleString('pt-BR') }),
        h('table', { class: 'tbl' }, h('tbody', null, s.entries.map((e) => h('tr', null,
          h('td', { text: EXERCISES[e.ex] ? EXERCISES[e.ex].name : e.ex }), h('td', { text: setsSummary(e) }))))),
        h('div', { class: 'row' },
          h('button', { class: 'btn danger grow', onclick: () => confirmModal('Apagar treino?', 'Essa ação não pode ser desfeita.', 'Apagar', () => {
            state.history = state.history.filter((x) => x.id !== s.id); save(); close(); render();
          }) }, 'Apagar'),
          h('button', { class: 'btn grow', onclick: close }, 'Fechar')));
    });
  }

  function openChallengeModal() {
    const form = { w: null, r: 1 };
    openModal((box, close) => {
      box.append(h('h2', { text: 'Teste: barra fixa com carga' }),
        h('p', { class: 'muted small', text: 'Registre a maior carga extra que você levantou com técnica limpa.' }),
        h('div', { class: 'form-grid' },
          h('div', null, h('label', { class: 'lbl', text: 'Carga extra (kg)' }), field(null, '0', 'kg', 'Carga extra', (v) => { form.w = v; })),
          h('div', null, h('label', { class: 'lbl', text: 'Repetições' }), field(1, '1', 'reps', 'Repetições', (v) => { form.r = v; }))));
      const tests = state.challenge.slice().sort((a, b) => a.t - b.t);
      if (tests.length > 1) box.append(h('h3', { text: 'Evolução (carga extra)' }), chart(tests.map((c) => ({ t: c.t, v: c.w || 0 }))));
      if (tests.length) {
        box.append(h('table', { class: 'tbl' }, h('tbody', null, tests.slice().reverse().map((c) => h('tr', null,
          h('td', { text: fmtDate(c.t, { day: '2-digit', month: 'short', year: 'numeric' }) }),
          h('td', { text: `+${Lg.fmtKg(c.w || 0)} × ${c.r}` }),
          h('td', null, h('button', { class: 'chip', 'aria-label': 'Apagar teste', onclick: () => { state.challenge = state.challenge.filter((x) => x !== c); save(); close(); render(); } }, '✕')))))));
      }
      box.append(h('div', { class: 'row' },
        h('button', { class: 'btn ghost grow', onclick: close }, 'Cancelar'),
        h('button', { class: 'btn primary grow', onclick: () => {
          if (form.w === null || !(form.r > 0)) { toast('Informe carga e repetições.'); return; }
          state.challenge.push({ t: Date.now(), w: form.w, r: form.r });
          save(); close(); render(); toast('Teste registrado. Próximo em 4 semanas!');
        } }, 'Salvar')));
    });
  }

  // ================================================================ timers

  /** Executor em tela cheia para contagem regressiva e intervalos (baseado em timestamps). */
  function startRunner(phases, title, onComplete) {
    const total = phases.reduce((a, p) => a + p.sec, 0);
    const r = { phases, total, startAt: Date.now(), pausedAt: null, pausedMs: 0, lastPhase: -1, lastSec: null, done: false, onComplete };
    const stop = () => { ui.runner = null; r.el.remove(); };
    r.el = h('div', { class: 'runner', id: 'runner' },
      h('div', { class: 'phase', id: 'run-phase' }, ''),
      h('div', { class: 'big-clock', id: 'run-clock' }, ''),
      h('p', { class: 'muted', style: null, id: 'run-sub', text: title }),
      h('div', { class: 'progress' }, h('i', { id: 'run-prog' })),
      h('div', { class: 'row', style: null },
        h('button', { class: 'btn ghost grow', onclick: () => confirmModal('Parar o timer?', '', 'Parar', stop) }, 'Parar'),
        h('button', { class: 'btn primary grow', id: 'run-pause', onclick: () => {
          if (r.pausedAt) { r.pausedMs += Date.now() - r.pausedAt; r.pausedAt = null; } else r.pausedAt = Date.now();
          tick();
        } }, 'Pausar')));
    r.el.lastChild.classList.add('mt');
    r.stop = stop;
    ui.runner = r;
    root.appendChild(r.el);
    if (state.settings.keepAwake) setKeepAwake(true);
    tick();
  }

  function runCountdown(sec, title, onComplete) {
    startRunner([{ kind: 'prep', label: 'Prepare-se', sec: 5 }, { kind: 'work', label: 'Vai!', sec }], title, onComplete);
  }

  function runInterval(iv, onComplete) {
    const phases = [{ kind: 'prep', label: 'Prepare-se', sec: 5 }];
    for (let k = 0; k < iv.reps; k++) {
      phases.push({ kind: 'work', label: `Forte ${k + 1}/${iv.reps}`, sec: iv.work });
      if (k < iv.reps - 1 && iv.rest > 0) phases.push({ kind: 'rest', label: `Leve ${k + 1}/${iv.reps}`, sec: iv.rest });
    }
    startRunner(phases, `${iv.work}s forte / ${iv.rest}s leve × ${iv.reps}`, onComplete);
  }

  function tickRunner(now) {
    const r = ui.runner;
    if (!r || r.done) return;
    const elapsed = ((r.pausedAt || now) - r.startAt - r.pausedMs) / 1000;
    let acc = 0; let idx = r.phases.length - 1; let remain = 0;
    for (let k = 0; k < r.phases.length; k++) {
      if (elapsed < acc + r.phases[k].sec) { idx = k; remain = acc + r.phases[k].sec - elapsed; break; }
      acc += r.phases[k].sec;
    }
    const finished = elapsed >= r.total;
    const p = r.phases[idx];
    if (finished) {
      r.done = true;
      cue.end();
      r.stop();
      if (!state.active && !ui.sessionOpen) setKeepAwake(false);
      if (r.onComplete) r.onComplete();
      else toast('Timer concluído!');
      return;
    }
    if (idx !== r.lastPhase) {
      if (r.lastPhase !== -1) (p.kind === 'work' ? cue.go : cue.rest)();
      r.lastPhase = idx;
    }
    const secCeil = Math.ceil(remain);
    if (secCeil !== r.lastSec) {
      if (secCeil <= 3 && secCeil > 0 && !r.pausedAt) cue.tick();
      r.lastSec = secCeil;
    }
    r.el.className = `runner ${p.kind}`;
    setText('run-phase', r.pausedAt ? 'Pausado' : p.label);
    document.getElementById('run-phase').className = `phase ${p.kind}`;
    setText('run-clock', Lg.fmtClock(secCeil));
    setText('run-pause', r.pausedAt ? 'Continuar' : 'Pausar');
    const bar = document.getElementById('run-prog');
    if (bar) bar.style.width = `${Math.min(100, (elapsed / r.total) * 100)}%`;
  }

  // Cronômetro da aba Timer
  const sw = { startAt: null, acc: 0, laps: [] };
  function swElapsed(now) { return sw.acc + (sw.startAt ? now - sw.startAt : 0); }
  function fmtMs(ms) { const t = Math.floor(ms / 100); return `${Lg.fmtClock(Math.floor(t / 10))}.${t % 10}`; }

  const countdownPresets = [30, 45, 60, 90, 120, 150, 180];
  const tset = { cd: 60, work: 20, rest: 40, reps: 6 };

  function viewTimer() {
    const wrap = h('main', { class: 'screen' }, topbar('Timer'));
    const modes = [['stopwatch', 'Cronômetro'], ['countdown', 'Regressivo'], ['interval', 'Intervalos']];
    wrap.appendChild(h('div', { class: 'seg', role: 'tablist' }, modes.map(([id, l]) => h('button', {
      class: ui.timerMode === id ? 'on' : '', role: 'tab', 'aria-selected': ui.timerMode === id ? 'true' : 'false',
      onclick: () => { ui.timerMode = id; render(); },
    }, l))));
    const card = h('div', { class: 'card', style: null });
    wrap.appendChild(card);
    if (ui.timerMode === 'stopwatch') {
      card.append(...[h('div', { class: 'big-clock', id: 'sw-clock', text: fmtMs(swElapsed(Date.now())) }),
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost grow', onclick: () => {
            if (sw.startAt) { sw.laps.unshift(swElapsed(Date.now())); render(); } else { sw.acc = 0; sw.laps = []; render(); }
          } }, sw.startAt ? 'Volta' : 'Zerar'),
          h('button', { class: 'btn primary grow', onclick: () => {
            if (sw.startAt) { sw.acc += Date.now() - sw.startAt; sw.startAt = null; } else sw.startAt = Date.now();
            render();
          } }, sw.startAt ? 'Pausar' : 'Iniciar')),
        sw.laps.length ? h('div', { class: 'laps' }, sw.laps.map((l, k) => h('div', { class: 'row between' },
          h('span', { class: 'muted', text: `Volta ${sw.laps.length - k}` }),
          h('span', { text: fmtMs(l - (sw.laps[k + 1] || 0)) }), h('span', { class: 'muted', text: fmtMs(l) })))) : null].filter(Boolean));
    } else if (ui.timerMode === 'countdown') {
      card.append(h('div', { class: 'big-clock', text: Lg.fmtClock(tset.cd) }),
        h('div', { class: 'chips' }, countdownPresets.map((s) => h('button', { class: `chip${tset.cd === s ? ' on' : ''}`, onclick: () => { tset.cd = s; render(); } }, Lg.fmtRest(s)))),
        h('div', { class: 'row', style: null },
          h('button', { class: 'btn ghost grow', onclick: () => { tset.cd = Math.max(5, tset.cd - 15); render(); } }, '−15s'),
          h('button', { class: 'btn ghost grow', onclick: () => { tset.cd += 15; render(); } }, '+15s')),
        h('button', { class: 'btn primary block', onclick: () => runCountdown(tset.cd, 'Regressivo', null) }, '▶ Iniciar'));
    } else {
      const num = (k, label, unit) => h('div', null, h('label', { class: 'lbl', text: label }),
        field(tset[k], null, unit, label, (v) => { if (v !== null && v >= 0 && v <= 3600) tset[k] = Math.round(v); }));
      card.append(h('p', { class: 'muted small', text: 'Padrão do Dia 5: tiro na esteira 20s forte / 40s leve × 6.' }),
        h('div', { class: 'form-grid' }, num('work', 'Forte', 's'), num('rest', 'Leve', 's'), num('reps', 'Rodadas', 'x')),
        h('button', { class: 'btn primary block', onclick: () => {
          if (!(tset.work > 0) || !(tset.reps > 0)) { toast('Valores inválidos.'); return; }
          runInterval({ work: tset.work, rest: tset.rest, reps: tset.reps }, null);
        } }, '▶ Iniciar intervalos'));
    }
    for (const el of card.children) el.classList.add('mt');
    return wrap;
  }

  // ================================================================ progresso

  function chart(points) {
    const NS = 'http://www.w3.org/2000/svg';
    const W = 320; const H = 150; const P = { l: 34, r: 10, t: 10, b: 22 };
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('class', 'chart');
    svg.setAttribute('role', 'img');
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
      if (text !== undefined) e.textContent = text;
      svg.appendChild(e);
      return e;
    };
    const vs = points.map((p) => p.v);
    let lo = Math.min(...vs); let hi = Math.max(...vs);
    if (lo === hi) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.1; lo -= pad; hi += pad;
    const x = (k) => P.l + (points.length === 1 ? (W - P.l - P.r) / 2 : (k * (W - P.l - P.r)) / (points.length - 1));
    const y = (v) => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
    mk('line', { x1: P.l, y1: H - P.b, x2: W - P.r, y2: H - P.b, class: 'axis' });
    mk('line', { x1: P.l, y1: P.t, x2: P.l, y2: H - P.b, class: 'axis' });
    mk('text', { x: 2, y: P.t + 8, class: 'lbl' }, Lg.fmtNum(hi));
    mk('text', { x: 2, y: H - P.b, class: 'lbl' }, Lg.fmtNum(lo));
    mk('text', { x: P.l, y: H - 6, class: 'lbl' }, fmtDate(points[0].t));
    if (points.length > 1) mk('text', { x: W - P.r - 40, y: H - 6, class: 'lbl' }, fmtDate(points[points.length - 1].t));
    mk('polyline', { points: points.map((p, k) => `${x(k)},${y(p.v)}`).join(' '), class: 'line' });
    points.forEach((p, k) => mk('circle', { cx: x(k), cy: y(p.v), r: 3.5, class: 'pt' }));
    const best = Math.max(...vs);
    svg.setAttribute('aria-label', `Gráfico com ${points.length} pontos, melhor ${Lg.fmtNum(best)}`);
    return svg;
  }

  function viewProgress() {
    const wrap = h('main', { class: 'screen' }, topbar('Progresso'));
    const hist = state.history;
    const now = Date.now();
    const weekAgo = now - 7 * Lg.DAY_MS;
    const vol = hist.reduce((a, s) => a + Lg.sessionStats(s).volume, 0);
    wrap.appendChild(h('div', { class: 'stat-grid' },
      h('div', { class: 'stat' }, h('b', { text: String(hist.length) }), h('span', { text: 'treinos' })),
      h('div', { class: 'stat' }, h('b', { text: String(hist.filter((s) => s.startedAt >= weekAgo).length) }), h('span', { text: 'últimos 7 dias' })),
      h('div', { class: 'stat' }, h('b', { text: vol >= 1000 ? `${Lg.fmtNum(vol / 1000)} t` : `${vol}` }), h('span', { text: 'volume total' }))));

    const exIds = [];
    state.plan.days.forEach((d) => d.items.forEach((it) => { if (!exIds.includes(it.ex)) exIds.push(it.ex); }));
    hist.forEach((se) => se.entries.forEach((e) => { if (EXERCISES[e.ex] && !exIds.includes(e.ex)) exIds.push(e.ex); }));
    if (!ui.progressEx || !exIds.includes(ui.progressEx)) {
      ui.progressEx = exIds.find((id) => hist.some((s) => s.entries.some((e) => e.ex === id))) || exIds[0];
    }
    wrap.appendChild(h('div', { class: 'section-title', text: 'Evolução por exercício' }));
    wrap.appendChild(h('div', { class: 'chips' }, exIds.map((id) => h('button', {
      class: `chip${ui.progressEx === id ? ' on' : ''}`, onclick: () => { ui.progressEx = id; render(); },
    }, EXERCISES[id].name))));

    const ex = EXERCISES[ui.progressEx];
    const ser = Lg.series(hist, ui.progressEx, ex, state.settings);
    const card = h('div', { class: 'card', style: null });
    card.classList.add('mt');
    card.append(h('div', { class: 'ex-head' },
      h('img', { src: gifSrc(ex.gifs[0]), alt: ex.name, onclick: () => openExerciseModal(ui.progressEx) }),
      h('div', { class: 'grow' }, h('div', { class: 'ex-name', text: ex.name }), h('div', { class: 'muted small', text: ser.label }),
        ser.points.length ? h('span', { class: 'badge gold', text: `Melhor: ${Lg.fmtNum(Math.max(...ser.points.map((p) => p.v)))}` }) : null)));
    if (!ser.points.length) card.append(h('p', { class: 'empty', text: 'Sem registros ainda.' }));
    else {
      card.append(chart(ser.points));
      const rows = [];
      hist.slice().sort((a, b) => b.startedAt - a.startedAt).forEach((s) => s.entries.forEach((e) => {
        if (e.ex === ui.progressEx && rows.length < 10) rows.push(h('tr', null, h('td', { text: fmtDate(s.startedAt) }), h('td', { text: setsSummary(e) })));
      }));
      card.append(h('table', { class: 'tbl' }, h('tbody', null, rows)));
    }
    wrap.appendChild(card);
    if ((Lg.typeOf(ex) === 'max' || ex.load === 'bw') && !state.settings.bodyweight) {
      wrap.appendChild(h('p', { class: 'muted tiny', text: 'Dica: informe seu peso corporal em Ajustes para ver o 1RM estimado de barra e paralelas.' }));
    }
    wrap.appendChild(h('div', { class: 'section-title', text: CHALLENGE.title }));
    wrap.appendChild(challengeCard());
    return wrap;
  }


  // ================================================================ programas, biblioteca, editor, guia

  function programById(id) { return PROGRAMS.find((p) => p.id === id) || null; }

  function findDay(dayId) {
    const pools = [state.plan, ...Object.values(state.plans || {}), ...PROGRAMS];
    for (const p of pools) {
      const d = p && p.days && p.days.find((x) => x.id === dayId);
      if (d) return d;
    }
    return null;
  }

  function openPage(page) { ui.page = page; render(); window.scrollTo(0, 0); }
  function closePage() { ui.page = null; ui.pickDay = null; render(); window.scrollTo(0, 0); }

  function switchProgram(id) {
    if (state.active) { toast('Finalize ou descarte o treino em andamento antes de trocar.'); return; }
    state.plans[state.plan.id] = state.plan;
    const saved = state.plans[id];
    const base = programById(id);
    state.plan = saved ? saved : clone(base);
    state.onboarded = true;
    save();
    ui.page = null;
    render();
    window.scrollTo(0, 0);
    toast(`Programa ativo: ${state.plan.name}`);
  }

  function createCustom() {
    let n = 1;
    while (state.plans[`custom${n}`] || state.plan.id === `custom${n}`) n += 1;
    const id = `custom${n}`;
    state.plans[state.plan.id] = state.plan;
    state.plan = {
      id, name: n === 1 ? 'Meu treino' : `Meu treino ${n}`, short: 'Meu treino', custom: true,
      days: [{ id: `${id}-a`, name: 'Treino A', title: 'Novo treino', mode: 'normal', items: [] }],
    };
    state.onboarded = true;
    save();
    openPage('editor');
  }

  function exerciseBadges(ex) {
    return h('div', { class: 'chips' },
      ex.group ? h('span', { class: 'badge accent', text: GROUPS[ex.group] }) : null,
      (ex.secondary || []).map((g) => h('span', { class: 'badge', text: GROUPS[g] })),
      (ex.equip || []).map((e) => h('span', { class: 'badge gold', text: EQUIP[e] })),
      ex.level ? h('span', { class: 'badge', text: LEVELS[ex.level] }) : null);
  }

  function programCard(p, recommended) {
    const isActive = state.plan.id === p.id;
    const groups = new Set();
    p.days.forEach((d) => d.items.forEach((i) => groups.add(EXERCISES[i.ex].group)));
    return h('div', { class: `card ${recommended ? 'hero' : ''}` },
      h('div', { class: 'row between' },
        h('div', { class: 'grow' },
          recommended ? h('div', { class: 'day-num', text: '★ Recomendado para você' }) : null,
          h('h3', { text: p.name })),
        isActive ? h('span', { class: 'badge ok', text: 'Ativo' }) : null),
      h('div', { class: 'chips mt' },
        h('span', { class: 'badge gold', text: `${p.daysPerWeek} dias/semana` }),
        h('span', { class: 'badge', text: LEVELS[p.level] }),
        h('span', { class: 'badge', text: PLACES[p.place] }),
        h('span', { class: 'badge', text: p.goal })),
      h('p', { class: 'muted small mt', text: p.description }),
      h('div', { class: 'row mt' },
        h('button', { class: 'btn ghost grow sm', onclick: () => openProgramModal(p) }, 'Ver treinos'),
        isActive ? null : h('button', { class: 'btn primary grow sm', onclick: () => confirmSwitch(p) }, 'Usar este')));
  }

  function confirmSwitch(p) {
    const saved = state.plans[p.id];
    confirmModal(`Usar “${p.name}”?`, saved ? 'Suas edições anteriores neste programa serão mantidas. O histórico continua salvo.' : 'Seu histórico continua salvo. Você pode voltar ao programa atual quando quiser.', 'Usar', () => switchProgram(p.id));
  }

  function openProgramModal(p) {
    openModal((box, close) => {
      box.append(h('h2', { text: p.name }), h('p', { class: 'muted small', text: p.description }));
      p.days.forEach((d) => {
        box.append(h('h3', { class: 'mt', text: `${d.name} – ${d.title}${d.mode === 'circuit' ? ` (circuito ${d.rounds} voltas)` : ''}` }));
        box.append(h('table', { class: 'tbl' }, h('tbody', null, d.items.map((it) => h('tr', null,
          h('td', null, h('button', { class: 'linkish', onclick: () => openExerciseModal(it.ex) }, EXERCISES[it.ex].name)),
          h('td', { class: 'muted', text: `${Lg.prescription(it, EXERCISES[it.ex])} · ${Lg.fmtRest(it.rest)}` }))))));
      });
      const vol = Lg.weeklyVolume(p, EXERCISES);
      box.append(h('h3', { class: 'mt', text: 'Séries por semana (1 rodada do programa)' }), volumeBars(vol, p.daysPerWeek > p.days.length ? p.daysPerWeek / p.days.length : 1));
      box.append(h('div', { class: 'row mt' },
        h('button', { class: 'btn ghost grow', onclick: close }, 'Fechar'),
        state.plan.id === p.id ? null : h('button', { class: 'btn primary grow', onclick: () => { close(); confirmSwitch(p); } }, 'Usar este')));
    });
  }

  function viewPrograms() {
    const wrap = h('main', { class: 'screen' }, pageTop(state.onboarded ? 'Programas' : 'Bem-vindo ao Dojo'));
    const q = ui.quiz;
    const rec = recommend(q);
    if (!state.onboarded) {
      wrap.appendChild(h('p', { class: 'muted', text: 'Responda 4 perguntas e eu sugiro o melhor programa para você. Dá para trocar ou editar depois.' }));
    }
    const ask = (label, key, opts) => h('div', { class: 'mt' }, h('label', { class: 'lbl', text: label }),
      h('div', { class: 'chips' }, opts.map(([v, l]) => h('button', { class: `chip${q[key] === v ? ' on' : ''}`, onclick: () => { q[key] = v; render(); } }, l))));
    wrap.appendChild(h('div', { class: 'card' },
      h('h3', { text: 'Qual programa combina com você?' }),
      ask('Quantos dias por semana você consegue treinar?', 'days', [[2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6']]),
      ask('Experiência', 'level', [['iniciante', 'Iniciante (< 6 meses)'], ['intermediario', 'Intermediário'], ['avancado', 'Avançado (2+ anos)']]),
      ask('Onde vai treinar?', 'place', [['academia', 'Academia'], ['halteres', 'Casa com halteres'], ['casa', 'Casa sem equipamento']]),
      ask('Objetivo principal', 'goal', [['hipertrofia', 'Ganhar massa'], ['forca', 'Ganhar força'], ['condicionamento', 'Condicionamento / emagrecer']])));
    const recP = programById(rec);
    wrap.appendChild(h('div', { class: 'section-title', text: 'Sugestão' }));
    wrap.appendChild(programCard(recP, true));
    wrap.appendChild(h('div', { class: 'section-title', text: 'Todos os programas' }));
    wrap.appendChild(h('div', { class: 'stack' }, PROGRAMS.filter((p) => p.id !== rec).map((p) => programCard(p, false))));
    const customs = Object.values(state.plans).concat([state.plan]).filter((p, i, arr) => p.custom && arr.findIndex((x) => x.id === p.id) === i);
    wrap.appendChild(h('div', { class: 'section-title', text: 'Meus treinos' }));
    const mine = h('div', { class: 'stack' });
    customs.forEach((p) => mine.appendChild(h('div', { class: 'card row between' },
      h('div', { class: 'grow' }, h('div', { class: 'ex-name', text: p.name }), h('div', { class: 'muted small', text: `${p.days.length} treino(s)` })),
      state.plan.id === p.id ? h('span', { class: 'badge ok', text: 'Ativo' }) : h('button', { class: 'btn sm primary', onclick: () => switchProgram(p.id) }, 'Usar'))));
    mine.appendChild(h('button', { class: 'btn ghost block', onclick: createCustom }, '+ Montar meu próprio treino do zero'));
    wrap.appendChild(mine);
    if (!state.onboarded) {
      wrap.appendChild(h('button', { class: 'btn block mt', onclick: () => { state.onboarded = true; save(); closePage(); } }, `Continuar com ${state.plan.name}`));
    }
    return wrap;
  }

  function pageTop(title) {
    return h('div', { class: 'topbar' },
      h('div', { class: 'row' },
        state.onboarded || ui.page !== 'programs' ? h('button', { class: 'icon-btn', 'aria-label': 'Voltar', onclick: closePage }, '←') : null,
        h('h1', { text: title })));
  }

  // ---------------------------------------------------------------- biblioteca

  function filteredExercises() {
    const f = ui.lib;
    const q = f.q.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return Object.entries(EXERCISES).filter(([id, ex]) => {
      if (id === 'barra_carga') return false;
      if (f.group && ex.group !== f.group && !(ex.secondary || []).includes(f.group)) return false;
      if (f.equip && !(ex.equip || []).includes(f.equip)) return false;
      if (q) {
        const hay = `${ex.name} ${ex.muscles} ${GROUPS[ex.group] || ''}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      const pa = a[1].group === ui.lib.group ? 0 : 1;
      const pb = b[1].group === ui.lib.group ? 0 : 1;
      return pa - pb || a[1].name.localeCompare(b[1].name, 'pt-BR');
    });
  }

  function viewLibrary() {
    const picking = ui.pickDay ? state.plan.days.find((d) => d.id === ui.pickDay) : null;
    const wrap = h('main', { class: 'screen' }, picking ? pageTop(`Adicionar em ${picking.name}`) : topbar('Exercícios'));
    const f = ui.lib;
    const search = h('input', { class: 'text-input', type: 'search', placeholder: 'Buscar exercício ou músculo…', value: f.q, 'aria-label': 'Buscar',
      oninput: (e) => { f.q = e.target.value; paintList(); } });
    wrap.appendChild(search);
    const chipRow = (label, key, map) => h('div', { class: 'mt' }, h('label', { class: 'lbl', text: label }),
      h('div', { class: 'chips scroll-x' },
        h('button', { class: `chip${!f[key] ? ' on' : ''}`, onclick: () => { f[key] = null; render(); } }, 'Todos'),
        Object.entries(map).map(([k, l]) => h('button', { class: `chip${f[key] === k ? ' on' : ''}`, onclick: () => { f[key] = f[key] === k ? null : k; render(); } }, l))));
    wrap.appendChild(chipRow('Grupo muscular', 'group', GROUPS));
    wrap.appendChild(chipRow('Equipamento', 'equip', EQUIP));
    const count = h('div', { class: 'section-title' });
    const list = h('div', { class: 'stack' });
    wrap.append(count, list);
    function paintList() {
      const items = filteredExercises();
      count.textContent = `${items.length} exercício${items.length === 1 ? '' : 's'}`;
      list.textContent = '';
      if (!items.length) list.appendChild(h('div', { class: 'card empty', text: 'Nada encontrado com esses filtros.' }));
      items.forEach(([id, ex]) => list.appendChild(h('div', { class: 'card tap', onclick: () => (picking ? addItem(picking, id) : openExerciseModal(id)) },
        h('div', { class: 'ex-head' },
          h('img', { src: gifSrc(ex.gifs[0]), alt: ex.name, loading: 'lazy' }),
          h('div', { class: 'grow' },
            h('div', { class: 'ex-name', text: ex.name }),
            h('div', { class: 'muted small', text: ex.muscles }),
            h('div', { class: 'chips mt-s' },
              h('span', { class: 'badge accent', text: GROUPS[ex.group] }),
              ex.gifs.some((g) => MEDIA[g]) ? h('span', { class: 'badge ok', text: '▶ Vídeo' }) : null,
              (ex.equip || []).slice(0, 2).map((e) => h('span', { class: 'badge gold', text: EQUIP[e] })))),
          picking ? h('span', { class: 'icon-btn center', 'aria-hidden': 'true', text: '+' }) : null))));
    }
    paintList();
    return wrap;
  }

  function addToPlanFlow(exId) {
    const days = state.plan.days;
    if (days.length === 1) { addItem(days[0], exId); return; }
    openModal((box, close) => {
      box.append(h('h2', { text: 'Adicionar em qual treino?' }), h('p', { class: 'muted small', text: `${EXERCISES[exId].name} → ${state.plan.name}` }),
        h('div', { class: 'stack' }, days.map((d) => h('button', { class: 'btn block', onclick: () => { close(); addItem(d, exId); } }, `${d.name} – ${d.title}`))),
        h('button', { class: 'btn ghost block mt', onclick: close }, 'Cancelar'));
    });
  }

  function addItem(day, exId) {
    if (day.items.length >= 30) { toast('Limite de 30 exercícios por treino.'); return; }
    day.items.push(Lg.newItem(exId, EXERCISES[exId], day.id, day.items));
    save();
    toast(`${EXERCISES[exId].name} adicionado em ${day.name}.`);
    if (ui.pickDay) { ui.pickDay = null; ui.tab = 'home'; ui.page = 'editor'; render(); window.scrollTo(0, 0); }
  }

  // ---------------------------------------------------------------- editor

  function viewEditor() {
    const plan = state.plan;
    const wrap = h('main', { class: 'screen' }, pageTop('Editar treino'));
    wrap.appendChild(h('div', { class: 'card' },
      h('label', { class: 'lbl', text: 'Nome do programa' }),
      h('input', { class: 'text-input', value: plan.name || '', maxlength: 60, 'aria-label': 'Nome do programa',
        oninput: (e) => { plan.name = e.target.value.slice(0, 60) || 'Meu treino'; plan.short = plan.name.slice(0, 24); save(); } })));
    plan.days.forEach((d, di) => {
      const card = h('div', { class: 'card mt' });
      card.append(h('div', { class: 'form-grid' },
        h('div', null, h('label', { class: 'lbl', text: 'Nome' }), h('input', { class: 'text-input', value: d.name, maxlength: 40, oninput: (e) => { d.name = e.target.value.slice(0, 40) || `Treino ${di + 1}`; save(); } })),
        h('div', null, h('label', { class: 'lbl', text: 'Foco' }), h('input', { class: 'text-input', value: d.title, maxlength: 60, oninput: (e) => { d.title = e.target.value.slice(0, 60) || 'Treino'; save(); } }))));
      card.append(h('div', { class: 'row mt' },
        h('span', { class: 'small muted grow', text: 'Formato' }),
        h('div', { class: 'seg compact' },
          h('button', { class: d.mode === 'normal' ? 'on' : '', onclick: () => { d.mode = 'normal'; save(); render(); } }, 'Séries'),
          h('button', { class: d.mode === 'circuit' ? 'on' : '', onclick: () => { d.mode = 'circuit'; d.rounds = d.rounds || 3; d.roundRest = d.roundRest || 90; save(); render(); } }, 'Circuito'))));
      if (!d.items.length) card.append(h('p', { class: 'muted small mt', text: 'Nenhum exercício. Adicione abaixo.' }));
      const tbl = h('div', { class: 'stack mt' });
      d.items.forEach((it, ii) => {
        const ex = EXERCISES[it.ex];
        tbl.appendChild(h('div', { class: 'edit-row' },
          h('img', { src: gifSrc(ex.gifs[0]), alt: '', loading: 'lazy' }),
          h('div', { class: 'grow' }, h('div', { class: 'small', text: ex.name }), h('div', { class: 'tiny muted', text: `${Lg.prescription(it, ex)} · ${Lg.fmtRest(it.rest)}` })),
          h('button', { class: 'icon-btn sm', 'aria-label': 'Subir', disabled: ii === 0, onclick: () => { d.items.splice(ii - 1, 0, d.items.splice(ii, 1)[0]); save(); render(); } }, '↑'),
          h('button', { class: 'icon-btn sm', 'aria-label': 'Descer', disabled: ii === d.items.length - 1, onclick: () => { d.items.splice(ii + 1, 0, d.items.splice(ii, 1)[0]); save(); render(); } }, '↓'),
          h('button', { class: 'icon-btn sm', 'aria-label': `Editar ${ex.name}`, onclick: () => openEditItem(d, it) }, '✎'),
          h('button', { class: 'icon-btn sm', 'aria-label': `Remover ${ex.name}`, onclick: () => { d.items.splice(ii, 1); save(); render(); } }, '✕')));
      });
      card.append(tbl);
      card.append(h('div', { class: 'row mt' },
        h('button', { class: 'btn grow sm primary', onclick: () => { ui.pickDay = d.id; ui.lib = { q: '', group: null, equip: null }; ui.page = null; ui.tab = 'library'; render(); window.scrollTo(0, 0); } }, '+ Exercício'),
        plan.days.length > 1 ? h('button', { class: 'btn ghost sm', onclick: () => confirmModal(`Remover ${d.name}?`, 'O histórico desse treino continua salvo.', 'Remover', () => { plan.days.splice(di, 1); save(); render(); }) }, 'Remover treino') : null));
      wrap.appendChild(card);
    });
    if (plan.days.length < 7) {
      wrap.appendChild(h('button', { class: 'btn ghost block mt', onclick: () => {
        const letter = String.fromCharCode(65 + plan.days.length);
        let k = plan.days.length + 1;
        while (plan.days.some((x) => x.id === `${plan.id}-n${k}`)) k += 1;
        plan.days.push({ id: `${plan.id}-n${k}`, name: `Treino ${letter}`, title: 'Novo treino', mode: 'normal', items: [] });
        save(); render();
      } }, '+ Adicionar treino (dia)'));
    }
    const vol = Lg.weeklyVolume(plan, EXERCISES);
    wrap.appendChild(h('div', { class: 'section-title', text: 'Volume semanal por músculo' }));
    wrap.appendChild(h('div', { class: 'card' }, h('p', { class: 'muted tiny', text: 'Considera fazer cada treino 1x por semana. Meta para hipertrofia: ~10–20 séries.' }), volumeBars(vol, 1)));
    return wrap;
  }

  function volumeBars(vol, mult) {
    const order = Object.keys(GROUPS).filter((g) => g !== 'cardio' && g !== 'potencia');
    const box = h('div', { class: 'vol' });
    order.forEach((g) => {
      const v = Math.round((vol[g] || 0) * mult * 10) / 10;
      const cls = v < 6 ? 'low' : v < 10 ? 'mid' : v <= 22 ? 'ok' : 'high';
      const bar = h('i', { class: cls });
      bar.style.width = `${Math.min(100, (v / 25) * 100)}%`;
      box.appendChild(h('div', { class: 'vol-row' },
        h('span', { class: 'small', text: GROUPS[g] }),
        h('div', { class: 'vol-bar' }, bar, h('b', { class: 'vol-target', 'aria-hidden': 'true' })),
        h('span', { class: `tiny vol-n ${cls}`, text: Lg.fmtNum(v) })));
    });
    box.appendChild(h('p', { class: 'tiny muted mt', text: 'Faixa marcada: 10–20 séries/semana. Grupos secundários contam meia série.' }));
    return box;
  }

  // ---------------------------------------------------------------- guia

  function viewGuide() {
    const wrap = h('main', { class: 'screen' }, pageTop('Guia de treino'));
    wrap.appendChild(h('p', { class: 'muted small', text: 'Resumo baseado em estudos e diretrizes (ACSM, meta-análises de volume e frequência). Não substitui orientação profissional.' }));
    GUIDE.forEach((sec) => wrap.appendChild(h('div', { class: 'card mt' }, h('h3', { text: sec.title }), h('ul', { class: 'guide' }, sec.body.map((b) => h('li', { text: b }))))));
    wrap.appendChild(h('div', { class: 'section-title', text: `Seu plano: ${state.plan.name}` }));
    wrap.appendChild(h('div', { class: 'card' }, volumeBars(Lg.weeklyVolume(state.plan, EXERCISES), 1)));
    wrap.appendChild(h('div', { class: 'section-title', text: 'Melhores exercícios por músculo' }));
    const best = {
      peito: ['supino_reto', 'supino_inclinado', 'paralelas', 'crossover'], costas: ['barra_fixa', 'remada_curvada', 'puxada_alta', 'serrote'],
      ombros: ['desenvolvimento_halteres', 'elevacao_lateral', 'face_pull'], biceps: ['rosca_direta', 'rosca_scott', 'rosca_martelo'],
      triceps: ['paralelas', 'triceps_frances', 'triceps_testa', 'triceps_corda'], quadriceps: ['agachamento', 'leg_press', 'bulgaro', 'cadeira_extensora'],
      posterior: ['stiff', 'cadeira_flexora', 'terra'], gluteos: ['elevacao_pelvica', 'bulgaro', 'agachamento'],
      panturrilha: ['panturrilha_pe', 'panturrilha_sentado'], core: ['roda_abdominal', 'elevacao_pernas', 'prancha'],
    };
    const tbl = h('div', { class: 'card stack' });
    Object.entries(best).forEach(([g, ids]) => tbl.appendChild(h('div', null, h('div', { class: 'day-num', text: GROUPS[g] }),
      h('div', { class: 'chips mt-s' }, ids.map((id) => h('button', { class: 'chip', onclick: () => openExerciseModal(id) }, EXERCISES[id].name))))));
    tbl.appendChild(h('p', { class: 'tiny muted', text: 'Combine 1 multiarticular pesado + 1–2 exercícios que treinem o músculo alongado (ex.: inclinado, Scott, francês, flexora sentada, stiff).' }));
    wrap.appendChild(tbl);
    wrap.appendChild(h('div', { class: 'section-title', text: 'Fontes' }));
    wrap.appendChild(h('div', { class: 'card' }, h('ol', { class: 'tiny muted' }, SOURCES.map((x) => h('li', { text: x })))));
    return wrap;
  }

  // ================================================================ ajustes

  function viewSettings() {
    const st = state.settings;
    const wrap = h('main', { class: 'screen' }, topbar('Ajustes'));
    const toggle = (k, label, desc) => h('div', { class: 'toggle' },
      h('div', null, h('div', { text: label }), desc ? h('div', { class: 'muted tiny', text: desc }) : null),
      h('button', { class: `switch${st[k] ? ' on' : ''}`, role: 'switch', 'aria-checked': st[k] ? 'true' : 'false', 'aria-label': label,
        onclick: () => { st[k] = !st[k]; save(); render(); } }));

    wrap.appendChild(h('div', { class: 'card' },
      h('div', { class: 'form-grid' },
        h('div', null, h('label', { class: 'lbl', text: 'Peso corporal' }), field(st.bodyweight, '—', 'kg', 'Peso corporal', (v) => { st.bodyweight = v !== null && v > 0 && v < 400 ? v : null; save(); })),
        h('div', null, h('label', { class: 'lbl', text: 'Menor incremento' }),
          h('div', { class: 'chips' }, [0.5, 1, 1.25, 2.5].map((v) => h('button', { class: `chip${st.step === v ? ' on' : ''}`, onclick: () => { st.step = v; save(); render(); } }, `${numStr(v)} kg`))))),
      toggle('sound', 'Sons', 'Bipes no fim do descanso e nas trocas de intervalo'),
      toggle('vibrate', 'Vibração'),
      toggle('keepAwake', 'Manter tela ligada no treino', 'Evita que o timer pare com a tela apagada')));

    wrap.appendChild(h('div', { class: 'section-title', text: 'Plano de treino' }));
    wrap.appendChild(h('div', { class: 'card stack' },
      h('div', { class: 'ex-name', text: state.plan.name || 'Meu treino' }),
      h('div', { class: 'row' },
        h('button', { class: 'btn grow', onclick: () => openPage('editor') }, '✎ Editar treino'),
        h('button', { class: 'btn grow', onclick: () => openPage('programs') }, '⇄ Trocar programa')),
      h('button', { class: 'btn ghost block', onclick: () => openPage('guide') }, '📘 Guia de treino'),
      programById(state.plan.id) ? h('button', { class: 'btn ghost block sm', onclick: () => confirmModal('Restaurar programa original?', 'Séries, repetições, exercícios e descansos voltam ao original. O histórico é mantido.', 'Restaurar', () => {
        state.plan = clone(programById(state.plan.id)); save(); render(); toast('Programa restaurado.');
      }) }, 'Restaurar programa original') : null));

    wrap.appendChild(h('div', { class: 'section-title', text: 'Seus dados' }));
    wrap.appendChild(h('div', { class: 'card stack' },
      h('p', { class: 'muted small', text: 'Tudo fica salvo só neste aparelho. O app não tem permissão de internet e não envia nada para lugar nenhum. Faça backup antes de trocar de celular ou reinstalar.' }),
      h('div', { class: 'row' },
        h('button', { class: 'btn grow', onclick: exportBackup }, '⇩ Exportar backup'),
        h('button', { class: 'btn grow', onclick: importBackup }, '⇧ Importar backup')),
      h('button', { class: 'btn danger block', onclick: () => confirmModal('Apagar TODOS os dados?', 'Histórico, testes e ajustes serão apagados deste aparelho.', 'Apagar tudo', () => {
        state = defaultState(); save(); ui.sessionOpen = false; ui.page = 'programs'; setKeepAwake(false); render(); toast('Dados apagados.');
      }) }, 'Apagar todos os dados')));

    wrap.appendChild(h('button', { class: 'btn ghost block mt', onclick: openCreditsModal }, 'Créditos e licenças'));
    wrap.appendChild(h('p', { class: 'muted tiny', style: null, text: `Dojo v${APP_VERSION} · GIFs gerados pelo próprio projeto · Plano baseado em “Anime Physique Files #005 – Toji Fushiguro”. Consulte um profissional antes de iniciar treinos intensos.` }));
    wrap.lastChild.classList.add('mt');
    return wrap;
  }

  function openCreditsModal() {
    const LIC = { 'CC-BY-SA-4.0': 'creativecommons.org/licenses/by-sa/4.0', 'CC-BY-4.0': 'creativecommons.org/licenses/by/4.0', CC0: 'creativecommons.org/publicdomain/zero/1.0' };
    openModal((box, close) => {
      box.append(h('h2', { text: 'Créditos e licenças' }),
        h('p', { class: 'small muted', text: 'Animações (GIFs) feitas pelo próprio projeto. Vídeos de terceiros com licença aberta, recortados, reenquadrados e sem áudio; os clipes derivados seguem a mesma licença.' }));
      const rows = Object.entries(MEDIA).map(([id, m]) => {
        const ex = Object.values(EXERCISES).find((e) => e.gifs.includes(id));
        return h('tr', null, h('td', { text: ex ? ex.name : id }), h('td', { class: 'tiny muted', text: `${m.credit} · ${m.license}${LIC[m.license] ? ` (${LIC[m.license]})` : ''}${m.source ? ` · ${m.source.replace('https://', '')}` : ''}` }));
      });
      if (rows.length) box.append(h('table', { class: 'tbl' }, h('tbody', null, rows)));
      box.append(h('button', { class: 'btn block mt', onclick: close }, 'Fechar'));
    });
  }

  function openEditItem(day, it) {
    const ex = EXERCISES[it.ex];
    const t = Lg.typeOf(ex);
    const f = { sets: it.sets, min: it.min, max: it.max, rest: it.rest };
    const unit = t === 'time' ? 's' : t === 'distance' ? 'm' : 'reps';
    openModal((box, close) => {
      const num = (k, label, u) => h('div', null, h('label', { class: 'lbl', text: label }), field(f[k], null, u, label, (v) => { f[k] = v; }));
      box.append(h('h2', { text: ex.name }), h('p', { class: 'muted small', text: `${day.name} – ${day.title}` }),
        h('div', { class: 'form-grid' },
          day.mode === 'circuit' ? null : num('sets', 'Séries', 'x'),
          t === 'max' || t === 'interval' ? null : num('min', 'Mínimo', unit),
          t === 'max' || t === 'interval' ? null : num('max', 'Máximo', unit),
          num('rest', 'Descanso', 's')),
        h('div', { class: 'row mt' },
          h('button', { class: 'btn ghost grow', onclick: close }, 'Cancelar'),
          h('button', { class: 'btn primary grow', onclick: () => {
            const n = { sets: Math.round(f.sets), min: f.min, max: f.max, rest: Math.round(f.rest) };
            if (!(n.sets >= 1 && n.sets <= 20) || !(n.min >= 0) || !(n.max >= n.min) || n.max > 10000 || !(n.rest >= 0 && n.rest <= 3600)) {
              toast('Valores inválidos (máximo ≥ mínimo, séries 1–20).'); return;
            }
            Object.assign(it, n); save(); close(); render(); toast('Plano atualizado.');
          } }, 'Salvar')));
    });
  }

  // ---------------------------------------------------------------- backup

  function backupObject() {
    const plans = Object.assign({}, state.plans, { [state.plan.id]: state.plan });
    return { app: 'dojo', version: 2, exportedAt: new Date().toISOString(), plans, programId: state.plan.id, history: state.history, challenge: state.challenge, settings: state.settings };
  }

  function exportBackup() {
    const content = JSON.stringify(backupObject(), null, 1);
    const name = `dojo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    if (Native.available) { Native.post({ type: 'export', filename: name, content }); return; }
    openModal((box, close) => {
      const ta = h('textarea', { class: 'text-input', readonly: true }, content);
      box.append(h('h2', { text: 'Backup' }), h('p', { class: 'muted small', text: 'Copie o texto abaixo e guarde em local seguro.' }), ta,
        h('div', { class: 'row mt' },
          h('button', { class: 'btn grow', onclick: () => { ta.select(); if (navigator.clipboard) navigator.clipboard.writeText(content).then(() => toast('Copiado!'), () => toast('Selecione e copie manualmente.')); } }, 'Copiar'),
          h('button', { class: 'btn primary grow', onclick: close }, 'Fechar')));
    });
  }

  function importBackup() {
    if (Native.available) { Native.post({ type: 'import' }); return; }
    openModal((box, close) => {
      const ta = h('textarea', { class: 'text-input', placeholder: 'Cole aqui o conteúdo do backup (.json)' });
      box.append(h('h2', { text: 'Importar backup' }), ta,
        h('div', { class: 'row mt' },
          h('button', { class: 'btn ghost grow', onclick: close }, 'Cancelar'),
          h('button', { class: 'btn primary grow', onclick: () => { close(); importBackupText(ta.value); } }, 'Importar')));
    });
  }

  function importBackupText(text) {
    if (typeof text !== 'string' || text.length > 5 * 1024 * 1024) { toast('Arquivo grande demais.'); return; }
    let obj;
    try { obj = JSON.parse(text); } catch (e) { toast('JSON inválido.'); return; }
    const v = Lg.validateBackup(obj, EXERCISES);
    if (!v.ok) { toast(v.error); return; }
    const data = v.data;
    confirmModal('Importar backup?', `${data.history.length} treino(s) serão carregados e substituirão os dados atuais.`, 'Importar', () => {
      const d = defaultState();
      obj = data;
      state = {
        plan: obj.plans[obj.programId], plans: obj.plans, onboarded: true, history: obj.history, challenge: obj.challenge, active: null,
        settings: Object.assign(d.settings, {
          bodyweight: obj.settings.bodyweight ?? null, step: obj.settings.step || 0.5,
          sound: obj.settings.sound !== false, vibrate: obj.settings.vibrate !== false, keepAwake: obj.settings.keepAwake !== false,
          startDate: typeof obj.settings.startDate === 'number' ? obj.settings.startDate : null,
        }),
      };
      save(); ui.sessionOpen = false; render(); toast('Backup importado!');
    });
  }

  // ================================================================ loop de atualização

  function setText(id, txt) { const el = document.getElementById(id); if (el && el.textContent !== txt) el.textContent = txt; }

  function tick() {
    const now = Date.now();
    const a = state.active;
    if (a) {
      const txt = Lg.fmtClock((now - a.startedAt) / 1000);
      document.querySelectorAll('[data-clock="session"]').forEach((el) => { if (el.textContent !== txt) el.textContent = txt; });
      const r = a.rest;
      if (r) {
        const left = (r.endAt - now) / 1000;
        const sec = Math.max(0, Math.ceil(left));
        if (sec !== r.lastBeep && sec <= 3 && sec > 0) { cue.tick(); r.lastBeep = sec; }
        if (left <= 0 && !r.finished) {
          r.finished = true;
          cue.go();
          save();
        }
        const bar = document.getElementById('restbar');
        if (bar) {
          bar.classList.toggle('done', r.finished);
          setText('rest-time', r.finished ? 'Bora! 🔥' : Lg.fmtClock(sec));
          setText('rest-label', r.finished ? 'Descanso concluído — próxima série' : r.label);
          const p = document.getElementById('rest-prog');
          if (p) p.style.width = `${Math.min(100, (1 - Math.max(0, left) / r.total) * 100)}%`;
        }
        if (r.finished && left < -6) { a.rest = null; save(); render(); return; }
      }
    }
    if (ui.tab === 'timer' && ui.timerMode === 'stopwatch') setText('sw-clock', fmtMs(swElapsed(now)));
    tickRunner(now);
  }

  setInterval(tick, 200);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });

  /** Chamado pelo botão Voltar do Android. Retorna true se tratou o evento. */
  window.dojoBack = function () {
    if (ui.modals.length) { closeModal(); return true; }
    if (ui.runner) { confirmModal('Parar o timer?', '', 'Parar', () => ui.runner && ui.runner.stop()); return true; }
    if (ui.sessionOpen) { ui.sessionOpen = false; render(); return true; }
    if (ui.page) { closePage(); return true; }
    if (ui.tab !== 'home') { ui.tab = 'home'; render(); return true; }
    return false;
  };

  window.addEventListener('error', (e) => console.error(`DOJO_ERROR ${e.message}`));
  if (state.active && state.settings.keepAwake) setKeepAwake(true);
  render();
  // Sinal para o teste no emulador (só aparece no logcat em builds de debug).
  const h264 = document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E"') !== '';
  console.info(`DOJO_READY bridge=${Native.available} days=${state.plan.days.length} h264=${h264} videos=${Object.keys(MEDIA).length}`);
})();

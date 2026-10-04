/* =========================================================
   Mat Log: UI
   Screens render to HTML strings; one delegated click handler
   dispatches [data-act] to ACTIONS. Sheets edit a `draft` and
   only touch `state` on save.
   ========================================================= */

const $ = (sel, root = document) => root.querySelector(sel);
const ui = {
  screen: 'home',
  skillsTab: 'plan',
  libFilter: 'all',
  libSearch: '',
  logSearch: '',
  reviewMode: 'week',
  reviewAnchor: todayISO(),
  compId: null,
};
let draft = null;

const ICON = {
  home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>',
  log: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="17" rx="3"/><path d="M8 2v4M16 2v4M4 10h16M8 14h3M8 17h6"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  skills: '<svg viewBox="0 0 24 24"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>',
  review: '<svg viewBox="0 0 24 24"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>',
  chev: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5l4 4L7 21l-4 1 1-4z"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>',
  doc: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>',
  mic: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
};

/* =========================================================
   CORE
   ========================================================= */
// toast('Saved') or toast('Deleted', { label: 'Undo', fn: () => ... })
function toast(msg, action) {
  const t = $('#toast');
  t.innerHTML = escapeHtml(msg) + (action ? ` <button class="toast-btn" id="toastAct">${escapeHtml(action.label)}</button>` : '');
  t.classList.toggle('has-action', !!action);
  t.classList.add('show');
  if (action) $('#toastAct').onclick = e => { e.stopPropagation(); t.classList.remove('show'); action.fn(); };
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), action ? 5000 : 2000);
}

function applyTheme() {
  const t = state.settings.theme;
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}

function show(screen) {
  ui.screen = screen;
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + screen));
  const tab = ['progress', 'comps', 'comp', 'report'].includes(screen) ? 'home' : screen;
  document.querySelectorAll('nav.tabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  renderScreen(screen);
  window.scrollTo(0, 0);
}

function renderScreen(screen = ui.screen) {
  renderHeader();
  const fn = { home: renderHome, log: renderLog, skills: renderSkills, review: renderReview, progress: renderProgress,
    comps: renderComps, comp: renderComp, report: renderReport }[screen];
  if (fn) $('#screen-' + screen).innerHTML = fn();
}

function save() { saveState(); }

/* ---------- sheet ---------- */
function openSheet(html) {
  $('#sheetBody').innerHTML = html;
  $('#sheetBg').classList.add('open');
  $('.sheet').scrollTop = 0;
  document.body.style.overflow = 'hidden';
}
function refreshSheet(html) {
  const sh = $('.sheet');
  const top = sh.scrollTop;
  const active = document.activeElement;
  const activeKey = active && active.dataset ? (active.dataset.bind || active.dataset.input) : null;
  $('#sheetBody').innerHTML = html;
  sh.scrollTop = top;
  if (activeKey) {
    const el = $(`[data-bind="${activeKey}"], [data-input="${activeKey}"]`, sh);
    if (el) { el.focus(); if (el.setSelectionRange && el.type === 'text') el.setSelectionRange(el.value.length, el.value.length); }
  }
}
function closeSheet() {
  $('#sheetBg').classList.remove('open');
  document.body.style.overflow = '';
  if (draft?.voice?.listening) stopVoice();
  if (draft?.timerId) clearInterval(draft.timerId);
  releaseWakeLock();
  draft = null;
}

/* ---------- tooltip ---------- */
function showTip(el) {
  const tip = $('#tip');
  tip.textContent = el.dataset.tip;
  const r = el.getBoundingClientRect();
  const x = Math.min(window.innerWidth - 80, Math.max(80, r.left + r.width / 2));
  tip.style.left = x + 'px';
  tip.style.top = Math.max(40, r.top) + 'px';
  tip.classList.add('show');
  clearTimeout(showTip._t);
  showTip._t = setTimeout(() => tip.classList.remove('show'), 1800);
}

/* =========================================================
   HEADER
   ========================================================= */
function beltSwatch(beltId = state.belt, stripes = state.stripes) {
  const b = beltInfo(beltId);
  return `<span class="belt-swatch ${beltId === 'black' ? 'is-black' : ''}" style="background:${b.color}"><span class="bar">${'<i></i>'.repeat(stripes)}</span></span>`;
}
function renderHeader() {
  $('#beltBadge').innerHTML = `${beltSwatch()}<span>${beltInfo().name}${state.stripes ? ` · ${state.stripes}` : ''}</span>`;
}

/* =========================================================
   HOME
   ========================================================= */
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening';
}

function heroCard(r, { link = true } = {}) {
  const nb = nextBelt();
  const goal = nb ? nb.id : 'black';
  const stripes = [0, 1, 2, 3].map(i => `<i class="${i < r.predictedStripes ? 'on' : ''}"></i>`).join('');
  return `
    <button class="hero goal-${goal}" ${link ? 'data-act="go" data-to="progress"' : ''}>
      <div class="hero-body">
        ${ringSVG(r.pct, { size: 108 })}
        <div>
          <div class="eyebrow">${nb ? nb.name + ' belt readiness' : 'Progress'}</div>
          <div class="hero-stage">${r.stage.label}</div>
          <div class="hero-meta">Predicted level <span class="stripe-dots">${stripes}</span></div>
        </div>
      </div>
      <div class="hero-foot">
        <span>${r.hours.toFixed(0)}h on the mat · ${r.sessions} sessions</span>
        ${link ? '<span>Details ›</span>' : ''}
      </div>
    </button>`;
}

function weekCard() {
  const w = currentWeek();
  const streak = weekStreak();
  const dots = [];
  for (let i = 0; i < Math.max(w.target, w.count); i++) {
    dots.push(`<i class="${i < w.count ? (i >= w.target ? 'on extra' : 'on') : ''}"></i>`);
  }
  const msg = w.met ? 'Target hit this week' : `${w.left} more to hit ${w.target} this week`;
  return `
    <div class="card week-card">
      <div>
        <div class="card-title" style="margin-bottom:8px">This week</div>
        <div class="week-dots">${dots.join('')}</div>
        <div class="small muted" style="margin-top:8px">${msg}</div>
      </div>
      <div class="streak">
        <div class="v"><svg class="flame" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2c1 3.5-1.5 5.5-3 7.5S7 13 7 15a5 5 0 0 0 10 0c0-2.2-1-3.6-2-4.8.2 1.6-.4 2.8-1.5 3.3.6-2.7-.2-6.6-1.5-11.5z"/></svg> ${streak}</div>
        <div class="l">week streak</div>
      </div>
    </div>`;
}

function rampCard() {
  const g = state.goals;
  if (g.perWeek >= g.rampTo) return '';
  if (weekStreak() < 4) return '';
  if (g.rampDismissedAt && Date.now() - g.rampDismissedAt < 14 * 86400000) return '';
  return `
    <div class="banner">
      <div style="flex:1">
        <div class="t">Ready to ramp up?</div>
        <div class="s">${weekStreak()} weeks straight at ${g.perWeek}×/week. Your plan was to move to ${g.rampTo}× once ${g.perWeek}× stuck.</div>
        <div class="row" style="margin-top:10px">
          <button class="btn sm accent" data-act="ramp-up">Go ${g.rampTo}×/week</button>
          <button class="btn sm ghost" data-act="ramp-later">Not yet</button>
        </div>
      </div>
    </div>`;
}

function focusCards() {
  if (!state.focus.length) {
    return `<button class="list-row" data-act="focus-new"><div class="main"><div class="title">Set a focus</div><div class="sub">Pick 1-3 things to hunt for in rolls. You'll tick them off as you log.</div></div><span class="chev">${ICON.chev}</span></button>`;
  }
  return state.focus.map(f => {
    const st = focusStats(f);
    return `
      <div class="card focus-card">
        <button class="icon-btn edit" data-act="focus-edit" data-id="${f.id}" aria-label="Edit focus">${ICON.edit}</button>
        <div class="theme">${escapeHtml(f.theme)}</div>
        ${f.success ? `<div class="success">${escapeHtml(f.success)}</div>` : ''}
        <div class="focus-stats">
          <span><b>${st.tried}</b>tried</span>
          <span><b>${st.worked}</b>worked</span>
          ${st.rate != null ? `<span style="flex:1">${meterHTML(st.rate, 'green')}</span><span>${Math.round(st.rate * 100)}%</span>` : '<span class="small">Log to track</span>'}
        </div>
      </div>`;
  }).join('') + (state.focus.length < 3 ? `<button class="btn sm ghost block" data-act="focus-new">+ Add focus</button>` : '');
}

function renderHome() {
  const r = calcReadiness();
  const plan = nextSessionPlan();
  const ins = insights();
  const last = state.sessions[0];
  const sub = last
    ? (() => { const d = daysBetween(last.date, todayISO()); return d === 0 ? 'Trained today. Nice.' : d === 1 ? 'Trained yesterday.' : `Last session ${d} days ago.`; })()
    : 'Let\'s get your first session in.';

  const welcome = state.sessions.length ? '' : `
    <div class="card">
      <div class="card-title">Welcome</div>
      <p class="small" style="margin:0 0 12px; color:var(--ink-2)">Moving from another device or an older copy of Mat Log? Restore your backup file and everything comes back.</p>
      <div class="grid-2">
        <button class="btn sm accent" data-act="restore">Restore backup</button>
        <button class="btn sm ghost" data-act="log-new">Log first session</button>
      </div>
    </div>`;

  const newMoves = !state.seen.newMovesV3 && r.unratedNew > 0 && state.sessions.length ? `
    <button class="banner" data-act="rate-new">
      <div style="flex:1"><div class="t">${r.unratedNew} blue-belt core moves added</div>
      <div class="s">Submission defence and guard retention now count towards readiness. Rate them for an accurate score.</div></div>
      <span class="chev">${ICON.chev}</span>
    </button>` : '';

  return `
    <div class="eyebrow" style="margin-top:4px">${formatDate(todayISO(), { weekday: 'long', day: 'numeric', month: 'long' })}</div>
    <h1 class="screen-title">${greeting()}</h1>
    <p class="screen-sub">${sub}</p>
    ${welcome}
    ${newMoves}
    ${compHomeCard()}
    ${heroCard(r)}
    ${weekCard()}
    ${rampCard()}
    ${toolsHTML()}

    <div class="section-head"><h2>Next session</h2></div>
    <div class="card">
      ${plan.map(p => `
        <div class="plan-item" ${p.moveId ? `data-act="move-open" data-id="${p.moveId}" style="cursor:pointer"` : ''}>
          <span class="plan-kind k-${p.kind.toLowerCase()}">${p.kind}</span>
          <div><div class="plan-text">${escapeHtml(p.text)}</div><div class="plan-sub">${p.sub}</div></div>
        </div>`).join('')}
    </div>

    <div class="section-head"><h2>Focus</h2>${state.focus.length ? `<span class="small muted">${state.focus.length}/3 active</span>` : ''}</div>
    ${focusCards()}

    ${ins.length ? `<div class="section-head"><h2>Insights</h2></div>` + ins.map(i => `
      <div class="insight tone-${i.tone}"><span class="ic">${i.tone === 'good' ? '↑' : i.tone === 'warn' ? '!' : 'i'}</span><div>${i.text}</div></div>`).join('') : ''}
  `;
}

/* =========================================================
   SESSION SHEET (the 30-second log)
   ========================================================= */
function newSessionDraft(id) {
  const s = id ? state.sessions.find(x => x.id === id) : null;
  const last = state.sessions[0] || {};
  const tapsFor = dir => {
    const m = {};
    if (s) state.taps.filter(t => t.sessionId === s.id && t.dir === dir).forEach(t => { const k = normalizeSub(t.sub); m[k] = (m[k] || 0) + 1; });
    return m;
  };
  return {
    kind: 'session',
    id: s ? s.id : null,
    date: s ? s.date : todayISO(),
    type: s ? s.type : (last.type === 'comp' ? 'class' : last.type || 'class'),
    minutes: s ? s.minutes : last.minutes || 60,
    spars: s ? s.spars : last.spars || 4,
    sparMins: s ? s.sparMins : last.sparMins || 5,
    feel: s ? s.feel || 0 : 0,
    mood: s ? s.mood || 0 : 0,
    covered: s ? s.covered || '' : '',
    moves: s ? [...(s.moves || [])] : [],
    workOn: s ? [...(s.workOn || [])] : [],
    workOnNote: s ? s.workOnNote || '' : '',
    focus: s ? { ...(s.focus || {}) } : {},
    tapsIn: tapsFor('in'),
    tapsOut: tapsFor('out'),
    injury: s ? s.injury || '' : '',
    notes: s ? s.notes || '' : '',
    rolls: s ? JSON.parse(JSON.stringify(s.rolls || {})) : {},
    partners: s ? [...(s.partners || [])] : [],
    positional: s ? (s.positional || []).map(p => ({ ...p })) : [],
    posPick: null,
    partnerInput: '',
    showRolls: !!(s && (Object.keys(s.rolls || {}).length || (s.partners || []).length)),
    showPos: !!(s && (s.positional || []).length),
    more: !!(s && (s.injury || s.notes || state.taps.some(t => t.sessionId === s.id))),
    voice: null,          // { listening, text, found }
    moveSearch: '',
    legacy: s ? s.legacy : null,
  };
}

function chip(label, on, attrs, onCls = 'on') {
  return `<button type="button" class="chip ${on ? onCls : ''}" ${attrs}>${label}</button>`;
}

function sessionSheetHTML() {
  const d = draft;
  const yday = addDays(todayISO(), -1);
  const durations = [60, 75, 90, 120];
  const legacyNote = d.legacy && (d.legacy.stuck || d.legacy.fix)
    ? `<div class="small muted" style="margin:-8px 0 14px">Originally logged as: ${escapeHtml([d.legacy.stuck && 'stuck: ' + d.legacy.stuck, d.legacy.fix && 'fix: ' + d.legacy.fix].filter(Boolean).join(' · '))}</div>` : '';

  const tally = (dir, map) => `
    <div class="tally-row">
      <span class="lab">${dir === 'in' ? 'Caught me' : 'I caught'}</span>
      <div class="chips scroll" style="margin:0; padding:0; flex:1">
        ${COMMON_SUBS.map(c => chip(`${c.label}${map[c.id] ? ` <span class="n">${map[c.id]}</span>` : ''}`, !!map[c.id],
          `data-act="d-tap" data-dir="${dir}" data-sub="${c.id}"`, dir === 'in' ? 'on-accent' : 'on-green')).join('')}
      </div>
    </div>`;

  return `
    <h2 class="sheet-title">${d.id ? 'Edit session' : 'Log session'}</h2>
    <p class="sheet-sub">${d.id ? 'Tap anything to change it.' : 'Tap through it, or just say how it went.'}</p>
    ${voiceBlockHTML()}

    <div class="field">
      <div class="lbl">When</div>
      <div class="row">
        ${chip('Today', d.date === todayISO(), `data-act="d-set" data-k="date" data-v="${todayISO()}"`)}
        ${chip('Yesterday', d.date === yday, `data-act="d-set" data-k="date" data-v="${yday}"`)}
        <input type="date" data-bind="date" value="${d.date}" style="flex:1; padding:8px 10px">
      </div>
    </div>

    <div class="field">
      <div class="lbl">Session</div>
      <div class="chips">
        ${SESSION_TYPES.map(t => chip(t.label, d.type === t.id, `data-act="d-set" data-k="type" data-v="${t.id}"`)).join('')}
      </div>
    </div>

    <div class="field">
      <div class="lbl">Length</div>
      <div class="dur-row">
        ${durations.map(m => chip(`${m}m`, d.minutes === m, `data-act="d-set" data-k="minutes" data-v="${m}" data-num="1"`)).join('')}
        <input type="number" inputmode="numeric" data-bind="minutes" data-num="1" value="${durations.includes(d.minutes) ? '' : d.minutes}" placeholder="min" aria-label="Other length in minutes">
      </div>
    </div>

    <div class="field">
      <div class="lbl">Live rounds</div>
      <div class="inline-fields">
        <div class="stepper">
          <button type="button" data-act="d-step" data-k="spars" data-d="-1">−</button>
          <span class="val">${d.spars}</span>
          <button type="button" data-act="d-step" data-k="spars" data-d="1">+</button>
        </div>
        <span class="muted small">×</span>
        <div class="stepper">
          <button type="button" data-act="d-step" data-k="sparMins" data-d="-1">−</button>
          <span class="val">${d.sparMins}</span>
          <button type="button" data-act="d-step" data-k="sparMins" data-d="1">+</button>
        </div>
        <span class="muted small">min</span>
      </div>
    </div>

    <div class="field">
      <div class="lbl">How did the rolls go?</div>
      <div class="feel-row">
        ${FEEL.slice(1).map(f => `
          <button type="button" class="feel-opt ${d.feel === f.v ? 'on' : ''}" data-act="d-set" data-k="feel" data-v="${f.v}" data-num="1">
            <div class="bars">${[1, 2, 3, 4].map(i => `<i class="${i <= f.v ? 'f' : ''}"></i>`).join('')}</div>
            <div class="t">${f.label}</div><div class="h">${f.hint}</div>
          </button>`).join('')}
      </div>
    </div>

    <div class="field">
      <div class="lbl">Energy</div>
      <div class="energy-row">
        ${[1, 2, 3, 4, 5].map(n => `<button type="button" class="${d.mood === n ? 'on' : ''}" data-act="d-set" data-k="mood" data-v="${n}" data-num="1">${n}</button>`).join('')}
      </div>
    </div>

    <button type="button" class="disclosure" data-act="d-flag" data-k="showRolls">${d.showRolls ? '▾' : '▸'} Who you rolled with <span class="muted">${rollsSummary(d)}</span></button>
    ${d.showRolls ? rollsHTML(d) : ''}
    <button type="button" class="disclosure" data-act="d-flag" data-k="showPos">${d.showPos ? '▾' : '▸'} Positional rounds <span class="muted">${d.positional.length ? d.positional.length + ' logged' : ''}</span></button>
    ${d.showPos ? positionalHTML(d) : ''}

    <label class="field">
      <div class="lbl">What we covered <span class="opt">optional</span></div>
      <input type="text" data-bind="covered" value="${escapeHtml(d.covered)}" placeholder="e.g. Ankle lock finishes and defence">
    </label>

    <div class="field">
      <div class="lbl">Moves worked <span class="opt">feeds your library</span></div>
      ${d.moves.length ? `<div class="chips" style="margin-bottom:8px">${d.moves.map(id => { const m = moveById(id); return m ? chip(`${escapeHtml(m.name)} <span class="x">×</span>`, true, `data-act="d-toggle" data-k="moves" data-v="${id}"`, 'on-blue') : ''; }).join('')}</div>` : ''}
      <input type="search" data-input="move-search" value="${escapeHtml(d.moveSearch)}" placeholder="Search moves to tag…">
      <div class="search-results" id="moveResults">${moveResultsHTML()}</div>
    </div>

    <div class="field">
      <div class="lbl">Work on next <span class="opt">what held you back</span></div>
      <div class="chips">${WORK_TAGS.map(t => chip(t.label, d.workOn.includes(t.id), `data-act="d-toggle" data-k="workOn" data-v="${t.id}"`, 'on-blue')).join('')}</div>
      <input type="text" data-bind="workOnNote" value="${escapeHtml(d.workOnNote)}" placeholder="Detail, if useful (e.g. kept losing the underhook)" style="margin-top:10px">
    </div>
    ${legacyNote}

    ${state.focus.length ? `
      <div class="field">
        <div class="lbl">Your focus</div>
        ${state.focus.map(f => `
          <div style="margin-bottom:10px">
            <div class="small" style="font-weight:600; margin-bottom:6px">${escapeHtml(f.theme)}</div>
            <div class="chips">
              ${chip('Didn\'t try', !d.focus[f.id], `data-act="d-focus" data-id="${f.id}" data-v="0"`)}
              ${chip('Tried', d.focus[f.id] === 1, `data-act="d-focus" data-id="${f.id}" data-v="1"`, 'on-blue')}
              ${chip('It worked', d.focus[f.id] === 2, `data-act="d-focus" data-id="${f.id}" data-v="2"`, 'on-green')}
            </div>
          </div>`).join('')}
      </div>` : ''}

    <button type="button" class="disclosure" data-act="d-more">${d.more ? '▾' : '▸'} Taps, injuries &amp; notes</button>
    ${d.more ? `
      <div class="field">
        <div class="lbl">Taps <span class="opt">only the ones you remember</span></div>
        ${tally('in', d.tapsIn)}
        ${tally('out', d.tapsOut)}
        ${Object.keys(d.tapsIn).length + Object.keys(d.tapsOut).length ? `<button type="button" class="disclosure" data-act="d-tap-clear">Clear taps</button>` : ''}
      </div>
      <label class="field">
        <div class="lbl">Injury or niggle <span class="opt">optional</span></div>
        <input type="text" data-bind="injury" value="${escapeHtml(d.injury)}" placeholder="e.g. Left knee, ribs">
      </label>
      <label class="field">
        <div class="lbl">Notes <span class="opt">optional</span></div>
        <textarea data-bind="notes" placeholder="Anything worth remembering…">${escapeHtml(d.notes)}</textarea>
      </label>` : ''}

    <div class="sheet-actions">
      <button type="button" class="btn ghost" data-act="sheet-close">Cancel</button>
      <button type="button" class="btn accent" data-act="save-session">${d.id ? 'Save changes' : 'Save session'}</button>
    </div>
    ${d.id ? `<button type="button" class="btn danger block sm" data-act="delete-session" style="margin-top:12px">Delete session</button>` : ''}
  `;
}

/* ---------- voice / quick text ---------- */
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

function voiceBlockHTML() {
  const v = draft.voice;
  if (!v) {
    return `<div class="voice-row">
      <button type="button" class="btn sm ghost voice-btn" data-act="voice-start">${ICON.mic} ${SpeechRec ? 'Say it' : 'Dictate or type it'}</button>
      <span class="small muted">Fills the form from your words</span>
    </div>`;
  }
  return `<div class="card voice-card ${v.listening ? 'listening' : ''}">
    <div class="row between" style="margin-bottom:8px">
      <b class="small">${v.listening ? '<span class="rec-dot"></span> Listening… speak naturally' : 'Your summary'}</b>
      ${v.listening ? '<button type="button" class="btn sm accent" data-act="voice-stop">Done</button>' : ''}
    </div>
    <textarea data-bind-voice="1" placeholder="e.g. 90 minute class, 5 rounds, drilled knee cut. Got smashed, caught by a heel hook twice. Struggled with guard retention. Knee is a bit sore.">${escapeHtml(v.text)}</textarea>
    ${!SpeechRec ? '<div class="small muted" style="margin-top:6px">Tip: tap the mic on your keyboard to dictate.</div>' : ''}
    ${v.found && v.found.length ? `<div class="small" style="margin-top:8px; color:var(--green)">✓ Filled: ${escapeHtml(v.found.join(' · '))}</div>` : v.found ? '<div class="small muted" style="margin-top:8px">Nothing recognised yet. Mention length, rounds, how it went, taps or what you struggled with.</div>' : ''}
    ${!v.listening ? `<div class="row" style="margin-top:10px">
      <button type="button" class="btn sm accent" data-act="voice-apply">${v.found ? 'Fill again' : 'Fill the form'}</button>
      ${SpeechRec ? `<button type="button" class="btn sm ghost" data-act="voice-start">${ICON.mic} Again</button>` : ''}
      <button type="button" class="btn sm ghost" data-act="voice-close">Close</button>
    </div>` : ''}
  </div>`;
}

function applyVoice() {
  const v = draft.voice;
  if (!v || !v.text.trim()) { toast('Say or type a summary first'); return; }
  const { patch, found } = parseSessionText(v.text);
  ['minutes', 'spars', 'sparMins', 'type', 'feel', 'mood', 'injury'].forEach(k => { if (patch[k] != null) draft[k] = patch[k]; });
  if (patch.covered && !draft.covered) draft.covered = patch.covered;
  (patch.workOn || []).forEach(t => { if (!draft.workOn.includes(t)) draft.workOn.push(t); });
  (patch.moves || []).forEach(id => { if (!draft.moves.includes(id)) draft.moves.push(id); });
  Object.entries(patch.tapsIn || {}).forEach(([k, n]) => { draft.tapsIn[k] = Math.max(draft.tapsIn[k] || 0, n); });
  Object.entries(patch.tapsOut || {}).forEach(([k, n]) => { draft.tapsOut[k] = Math.max(draft.tapsOut[k] || 0, n); });
  if (!draft.notes.includes(v.text.trim())) draft.notes = [draft.notes, v.text.trim()].filter(Boolean).join('\n');
  if (patch.tapsIn || patch.tapsOut || patch.injury) draft.more = true;
  v.found = found;
  if (found.length) haptic();
}

let recognizer = null;
function startVoice() {
  draft.voice = draft.voice || { text: '', found: null };
  if (!SpeechRec) { draft.voice.listening = false; rerenderSheet(); $('[data-bind-voice]')?.focus(); return; }
  try {
    recognizer = new SpeechRec();
    recognizer.lang = navigator.language || 'en-GB';
    recognizer.continuous = true;
    recognizer.interimResults = true;
    const base = draft.voice.text ? draft.voice.text.trim() + ' ' : '';
    recognizer.onresult = e => {
      let txt = '';
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      if (!draft || !draft.voice) return;
      draft.voice.text = base + txt;
      const ta = $('[data-bind-voice]');
      if (ta) ta.value = draft.voice.text;
    };
    recognizer.onerror = e => {
      if (draft?.voice) draft.voice.listening = false;
      if (e.error === 'not-allowed') toast('Microphone blocked. Type or use keyboard dictation');
      if (draft) rerenderSheet();
    };
    recognizer.onend = () => {
      if (!draft || !draft.voice) return;
      const was = draft.voice.listening;
      draft.voice.listening = false;
      if (was && draft.voice.text.trim()) applyVoice();
      rerenderSheet();
    };
    draft.voice.listening = true;
    draft.voice.found = null;
    recognizer.start();
    rerenderSheet();
  } catch (e) {
    draft.voice.listening = false;
    rerenderSheet();
  }
}
function stopVoice() { try { recognizer && recognizer.stop(); } catch (_) {} }

/* ---------- rolls & positional ---------- */
function cleanRolls(rolls) {
  const out = {};
  Object.entries(rolls).forEach(([lvl, r]) => {
    const c = {};
    ['win', 'even', 'loss'].forEach(k => { if (r[k]) c[k] = r[k]; });
    if (Object.keys(c).length) out[lvl] = c;
  });
  return out;
}
function rollsTotal(d) { return Object.values(d.rolls).reduce((a, r) => a + (r.win || 0) + (r.even || 0) + (r.loss || 0), 0); }
function rollsSummary(d) {
  const n = rollsTotal(d);
  return [n ? `${n} round${n > 1 ? 's' : ''}` : '', d.partners.length ? d.partners.slice(0, 2).join(', ') + (d.partners.length > 2 ? '…' : '') : ''].filter(Boolean).join(' · ');
}
function rollsHTML(d) {
  const sugg = partnerList().filter(p => !d.partners.includes(p)).slice(0, 8);
  return `
    <div class="field">
      <div class="roll-grid">
        <span></span>${ROLL_RESULTS.map(r => `<span class="rg-h">${r.label}</span>`).join('')}
        ${ROLL_LEVELS.map(l => `
          <span class="rg-l">${l.short}</span>
          ${ROLL_RESULTS.map(r => {
            const n = d.rolls[l.id]?.[r.id] || 0;
            return `<button type="button" class="rg-cell ${n ? 'on res-' + r.id : ''}" data-act="d-roll" data-l="${l.id}" data-r="${r.id}" aria-label="${l.label}: ${r.label}">${n || '+'}</button>`;
          }).join('')}`).join('')}
      </div>
      <div class="small muted" style="margin-top:6px">One tap per round. ${rollsTotal(d) ? '<button type="button" class="link-btn" data-act="d-roll-clear">Clear</button>' : ''}</div>
    </div>
    <div class="field">
      <div class="lbl">Partners <span class="opt">optional</span></div>
      ${d.partners.length ? `<div class="chips" style="margin-bottom:8px">${d.partners.map(p => chip(`${escapeHtml(p)} <span class="x">×</span>`, true, `data-act="d-partner-rm" data-v="${escapeHtml(p)}"`, 'on-blue')).join('')}</div>` : ''}
      <div class="row"><input type="text" data-bind="partnerInput" value="${escapeHtml(d.partnerInput)}" placeholder="Name" enterkeyhint="done" style="flex:1"><button type="button" class="btn sm ghost" data-act="d-partner-add">Add</button></div>
      ${sugg.length ? `<div class="chips" style="margin-top:8px">${sugg.map(p => chip(escapeHtml(p), false, `data-act="d-partner-pick" data-v="${escapeHtml(p)}"`)).join('')}</div>` : ''}
    </div>`;
}
function positionalHTML(d) {
  const pick = POSITIONAL.find(p => p.id === d.posPick);
  return `
    <div class="field">
      <div class="small muted" style="margin-bottom:8px">Round started in a set position? Pick it, then how it ended.</div>
      <div class="chips">${POSITIONAL.map(p => chip(p.label, d.posPick === p.id, `data-act="d-set" data-k="posPick" data-v="${p.id}"`, 'on-blue')).join('')}</div>
      ${pick ? `<div class="row" style="margin-top:10px">
        <button type="button" class="btn sm" style="background:var(--green); color:#06281c" data-act="d-pos" data-r="win">${pick.win}</button>
        <button type="button" class="btn sm ghost" data-act="d-pos" data-r="even">Stalemate</button>
        <button type="button" class="btn sm" style="background:var(--accent); color:#fff" data-act="d-pos" data-r="loss">Lost it</button>
      </div>` : ''}
      ${d.positional.length ? `<div class="chips" style="margin-top:10px">${d.positional.map((p, i) => {
        const def = POSITIONAL.find(x => x.id === p.pos);
        const lab = p.result === 'win' ? def.win : p.result === 'even' ? 'stalemate' : 'lost';
        return chip(`${def.label}: ${lab.toLowerCase()} <span class="x">×</span>`, true, `data-act="d-pos-rm" data-i="${i}"`, p.result === 'win' ? 'on-green' : p.result === 'loss' ? 'on-accent' : 'on');
      }).join('')}</div>` : ''}
    </div>`;
}

function haptic() { try { navigator.vibrate && navigator.vibrate(12); } catch (_) {} }

function moveResultsHTML() {
  const q = (draft?.moveSearch || '').trim().toLowerCase();
  if (q.length < 2) return '';
  const res = getAllMoves().filter(m => m.name.toLowerCase().includes(q) && !draft.moves.includes(m.id)).slice(0, 6);
  if (!res.length) return '<div class="small muted" style="padding:8px 2px">No match. Add it as a custom move from Skills.</div>';
  return res.map(m => `<button type="button" data-act="d-addmove" data-id="${m.id}"><span>${escapeHtml(m.name)}</span><span class="c">${CATEGORY_SHORT[m.cat] || m.cat}</span></button>`).join('');
}

function saveSessionFromDraft() {
  const d = draft;
  if (!d.date) { toast('Pick a date'); return; }
  if (!d.minutes || d.minutes <= 0) { toast('Add the session length'); return; }

  const beforeWeekMet = currentWeek().met;
  const beforeEarned = new Set(milestones().earned.map(m => m.id));

  const fields = {
    date: d.date, type: d.type, minutes: d.minutes, spars: Math.max(d.spars, rollsTotal(d)), sparMins: d.sparMins,
    rolls: cleanRolls(d.rolls), partners: d.partners, positional: d.positional,
    feel: d.feel, mood: d.mood, covered: d.covered.trim(), moves: d.moves, workOn: d.workOn,
    workOnNote: d.workOnNote.trim(), focus: d.focus, injury: d.injury.trim(), notes: d.notes.trim(),
  };
  let id = d.id;
  if (id) {
    Object.assign(state.sessions.find(s => s.id === id), fields);   // keeps legacy fields
  } else {
    id = 'ses_' + Date.now();
    state.sessions.push({ id, ...fields });
  }
  // taps attached to this session are rewritten from the tally
  state.taps = state.taps.filter(t => t.sessionId !== id);
  const ts = fromISODate(d.date) + 12 * 3600000;
  [['in', d.tapsIn], ['out', d.tapsOut]].forEach(([dir, map]) => {
    Object.entries(map).forEach(([sub, n]) => {
      for (let i = 0; i < n; i++) state.taps.push({ id: `tap_${Date.now()}_${dir}_${sub}_${i}`, dir, sub, date: d.date, ts, sessionId: id });
    });
  });
  sortSessions(state);
  save();
  const wasNew = !d.id;
  closeSheet();

  const newly = milestones().earned.filter(m => !beforeEarned.has(m.id));
  if (newly.length) toast(`Milestone: ${newly[newly.length - 1].label}`);
  else if (wasNew && !beforeWeekMet && currentWeek().met) toast(`Week target hit (${state.goals.perWeek}×)`);
  else toast(wasNew ? 'Session logged' : 'Session updated');
  renderScreen();
}

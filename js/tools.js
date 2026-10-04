/* =========================================================
   Mat Log: tools (drill queue, competition mode, coach report)
   ========================================================= */

/* ---------- screen wake lock (keeps the phone awake during drills) ---------- */
let wakeLock = null;
async function requestWakeLock() {
  try { if ('wakeLock' in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch (_) {}
}
function releaseWakeLock() {
  try { wakeLock && wakeLock.release(); } catch (_) {}
  wakeLock = null;
}

/* ---------- Home tools row ---------- */
function toolsHTML() {
  const comp = upcomingComp();
  const dq = drillQueue('partner');
  const days = drillDaysThisWeek();
  return `
    <div class="tools">
      <button class="tool" data-act="drills-open">
        <span class="tool-ic t-blue">${ICON.play}</span>
        <span class="tool-t">Drill queue</span>
        <span class="tool-s">${dq.length} drills · ~${Math.round(dq.reduce((a, d) => a + d.secs, 0) / 60)} min${days ? ` · ${days} this wk` : ''}</span>
      </button>
      <button class="tool" data-act="go" data-to="comps">
        <span class="tool-ic t-accent">${ICON.trophy}</span>
        <span class="tool-t">Competition</span>
        <span class="tool-s">${comp ? `${escapeHtml(comp.name)} in ${daysBetween(todayISO(), comp.date)}d` : 'Plan & log comps'}</span>
      </button>
      <button class="tool" data-act="go" data-to="report">
        <span class="tool-ic t-green">${ICON.doc}</span>
        <span class="tool-t">Coach report</span>
        <span class="tool-s">One page to share</span>
      </button>
    </div>`;
}

function compHomeCard() {
  const c = upcomingComp();
  if (!c) return '';
  const { days, phase, idx } = compPhase(c);
  const next = phase.tasks.find((t, i) => !c.done[`${idx}:${i}`]);
  return `
    <button class="comp-hero" data-act="comp-open" data-id="${c.id}">
      <div><div class="eyebrow">Competition · ${phase.label}</div>
      <div class="comp-name">${escapeHtml(c.name)}</div>
      <div class="small" style="opacity:.85">${next ? escapeHtml(next) : 'Phase checklist done'}</div></div>
      <div class="comp-count"><b>${days}</b><span>day${days === 1 ? '' : 's'}</span></div>
    </button>`;
}

/* =========================================================
   DRILL QUEUE SHEET
   ========================================================= */
function openDrills(mode) {
  const m = mode || (state.sessions[0] && state.sessions[0].date === todayISO() ? 'solo' : 'partner');
  draft = { kind: 'drills', mode: m, items: drillQueue(m), done: {}, active: null, left: 0, timerId: null };
  openSheet(drillSheetHTML());
}

function fmtSecs(n) { return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; }

function drillSheetHTML() {
  const d = draft;
  const total = d.items.reduce((a, i) => a + i.secs, 0);
  const doneCount = Object.keys(d.done).length;
  const active = d.items.find(i => i.id === d.active);
  return `
    <h2 class="sheet-title">Drill queue</h2>
    <p class="sheet-sub">Built from what's been holding you back. ~${Math.round(total / 60)} minutes.</p>
    <div class="seg" style="margin-bottom:14px">
      <button type="button" class="${d.mode === 'partner' ? 'on' : ''}" data-act="drills-mode" data-v="partner">With a partner</button>
      <button type="button" class="${d.mode === 'solo' ? 'on' : ''}" data-act="drills-mode" data-v="solo">Solo / rest day</button>
    </div>
    ${active ? `
      <div class="timer-card">
        <div class="small" style="opacity:.8">${escapeHtml(active.name)}</div>
        <div class="timer" id="drillTimer">${fmtSecs(d.left)}</div>
        <div class="row" style="justify-content:center">
          <button type="button" class="btn sm ghost" data-act="drill-pause">${d.timerId ? 'Pause' : 'Resume'}</button>
          <button type="button" class="btn sm" style="background:#fff;color:#111" data-act="drill-done" data-id="${active.id}">Done ✓</button>
        </div>
      </div>` : ''}
    ${d.items.map((it, i) => `
      <div class="drill ${d.done[it.id] ? 'done' : ''} ${d.active === it.id ? 'active' : ''}">
        <button type="button" class="drill-check" data-act="drill-toggle" data-id="${it.id}" aria-label="Mark done">${d.done[it.id] ? ICON.check : i + 1}</button>
        <div class="main">
          <div class="title">${escapeHtml(it.name)}</div>
          <div class="sub"><b>${escapeHtml(it.dose)}</b> · ${escapeHtml(it.why)}</div>
        </div>
        ${!d.done[it.id] ? `<button type="button" class="icon-btn" data-act="drill-start" data-id="${it.id}" aria-label="Start timer">${ICON.play}</button>` : ''}
      </div>`).join('')}
    <div class="sheet-actions">
      <button type="button" class="btn ghost" data-act="sheet-close">Close</button>
      <button type="button" class="btn accent" data-act="drills-finish" ${doneCount ? '' : 'disabled style="opacity:.5"'}>Log ${doneCount || ''} drill${doneCount === 1 ? '' : 's'}</button>
    </div>`;
}

function tickDrill() {
  if (!draft || draft.kind !== 'drills') return;
  draft.left = Math.max(0, draft.left - 1);
  const el = $('#drillTimer');
  if (el) el.textContent = fmtSecs(draft.left);
  if (draft.left === 0) {
    clearInterval(draft.timerId); draft.timerId = null;
    try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (_) {}
    draft.done[draft.active] = true;
    const next = draft.items.find(i => !draft.done[i.id]);
    if (next) startDrill(next.id); else { draft.active = null; releaseWakeLock(); rerenderSheet(); toast('Queue done. Log it.'); }
  }
}
function startDrill(id) {
  if (draft.timerId) clearInterval(draft.timerId);
  const it = draft.items.find(i => i.id === id);
  draft.active = id;
  draft.left = it.secs;
  draft.timerId = setInterval(tickDrill, 1000);
  requestWakeLock();
  rerenderSheet();
}

/* =========================================================
   COMPETITIONS
   ========================================================= */
function renderComps() {
  const up = state.comps.filter(c => c.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date));
  const past = state.comps.filter(c => c.date < todayISO()).sort((a, b) => b.date.localeCompare(a.date));
  const rec = compRecord();
  const row = c => {
    const w = c.matches.filter(m => m.result === 'win').length, l = c.matches.length - w;
    return `<button class="list-row" data-act="comp-open" data-id="${c.id}">
      <div class="main"><div class="title">${escapeHtml(c.name)}</div><div class="sub">${formatDate(c.date)}${c.division ? ' · ' + escapeHtml(c.division) : ''}</div></div>
      ${c.matches.length ? `<span class="pill ${w > l ? 'st-4' : w ? 'st-2' : 'st-0'}">${w}W ${l}L</span>` : c.date >= todayISO() ? `<span class="pill st-1">${daysBetween(todayISO(), c.date)}d</span>` : ''}
    </button>`;
  };
  return `
    <div class="back-row"><button class="icon-btn" data-act="go" data-to="home" aria-label="Back">${ICON.back}</button><span class="eyebrow">Competition</span></div>
    <h1 class="screen-title">Comps</h1>
    <p class="screen-sub">Prep plan, weigh-ins and a match log. Competing is the fastest feedback there is.</p>
    ${rec.win + rec.loss ? `<div class="grid-3" style="margin-bottom:12px">
      <div class="stat"><div class="v">${rec.win}<span class="u">–${rec.loss}</span></div><div class="l">Record</div></div>
      <div class="stat"><div class="v">${rec.subs}</div><div class="l">Sub wins</div></div>
      <div class="stat"><div class="v">${rec.comps}</div><div class="l">Comps</div></div></div>` : ''}
    <button class="btn accent block" data-act="comp-new" style="margin-bottom:14px">+ Add competition</button>
    ${up.length ? `<div class="gp-group">Upcoming</div>${up.map(row).join('')}` : ''}
    ${past.length ? `<div class="gp-group">Past</div>${past.map(row).join('')}` : ''}
    ${!state.comps.length ? `<div class="empty-state"><div class="big">No comps yet</div>Add one and Mat Log builds your prep plan around the date.</div>` : ''}
  `;
}

function renderComp() {
  const c = state.comps.find(x => x.id === ui.compId);
  if (!c) return renderComps();
  const upcoming = c.date >= todayISO();
  const { days, idx } = compPhase(c);
  const lastW = c.weighIns[c.weighIns.length - 1];
  const aGame = ['standing', 'cg-bottom', 'open-bottom', 'passing', 'mount-top', 'back-top'].map(id => {
    const p = GAMEPLAN_POSITIONS.find(x => x.id === id);
    const gp = state.gameplan[id] || { moves: [] };
    return { p, moves: (gp.moves || []).map(m => moveById(m)?.name).filter(Boolean), note: gp.note };
  });
  return `
    <div class="back-row"><button class="icon-btn" data-act="go" data-to="comps" aria-label="Back">${ICON.back}</button><span class="eyebrow">Competition</span></div>
    <div class="comp-hero static">
      <div><div class="eyebrow">${formatDate(c.date, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      <div class="comp-name">${escapeHtml(c.name)}</div>
      <div class="small" style="opacity:.85">${[c.division, c.weightLimit ? `limit ${c.weightLimit}kg` : ''].filter(Boolean).map(escapeHtml).join(' · ') || 'No division set'}</div></div>
      ${upcoming ? `<div class="comp-count"><b>${days}</b><span>day${days === 1 ? '' : 's'}</span></div>` : ''}
    </div>
    <div class="row" style="margin-bottom:12px"><button class="btn sm ghost" data-act="comp-edit" data-id="${c.id}">Edit details</button>
      <button class="btn sm accent" data-act="match-new">+ Log match</button></div>

    ${upcoming ? `<div class="section-head"><h2>Prep plan</h2></div>
      ${COMP_PHASES.map((ph, pi) => `
        <div class="card tight phase ${pi === idx ? 'now' : pi < idx ? 'past' : ''}">
          <div class="row between"><b>${ph.label}</b><span class="small muted">${pi === idx ? 'Now' : ph.minDays ? `${ph.minDays}+ days out` : 'The day'}</span></div>
          ${pi <= idx ? ph.tasks.map((t, ti) => `
            <button class="task ${c.done[`${pi}:${ti}`] ? 'done' : ''}" data-act="comp-task" data-k="${pi}:${ti}">
              <span class="box">${c.done[`${pi}:${ti}`] ? ICON.check : ''}</span><span>${escapeHtml(t)}</span>
            </button>`).join('') : `<div class="small muted" style="margin-top:4px">${ph.tasks.length} tasks unlock later</div>`}
        </div>`).join('')}` : ''}

    <div class="section-head"><h2>A-game</h2><button class="link" data-act="go-plan">Edit game plan</button></div>
    <div class="card">
      ${aGame.map(a => `<div class="check"><span class="ic ${a.moves.length ? 's2' : 's0'}">${a.moves.length ? '✓' : ''}</span>
        <span><b>${a.p.label}:</b> ${a.moves.length ? escapeHtml(a.moves.join(' → ')) : '<span class="muted">no go-to set</span>'}${a.note ? `<br><span class="small muted">${escapeHtml(a.note)}</span>` : ''}</span></div>`).join('')}
    </div>

    <div class="section-head"><h2>Weight</h2></div>
    <div class="card">
      ${lastW ? `<div class="row between"><span>Latest: <b>${lastW.kg}kg</b> <span class="small muted">${formatShort(lastW.date)}</span></span>
        ${c.weightLimit ? `<span class="pill ${lastW.kg <= c.weightLimit ? 'st-4' : 'st-1'}">${lastW.kg <= c.weightLimit ? 'On weight' : `${(lastW.kg - c.weightLimit).toFixed(1)}kg over`}</span>` : ''}</div>` : '<div class="small muted">No weigh-ins yet.</div>'}
      <div class="row" style="margin-top:10px"><input type="number" inputmode="decimal" step="0.1" id="weighIn" placeholder="kg" style="flex:1"><button class="btn sm ghost" data-act="weigh-add">Add</button></div>
      ${c.weighIns.length > 1 ? `<div class="small muted" style="margin-top:8px">${c.weighIns.slice(-6).map(w => `${formatShort(w.date)}: ${w.kg}`).join(' · ')}</div>` : ''}
    </div>

    <div class="section-head"><h2>Matches</h2><span class="small muted">${c.matches.length}</span></div>
    ${c.matches.length ? c.matches.map((m, i) => `
      <button class="list-row" data-act="match-edit" data-i="${i}">
        <span class="pill ${m.result === 'win' ? 'st-4' : 'st-1'}">${m.result === 'win' ? 'Won' : 'Lost'}</span>
        <div class="main"><div class="title">${escapeHtml(MATCH_METHODS.find(x => x.id === m.method)?.label || '')}${m.sub ? ' · ' + escapeHtml(subLabel(m.sub)) : ''}${m.score ? ' · ' + escapeHtml(m.score) : ''}</div>
        <div class="sub">${[m.opponent, m.notes].filter(Boolean).map(escapeHtml).join(' · ') || '&nbsp;'}</div></div>
      </button>`).join('') : '<div class="small muted" style="margin:0 2px 12px">Log each match straight after: result, how, and one lesson.</div>'}
    ${c.notes ? `<div class="card"><div class="card-title">Notes</div><div class="small">${escapeHtml(c.notes)}</div></div>` : ''}
    <button class="btn danger block sm" data-act="comp-delete" style="margin-top:16px">Delete competition</button>
  `;
}

function compSheetHTML() {
  const d = draft;
  return `
    <h2 class="sheet-title">${d.id ? 'Edit competition' : 'New competition'}</h2>
    <p class="sheet-sub">The prep plan counts down from the date.</p>
    <label class="field"><div class="lbl">Name</div><input type="text" data-bind="name" value="${escapeHtml(d.name)}" placeholder="e.g. Grapple Industries London"></label>
    <div class="grid-2">
      <label class="field"><div class="lbl">Date</div><input type="date" data-bind="date" value="${d.date}"></label>
      <label class="field"><div class="lbl">Weight limit (kg) <span class="opt">optional</span></div><input type="number" inputmode="decimal" step="0.1" data-bind="weightLimit" value="${d.weightLimit || ''}"></label>
    </div>
    <label class="field"><div class="lbl">Division <span class="opt">optional</span></div><input type="text" data-bind="division" value="${escapeHtml(d.division)}" placeholder="e.g. Beginner, -77kg"></label>
    <label class="field"><div class="lbl">Notes <span class="opt">optional</span></div><textarea data-bind="notes" placeholder="Ruleset, travel, goals…">${escapeHtml(d.notes)}</textarea></label>
    <div class="sheet-actions">
      <button type="button" class="btn ghost" data-act="sheet-close">Cancel</button>
      <button type="button" class="btn accent" data-act="comp-save">Save</button>
    </div>`;
}

function matchSheetHTML() {
  const d = draft;
  return `
    <h2 class="sheet-title">${d.i != null ? 'Edit match' : 'Log match'}</h2>
    <p class="sheet-sub">Straight after, while it's fresh.</p>
    <div class="field"><div class="lbl">Result</div><div class="grid-2">
      <button type="button" class="feel-opt ${d.result === 'win' ? 'on' : ''}" data-act="d-set" data-k="result" data-v="win"><div class="t">Won</div></button>
      <button type="button" class="feel-opt ${d.result === 'loss' ? 'on' : ''}" data-act="d-set" data-k="result" data-v="loss"><div class="t">Lost</div></button>
    </div></div>
    <div class="field"><div class="lbl">How</div><div class="chips">${MATCH_METHODS.map(m => chip(m.label, d.method === m.id, `data-act="d-set" data-k="method" data-v="${m.id}"`)).join('')}</div></div>
    ${d.method === 'sub' ? `<div class="field"><div class="lbl">Submission</div><div class="chips">${COMMON_SUBS.map(c => chip(c.label, d.sub === c.id, `data-act="d-set" data-k="sub" data-v="${c.id}"`, d.result === 'win' ? 'on-green' : 'on-accent')).join('')}</div></div>` : ''}
    ${d.method === 'points' || d.method === 'decision' ? `<label class="field"><div class="lbl">Score <span class="opt">optional</span></div><input type="text" data-bind="score" value="${escapeHtml(d.score)}" placeholder="e.g. 4-2"></label>` : ''}
    <label class="field"><div class="lbl">Opponent <span class="opt">optional</span></div><input type="text" data-bind="opponent" value="${escapeHtml(d.opponent)}"></label>
    <label class="field"><div class="lbl">One lesson</div><textarea data-bind="notes" placeholder="What decided it? What would you do differently?">${escapeHtml(d.notes)}</textarea></label>
    <div class="sheet-actions">
      <button type="button" class="btn ghost" data-act="sheet-close">Cancel</button>
      <button type="button" class="btn accent" data-act="match-save">Save</button>
    </div>
    ${d.i != null ? '<button type="button" class="btn danger block sm" data-act="match-delete" style="margin-top:12px">Delete match</button>' : ''}`;
}

/* =========================================================
   COACH REPORT
   ========================================================= */
function renderReport() {
  const d = reportData();
  const r = d.r;
  const name = state.profile.name || 'Training report';
  const nb = nextBelt();
  const rollRows = ROLL_LEVELS.filter(l => d.rolls[l.id].n).map(l => {
    const x = d.rolls[l.id];
    return `<tr><td>${l.label}</td><td>${x.win}W ${x.even}E ${x.loss}L</td><td>${Math.round(x.score * 100)}%</td></tr>`;
  }).join('');
  const posRows = POSITIONAL.filter(p => d.positional[p.id]).map(p => {
    const x = d.positional[p.id];
    return `<tr><td>${p.label}</td><td>${x.n} rounds</td><td>${Math.round(x.rate * 100)}% ${p.win.toLowerCase()}</td></tr>`;
  }).join('');
  return `
    <div class="back-row no-print"><button class="icon-btn" data-act="go" data-to="progress" aria-label="Back">${ICON.back}</button><span class="eyebrow">Coach report</span></div>
    <div class="row no-print" style="margin-bottom:12px">
      <button class="btn sm accent" data-act="report-share">Share</button>
      <button class="btn sm ghost" data-act="report-print">Print / save PDF</button>
      ${!state.profile.name ? '<button class="btn sm ghost" data-act="settings">Add your name</button>' : ''}
    </div>
    <article class="report">
      <header class="report-head">
        <div>
          <div class="eyebrow">Mat Log · ${formatDate(todayISO(), { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <h1>${escapeHtml(name)}</h1>
          <div class="muted">${beltInfo().name} belt${state.stripes ? `, ${state.stripes} stripe${state.stripes > 1 ? 's' : ''}` : ''}${state.profile.gym ? ' · ' + escapeHtml(state.profile.gym) : ''}</div>
        </div>
        ${ringSVG(r.pct, { size: 84, stroke: 8, color: 'var(--blue)', track: 'var(--track)' })}
      </header>

      <section><h3>Summary</h3>
        <p>Training since ${d.since ? formatMonthYear(d.since) : '-'} (${d.months.toFixed(0)} months): <b>${d.all.count} sessions</b>, <b>${d.all.hours.toFixed(0)} mat hours</b>, <b>${d.all.rounds} live rounds</b>. Last 12 weeks: ${d.perWeek12.toFixed(1)} sessions a week.
        ${nb ? `${nb.name}-belt readiness by common academy standards: <b>${r.pct}%</b> (${r.stage.label.toLowerCase()}).` : ''}</p>
      </section>

      <section><h3>Blue-belt checklist</h3>
        <ul class="report-list">${r.checklist.map(c => `<li class="s${c.status}"><span>${c.status === 2 ? '✓' : c.status === 1 ? '~' : '○'}</span>${c.label}${c.evidence ? ` <i>(${escapeHtml(c.evidence)})</i>` : ''}</li>`).join('')}</ul>
      </section>

      <section><h3>Skill areas</h3>
        <table class="report-table">${r.domains.map(dm => `<tr><td>${dm.label}</td><td>${Math.round(dm.pct * 100)}%</td><td>${dm.evidence ? `${dm.evidence.reps} positional rounds` : 'self-rated'}</td></tr>`).join('')}</table>
        <p class="small muted">${d.reliable} of ${d.total} library moves rated "in rolls" or better.</p>
      </section>

      ${rollRows || posRows ? `<section><h3>Live evidence</h3>
        ${rollRows ? `<table class="report-table"><tr><th>Rolled with</th><th>Results (90 days)</th><th>Score</th></tr>${rollRows}</table>` : ''}
        ${posRows ? `<table class="report-table"><tr><th>Positional start</th><th>Reps</th><th>Success</th></tr>${posRows}</table>` : ''}
      </section>` : ''}

      <section><h3>Game plan</h3>
        <table class="report-table">${d.gameplan.map(g => `<tr><td>${g.p.label}</td><td>${g.moves.length ? escapeHtml(g.moves.join(', ')) : '<span class="muted">-</span>'}</td></tr>`).join('')}</table>
      </section>

      <section><h3>What I'm working on</h3>
        <ul class="report-list plain">
          ${d.focus.map(f => `<li>${escapeHtml(f.f.theme)} <i>(${f.st.tried} tried, ${f.st.worked} worked)</i></li>`).join('')}
          ${d.topWork.map(([t, n]) => `<li>${tagLabel(t)} <i>(flagged in ${n} of the last 12 sessions)</i></li>`).join('')}
          ${d.taps.caughtBy[0] ? `<li>Defending ${subLabel(d.taps.caughtBy[0][0])} <i>(caught ${d.taps.caughtBy[0][1]}× recently)</i></li>` : ''}
        </ul>
      </section>

      ${d.comps.win + d.comps.loss ? `<section><h3>Competition</h3><p>${d.comps.win}–${d.comps.loss} across ${d.comps.comps} comp${d.comps.comps > 1 ? 's' : ''}, ${d.comps.subs} by submission.</p></section>` : ''}
      <p class="small muted">Self-tracked in Mat Log. Skill ratings are self-assessed unless backed by positional or roll results.</p>
    </article>
  `;
}

function reportText() {
  const d = reportData();
  const r = d.r;
  const lines = [
    `${state.profile.name || 'Training report'} · ${beltInfo().name} belt${state.stripes ? ` (${state.stripes} stripes)` : ''}${state.profile.gym ? ' · ' + state.profile.gym : ''}`,
    `${d.all.count} sessions, ${d.all.hours.toFixed(0)} mat hours, ${d.all.rounds} live rounds since ${d.since ? formatMonthYear(d.since) : '-'}. ${d.perWeek12.toFixed(1)}/week over the last 12 weeks.`,
    `Blue-belt readiness: ${r.pct}% (${r.stage.label.toLowerCase()}).`,
    '',
    'Checklist:',
    ...r.checklist.map(c => `${c.status === 2 ? '✓' : c.status === 1 ? '~' : '○'} ${c.label}${c.evidence ? ` (${c.evidence})` : ''}`),
    '',
    'Working on:',
    ...d.focus.map(f => `- ${f.f.theme}`),
    ...d.topWork.map(([t]) => `- ${tagLabel(t)}`),
  ];
  return lines.join('\n');
}

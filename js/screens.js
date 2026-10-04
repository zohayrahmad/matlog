/* =========================================================
   Mat Log: Log, Skills, Review and Progress screens + sheets
   ========================================================= */

/* =========================================================
   LOG
   ========================================================= */
function sessionCardHTML(s) {
  const d = new Date(fromISODate(s.date));
  const type = SESSION_TYPES.find(t => t.id === s.type);
  const title = s.covered || (s.legacy && s.legacy.taught) || (s.type === 'open' ? 'Open mat' : 'Session');
  const note = s.workOnNote || s.notes;
  return `
    <button class="session" data-act="log-edit" data-id="${s.id}">
      <div class="date-tile"><div class="d">${d.getDate()}</div><div class="w">${d.toLocaleDateString('en-GB', { weekday: 'short' })}</div></div>
      <div style="min-width:0">
        <div class="top">
          ${s.type !== 'class' ? `<span class="tag type">${type ? type.label : s.type}</span>` : ''}
          ${s.gi === 'gi' ? '<span class="tag">Gi</span>' : ''}
          <span class="meta">${s.minutes} min · ${s.spars || 0} rounds</span>
          ${s.feel ? `<span class="feel-mini" title="${FEEL[s.feel].label}">${[1, 2, 3, 4].map(i => `<i class="${i <= s.feel ? 'f' : ''}"></i>`).join('')}</span>` : ''}
        </div>
        <div class="covered">${escapeHtml(title)}</div>
        ${note ? `<div class="note">${escapeHtml(note)}</div>` : ''}
        ${(s.workOn || []).length || s.injury ? `<div class="tags">
          ${(s.workOn || []).map(t => `<span class="tag work">${tagLabel(t)}</span>`).join('')}
          ${s.injury ? `<span class="tag inj">${escapeHtml(s.injury)}</span>` : ''}
        </div>` : ''}
      </div>
    </button>`;
}

function logListHTML() {
  const q = ui.logSearch.trim().toLowerCase();
  const list = q
    ? state.sessions.filter(s => [s.covered, s.notes, s.workOnNote, s.injury, ...(s.workOn || []).map(tagLabel), ...(s.moves || []).map(id => moveById(id)?.name)]
        .filter(Boolean).join(' ').toLowerCase().includes(q))
    : state.sessions;
  if (!list.length) {
    return q ? `<div class="empty-state">No sessions match "${escapeHtml(q)}".</div>`
             : `<div class="empty-state"><div class="big">No sessions yet</div>Tap the + button after training. It takes 30 seconds.</div>`;
  }
  let out = '', month = '';
  list.forEach(s => {
    const m = s.date.slice(0, 7);
    if (m !== month) {
      month = m;
      const t = totals(list.filter(x => x.date.startsWith(m)));
      out += `<div class="month-head">${formatMonthYear(s.date)}<span>${t.count} sessions · ${t.hours.toFixed(1)}h</span></div>`;
    }
    out += sessionCardHTML(s);
  });
  return out;
}

function renderLog() {
  const all = totals(state.sessions);
  const m = monthStart(todayISO());
  const month = totals(sessionsBetween(m, addMonths(m, 1)));
  return `
    <h1 class="screen-title">Training log</h1>
    <p class="screen-sub">${all.count} sessions · ${all.hours.toFixed(0)} hours · ${all.rounds} rounds</p>
    <div class="grid-3" style="margin-bottom:12px">
      <div class="stat"><div class="v">${month.count}</div><div class="l">This month</div></div>
      <div class="stat"><div class="v">${month.hours.toFixed(1)}<span class="u">h</span></div><div class="l">Mat time</div></div>
      <div class="stat"><div class="v">${weekStreak()}</div><div class="l">Week streak</div></div>
    </div>
    <div class="card">
      <div class="card-title">Last 18 weeks</div>
      ${heatmapHTML(18)}
    </div>
    <input type="search" data-input="log-search" value="${escapeHtml(ui.logSearch)}" placeholder="Search sessions, moves, notes…" style="margin:6px 0 4px">
    <div id="logList">${logListHTML()}</div>
  `;
}

/* =========================================================
   SKILLS: game plan + library
   ========================================================= */
function renderSkills() {
  return `
    <h1 class="screen-title">Skills</h1>
    <p class="screen-sub">${ui.skillsTab === 'plan' ? 'Your go-to moves from every key position. Blue belts have an answer everywhere.' : 'Rate each move honestly. It drives your readiness score.'}</p>
    <div class="seg" style="margin-bottom:16px">
      <button class="${ui.skillsTab === 'plan' ? 'on' : ''}" data-act="skills-tab" data-v="plan">Game plan</button>
      <button class="${ui.skillsTab === 'library' ? 'on' : ''}" data-act="skills-tab" data-v="library">Library</button>
    </div>
    ${ui.skillsTab === 'plan' ? gameplanHTML() : libraryHTML()}
  `;
}

function gameplanHTML() {
  const cov = gameplanCoverage();
  const groups = [
    ['Attacking', GAMEPLAN_POSITIONS.filter(p => !p.escape && p.id !== 'legs')],
    ['Escaping', GAMEPLAN_POSITIONS.filter(p => p.escape)],
    ['Legs', GAMEPLAN_POSITIONS.filter(p => p.id === 'legs')],
  ];
  return `
    <div class="card">
      <div class="row between"><div class="card-title" style="margin:0">Positions covered</div><b>${cov.filled}/${cov.total}</b></div>
      <div style="margin-top:10px">${meterHTML(cov.filled / cov.total, 'accent')}</div>
      ${cov.missing.length ? `<div class="small muted" style="margin-top:8px">No go-to yet: ${cov.missing.slice(0, 4).map(p => p.label).join(', ')}${cov.missing.length > 4 ? '…' : ''}</div>` : '<div class="small muted" style="margin-top:8px">You have an answer everywhere. Now sharpen them.</div>'}
    </div>
    ${groups.map(([g, list]) => `
      <div class="gp-group">${g}</div>
      ${list.map(p => {
        const plan = state.gameplan[p.id] || { moves: [], note: '' };
        return `
          <button class="gp-pos" data-act="gp-open" data-id="${p.id}">
            <div class="head"><div><div class="name">${p.label}</div><div class="role">${p.role}</div></div><span class="chev">${ICON.chev}</span></div>
            ${plan.moves.length ? `<div class="moves">${plan.moves.map(id => { const m = moveById(id); return m ? `<span class="pill st-${moveState(id)}">${escapeHtml(m.name)}</span>` : ''; }).join('')}</div>` : '<div class="empty">+ Pick your go-to</div>'}
            ${plan.note ? `<div class="ifthen">${escapeHtml(plan.note)}</div>` : ''}
          </button>`;
      }).join('')}
    `).join('')}
  `;
}

function libraryOverviewHTML() {
  const domains = domainScores();
  return `
    <div class="card">
      <div class="card-title">Blue-belt core</div>
      ${domains.map(d => `
        <div class="hbar" data-tip="${escapeHtml(d.why)}">
          <span>${d.label}</span><span class="val">${Math.round(d.pct * 100)}%</span>
          ${meterHTML(d.pct)}
        </div>`).join('')}
    </div>`;
}

function libListHTML() {
  const q = ui.libSearch.trim().toLowerCase();
  const practice = movePractice();
  const all = getAllMoves();
  const cats = ui.libFilter === 'all' ? CATEGORIES : [ui.libFilter];
  const core = new Set(READINESS.domains.flatMap(d => d.moves));
  const html = cats.map(cat => {
    const moves = all.filter(m => m.cat === cat && (!q || m.name.toLowerCase().includes(q)));
    if (!moves.length) return '';
    const solid = moves.filter(m => moveState(m.id) >= 3).length;
    return `
      <div class="month-head">${cat}<span>${solid}/${moves.length} in rolls+</span></div>
      ${moves.map(m => {
        const s = moveState(m.id);
        const p = practice[m.id];
        const sub = [core.has(m.id) ? 'Blue-belt core' : '', p ? `worked ${p.count}× · last ${formatShort(p.last)}` : '', m.id.startsWith('cm_') ? 'custom' : ''].filter(Boolean).join(' · ');
        return `
          <button class="list-row" data-act="move-open" data-id="${m.id}">
            <div class="main"><div class="title">${escapeHtml(m.name)}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>
            <span class="pill st-${s}">${STATE_LABELS[s]}</span>
          </button>`;
      }).join('')}`;
  }).join('');
  return html || `<div class="empty-state">No moves match "${escapeHtml(q)}".</div>`;
}

function libraryHTML() {
  return `
    ${libraryOverviewHTML()}
    <input type="search" data-input="lib-search" value="${escapeHtml(ui.libSearch)}" placeholder="Search moves…" style="margin-bottom:10px">
    <div class="chips scroll" style="margin-bottom:6px">
      ${chip('All', ui.libFilter === 'all', 'data-act="lib-filter" data-v="all"')}
      ${CATEGORIES.map(c => chip(CATEGORY_SHORT[c], ui.libFilter === c, `data-act="lib-filter" data-v="${escapeHtml(c)}"`)).join('')}
    </div>
    <div id="libList">${libListHTML()}</div>
    <button class="btn ghost block sm" data-act="custom-new" style="margin-top:14px">+ Add custom move</button>
  `;
}

/* ---------- move sheet ---------- */
function moveSheetHTML() {
  const d = draft;
  const m = moveById(d.id);
  const p = movePractice()[d.id];
  const core = READINESS.domains.find(x => x.moves.includes(d.id));
  const usedIn = GAMEPLAN_POSITIONS.filter(pos => (state.gameplan[pos.id]?.moves || []).includes(d.id));
  return `
    <h2 class="sheet-title">${escapeHtml(m.name)}</h2>
    <p class="sheet-sub">${m.cat}${core ? ` · counts towards <b>${core.label}</b>` : ''}</p>
    <div class="field">
      <div class="lbl">Where is it at?</div>
      <div class="state-picker">
        ${STATE_LABELS.map((l, i) => `
          <button type="button" class="${d.state === i ? 'on' : ''}" data-act="m-state" data-v="${i}">
            <span><b>${l}</b></span><span class="h">${STATE_HINTS[i]}</span>
          </button>`).join('')}
      </div>
    </div>
    <label class="field">
      <div class="lbl">Cues &amp; details <span class="opt">optional</span></div>
      <textarea data-bind="notes" placeholder="Key details, common mistakes…">${escapeHtml(d.notes)}</textarea>
    </label>
    <label class="field">
      <div class="lbl">Video link <span class="opt">optional</span></div>
      <input type="url" data-bind="link" value="${escapeHtml(d.link)}" placeholder="https://…">
    </label>
    ${d.link ? `<a href="${escapeHtml(d.link)}" target="_blank" rel="noopener" class="btn ghost sm block" style="margin:-6px 0 16px">Open video ↗</a>` : ''}
    <div class="small muted" style="margin-bottom:6px">
      ${p ? `Worked in ${p.count} session${p.count === 1 ? '' : 's'}, last on ${formatDate(p.last)}.` : 'Not tagged in any session yet.'}
      ${usedIn.length ? ` In your game plan: ${usedIn.map(x => x.label).join(', ')}.` : ''}
    </div>
    <div class="sheet-actions">
      <button type="button" class="btn ghost" data-act="sheet-close">Cancel</button>
      <button type="button" class="btn accent" data-act="save-move">Save</button>
    </div>
    ${d.id.startsWith('cm_') ? `<button type="button" class="btn danger block sm" data-act="delete-move" style="margin-top:12px">Delete custom move</button>` : ''}
  `;
}

function customMoveSheetHTML() {
  return `
    <h2 class="sheet-title">Add custom move</h2>
    <p class="sheet-sub">Anything your gym teaches that isn't in the library.</p>
    <label class="field"><div class="lbl">Name</div><input type="text" data-bind="name" value="${escapeHtml(draft.name)}" placeholder="e.g. Crucifix from turtle"></label>
    <div class="field"><div class="lbl">Category</div>
      <div class="chips">${CATEGORIES.map(c => chip(CATEGORY_SHORT[c], draft.cat === c, `data-act="d-set" data-k="cat" data-v="${escapeHtml(c)}"`)).join('')}</div>
    </div>
    <div class="sheet-actions">
      <button type="button" class="btn ghost" data-act="sheet-close">Cancel</button>
      <button type="button" class="btn accent" data-act="save-custom">Add move</button>
    </div>`;
}

/* ---------- game plan sheet ---------- */
function gpSheetHTML() {
  const pos = GAMEPLAN_POSITIONS.find(p => p.id === draft.pos);
  const cands = getAllMoves().filter(m => pos.cats.includes(m.cat))
    .sort((a, b) => moveState(b.id) - moveState(a.id));
  return `
    <h2 class="sheet-title">${pos.label}</h2>
    <p class="sheet-sub">${pos.role}. Pick 1-3 go-to moves, best first.</p>
    ${draft.moves.length ? `<div class="chips" style="margin-bottom:14px">${draft.moves.map((id, i) => chip(`${i + 1}. ${escapeHtml(moveById(id)?.name || id)} <span class="x">×</span>`, true, `data-act="d-toggle" data-k="moves" data-v="${id}"`, 'on-accent')).join('')}</div>` : ''}
    <label class="field">
      <div class="lbl">If-then plan <span class="opt">optional</span></div>
      <input type="text" data-bind="note" value="${escapeHtml(draft.note)}" placeholder="${pos.escape ? 'e.g. Frame first; if they post, bridge and roll' : 'e.g. If they posture up, go to the kimura'}">
    </label>
    <div class="field">
      <div class="lbl">Options</div>
      ${cands.map(m => `
        <button type="button" class="list-row" data-act="d-toggle" data-k="moves" data-v="${m.id}" style="${draft.moves.includes(m.id) ? 'border-color:var(--accent)' : ''}">
          <div class="main"><div class="title">${escapeHtml(m.name)}</div></div>
          <span class="pill st-${moveState(m.id)}">${STATE_LABELS[moveState(m.id)]}</span>
        </button>`).join('')}
    </div>
    <div class="sheet-actions">
      <button type="button" class="btn ghost" data-act="sheet-close">Cancel</button>
      <button type="button" class="btn accent" data-act="save-gp">Save</button>
    </div>`;
}

/* ---------- focus sheet ---------- */
function focusSheetHTML() {
  return `
    <h2 class="sheet-title">${draft.id ? 'Edit focus' : 'New focus'}</h2>
    <p class="sheet-sub">One specific thing to hunt for in live rounds. You'll mark tried/worked each time you log.</p>
    <label class="field"><div class="lbl">Focus</div><input type="text" data-bind="theme" value="${escapeHtml(draft.theme)}" placeholder="e.g. Elbow-knee escape from mount"></label>
    <label class="field"><div class="lbl">What success looks like <span class="opt">optional</span></div><textarea data-bind="success" placeholder="e.g. Escape mount twice a session against people my size">${escapeHtml(draft.success)}</textarea></label>
    <div class="field"><div class="lbl">Ideas</div><div class="chips">
      ${nextSessionPlan().filter(p => p.kind !== 'Hunt' && p.kind !== 'Start').map(p => chip(escapeHtml(p.text), false, `data-act="d-set" data-k="theme" data-v="${escapeHtml(p.text)}"`)).join('') || '<span class="small muted">Log a few sessions and suggestions appear here.</span>'}
    </div></div>
    <div class="sheet-actions">
      <button type="button" class="btn ghost" data-act="sheet-close">Cancel</button>
      <button type="button" class="btn accent" data-act="save-focus">Save</button>
    </div>
    ${draft.id ? `<button type="button" class="btn danger block sm" data-act="archive-focus" style="margin-top:12px">Done with this focus (archive)</button>` : ''}`;
}

/* =========================================================
   REVIEW
   ========================================================= */
function deltaHTML(cur, prev, fmt = v => v) {
  if (prev == null || cur == null) return '';
  const d = cur - prev;
  if (Math.abs(d) < 0.05) return '<span class="delta">=</span>';
  return `<span class="delta ${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : '−'}${fmt(Math.abs(d))}</span>`;
}

function renderReview() {
  const r = buildReview(ui.reviewMode, ui.reviewAnchor);
  const isCurrent = r.from <= todayISO() && todayISO() < r.to;
  const label = ui.reviewMode === 'week'
    ? `${formatShort(r.from)} – ${formatShort(addDays(r.to, -1))}`
    : formatMonthYear(r.from);
  const note = (state.reviews[r.key] || {}).note || '';
  const series = weeklySeries(12, ui.reviewMode === 'week' ? r.from : addDays(r.to, -1));

  return `
    <h1 class="screen-title">Review</h1>
    <p class="screen-sub">Read it on Sunday. Set up next week in two minutes.</p>
    <div class="seg" style="margin-bottom:12px">
      <button class="${ui.reviewMode === 'week' ? 'on' : ''}" data-act="review-mode" data-v="week">Week</button>
      <button class="${ui.reviewMode === 'month' ? 'on' : ''}" data-act="review-mode" data-v="month">Month</button>
    </div>
    <div class="row between" style="margin-bottom:12px">
      <button class="icon-btn" data-act="review-step" data-d="-1" aria-label="Previous">${ICON.back}</button>
      <div style="text-align:center"><div style="font-weight:700">${label}</div><div class="small muted">${isCurrent ? 'In progress' : ''}</div></div>
      <button class="icon-btn" data-act="review-step" data-d="1" aria-label="Next" ${isCurrent ? 'disabled style="opacity:.3"' : ''}>${ICON.next}</button>
    </div>

    <div class="card" style="background:linear-gradient(135deg, var(--accent-soft), var(--blue-soft)); border-color:transparent">
      <div style="font-family:var(--display); font-size:20px; font-weight:700; letter-spacing:-0.02em; line-height:1.3">${r.headline}</div>
    </div>

    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat"><div class="v">${r.cur.count}<span class="u">/ ${r.targetSessions}</span>${deltaHTML(r.cur.count, r.prev.count)}</div><div class="l">Sessions vs target</div></div>
      <div class="stat"><div class="v">${r.cur.hours.toFixed(1)}<span class="u">h</span>${deltaHTML(r.cur.hours, r.prev.hours, v => v.toFixed(1))}</div><div class="l">Mat time</div></div>
      <div class="stat"><div class="v">${r.cur.rounds}${deltaHTML(r.cur.rounds, r.prev.rounds)}</div><div class="l">Live rounds</div></div>
      <div class="stat"><div class="v" style="font-size:20px">${r.cur.avgFeel ? capitalize(feelWord(r.cur.avgFeel)) : '–'}</div><div class="l">How rolls felt</div></div>
    </div>

    <div class="card">
      <div class="card-title">Sessions per week</div>
      ${weekBarsSVG(series, state.goals.perWeek)}
    </div>

    ${r.changes.length ? `<div class="section-head"><h2>What changed</h2></div>
      ${r.changes.map(c => `<div class="insight tone-${c.tone}"><span class="ic">${c.tone === 'good' ? '↑' : c.tone === 'warn' ? '!' : 'i'}</span><div>${c.text}</div></div>`).join('')}` : ''}

    ${r.tags.length ? `<div class="card" style="margin-top:12px"><div class="card-title">What held you back</div>
      ${hbarsHTML(r.tags.map(([t, n]) => [tagLabel(t), n, `${n} of ${r.cur.count} sessions`]))}</div>` : ''}

    ${r.taps.inCount + r.taps.outCount ? `<div class="card"><div class="card-title">Taps</div>
      <div class="grid-2">
        <div><div class="small muted" style="margin-bottom:6px">Caught me · ${r.taps.inCount}</div>${hbarsHTML(r.taps.caughtBy.map(([k, n]) => [subLabel(k), n]), { cls: 'accent' })}</div>
        <div><div class="small muted" style="margin-bottom:6px">I caught · ${r.taps.outCount}</div>${hbarsHTML(r.taps.caught.map(([k, n]) => [subLabel(k), n]), { cls: 'green' })}</div>
      </div></div>` : ''}

    ${r.focus.length ? `<div class="card"><div class="card-title">Focus</div>
      ${r.focus.map(f => `<div class="row between" style="padding:6px 0; font-size:13px"><span style="flex:1">${escapeHtml(f.f.theme)}</span><span class="muted">${f.tried} tried · <b style="color:var(--green)">${f.worked} worked</b></span></div>`).join('')}</div>` : ''}

    ${r.movesWorked.length ? `<div class="card"><div class="card-title">Moves worked</div><div class="chips">
      ${r.movesWorked.map(([id, n]) => { const m = moveById(id); return m ? `<span class="tag">${escapeHtml(m.name)}${n > 1 ? ` ×${n}` : ''}</span>` : ''; }).join('')}</div></div>` : ''}

    ${r.injuries.length || r.notes.length ? `<div class="card"><div class="card-title">Notes</div>
      ${r.injuries.map(i => `<div class="small" style="padding:4px 0"><span class="tag inj">${escapeHtml(i.what)}</span> <span class="muted">${formatShort(i.date)}</span></div>`).join('')}
      ${r.notes.map(n => `<div class="small" style="padding:4px 0"><span class="muted">${formatShort(n.date)}</span> ${escapeHtml(n.text)}</div>`).join('')}</div>` : ''}

    <div class="section-head"><h2>Plan for next week</h2></div>
    <div class="card">
      ${r.plan.map((p, i) => `<div class="plan-item"><span class="plan-kind k-${['hunt', 'fix', 'defend', 'revisit'][i % 4]}">${i + 1}</span><div class="plan-text" style="font-weight:500">${p}</div></div>`).join('')}
      <label class="field" style="margin:14px 0 0">
        <div class="lbl">My intention <span class="opt">saved with this ${ui.reviewMode}</span></div>
        <textarea data-input="review-note" data-key="${r.key}" placeholder="One sentence you'll hold yourself to.">${escapeHtml(note)}</textarea>
      </label>
    </div>
  `;
}

/* =========================================================
   PROGRESS (readiness detail)
   ========================================================= */
function pillarDetail(p, r) {
  switch (p.id) {
    case 'time': return `${r.hours.toFixed(0)}h of ~${READINESS.hoursTarget}h, ${r.rounds} of ~${READINESS.roundsTarget} live rounds`;
    case 'skill': return `Your ratings across ${READINESS.domains.reduce((a, d) => a + d.moves.length, 0)} blue-belt core moves`;
    case 'live': return r.ratedCount >= 3 ? `Rolls lately: ${feelWord(r.avgFeel)} (last ${r.ratedCount} rated sessions)` : 'Rate how rolls went when you log. Needs 3 sessions; until then the other pillars carry the weight.';
    case 'consistency': return `${r.perWeek12.toFixed(1)} sessions/week over the last 12 weeks (2+ is the norm)`;
  }
  return '';
}

function renderProgress() {
  const r = calcReadiness();
  const nb = nextBelt();
  const pr = r.projection;
  const ms = milestones();
  const groups = [...new Set(r.checklist.map(c => c.group))];
  const met = r.checklist.filter(c => c.status === 2).length;

  return `
    <div class="back-row">
      <button class="icon-btn" data-act="go" data-to="home" aria-label="Back">${ICON.back}</button>
      <span class="eyebrow">${nb ? nb.name + ' belt readiness' : 'Progress'}</span>
    </div>
    ${heroCard(r, { link: false })}

    ${r.unratedNew ? `<button class="banner" data-act="rate-new"><div style="flex:1"><div class="t">${r.unratedNew} core moves unrated</div><div class="s">Your score is lower than it should be until you rate them.</div></div><span class="chev">${ICON.chev}</span></button>` : ''}

    <div class="card">
      <div class="card-title">What the score is made of</div>
      ${r.pillars.map(p => `
        <div class="pillar">
          <div class="top"><b>${p.label}</b><span class="muted">${p.score == null ? 'no data yet' : Math.round(p.score * 100) + '%'} · weight ${Math.round(p.weight * 100)}%</span></div>
          ${meterHTML(p.score || 0, p.id === 'skill' ? '' : p.id === 'time' ? 'accent' : 'green')}
          <div class="detail">${pillarDetail(p, r)}</div>
        </div>`).join('')}
      <div class="small muted">Actual rank: ${beltInfo().name}${state.stripes ? `, ${state.stripes} stripe${state.stripes > 1 ? 's' : ''}` : ''}. ${(r.monthsAtBelt).toFixed(0)} months at this belt. Promotion is always your coach's call. This shows where a typical academy would place you.</div>
    </div>

    <div class="card">
      <div class="card-title">Mat-time benchmark (${READINESS.hoursTarget}h)</div>
      <div class="small" style="line-height:1.6">
        <div class="row between"><span>At your last 8 weeks' pace (${pr.recentHoursPerWeek.toFixed(1)}h/wk)</span><b>${pr.hoursLeft <= 0 ? 'Reached' : pr.atRecent ? formatMonthYear(pr.atRecent) : 'Not moving'}</b></div>
        <div class="row between"><span>At ${state.goals.perWeek}×/week</span><b>${pr.hoursLeft <= 0 ? 'Reached' : pr.atTarget ? formatMonthYear(pr.atTarget) : '–'}</b></div>
        ${state.goals.rampTo > state.goals.perWeek ? `<div class="row between"><span>At ${state.goals.rampTo}×/week</span><b>${pr.hoursLeft <= 0 ? 'Reached' : pr.atRamp ? formatMonthYear(pr.atRamp) : '–'}</b></div>` : ''}
      </div>
      <div class="small muted" style="margin-top:8px">${pr.hoursLeft.toFixed(0)} hours to go at ~${(pr.avgSessionHours * 60).toFixed(0)} min a session. Hours are the slow part; skills move faster when you train with intent.</div>
    </div>

    <div class="section-head"><h2>Blue belt checklist</h2><span class="small muted">${met}/${r.checklist.length}</span></div>
    <div class="card">
      ${r.checklist.map(c => `
        <div class="check"><span class="ic s${c.status}">${c.status === 2 ? '✓' : c.status === 1 ? '~' : ''}</span><span>${c.label}</span><span class="grp">${c.group}</span></div>`).join('')}
      <div class="small muted" style="margin-top:10px">✓ = rated "In rolls" or better · ~ = getting there (drilling).</div>
    </div>

    <div class="section-head"><h2>Skill areas</h2></div>
    ${r.domains.map(d => `
      <div class="card tight">
        <div class="row between"><b style="font-size:14px">${d.label}</b><span class="small muted">${Math.round(d.pct * 100)}% · weight ${Math.round(d.weight * 100)}%</span></div>
        <div style="margin:8px 0">${meterHTML(d.pct)}</div>
        <div class="small muted">${d.why}</div>
        ${d.pct < 1 ? `<div class="chips" style="margin-top:8px">${d.weakest.filter(w => w.move).map(w => `<button class="chip sm" data-act="move-open" data-id="${w.move.id}">${escapeHtml(w.move.name)} · ${STATE_LABELS[w.s]}</button>`).join('')}</div>` : ''}
      </div>`).join('')}

    <div class="section-head"><h2>Milestones</h2><span class="small muted">${ms.earned.length}/${ms.list.length}</span></div>
    <div class="badges">
      ${ms.list.map(m => `<div class="badge ${m.done ? 'done' : ''}" data-tip="${escapeHtml(m.done ? 'Earned' : `${Math.floor(m.value)} / ${m.n}`)}"><span class="b">${m.n}</span>${{ hours: 'mat hours', sessions: 'sessions', rounds: 'rounds', streak: 'week streak' }[m.kind]}</div>`).join('')}
    </div>

    <div class="card" style="margin-top:16px">
      <details class="method">
        <summary>How this is calculated <span class="muted">+</span></summary>
        <p>No federation sets fixed blue-belt criteria. The IBJJF only requires you to be 16 and leaves the rest to your instructor, so this model averages what academies, coaches and survey data agree on.</p>
        <ul>
          <li><b>Mat time (35%).</b> White to blue typically takes 150-300 mat hours. A survey of 1,948 practitioners found ~2.3 years on average, and most coaches say 1-3 years at 2-3 sessions a week. The target here is ${READINESS.hoursTarget}h plus ~${READINESS.roundsTarget} live rounds.</li>
          <li><b>Technical skill (40%).</b> The common standard is "hard to pin, hard to submit, hard to pass." That means escapes from mount, side and back; defence against the common submissions; guard retention with a sweep and attacks; a couple of passes; holding top positions and finishing standard subs; and a takedown or safe guard pull. Escapes carry the most weight because white belt is about survival and escapes come next.</li>
          <li><b>Live performance (15%).</b> Instructors promote on what they see in rolls: being competitive with peers and controlling newer white belts safely.</li>
          <li><b>Consistency (10%).</b> Attendance is the most cited non-technical factor.</li>
        </ul>
        <p>Predicted stripes use the common rule of thumb that each white-belt stripe is about 20% of the journey. Some gyms (10th Planet among them) don't use stripes.</p>
        <p class="small">Sources: ${READINESS.sources.map(s => `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`).join(' · ')}</p>
      </details>
    </div>
  `;
}

/* =========================================================
   SETTINGS
   ========================================================= */
function settingsSheetHTML() {
  const d = draft;
  const last = state.lastBackupAt;
  const promos = [...state.promotions].sort((a, b) => b.date.localeCompare(a.date));
  return `
    <h2 class="sheet-title">Settings</h2>
    <p class="sheet-sub">Rank, weekly goal, look and your data.</p>

    <div class="field"><div class="lbl">Belt</div>
      <div class="chips">${BELTS.map(b => chip(`${beltSwatch(b.id, 0)} ${b.name}`, d.belt === b.id, `data-act="set-belt" data-v="${b.id}"`)).join('')}</div>
    </div>
    <div class="field"><div class="lbl">Stripes</div>
      <div class="chips">${[0, 1, 2, 3, 4].map(n => chip(String(n), d.stripes === n, `data-act="d-set" data-k="stripes" data-v="${n}" data-num="1"`)).join('')}</div>
    </div>
    <div class="grid-2">
      <label class="field"><div class="lbl">At this belt since</div><input type="date" data-bind="since" value="${d.since}"></label>
      <label class="field"><div class="lbl">Started BJJ</div><input type="date" data-bind="started" value="${d.started}"></label>
    </div>

    <div class="field"><div class="lbl">Weekly target</div>
      <div class="inline-fields">
        <div class="stepper"><button type="button" data-act="d-step" data-k="perWeek" data-d="-1" data-min="1">−</button><span class="val">${d.perWeek}</span><button type="button" data-act="d-step" data-k="perWeek" data-d="1" data-max="7">+</button></div>
        <span class="small muted">now, ramping to</span>
        <div class="stepper"><button type="button" data-act="d-step" data-k="rampTo" data-d="-1" data-min="1">−</button><span class="val">${d.rampTo}</span><button type="button" data-act="d-step" data-k="rampTo" data-d="1" data-max="7">+</button></div>
      </div>
      <div class="small muted" style="margin-top:6px">After 4 weeks in a row at your target, Mat Log will suggest ramping up.</div>
    </div>

    <div class="field"><div class="lbl">Appearance</div>
      <div class="seg">${['auto', 'dark', 'light'].map(t => `<button type="button" class="${d.theme === t ? 'on' : ''}" data-act="d-set" data-k="theme" data-v="${t}">${capitalize(t === 'auto' ? 'match phone' : t)}</button>`).join('')}</div>
    </div>

    <div class="sheet-actions" style="position:static; padding-top:4px">
      <button type="button" class="btn ghost" data-act="sheet-close">Cancel</button>
      <button type="button" class="btn accent" data-act="save-settings">Save</button>
    </div>

    ${promos.length ? `<hr class="div"><div class="card-title">Promotion history</div>
      ${promos.map(p => `<div class="row between small" style="padding:6px 0; border-top:1px solid var(--line)"><span>${beltSwatch(p.belt, p.stripes)} ${beltInfo(p.belt).name}${p.stripes ? ` · ${p.stripes} stripe${p.stripes > 1 ? 's' : ''}` : ''}</span><span class="muted">${formatDate(p.date)}</span></div>`).join('')}` : ''}

    <hr class="div">
    <div class="card-title">Your data</div>
    <p class="small" style="color:var(--ink-2); margin:0 0 10px">Saved on this phone automatically. ${state.sessions.length} sessions, ${state.taps.length} taps. ${last ? `Last backup ${Math.floor((Date.now() - last) / 86400000)} days ago.` : 'No backup from this device yet.'} Backups are insurance against losing your phone. You don't need one to get app updates.</p>
    <div class="grid-2">
      <button type="button" class="btn ghost sm" data-act="backup">Back up</button>
      <button type="button" class="btn ghost sm" data-act="restore">Restore</button>
    </div>
  `;
}

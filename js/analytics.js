/* =========================================================
   Mat Log: analytics (pure functions over `state`)
   ========================================================= */

/* ---------- basic aggregates ---------- */
function totals(sessions) {
  const minutes = sessions.reduce((a, s) => a + (s.minutes || 0), 0);
  const rounds = sessions.reduce((a, s) => a + (s.spars || 0), 0);
  const feel = sessions.filter(s => s.feel).map(s => s.feel);
  const energy = sessions.filter(s => s.mood).map(s => s.mood);
  return {
    count: sessions.length,
    minutes,
    hours: minutes / 60,
    rounds,
    avgFeel: feel.length ? feel.reduce((a, b) => a + b, 0) / feel.length : null,
    avgEnergy: energy.length ? energy.reduce((a, b) => a + b, 0) / energy.length : null,
  };
}

// [fromIso, toIso) half-open
function sessionsBetween(fromIso, toIso) {
  return state.sessions.filter(s => s.date >= fromIso && s.date < toIso);
}
function tapsBetween(fromIso, toIso) {
  return state.taps.filter(t => t.date >= fromIso && t.date < toIso);
}

function weeklySeries(nWeeks, endIso = todayISO()) {
  const thisWeek = weekStart(endIso);
  const out = [];
  for (let i = nWeeks - 1; i >= 0; i--) {
    const from = addDays(thisWeek, -7 * i);
    const t = totals(sessionsBetween(from, addDays(from, 7)));
    out.push({ week: from, sessions: t.count, minutes: t.minutes, rounds: t.rounds });
  }
  return out;
}

function currentWeek() {
  const from = weekStart(todayISO());
  const t = totals(sessionsBetween(from, addDays(from, 7)));
  const target = state.goals.perWeek;
  return { from, ...t, target, met: t.count >= target, left: Math.max(0, target - t.count) };
}

// Consecutive weeks hitting the weekly target. The current week only counts
// once it's met; an unfinished week never breaks the streak.
function weekStreak() {
  const target = state.goals.perWeek;
  let week = weekStart(todayISO());
  let streak = 0;
  const thisCount = sessionsBetween(week, addDays(week, 7)).length;
  if (thisCount >= target) streak++;
  week = addDays(week, -7);
  for (let i = 0; i < 520; i++) {
    if (sessionsBetween(week, addDays(week, 7)).length >= target) { streak++; week = addDays(week, -7); }
    else break;
  }
  return streak;
}

function bestWeekStreak() {
  if (!state.sessions.length) return 0;
  const target = state.goals.perWeek;
  const first = weekStart(state.sessions[state.sessions.length - 1].date);
  const counts = {};
  state.sessions.forEach(s => { const w = weekStart(s.date); counts[w] = (counts[w] || 0) + 1; });
  let best = 0, run = 0;
  for (let w = first; w <= todayISO(); w = addDays(w, 7)) {
    if ((counts[w] || 0) >= target) { run++; best = Math.max(best, run); } else run = 0;
  }
  return best;
}

/* ---------- submissions ---------- */
const SUB_MATCH_ORDER = ['armtri', 'darce', 'rnc', 'heelhook', 'kneebar', 'ankle', 'armbar', 'triangle', 'guillotine', 'kimura', 'americana'];
function normalizeSub(text) {
  if (!text) return 'other';
  if (COMMON_SUBS.some(c => c.id === text)) return text;
  for (const id of SUB_MATCH_ORDER) {
    const c = COMMON_SUBS.find(x => x.id === id);
    if (c.re.test(text)) return id;
  }
  return 'other';
}
function subLabel(id) { return (COMMON_SUBS.find(c => c.id === id) || { label: 'Other' }).label; }

function tapSummary(taps) {
  const tally = dir => {
    const m = {};
    taps.filter(t => t.dir === dir).forEach(t => { const k = normalizeSub(t.sub); m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };
  return {
    inCount: taps.filter(t => t.dir === 'in').length,
    outCount: taps.filter(t => t.dir === 'out').length,
    caughtBy: tally('in'),
    caught: tally('out'),
  };
}

/* ---------- tags, moves, focus ---------- */
function tagCounts(sessions) {
  const m = {};
  sessions.forEach(s => (s.workOn || []).forEach(t => { m[t] = (m[t] || 0) + 1; }));
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}
function tagLabel(id) { return (WORK_TAGS.find(t => t.id === id) || { label: id }).label; }

function movePractice() {
  const m = {};
  // sessions are newest-first, so the first sighting is the latest
  state.sessions.forEach(s => (s.moves || []).forEach(id => {
    if (!m[id]) m[id] = { count: 0, last: s.date };
    m[id].count++;
  }));
  return m;
}

// Moves you rated as working in rolls that haven't been touched for a month.
function fadingMoves(limit = 3) {
  const p = movePractice();
  const today = todayISO();
  return getAllMoves()
    .filter(m => moveState(m.id) >= 3 && p[m.id] && daysBetween(p[m.id].last, today) >= 30)
    .sort((a, b) => p[a.id].last.localeCompare(p[b.id].last))
    .slice(0, limit)
    .map(m => ({ move: m, days: daysBetween(p[m.id].last, today) }));
}

function focusStats(f) {
  let tried = 0, worked = 0, sessions = 0;
  state.sessions.forEach(s => {
    const v = s.focus && s.focus[f.id];
    if (v === undefined) return;
    sessions++;
    if (v >= 1) tried++;
    if (v >= 2) worked++;
  });
  return { tried: tried + (f.attempts || 0), worked, logged: sessions, rate: tried ? worked / tried : null };
}

// Weakest core move for a tag: what to drill next.
function drillForTag(tag) {
  const ids = TAG_MOVES[tag] || [];
  const cands = ids.map(id => moveById(id)).filter(Boolean);
  if (!cands.length) return null;
  return cands.sort((a, b) => moveState(a.id) - moveState(b.id))[0];
}

/* ---------- game plan ---------- */
function gameplanCoverage() {
  const filled = GAMEPLAN_POSITIONS.filter(p => (state.gameplan[p.id]?.moves || []).length > 0);
  return { filled: filled.length, total: GAMEPLAN_POSITIONS.length, missing: GAMEPLAN_POSITIONS.filter(p => !filled.includes(p)) };
}

/* =========================================================
   READINESS
   ========================================================= */
function domainScores() {
  const R = READINESS;
  return R.domains.map(d => {
    const states = d.moves.map(id => moveState(id));
    const avg = states.reduce((a, s) => a + R.stateScore[s], 0) / states.length;
    const pct = Math.min(avg / R.domainReadyAt, 1);
    const weakest = d.moves
      .map(id => ({ move: moveById(id), s: moveState(id) }))
      .sort((a, b) => a.s - b.s)
      .slice(0, 3);
    return { ...d, avg, pct, weakest };
  });
}

function bestState(ids) { return Math.max(...ids.map(moveState)); }
function countAt(ids, min) { return ids.filter(id => moveState(id) >= min).length; }

// Each item: status 2 = met, 1 = partly, 0 = not yet.
function blueBeltChecklist(ctx) {
  const lvl = (v, full, part) => (v >= full ? 2 : v >= part ? 1 : 0);
  return [
    { group: 'Hard to pin', label: 'Escape bottom mount', status: lvl(bestState(['e1', 'e2']), 3, 2) },
    { group: 'Hard to pin', label: 'Escape bottom side control', status: lvl(bestState(['e3', 'e4']), 3, 2) },
    { group: 'Hard to pin', label: 'Escape the back', status: lvl(bestState(['e5', 'e6']), 3, 2) },
    { group: 'Hard to submit', label: 'Defend RNC, armbar, triangle, guillotine', status: lvl(countAt(['d1', 'd2', 'd3', 'd4'], 3), 3, 1) },
    { group: 'Hard to pass', label: 'Retain guard under pressure', status: lvl(bestState(['g16', 'o9', 'g9']), 3, 2) },
    { group: 'Guard', label: 'A sweep from closed guard', status: lvl(bestState(['g2', 'g3', 'g4']), 3, 2) },
    { group: 'Guard', label: 'Two attacks from closed guard', status: lvl(countAt(['g5', 'g6', 'g7', 'g8'], 3), 2, 1) },
    { group: 'Top game', label: 'Two passes that work', status: lvl(countAt(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'], 3), 2, 1) },
    { group: 'Top game', label: 'Hold mount and the back', status: lvl(Math.min(moveState('t1'), moveState('b3')), 3, 2) },
    { group: 'Top game', label: 'Finish 3+ standard submissions', status: lvl(countAt(['t2', 't3', 't4', 't5', 'b4', 'g5', 'g6', 'g7', 'l1'], 3), 3, 1) },
    { group: 'Standing', label: 'A takedown or safe guard pull', status: lvl(bestState(['st5', 'st7', 'st8', 'st14', 'st11']), 3, 2) },
    { group: 'Mat time', label: '150+ mat hours', status: lvl(ctx.hours, 150, 75) },
    { group: 'Mat time', label: 'Training 2+ times a week', status: lvl(ctx.perWeek12, 2, 1) },
    { group: 'Live', label: 'Competitive in rolls with peers', status: ctx.avgFeel == null ? 0 : lvl(ctx.avgFeel, 2.8, 2) },
    { group: 'Game plan', label: 'A go-to escape from mount, side and back', status: lvl(ctx.escapePlans, 3, 1) },
  ];
}

function calcReadiness() {
  const R = READINESS;
  const all = totals(state.sessions);
  const today = todayISO();

  // Mat time: hours carry most of it, live rounds the rest.
  const timeScore = Math.min(all.hours / R.hoursTarget, 1) * 0.75 + Math.min(all.rounds / R.roundsTarget, 1) * 0.25;

  // Skill: weighted domain coverage of the blue-belt core.
  const domains = domainScores();
  const skillScore = domains.reduce((a, d) => a + d.pct * d.weight, 0);

  // Live: how rolls have felt lately (needs at least 3 rated sessions).
  const rated = state.sessions.filter(s => s.feel).slice(0, 10);
  const avgFeel = rated.length ? rated.reduce((a, s) => a + s.feel, 0) / rated.length : null;
  const liveScore = rated.length >= 3 ? Math.min((avgFeel - 1) / 2, 1) : null;

  // Consistency: sessions over the last 12 weeks vs 2/week.
  const from12 = addDays(weekStart(today), -7 * (R.consistencyWeeks - 1));
  const recent = sessionsBetween(from12, addDays(today, 1)).length;
  const weeksElapsed = R.consistencyWeeks - 1 + (daysBetween(weekStart(today), today) + 1) / 7;
  const perWeek12 = recent / weeksElapsed;
  const consistencyScore = Math.min(perWeek12 / R.consistencyPerWeek, 1);

  const scores = { time: timeScore, skill: skillScore, live: liveScore, consistency: consistencyScore };
  let wSum = 0, total = 0;
  Object.entries(R.pillars).forEach(([k, p]) => {
    if (scores[k] == null) return;   // missing pillar: weight spreads over the rest
    wSum += p.weight; total += scores[k] * p.weight;
  });
  const pct = Math.round((total / wSum) * 100);
  const stage = [...R.stages].reverse().find(s => pct >= s.min);

  // Projection for the mat-time benchmark, which is the slowest pillar to move.
  const hoursLeft = Math.max(0, R.hoursTarget - all.hours);
  const last8from = addDays(weekStart(today), -7 * 7);
  const recentHoursPerWeek = totals(sessionsBetween(last8from, addDays(today, 1))).hours / (7 + (daysBetween(weekStart(today), today) + 1) / 7);
  const avgSessionHours = state.sessions.length ? totals(state.sessions.slice(0, 10)).hours / Math.min(10, state.sessions.length) : 1.25;
  const projectAt = perWeekHours => perWeekHours > 0 ? addDays(today, Math.ceil((hoursLeft / perWeekHours) * 7)) : null;
  const projection = {
    hoursLeft,
    recentHoursPerWeek,
    avgSessionHours,
    atRecent: projectAt(recentHoursPerWeek),
    atTarget: projectAt(state.goals.perWeek * avgSessionHours),
    atRamp: projectAt(Math.max(state.goals.rampTo || 3, state.goals.perWeek) * avgSessionHours),
  };

  const escapePlans = ['mount-bottom', 'side-bottom', 'back-bottom'].filter(id => (state.gameplan[id]?.moves || []).length).length;
  const checklist = blueBeltChecklist({ hours: all.hours, perWeek12, avgFeel, escapePlans });

  const monthsAtBelt = (Date.now() - state.beltStartedAt) / (1000 * 60 * 60 * 24 * 30.44);
  const unratedNew = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'g16'].filter(id => moveState(id) === 0).length;

  return {
    pct, stage,
    predictedStripes: stage.stripes,
    pillars: Object.entries(R.pillars).map(([k, p]) => ({ id: k, ...p, score: scores[k] })),
    domains, checklist, projection,
    hours: all.hours, rounds: all.rounds, sessions: all.count,
    perWeek12, avgFeel, ratedCount: rated.length, monthsAtBelt, unratedNew,
  };
}

/* ---------- milestones ---------- */
function milestones() {
  const t = totals(state.sessions);
  const val = { hours: t.hours, sessions: t.count, rounds: t.rounds, streak: bestWeekStreak() };
  const list = MILESTONES.map(m => ({ ...m, done: val[m.kind] >= m.n, value: val[m.kind] }));
  const next = list.filter(m => !m.done).sort((a, b) => (a.value / a.n > b.value / b.n ? -1 : 1))[0] || null;
  return { list, earned: list.filter(m => m.done), next };
}

/* ---------- next session plan ---------- */
function nextSessionPlan() {
  const plan = [];
  const recent = state.sessions.slice(0, 6);
  const tags = tagCounts(recent);
  const f = state.focus[0];
  if (f) plan.push({ kind: 'Hunt', text: f.theme, sub: 'Your #1 focus. Go for it in at least 3 rounds.' });
  if (tags.length) {
    const [tag, n] = tags[0];
    const drill = drillForTag(tag);
    plan.push({
      kind: 'Fix',
      text: drill ? drill.name : tagLabel(tag),
      sub: `${tagLabel(tag)} came up in ${n} of your last ${recent.length} sessions.` + (drill ? ' Ask a partner for 5 minutes on this.' : ''),
      moveId: drill?.id,
    });
  }
  const caught = tapSummary(state.taps.filter(t => daysBetween(t.date, todayISO()) <= 60)).caughtBy[0];
  if (caught && caught[1] >= 2) {
    const def = (COMMON_SUBS.find(c => c.id === caught[0]) || {}).defence;
    const mv = def && moveById(def);
    if (mv) plan.push({ kind: 'Defend', text: mv.name, sub: `${subLabel(caught[0])} got you ${caught[1]}× in the last 60 days.`, moveId: mv.id });
  }
  const fading = fadingMoves(1)[0];
  if (fading) plan.push({ kind: 'Revisit', text: fading.move.name, sub: `Rated "In rolls" or better, but not worked in ${fading.days} days.`, moveId: fading.move.id });
  if (!plan.length) plan.push({ kind: 'Start', text: 'Set a focus and log a few sessions', sub: 'Your plan builds itself from what you log.' });
  return plan.slice(0, 3);
}

/* ---------- home insights ---------- */
function insights() {
  const out = [];
  const today = todayISO();
  const last = state.sessions[0];
  if (last) {
    const gap = daysBetween(last.date, today);
    if (gap >= 8) out.push({ tone: 'warn', text: `${gap} days since your last session. One session this week restarts the streak.` });
  }
  const recent = state.sessions.slice(0, 6);
  const rt = tagCounts(recent)[0];
  if (rt && rt[1] >= 3) out.push({ tone: 'info', text: `<strong>${tagLabel(rt[0])}</strong> has come up in ${rt[1]} of your last ${recent.length} sessions. It's your clearest bottleneck.` });

  const injured = state.sessions.find(s => s.injury && daysBetween(s.date, today) <= 14);
  if (injured) out.push({ tone: 'warn', text: `You flagged <strong>${escapeHtml(injured.injury)}</strong> on ${formatDate(injured.date)}. Tell partners, and drill or flow-roll around it.` });

  const energy = state.sessions.slice(0, 3).filter(s => s.mood);
  if (energy.length === 3 && energy.every(s => s.mood <= 2)) out.push({ tone: 'warn', text: 'Low energy three sessions running. Look at sleep, food and total load before adding volume.' });

  const feelNow = state.sessions.slice(0, 5).filter(s => s.feel);
  const feelThen = state.sessions.slice(5, 15).filter(s => s.feel);
  if (feelNow.length >= 3 && feelThen.length >= 3) {
    const a = feelNow.reduce((x, s) => x + s.feel, 0) / feelNow.length;
    const b = feelThen.reduce((x, s) => x + s.feel, 0) / feelThen.length;
    if (a - b >= 0.5) out.push({ tone: 'good', text: 'Your rolls are going noticeably better than a month ago. The work is landing.' });
  }
  state.focus.forEach(f => {
    const st = focusStats(f);
    const age = (Date.now() - f.createdAt) / 86400000;
    if (age > 14 && st.tried === 0) out.push({ tone: 'info', text: `No attempts logged on "<strong>${escapeHtml(f.theme)}</strong>" yet. Try it in your next session's rounds.` });
  });
  return out.slice(0, 3);
}

/* =========================================================
   REVIEW (weekly / monthly, compared with the previous period)
   ========================================================= */
function periodBounds(mode, anchorIso) {
  if (mode === 'month') {
    const from = monthStart(anchorIso);
    return { from, to: addMonths(from, 1), prevFrom: addMonths(from, -1) };
  }
  const from = weekStart(anchorIso);
  return { from, to: addDays(from, 7), prevFrom: addDays(from, -7) };
}

function periodKey(mode, from) { return `${mode}:${from}`; }

function buildReview(mode, anchorIso) {
  const b = periodBounds(mode, anchorIso);
  const sessions = sessionsBetween(b.from, b.to);
  const prevSessions = sessionsBetween(b.prevFrom, b.from);
  const cur = totals(sessions);
  const prev = totals(prevSessions);
  const taps = tapSummary(tapsBetween(b.from, b.to));
  const tags = tagCounts(sessions);
  const prevTags = Object.fromEntries(tagCounts(prevSessions));
  const weeksInPeriod = mode === 'month' ? daysBetween(b.from, b.to) / 7 : 1;
  const targetSessions = Math.round(state.goals.perWeek * weeksInPeriod);

  const movesWorked = {};
  sessions.forEach(s => (s.moves || []).forEach(id => { movesWorked[id] = (movesWorked[id] || 0) + 1; }));
  const focus = state.focus.map(f => {
    let tried = 0, worked = 0;
    sessions.forEach(s => { const v = s.focus?.[f.id]; if (v >= 1) tried++; if (v >= 2) worked++; });
    return { f, tried, worked };
  });
  const injuries = sessions.filter(s => s.injury).map(s => ({ date: s.date, what: s.injury }));
  const notes = sessions.filter(s => s.notes).map(s => ({ date: s.date, text: s.notes }));

  // headline
  let headline;
  if (!cur.count) headline = mode === 'week' ? 'No sessions this week.' : 'No sessions this month.';
  else {
    const vs = prev.count ? (cur.count > prev.count ? 'up from' : cur.count < prev.count ? 'down from' : 'level with') + ` ${prev.count}` : 'nothing the period before';
    headline = `${cur.count} session${cur.count === 1 ? '' : 's'}, ${cur.hours.toFixed(1)} hours, ${cur.rounds} rounds. ${capitalize(vs)}.`;
  }

  // what changed
  const changes = [];
  if (cur.count >= targetSessions && cur.count) changes.push({ tone: 'good', text: `Hit your target of ${targetSessions} session${targetSessions === 1 ? '' : 's'}.` });
  else if (b.to <= todayISO() || mode === 'month') changes.push({ tone: 'warn', text: `${cur.count} of ${targetSessions} target sessions.` });
  else changes.push({ tone: 'info', text: `${cur.count} of ${targetSessions} so far, ${Math.max(0, targetSessions - cur.count)} to go.` });
  if (cur.avgFeel && prev.avgFeel) {
    const d = cur.avgFeel - prev.avgFeel;
    if (Math.abs(d) >= 0.4) changes.push({ tone: d > 0 ? 'good' : 'warn', text: `Rolls felt ${d > 0 ? 'better' : 'harder'} than the period before (${feelWord(cur.avgFeel)} vs ${feelWord(prev.avgFeel)}).` });
  }
  tags.slice(0, 2).forEach(([t, n]) => {
    const p = prevTags[t] || 0;
    changes.push({ tone: 'info', text: `<strong>${tagLabel(t)}</strong> flagged ${n}×` + (p ? ` (${p}× the period before)` : ' (new this period)') + '.' });
  });
  Object.entries(prevTags).forEach(([t, p]) => {
    if (p >= 2 && !tags.find(([x]) => x === t)) changes.push({ tone: 'good', text: `<strong>${tagLabel(t)}</strong> didn't come up, after ${p}× the period before.` });
  });
  if (taps.caughtBy[0] && taps.caughtBy[0][1] >= 2) changes.push({ tone: 'warn', text: `Caught by <strong>${subLabel(taps.caughtBy[0][0])}</strong> ${taps.caughtBy[0][1]}×.` });
  if (taps.caught[0] && taps.caught[0][1] >= 2) changes.push({ tone: 'good', text: `Your <strong>${subLabel(taps.caught[0][0])}</strong> landed ${taps.caught[0][1]}×. That's becoming a weapon.` });
  if (cur.avgEnergy && cur.avgEnergy < 2.5) changes.push({ tone: 'warn', text: `Energy averaged ${cur.avgEnergy.toFixed(1)}/5. Recovery is the limiter.` });

  // plan for the next period
  const plan = [];
  const nextTarget = state.goals.perWeek;
  plan.push(`Train ${nextTarget}× next week${cur.count && cur.count < targetSessions ? '. Book the sessions in now' : ''}.`);
  const topTag = tags[0] || tagCounts(state.sessions.slice(0, 6))[0];
  if (topTag) {
    const drill = drillForTag(topTag[0]);
    plan.push(`Fix <strong>${tagLabel(topTag[0])}</strong>${drill ? `: drill ${escapeHtml(drill.name)}` : ''}, then start one round from that position.`);
  }
  if (taps.caughtBy[0]) {
    const def = moveById((COMMON_SUBS.find(c => c.id === taps.caughtBy[0][0]) || {}).defence || '');
    if (def) plan.push(`Defence: ${escapeHtml(def.name)}.`);
  }
  const f0 = focus.find(x => x.tried === 0) || focus[0];
  if (f0) plan.push(`Focus: try "${escapeHtml(f0.f.theme)}" in at least 3 rounds.`);

  return {
    mode, ...b, key: periodKey(mode, b.from),
    sessions, cur, prev, taps, tags, prevTags, targetSessions,
    movesWorked: Object.entries(movesWorked).sort((a, c) => c[1] - a[1]),
    focus, injuries, notes, headline, changes, plan,
  };
}

function feelWord(v) {
  if (v == null) return 'not rated';
  return FEEL[Math.min(4, Math.max(1, Math.round(v)))].label.toLowerCase();
}

/* ---------- text utils (shared) ---------- */
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function formatDate(d, opts) {
  const dt = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(fromISODate(d)) : new Date(d);
  return dt.toLocaleDateString('en-GB', opts || { weekday: 'short', day: 'numeric', month: 'short' });
}
function formatShort(d) { return formatDate(d, { day: 'numeric', month: 'short' }); }
function formatMonthYear(d) { return formatDate(d, { month: 'long', year: 'numeric' }); }

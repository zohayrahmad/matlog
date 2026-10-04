import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp } from './harness.mjs';

const NOW = new Date(2026, 9, 4, 18).getTime();   // Sun 4 Oct 2026, 6pm

// A v1-era save: free-text stuck/fix, no schemaVersion, seed-style ids.
const v1 = {
  startedAt: new Date(2025, 8, 10).getTime(),
  beltStartedAt: new Date(2025, 8, 10).getTime(),
  belt: 'white', stripes: 0,
  moves: { e2: { state: 4, notes: '' }, t1: { state: 3, notes: '' } },
  customMoves: [{ id: 'cm_1', cat: 'Escapes', name: 'Turtle Defence' }, { id: 'cm_2', cat: 'Open Guard (no-gi)', name: 'Shin-on-Shin Guard' }],
  sessions: [
    { id: 'ses_2', date: '2026-09-30', minutes: 90, spars: 4, sparMins: 5, taught: 'ankle locks', drilled: '', stuck: 'protecting my guard on bottom, finishing subs', fix: 'stand up still', mood: 4, notes: '' },
    { id: 'ses_1', date: '2026-06-07', minutes: 60, spars: 3, sparMins: 10, taught: 'Super Sunday Open Mat', drilled: '', stuck: 'Back taken', fix: '', mood: 3, notes: 'Rib injury affected session' },
    { id: 'seed_0', date: '2026-05-01', minutes: 50, spars: 3, sparMins: 5, taught: '', drilled: '', stuck: '', fix: '', mood: 0, notes: '' },
  ],
  taps: [{ id: 'tap_1', dir: 'in', sub: 'Rear naked', pos: 'Back', opp: 'x', ts: new Date(2026, 5, 7).getTime() }],
  focus: [{ id: 'f_1', theme: 'Guard passing', success: '', attempts: 9, createdAt: 1 }],
  reviews: [],
  filter: 'all',
};

const boot = (data = v1) => loadApp({ matlog_v1: JSON.stringify(data) }, NOW);

test('migration keeps every record and original text', () => {
  const app = boot();
  const s = app.run('state');
  assert.equal(s.schemaVersion, 4);
  assert.deepEqual(s.sessions.map(x => x.id), ['ses_2', 'ses_1', 'seed_0']);
  assert.equal(s.taps.length, 1);
  assert.equal(s.customMoves.length, 2);
  assert.equal(s.moves.e2.state, 4);
  assert.equal(s.sessions[0].legacy.stuck, 'protecting my guard on bottom, finishing subs');
  assert.equal(s.sessions[0].legacy.fix, 'stand up still');
  assert.ok(app.store.matlog_v1_pre_v4, 'pre-upgrade copy saved');
});

test('legacy stuck/fix text becomes structured tags', () => {
  const s = boot().run('state');
  assert.deepEqual(s.sessions[0].workOn.sort(), ['finishing', 'guard-retention', 'standup']);
  assert.deepEqual(s.sessions[1].workOn, ['back-defence']);
  assert.equal(s.sessions[1].type, 'open');
  assert.equal(s.sessions[1].injury, 'Rib');
  assert.equal(s.sessions[0].workOnNote, 'protecting my guard on bottom, finishing subs → stand up still');
});

test('migration is idempotent', () => {
  const app = boot();
  const once = app.run('JSON.stringify(state)');
  const twice = app.run('JSON.stringify(migrate(JSON.parse(JSON.stringify(state))))');
  assert.equal(once, twice);
});

test('unreadable storage is parked, not overwritten', () => {
  const app = loadApp({ matlog_v1: '{not json' }, NOW);
  assert.equal(app.run('state.sessions.length'), 0);
  assert.ok(Object.keys(app.store).some(k => k.startsWith('matlog_v1_unreadable_')));
});

test('fresh install has no sample sessions', () => {
  assert.equal(loadApp({}, NOW).run('state.sessions.length'), 0);
});

test('submission names normalise', () => {
  const app = boot();
  const n = x => app.run(`normalizeSub(${JSON.stringify(x)})`);
  assert.equal(n('Rear Naked'), 'rnc');
  assert.equal(n('RNC'), 'rnc');
  assert.equal(n('arm triangle'), 'armtri');
  assert.equal(n('Triangle'), 'triangle');
  assert.equal(n('Straight Ankle Lock'), 'ankle');
  assert.equal(n('Arm bar'), 'armbar');
  assert.equal(n('inside heel hook'), 'heelhook');
  assert.equal(n('something odd'), 'other');
});

test('readiness stays in range and responds to inputs', () => {
  const app = boot();
  const r0 = app.run('calcReadiness()');
  assert.ok(r0.pct >= 0 && r0.pct <= 100);
  assert.equal(r0.pillars.find(p => p.id === 'live').score, null, 'no feel ratings -> live pillar excluded');
  // rating every core move "reliable" should move skill to 100%
  app.run(`READINESS.domains.forEach(d => d.moves.forEach(id => state.moves[id].state = 4))`);
  const r1 = app.run('calcReadiness()');
  assert.equal(Math.round(r1.pillars.find(p => p.id === 'skill').score * 100), 100);
  assert.ok(r1.pct > r0.pct);
});

test('week streak counts completed weeks and ignores the unfinished one', () => {
  const app = boot({ ...v1, sessions: [
    { id: 'a', date: '2026-09-29', minutes: 60 },                                   // this week: 1 (not met yet)
    { id: 'b', date: '2026-09-22', minutes: 60 }, { id: 'c', date: '2026-09-24', minutes: 60 }, // met
    { id: 'd', date: '2026-09-15', minutes: 60 }, { id: 'e', date: '2026-09-17', minutes: 60 }, // met
    { id: 'f', date: '2026-09-08', minutes: 60 },                                   // not met
  ] });
  assert.equal(app.run('weekStreak()'), 2);
  assert.equal(app.run('currentWeek().count'), 1);
});

test('weeks run Monday to Sunday in local time', () => {
  const app = boot();
  assert.equal(app.run("weekStart('2026-10-04')"), '2026-09-28');
  assert.equal(app.run("weekStart('2026-09-28')"), '2026-09-28');
  assert.equal(app.run("addMonths('2026-01-31', 1)"), '2026-02-01');
});

test('monthly review compares with the previous month', () => {
  const app = boot();
  const r = app.run("buildReview('month', '2026-06-15')");
  assert.equal(r.cur.count, 1);
  assert.equal(r.prev.count, 1);
  assert.ok(r.plan.length >= 2);
  assert.equal(r.taps.caughtBy[0][0], 'rnc');
});

test('no gi anywhere: field dropped, categories renamed', () => {
  const app = boot({ ...v1, sessions: [{ ...v1.sessions[0], gi: 'gi' }] });
  const s = app.run('state');
  assert.equal('gi' in s.sessions[0], false);
  assert.equal(s.customMoves.find(m => m.id === 'cm_2').cat, 'Open guard');
  const src = app.run('JSON.stringify([CURRICULUM, CATEGORIES, WORK_TAGS, SESSION_TYPES, READINESS.domains])');
  assert.doesNotMatch(src, /\bgi\b|no-gi|nogi/i);
});

test('voice/text summary fills the form', () => {
  const app = boot();
  const { patch } = app.run(`parseSessionText("90 minute class, five rounds of 6 minute rounds. We drilled knee cut passing. Got smashed, caught by a heel hook twice, I caught someone with a triangle. Struggled with guard retention and got gassed. Knee is a bit sore.")`);
  assert.equal(patch.minutes, 90);
  assert.equal(patch.spars, 5);
  assert.equal(patch.sparMins, 6);
  assert.equal(patch.feel, 1);
  assert.deepEqual(patch.tapsIn, { heelhook: 2 });
  assert.deepEqual(patch.tapsOut, { triangle: 1 });
  assert.ok(patch.workOn.includes('guard-retention'));
  assert.ok(patch.moves.includes('p1'));
  assert.equal(patch.injury, 'Knee');
  const p2 = app.run(`parseSessionText("open mat, an hour and a half, 8 rolls, felt competitive").patch`);
  assert.equal(p2.type, 'open');
  assert.equal(p2.minutes, 90);
  assert.equal(p2.spars, 8);
  assert.equal(p2.feel, 3);
});

test('rolls by level score against blue-belt benchmarks', () => {
  const app = boot({ ...v1, sessions: [
    { id: 'r1', date: '2026-10-01', minutes: 60, rolls: { peer: { win: 2, even: 2 }, newer: { win: 3 }, higher: { even: 1, loss: 2 } } },
  ] });
  const r = app.run("rollStats(state.sessions)");
  assert.equal(r.peer.n, 4);
  assert.equal(r.peer.score, 0.75);            // 2 wins + half of 2 evens
  assert.equal(r.higher.score, 1 / 3);         // even vs higher counts as success
  const live = app.run('calcReadiness().pillars.find(p => p.id === "live").score');
  assert.ok(live > 0.9, 'live pillar uses roll results');
  const chk = app.run('calcReadiness().checklist.find(c => c.label === "Competitive with peers")');
  assert.equal(chk.status, 2);
});

test('positional rounds override self-rating once there are 5+ reps', () => {
  const sessions = [{ id: 'p1', date: '2026-10-01', minutes: 60, positional: [
    { pos: 'mount-bottom', result: 'loss' }, { pos: 'mount-bottom', result: 'loss' }, { pos: 'mount-bottom', result: 'loss' },
    { pos: 'mount-bottom', result: 'loss' }, { pos: 'mount-bottom', result: 'loss' },
  ] }];
  const app = boot({ ...v1, sessions });   // e2 self-rated "reliable"
  const item = app.run('calcReadiness().checklist.find(c => c.label === "Escape bottom mount")');
  assert.equal(item.status, 0, 'failing every escape beats a "reliable" self-rating');
  const esc = app.run('domainScores().find(d => d.id === "escapes")');
  assert.ok(esc.evidence && esc.pct < esc.selfPct);
});

test('drill queue is built from weak spots and logs practice', () => {
  const app = boot();
  const partner = app.run("drillQueue('partner')");
  assert.ok(partner.length >= 3 && partner.length <= 5);
  assert.ok(partner.some(d => d.name.startsWith('Positional')));
  const solo = app.run("drillQueue('solo')");
  assert.ok(solo.every(d => d.secs > 0));
  app.run(`state.drillLog.push({ date: '2026-10-04', moves: ['e5'] })`);
  assert.equal(app.run('movePractice().e5.last'), '2026-10-04');
});

test('competition phases count down to the date', () => {
  const app = boot({ ...v1, comps: [{ id: 'c1', name: 'Open', date: '2026-10-20', matches: [{ result: 'win', method: 'sub', sub: 'rnc' }, { result: 'loss', method: 'points' }] }] });
  const ph = app.run("compPhase(upcomingComp())");
  assert.equal(ph.days, 16);
  assert.equal(ph.phase.label, 'Simulate');
  assert.deepEqual(app.run('compRecord()'), { win: 1, loss: 1, subs: 1, comps: 1 });
});

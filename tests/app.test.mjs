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
  customMoves: [{ id: 'cm_1', cat: 'Escapes', name: 'Turtle Defence' }],
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
  assert.equal(s.schemaVersion, 3);
  assert.deepEqual(s.sessions.map(x => x.id), ['ses_2', 'ses_1', 'seed_0']);
  assert.equal(s.taps.length, 1);
  assert.equal(s.customMoves.length, 1);
  assert.equal(s.moves.e2.state, 4);
  assert.equal(s.sessions[0].legacy.stuck, 'protecting my guard on bottom, finishing subs');
  assert.equal(s.sessions[0].legacy.fix, 'stand up still');
  assert.ok(app.store.matlog_v1_pre_v3, 'pre-upgrade copy saved');
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

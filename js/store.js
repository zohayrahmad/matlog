/* =========================================================
   Mat Log: storage, migration and date helpers
   ========================================================= */

const STORAGE_KEY = 'matlog_v1';     // never change: existing installs load from here
const SCHEMA_VERSION = 4;

/* ---------- dates (always local time, never UTC) ---------- */
function toISODate(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function todayISO() { return toISODate(Date.now()); }
function fromISODate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}
function addDays(iso, n) {
  const d = new Date(fromISODate(iso));
  d.setDate(d.getDate() + n);
  return toISODate(d.getTime());
}
function daysBetween(aIso, bIso) {
  return Math.round((fromISODate(bIso) - fromISODate(aIso)) / 86400000);
}
// Training weeks run Monday to Sunday.
function weekStart(iso) {
  const d = new Date(fromISODate(iso));
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return toISODate(d.getTime());
}
function monthStart(iso) { return iso.slice(0, 7) + '-01'; }
function addMonths(iso, n) {
  const d = new Date(fromISODate(iso));
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return toISODate(d.getTime());
}

/* ---------- state ---------- */
function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    startedAt: Date.now(),
    beltStartedAt: Date.now(),
    belt: 'white',
    stripes: 0,
    promotions: [],
    moves: CURRICULUM.reduce((acc, m) => { acc[m.id] = { state: 0, notes: '' }; return acc; }, {}),
    customMoves: [],
    sessions: [],
    taps: [],
    focus: [],
    focusArchive: [],
    gameplan: {},
    reviews: {},
    comps: [],
    drillLog: [],
    profile: { name: '', gym: '' },
    goals: { perWeek: 2, rampTo: 3, rampDismissedAt: null },
    settings: { theme: 'auto' },
    seen: { newMovesV3: false },
    filter: 'all',
    lastBackupAt: null,
  };
}

/* Old free-text "stuck"/"fix" answers -> structured tags, so history feeds the
   new review and readiness straight away. Original text is kept in s.legacy. */
const LEGACY_TAG_RULES = [
  ['standup',         /stand ?up|takedown|wrestl|arm ?drag|foot ?swe|arm fighting|single leg|double leg/i],
  ['guard-retention', /got passed|retention|protecting my guard|guard.*passed/i],
  ['passing',         /passing|to pass\b|pass guard|toreando/i],
  ['back-defence',    /back (taken|takes)|back control/i],
  ['mount-bottom',    /(bottom|under).{0,12}(mount|mound)|mount pressure/i],
  ['side-bottom',     /side control|north south|bottom side/i],
  ['half-guard',      /half guard|\bhg\b/i],
  ['closed-guard',    /\bcg\b|closed guard/i],
  ['open-guard',      /\bog\b|open guard/i],
  ['finishing',       /finish/i],
  ['sub-defence',     /arm ?bars?|guill?y|guillotine|subs from|kimura/i],
  ['top-control',     /(or|from|in) top mount|top pressure/i],
  ['leg-locks',       /heel hook|leg ?lock/i],
];

function inferWorkTags(text) {
  return LEGACY_TAG_RULES.filter(([, re]) => re.test(text)).map(([id]) => id);
}

function inferLegacySession(s) {
  if (s.legacy) return;   // already converted
  s.legacy = { taught: s.taught || '', drilled: s.drilled || '', stuck: s.stuck || '', fix: s.fix || '' };

  const problemText = `${s.stuck || ''} ${s.fix || ''}`;
  const tags = inferWorkTags(problemText);
  if (/cardio|fatigue|gassed|energy\/fatigue|passed out/i.test(`${problemText} ${s.notes || ''}`)) tags.push('cardio');
  s.workOn = [...new Set(tags)];
  s.workOnNote = [s.stuck, s.fix].filter(Boolean).join(' → ');

  s.covered = [s.taught, s.drilled].filter(Boolean).join(' · ');
  const all = `${s.taught || ''} ${s.notes || ''}`;
  s.type = /open mat/i.test(all) ? 'open' : 'class';
  const injury = (s.notes || '').match(/(\w+)\s+injury/i);
  s.injury = injury ? injury[1] : '';
}

// Bring any older save (or imported backup) up to the current shape.
// Only adds or derives fields; never drops existing data.
function migrate(d) {
  const base = defaultState();
  if (!d.moves) d.moves = {};
  CURRICULUM.forEach(m => {
    if (!d.moves[m.id]) d.moves[m.id] = { state: 0, notes: '' };
  });
  ['sessions', 'taps', 'focus', 'focusArchive', 'customMoves', 'promotions', 'comps', 'drillLog'].forEach(k => {
    if (!Array.isArray(d[k])) d[k] = [];
  });
  if (Array.isArray(d.reviews) || !d.reviews) d.reviews = {};
  if (!d.gameplan || typeof d.gameplan !== 'object') d.gameplan = {};
  d.goals = Object.assign({}, base.goals, d.goals || {});
  d.profile = Object.assign({}, base.profile, d.profile || {});
  d.customMoves.forEach(m => { if (CATEGORY_RENAMES[m.cat]) m.cat = CATEGORY_RENAMES[m.cat]; });
  if (CATEGORY_RENAMES[d.filter]) d.filter = CATEGORY_RENAMES[d.filter];
  d.settings = Object.assign({}, base.settings, d.settings || {});
  d.seen = Object.assign({}, base.seen, d.seen || {});
  if (!d.startedAt) d.startedAt = base.startedAt;
  if (!d.beltStartedAt) d.beltStartedAt = d.startedAt;
  if (!d.belt) d.belt = 'white';
  if (typeof d.stripes !== 'number') d.stripes = 0;
  if (!d.filter) d.filter = 'all';
  if (d.lastBackupAt === undefined) d.lastBackupAt = null;

  const before = d.schemaVersion || 1;
  d.sessions.forEach(s => {
    if (before < 3) inferLegacySession(s);
    if (!Array.isArray(s.workOn)) s.workOn = [];
    if (!Array.isArray(s.moves)) s.moves = [];
    if (!s.focus || typeof s.focus !== 'object') s.focus = {};
    if (!s.type) s.type = 'class';
    delete s.gi;   // no-gi only
    if (!s.rolls || typeof s.rolls !== 'object') s.rolls = {};
    if (!Array.isArray(s.partners)) s.partners = [];
    if (!Array.isArray(s.positional)) s.positional = [];
    if (s.covered === undefined) s.covered = s.taught || '';
    if (s.workOnNote === undefined) s.workOnNote = '';
    if (!s.feel) s.feel = 0;
    if (!s.mood) s.mood = 0;
    if (!s.spars) s.spars = 0;
    if (!s.sparMins) s.sparMins = 0;
    if (s.injury === undefined) s.injury = '';
  });
  // legacy taps: give each a date so they can be placed in a week
  d.taps.forEach(t => {
    if (!t.date) t.date = toISODate(t.ts || Date.now());
  });
  d.focus.forEach(f => {
    if (typeof f.attempts !== 'number') f.attempts = 0;
    if (!f.createdAt) f.createdAt = Date.now();
  });
  if (before < 3) d.seen.newMovesV3 = false;
  d.comps.forEach(c => {
    if (!Array.isArray(c.matches)) c.matches = [];
    if (!Array.isArray(c.weighIns)) c.weighIns = [];
    if (!c.done || typeof c.done !== 'object') c.done = {};
  });

  d.schemaVersion = SCHEMA_VERSION;
  sortSessions(d);
  return d;
}

function sortSessions(d) {
  d.sessions.sort((x, y) => (y.date || '').localeCompare(x.date || '') || String(y.id).localeCompare(String(x.id)));
}

function loadState() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const wasVersion = parsed.schemaVersion || 1;
    // one-time safety copy before upgrading the data format
    if (wasVersion < SCHEMA_VERSION) {
      try { localStorage.setItem(`${STORAGE_KEY}_pre_v${SCHEMA_VERSION}`, raw); } catch (_) {}
    }
    return migrate(parsed);
  } catch (e) {
    // Never silently throw away unreadable data; park it so it can be recovered.
    try { if (raw) localStorage.setItem(STORAGE_KEY + '_unreadable_' + Date.now(), raw); } catch (_) {}
    return defaultState();
  }
}

let state = loadState();


function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    if (typeof toast === 'function') toast('Could not save: storage full or blocked');
    return false;
  }
}

/* ---------- small lookups ---------- */
function getAllMoves() { return [...CURRICULUM, ...state.customMoves]; }
function moveById(id) { return getAllMoves().find(m => m.id === id); }
function moveState(id) { return state.moves[id]?.state ?? 0; }
function beltInfo(id = state.belt) { return BELTS.find(b => b.id === id) || BELTS[0]; }
function nextBelt() { return BELTS[BELTS.findIndex(b => b.id === state.belt) + 1] || null; }

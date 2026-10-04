/* =========================================================
   Mat Log: static data
   Curriculum, belts, tags and the blue-belt readiness model.
   Move ids are permanent: saved data refers to them.
   ========================================================= */

const CURRICULUM = [
  // FUNDAMENTALS
  { id: 'f1', cat: 'Fundamentals', name: 'Shrimp / hip escape' },
  { id: 'f2', cat: 'Fundamentals', name: 'Bridge & roll (upa)' },
  { id: 'f3', cat: 'Fundamentals', name: 'Technical stand-up' },
  { id: 'f4', cat: 'Fundamentals', name: 'Forward & backward break-falls' },
  { id: 'f5', cat: 'Fundamentals', name: 'Granby roll' },
  { id: 'f6', cat: 'Fundamentals', name: 'Frame & post (basics)' },

  // ESCAPES
  { id: 'e1', cat: 'Escapes', name: 'Mount escape (upa)' },
  { id: 'e2', cat: 'Escapes', name: 'Mount escape (elbow-knee)' },
  { id: 'e3', cat: 'Escapes', name: 'Side control escape (underhook to knees)' },
  { id: 'e4', cat: 'Escapes', name: 'Side control escape (frame & shrimp)' },
  { id: 'e5', cat: 'Escapes', name: 'Back escape (scoop & pin hand)' },
  { id: 'e6', cat: 'Escapes', name: 'Back escape (chair sit)' },
  { id: 'e7', cat: 'Escapes', name: 'Knee on belly escape' },
  { id: 'e8', cat: 'Escapes', name: 'North-south escape' },
  { id: 'e9', cat: 'Escapes', name: 'Headlock escape' },

  // SUBMISSION DEFENCE (added v3: "hard to submit" is a core blue-belt standard)
  { id: 'd1', cat: 'Submission defence', name: 'RNC defence (hand fight, chin & shoulder)' },
  { id: 'd2', cat: 'Submission defence', name: 'Armbar defence (stack / hitchhiker)' },
  { id: 'd3', cat: 'Submission defence', name: 'Triangle defence (posture & elbow in)' },
  { id: 'd4', cat: 'Submission defence', name: 'Guillotine defence' },
  { id: 'd5', cat: 'Submission defence', name: 'Kimura / Americana defence' },
  { id: 'd6', cat: 'Submission defence', name: 'Arm-triangle / darce defence' },

  // GUARD
  { id: 'g1', cat: 'Guard (closed/half/butterfly)', name: 'Closed guard posture-up & break' },
  { id: 'g2', cat: 'Guard (closed/half/butterfly)', name: 'Closed guard hip bump sweep' },
  { id: 'g3', cat: 'Guard (closed/half/butterfly)', name: 'Closed guard scissor sweep' },
  { id: 'g4', cat: 'Guard (closed/half/butterfly)', name: 'Closed guard pendulum sweep' },
  { id: 'g5', cat: 'Guard (closed/half/butterfly)', name: 'Closed guard arm bar' },
  { id: 'g6', cat: 'Guard (closed/half/butterfly)', name: 'Closed guard triangle' },
  { id: 'g7', cat: 'Guard (closed/half/butterfly)', name: 'Closed guard kimura' },
  { id: 'g8', cat: 'Guard (closed/half/butterfly)', name: 'Closed guard guillotine' },
  { id: 'g9', cat: 'Guard (closed/half/butterfly)', name: 'Half guard knee shield (frame & block)' },
  { id: 'g10', cat: 'Guard (closed/half/butterfly)', name: 'Half guard underhook recovery' },
  { id: 'g11', cat: 'Guard (closed/half/butterfly)', name: 'Half guard old-school sweep' },
  { id: 'g12', cat: 'Guard (closed/half/butterfly)', name: 'Half guard dogfight to back' },
  { id: 'g13', cat: 'Guard (closed/half/butterfly)', name: 'Butterfly guard hook sweep' },
  { id: 'g14', cat: 'Guard (closed/half/butterfly)', name: 'Butterfly to single leg X' },
  { id: 'g15', cat: 'Guard (closed/half/butterfly)', name: 'Butterfly to back take' },
  { id: 'g16', cat: 'Guard (closed/half/butterfly)', name: 'Guard retention: frames, hip escape & re-guard' },

  // OPEN GUARD
  { id: 'o1', cat: 'Open Guard (no-gi)', name: 'Single leg X (SLX) entry' },
  { id: 'o2', cat: 'Open Guard (no-gi)', name: 'Single leg X technical stand-up sweep' },
  { id: 'o3', cat: 'Open Guard (no-gi)', name: 'X-guard from butterfly' },
  { id: 'o4', cat: 'Open Guard (no-gi)', name: 'X-guard sweep' },
  { id: 'o5', cat: 'Open Guard (no-gi)', name: 'De la Riva (no-gi grips)' },
  { id: 'o6', cat: 'Open Guard (no-gi)', name: 'Reverse de la Riva' },
  { id: 'o7', cat: 'Open Guard (no-gi)', name: '50/50 entries' },
  { id: 'o8', cat: 'Open Guard (no-gi)', name: 'Z guard / quarter guard' },
  { id: 'o9', cat: 'Open Guard (no-gi)', name: 'Sit-up guard / scissor recovery' },

  // PASSING
  { id: 'p1', cat: 'Passing', name: 'Knee cut pass' },
  { id: 'p2', cat: 'Passing', name: 'Toreando (bullfighter) pass' },
  { id: 'p3', cat: 'Passing', name: 'Stack pass' },
  { id: 'p4', cat: 'Passing', name: 'Long step / leg drag' },
  { id: 'p5', cat: 'Passing', name: 'Folding pass' },
  { id: 'p6', cat: 'Passing', name: 'Over-under pass' },
  { id: 'p7', cat: 'Passing', name: 'Smash pass from half' },
  { id: 'p8', cat: 'Passing', name: 'Body lock pass' },

  // TOP CONTROL & SUBS
  { id: 't1', cat: 'Top control & submissions', name: 'Mount maintenance (high mount)' },
  { id: 't2', cat: 'Top control & submissions', name: 'Mount arm bar' },
  { id: 't3', cat: 'Top control & submissions', name: 'Mount cross choke (no-gi: arm triangle / Ezekiel)' },
  { id: 't4', cat: 'Top control & submissions', name: 'Side control: Americana' },
  { id: 't5', cat: 'Top control & submissions', name: 'Side control: kimura' },
  { id: 't6', cat: 'Top control & submissions', name: 'Side control: arm triangle' },
  { id: 't7', cat: 'Top control & submissions', name: 'North-south choke' },
  { id: 't8', cat: 'Top control & submissions', name: 'Knee on belly transitions' },

  // BACK CONTROL
  { id: 'b1', cat: 'Back control', name: 'Back take from turtle' },
  { id: 'b2', cat: 'Back control', name: 'Back take from mount' },
  { id: 'b3', cat: 'Back control', name: 'Back maintenance (seat belt + hooks)' },
  { id: 'b4', cat: 'Back control', name: 'Rear naked choke (RNC)' },
  { id: 'b5', cat: 'Back control', name: 'Body triangle' },
  { id: 'b6', cat: 'Back control', name: 'Strangle from body triangle' },

  // LEG LOCKS
  { id: 'l1', cat: 'Leg locks', name: 'Straight ankle lock (Achilles)' },
  { id: 'l2', cat: 'Leg locks', name: 'Ashi garami (basic)' },
  { id: 'l3', cat: 'Leg locks', name: 'Single leg X to ankle' },
  { id: 'l4', cat: 'Leg locks', name: 'Inside Sankaku / 411 / honey hole entry' },
  { id: 'l5', cat: 'Leg locks', name: 'Heel hook (inside / outside)' },
  { id: 'l6', cat: 'Leg locks', name: 'Toe hold' },
  { id: 'l7', cat: 'Leg locks', name: 'Knee bar' },
  { id: 'l8', cat: 'Leg locks', name: 'Leg lock defence: boot & hide' },

  // STANDUP & WRESTLING
  { id: 'st1', cat: 'Standup & wrestling', name: 'Stance & level changes' },
  { id: 'st2', cat: 'Standup & wrestling', name: 'Collar tie / hand fight' },
  { id: 'st3', cat: 'Standup & wrestling', name: 'Snap down to front headlock' },
  { id: 'st4', cat: 'Standup & wrestling', name: 'Front headlock to go-behind' },
  { id: 'st5', cat: 'Standup & wrestling', name: 'Single leg (high crotch)' },
  { id: 'st6', cat: 'Standup & wrestling', name: 'Single leg finishes (run the pipe, hi-c)' },
  { id: 'st7', cat: 'Standup & wrestling', name: 'Double leg' },
  { id: 'st8', cat: 'Standup & wrestling', name: 'Body lock takedown' },
  { id: 'st9', cat: 'Standup & wrestling', name: 'Inside trip' },
  { id: 'st10', cat: 'Standup & wrestling', name: 'Outside trip / kosoto' },
  { id: 'st11', cat: 'Standup & wrestling', name: 'Arm drag to back' },
  { id: 'st12', cat: 'Standup & wrestling', name: 'Sprawl & defend takedowns' },
  { id: 'st13', cat: 'Standup & wrestling', name: 'Pummel to underhook' },
  { id: 'st14', cat: 'Standup & wrestling', name: 'Guard pull (only if you must)' },

  // CONCEPTS
  { id: 'c1', cat: 'Concepts', name: 'Frames vs blocks' },
  { id: 'c2', cat: 'Concepts', name: 'Underhooks as currency' },
  { id: 'c3', cat: 'Concepts', name: 'Head position & posture' },
  { id: 'c4', cat: 'Concepts', name: 'Hip-to-hip connection (top)' },
  { id: 'c5', cat: 'Concepts', name: 'Threat-and-counter (chains)' },
  { id: 'c6', cat: 'Concepts', name: 'Escape priority: hips before shoulders' },
  { id: 'c7', cat: 'Concepts', name: 'Hand fighting on the ground' },
  { id: 'c8', cat: 'Concepts', name: 'Inside space control' },
  { id: 'c9', cat: 'Concepts', name: 'Stay heavy: weight before grip' },
  { id: 'c10', cat: 'Concepts', name: 'Win the inside angle (standup)' },
  { id: 'c11', cat: 'Concepts', name: 'Defence first, offence later' },
  { id: 'c12', cat: 'Concepts', name: 'Recover guard before sweep before submit' },
  { id: 'c13', cat: 'Concepts', name: 'Patience under pressure' },
  { id: 'c14', cat: 'Concepts', name: 'Breath control' },
  { id: 'c15', cat: 'Concepts', name: 'Drilling vs flow vs hard rolling' },
];

const CATEGORIES = [
  'Fundamentals',
  'Escapes',
  'Submission defence',
  'Guard (closed/half/butterfly)',
  'Open Guard (no-gi)',
  'Passing',
  'Top control & submissions',
  'Back control',
  'Leg locks',
  'Standup & wrestling',
  'Concepts',
];

const CATEGORY_SHORT = {
  'Fundamentals': 'Fundamentals',
  'Escapes': 'Escapes',
  'Submission defence': 'Defence',
  'Guard (closed/half/butterfly)': 'Guard',
  'Open Guard (no-gi)': 'Open guard',
  'Passing': 'Passing',
  'Top control & submissions': 'Top & subs',
  'Back control': 'Back',
  'Leg locks': 'Leg locks',
  'Standup & wrestling': 'Standup',
  'Concepts': 'Concepts',
};

const STATE_LABELS = ['Unknown', 'Learning', 'Drilling', 'In rolls', 'Reliable'];
const STATE_HINTS = [
  'Not covered yet',
  'Seen it, still clumsy',
  'Can do it in drilling',
  'Hitting it in live rolls',
  'Works on most training partners',
];

const BELTS = [
  { id: 'white',  name: 'White',  color: '#f2efe8' },
  { id: 'blue',   name: 'Blue',   color: '#2f6fe0' },
  { id: 'purple', name: 'Purple', color: '#7b4fd6' },
  { id: 'brown',  name: 'Brown',  color: '#7a4b2a' },
  { id: 'black',  name: 'Black',  color: '#141414' },
];

/* ---------- Session log vocab ---------- */
const SESSION_TYPES = [
  { id: 'class',   label: 'Class' },
  { id: 'open',    label: 'Open mat' },
  { id: 'private', label: 'Private' },
  { id: 'comp',    label: 'Comp' },
];

// How the live rounds went, overall. One tap instead of counting taps.
const FEEL = [
  null,
  { v: 1, label: 'Smashed',  hint: 'Mostly defending, got caught' },
  { v: 2, label: 'Survived', hint: 'Held on, few chances' },
  { v: 3, label: 'Even',     hint: 'Traded positions' },
  { v: 4, label: 'Ran it',   hint: 'Controlled most rounds' },
];

// "What to work on" tags. Replace the old free-text "stuck" + "fix" pair.
const WORK_TAGS = [
  { id: 'standup',         label: 'Standup / takedowns' },
  { id: 'guard-retention', label: 'Guard retention' },
  { id: 'passing',         label: 'Guard passing' },
  { id: 'closed-guard',    label: 'Closed guard game' },
  { id: 'half-guard',      label: 'Half guard' },
  { id: 'open-guard',      label: 'Open guard' },
  { id: 'mount-bottom',    label: 'Bottom mount' },
  { id: 'side-bottom',     label: 'Bottom side / N-S' },
  { id: 'back-defence',    label: 'Back defence' },
  { id: 'sub-defence',     label: 'Sub defence' },
  { id: 'top-control',     label: 'Top pressure' },
  { id: 'finishing',       label: 'Finishing subs' },
  { id: 'leg-locks',       label: 'Leg locks' },
  { id: 'cardio',          label: 'Cardio / pacing' },
  { id: 'composure',       label: 'Staying calm' },
];

// Library moves that address each tag (drill suggestions).
const TAG_MOVES = {
  'standup':         ['st1', 'st2', 'st5', 'st7', 'st12', 'st11'],
  'guard-retention': ['g16', 'f1', 'g9', 'o9', 'c1'],
  'passing':         ['p1', 'p2', 'p4', 'p8', 'p7'],
  'closed-guard':    ['g1', 'g2', 'g3', 'g5', 'g6', 'g7'],
  'half-guard':      ['g9', 'g10', 'g11', 'g12'],
  'open-guard':      ['o9', 'g13', 'o1', 'o5'],
  'mount-bottom':    ['e1', 'e2', 'f2'],
  'side-bottom':     ['e4', 'e3', 'e8', 'f6'],
  'back-defence':    ['e5', 'e6', 'd1'],
  'sub-defence':     ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'],
  'top-control':     ['t1', 'b3', 'c4', 'c9'],
  'finishing':       ['b4', 't2', 't3', 'g6', 'g5'],
  'leg-locks':       ['l8', 'l2', 'l1'],
  'cardio':          ['c14', 'c15'],
  'composure':       ['c13', 'c14', 'c11'],
};

// Quick-tally submission chips used in the log and to normalise free text.
const COMMON_SUBS = [
  { id: 'rnc',        label: 'RNC',          re: /\b(rnc|rear[\s-]*naked)/i,          defence: 'd1' },
  { id: 'armbar',     label: 'Armbar',       re: /arm\s*-?bar/i,                      defence: 'd2' },
  { id: 'triangle',   label: 'Triangle',     re: /triangle(?!.*arm)/i,                defence: 'd3' },
  { id: 'guillotine', label: 'Guillotine',   re: /guill?ot|guilly/i,                  defence: 'd4' },
  { id: 'kimura',     label: 'Kimura',       re: /kimura/i,                           defence: 'd5' },
  { id: 'americana',  label: 'Americana',    re: /americana/i,                        defence: 'd5' },
  { id: 'armtri',     label: 'Arm triangle', re: /arm[\s-]*tri|head\s*and\s*arm/i,    defence: 'd6' },
  { id: 'darce',      label: "D'arce",       re: /d.?arce|brabo/i,                    defence: 'd6' },
  { id: 'ankle',      label: 'Ankle lock',   re: /ankle|achilles/i,                   defence: 'l8' },
  { id: 'heelhook',   label: 'Heel hook',    re: /heel\s*hook/i,                      defence: 'l8' },
  { id: 'kneebar',    label: 'Kneebar',      re: /knee\s*bar/i,                       defence: 'l8' },
  { id: 'other',      label: 'Other',        re: /.^/,                                defence: null },
];

/* ---------- Game plan: blue belts need a go-to from every key position ---------- */
const GAMEPLAN_POSITIONS = [
  { id: 'standing',     label: 'Standing',            role: 'Get it down or pull safely',   cats: ['Standup & wrestling'] },
  { id: 'cg-bottom',    label: 'Closed guard',        role: 'Sweep or submit from bottom', cats: ['Guard (closed/half/butterfly)'] },
  { id: 'half-bottom',  label: 'Half guard (bottom)', role: 'Recover, sweep or take back', cats: ['Guard (closed/half/butterfly)'] },
  { id: 'open-bottom',  label: 'Open guard',          role: 'Retain and off-balance',      cats: ['Open Guard (no-gi)', 'Guard (closed/half/butterfly)', 'Leg locks'] },
  { id: 'passing',      label: 'Passing',             role: 'Get past the legs',           cats: ['Passing'] },
  { id: 'mount-top',    label: 'Mount (top)',         role: 'Hold and finish',             cats: ['Top control & submissions', 'Back control'] },
  { id: 'side-top',     label: 'Side control (top)',  role: 'Pin, transition, finish',     cats: ['Top control & submissions'] },
  { id: 'back-top',     label: 'Back (attacking)',    role: 'Keep it and choke',           cats: ['Back control'] },
  { id: 'mount-bottom', label: 'Mount (bottom)',      role: 'Escape',                      cats: ['Escapes', 'Fundamentals'], escape: true },
  { id: 'side-bottom',  label: 'Side control (bottom)', role: 'Escape or re-guard',        cats: ['Escapes', 'Fundamentals'], escape: true },
  { id: 'back-bottom',  label: 'Back (defending)',    role: 'Defend the choke, escape',    cats: ['Escapes', 'Submission defence'], escape: true },
  { id: 'legs',         label: 'Leg entanglements',   role: 'Defend or attack',            cats: ['Leg locks'] },
];

/* =========================================================
   BLUE BELT READINESS MODEL
   Built from widely shared standards rather than one affiliation:
   - Time: Gold BJJ survey (n=1,948) puts white->blue at ~2.3 years;
     most coaches say 1-3 years at 2-3 sessions/week; 150-300 mat hours.
   - Skill: "hard to submit, hard to pin, hard to pass" (common academy
     standard); Saulo Ribeiro's white=survival, blue=escapes ordering;
     Danaher: takedowns, passes and sweeps that work, control and escape,
     standard submissions on neck/arms/legs and their defences.
   - Live: instructors promote on what they see in rolls.
   - Attendance: consistent attendance is the most cited non-technical factor.
   ========================================================= */
const READINESS = {
  hoursTarget: 225,          // midpoint of the common 150-300h range
  roundsTarget: 500,         // ~150 classes x 3-4 rounds
  consistencyWeeks: 12,
  consistencyPerWeek: 2,     // "consistent" = 2+ sessions/week
  stateScore: [0, 0.25, 0.5, 0.8, 1],
  domainReadyAt: 0.7,        // average of "drilling"..."in rolls" across the core
  pillars: {
    time:        { weight: 0.35, label: 'Mat time' },
    skill:       { weight: 0.40, label: 'Technical skill' },
    live:        { weight: 0.15, label: 'Live performance' },
    consistency: { weight: 0.10, label: 'Consistency' },
  },
  domains: [
    { id: 'escapes',  label: 'Escapes & survival', weight: 0.22, why: 'Hard to pin: escape mount, side, back',
      moves: ['f1', 'f2', 'f6', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'] },
    { id: 'defence',  label: 'Submission defence', weight: 0.14, why: 'Hard to submit: RNC, armbar, triangle, guillotine',
      moves: ['d1', 'd2', 'd3', 'd4', 'd5', 'l8'] },
    { id: 'guard',    label: 'Guard', weight: 0.20, why: 'Hard to pass; a sweep and 2-3 attacks from closed guard',
      moves: ['g1', 'g2', 'g3', 'g5', 'g6', 'g7', 'g9', 'g10', 'g13', 'g16', 'o9'] },
    { id: 'passing',  label: 'Passing', weight: 0.14, why: 'A couple of passes that work',
      moves: ['p1', 'p2', 'p4', 'p7', 'p8'] },
    { id: 'top',      label: 'Control & finishes', weight: 0.18, why: 'Hold mount/side/back and finish standard subs',
      moves: ['t1', 't2', 't3', 't4', 't5', 'b1', 'b3', 'b4', 'l1', 'l2'] },
    { id: 'standup',  label: 'Standup', weight: 0.12, why: 'A takedown that works, or a safe guard pull',
      moves: ['st1', 'st2', 'st5', 'st7', 'st12', 'st14'] },
  ],
  // Common rule of thumb: each white-belt stripe ~ 20% of the way to blue.
  stages: [
    { min: 0,  label: 'New white belt',      stripes: 0 },
    { min: 20, label: 'Developing white belt', stripes: 1 },
    { min: 40, label: 'Mid white belt',      stripes: 2 },
    { min: 60, label: 'Experienced white belt', stripes: 3 },
    { min: 80, label: 'Senior white belt',   stripes: 4 },
    { min: 90, label: 'Blue belt range',     stripes: 4 },
  ],
  sources: [
    { label: 'Gold BJJ survey of 1,948 practitioners (via Kioto BJJ)', url: 'https://kiotobjj.com/blog/how-long-blue-belt-bjj/' },
    { label: 'IBJJF graduation system (via Gymdesk)', url: 'https://gymdesk.com/blog/ibjjf-belt-requirements' },
    { label: 'BJJ Fanatics: how long to blue belt', url: 'https://bjjfanatics.com/blogs/news/how-long-does-it-take-to-get-a-blue-belt-in-bjj' },
    { label: 'BJJ Fanatics: blue belt requirements', url: 'https://bjjfanatics.com/blogs/news/blue-belt-bjj-requirements' },
    { label: 'Saulo Ribeiro, Jiu-Jitsu University (belt-by-belt focus)', url: 'https://www.artemisbjj.com/saulo2/' },
    { label: 'Grappling Insider: John Danaher on belt promotion', url: 'https://grapplinginsider.com/john-danaher-gives-his-thoughts-on-belt-promotion/' },
    { label: 'Elite Sports: white to blue (live rolling expectations)', url: 'https://www.elitesports.com/blogs/news/the-ultimate-guide-to-rank-up-your-bjj-belt-white-to-blue' },
    { label: 'BJJ Fanatics: stripes', url: 'https://bjjfanatics.com/blogs/news/bjj-stripes' },
  ],
};

const MILESTONES = [
  { id: 'h25',  kind: 'hours',    n: 25,  label: '25 mat hours' },
  { id: 'h50',  kind: 'hours',    n: 50,  label: '50 mat hours' },
  { id: 'h100', kind: 'hours',    n: 100, label: '100 mat hours' },
  { id: 'h150', kind: 'hours',    n: 150, label: '150 mat hours' },
  { id: 'h225', kind: 'hours',    n: 225, label: '225 mat hours' },
  { id: 's25',  kind: 'sessions', n: 25,  label: '25 sessions' },
  { id: 's50',  kind: 'sessions', n: 50,  label: '50 sessions' },
  { id: 's100', kind: 'sessions', n: 100, label: '100 sessions' },
  { id: 's150', kind: 'sessions', n: 150, label: '150 sessions' },
  { id: 'r250', kind: 'rounds',   n: 250, label: '250 rounds' },
  { id: 'r500', kind: 'rounds',   n: 500, label: '500 rounds' },
  { id: 'w4',   kind: 'streak',   n: 4,   label: '4-week streak' },
  { id: 'w8',   kind: 'streak',   n: 8,   label: '8-week streak' },
  { id: 'w12',  kind: 'streak',   n: 12,  label: '12-week streak' },
];

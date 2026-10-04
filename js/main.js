/* =========================================================
   Mat Log: actions, input binding and startup
   ========================================================= */

function rerenderSheet() {
  const html = {
    session: sessionSheetHTML, move: moveSheetHTML, custom: customMoveSheetHTML,
    gp: gpSheetHTML, focus: focusSheetHTML, settings: settingsSheetHTML,
    drills: drillSheetHTML, comp: compSheetHTML, match: matchSheetHTML,
  }[draft.kind];
  if (html) refreshSheet(html());
}

const ACTIONS = {
  /* navigation */
  tab: el => show(el.dataset.tab),
  go: el => show(el.dataset.to),
  'sheet-close': () => closeSheet(),

  /* session */
  'log-new': () => { draft = newSessionDraft(null); openSheet(sessionSheetHTML()); },
  'log-edit': el => { draft = newSessionDraft(el.dataset.id); openSheet(sessionSheetHTML()); },
  'save-session': () => saveSessionFromDraft(),
  'delete-session': () => {
    const id = draft.id;
    const snapshot = { sessions: state.sessions.slice(), taps: state.taps.slice() };
    state.sessions = state.sessions.filter(s => s.id !== id);
    state.taps = state.taps.filter(t => t.sessionId !== id);
    save(); closeSheet(); renderScreen();
    toast('Session deleted', { label: 'Undo', fn: () => { state.sessions = snapshot.sessions; state.taps = snapshot.taps; save(); renderScreen(); toast('Restored'); } });
  },

  /* generic draft edits */
  'd-set': el => {
    draft[el.dataset.k] = el.dataset.num ? Number(el.dataset.v) : el.dataset.v;
    rerenderSheet();
  },
  'd-toggle': el => {
    const arr = draft[el.dataset.k];
    const v = el.dataset.v;
    const i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1); else arr.push(v);
    rerenderSheet();
  },
  'd-step': el => {
    const k = el.dataset.k;
    const min = el.dataset.min != null ? Number(el.dataset.min) : 0;
    const max = el.dataset.max != null ? Number(el.dataset.max) : 99;
    draft[k] = Math.min(max, Math.max(min, (draft[k] || 0) + Number(el.dataset.d)));
    rerenderSheet();
  },
  'd-focus': el => {
    const v = Number(el.dataset.v);
    if (v === 0) delete draft.focus[el.dataset.id]; else draft.focus[el.dataset.id] = v;
    rerenderSheet();
  },
  'd-tap': el => {
    const map = el.dataset.dir === 'in' ? draft.tapsIn : draft.tapsOut;
    map[el.dataset.sub] = (map[el.dataset.sub] || 0) + 1;
    rerenderSheet();
  },
  'd-tap-clear': () => { draft.tapsIn = {}; draft.tapsOut = {}; rerenderSheet(); },
  'd-more': () => { draft.more = !draft.more; rerenderSheet(); },
  'd-flag': el => { draft[el.dataset.k] = !draft[el.dataset.k]; rerenderSheet(); },
  'd-roll': el => {
    const l = el.dataset.l, r = el.dataset.r;
    draft.rolls[l] = draft.rolls[l] || {};
    draft.rolls[l][r] = (draft.rolls[l][r] || 0) + 1;
    haptic(); rerenderSheet();
  },
  'd-roll-clear': () => { draft.rolls = {}; rerenderSheet(); },
  'd-partner-add': () => addPartner(draft.partnerInput),
  'd-partner-pick': el => addPartner(el.dataset.v),
  'd-partner-rm': el => { draft.partners = draft.partners.filter(p => p !== el.dataset.v); rerenderSheet(); },
  'd-pos': el => {
    if (!draft.posPick) return;
    draft.positional.push({ pos: draft.posPick, result: el.dataset.r });
    haptic(); rerenderSheet();
  },
  'd-pos-rm': el => { draft.positional.splice(Number(el.dataset.i), 1); rerenderSheet(); },
  'voice-start': () => startVoice(),
  'voice-stop': () => stopVoice(),
  'voice-apply': () => { applyVoice(); rerenderSheet(); },
  'voice-close': () => { draft.voice = null; rerenderSheet(); },
  'd-addmove': el => { draft.moves.push(el.dataset.id); draft.moveSearch = ''; rerenderSheet(); },

  /* skills */
  'skills-tab': el => { ui.skillsTab = el.dataset.v; renderScreen(); },
  'lib-filter': el => { ui.libFilter = el.dataset.v; renderScreen(); },
  'rate-new': () => {
    ui.skillsTab = 'library'; ui.libFilter = 'Submission defence'; ui.libSearch = '';
    state.seen.newMovesV3 = true; save();
    show('skills');
  },
  'move-open': el => {
    const id = el.dataset.id;
    const cur = state.moves[id] || { state: 0, notes: '' };
    draft = { kind: 'move', id, state: cur.state || 0, notes: cur.notes || '', link: cur.link || '' };
    openSheet(moveSheetHTML());
  },
  'm-state': el => { draft.state = Number(el.dataset.v); rerenderSheet(); },
  'save-move': () => {
    state.moves[draft.id] = { ...(state.moves[draft.id] || {}), state: draft.state, notes: draft.notes.trim(), link: draft.link.trim() };
    save(); closeSheet(); toast('Updated'); renderScreen();
  },
  'delete-move': () => {
    if (!confirm('Delete this custom move?')) return;
    const id = draft.id;
    state.customMoves = state.customMoves.filter(m => m.id !== id);
    delete state.moves[id];
    Object.values(state.gameplan).forEach(p => { p.moves = (p.moves || []).filter(x => x !== id); });
    save(); closeSheet(); toast('Deleted'); renderScreen();
  },
  'custom-new': () => {
    draft = { kind: 'custom', name: '', cat: ui.libFilter !== 'all' ? ui.libFilter : CATEGORIES[1] };
    openSheet(customMoveSheetHTML());
  },
  'save-custom': () => {
    const name = draft.name.trim();
    if (!name) { toast('Name required'); return; }
    const id = 'cm_' + Date.now();
    state.customMoves.push({ id, cat: draft.cat, name });
    state.moves[id] = { state: 1, notes: '' };
    save(); closeSheet(); toast('Added'); renderScreen();
  },

  /* game plan */
  'gp-open': el => {
    const cur = state.gameplan[el.dataset.id] || { moves: [], note: '' };
    draft = { kind: 'gp', pos: el.dataset.id, moves: [...(cur.moves || [])], note: cur.note || '' };
    openSheet(gpSheetHTML());
  },
  'save-gp': () => {
    state.gameplan[draft.pos] = { moves: draft.moves.slice(0, 5), note: draft.note.trim() };
    save(); closeSheet(); toast('Game plan saved'); renderScreen();
  },

  /* focus */
  'focus-new': () => {
    if (state.focus.length >= 3) { toast('Max 3. Archive one first.'); return; }
    draft = { kind: 'focus', id: null, theme: '', success: '' };
    openSheet(focusSheetHTML());
  },
  'focus-edit': el => {
    const f = state.focus.find(x => x.id === el.dataset.id);
    draft = { kind: 'focus', id: f.id, theme: f.theme, success: f.success || '' };
    openSheet(focusSheetHTML());
  },
  'save-focus': () => {
    const theme = draft.theme.trim();
    if (!theme) { toast('Add a focus'); return; }
    if (draft.id) Object.assign(state.focus.find(f => f.id === draft.id), { theme, success: draft.success.trim() });
    else state.focus.push({ id: 'f_' + Date.now(), theme, success: draft.success.trim(), attempts: 0, createdAt: Date.now() });
    save(); closeSheet(); renderScreen();
  },
  'archive-focus': () => {
    const f = state.focus.find(x => x.id === draft.id);
    state.focusArchive.push({ ...f, archivedAt: Date.now(), stats: focusStats(f) });
    state.focus = state.focus.filter(x => x.id !== draft.id);
    save(); closeSheet(); toast('Focus archived'); renderScreen();
  },

  /* goals */
  'ramp-up': () => {
    state.goals.perWeek = state.goals.rampTo;
    save(); toast(`Target is now ${state.goals.perWeek}×/week`); renderScreen();
  },
  'ramp-later': () => { state.goals.rampDismissedAt = Date.now(); save(); renderScreen(); },

  /* review */
  'review-mode': el => { ui.reviewMode = el.dataset.v; ui.reviewAnchor = todayISO(); renderScreen(); },
  'review-step': el => {
    const d = Number(el.dataset.d);
    ui.reviewAnchor = ui.reviewMode === 'week' ? addDays(weekStart(ui.reviewAnchor), 7 * d) : addMonths(monthStart(ui.reviewAnchor), d);
    if (ui.reviewAnchor > todayISO()) ui.reviewAnchor = todayISO();
    renderScreen();
  },

  /* settings */
  settings: () => {
    draft = {
      kind: 'settings', belt: state.belt, stripes: state.stripes, name: state.profile.name, gym: state.profile.gym,
      since: toISODate(state.beltStartedAt), started: toISODate(state.startedAt),
      perWeek: state.goals.perWeek, rampTo: state.goals.rampTo, theme: state.settings.theme,
    };
    openSheet(settingsSheetHTML());
  },
  'set-belt': el => {
    if (el.dataset.v !== draft.belt) {
      draft.stripes = 0;
      draft.since = el.dataset.v === state.belt ? toISODate(state.beltStartedAt) : todayISO();
    }
    draft.belt = el.dataset.v;
    rerenderSheet();
  },
  'save-settings': () => {
    const d = draft;
    const rankChanged = d.belt !== state.belt || d.stripes !== state.stripes;
    if (rankChanged) state.promotions.push({ date: d.belt !== state.belt && d.since ? d.since : todayISO(), belt: d.belt, stripes: d.stripes });
    state.belt = d.belt;
    state.stripes = d.stripes;
    if (d.since) state.beltStartedAt = fromISODate(d.since);
    if (d.started) state.startedAt = fromISODate(d.started);
    state.goals.perWeek = d.perWeek;
    state.goals.rampTo = Math.max(d.rampTo, d.perWeek);
    state.settings.theme = d.theme;
    state.profile.name = (d.name || '').trim();
    state.profile.gym = (d.gym || '').trim();
    save(); applyTheme(); closeSheet();
    toast(rankChanged ? 'Rank updated' : 'Saved');
    renderScreen();
  },
  backup: () => exportData(),

  /* drills */
  'drills-open': () => openDrills(),
  'drills-mode': el => {
    if (draft.timerId) clearInterval(draft.timerId);
    draft = { kind: 'drills', mode: el.dataset.v, items: drillQueue(el.dataset.v), done: {}, active: null, left: 0, timerId: null };
    rerenderSheet();
  },
  'drill-start': el => startDrill(el.dataset.id),
  'drill-pause': () => {
    if (draft.timerId) { clearInterval(draft.timerId); draft.timerId = null; }
    else draft.timerId = setInterval(tickDrill, 1000);
    rerenderSheet();
  },
  'drill-done': el => {
    clearInterval(draft.timerId); draft.timerId = null;
    draft.done[el.dataset.id] = true; draft.active = null; haptic();
    rerenderSheet();
  },
  'drill-toggle': el => {
    if (draft.done[el.dataset.id]) delete draft.done[el.dataset.id]; else draft.done[el.dataset.id] = true;
    haptic(); rerenderSheet();
  },
  'drills-finish': () => {
    const done = draft.items.filter(i => draft.done[i.id]);
    if (!done.length) return;
    state.drillLog.push({ id: 'dr_' + Date.now(), date: todayISO(), mode: draft.mode, items: done.map(i => i.name), moves: [...new Set(done.flatMap(i => i.moves))] });
    save(); closeSheet(); toast(`${done.length} drill${done.length > 1 ? 's' : ''} logged`); renderScreen();
  },

  /* competitions */
  'comp-new': () => {
    draft = { kind: 'comp', id: null, name: '', date: addDays(todayISO(), 42), division: '', weightLimit: '', notes: '' };
    openSheet(compSheetHTML());
  },
  'comp-open': el => { ui.compId = el.dataset.id; show('comp'); },
  'comp-edit': el => {
    const c = state.comps.find(x => x.id === el.dataset.id);
    draft = { kind: 'comp', id: c.id, name: c.name, date: c.date, division: c.division || '', weightLimit: c.weightLimit || '', notes: c.notes || '' };
    openSheet(compSheetHTML());
  },
  'comp-save': () => {
    const d = draft;
    if (!d.name.trim() || !d.date) { toast('Name and date needed'); return; }
    const fields = { name: d.name.trim(), date: d.date, division: d.division.trim(), weightLimit: Number(d.weightLimit) || null, notes: d.notes.trim() };
    if (d.id) Object.assign(state.comps.find(c => c.id === d.id), fields);
    else { const id = 'comp_' + Date.now(); state.comps.push({ id, ...fields, matches: [], weighIns: [], done: {} }); ui.compId = id; }
    save(); closeSheet(); show('comp');
  },
  'comp-delete': () => {
    if (!confirm('Delete this competition and its matches?')) return;
    state.comps = state.comps.filter(c => c.id !== ui.compId);
    save(); show('comps'); toast('Deleted');
  },
  'comp-task': el => {
    const c = state.comps.find(x => x.id === ui.compId);
    c.done[el.dataset.k] = !c.done[el.dataset.k];
    haptic(); save(); renderScreen();
  },
  'weigh-add': () => {
    const kg = Number($('#weighIn').value);
    if (!kg) { toast('Enter a weight'); return; }
    const c = state.comps.find(x => x.id === ui.compId);
    c.weighIns = c.weighIns.filter(w => w.date !== todayISO());
    c.weighIns.push({ date: todayISO(), kg });
    save(); renderScreen();
  },
  'match-new': () => { draft = { kind: 'match', i: null, result: 'win', method: 'sub', sub: null, score: '', opponent: '', notes: '' }; openSheet(matchSheetHTML()); },
  'match-edit': el => {
    const m = state.comps.find(x => x.id === ui.compId).matches[Number(el.dataset.i)];
    draft = { kind: 'match', i: Number(el.dataset.i), result: m.result, method: m.method, sub: m.sub || null, score: m.score || '', opponent: m.opponent || '', notes: m.notes || '' };
    openSheet(matchSheetHTML());
  },
  'match-save': () => {
    const c = state.comps.find(x => x.id === ui.compId);
    const d = draft;
    const m = { result: d.result, method: d.method, sub: d.method === 'sub' ? d.sub : null, score: d.score.trim(), opponent: d.opponent.trim(), notes: d.notes.trim() };
    if (d.i != null) c.matches[d.i] = m; else c.matches.push(m);
    // a submission in competition is a tap too
    save(); closeSheet(); toast('Match saved'); renderScreen();
  },
  'match-delete': () => {
    state.comps.find(x => x.id === ui.compId).matches.splice(draft.i, 1);
    save(); closeSheet(); renderScreen();
  },
  'go-plan': () => { ui.skillsTab = 'plan'; show('skills'); },

  /* report */
  'report-print': () => window.print(),
  'report-share': async () => {
    const text = reportText();
    try {
      if (navigator.share) { await navigator.share({ title: 'Mat Log training report', text }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); } catch (_) { toast('Sharing not available'); }
  },
  restore: () => importData(),
};

function addPartner(name) {
  const n = (name || '').trim().replace(/\s+/g, ' ');
  if (!n) return;
  const existing = partnerList().find(p => p.toLowerCase() === n.toLowerCase()) || capitalize(n);
  if (!draft.partners.includes(existing)) draft.partners.push(existing);
  draft.partnerInput = '';
  rerenderSheet();
}

/* ---------- backup / restore ---------- */
async function exportData() {
  const name = `matlog-backup-${todayISO()}.json`;
  const json = JSON.stringify(state, null, 2);
  const markDone = () => { state.lastBackupAt = Date.now(); save(); toast('Backed up'); if (draft?.kind === 'settings') rerenderSheet(); };
  try {
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Mat Log backup' });
      markDone();
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  markDone();
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json,application/json';
  input.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      let parsed;
      try {
        parsed = JSON.parse(ev.target.result);
        if (!parsed.moves || !Array.isArray(parsed.sessions)) throw new Error('Invalid backup');
      } catch (err) {
        toast('Not a Mat Log backup file');
        return;
      }
      const msg = state.sessions.length
        ? `Replace current data (${state.sessions.length} sessions) with this backup (${parsed.sessions.length} sessions)?`
        : `Restore ${parsed.sessions.length} sessions from this backup?`;
      if (!confirm(msg)) return;
      try { localStorage.setItem(STORAGE_KEY + '_before_restore', JSON.stringify(state)); } catch (_) {}
      state = migrate(parsed);
      save();
      if ($('#sheetBg').classList.contains('open')) closeSheet();
      applyTheme();
      renderScreen();
      toast(`Restored ${state.sessions.length} sessions`);
    };
    reader.readAsText(f);
  };
  input.click();
}

/* ---------- event wiring ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && ACTIONS[el.dataset.act]) {
    e.preventDefault();
    ACTIONS[el.dataset.act](el, e);
    return;
  }
  const tipEl = e.target.closest('[data-tip]');
  if (tipEl) showTip(tipEl);
});
document.addEventListener('pointerover', e => {
  if (e.pointerType !== 'mouse') return;
  const tipEl = e.target.closest('[data-tip]');
  if (tipEl) showTip(tipEl);
});

let reviewSaveTimer;
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.bindVoice && draft?.voice) { draft.voice.text = el.value; return; }
  if (el.dataset.bind && draft) {
    draft[el.dataset.bind] = el.dataset.num ? (Number(el.value) || 0) : el.value;
    // minutes typed by hand: update the chips without stealing focus
    if (el.dataset.bind === 'minutes') {
      document.querySelectorAll('[data-k="minutes"]').forEach(c => c.classList.toggle('on', Number(c.dataset.v) === draft.minutes));
    }
    if (el.dataset.bind === 'date') {
      document.querySelectorAll('[data-k="date"]').forEach(c => c.classList.toggle('on', c.dataset.v === draft.date));
    }
    return;
  }
  switch (el.dataset.input) {
    case 'move-search':
      draft.moveSearch = el.value;
      $('#moveResults').innerHTML = moveResultsHTML();
      break;
    case 'log-search':
      ui.logSearch = el.value;
      $('#logList').innerHTML = logListHTML();
      break;
    case 'lib-search':
      ui.libSearch = el.value;
      $('#libList').innerHTML = libListHTML();
      break;
    case 'review-note':
      state.reviews[el.dataset.key] = { ...(state.reviews[el.dataset.key] || {}), note: el.value, updatedAt: Date.now() };
      clearTimeout(reviewSaveTimer);
      reviewSaveTimer = setTimeout(save, 400);
      break;
  }
});
$('#sheetBg').addEventListener('click', e => { if (e.target.id === 'sheetBg') closeSheet(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#sheetBg').classList.contains('open')) closeSheet();
  if (e.key === 'Enter' && e.target.dataset?.bind === 'partnerInput') { e.preventDefault(); addPartner(draft.partnerInput); }
});
window.addEventListener('scroll', () => $('#tip').classList.remove('show'), { passive: true });

/* ---------- startup ---------- */
applyTheme();
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => renderScreen());
}
saveState();   // persist any migration straight away
show('home');

// Re-render when the app comes back to the foreground (dates, streaks move on).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !$('#sheetBg').classList.contains('open')) renderScreen();
});

if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

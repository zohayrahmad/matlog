/* =========================================================
   Mat Log: small SVG/HTML charts
   Single-series charts in one hue; values on hover/tap via data-tip.
   ========================================================= */

function ringSVG(pct, { size = 112, stroke = 11, color = '#fff', track = 'rgba(255,255,255,0.22)', label = `${pct}%`, sub = '' } = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return `
    <svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${escapeHtml(label)} ${escapeHtml(sub)}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
        transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <text x="50%" y="${sub ? '47%' : '50%'}" text-anchor="middle" dominant-baseline="middle" fill="${color}" font-size="${size * 0.25}">${escapeHtml(label)}</text>
      ${sub ? `<text x="50%" y="66%" text-anchor="middle" dominant-baseline="middle" fill="${color}" opacity="0.75" font-size="${size * 0.1}">${escapeHtml(sub)}</text>` : ''}
    </svg>`;
}

// Sessions per week as columns, with the weekly target as a reference line.
function weekBarsSVG(series, target) {
  const W = 340, H = 140, padL = 22, padB = 20, padT = 14;
  const max = Math.max(target + 1, ...series.map(s => s.sessions));
  const plotW = W - padL, plotH = H - padB - padT;
  const slot = plotW / series.length;
  const bw = Math.min(18, slot - 6);
  const y = v => padT + plotH - (v / max) * plotH;
  const ticks = [];
  for (let v = 0; v <= max; v += max > 5 ? 2 : 1) ticks.push(v);

  let out = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Sessions per week, last ${series.length} weeks">`;
  ticks.forEach(v => {
    out += `<line class="grid" x1="${padL}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/>`;
    out += `<text class="axis-label" x="${padL - 6}" y="${y(v) + 3}" text-anchor="end">${v}</text>`;
  });
  series.forEach((s, i) => {
    const x = padL + i * slot + (slot - bw) / 2;
    const h = (s.sessions / max) * plotH;
    const cur = i === series.length - 1;
    const tip = `w/c ${formatShort(s.week)}: ${s.sessions} session${s.sessions === 1 ? '' : 's'}, ${(s.minutes / 60).toFixed(1)}h`;
    if (h > 0) {
      const r = Math.min(4, h);
      const top = y(s.sessions);
      out += `<path class="bar ${s.sessions < target ? 'dim' : ''} ${cur ? 'cur' : ''}" d="M${x},${top + h} L${x},${top + r} Q${x},${top} ${x + r},${top} L${x + bw - r},${top} Q${x + bw},${top} ${x + bw},${top + r} L${x + bw},${top + h} Z"/>`;
    }
    out += `<rect class="hit" x="${padL + i * slot}" y="${padT}" width="${slot}" height="${plotH + padB}" data-tip="${escapeHtml(tip)}"/>`;
    if (i % 3 === series.length % 3 || cur) {
      out += `<text class="axis-label" x="${x + bw / 2}" y="${H - 5}" text-anchor="middle">${cur ? 'Now' : formatShort(s.week)}</text>`;
    }
  });
  out += `<line class="target" x1="${padL}" x2="${W}" y1="${y(target)}" y2="${y(target)}"/>`;
  out += `<text class="target-label" x="${W}" y="${y(target) - 4}" text-anchor="end">target ${target}/wk</text>`;
  return out + '</svg>';
}

// Training calendar: one cell per day, darker/brighter = longer session.
function heatmapHTML(weeks = 18) {
  const today = todayISO();
  const start = addDays(weekStart(today), -7 * (weeks - 1));
  const byDay = {};
  state.sessions.forEach(s => { byDay[s.date] = (byDay[s.date] || 0) + (s.minutes || 0); });
  let cells = '';
  const months = [];
  for (let w = 0; w < weeks; w++) {
    const wk = addDays(start, w * 7);
    if (w === 0 || wk.slice(5, 7) !== addDays(wk, -7).slice(5, 7)) months.push({ w, label: formatDate(wk, { month: 'short' }) });
    for (let d = 0; d < 7; d++) {
      const day = addDays(wk, d);
      const m = byDay[day] || 0;
      const lvl = day > today ? 'future' : m === 0 ? '' : m < 60 ? 'l1' : m < 90 ? 'l2' : 'l3';
      const tip = day > today ? '' : `${formatDate(day)}: ${m ? m + ' min' : 'rest'}`;
      cells += `<i class="${lvl}" ${tip ? `data-tip="${escapeHtml(tip)}"` : ''}></i>`;
    }
  }
  const shown = months.filter((m, i) => !(i === 0 && months[1] && months[1].w - m.w < 3));
  const monthRow = shown.map(m => `<span style="grid-row:1; grid-column:${m.w + 1} / span 3">${m.label}</span>`).join('');
  return `
    <div class="heat-months" style="display:grid; grid-template-columns: repeat(${weeks}, 1fr);">${monthRow}</div>
    <div class="heat" style="grid-template-columns: repeat(${weeks}, 1fr);">${cells}</div>
    <div class="heat-legend">Rest <i style="background:var(--heat-0)"></i><i style="background:var(--heat-1)"></i><i style="background:var(--heat-2)"></i><i style="background:var(--heat-3)"></i> 90+ min</div>`;
}

function meterHTML(pct, cls = '') {
  return `<div class="meter ${cls}"><i style="width:${Math.round(Math.max(0, Math.min(1, pct)) * 100)}%"></i></div>`;
}

// Horizontal bars for a ranked list of [label, count].
function hbarsHTML(rows, { max, cls = '' } = {}) {
  if (!rows.length) return '<div class="muted small">Nothing logged.</div>';
  const m = max || Math.max(...rows.map(r => r[1]));
  return rows.map(([label, n, tip]) => `
    <div class="hbar" ${tip ? `data-tip="${escapeHtml(tip)}"` : ''}>
      <span>${label}</span><span class="val">${n}</span>
      ${meterHTML(n / m, cls)}
    </div>`).join('');
}

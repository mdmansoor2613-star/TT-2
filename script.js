/* ---------- Timetable: B.Sc (Hons) Agri, II Year I Sem 2026-27 ---------- */
const SUB = {
  AGRO1: ['AGRO-201', 'Crop Production Technology-I (Kharif crops)', 'Dr. D. V. Srinivasulu'],
  AGRO2: ['AGRO-202', 'Principles and Practices of Natural Farming', 'Dr. C. Prathyusha'],
  ENTO: ['ENTO-231', 'Insect Ecology & Concepts of Integrated Pest Management', 'Dr. P. Radhika'],
  PATH: ['PATH-271', 'Fundamentals of Nematology', 'Dr. M. Pradeep'],
  HORT: ['HORT-281', 'Production Technology of Fruit and Plantation Crops', 'Dr. M. Jasmitha'],
  AEXT: ['AEXT-292', 'Fundamentals of Extension Education', 'Dr. V. Sailaja'],
  GPBR: ['GPBR-211', 'Principles of Genetics', 'Dr. G. Geetha Devi'],
  MDC: ['MDC-291', 'Entrepreneurship Development & Business Communication', 'Dr. V. Sailaja, Dr. P. Lakshmi Priya'],
  SEC: ['SEC-XII', 'Floriculture and Landscaping', 'Dr. G. Narayana Swamy']
};
// Each day is a simple ordered list: [clock slot, subject]. List position = period number (1st, 2nd, 3rd...).
// Clock slots: 2 = 9-10 AM, 3 = 10-12, 4 = 1-3 PM, 5 = 3-4 PM  (lunch 12-1). Every entry counts as 1 period.
const TT = {
  1: [[2,'PATH'], [3,'ENTO'], [3,'AGRO2'], [4,'AEXT'], [4,'AGRO1']],
  2: [[2,'AGRO2'], [3,'HORT'], [3,'SEC'], [4,'AGRO1'], [4,'GPBR'], [5,'ENTO']],
  3: [[2,'MDC'], [3,'AGRO1'], [3,'PATH'], [4,'PATH'], [4,'SEC'], [5,'AGRO1']],
  4: [[2,'HORT'], [3,'SEC'], [4,'ENTO'], [4,'MDC'], [5,'GPBR']],
  5: [[2,'AEXT'], [3,'SEC'], [3,'HORT'], [4,'AGRO2'], [4,'AGRO1'], [5,'MDC']],
  6: [[2,'GPBR'], [3,'GPBR'], [4,'MDC'], [4,'AEXT']]
};
const ST = [360, 540, 600, 780, 900], EN = [480, 600, 720, 900, 960];
const START = new Date(2026, 8, 23);   // commencement of instruction

/* ---------- Helpers & state ---------- */
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s), pad = n => String(n).padStart(2, '0');
const key = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = k => new Date(k + 'T00:00');
const day0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const fmt = m => { const h = Math.floor(m / 60); return (h > 12 ? h - 12 : h) + ':' + pad(m % 60); };
const esc = s => String(s).replace(/[&"<>]/g, c => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' }[c]));
const msg = t => `<div class="card empty">${t}</div>`;

let S = { target: 75, theme: 'dark', marks: {}, hol: {} };
try { Object.assign(S, JSON.parse(localStorage.getItem('agri-att-v2'))); } catch {}
const save = () => { try { localStorage.setItem('agri-att-v2', JSON.stringify(S)); } catch {} };
let sel = day0(), vm = new Date(sel.getFullYear(), sel.getMonth(), 1);

const blocks = d => d < START ? [] : (TT[d.getDay()] || []).map(([slot, k], i) => ({ s: i + 1, k, slot }));

/* ---------- Maths ---------- */
function stats(from, to) {
  const r = {};
  for (const k in S.marks) {
    if (S.hol[k]) continue;
    const d = parse(k);
    if (from && (d < from || d > to)) continue;
    for (const s in S.marks[k]) {
      const m = S.marks[k][s], n = 1;
      r[m.k] ??= { a: 0, t: 0 };
      r[m.k].t += n;
      if (m.v === 'P') r[m.k].a += n;
    }
  }
  return r;
}
const sum = r => Object.values(r).reduce((x, v) => ({ a: x.a + v.a, t: x.t + v.t }), { a: 0, t: 0 });
const pc = (a, t) => t ? a / t * 100 : null;
const lvl = p => p < S.target ? 'bad' : p < S.target + 5 ? 'warn' : 'ok';
const badge = p => { const l = lvl(p); return `<span class="badge ${l}">${l === 'bad' ? 'Below ' + S.target + '%' : l === 'warn' ? 'Close to limit' : 'Safe'}</span>`; };
function advice(a, t) {
  const p = S.target / 100;
  if (!t) return 'No classes marked yet';
  if (a / t >= p) {
    const x = Math.floor(a / p - t + 1e-9);
    return x > 0 ? `You can miss ${x} more period${x > 1 ? 's' : ''}` : 'Don’t miss the next period';
  }
  const y = Math.ceil((p * t - a) / (1 - p) - 1e-9);
  return `Attend next ${y} period${y > 1 ? 's' : ''} to reach ${S.target}%`;
}
function streak() {
  let c = 0; const today = day0();
  for (let d = new Date(today); d >= START; d.setDate(d.getDate() - 1)) {
    const k = key(d), bs = blocks(d);
    if (!bs.length || S.hol[k]) continue;
    const m = S.marks[k] || {}, v = bs.map(b => m[b.s]?.v).filter(Boolean);
    if (!v.length) { if (+d === +today) continue; break; }
    if (v.includes('A')) break;
    c++;
  }
  return c;
}

/* ---------- Render: total ---------- */
function renderTotal() {
  const r = stats(), o = sum(r), p = pc(o.a, o.t);
  $('#overall').innerHTML = `<div class="big ${p == null ? '' : lvl(p)}">${p == null ? '—' : p.toFixed(1) + '%'}</div>
    <div><b>${o.a}</b> of <b>${o.t}</b> periods attended · <b>${o.t - o.a}</b> missed</div>
    <p class="adv">${advice(o.a, o.t)}</p>${p == null ? '' : badge(p)}`;

  const wd = day0(), mon = new Date(wd); mon.setDate(wd.getDate() - ((wd.getDay() + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const miss = o => Object.entries(o).map(([k, v]) => [k, v.t - v.a]).filter(x => x[1] > 0).sort((x, y) => y[1] - x[1]);
  const wk = miss(stats(mon, sun)), wm = wk.reduce((s, x) => s + x[1], 0), all = miss(r)[0];
  $('#insights').innerHTML = `
    <div class="card"><small>Streak</small><b>${streak()} day${streak() === 1 ? '' : 's'} 🔥</b><small>days attended in a row</small></div>
    <div class="card"><small>Most missed</small><b>${all ? SUB[all[0]][0] : 'Nothing yet'}</b><small>${all ? all[1] + ' periods missed' : 'Great start'}</small></div>
    <div class="card"><small>This week</small><b>${wm ? `You missed ${wm} period${wm > 1 ? 's' : ''}, mostly ${SUB[wk[0][0]][0]}.` : 'No missed periods. Keep it up!'}</b></div>`;

  $('#subjects').innerHTML = Object.keys(SUB).map(k => {
    const v = r[k] || { a: 0, t: 0 }, q = pc(v.a, v.t);
    return `<article class="card sub ${q == null ? '' : lvl(q)}"><h3>${SUB[k][0]}</h3><small>${SUB[k][1]}</small>
      <div class="pct">${q == null ? '—' : q.toFixed(0) + '%'}</div>
      <small>${v.a}/${v.t} periods</small>${q == null ? '' : badge(q)}<small>${advice(v.a, v.t)}</small></article>`;
  }).join('');
}

/* ---------- Render: day ---------- */
function renderDay() {
  const k = key(sel), bs = blocks(sel), m = S.marks[k] || {}, isT = +sel === +day0();
  const n = new Date(), mins = n.getHours() * 60 + n.getMinutes();
  $('#dayLabel').textContent = sel.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }) + (isT ? ' · Today' : '');
  $('#hol').textContent = S.hol[k] ? 'Remove holiday' : 'Mark holiday';
  $('#periods').innerHTML = S.hol[k] ? msg('🌴 Holiday, not counted')
    : !bs.length ? msg(sel < START ? 'Classes start on 23 Sep 2026' : sel.getDay() === 0 ? 'Sunday, no classes 🎉' : 'No classes today 🎉')
    : bs.map(b => {
        const st = ST[b.slot - 1], en = EN[b.slot - 1], cur = isT && mins >= st && mins < en, x = m[b.s], v = x?.v;
        const end = en > 720 ? ' PM' : en === 720 ? ' Noon' : ' AM';
        return `<article class="card slot ${v === 'P' ? 'present' : v === 'A' ? 'absent' : ''} ${cur ? 'now' : ''}" data-s="${b.s}">
          <div class="time">Period ${b.s} · ${fmt(st)} – ${fmt(en)}${end}${cur ? '<i>NOW</i>' : ''}</div>
          <h3>${SUB[b.k][1]}</h3><p>${SUB[b.k][0]} · ${SUB[b.k][2]}</p>
          <div class="btns"><button data-m="P" class="${v === 'P' ? 'on' : ''}">Present</button><button data-m="A" class="${v === 'A' ? 'on' : ''}">Absent</button></div>
          ${v === 'A' ? `<input class="reason" maxlength="140" placeholder="Reason" aria-label="Absence reason" value="${esc(x.r || '')}">` : ''}</article>`;
      }).join('');
}

/* ---------- Render: calendar ---------- */
function renderCal() {
  const y = vm.getFullYear(), mo = vm.getMonth(), off = (new Date(y, mo, 1).getDay() + 6) % 7, days = new Date(y, mo + 1, 0).getDate();
  const tk = key(day0()), sk = key(sel);
  let h = `<div class="calhead"><button data-n="-1">‹</button><b>${vm.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</b><button data-n="1">›</button></div>
    <div class="grid">${'MTWTFSS'.split('').map(x => `<span class="dow">${x}</span>`).join('')}${'<span></span>'.repeat(off)}`;
  for (let i = 1; i <= days; i++) {
    const d = new Date(y, mo, i), k = key(d), bs = blocks(d), m = S.marks[k] || {}, v = bs.map(b => m[b.s]?.v).filter(Boolean);
    const c = S.hol[k] ? 'c-hol' : !bs.length ? 'c-off' : v.includes('A') ? 'c-a' : v.length === bs.length ? 'c-p' : v.length ? 'c-part' : '';
    h += `<button data-d="${k}" class="${c} ${k === tk ? 'today' : ''} ${k === sk ? 'sel' : ''}">${i}</button>`;
  }
  $('#cal').innerHTML = h + `</div><div class="legend"><span>🟢 Present</span><span>🔴 Missed</span><span>🟡 Partly marked</span><span>🔵 Holiday</span></div>`;
}

/* ---------- Calculator ---------- */
function fill() {
  const r = stats(), v = $('#cSub').value, x = v === 'all' ? sum(r) : r[v] || { a: 0, t: 0 };
  $('#cT').value = x.t; $('#cA').value = x.a; calc();
}
function calc() {
  const t = +$('#cT').value || 0, a = +$('#cA').value || 0;
  if (a > t) { $('#cOut').textContent = 'Attended classes can’t be more than total classes.'; return; }
  const p = t ? a / t * 100 : null;
  $('#cOut').innerHTML = p == null ? 'Enter your total classes.'
    : `<b class="hl ${lvl(p)}" style="font-size:1.8rem">${p.toFixed(1)}%</b> ${badge(p)}<br><small>attended ÷ total × 100 = ${a} ÷ ${t} × 100 · ${advice(a, t)} · target ${S.target}%</small>`;
}

/* ---------- Reminder banner, theme, batch ---------- */
function banner() {
  const k = key(day0()), bs = blocks(day0()), m = S.marks[k] || {}, un = bs.filter(b => !m[b.s]).length;
  const show = new Date().getHours() >= 18 && bs.length && !S.hol[k] && un > 0;
  $('#banner').hidden = !show;
  if (show) $('#banner').textContent = `⏰ ${un} class${un > 1 ? 'es are' : ' is'} still unmarked today. Press P or A, or tap below.`;
}
function applyUI() {
  document.documentElement.dataset.theme = S.theme;
  $('#theme').textContent = S.theme === 'dark' ? '🌙' : '☀️';
}
const render = () => { applyUI(); renderTotal(); renderDay(); renderCal(); calc(); banner(); };

/* ---------- Actions ---------- */
function mark(s, v, force, focus) {
  const k = key(sel), b = blocks(sel).find(x => x.s === s); if (!b) return;
  S.marks[k] ??= {};
  const cur = S.marks[k][s];
  if (!force && cur?.v === v) delete S.marks[k][s];
  else S.marks[k][s] = { v, k: b.k, r: v === 'A' && cur?.v === 'A' ? cur.r : '' };
  if (!Object.keys(S.marks[k]).length) delete S.marks[k];
  save(); render();
  if (focus && v === 'A') $(`.slot[data-s="${s}"] .reason`)?.focus();
}
const go = d => { sel = d; vm = new Date(d.getFullYear(), d.getMonth(), 1); render(); };

$('#periods').addEventListener('click', e => {
  const b = e.target.closest('button[data-m]'); if (b) mark(+b.closest('.slot').dataset.s, b.dataset.m);
});
$('#periods').addEventListener('input', e => {       // save the reason as you type (no re-render, so focus stays)
  if (!e.target.matches('.reason')) return;
  const m = S.marks[key(sel)]?.[e.target.closest('.slot').dataset.s];
  if (m) { m.r = e.target.value; save(); }
});
$('#daybar').addEventListener('click', e => {
  const a = e.target.dataset.a, k = key(sel); if (!a) return;
  const d = new Date(sel);
  if (a === 'prev') { d.setDate(d.getDate() - 1); go(d); }
  else if (a === 'next') { d.setDate(d.getDate() + 1); go(d); }
  else if (a === 'today') go(day0());
  else if (a === 'all') { S.marks[k] ??= {}; blocks(sel).forEach(b => S.marks[k][b.s] = { v: 'P', k: b.k, r: '' }); save(); render(); }
  else if (a === 'hol') { S.hol[k] ? delete S.hol[k] : S.hol[k] = 1; save(); render(); }
});
$('#cal').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.d) go(parse(b.dataset.d));
  else if (b.dataset.n) { vm = new Date(vm.getFullYear(), vm.getMonth() + +b.dataset.n, 1); renderCal(); }
});
$('#theme').addEventListener('click', () => { S.theme = S.theme === 'dark' ? 'light' : 'dark'; save(); applyUI(); });
$('#target').addEventListener('input', e => {
  S.target = Math.min(99, Math.max(1, +e.target.value || 75)); save(); render();
});
['#cT', '#cA'].forEach(s => $(s).addEventListener('input', calc));
$('#cSub').addEventListener('change', fill);
$('#cFill').addEventListener('click', fill);

// Keyboard: P / A -> current period (today) or next unmarked one
addEventListener('keydown', e => {
  if (e.target.matches('input,select,textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
  const v = { p: 'P', a: 'A' }[e.key.toLowerCase()]; if (!v) return;
  const k = key(sel), bs = blocks(sel); if (S.hol[k] || !bs.length) return;
  const m = S.marks[k] || {}, n = new Date(), mins = n.getHours() * 60 + n.getMinutes();
  const b = (+sel === +day0() && bs.find(b => mins >= ST[b.slot - 1] && mins < EN[b.slot - 1])) || bs.find(b => !m[b.s]);
  if (b) mark(b.s, v, true, true);
});

/* ---------- Init ---------- */
$('#target').value = S.target;
$('#cSub').innerHTML = '<option value="all">Overall</option>' + Object.entries(SUB).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('');
render();
fill();
setInterval(render, 60000);

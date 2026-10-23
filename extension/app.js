(() => {
const W = 1200, H = 900;
const TYPES = {
  header: {label: 'Header', pl: 'headers', c: 'var(--t-header)'},
  logo: {label: 'Logo', pl: 'logos', c: 'var(--t-logo)'},
  button: {label: 'Button', pl: 'buttons', c: 'var(--t-button)'},
  typography: {label: 'Typography', pl: 'type compositions', c: 'var(--t-typography)'},
  footer: {label: 'Footer', pl: 'footers', c: 'var(--t-footer)'}
};
const S = {images: [], elements: [], nav: {view: 'grid', folder: {k: 'recent'}}, back: [], fwd: [], q: '', outlines: false, details: false, open: new Set(), capture: true, seq: 1, extra: 0, customTags: [], deletedTags: new Set(), addingTag: false, theme: 'dark',
  links: [{id: 'l1', name: 'Awwwards · Sites of the Day', url: 'https://www.awwwards.com/websites/sites_of_the_day/', from: 'example'}, {id: 'l2', name: 'Dribbble · Popular shots', url: 'https://dribbble.com/shots/popular', from: 'example'}]};
const EYEBROW = {'Atelier Nord': 'Studio · since 2009', 'Lumen Skin': 'New · Autumn ritual', 'Vela Hotels': 'Adriatic collection', 'Pulse Finance': 'Personal finance', 'Noir Gallery': 'Now showing', 'Okra Kitchen': 'Lviv · open daily', 'Sora Architects': 'Residential', 'Grain Bakery': 'Since 1987'};
/* Header detection for imported images. Strict: when any check fails, no header is saved. */
const DETECT = {minWidth: 600, aspect: [0.45, 2.4], band: [0.03, 0.15], minBandPx: 32, edgeDelta: 18, lineDelta: 14, bgShare: 0.6, bgTol: 28, inkTol: 40, minClusters: 2, clusterGap: 0.03, leftStart: 0.35, rightEnd: 0.55, inkCoverage: [0.01, 0.4], minConf: 0.6};
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const uid = p => p + (S.seq++);

/* ---------- Sample designs, drawn on canvas ---------- */
const SPECS = [
  {name: 'Atelier Nord', site: 'awwwards.com', tags: ['architecture agency', 'minimalism'], bg: '#ECE9E3', surf: '#F6F4F0', ink: '#1E1D1B', muted: '#7A766F', acc: '#B4532A', accInk: '#FFFFFF', serif: 1, hw: 400, head: 'We design buildings that stay quiet', sub: 'Architecture and interiors for cultural spaces across Northern Europe.', layout: 'split', buttons: 1, hero: 'arch', mark: 'square', r: 0, cta: 'See projects'},
  {name: 'Lumen Skin', site: 'pinterest.com', tags: ['elegant design'], bg: '#F4ECE6', surf: '#EFE3DA', ink: '#3A2A22', muted: '#8C7568', acc: '#8A5A44', accInk: '#FFFFFF', serif: 1, hw: 400, head: 'Skin care with nothing to hide', sub: 'Five ingredients. One ritual. Made in small batches.', layout: 'center', buttons: 2, hero: 'circle', mark: 'circle', headerBtn: 1, r: 28, cta: 'Shop the set', cta2: 'Find a store'},
  {name: 'Forma Studio', site: 'dribbble.com', tags: ['minimalism'], bg: '#FFFFFF', surf: '#FFFFFF', ink: '#111111', muted: '#7B7B7B', acc: '#111111', accInk: '#FFFFFF', hw: 700, head: 'Less, but sharper.', sub: 'Brand systems for companies that would rather be clear than loud.', layout: 'split', buttons: 2, hero: 'tiles', mark: 'square', r: 4, cta: 'Start a project'},
  {name: 'Vela Hotels', site: 'awwwards.com', tags: ['elegant design', 'architecture agency'], bg: '#12201E', surf: '#172A27', ink: '#F1EDE4', muted: '#A5B1AA', acc: '#D9B26F', accInk: '#12201E', serif: 1, hw: 400, head: 'Stay where the coastline slows down', sub: 'Seven houses on the Adriatic, restored stone by stone.', layout: 'split', buttons: 1, hero: 'arch', mark: 'round', headerBtn: 1, r: 0, cta: 'Check dates', cta2: 'Reserve'},
  {name: 'Pulse Finance', site: 'dribbble.com', tags: ['fintech', 'bold color'], bg: '#0E0F1A', surf: '#151729', ink: '#FFFFFF', muted: '#9A9CC0', acc: '#6D5DFC', accInk: '#FFFFFF', hw: 700, head: 'Money that moves at your pace', sub: 'Budgets, cards and savings goals in one calm dashboard.', layout: 'split', buttons: 2, hero: 'bars', mark: 'round', headerBtn: 1, r: 14, cta: 'Open account', cta2: 'Log in'},
  {name: 'Okra Kitchen', site: 'pinterest.com', tags: ['food & drink', 'bold color'], bg: '#F7E9C8', surf: '#F3DFB0', ink: '#2B1B0E', muted: '#6E5A3E', acc: '#D94F2B', accInk: '#FFFFFF', serif: 1, hw: 700, head: 'Slow food, fast lunch', sub: 'Seasonal bowls cooked every morning in Lviv.', layout: 'center', buttons: 1, hero: 'blob', mark: 'circle', r: 30, cta: 'Order now'},
  {name: 'Kite Mobility', site: 'behance.net', tags: ['bold color'], bg: '#E8F1FF', surf: '#F5F9FF', ink: '#0B1B3A', muted: '#5A6B8C', acc: '#1F5BFF', accInk: '#FFFFFF', hw: 700, head: 'Every ride, one pass', sub: 'Bikes, scooters and trams on a single monthly plan.', layout: 'split', buttons: 2, hero: 'circle', mark: 'round', r: 10, cta: 'Get the app'},
  {name: 'Noir Gallery', site: 'awwwards.com', tags: ['elegant design', 'minimalism'], bg: '#0B0B0B', surf: '#111111', ink: '#EDEDED', muted: '#8B8B8B', acc: '#EDEDED', accInk: '#0B0B0B', serif: 1, hw: 400, head: 'Contemporary works, after dark', sub: 'Open Thursday to Sunday, 18:00 to midnight.', layout: 'center', buttons: 1, hero: 'tiles', mark: 'square', r: 0, cta: 'Current show'}
];
const FAILED = {name: 'Harbor Coffee', site: 'pinterest.com', tags: ['food & drink'], bg: '#EFE6DA', surf: '#E7DBCB', ink: '#1F2A22', muted: '#6B7368', acc: '#3E6B4F', accInk: '#FFFFFF', serif: 1, hw: 700, head: 'Roasted by the pier since 1998', sub: 'Single-origin beans, roasted on Tuesdays.', layout: 'split', buttons: 2, hero: 'blob', mark: 'circle', r: 24, cta: 'Shop beans'};
const EXTRA = [
  {name: 'Sora Architects', site: 'dribbble.com', tags: ['architecture agency', 'minimalism'], bg: '#F2F2EF', surf: '#FAFAF8', ink: '#141414', muted: '#77776F', acc: '#2F3B33', accInk: '#FFFFFF', hw: 500, head: 'Houses shaped by light', sub: 'Residential architecture in Kyoto and Lisbon.', layout: 'split', buttons: 1, hero: 'arch', mark: 'square', r: 0, cta: 'View houses'},
  {name: 'Mint Bank', site: 'behance.net', tags: ['fintech'], bg: '#0F1F1A', surf: '#132822', ink: '#F0FFF8', muted: '#93B3A6', acc: '#3DDC97', accInk: '#0F1F1A', hw: 700, head: 'Banking without the queue', sub: 'Open an account in four minutes from your phone.', layout: 'center', buttons: 2, hero: 'bars', mark: 'round', headerBtn: 1, r: 12, cta: 'Get started', cta2: 'Sign in'},
  {name: 'Plié Studio', site: 'pinterest.com', tags: ['elegant design'], bg: '#F7F1F3', surf: '#F1E6EA', ink: '#2D1F26', muted: '#8B7480', acc: '#A0476B', accInk: '#FFFFFF', serif: 1, hw: 400, head: 'Ballet classes for grown-ups', sub: 'Beginner and open levels, six days a week.', layout: 'split', buttons: 2, hero: 'circle', mark: 'circle', r: 26, cta: 'Book a class'},
  {name: 'Grain Bakery', site: 'awwwards.com', tags: ['food & drink'], bg: '#2A1C12', surf: '#33231A', ink: '#F6E7D2', muted: '#C1A68A', acc: '#E9A13B', accInk: '#2A1C12', serif: 1, hw: 700, head: 'Bread worth waking up for', sub: 'Sourdough out of the oven at 7:00 every day.', layout: 'center', buttons: 1, hero: 'blob', mark: 'round', r: 8, cta: 'See the menu'}
];

function rng(seed) { let s = seed % 2147483647 || 7; return () => (s = s * 16807 % 2147483647, (s - 1) / 2147483646); }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function wrap(g, text, max) {
  const out = []; let line = '';
  for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > max && line) { out.push(line); line = w; } else line = t; }
  if (line) out.push(line); return out;
}
function drawDesign(s, seed) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), B = [], R = rng(seed * 9973 + 11);
  const shape = (r, h) => r <= 4 ? 'square' : r >= h / 2 - 2 ? 'pill' : 'rounded';
  const sans = '"Helvetica Neue", Helvetica, Arial, sans-serif', ff = s.serif ? 'Georgia, "Times New Roman", serif' : sans;
  g.fillStyle = s.bg; g.fillRect(0, 0, W, H);
  g.fillStyle = s.surf; g.fillRect(0, 0, W, 84);
  g.fillStyle = s.muted; g.globalAlpha = .25; g.fillRect(0, 84, W, 1); g.globalAlpha = 1;
  B.push({type: 'header', x: 0, y: 0, w: W, h: 85});
  g.fillStyle = s.acc;
  if (s.mark === 'circle') { g.beginPath(); g.arc(64, 42, 16, 0, 7); g.fill(); } else { rr(g, 48, 26, 32, 32, s.mark === 'round' ? 10 : 3); g.fill(); }
  g.font = `700 22px ${ff}`; g.fillStyle = s.ink; g.fillText(s.name, 92, 50);
  B.push({type: 'logo', x: 38, y: 18, w: Math.round(54 + g.measureText(s.name).width + 16), h: 48});
  g.font = `500 15px ${sans}`; g.fillStyle = s.muted;
  let nx = s.headerBtn ? 600 : 760;
  for (const n of ['Work', 'Studio', 'Journal', 'Contact']) { g.fillText(n, nx, 48); nx += g.measureText(n).width + 34; }
  if (s.headerBtn) {
    const bx = W - 212, by = 22, bw = 164, bh = 40;
    rr(g, bx, by, bw, bh, Math.min(s.r, 20)); g.fillStyle = s.acc; g.fill();
    g.fillStyle = s.accInk; g.font = `600 15px ${sans}`; g.textAlign = 'center'; g.fillText(s.cta2 || 'Contact', bx + bw / 2, by + 26); g.textAlign = 'left';
    B.push({type: 'button', x: bx - 4, y: by - 4, w: bw + 8, h: bh + 8, sig: `filled|${s.acc}|${shape(Math.min(s.r, 20), bh)}`});
  }
  const center = s.layout === 'center', hs = 64, lh = 72, eb = s.eyebrow || EYEBROW[s.name];
  g.font = `${s.hw} ${hs}px ${ff}`;
  const lines = wrap(g, s.head, center ? 860 : 540), y0 = center ? 240 : 260, tx = center ? W / 2 : 80;
  let maxW = Math.max(...lines.map(l => g.measureText(l).width)), topY = y0 - hs * .85;
  g.textAlign = center ? 'center' : 'left';
  if (eb) { const t = eb.toUpperCase(); g.font = `600 13px ${sans}`; g.fillStyle = s.acc === s.ink ? s.muted : s.acc; g.fillText(t, tx, y0 - hs - 8); maxW = Math.max(maxW, g.measureText(t).width); topY = y0 - hs - 22; }
  g.font = `${s.hw} ${hs}px ${ff}`; g.fillStyle = s.ink;
  lines.forEach((l, i) => g.fillText(l, tx, y0 + i * lh));
  let y = y0 + (lines.length - 1) * lh + 52;
  g.font = `400 19px ${sans}`; g.fillStyle = s.muted;
  const sl = wrap(g, s.sub, center ? 620 : 470); sl.forEach((l, i) => g.fillText(l, tx, y + i * 28));
  maxW = Math.max(maxW, ...sl.map(l => g.measureText(l).width));
  const levels = (eb ? 1 : 0) + 1 + (sl.length ? 1 : 0), botY = y + (sl.length - 1) * 28 + 8;
  /* Typography = one composition block (eyebrow, headline, lead), saved only when it has 2+ text levels */
  if (levels >= 2) { const lx = center ? W / 2 - maxW / 2 : 80; B.push({type: 'typography', x: lx - 16, y: topY - 14, w: maxW + 32, h: botY - topY + 28, note: `Composition: ${levels} text levels, ${lines.length}-line headline`}); }
  y += sl.length * 28 + 22;
  const bh = 56, b1 = 196, b2 = 170, gap = 16;
  let bx = center ? W / 2 - (s.buttons === 2 ? b1 + gap + b2 : b1) / 2 : 80;
  g.textAlign = 'center'; g.font = `600 16px ${sans}`;
  rr(g, bx, y, b1, bh, Math.min(s.r, 28)); g.fillStyle = s.acc; g.fill();
  g.fillStyle = s.accInk; g.fillText(s.cta || 'Explore', bx + b1 / 2, y + 34);
  B.push({type: 'button', x: bx - 6, y: y - 6, w: b1 + 12, h: bh + 12, sig: `filled|${s.acc}|${shape(Math.min(s.r, 28), bh)}`});
  if (s.buttons === 2) {
    const x2 = bx + b1 + gap; rr(g, x2 + 1, y + 1, b2 - 2, bh - 2, Math.min(s.r, 28));
    g.strokeStyle = s.ink; g.lineWidth = 1.5; g.stroke(); g.fillStyle = s.ink; g.fillText('Learn more', x2 + b2 / 2, y + 34);
    B.push({type: 'button', x: x2 - 6, y: y - 6, w: b2 + 12, h: bh + 12, sig: `outline|${s.ink}|${shape(Math.min(s.r, 28), bh)}`});
  }
  g.textAlign = 'left';
  const a = center ? {x: 120, y: y + bh + 44, w: 960, h: H - (y + bh + 44) - 100} : {x: 660, y: 150, w: 480, h: 650};
  visual(g, s, a, R);
  const fy = H - 64;
  g.fillStyle = s.surf; g.fillRect(0, fy, W, 64); g.fillStyle = s.muted; g.globalAlpha = .25; g.fillRect(0, fy, W, 1); g.globalAlpha = 1;
  g.font = `400 14px ${sans}`; g.fillStyle = s.muted; g.textAlign = 'left'; g.fillText(`© 2026 ${s.name}`, 48, fy + 38);
  g.textAlign = 'right'; let fx = W - 48;
  for (const n of ['Contact', 'Privacy', 'Instagram']) { g.fillText(n, fx, fy + 38); fx -= g.measureText(n).width + 32; }
  g.textAlign = 'left';
  B.push({type: 'footer', x: 0, y: fy, w: W, h: 64});
  return {canvas: c, boxes: B};
}
function visual(g, s, a, R) {
  g.save(); rr(g, a.x, a.y, a.w, a.h, Math.min(s.r, 24)); g.clip();
  g.fillStyle = s.surf; g.fillRect(a.x, a.y, a.w, a.h);
  g.fillStyle = s.muted; g.globalAlpha = .08; g.fillRect(a.x, a.y, a.w, a.h); g.globalAlpha = 1;
  if (s.hero === 'arch') {
    let x = a.x + 10; const base = a.y + a.h;
    while (x < a.x + a.w) {
      const bw = 50 + R() * 90, bh = a.h * (.3 + R() * .55), hot = R() < .2;
      g.fillStyle = hot ? s.acc : s.muted; g.globalAlpha = hot ? .85 : .2 + R() * .45; g.fillRect(x, base - bh, bw, bh);
      g.globalAlpha = .18; g.fillStyle = s.bg;
      for (let wy = base - bh + 16; wy < base - 20; wy += 26) for (let wx = x + 10; wx < x + bw - 14; wx += 20) g.fillRect(wx, wy, 8, 12);
      g.globalAlpha = 1; x += bw + 8;
    }
  } else if (s.hero === 'circle') {
    const cx = a.x + a.w / 2, cy = a.y + a.h / 2, r = Math.min(a.w, a.h) * .38;
    const gr = g.createRadialGradient(cx - r * .3, cy - r * .3, r * .1, cx, cy, r);
    gr.addColorStop(0, s.bg); gr.addColorStop(1, s.acc);
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    g.strokeStyle = s.ink; g.globalAlpha = .2; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, r * 1.25, 0, 7); g.stroke(); g.globalAlpha = 1;
  } else if (s.hero === 'bars') {
    const n = 9, bw = (a.w - 80) / n;
    for (let i = 0; i < n; i++) { const h = a.h * (.15 + i / n * .55 + R() * .12); g.fillStyle = s.acc; g.globalAlpha = .35 + i / n * .65; rr(g, a.x + 40 + i * bw + 6, a.y + a.h - 40 - h, bw - 12, h, 6); g.fill(); }
    g.globalAlpha = 1; g.fillStyle = s.ink; g.font = '700 40px "Helvetica Neue", Arial, sans-serif'; g.fillText('€12,480', a.x + 40, a.y + 70);
    g.fillStyle = s.muted; g.font = '400 16px "Helvetica Neue", Arial, sans-serif'; g.fillText('Saved this year', a.x + 40, a.y + 98);
  } else if (s.hero === 'blob') {
    const pts = [[.35, .45, .32, s.acc, .9], [.62, .55, .28, s.muted, .35], [.5, .3, .18, s.ink, .12]];
    for (const [px, py, pr, col, al] of pts) { g.fillStyle = col; g.globalAlpha = al; g.beginPath(); g.arc(a.x + a.w * px, a.y + a.h * py, Math.min(a.w, a.h) * pr * 1.3, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  } else {
    const gw = (a.w - 48) / 2, gh = (a.h - 48) / 2, cols = [[s.acc, .9], [s.muted, .35], [s.ink, .15], [s.muted, .6]];
    cols.forEach(([col, al], i) => { g.fillStyle = col; g.globalAlpha = al; rr(g, a.x + 16 + (i % 2) * (gw + 16), a.y + 16 + Math.floor(i / 2) * (gh + 16), gw, gh, Math.min(s.r, 10)); g.fill(); });
    g.globalAlpha = 1;
  }
  g.restore();
}
function crop(canvas, b) {
  const x = Math.max(0, Math.round(b.x)), y = Math.max(0, Math.round(b.y));
  const w = Math.max(1, Math.min(canvas.width - x, Math.round(b.w))), h = Math.max(1, Math.min(canvas.height - y, Math.round(b.h)));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, w, h);
  return c.toDataURL('image/png');
}

/* ---------- Library data ---------- */
function addFromSpec(spec, seed, savedAt, status) {
  const d = drawDesign(spec, seed);
  const img = {id: uid('img'), name: spec.name, site: spec.site, text: [spec.head, spec.sub, spec.eyebrow || EYEBROW[spec.name] || ''].join(' '), autoTags: spec.tags.slice(), tags: [], canvas: d.canvas, src: d.canvas.toDataURL('image/jpeg', .9), w: W, h: H, boxes: d.boxes, removed: new Set(), savedAt, status};
  S.images.push(img); loadNotes(img); return img;
}
/* A button with the same shape and color as one already saved is a duplicate, whatever its text */
function makeElements(img) {
  let dup = 0;
  img.boxes.forEach((b, i) => {
    if (img.removed.has(i) || S.elements.some(e => e.parent === img.id && e.boxIndex === i)) return;
    if (b.type === 'button' && b.sig && S.elements.some(e => e.type === 'button' && e.box.sig === b.sig)) { dup++; return; }
    S.elements.push({id: uid('el'), parent: img.id, boxIndex: i, type: b.type, box: b, conf: b.conf || Math.round((.82 + ((i * 37 + img.w) % 16) / 100) * 100) / 100, src: crop(img.canvas, b), source: 'auto'});
  });
  img.dupes = dup;
}
const FOOT = {...DETECT, band: [0.02, 0.2], minBandPx: 48};
/* Footer = the same band test run on the vertically flipped image */
function detectBand(c0, side) {
  let c = c0;
  if (side === 'bottom') { c = document.createElement('canvas'); c.width = c0.width; c.height = c0.height; const g = c.getContext('2d'); g.translate(0, c.height); g.scale(1, -1); g.drawImage(c0, 0, 0); }
  const r = detectHeader(c, side === 'bottom' ? FOOT : DETECT);
  if (!r) return null;
  return side === 'bottom' ? {...r, type: 'footer', y: c0.height - r.h, note: 'Uniform bottom band, clear edge above it, content on the left and right'} : r;
}
function detectHeader(c, P = DETECT) {
  const w = c.width, h = c.height;
  if (w < P.minWidth || w / h < P.aspect[0] || w / h > P.aspect[1]) return null;
  const sw = 360, sh = Math.round(h * sw / w), k = h / sh;
  const t = document.createElement('canvas'); t.width = sw; t.height = sh;
  const g = t.getContext('2d', {willReadFrequently: true}); g.drawImage(c, 0, 0, sw, sh);
  const d = g.getImageData(0, 0, sw, sh).data, px = (x, y) => { const o = (y * sw + x) * 4; return [d[o], d[o + 1], d[o + 2]]; };
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const rows = [];
  for (let y = 0; y < sh; y++) { const s = [0, 0, 0]; for (let x = 0; x < sw; x++) { const o = (y * sw + x) * 4; s[0] += d[o]; s[1] += d[o + 1]; s[2] += d[o + 2]; } rows.push(s.map(v => v / sw)); }
  const avg = (a, b) => { const s = [0, 0, 0]; for (let y = a; y < b; y++) for (let j = 0; j < 3; j++) s[j] += rows[y][j]; return s.map(v => v / (b - a)); };
  /* how much a row varies across its width: a header ends under its own plain padding, not under a logo */
  const rowVar = rows.map((m, y) => { let s = 0; for (let x = 0; x < sw; x += 2) s += dist(px(x, y), m); return s / (sw / 2); });
  const plainAbove = y => (rowVar[y - 1] + rowVar[y - 2]) / 2 < 12;
  let best = null;
  const y1 = Math.max(Math.ceil(sh * P.band[0]), Math.ceil(P.minBandPx / k), 3), y2 = Math.floor(sh * P.band[1]);
  for (let y = y1; y <= y2 && y + 4 < sh; y++) {
    const edge = dist(avg(y - 3, y), avg(y, y + 3));
    const line = Math.min(dist(rows[y], rows[y - 2]), dist(rows[y], rows[y + 2])) >= P.lineDelta && dist(rows[y - 2], rows[y + 2]) < 8;
    const score = plainAbove(y) ? Math.max(edge >= P.edgeDelta ? edge : 0, line ? P.edgeDelta + 4 : 0) : 0;
    if (score && (!best || score > best.score)) best = {y, score};
  }
  if (!best) return null;
  const by = best.y, q = new Map();
  for (let y = 0; y < by; y++) for (let x = 0; x < sw; x += 2) { const p = px(x, y), key = (p[0] >> 4) + ',' + (p[1] >> 4) + ',' + (p[2] >> 4); q.set(key, (q.get(key) || 0) + 1); }
  const mode = [...q].sort((a, b) => b[1] - a[1])[0][0].split(',').map(v => v * 16 + 8);
  let bg = 0, tot = 0, ink = 0; const col = new Array(sw).fill(0);
  for (let y = 1; y < by - 1; y++) for (let x = 0; x < sw; x++) { const dd = dist(px(x, y), mode); tot++; if (dd <= P.bgTol) bg++; if (dd > P.inkTol) { ink++; col[x] = 1; } }
  if (!tot || bg / tot < P.bgShare) return null;
  const cov = ink / tot; if (cov < P.inkCoverage[0] || cov > P.inkCoverage[1]) return null;
  const cl = []; let gap = Infinity;
  for (let x = 0; x < sw; x++) { if (col[x]) { if (gap > sw * P.clusterGap) cl.push([x, x]); else cl[cl.length - 1][1] = x; gap = 0; } else gap++; }
  const real = cl.filter(r => r[1] - r[0] + 1 >= sw * .01);
  if (real.length < P.minClusters || real[0][0] > sw * P.leftStart || real[real.length - 1][1] < sw * P.rightEnd) return null;
  const conf = Math.min(.95, .5 + Math.min(.3, best.score / 100) + (real.length >= 3 ? .1 : .05));
  if (conf < P.minConf) return null;
  return {type: 'header', x: 0, y: 0, w, h: Math.round((by + 1) * k), conf: Math.round(conf * 100) / 100, note: 'Uniform top band, clear edge below it, logo and navigation found inside'};
}
function finishTags(img) { for (const t of img.autoTags) if (!img.tags.includes(t) && !S.deletedTags.has(t)) img.tags.push(t); applyCustomTags(img); }
/* Deleting a tag removes it from every design and its folder; the images themselves stay */
function deleteTag(t) {
  if (PINNED.includes(t)) return;
  const had = S.images.filter(i => i.tags.includes(t));
  confirmBox(`Delete tag “${esc(t)}”?`, `It will be removed from ${had.length} ${had.length === 1 ? 'design' : 'designs'}. The images stay in Recently saved.`, 'Delete tag', () => {
    had.forEach(i => i.tags = i.tags.filter(x => x !== t));
    const wasCustom = S.customTags.includes(t); S.customTags = S.customTags.filter(x => x !== t); S.deletedTags.add(t);
    if (S.nav.folder.k === 'tag' && S.nav.folder.v === t) S.nav = {view: 'grid', folder: {k: 'recent'}};
    render();
    toast(`Tag “${t}” deleted`, 'Undo', () => { S.deletedTags.delete(t); if (wasCustom) S.customTags.push(t); had.forEach(i => i.tags.includes(t) || i.tags.push(t)); render(); });
  });
}
const gone = img => !S.images.includes(img);
const elsOf = id => S.elements.filter(e => e.parent === id).sort((a, b) => a.box.y - b.box.y || a.box.x - b.box.x);
function process(img, quiet) {
  img.status = 'processing'; render();
  setTimeout(() => { if (gone(img)) return; finishTags(img); render(); }, 700);
  setTimeout(() => {
    if (gone(img)) return; makeElements(img); img.status = 'ready'; render();
    if (!quiet) toast(`Saved to Recently saved · ${img.tags.length} ${img.tags.length === 1 ? 'tag' : 'tags'} · ${elsOf(img.id).length} elements${img.dupes ? ` · ${img.dupes} duplicate ${img.dupes === 1 ? 'button' : 'buttons'} skipped` : ''}`,'Open', () => go({view: 'image', id: img.id, folder: {k: 'recent'}}));
  }, 1500);
}
const now = Date.now();
if (!(window.chrome && chrome.runtime && chrome.runtime.id)) {   /* sample designs only in the web prototype */
  SPECS.forEach((s, i) => { const img = addFromSpec(s, i + 1, now - (i + 1) * 3.4 * 3600e3, 'ready'); finishTags(img); makeElements(img); });
  addFromSpec(FAILED, 42, now - 30 * 60e3, 'failed');
}

/* ---------- Folders ---------- */
const fkey = f => f.k + ':' + (f.v || '');
const sameF = (a, b) => a && b && fkey(a) === fkey(b);
function folderLabel(f) { return f.k === 'recent' ? 'Recently saved' : f.k === 'tag' ? f.v : f.k === 'type' ? TYPES[f.v].label : f.k === 'links' ? 'Links' : 'Needs attention'; }
/* Pinned tag folders are always visible, even when empty; tags you add stay visible too */
const PINNED = ['mobile design', 'mobile prototype'];
function tagCounts() {
  const m = new Map();
  for (const i of S.images) for (const t of i.tags) m.set(t, (m.get(t) || 0) + 1);
  for (const t of [...PINNED, ...S.customTags]) if (!m.has(t)) m.set(t, 0);
  return [...m].sort((a, b) => (PINNED.includes(b[0]) - PINNED.includes(a[0])) || b[1] - a[1] || a[0].localeCompare(b[0]));
}
/* A tag you add is applied by matching its words against each design's name, text, site and notes.
   The real app uses image recognition for this; the rule here keeps the prototype honest about what it can know. */
function tagMatches(img, tag) {
  const hay = [img.text || '', img.name, img.site, ...(img.notes || []).map(n => n.text)].join(' ').toLowerCase();
  return tag.split(/\s+/).filter(w => w.length >= 3).some(w => hay.includes(w.replace(/s$/, '')));
}
function applyCustomTags(img) { for (const t of S.customTags) if (!img.tags.includes(t) && tagMatches(img, t)) img.tags.push(t); }
function matchQ(img) { const q = S.q.trim().toLowerCase(); return !q || img.name.toLowerCase().includes(q) || img.site.includes(q) || img.tags.some(t => t.includes(q)); }
function imagesIn(f) {
  return S.images.filter(i => f.k === 'recent' || (f.k === 'tag' && i.tags.includes(f.v)) || (f.k === 'attention' && i.status === 'failed'))
    .filter(matchQ).sort((a, b) => b.savedAt - a.savedAt);
}
function elementsIn(type) {
  return S.elements.filter(e => e.type === type).map(e => [e, S.images.find(i => i.id === e.parent)]).filter(([, p]) => p && matchQ(p))
    .sort((a, b) => b[1].savedAt - a[1].savedAt).map(([e]) => e);
}
function rel(t) { const m = Math.round((Date.now() - t) / 60e3); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; }

/* ---------- Navigation ---------- */
function valid(n) { return n.view === 'grid' || (n.view === 'image' ? S.images.some(i => i.id === n.id) : S.elements.some(e => e.id === n.id)); }
function go(n) { S.back.push(S.nav); S.fwd = []; S.nav = n; render(); $('view').scrollTop = 0; window.scrollTo(0, 0); }
function goBack() { while (S.back.length) { const n = S.back.pop(); if (valid(n)) { S.fwd.push(S.nav); S.nav = n; return render(); } } }
function goFwd() { while (S.fwd.length) { const n = S.fwd.pop(); if (valid(n)) { S.back.push(S.nav); S.nav = n; return render(); } } }

/* ---------- Rendering ---------- */
function navBtn(f, label, n, extra) {
  const cur = S.nav.view === 'grid' && sameF(S.nav.folder, f);
  return `<button class="nav ${extra || ''}" data-act="folder" data-k="${f.k}" data-v="${esc(f.v || '')}" aria-current="${cur}">${label}<span class="n">${n}</span></button>`;
}
function renderSide() {
  const tags = tagCounts(), failed = S.images.filter(i => i.status === 'failed').length;
  let h = `<div class="brand"><i role="img" aria-label="Refbox logo"></i>Refbox</div>`;
  h += `<div class="group">${navBtn({k: 'recent'}, '<span class="ico">◷</span><span class="lbl">Recently saved</span>', S.images.length)}</div>`;
  h += `<div class="group"><div class="glabel">Elements</div>${Object.entries(TYPES).map(([k, t]) => navBtn({k: 'type', v: k}, `<span class="dot" style="background:${t.c}"></span><span class="lbl">${t.label}</span>`, S.elements.filter(e => e.type === k).length)).join('')}</div>`;
  h += `<div class="group"><div class="glabel ghead">Tags<button class="plus" data-act="new-tag" aria-label="Add a tag" title="Add a tag" aria-expanded="${!!S.addingTag}">+</button></div>
    ${S.addingTag ? `<form class="newtag" data-form="newtag"><input id="newtag-input" placeholder="New tag, e.g. hotel" aria-label="New tag name" autocomplete="off"><button class="btn" type="submit">Add</button></form>` : ''}
    ${tags.map(([t, n]) => `<div class="tagrow" data-tag="${esc(t)}">${navBtn({k: 'tag', v: t}, `<span class="ico">${PINNED.includes(t) ? '▯' : '#'}</span><span class="lbl">${esc(t)}</span>`, n)}${PINNED.includes(t) ? '' : `<button class="del" data-act="del-tag" data-v="${esc(t)}" aria-label="Delete tag ${esc(t)}" title="Delete tag">×</button>`}</div>`).join('')}</div>`;
  h += `<div class="group">${navBtn({k: 'links'}, '<span class="ico">↗</span><span class="lbl">Links</span>', S.links.length)}</div>`;
  if (failed) h += `<div class="group">${navBtn({k: 'attention'}, '<span class="ico">!</span><span class="lbl">Needs attention</span>', failed, 'attn')}</div>`;
  h += `<div class="keys"><kbd>/</kbd><span>Search</span><kbd>Esc</kbd><span>Back</span><kbd>E</kbd><span>Toggle outlines</span><kbd>P</kbd><span>Open full design</span><kbd>← →</kbd><span>Next image</span></div>`;
  $('side').innerHTML = h;
}
function renderTop() {
  $('back').disabled = !S.back.length; $('fwd').disabled = !S.fwd.length;
  const n = S.nav, f = n.folder, parts = [];
  if (f.k === 'type') parts.push(['Elements', null]);
  parts.push([folderLabel(f), n.view === 'grid' ? null : 'f']);
  if (n.view === 'image') parts.push([S.images.find(i => i.id === n.id).name, null]);
  if (n.view === 'element') { const e = S.elements.find(x => x.id === n.id); parts.push([TYPES[e.type].label + ' from ' + S.images.find(i => i.id === e.parent).name, null]); }
  $('crumbs').innerHTML = parts.map(([t, a], i) => (i ? '<span aria-hidden="true">›</span>' : '') + (a ? `<button data-act="folder" data-k="${f.k}" data-v="${esc(f.v || '')}">${esc(t)}</button>` : `<span class="${i === parts.length - 1 ? 'cur' : ''}">${esc(t)}</span>`)).join('');
}
/* In Recently saved a card shows only the picture; details open with the i button, right-click or "Show details" */
function imgCard(i, bare) {
  const n = elsOf(i.id).length, open = !bare || S.details || S.open.has(i.id);
  const st = i.status === 'processing' ? '<span class="badge proc"><span class="spin"></span>Processing</span>' : i.status === 'failed' ? '<span class="badge fail">Processing failed</span>' : '';
  return `<article class="card ${open ? '' : 'bare'}" data-id="${i.id}"><div class="tw">
    <button class="thumb" data-act="open-img" data-id="${i.id}" aria-label="Open ${esc(i.name)}"><img src="${i.src}" alt="">${st}${open && i.status === 'ready' ? `<span class="badge">◧ ${n}</span>` : ''}</button>
    ${bare ? infoBtn(i.id, i.name, open) : ''}</div>
    ${open ? `<div class="meta"><span class="t">${esc(i.name)}</span><span class="s">${esc(i.site)} · ${rel(i.savedAt)}</span>
    <div class="mini-tags">${i.tags.length ? i.tags.map(t => `<span>${esc(t)}</span>`).join('') : '<span>no tags</span>'}</div></div>` : ''}</article>`;
}
const infoBtn = (id, name, open) => `<button class="info" data-act="toggle-info" data-id="${id}" aria-expanded="${open}" aria-label="${open ? 'Hide' : 'Show'} details for ${esc(name)}" title="${open ? 'Hide' : 'Show'} details (or right-click)">${open ? '×' : 'i'}</button>`;
function elCard(e) {
  const p = S.images.find(i => i.id === e.parent), open = S.details || S.open.has(e.id);
  return `<article class="card ecard ${open ? '' : 'bare'}" style="--tc:${TYPES[e.type].c}"><div class="tw">
    <button class="thumb" data-act="open-el" data-id="${e.id}" aria-label="Open ${TYPES[e.type].label} from ${esc(p.name)}"><img src="${e.src}" alt=""></button>
    ${infoBtn(e.id, p.name, open)}<button class="up" data-act="open-parent" data-id="${e.id}" aria-label="Open full design ${esc(p.name)}" title="Open full design">↗</button></div>
    ${open ? `<div class="meta"><span class="t">${esc(p.name)}</span>
    <div class="row"><span class="s">${Math.round(e.conf * 100)}% · ${esc(p.site)}</span><button class="link" data-act="open-parent" data-id="${e.id}">Full design ↗</button></div></div>` : ''}</article>`;
}
const detailsToggle = () => `<button class="btn tog" data-act="details-all" aria-pressed="${S.details}">${S.details ? 'Hide details' : 'Show details'}</button>`;
function renderLinks() {
  return `<div class="head"><h1>Links</h1><span class="count">${S.links.length} sites</span></div>
    <form class="linkform" data-form="link"><input id="link-url" type="url" placeholder="https://site-you-liked.com" aria-label="Site address" required><input id="link-name" placeholder="Name (optional)" aria-label="Name"><button class="btn primary" type="submit">+ Add link</button></form>
    ${S.links.length ? `<ul class="links">${S.links.map(l => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener"><span class="ln">${esc(l.name)}</span><span class="lu">${esc(l.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</span></a>${l.from ? `<span class="lf">${esc(l.from)}</span>` : ''}<button class="x" data-act="rm-link" data-id="${l.id}" aria-label="Delete link ${esc(l.name)}">×</button></li>`).join('')}</ul>` : '<div class="empty"><b>No links yet.</b><span>Add a site above, or use the browser extension to save the page you are on.</span></div>'}`;
}
function renderGrid() {
  const f = S.nav.folder;
  if (f.k === 'links') return renderLinks();
  if (f.k === 'type') {
    const list = elementsIn(f.v);
    return `<div class="head"><h1>${TYPES[f.v].label}</h1><span class="count">${list.length} elements</span>${detailsToggle()}</div>` +
      (list.length ? `<div class="grid">${list.map(elCard).join('')}</div>` : empty(S.q ? 'Nothing matches your search.' : `No ${TYPES[f.v].label.toLowerCase()} elements yet.`, ''));
  }
  const list = imagesIn(f);
  return `<div class="head"><h1>${esc(folderLabel(f))}</h1><span class="count">${list.length} images</span>${detailsToggle()}</div>` +
    (list.length ? `<div class="grid">${list.map(i => imgCard(i, true)).join('')}</div>` : f.k === 'tag' && !S.q ? empty(`No designs tagged “${esc(f.v)}” yet.`, '') :empty(S.q ? 'Nothing matches your search.' : 'Nothing saved yet.', S.q ? '' : 'Turn on capture and save an image on Dribbble or Pinterest, or import files.'));
}
function empty(a, b) { return `<div class="empty"><b>${a}</b>${b ? `<span>${b}</span>` : ''}${S.q ? '<button class="btn" data-act="clear-q">Clear search</button>' : '<button class="btn" data-act="simulate">Simulate save</button>'}</div>`; }
const pct = (v, t) => (v / t * 100).toFixed(3) + '%';
function renderImage() {
  const i = S.images.find(x => x.id === S.nav.id), els = elsOf(i.id), hl = S.nav.hl;
  const boxes = els.map(e => `<button class="box ${e.id === hl ? 'on' : ''}" style="--tc:${TYPES[e.type].c};left:${pct(e.box.x, i.w)};top:${pct(e.box.y, i.h)};width:${pct(e.box.w, i.w)};height:${pct(e.box.h, i.h)}" data-act="open-el" data-id="${e.id}" aria-label="Open ${TYPES[e.type].label}"><span class="tab">${TYPES[e.type].label}</span></button>`).join('');
  const strip = els.length ? els.map(e => `<button class="el" style="--tc:${TYPES[e.type].c}" data-act="open-el" data-id="${e.id}"><span class="im"><img src="${e.src}" alt=""></span><span class="l"><span class="dot" style="background:${TYPES[e.type].c}"></span>${TYPES[e.type].label}</span></button>`).join('')
    : `<div class="note">${i.status === 'ready' ? 'No elements found on this image.' : i.status === 'failed' ? 'Elements were not detected because processing failed.' : 'Detecting elements…'}</div>`;
  const folders = [{k: 'recent'}, ...i.tags.map(t => ({k: 'tag', v: t}))];
  return `<div class="detail"><div class="col">
    <div class="bar"><button class="btn" id="peek-btn" data-act="outlines" aria-pressed="${S.outlines}" ${els.length ? '' : 'disabled'}>◧ ${S.outlines ? 'Hide elements' : 'Show elements'}</button>${hl ? '<button class="btn" data-act="clear-hl">Clear highlight</button>' : ''}<button class="btn" data-act="copy" title="Copy image (⌘C)">⧉ Copy for Figma</button><span class="seg" role="group" aria-label="Zoom"><button data-act="zoom" data-v="fit" aria-pressed="${S.zoom !== 'actual'}">Fit width</button><button data-act="zoom" data-v="actual" aria-pressed="${S.zoom === 'actual'}">100%</button></span><span class="hint">${els.length ? (S.outlines ? 'Click an outline to open that element.' : 'Hover to preview the breakdown, click to keep it on.') : ''}</span></div>
    <div class="stage ${hl ? 'hl' : ''} ${S.outlines ? '' : 'off'}" id="stage" tabindex="0" aria-label="${esc(i.name)}, scrollable"><div class="canvas" style="width:${S.zoom === 'actual' ? i.w + 'px' : '100%'}"><img src="${i.src}" alt="${esc(i.name)}">${boxes}</div></div>
    <section class="sec"><h2>Elements (${els.length})</h2><div class="strip">${strip}</div></section>
  </div>
  <aside class="panel">
    ${i.status === 'failed' ? '<div class="note warn">Processing failed: tags and elements are missing. The image itself is saved.</div><button class="btn primary wide" data-act="reprocess">Try again</button>' : ''}
    ${i.status === 'processing' ? '<div class="note"><span class="spin" style="display:inline-block;vertical-align:-1px;margin-right:6px;border-color:var(--line);border-top-color:var(--acc)"></span>Tagging and detecting elements…</div>' : ''}
    <dl class="ess"><div><dt>Saved</dt><dd>${new Date(i.savedAt).toLocaleString([], {dateStyle: 'medium', timeStyle: 'short'})}</dd></div>
      <div><dt>Source</dt><dd>${i.page ? `<a href="${esc(i.page)}" target="_blank" rel="noopener">${esc(i.site)} ↗</a>` : i.demo ? 'Imported file' : `<a href="https://${esc(i.site)}" target="_blank" rel="noopener">${esc(i.site)} ↗</a>`}</dd></div></dl>
    <details class="more" id="more" ${S.moreOpen ? 'open' : ''}><summary>More <span>${i.tags.length} ${i.tags.length === 1 ? 'tag' : 'tags'} · ${els.length} elements</span></summary><div class="more-in">
    <section class="sec"><h2>Tags</h2>
      <div class="tags">${i.tags.map(t => `<span class="tag"><button data-act="folder" data-k="tag" data-v="${esc(t)}" title="Open folder">${esc(t)}</button><button class="x" data-act="rm-tag" data-v="${esc(t)}" aria-label="Remove tag ${esc(t)}">×</button></span>`).join('') || '<span style="color:var(--mute);font-size:12.5px">No confident tags. Add one below.</span>'}</div>
      <form class="tagform" data-form="tag"><input id="tag-input" list="tag-list" placeholder="Add tag" aria-label="Add tag" autocomplete="off"><button class="btn" type="submit">Add</button></form>
      <datalist id="tag-list">${tagCounts().map(([t]) => `<option value="${esc(t)}">`).join('')}</datalist>
    </section>
    <section class="sec"><h2>In folders</h2><div class="flist">${folders.map(f => `<button class="nav" data-act="folder" data-k="${f.k}" data-v="${esc(f.v || '')}"><span class="ico">${f.k === 'recent' ? '◷' : '#'}</span><span class="lbl">${esc(folderLabel(f))}</span></button>`).join('')}</div></section>
    <section class="sec"><h2>File</h2><dl class="kv"><dt>Size</dt><dd>${i.w} × ${i.h} px</dd></dl>
    ${i.demo ? '<div class="note">Only header and footer detection run on your own images in this prototype, and each saves only when every check passes.</div>' : ''}
    ${i.dupes ? `<div class="note">${i.dupes} ${i.dupes === 1 ? 'button was' : 'buttons were'} not saved: same shape and color as a button already in the library.</div>` : ''}</section>
    <section class="sec"><h2>Actions</h2><div class="bar">${i.status === 'ready' ? '<button class="btn" data-act="reprocess">⟳ Reprocess</button>' : ''}<button class="btn danger" data-act="del-img">Delete image</button></div></section>
    </div></details>
    ${notesFooter(i)}
  </aside></div>`;
}
/* Compact footer of the info panel: what I liked + notes (typed or dictated) */
const LIKES = ['Layout', 'Typography', 'Color', 'Buttons', 'Imagery', 'Mood'];
function draftFor(i) { if (!S.draft || S.draft.id !== i.id) S.draft = {id: i.id, text: '', liked: new Set(), via: 'typed'}; return S.draft; }
function notesFooter(i) {
  const d = draftFor(i), notes = i.notes || [], shown = S.allNotes ? notes : notes.slice(-2);
  return `<footer class="likes" aria-label="Notes">
    <h2>What I liked</h2>
    <div class="lchips">${LIKES.map(l => `<button class="lchip" data-act="like" data-v="${l}" aria-pressed="${d.liked.has(l)}">${l}</button>`).join('')}</div>
    ${notes.length ? `<ul class="notes">${shown.slice().reverse().map(n => `<li><div class="nt">${n.liked.length ? `<b>${n.liked.map(esc).join(' · ')}</b>` : ''}${n.text ? `<span>${esc(n.text)}</span>` : ''}</div><div class="nm"><span>${n.via === 'dictated' ? '🎙 ' : ''}${rel(n.at)}</span><button class="x" data-act="rm-note" data-id="${n.id}" aria-label="Delete note">×</button></div></li>`).join('')}</ul>${notes.length > 2 ? `<button class="link" data-act="all-notes">${S.allNotes ? 'Show fewer' : `Show all notes (${notes.length})`}</button>` : ''}` : ''}
    <form class="noteform" data-form="note"><textarea id="note-input" rows="2" placeholder="Why did you save it? Type or dictate">${esc(d.text)}</textarea>
    <div class="row"><button type="button" class="ib mic" id="mic" data-act="dictate" aria-pressed="false" aria-label="Dictate a note" title="Dictate a note">🎙</button><button class="btn primary" type="submit">Save note</button></div></form>
  </footer>`;
}
function loadNotes(img) { try { const v = JSON.parse(localStorage.getItem('refbox-notes:' + img.name) || '[]'); if (Array.isArray(v)) img.notes = v; } catch (e) {} }
function saveNotes(img) { try { localStorage.setItem('refbox-notes:' + img.name, JSON.stringify(img.notes || [])); } catch (e) {} }
function renderElement() {
  const e = S.elements.find(x => x.id === S.nav.id), p = S.images.find(i => i.id === e.parent), t = TYPES[e.type];
  const sib = elsOf(p.id).filter(x => x.id !== e.id), more = elementsIn(e.type).filter(x => x.parent !== e.parent);
  const tail = `<section class="sec gal"><div class="head"><h2 class="h2b">More ${t.pl} from other designs</h2><span class="count">${more.length}</span></div>
    ${more.length ? `<div class="grid">${more.map(elCard).join('')}</div>` : `<div class="note">No other ${t.pl} saved yet.</div>`}</section>
    <section class="sec same"><h2>Other elements of ${esc(p.name)}</h2><div class="strip">${sib.length ? sib.map(x => `<button class="el" style="--tc:${TYPES[x.type].c}" data-act="open-el" data-id="${x.id}"><span class="im"><img src="${x.src}" alt=""></span><span class="l"><span class="dot" style="background:${TYPES[x.type].c}"></span>${TYPES[x.type].label}</span></button>`).join('') : '<div class="note">This is the only element from this design.</div>'}</div></section>`;
  return `<div class="detail" style="--tc:${t.c}"><div class="col">
    <div class="crop"><img src="${e.src}" alt="${t.label} from ${esc(p.name)}"></div>
    <div class="typeline"><span class="dot" style="background:${t.c};width:12px;height:12px"></span><span class="tname">${t.label}</span><span class="conf">${e.source === 'user' ? 'type set by you' : Math.round(e.conf * 100) + '% confidence'} · ${Math.round(e.box.w)} × ${Math.round(e.box.h)} px</span></div>
    ${e.box.note ? `<div class="note">${esc(e.box.note)}</div>` : ''}
  </div>
  <aside class="panel">
    <section class="sec"><h2>Parent design</h2>
      <button class="parent" data-act="open-parent" data-id="${e.id}" aria-label="Open full design ${esc(p.name)}"><img src="${p.src}" alt=""><span class="ol" style="left:${pct(e.box.x, p.w)};top:${pct(e.box.y, p.h)};width:${pct(e.box.w, p.w)};height:${pct(e.box.h, p.h)}"></span></button>
      <span style="font-weight:500">${esc(p.name)} <span style="color:var(--mute);font-weight:400;font-family:var(--f-mono);font-size:12px">· ${esc(p.site)}</span></span>
      <button class="btn primary wide" data-act="open-parent" data-id="${e.id}">↗ Open full design</button>
      <button class="btn wide" data-act="copy" title="Copy element (⌘C)">⧉ Copy for Figma</button>
    </section>
    <section class="sec"><h2>Element type</h2><select id="type-select" data-act="set-type" aria-label="Element type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${k === e.type ? 'selected' : ''}>${v.label}</option>`).join('')}</select></section>
    <section class="sec"><h2>Actions</h2><div class="bar"><button class="btn danger" data-act="del-el">Delete element</button></div></section>
  </aside></div>${tail}`;
}
function render() {
  if (!valid(S.nav)) S.nav = {view: 'grid', folder: S.nav.folder && (S.nav.folder.k !== 'tag' || tagCounts().some(([t]) => t === S.nav.folder.v)) ? S.nav.folder : {k: 'recent'}};
  renderSide(); renderTop();
  const v = S.nav.view;
  $('view').innerHTML = v === 'grid' ? renderGrid() : v === 'image' ? renderImage() : renderElement();
  const on = v === 'image' && document.querySelector('#stage .box.on');
  if (on) { const st = $('stage'); st.scrollTop = on.offsetTop - st.clientHeight / 2 + on.offsetHeight / 2; }
}

/* ---------- Toast & confirm ---------- */
let tt;
function toast(msg, label, fn) {
  const t = $('toast'); t.innerHTML = `<span>${esc(msg)}</span>` + (label ? `<button class="btn primary" id="toast-act">${label}</button>` : '');
  t.hidden = false; if (label) $('toast-act').onclick = () => { t.hidden = true; fn(); };
  clearTimeout(tt); tt = setTimeout(() => t.hidden = true, 4500);
}
function confirmBox(title, text, ok, fn) {
  const m = $('modal');
  m.innerHTML = `<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-t"><h3 id="dlg-t">${title}</h3><p>${text}</p><div class="bar"><button class="btn" id="dlg-no">Cancel</button><button class="btn primary" id="dlg-ok" style="background:var(--bad);color:#1a0b0b">${ok}</button></div></div>`;
  m.hidden = false; $('dlg-no').focus();
  $('dlg-no').onclick = () => m.hidden = true;
  $('dlg-ok').onclick = () => { m.hidden = true; fn(); };
}

/* ---------- Actions ---------- */
/* Copy the open image or element as PNG, ready for ⌘V in Figma */
function pngFromDataURL(u) { const b = atob(u.split(',')[1]), a = new Uint8Array(b.length); for (let k = 0; k < b.length; k++) a[k] = b.charCodeAt(k); return new Blob([a], {type: 'image/png'}); }
function copyCurrent() {
  const v = S.nav.view; if (v === 'grid') return;
  const blob = v === 'image' ? new Promise(res => curImg().canvas.toBlob(res, 'image/png')) : Promise.resolve(pngFromDataURL(curEl().src));
  try {
    navigator.clipboard.write([new ClipboardItem({'image/png': blob})])
      .then(() => toast('Copied. Paste into Figma with ⌘V.'))
      .catch(() => toast('This preview blocks copying images. In the desktop app ⌘C copies straight to Figma.'));
  } catch (e) { toast('This preview blocks copying images. In the desktop app ⌘C copies straight to Figma.'); }
}
function curImg() { return S.images.find(i => i.id === S.nav.id); }
function curEl() { return S.elements.find(e => e.id === S.nav.id); }
function openParent(id) { const e = S.elements.find(x => x.id === id); go({view: 'image', id: e.parent, folder: S.nav.folder, hl: e.id}); }
function simulate() {
  const spec = EXTRA[S.extra % EXTRA.length];
  if (!S.capture) return toast(`Capture is off: “${spec.name}” went to your Downloads folder as usual.`);
  S.extra++;
  const img = addFromSpec(spec, 100 + S.extra, Date.now(), 'received');
  if (S.extra > EXTRA.length) img.name += ' ' + Math.ceil(S.extra / EXTRA.length);
  toast(`Captured from ${spec.site}`);
  process(img);
}
/* One path for every real image: imported files and, in the extension, captures from the browser */
function addBlob(blob, meta) {
  const fr = new FileReader();
  fr.onload = () => {
    const im = new Image();
    im.onload = () => {
      const sc = Math.min(1, 1400 / im.naturalWidth), w = Math.round(im.naturalWidth * sc), h = Math.round(im.naturalHeight * sc);
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h);
      const ratio = h / w, mobile = ratio >= 1.9 && ratio <= 2.4;   /* phone screen proportions, e.g. 1179×2556 */
      const img = {id: uid('img'), name: meta.name, site: meta.site || 'imported file', page: meta.page, capId: meta.capId, autoTags: mobile ? ['mobile design'] : [], tags: loadTags(meta.capId), canvas: c, src: c.toDataURL('image/jpeg', .9), w, h, demo: true,
        boxes: [detectBand(c, 'top'), detectBand(c, 'bottom')].filter(Boolean), removed: new Set(), savedAt: meta.savedAt || Date.now(), status: 'received'};
      S.images.push(img); loadNotes(img); process(img, meta.quiet);
    };
    im.onerror = () => toast(`“${meta.name}” could not be read. Try a PNG, JPEG or WebP file.`);
    im.src = fr.result;
  };
  fr.readAsDataURL(blob);
}
function importFiles(files) {
  [...files].filter(f => f.type.startsWith('image/')).forEach((f, k) => addBlob(f, {name: f.name.replace(/\.[^.]+$/, ''), savedAt: Date.now() + k}));
}
function loadTags(capId) { if (!capId) return []; try { const v = JSON.parse(localStorage.getItem('refbox-tags:' + capId) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
function saveTags() { for (const i of S.images) if (i.capId) try { localStorage.setItem('refbox-tags:' + i.capId, JSON.stringify(i.tags)); } catch (e) {} }

/* ---------- Extension mode: real captures from Chrome ---------- */
const EXT = !!(window.chrome && chrome.runtime && chrome.runtime.id);
const idb = () => new Promise((res, rej) => { const r = indexedDB.open('refbox', 1); r.onupgradeneeded = () => r.result.createObjectStore('captures', {keyPath: 'id'}); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function idbAll() { const d = await idb(); return new Promise((res, rej) => { const q = d.transaction('captures').objectStore('captures').getAll(); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }
async function idbDel(id) { const d = await idb(); d.transaction('captures', 'readwrite').objectStore('captures').delete(id); }
async function loadCaptures(quiet) {
  const known = new Set(S.images.map(i => i.capId));
  for (const r of (await idbAll()).sort((a, b) => a.savedAt - b.savedAt)) if (!known.has(r.id)) addBlob(r.blob, {name: r.name, site: r.site, page: r.page, capId: r.id, savedAt: r.savedAt, quiet});
}
const ACT = {
  back: goBack, fwd: goFwd,
  folder: el => go({view: 'grid', folder: ['recent', 'attention', 'links'].includes(el.dataset.k) ? {k: el.dataset.k} : {k: el.dataset.k, v: el.dataset.v}}),
  'open-img': el => go({view: 'image', id: el.dataset.id, folder: S.nav.folder, hl: null}),
  'open-el': el => go({view: 'element', id: el.dataset.id, folder: S.nav.folder}),
  'open-parent': el => openParent(el.dataset.id),
  outlines: () => { S.outlines = !S.outlines; render(); },
  'clear-hl': () => { S.nav = {...S.nav, hl: null}; render(); },
  'clear-q': () => { S.q = ''; $('q').value = ''; render(); },
  simulate,
  capture: () => { S.capture = !S.capture; if (EXT) chrome.storage.local.set({enabled: S.capture}); $('capture').setAttribute('aria-pressed', S.capture); $('capLbl').textContent = S.capture ? 'Capture on' : 'Capture off'; toast(S.capture ? 'Capture is on. Saved images go to Recently saved.' : 'Capture is off. Images save to Downloads as usual.'); },
  'rm-tag': el => { const i = curImg(), t = el.dataset.v; i.tags = i.tags.filter(x => x !== t); render(); toast(`Removed “${t}” from ${i.name}`, 'Undo', () => { if (!i.tags.includes(t)) i.tags.push(t); render(); }); },
  reprocess: () => process(curImg(), false),
  'del-img': el => {
    const i = S.images.find(x => x.id === (el.dataset.id || S.nav.id)), n = elsOf(i.id).length;
    confirmBox(`Delete “${esc(i.name)}”?`, `The image and its ${n} ${n === 1 ? 'element' : 'elements'} will be removed from every folder.`, 'Delete', () => {
      S.images = S.images.filter(x => x !== i); S.elements = S.elements.filter(e => e.parent !== i.id);
      if (i.capId) { idbDel(i.capId).catch(() => {}); try { localStorage.removeItem('refbox-tags:' + i.capId); } catch (e) {} }
      if (S.nav.view !== 'grid') S.nav = {view: 'grid', folder: S.nav.folder}; render(); toast(`Deleted “${i.name}” and ${n} elements`);
    });
  },
  'toggle-info': el => {
    const id = el.dataset.id;
    if (S.details) { S.details = false; document.querySelectorAll('.info').forEach(b => b.dataset.id !== id && S.open.add(b.dataset.id)); }
    else if (S.open.has(id)) S.open.delete(id); else S.open.add(id);
    render();
  },
  'del-tag': el => deleteTag(el.dataset.v),
  'new-tag': () => { S.addingTag = !S.addingTag; render(); if (S.addingTag) $('newtag-input').focus(); },
  'rm-link': el => { const l = S.links.find(x => x.id === el.dataset.id); S.links = S.links.filter(x => x !== l); render(); toast(`Removed “${l.name}”`, 'Undo', () => { S.links.push(l); render(); }); },
  theme: () => setTheme(S.theme === 'light' ? 'dark' : 'light'),
  zoom: el => { S.zoom = el.dataset.v; render(); },
  copy: () => copyCurrent(),
  'details-all': () => { S.details = !S.details; S.open.clear(); render(); },
  like: el => { const d = S.draft, v = el.dataset.v; d.liked.has(v) ? d.liked.delete(v) : d.liked.add(v); el.setAttribute('aria-pressed', d.liked.has(v)); },
  'rm-note': el => { const i = curImg(); i.notes = (i.notes || []).filter(n => n.id !== el.dataset.id); saveNotes(i); render(); toast('Note deleted'); },
  'all-notes': () => { S.allNotes = !S.allNotes; render(); },
  dictate: btn => {
    if (S.rec) return S.rec.stop();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return toast('Dictation is not supported in this browser. Type the note instead.');
    const ta = $('note-input'), base = ta.value.trim() ? ta.value.trim() + ' ' : '';
    const rec = new SR(); rec.lang = navigator.language || 'en-US'; rec.interimResults = true; rec.continuous = true;
    rec.onresult = e => { let t = ''; for (const r of e.results) t += r[0].transcript; ta.value = base + t; S.draft.text = ta.value; S.draft.via = 'dictated'; };
    rec.onerror = e => toast(/not-allowed/.test(e.error) ? 'The microphone is blocked in this preview. In the desktop app the mic button records; type the note for now.' : 'Dictation stopped: ' + e.error);
    rec.onend = () => { S.rec = null; const b = $('mic'); if (b) { b.setAttribute('aria-pressed', 'false'); b.classList.remove('rec'); } };
    try { rec.start(); S.rec = rec; btn.setAttribute('aria-pressed', 'true'); btn.classList.add('rec'); } catch (e) { toast('Dictation could not start. Type the note instead.'); }
  },
  'del-el': () => {
    const e = curEl(), p = S.images.find(i => i.id === e.parent);
    p.removed.add(e.boxIndex); S.elements = S.elements.filter(x => x !== e);
    S.nav = {view: 'image', id: p.id, folder: S.nav.folder, hl: null}; render();
    toast(`${TYPES[e.type].label} deleted. Reprocessing won't bring it back.`, 'Undo', () => { p.removed.delete(e.boxIndex); S.elements.push(e); render(); });
  }
};
document.addEventListener('click', ev => { const el = ev.target.closest('[data-act]'); closeCtx(); if (el && el.tagName !== 'SELECT' && ACT[el.dataset.act]) ACT[el.dataset.act](el); });
/* Right-click menu on cards */
function closeCtx() { $('ctx').hidden = true; }
function openCtx(id, x, y) {
  const i = S.images.find(v => v.id === id), m = $('ctx'), inRecent = S.nav.view === 'grid', open = S.details || S.open.has(id);
  m.innerHTML = `<div class="ctx-t">${esc(i.name)}</div><button role="menuitem" data-act="open-img" data-id="${id}">Open</button>` +
    (inRecent ? `<button role="menuitem" data-act="toggle-info" data-id="${id}">${open ? 'Hide details' : 'Show details'}</button>` : '') +
    `<div class="ctx-sep"></div><button role="menuitem" class="danger" data-act="del-img" data-id="${id}">Delete…</button>`;
  m.hidden = false;
  const r = m.getBoundingClientRect();
  m.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + 'px'; m.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';
  m.querySelector('button').focus();
}
document.addEventListener('contextmenu', ev => {
  const tr = ev.target.closest('.tagrow');
  if (tr && tr.querySelector('.del')) {
    ev.preventDefault(); const m = $('ctx'), t = tr.dataset.tag;
    m.innerHTML = `<div class="ctx-t">#${esc(t)}</div><button role="menuitem" data-act="folder" data-k="tag" data-v="${esc(t)}">Open</button><div class="ctx-sep"></div><button role="menuitem" class="danger" data-act="del-tag" data-v="${esc(t)}">Delete tag…</button>`;
    m.hidden = false; m.style.left = Math.min(ev.clientX, innerWidth - 200) + 'px'; m.style.top = Math.min(ev.clientY, innerHeight - 120) + 'px'; m.querySelector('button').focus(); return;
  }
  const c = ev.target.closest('.card[data-id]'); if (!c) return closeCtx(); ev.preventDefault(); openCtx(c.dataset.id, ev.clientX, ev.clientY); });
addEventListener('scroll', closeCtx, true); addEventListener('resize', closeCtx);
/* Hover preview of the element breakdown */
let peekT;
const setPeek = on => { const st = $('stage'); if (st) st.classList.toggle('peek', on); };
document.addEventListener('mouseover', ev => { const t = ev.target.closest('#peek-btn, #stage'); if (!t) return; if (t.id === 'peek-btn' || $('stage').classList.contains('peek')) { clearTimeout(peekT); setPeek(true); } });
document.addEventListener('mouseout', ev => { if (!ev.target.closest('#peek-btn, #stage')) return; const to = ev.relatedTarget; if (to && to.closest && to.closest('#peek-btn, #stage')) return; clearTimeout(peekT); peekT = setTimeout(() => setPeek(false), 250); });
document.addEventListener('focusin', ev => { if (ev.target.id === 'peek-btn') setPeek(true); });
document.addEventListener('focusout', ev => { if (ev.target.id === 'peek-btn') setPeek(false); });
document.addEventListener('change', ev => {
  if (ev.target.id === 'type-select') { const e = curEl(); e.type = ev.target.value; e.source = 'user'; render(); toast(`Moved to ${TYPES[e.type].label}`); }
  if (ev.target.id === 'file') { importFiles(ev.target.files); ev.target.value = ''; }
});
document.addEventListener('input', ev => { if (ev.target.id === 'note-input' && S.draft) S.draft.text = ev.target.value; });
document.addEventListener('toggle', ev => { if (ev.target.id === 'more') S.moreOpen = ev.target.open; }, true);
document.addEventListener('submit', ev => {
  if (ev.target.dataset.form === 'newtag') {
    ev.preventDefault();
    const t = $('newtag-input').value.trim().toLowerCase(); if (!t) return;
    if (tagCounts().some(([x]) => x === t)) return toast(`“${t}” already exists`);
    S.customTags.push(t); let n = 0;
    for (const i of S.images) if (i.status !== 'failed' && !i.tags.includes(t) && tagMatches(i, t)) { i.tags.push(t); n++; }
    S.addingTag = false; go({view: 'grid', folder: {k: 'tag', v: t}});
    return toast(`Tag “${t}” added · found in ${n} saved ${n === 1 ? 'design' : 'designs'}. New saves are checked too.`);
  }
  if (ev.target.dataset.form === 'link') {
    ev.preventDefault();
    let url = $('link-url').value.trim(); if (!/^https?:\/\//.test(url)) url = 'https://' + url;
    let name = $('link-name').value.trim(); try { name = name || new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return toast('That address does not look right. Try https://example.com'); }
    S.links.unshift({id: 'l' + Date.now(), name, url}); render(); return toast(`Added “${name}”`);
  }
  if (ev.target.dataset.form === 'note') {
    ev.preventDefault(); if (S.rec) S.rec.stop();
    const i = curImg(), d = S.draft, text = d.text.trim();
    if (!text && !d.liked.size) return toast('Pick what you liked or write a note first.');
    (i.notes = i.notes || []).push({id: 'n' + Date.now(), text, liked: LIKES.filter(l => d.liked.has(l)), via: d.via, at: Date.now()});
    saveNotes(i); S.draft = null; render(); return toast('Note saved');
  }
  if (ev.target.dataset.form !== 'tag') return; ev.preventDefault();
  const v = $('tag-input').value.trim().toLowerCase(), i = curImg(); if (!v) return;
  if (i.tags.includes(v)) return toast(`“${v}” is already on this image`);
  i.tags.push(v); render(); $('tag-input').focus(); toast(`Added “${v}” · now in ${i.tags.length + 1} folders`);
});
$('q').addEventListener('input', e => { S.q = e.target.value; if (S.nav.view !== 'grid') S.nav = {view: 'grid', folder: S.nav.folder}; render(); });
document.addEventListener('keydown', e => {
  if (!$('modal').hidden) { if (e.key === 'Escape') $('modal').hidden = true; return; }
  if (!$('ctx').hidden && e.key === 'Escape') return closeCtx();
  if ((e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) && document.activeElement.closest('.card[data-id]')) {
    e.preventDefault(); const c = document.activeElement.closest('.card[data-id]'), r = c.getBoundingClientRect(); return openCtx(c.dataset.id, r.left + 16, r.top + 16);
  }
  const tr = document.activeElement.closest && document.activeElement.closest('.tagrow');
  if (tr && (e.key === 'Backspace' || e.key === 'Delete') && tr.querySelector('.del')) { e.preventDefault(); return deleteTag(tr.dataset.tag); }
  const typing = /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName);
  if (typing) { if (e.key === 'Escape') document.activeElement.blur(); return; }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c' && S.nav.view !== 'grid' && !String(getSelection())) { e.preventDefault(); return copyCurrent(); }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const v = S.nav.view;
  if (e.key === '/') { e.preventDefault(); $('q').focus(); }
  else if (e.key === 'Escape') goBack();
  else if (e.key.toLowerCase() === 'e' && v === 'image') ACT.outlines();
  else if (e.key.toLowerCase() === 'p' && v === 'element') openParent(S.nav.id);
  else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && v === 'image') {
    const list = S.nav.folder.k === 'type' ? imagesIn({k: 'recent'}) : imagesIn(S.nav.folder), k = list.findIndex(i => i.id === S.nav.id);
    const nx = list[k + (e.key === 'ArrowRight' ? 1 : -1)]; if (nx) { S.nav = {...S.nav, id: nx.id, hl: null}; render(); }
  }
});
let dragDepth = 0;
addEventListener('dragenter', e => { if ([...e.dataTransfer.types].includes('Files')) { dragDepth++; $('drop').hidden = false; } });
addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('drop').hidden = true; } });
addEventListener('dragover', e => e.preventDefault());
addEventListener('drop', e => { e.preventDefault(); dragDepth = 0; $('drop').hidden = true; if (e.dataTransfer.files.length) importFiles(e.dataTransfer.files); });
setInterval(() => { if (S.nav.view === 'grid') renderGrid && ($('view').querySelectorAll('.s').length) && render(); }, 60e3);

/* Theme: dark by default (unchanged), light = baby pink. The choice is remembered in this browser. */
function setTheme(t) {
  S.theme = t; document.body.dataset.ui = t;
  const b = $('theme'), next = t === 'light' ? 'dark' : 'light';
  b.textContent = t === 'light' ? '☾' : '☀'; b.setAttribute('aria-label', `Switch to ${next} theme`); b.title = `Switch to ${next} theme`;
  try { localStorage.setItem('refbox-theme', t); } catch (e) {}
}
let savedTheme = 'dark'; try { savedTheme = localStorage.getItem('refbox-theme') === 'light' ? 'light' : 'dark'; } catch (e) {}
setTheme(savedTheme);
if (EXT) {
  document.querySelector('[data-act="simulate"]').hidden = true;
  S.links = [];
  chrome.storage.local.get(['enabled', 'links'], v => {
    S.capture = v.enabled !== false; $('capture').setAttribute('aria-pressed', S.capture); $('capLbl').textContent = S.capture ? 'Capture on' : 'Capture off';
    S.links = Array.isArray(v.links) ? v.links : []; render();
  });
  chrome.storage.onChanged.addListener(ch => {
    if (ch.lastCapture) loadCaptures(false);
    if (ch.links && JSON.stringify(ch.links.newValue) !== JSON.stringify(S.links)) { S.links = ch.links.newValue || []; render(); }
  });
  chrome.action && chrome.action.setBadgeText({text: ''});
  loadCaptures(true);
}
/* keep tags of real captures and the links list across reloads */
const baseRender = render;
render = function () { baseRender(); if (EXT) { saveTags(); chrome.storage.local.set({links: S.links}); } };
render();
})();

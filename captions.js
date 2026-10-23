// Logika titulků: styly, seskupování slov, vykreslení na canvas (náhled i export) a SRT.

// Písma (všechna zdarma, s českou diakritikou, uložená ve složce fonts/).
export const FONTS = [
  { key: 'montserrat-900', family: 'Montserrat', weight: 900, label: 'Montserrat Black' },
  { key: 'montserrat-800', family: 'Montserrat', weight: 800, label: 'Montserrat ExtraBold' },
  { key: 'poppins-800', family: 'Poppins', weight: 800, label: 'Poppins ExtraBold' },
  { key: 'poppins-600', family: 'Poppins', weight: 600, label: 'Poppins SemiBold' },
  { key: 'archivo', family: 'Archivo Black', weight: 400, label: 'Archivo Black (široké)' },
  { key: 'rubik', family: 'Rubik', weight: 900, label: 'Rubik Black' },
  { key: 'anton', family: 'Anton', weight: 400, label: 'Anton (úzké vysoké)' },
  { key: 'bangers', family: 'Bangers', weight: 400, label: 'Bangers (komiks)' },
  { key: 'titan', family: 'Titan One', weight: 400, label: 'Titan One (kulaté tučné)' },
  { key: 'baloo', family: 'Baloo 2', weight: 800, label: 'Baloo 2 (kulaté)' },
  { key: 'playfair-900', family: 'Playfair Display', weight: 900, label: 'Playfair Display (serif)' },
  { key: 'playfair-700i', family: 'Playfair Display', weight: 700, italic: true, label: 'Playfair Display kurzíva' },
  { key: 'dmserif', family: 'DM Serif Display', weight: 400, label: 'DM Serif Display' },
  { key: 'dmserif-i', family: 'DM Serif Display', weight: 400, italic: true, label: 'DM Serif Display kurzíva' },
  { key: 'roboto-cond-800', family: 'Roboto Condensed', weight: 800, label: 'Roboto Condensed' },
  { key: 'roboto-cond-700i', family: 'Roboto Condensed', weight: 700, italic: true, label: 'Roboto Condensed kurzíva' },
  { key: 'kaushan', family: 'Kaushan Script', weight: 400, label: 'Kaushan Script (ručně psané)' },
  { key: 'audiowide', family: 'Audiowide', weight: 400, label: 'Audiowide (sci-fi)' },
  { key: 'luckiest', family: 'Luckiest Guy', weight: 400, label: 'Luckiest Guy (komiks)' },
  { key: 'russo', family: 'Russo One', weight: 400, label: 'Russo One (hranaté)' },
  { key: 'arial', family: 'Arial', weight: 700, label: 'Arial Bold' },
];
export const fontByKey = (k) => FONTS.find((f) => f.key === k) || FONTS[0];

// Výchozí hodnoty všech vlastností stylu. Předvolby níže mění jen to, co potřebují.
export const DEFAULT_STYLE = {
  fontKey: 'montserrat-900',
  sizePct: 8,            // velikost písma v % šířky videa
  uppercase: true,
  textColor: '#ffffff',
  opacity: 100,          // průhlednost celého titulku (%)
  highlightMode: 'color', // 'color' | 'box' | 'none'
  highlightColor: '#ffe600',
  reveal: 'all',         // 'all' | 'progressive' (slova naskakují) | 'dim' (nevyřčená slova ztlumená)
  dimColor: '#8a8f98',
  strokeColor: '#000000',
  strokePct: 18,         // obrys v % velikosti písma
  outlineColor: '#ffffff',
  outlinePct: 0,         // druhý, vnější obrys
  glowPct: 0,            // záře (neon)
  glowColor: '#ffe600',
  glowAuto: true,        // záře v barvě textu
  shadow: 'soft',        // 'none' | 'soft' | 'hard' (3D)
  shadowColor: '#000000',
  shadowPct: 7,          // odsazení 3D stínu v % velikosti písma
  background: 'none',    // 'none' | 'bar' (jeden blok) | 'line' (štítek na řádek) | 'word' (štítek na slovo)
  bgColor: '#000000',
  bgOpacity: 60,
  blend: 'normal',       // 'normal' | 'difference' | 'exclusion' | 'soft-light' | 'overlay'
  posY: 68,              // svislá pozice středu titulku v % výšky
  maxWords: 3,
  animation: 'pop',      // 'pop' | 'rise' | 'none'
  gradient: false,       // barevný přechod textu shora dolů
  gradTop: '#fde68a',
  gradBottom: '#d97706',
  rotate: 0,             // náklon celého titulku ve stupních
  effect: 'none',        // 'none' | 'ransom' (výstřižky) | 'confetti' | 'streak' (světelný pruh)
};

const P = (label, o) => ({ label, ...DEFAULT_STYLE, ...o });

export const PRESETS = {
  hormozi: P('Žluté zvýraznění', { sizePct: 8.5, strokePct: 20 }),
  box: P('Zelený box', { highlightMode: 'box', highlightColor: '#22c55e', strokePct: 12 }),
  single: P('Po jednom slově', { fontKey: 'poppins-800', sizePct: 12, highlightMode: 'none', posY: 55, maxWords: 1 }),
  karaoke: P('Slova naskakují', { fontKey: 'montserrat-800', uppercase: false, highlightColor: '#38bdf8', strokePct: 16, posY: 70, maxWords: 4, reveal: 'progressive' }),
  clean: P('Čistý s podkladem', { fontKey: 'poppins-800', sizePct: 6, uppercase: false, highlightMode: 'none', strokePct: 0, shadow: 'none', background: 'bar', posY: 78, maxWords: 6, animation: 'none' }),

  // Průhledné – barva se mění podle pozadí.
  invert: P('Průhledný – inverze', { highlightMode: 'none', strokePct: 0, shadow: 'none', blend: 'difference', sizePct: 9 }),
  invertSoft: P('Průhledný – jemný', { fontKey: 'poppins-800', highlightMode: 'none', strokePct: 0, shadow: 'none', blend: 'exclusion', opacity: 85, sizePct: 8.5 }),
  glass: P('Průhledný – sklo', { fontKey: 'archivo', highlightMode: 'none', strokePct: 0, shadow: 'none', blend: 'soft-light', sizePct: 9.5 }),

  // Podle tvých screenshotů.
  sticker: P('Zelená nálepka', { fontKey: 'archivo', sizePct: 7, textColor: '#84cc16', highlightColor: '#d9f99d', strokeColor: '#14532d', strokePct: 14, outlineColor: '#ffffff', outlinePct: 9, shadow: 'none' }),
  serifFade: P('Serif mlha', { fontKey: 'playfair-900', uppercase: false, textColor: '#f1f1f1', highlightMode: 'none', reveal: 'dim', dimColor: '#6b7280', strokePct: 0, maxWords: 4 }),
  serifDuo: P('Serif + zelená', { fontKey: 'playfair-900', uppercase: false, highlightColor: '#22c55e', strokePct: 0, sizePct: 8.5 }),
  comicBlue: P('Žlutá s modrým obrysem', { fontKey: 'titan', uppercase: false, sizePct: 10, textColor: '#facc15', highlightColor: '#ffffff', strokeColor: '#1e3a8a', strokePct: 22, outlineColor: '#3b82f6', outlinePct: 5, shadow: 'none', maxWords: 2 }),
  yellowNeon: P('Žlutý neon', { textColor: '#fde047', highlightColor: '#ffffff', strokePct: 0, glowPct: 32, shadow: 'none' }),
  minimal: P('Minimalistický', { fontKey: 'poppins-600', uppercase: false, sizePct: 5.5, highlightMode: 'none', strokePct: 0, maxWords: 6, animation: 'none', posY: 75 }),
  greenGlow: P('Zelená záře', { fontKey: 'titan', sizePct: 11, textColor: '#86efac', highlightMode: 'none', strokeColor: '#14532d', strokePct: 16, glowPct: 35, glowAuto: false, glowColor: '#22c55e', shadow: 'none', maxWords: 1 }),
  serifWhite: P('Elegantní serif', { fontKey: 'playfair-900', uppercase: false, highlightMode: 'none', strokePct: 0, maxWords: 4, animation: 'rise' }),
  purple3d: P('Fialový 3D', { fontKey: 'archivo', sizePct: 10, textColor: '#a855f7', highlightColor: '#e9d5ff', strokeColor: '#2e1065', strokePct: 10, shadow: 'hard', shadowColor: '#2e1065', shadowPct: 7, maxWords: 2 }),
  navyLabel: P('Modrý štítek', { fontKey: 'rubik', sizePct: 7, highlightColor: '#7dd3fc', strokePct: 0, shadow: 'none', background: 'line', bgColor: '#0b2a5b', bgOpacity: 100 }),
  pinkKey: P('Růžová klíčová slova', { fontKey: 'baloo', uppercase: false, highlightColor: '#ec4899', strokeColor: '#3b0a3f', strokePct: 14, maxWords: 4 }),
  retroItalic: P('Retro kurzíva', { fontKey: 'dmserif-i', uppercase: false, sizePct: 10, textColor: '#ea580c', highlightColor: '#fbbf24', strokeColor: '#ffffff', strokePct: 6, glowPct: 30, glowAuto: false, glowColor: '#000000', shadow: 'none', maxWords: 2 }),
  whiteGlow: P('Bílá záře', { highlightMode: 'none', reveal: 'dim', dimColor: '#9ca3af', strokePct: 0, glowPct: 30, shadow: 'none' }),
  boldShadow: P('Tučný stín', { highlightMode: 'none', strokePct: 0, shadow: 'hard', shadowColor: '#000000', shadowPct: 5, sizePct: 8 }),
  neonScript: P('Neonový nápis', { fontKey: 'kaushan', uppercase: false, sizePct: 11, highlightColor: '#ef4444', strokePct: 0, glowPct: 35, shadow: 'none', maxWords: 2 }),
  blueWord: P('Modré slovo', { fontKey: 'montserrat-800', sizePct: 6, highlightMode: 'box', highlightColor: '#2563eb', strokePct: 0, maxWords: 5 }),
  darkBar: P('Tmavý pruh', { fontKey: 'poppins-800', uppercase: false, sizePct: 6, highlightMode: 'none', reveal: 'dim', dimColor: '#8b8bb0', strokePct: 0, shadow: 'none', background: 'bar', bgColor: '#1e1b4b', bgOpacity: 85, maxWords: 4 }),
  pinkNeon: P('Růžový neon', { textColor: '#fbcfe8', highlightColor: '#ffffff', strokePct: 0, glowPct: 40, glowAuto: false, glowColor: '#ec4899', shadow: 'none' }),
  italicCond: P('Úzká kurzíva', { fontKey: 'roboto-cond-700i', uppercase: false, highlightColor: '#fde047', strokePct: 0, maxWords: 4 }),
  twoTone: P('Bílá + šedá', { fontKey: 'archivo', highlightMode: 'none', reveal: 'dim', dimColor: '#a3a3a3', strokePct: 0, sizePct: 7 }),
  goldComic: P('Zlatý komiks', { fontKey: 'bangers', sizePct: 12, textColor: '#eab308', highlightColor: '#fde68a', strokeColor: '#1e1b4b', strokePct: 16, shadow: 'hard', shadowColor: '#1e1b4b', shadowPct: 7, maxWords: 2 }),
  wideWhite: P('Široký bílý', { fontKey: 'archivo', highlightMode: 'none', strokePct: 0, sizePct: 7 }),
  anton: P('Vysoké písmo', { fontKey: 'anton', sizePct: 10, strokePct: 14, maxWords: 4 }),
  // Třetí várka podle screenshotů.
  goldSerif: P('Zlatý serif', { fontKey: 'playfair-900', uppercase: false, sizePct: 9, gradient: true, gradTop: '#fef08a', gradBottom: '#ca8a04', highlightMode: 'none', strokeColor: '#3f2a00', strokePct: 8, glowPct: 35, glowAuto: false, glowColor: '#eab308', shadow: 'none', maxWords: 2, rotate: -4 }),
  grayItalic: P('Šedá kurzíva', { fontKey: 'roboto-cond-700i', uppercase: false, sizePct: 9, textColor: '#9ca3af', highlightColor: '#ffffff', strokePct: 0, maxWords: 2 }),
  blueYellowGlow: P('Modrá se žlutou září', { fontKey: 'titan', sizePct: 10, textColor: '#7dd3fc', highlightColor: '#ffffff', strokeColor: '#fde047', strokePct: 22, glowPct: 45, glowAuto: false, glowColor: '#facc15', shadow: 'none', maxWords: 2 }),
  greenGrad: P('Zelenožlutý přechod', { fontKey: 'titan', sizePct: 11, gradient: true, gradTop: '#fef08a', gradBottom: '#16a34a', highlightMode: 'none', strokeColor: '#14532d', strokePct: 10, shadow: 'hard', shadowColor: '#052e16', shadowPct: 6, maxWords: 2 }),
  blueBlock: P('Modrý 3D blok', { fontKey: 'russo', sizePct: 10, textColor: '#7dd3fc', highlightColor: '#e0f2fe', strokePct: 0, shadow: 'hard', shadowColor: '#0c2d5e', shadowPct: 9, maxWords: 2 }),
  magentaPop: P('Magenta box se září', { fontKey: 'baloo', uppercase: false, sizePct: 7, highlightMode: 'box', highlightColor: '#d946ef', strokeColor: '#111111', strokePct: 10, glowPct: 55, glowAuto: false, glowColor: '#facc15', shadow: 'none', maxWords: 4 }),
  thinSerif: P('Jemný serif', { fontKey: 'dmserif', uppercase: false, sizePct: 8, highlightMode: 'none', strokePct: 0, maxWords: 3, animation: 'rise' }),
  pinkRetro: P('Růžové retro', { fontKey: 'rubik', sizePct: 10, textColor: '#ec4899', highlightColor: '#f9a8d4', strokePct: 0, glowPct: 15, shadow: 'none', maxWords: 2 }),
  scifi: P('Sci-fi záře', { fontKey: 'audiowide', sizePct: 8, textColor: '#5eead4', highlightColor: '#ccfbf1', strokePct: 0, glowPct: 45, shadow: 'none', effect: 'streak', maxWords: 3 }),
  confetti: P('Komiks s konfetami', { fontKey: 'luckiest', sizePct: 10, highlightColor: '#fde047', strokeColor: '#3b0764', strokePct: 16, shadow: 'hard', shadowColor: '#3b0764', shadowPct: 4, effect: 'confetti', maxWords: 1 }),
  pinkSticker: P('Růžová nálepka', { fontKey: 'titan', uppercase: false, sizePct: 7.5, textColor: '#fda4af', highlightColor: '#ffffff', strokeColor: '#7f1d1d', strokePct: 12, outlineColor: '#fde68a', outlinePct: 5, shadow: 'none', rotate: 4, maxWords: 3 }),
  peachItalic: P('Broskvová kurzíva', { fontKey: 'roboto-cond-700i', uppercase: false, sizePct: 7, textColor: '#fdba74', highlightColor: '#ffffff', strokePct: 0, maxWords: 4 }),
  lavenderGlow: P('Levandulová záře', { fontKey: 'poppins-800', uppercase: false, sizePct: 7, textColor: '#c7d2fe', highlightColor: '#ffffff', strokeColor: '#312e81', strokePct: 8, glowPct: 30, glowAuto: false, glowColor: '#6366f1', shadow: 'none', maxWords: 4 }),
  redSerifGlow: P('Serif s červenou září', { fontKey: 'playfair-700i', uppercase: false, sizePct: 9, textColor: '#fee2e2', highlightColor: '#ffffff', strokePct: 0, glowPct: 40, glowAuto: false, glowColor: '#ef4444', shadow: 'none', maxWords: 2 }),
  ransom: P('Výstřižky', { sizePct: 7, highlightMode: 'none', strokePct: 0, shadow: 'none', effect: 'ransom', maxWords: 3 }),
  comicFox: P('Komiks s výbuchem', { fontKey: 'bangers', sizePct: 13, textColor: '#dc2626', highlightMode: 'none', strokeColor: '#1e3a8a', strokePct: 10, outlineColor: '#ffffff', outlinePct: 10, glowPct: 40, glowAuto: false, glowColor: '#f97316', shadow: 'none', maxWords: 1 }),
};

// Doplní chybějící vlastnosti (např. u titulků uložených ve starší verzi).
export function normalizeStyle(s) {
  const out = { ...DEFAULT_STYLE, ...s };
  if (out.shadow === true) out.shadow = 'soft';
  if (out.shadow === false) out.shadow = 'none';
  if (!s.fontKey && s.font) {
    const f = FONTS.find((x) => x.family === s.font && (!s.weight || x.weight === s.weight)) || FONTS.find((x) => x.family === s.font);
    if (f) out.fontKey = f.key;
  }
  delete out.font; delete out.weight; delete out.label;
  return out;
}

// ---------- Seskupování slov do "titulků" ----------

// Rozdělí slova do skupin (to, co je na obrazovce najednou).
export function groupWords(words, { maxWords = 3, maxChars = 22, pauseGap = 0.6 } = {}) {
  const groups = [];
  let cur = [];
  const flush = () => { if (cur.length) groups.push({ words: cur }); cur = []; };
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const prev = cur[cur.length - 1];
    if (prev) {
      const chars = cur.reduce((n, x) => n + x.text.length + 1, 0) + w.text.length;
      const gap = w.start - prev.end;
      const sentenceEnd = /[.!?…]$/.test(prev.text);
      if (cur.length >= maxWords || chars > maxChars || gap > pauseGap || sentenceEnd) flush();
    }
    cur.push({ ...w });
  }
  flush();
  return groups;
}

export const groupStart = (g) => g.words[0]?.start ?? 0;
export const groupEnd = (g) => g.words[g.words.length - 1]?.end ?? 0;

// Nový text skupiny -> nová slova. Když sedí počet slov, zachová časy;
// jinak časy rozdělí poměrně podle délky slov.
export function retextGroup(g, text) {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;
  if (tokens.length === g.words.length) {
    return { words: g.words.map((w, i) => ({ ...w, text: tokens[i] })) };
  }
  return { words: spreadTokens(tokens, groupStart(g), groupEnd(g)) };
}

export function spreadTokens(tokens, start, end) {
  const total = tokens.reduce((n, t) => n + t.length + 1, 0);
  const dur = Math.max(0.05, end - start);
  let t = start;
  return tokens.map((tok) => {
    const d = dur * ((tok.length + 1) / total);
    const w = { text: tok, start: t, end: t + d };
    t += d;
    return w;
  });
}

// ---------- Vykreslení ----------

function findActive(groups, t) {
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const s = groupStart(g);
    const next = groups[i + 1] ? groupStart(groups[i + 1]) : Infinity;
    // Titulek nechá chvilku "doznít", ale nikdy nepřekryje další.
    const e = Math.min(groupEnd(g) + 0.25, next);
    if (t >= s && t < e) return g;
    if (s > t) break;
  }
  return null;
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexA(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// Titulek se kreslí do samostatné vrstvy a ta se pak vloží do obrazu.
// Díky tomu funguje průhlednost i režimy prolnutí (inverze apod.) stejně v náhledu i v exportu.
let layer = null, lctx = null;
function getLayer(W, H) {
  if (!layer) {
    layer = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(W, H) : document.createElement('canvas');
    lctx = layer.getContext('2d');
  }
  if (layer.width !== W || layer.height !== H) { layer.width = W; layer.height = H; }
  lctx.clearRect(0, 0, W, H);
  return lctx;
}

// Vykreslí titulek pro čas t (v sekundách) do kontextu o rozměrech W×H.
// opts.blend = false: režim prolnutí neaplikuje (v náhledu ho dělá CSS nad videem).
// Vrací obdélník titulku (pro tažení myší), nebo null.
export function drawCaptions(ctx, W, H, t, groups, style, opts = {}) {
  const g = findActive(groups, t);
  if (!g) return null;
  const lc = getLayer(W, H);
  const box = renderGroup(lc, W, H, t, g, style);
  ctx.save();
  ctx.globalAlpha = (style.opacity ?? 100) / 100;
  if (opts.blend !== false && style.blend && style.blend !== 'normal') ctx.globalCompositeOperation = style.blend;
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
  return box;
}

function renderGroup(ctx, W, H, t, g, s) {
  const f = fontByKey(s.fontKey);
  const size = Math.round((s.sizePct / 100) * W);
  ctx.save();
  ctx.font = `${f.italic ? 'italic ' : ''}${f.weight} ${size}px "${f.family}", "Arial Black", Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  const words = g.words.map((w) => ({ ...w, label: s.uppercase ? w.text.toLocaleUpperCase('cs-CZ') : w.text }));
  const ransom = s.effect === 'ransom';
  const space = ctx.measureText(' ').width * (s.background === 'word' ? 1.6 : ransom ? 1.4 : 1);
  const maxW = W * 0.86;

  // Zalamování slov do řádků.
  const lines = [];
  let line = [], lineW = 0;
  for (const w of words) {
    if (ransom) {
      w.cells = ransomCells(ctx, w.label, size, w.start);
      w.width = w.cells.reduce((n, c) => n + c.w, 0);
    } else {
      w.width = ctx.measureText(w.label).width;
    }
    const add = line.length ? space + w.width : w.width;
    if (line.length && lineW + add > maxW) { lines.push({ words: line, width: lineW }); line = []; lineW = 0; }
    lineW += line.length ? space + w.width : w.width;
    line.push(w);
  }
  if (line.length) lines.push({ words: line, width: lineW });

  const lineH = size * 1.2;
  const blockH = lineH * lines.length;
  const cy = (s.posY / 100) * H;
  const top = cy - blockH / 2;
  const stroke = (s.strokePct / 100) * size;
  const outline = (s.outlinePct / 100) * size;
  const bgFill = hexA(s.bgColor, s.bgOpacity / 100);
  const maxLineW = Math.max(...lines.map((l) => l.width));

  if (s.rotate) {
    ctx.translate(W / 2, cy);
    ctx.rotate((s.rotate * Math.PI) / 180);
    ctx.translate(-W / 2, -cy);
  }
  if (s.effect === 'confetti') drawConfetti(ctx, W / 2, cy, maxLineW + size * 1.2, blockH + size * 0.9, size, groupStart(g));

  if (s.background === 'bar') {
    const bw = Math.max(...lines.map((l) => l.width)) + size * 0.9;
    const bh = blockH + size * 0.45;
    ctx.fillStyle = bgFill;
    roundRect(ctx, (W - bw) / 2, cy - bh / 2, bw, bh, size * 0.3);
    ctx.fill();
  }

  let y = top + lineH / 2;
  for (const l of lines) {
    if (s.background === 'line') {
      const bw = l.width + size * 0.7, bh = lineH * 0.98;
      ctx.fillStyle = bgFill;
      roundRect(ctx, (W - bw) / 2, y - bh / 2, bw, bh, size * 0.22);
      ctx.fill();
    }
    let x = (W - l.width) / 2;
    for (const w of l.words) {
      const spoken = t >= w.start;
      const active = t >= w.start && t < w.end;
      if (s.reveal === 'progressive' && !spoken) { x += w.width + space; continue; }

      let fill = s.textColor;
      if (s.reveal === 'dim' && !spoken) fill = s.dimColor;
      if (active && s.highlightMode === 'color') fill = s.highlightColor;

      ctx.save();
      ctx.translate(x + w.width / 2, y);
      if (spoken && s.animation === 'pop') {
        const k = Math.min(1, (t - w.start) / 0.12);
        const sc = 1 + 0.14 * (1 - k);
        ctx.scale(sc, sc);
      } else if (spoken && s.animation === 'rise') {
        const k = Math.min(1, (t - w.start) / 0.18);
        ctx.translate(0, size * 0.25 * (1 - k) * (1 - k));
        ctx.globalAlpha = 0.25 + 0.75 * k;
      }

      if (s.background === 'word') {
        const px = size * 0.22, bh = lineH * 0.92;
        ctx.fillStyle = bgFill;
        roundRect(ctx, -w.width / 2 - px, -bh / 2, w.width + px * 2, bh, size * 0.16);
        ctx.fill();
      }
      if (active && s.highlightMode === 'box') {
        const px = size * 0.18, bh = lineH * 0.9;
        ctx.fillStyle = s.highlightColor;
        roundRect(ctx, -w.width / 2 - px, -bh / 2, w.width + px * 2, bh, size * 0.18);
        ctx.fill();
      }
      if (ransom) drawRansom(ctx, w.cells, w.width, size, fill === s.dimColor && s.reveal === 'dim');
      else drawWord(ctx, w.label, size, s, fill, stroke, outline, fill === s.textColor);
      ctx.restore();

      x += w.width + space;
    }
    y += lineH;
  }
  if (s.effect === 'streak') {
    const sc = s.glowAuto ? s.textColor : s.glowColor;
    drawStreak(ctx, W / 2, top + blockH - lineH * 0.42, Math.min(W * 0.98, maxLineW * 1.5), size, sc);
  }
  ctx.restore();
  const bw = Math.max(...lines.map((l) => l.width));
  return { x: (W - bw) / 2, y: top, w: bw, h: blockH };
}

// Jedno slovo ve vrstvách: 3D stín → záře → vnější obrys → obrys → výplň.
function drawWord(ctx, text, size, s, fill, stroke, outline, base) {
  const outer = stroke + outline * 2;

  const silhouette = (color) => {
    if (outer > 0) { ctx.lineWidth = outer; ctx.strokeStyle = color; ctx.strokeText(text, 0, 0); }
    ctx.fillStyle = color; ctx.fillText(text, 0, 0);
  };

  if (s.shadow === 'hard') {
    // Plný "3D" stín: několik vrstev posunutých dolů doprava.
    const off = (s.shadowPct / 100) * size;
    const steps = Math.max(1, Math.min(12, Math.round(off / Math.max(1, size * 0.012))));
    for (let i = steps; i >= 1; i--) {
      ctx.save();
      ctx.translate((off * i) / steps, (off * i) / steps);
      silhouette(s.shadowColor);
      ctx.restore();
    }
  }

  if (s.glowPct > 0) {
    const gc = s.glowAuto ? fill : s.glowColor;
    ctx.save();
    ctx.shadowColor = gc;
    ctx.shadowBlur = (s.glowPct / 100) * size;
    // Dvakrát pro sytější záři.
    silhouette(gc);
    silhouette(gc);
    ctx.restore();
  }

  ctx.save();
  if (s.shadow === 'soft') {
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = size * 0.2;
    ctx.shadowOffsetY = size * 0.06;
  }
  if (outline > 0) {
    ctx.lineWidth = outer; ctx.strokeStyle = s.outlineColor; ctx.strokeText(text, 0, 0);
    ctx.shadowColor = 'transparent';
  }
  if (stroke > 0) {
    ctx.lineWidth = stroke; ctx.strokeStyle = s.strokeColor; ctx.strokeText(text, 0, 0);
    ctx.shadowColor = 'transparent';
  }
  if (s.gradient && base) {
    const gr = ctx.createLinearGradient(0, -size * 0.45, 0, size * 0.45);
    gr.addColorStop(0, s.gradTop);
    gr.addColorStop(1, s.gradBottom);
    ctx.fillStyle = gr;
  } else {
    ctx.fillStyle = fill;
  }
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// ---------- Speciální efekty ----------

// Deterministická "náhoda" – stejný titulek vypadá v náhledu i v exportu pořád stejně.
function rand(seed) {
  let x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const RANSOM_FONTS = [
  '900 "Montserrat"', '400 "Archivo Black"', '900 "Playfair Display"', '400 "Bangers"',
  '400 "Anton"', '900 "Rubik"', '400 "DM Serif Display"', '400 "Russo One"', '400 "Titan One"',
];
const RANSOM_COLORS = [
  ['#111111', '#ffffff'], ['#f5f0e6', '#111111'], ['#dc2626', '#ffffff'], ['#facc15', '#111111'],
  ['#1d4ed8', '#ffffff'], ['#ffffff', '#dc2626'], ['#16a34a', '#ffffff'], ['#f472b6', '#111111'], ['#0f766e', '#fef9c3'],
];

// Výstřižková písmena: každé písmeno má jiné písmo, barvu podkladu a mírný náklon.
function ransomCells(ctx, label, size, seed) {
  const cells = [];
  [...label].forEach((ch, i) => {
    const r = (k) => rand(seed * 1000 + i * 7 + k + ch.charCodeAt(0));
    const font = `${RANSOM_FONTS[Math.floor(r(1) * RANSOM_FONTS.length)]}`;
    const [bg, fg] = RANSOM_COLORS[Math.floor(r(2) * RANSOM_COLORS.length)];
    const scale = 0.85 + r(3) * 0.25;
    ctx.save();
    ctx.font = `${font.split(' ')[0]} ${Math.round(size * scale)}px ${font.slice(font.indexOf(' ') + 1)}, Arial, sans-serif`;
    const cw = ctx.measureText(ch).width;
    const f = ctx.font;
    ctx.restore();
    cells.push({ ch, font: f, bg, fg, rot: (r(4) - 0.5) * 0.28, dy: (r(5) - 0.5) * size * 0.12, w: cw + size * 0.22, h: size * scale * 1.05 });
  });
  return cells;
}

function drawRansom(ctx, cells, width, size, dimmed) {
  let x = -width / 2;
  if (dimmed) ctx.globalAlpha *= 0.45;
  for (const c of cells) {
    ctx.save();
    ctx.translate(x + c.w / 2, c.dy);
    ctx.rotate(c.rot);
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = size * 0.08;
    ctx.shadowOffsetY = size * 0.04;
    ctx.fillStyle = c.bg;
    ctx.fillRect(-c.w / 2 + size * 0.02, -c.h / 2, c.w - size * 0.04, c.h);
    ctx.shadowColor = 'transparent';
    ctx.font = c.font;
    ctx.fillStyle = c.fg;
    ctx.fillText(c.ch, 0, size * 0.03);
    ctx.restore();
    x += c.w;
  }
}

const CONFETTI_COLORS = ['#f43f5e', '#facc15', '#22d3ee', '#a3e635', '#c084fc', '#fb923c', '#ffffff'];
function drawConfetti(ctx, cx, cy, bw, bh, size, seed) {
  ctx.save();
  for (let i = 0; i < 22; i++) {
    const r = (k) => rand(seed * 100 + i * 13 + k);
    // Konfety hlavně po okrajích titulku.
    const ang = r(1) * Math.PI * 2;
    const rx = bw / 2 * (0.75 + r(2) * 0.35), ry = bh / 2 * (0.7 + r(3) * 0.5);
    const x = cx + Math.cos(ang) * rx, y = cy + Math.sin(ang) * ry;
    const sz = size * (0.06 + r(4) * 0.08);
    ctx.fillStyle = CONFETTI_COLORS[Math.floor(r(5) * CONFETTI_COLORS.length)];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(r(6) * Math.PI);
    if (r(7) < 0.35) { ctx.beginPath(); ctx.arc(0, 0, sz / 2, 0, Math.PI * 2); ctx.fill(); }
    else ctx.fillRect(-sz, -sz / 3, sz * 2, sz * 0.66);
    ctx.restore();
  }
  ctx.restore();
}

// Vodorovný světelný pruh (sci-fi).
function drawStreak(ctx, cx, y, w, size, color) {
  ctx.save();
  const gr = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  gr.addColorStop(0, hexA(color, 0));
  gr.addColorStop(0.5, hexA(color, 1));
  gr.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = gr;
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 0.4;
  const h = Math.max(1, size * 0.045);
  ctx.fillRect(cx - w / 2, y - h / 2, w, h);
  ctx.fillRect(cx - w / 2, y - h / 2, w, h);
  ctx.restore();
}

// Malý náhled stylu do galerie předvoleb.
export function drawPresetThumb(canvas, style) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  // Pozadí půl tmavé, půl světlé, aby byly vidět i průhledné styly.
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#1b2230'); grad.addColorStop(0.55, '#3a4a63'); grad.addColorStop(1, '#d9d3c7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  const words = [
    { text: 'Ahoj', start: 0, end: 0.5 },
    { text: 'Reels', start: 0.5, end: 1.5 },
    { text: 'tady', start: 1.6, end: 2 },
  ].slice(0, Math.max(1, Math.min(3, style.maxWords)));
  const g = { words: style.maxWords === 1 ? [{ text: 'Reels', start: 0, end: 2 }] : words };
  const s = { ...style, posY: 50, sizePct: Math.min(22, style.sizePct * 1.9), animation: 'none' };
  drawCaptions(ctx, W, H, 0.8, [g], s);
}

// ---------- SRT ----------

function srtTime(sec) {
  const ms = Math.max(0, Math.round(sec * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${p(h)}:${p(m)}:${p(s)},${p(r, 3)}`;
}

export function toSRT(groups, uppercase = false) {
  return groups
    .map((g, i) => {
      let text = g.words.map((w) => w.text).join(' ');
      if (uppercase) text = text.toLocaleUpperCase('cs-CZ');
      return `${i + 1}\n${srtTime(groupStart(g))} --> ${srtTime(groupEnd(g))}\n${text}\n`;
    })
    .join('\n');
}

export function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1).padStart(4, '0');
  return `${m}:${s}`;
}

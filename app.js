// Hlavní logika aplikace: nahrání videa, přepis, editor, náhled, export.
import {
  PRESETS, FONTS, normalizeStyle, groupWords, groupStart, groupEnd, retextGroup, spreadTokens,
  drawCaptions, drawPresetThumb, toSRT, formatTime,
} from './captions.js';

const $ = (sel) => document.querySelector(sel);
const video = $('#video');
const overlay = $('#overlay');
const octx = overlay.getContext('2d');

const state = {
  file: null,
  groups: [],
  style: normalizeStyle(PRESETS.hormozi),
  preset: 'hormozi',
  device: 'wasm',
  hasF16: false,
  busy: false,
};

// ---------- Prostředí ----------

if (location.protocol === 'file:') {
  alert('Aplikaci spusť přes soubor „Spustit…“ (místní server), ne dvojklikem na index.html – jinak prohlížeč nepovolí přepis.');
}

// Telefon / tablet: menší model, šetrnější paměť, jiné ukládání videa.
const isPhone = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || navigator.userAgentData?.mobile === true;
if (isPhone) {
  const opt = $('#modelSelect option[value="turbo"]');
  opt.textContent = 'Nejpřesnější – Large v3 Turbo (na mobilu může dojít paměť)';
  $('#modelSelect option[value="small"]').textContent = 'Standardní – Whisper Small (doporučeno pro mobil)';
}

async function detectDevice() {
  const info = $('#deviceInfo');
  try {
    if (navigator.gpu) {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        state.device = 'webgpu';
        state.hasF16 = adapter.features.has('shader-f16');
        info.textContent = 'Grafická karta (WebGPU) k dispozici – přepis bude rychlý';
        $('#modelSelect').value = isPhone ? 'small' : 'turbo';
        return;
      }
    }
  } catch {}
  state.device = 'wasm';
  info.textContent = isPhone
    ? 'Přepis poběží na procesoru (pomaleji). Nech aplikaci otevřenou.'
    : 'WebGPU není k dispozici – přepis poběží na procesoru (pomaleji). Doporučen Chrome nebo Edge.';
  info.classList.add('warn');
}
detectDevice();

// Fonty musí být načtené dřív, než se kreslí na canvas.
const fontsReady = Promise.all(
  FONTS.filter((f) => f.family !== 'Arial').map((f) =>
    document.fonts.load(`${f.italic ? 'italic ' : ''}${f.weight} 40px "${f.family}"`, 'ŽLUŤOUČKÝ kůň ěščřžýáíé'))
).catch(() => {});

// ---------- Ukládání (jen v tomto prohlížeči) ----------

const storeKey = () => state.file ? `titulky:${state.file.name}:${state.file.size}` : null;
function save() {
  const k = storeKey();
  if (!k) return;
  try { localStorage.setItem(k, JSON.stringify({ groups: state.groups, style: state.style, preset: state.preset })); } catch {}
}
function load() {
  const k = storeKey();
  if (!k) return null;
  try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; }
}

// ---------- Nahrání videa ----------

const drop = $('#drop');
$('#fileInput').addEventListener('change', (e) => e.target.files[0] && openFile(e.target.files[0]));
drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
drop.addEventListener('dragleave', () => drop.classList.remove('over'));
drop.addEventListener('drop', (e) => {
  e.preventDefault(); drop.classList.remove('over');
  const f = e.dataTransfer.files[0];
  if (f) openFile(f);
});

function openFile(file) {
  state.file = file;
  if (video.src) URL.revokeObjectURL(video.src);
  video.src = URL.createObjectURL(file);
  $('#fileName').textContent = `${file.name} (${(file.size / 1048576).toFixed(1)} MB)`;
  $('#emptyStage').hidden = true;
  $('#transcribeBtn').disabled = false;
  $('#playBtn').disabled = false;

  const saved = load();
  if (saved?.groups?.length) {
    state.groups = saved.groups;
    if (saved.style) state.style = normalizeStyle(saved.style);
    if (saved.preset) state.preset = saved.preset;
    syncStyleInputs();
    setProgress('progress', 1, 'Načteny uložené titulky k tomuto videu. Kliknutím na „Vytvořit titulky“ je přepíšeš znovu.');
  } else {
    state.groups = [];
    $('#progressWrap').hidden = true;
  }
  renderEditor();
  updateButtons();
}

// ---------- Přepis ----------

const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

async function decodeAudio(file) {
  const buf = await file.arrayBuffer();
  const ac = new AudioContext({ sampleRate: 16000 });
  try {
    const audio = await ac.decodeAudioData(buf);
    if (audio.numberOfChannels === 1) return audio.getChannelData(0);
    // Smíchání stereo do mono.
    const a = audio.getChannelData(0), b = audio.getChannelData(1);
    const mono = new Float32Array(a.length);
    for (let i = 0; i < a.length; i++) mono[i] = (a[i] + b[i]) / 2;
    return mono;
  } finally {
    ac.close();
  }
}

function setProgress(which, fraction, text) {
  const wrap = which === 'progress' ? $('#progressWrap') : $('#exportWrap');
  const bar = which === 'progress' ? $('#progressBar') : $('#exportBar');
  const label = which === 'progress' ? $('#progressText') : $('#exportText');
  wrap.hidden = false;
  bar.parentElement.classList.toggle('indeterminate', fraction == null);
  if (fraction != null) bar.style.width = `${Math.round(fraction * 100)}%`;
  label.textContent = text;
}

$('#transcribeBtn').addEventListener('click', async () => {
  if (!state.file || state.busy) return;
  const modelKey = $('#modelSelect').value;
  if (modelKey === 'turbo' && isPhone) {
    if (!confirm('Nejpřesnější model má kolem 600–800 MB a telefonu může dojít paměť (stránka se pak sama obnoví). Na mobilu doporučuji Standardní. Přesto pokračovat?')) return;
  } else if (modelKey === 'turbo' && state.device !== 'webgpu') {
    if (!confirm('Tvůj prohlížeč nemá WebGPU. Nejpřesnější model poběží na procesoru hodně pomalu (i desítky minut). Pokračovat?')) return;
  }
  state.busy = true; updateButtons();
  await keepAwake(true);
  modelWarning = '';
  // Požádáme prohlížeč, ať uložená data (model) nemaže, když dochází místo.
  try { await navigator.storage?.persist?.(); } catch {}
  try {
    setProgress('progress', null, 'Čtu zvuk z videa…');
    const audio = await decodeAudio(state.file);
    const started = performance.now();
    const words = await new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        const m = e.data;
        if (m.type === 'download') {
          const mb = (n) => (n / 1048576).toFixed(0);
          const f = m.total ? m.loaded / m.total : null;
          setProgress('progress', f, m.fromCache
            ? `Načítám model z paměti zařízení (nic se nestahuje): ${Math.round((f || 0) * 100)} %`
            : `Stahuji model (jen poprvé): ${mb(m.loaded)} / ${mb(m.total)} MB`);
        } else if (m.type === 'warn') {
          modelWarning = m.text;
        } else if (m.type === 'status') {
          setProgress('progress', null, m.text);
          if (m.text.startsWith('Přepisuji')) tickElapsed(started, audio.length / 16000);
        } else if (m.type === 'result') {
          resolve(m.words);
        } else if (m.type === 'error') {
          reject(new Error(m.message));
        }
      };
      worker.postMessage({ type: 'transcribe', audio, modelKey, device: state.device, hasF16: state.hasF16 }, [audio.buffer]);
    });
    stopElapsed();
    if (!words.length) throw new Error('Ve videu se nenašla žádná řeč.');
    state.groups = groupWords(words, { maxWords: state.style.maxWords });
    save();
    renderEditor();
    const secs = ((performance.now() - started) / 1000).toFixed(0);
    const warnText = modelWarning ? ' ' + modelWarning : '';
    setProgress('progress', 1, `Hotovo za ${secs} s – ${words.length} slov. Zkontroluj text${mobileQuery.matches ? ' v záložce Text' : ' vpravo'}.${warnText}`);
    if (mobileQuery.matches) setTab('text');
  } catch (err) {
    stopElapsed();
    console.error(err);
    const msg = /fetch|network/i.test(err.message)
      ? 'Nepodařilo se stáhnout model. Zkontroluj připojení k internetu (stahuje se jen poprvé) a zkus to znovu.'
      : 'Chyba: ' + err.message;
    setProgress('progress', 0, msg);
  } finally {
    state.busy = false; updateButtons();
    keepAwake(false);
  }
});

let elapsedTimer = null;
let modelWarning = '';
function tickElapsed(started, duration) {
  stopElapsed();
  elapsedTimer = setInterval(() => {
    const s = ((performance.now() - started) / 1000).toFixed(0);
    setProgress('progress', null, `Přepisuji ${duration.toFixed(0)} s záznamu… (${s} s)`);
  }, 1000);
}
function stopElapsed() { clearInterval(elapsedTimer); elapsedTimer = null; }

// ---------- Styl ----------

const fontSelect = $('#fontSelect');
for (const f of FONTS) {
  const o = document.createElement('option');
  o.value = f.key; o.textContent = f.label;
  fontSelect.appendChild(o);
}

// Galerie předvoleb s malými náhledy.
function buildPresets() {
  const box = $('#presets');
  box.innerHTML = '';
  for (const [key, p] of Object.entries(PRESETS)) {
    const b = document.createElement('button');
    b.dataset.key = key;
    b.title = p.label;
    const c = document.createElement('canvas');
    c.width = 200; c.height = 125;
    b.append(c, document.createTextNode(p.label));
    drawPresetThumb(c, normalizeStyle(p));
    b.addEventListener('click', () => {
      const regroup = p.maxWords !== state.style.maxWords;
      // Pozici necháme, jakou si nastavil (tažením nebo posuvníkem).
      state.style = { ...normalizeStyle(p), posY: state.style.posY };
      state.preset = key;
      syncStyleInputs();
      markPreset();
      if (regroup && state.groups.length) regroupAll();
      save();
    });
    box.appendChild(b);
  }
  markPreset();
}
function markPreset() {
  document.querySelectorAll('#presets button').forEach((b) => b.classList.toggle('active', b.dataset.key === state.preset));
}

function syncStyleInputs() {
  document.querySelectorAll('[data-style]').forEach((el) => {
    const v = state.style[el.dataset.style];
    if (el.type === 'checkbox') el.checked = !!v; else el.value = v;
  });
}

document.querySelectorAll('[data-style]').forEach((el) => {
  el.addEventListener('input', () => {
    const k = el.dataset.style;
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.type === 'range' || el.type === 'number') v = Number(v);
    state.style[k] = v;
    if (k !== 'posY') { state.preset = null; markPreset(); }
    save();
  });
});
document.querySelector('[data-style="maxWords"]').addEventListener('change', () => {
  if (state.groups.length) regroupAll();
});

function regroupAll() {
  const words = state.groups.flatMap((g) => g.words);
  state.groups = groupWords(words, { maxWords: state.style.maxWords });
  renderEditor(); save();
}
$('#regroupBtn').addEventListener('click', regroupAll);

// ---------- Editor ----------

const editor = $('#editor');

function renderEditor() {
  editor.innerHTML = '';
  if (!state.groups.length) {
    editor.innerHTML = '<p class="hint">Zatím tu nic není. Nahraj video a klikni na „Vytvořit titulky“.</p>';
    updateButtons();
    return;
  }
  state.groups.forEach((g, i) => {
    const row = document.createElement('div');
    row.className = 'seg';
    row.dataset.i = i;
    row.innerHTML = `
      <button class="time" title="Přehrát odtud"><span>${formatTime(groupStart(g))}</span><span class="dash"> – </span><span>${formatTime(groupEnd(g))}</span></button>
      <input type="text" value="">
      <div class="actions">
        <button data-a="times" title="Upravit časy">⏱</button>
        <button data-a="split" title="Rozdělit na dvě">✂</button>
        <button data-a="merge" title="Spojit s předchozím">⤒</button>
        <button data-a="del" title="Smazat">✕</button>
      </div>
      <div class="seg-times">
        od <input type="number" step="0.05" min="0" data-t="start" value="${groupStart(g).toFixed(2)}">
        do <input type="number" step="0.05" min="0" data-t="end" value="${groupEnd(g).toFixed(2)}"> s
      </div>`;
    const input = row.querySelector('input[type=text]');
    input.value = g.words.map((w) => w.text).join(' ');
    input.addEventListener('change', () => {
      const ng = retextGroup(state.groups[i], input.value);
      if (ng) state.groups[i] = ng; else state.groups.splice(i, 1);
      save(); renderEditor();
    });
    row.querySelector('.time').addEventListener('click', () => { video.currentTime = groupStart(g) + 0.001; });
    row.querySelectorAll('[data-t]').forEach((inp) => inp.addEventListener('change', () => {
      const s = Number(row.querySelector('[data-t=start]').value);
      const e = Number(row.querySelector('[data-t=end]').value);
      if (!(e > s)) return;
      state.groups[i] = { words: spreadTokens(g.words.map((w) => w.text), s, e) };
      state.groups.sort((a, b) => groupStart(a) - groupStart(b));
      save(); renderEditor();
    }));
    row.querySelector('.actions').addEventListener('click', (e) => {
      const a = e.target.closest('button')?.dataset.a;
      if (!a) return;
      if (a === 'times') { row.classList.toggle('open'); return; }
      if (a === 'del') state.groups.splice(i, 1);
      if (a === 'split' && g.words.length > 1) {
        const mid = Math.ceil(g.words.length / 2);
        state.groups.splice(i, 1, { words: g.words.slice(0, mid) }, { words: g.words.slice(mid) });
      }
      if (a === 'merge' && i > 0) {
        state.groups.splice(i - 1, 2, { words: [...state.groups[i - 1].words, ...g.words] });
      }
      save(); renderEditor();
    });
    editor.appendChild(row);
  });

  const add = document.createElement('button');
  add.className = 'small';
  add.textContent = '+ Přidat titulek v aktuálním čase';
  add.addEventListener('click', () => {
    const t = video.currentTime || 0;
    state.groups.push({ words: spreadTokens(['NOVÝ', 'TEXT'], t, t + 1.5) });
    state.groups.sort((a, b) => groupStart(a) - groupStart(b));
    save(); renderEditor();
  });
  editor.appendChild(add);
  updateButtons();
}

let lastActive = -1;
function highlightActiveRow(t) {
  const idx = state.groups.findIndex((g) => t >= groupStart(g) && t < groupEnd(g) + 0.25);
  if (idx === lastActive) return;
  editor.querySelector('.seg.active')?.classList.remove('active');
  lastActive = idx;
  if (idx >= 0) {
    const row = editor.querySelector(`.seg[data-i="${idx}"]`);
    if (row) {
      row.classList.add('active');
      // Na počítači posuneme jen seznam titulků (ne celou stránku). Na mobilu se nescrolluje vůbec,
      // aktuální titulek je jen zvýrazněný, ať stránka neskáče.
      if (!mobileQuery.matches && !video.paused && !editor.contains(document.activeElement)) {
        const top = row.offsetTop - editor.offsetTop;
        if (top < editor.scrollTop || top + row.offsetHeight > editor.scrollTop + editor.clientHeight) {
          editor.scrollTop = top - editor.clientHeight / 3;
        }
      }
    }
  }
}

// ---------- Náhled ----------

// Canvas se překryje přesně přes obraz videa (i když video není 9:16).
function layoutOverlay() {
  const stage = $('#stage').getBoundingClientRect();
  const vw = video.videoWidth || 1080, vh = video.videoHeight || 1920;
  const k = Math.min(stage.width / vw, stage.height / vh);
  const w = vw * k, h = vh * k;
  Object.assign(overlay.style, {
    left: `${(stage.width - w) / 2}px`, top: `${(stage.height - h) / 2}px`,
    width: `${w}px`, height: `${h}px`,
  });
  const dpr = window.devicePixelRatio || 1;
  overlay.width = Math.round(w * dpr);
  overlay.height = Math.round(h * dpr);
}
video.addEventListener('loadedmetadata', layoutOverlay);
new ResizeObserver(layoutOverlay).observe($('#stage'));

// Posouvání titulků tažením přímo v náhledu (nahoru/dolů).
const drag = { active: false, hover: false, moved: false, startY: 0, startPos: 0 };
let lastBox = null;

function drawGuides(box) {
  const W = overlay.width, H = overlay.height;
  octx.save();
  if (drag.active) {
    // Zóny, kde na Reels překáží rozhraní Instagramu (horní lišta, popisek a tlačítka dole/vpravo).
    octx.fillStyle = 'rgba(239,68,68,0.18)';
    octx.fillRect(0, 0, W, H * 0.12);
    octx.fillRect(0, H * 0.8, W, H * 0.2);
    octx.fillRect(W * 0.86, H * 0.4, W * 0.14, H * 0.4);
    // Středová vodítka.
    octx.strokeStyle = 'rgba(255,255,255,0.35)';
    octx.setLineDash([6, 6]);
    octx.lineWidth = 1 * (window.devicePixelRatio || 1);
    octx.beginPath(); octx.moveTo(0, H / 2); octx.lineTo(W, H / 2); octx.stroke();
  }
  if (box) {
    const pad = 10 * (window.devicePixelRatio || 1);
    octx.setLineDash([8, 6]);
    octx.lineWidth = 2 * (window.devicePixelRatio || 1);
    octx.strokeStyle = drag.active ? '#ffd400' : 'rgba(255,212,0,0.8)';
    octx.strokeRect(box.x - pad, box.y - pad, box.w + pad * 2, box.h + pad * 2);
  }
  octx.restore();
}

function frame() {
  const t = video.currentTime || 0;
  octx.clearRect(0, 0, overlay.width, overlay.height);
  // Prolnutí (inverze apod.) dělá v náhledu CSS přímo nad videem, v exportu canvas.
  const blend = state.style.blend || 'normal';
  if (overlay.style.mixBlendMode !== blend) overlay.style.mixBlendMode = blend;
  lastBox = state.groups.length ? drawCaptions(octx, overlay.width, overlay.height, t, state.groups, state.style, { blend: false }) : null;
  if (drag.active || drag.hover) {
    // Když zrovna žádný titulek neběží, ukaž aspoň orientační rámeček na jeho pozici.
    const H = overlay.height, W = overlay.width;
    const box = lastBox || { x: W * 0.15, w: W * 0.7, h: (state.style.sizePct / 100) * W * 1.18, y: (state.style.posY / 100) * H - (state.style.sizePct / 100) * W * 0.59 };
    drawGuides(box);
  }
  $('#timeLabel').textContent = formatTime(t);
  highlightActiveRow(t);
  requestAnimationFrame(frame);
}
fontsReady.then(() => requestAnimationFrame(frame));

const stage = $('#stage');
function overlayPoint(e) {
  const r = overlay.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, r };
}
// Je kurzor na titulku? (s rezervou, ať se dobře chytá i na mobilu)
function hitCaption(e) {
  if (!state.groups.length) return false;
  const p = overlayPoint(e);
  const H = overlay.height, W = overlay.width;
  const half = lastBox ? lastBox.h / 2 / H : (state.style.sizePct / 100) * (W / H) * 0.6;
  return Math.abs(p.y - state.style.posY / 100) < half + 0.04 && p.x >= 0 && p.x <= 1;
}

stage.addEventListener('pointermove', (e) => {
  if (drag.active) {
    const p = overlayPoint(e);
    const dy = (e.clientY - drag.startY) / p.r.height * 100;
    if (Math.abs(dy) > 0.5) drag.moved = true;
    let pos = Math.min(95, Math.max(5, drag.startPos + dy));
    if (Math.abs(pos - 50) < 1.5) pos = 50; // přichycení na střed
    state.style.posY = Math.round(pos * 10) / 10;
    document.querySelector('[data-style="posY"]').value = state.style.posY;
    return;
  }
  drag.hover = hitCaption(e);
  stage.style.cursor = drag.hover ? 'ns-resize' : 'pointer';
});
stage.addEventListener('pointerleave', () => { if (!drag.active) drag.hover = false; });
stage.addEventListener('pointerdown', (e) => {
  if (!state.file) return;
  drag.moved = false;
  if (hitCaption(e)) {
    drag.active = true;
    drag.startY = e.clientY;
    drag.startPos = state.style.posY;
    stage.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
});
stage.addEventListener('pointerup', (e) => {
  if (drag.active) {
    drag.active = false;
    stage.releasePointerCapture(e.pointerId);
    if (drag.moved) { save(); return; }
  }
  // Obyčejné kliknutí = přehrát / pauza.
  if (state.file) video.paused ? video.play() : video.pause();
});

$('#playBtn').addEventListener('click', () => (video.paused ? video.play() : video.pause()));
video.addEventListener('play', () => ($('#playBtn').textContent = '❚❚ Pauza'));
video.addEventListener('pause', () => ($('#playBtn').textContent = '▶ Přehrát'));
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement.tagName) && state.file) {
    e.preventDefault();
    video.paused ? video.play() : video.pause();
  }
});

// ---------- Export ----------

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}
const baseName = () => (state.file?.name || 'video').replace(/\.[^.]+$/, '');

$('#exportSrtBtn').addEventListener('click', () => {
  const srt = toSRT(state.groups, state.style.uppercase);
  download(new Blob([srt], { type: 'text/plain;charset=utf-8' }), `${baseName()}.srt`);
});

$('#exportVideoBtn').addEventListener('click', async () => {
  if (state.busy) return;
  state.busy = true; updateButtons();
  video.pause();
  $('#cancelExportBtn').hidden = false;
  $('#shareBtn').hidden = true;
  await keepAwake(true);
  try {
    await fontsReady;
    const { exportVideo } = await import('./export.js');
    setProgress('export', 0, 'Připravuji export…');
    const t0 = performance.now();
    const res = await exportVideo(state.file, state.groups, state.style, {
      onProgress: (p) => setProgress('export', p, `Vypaluji titulky… ${Math.round(p * 100)} %`),
    });
    const name = `${baseName()}-titulky.${res.ext}`;
    state.lastExport = new File([res.blob], name, { type: res.blob.type });
    // Na počítači se video rovnou stáhne. Na mobilu nabídneme uložení do Fotek / sdílení
    // (prohlížeče v telefonu automatické stahování po dlouhé operaci často blokují).
    if (isPhone) {
      const canShare = navigator.canShare?.({ files: [state.lastExport] });
      $('#shareBtn').textContent = canShare ? 'Uložit do Fotek / Sdílet' : 'Stáhnout video';
      $('#shareBtn').hidden = false;
    } else {
      download(res.blob, name);
    }
    let msg = `Hotovo za ${((performance.now() - t0) / 1000).toFixed(0)} s (${res.width}×${res.height}, ${(res.blob.size / 1048576).toFixed(1)} MB).`;
    if (res.fallback) msg += ' Prohlížeč neumí MP4/H.264, uloženo jako WebM – pro Instagram použij Chrome nebo Edge.';
    if (res.audioDropped) msg += ' Pozor: zvuk se nepodařilo převést, video je bez zvuku.';
    setProgress('export', 1, msg);
  } catch (err) {
    console.error(err);
    const canceled = err?.name === 'ConversionCanceledError' || /cancel/i.test(err?.message);
    setProgress('export', 0, canceled ? 'Export zrušen.' : 'Chyba exportu: ' + err.message);
  } finally {
    state.busy = false; updateButtons();
    $('#cancelExportBtn').hidden = true;
    keepAwake(false);
  }
});
$('#shareBtn').addEventListener('click', async () => {
  const f = state.lastExport;
  if (!f) return;
  if (navigator.canShare?.({ files: [f] })) {
    try { await navigator.share({ files: [f], title: f.name }); } catch (e) { if (e.name !== 'AbortError') download(f, f.name); }
  } else {
    download(f, f.name);
  }
});

$('#cancelExportBtn').addEventListener('click', async () => {
  const { cancelExport } = await import('./export.js');
  cancelExport();
});

function updateButtons() {
  const has = state.groups.length > 0;
  $('#transcribeBtn').disabled = !state.file || state.busy;
  $('#exportVideoBtn').disabled = !has || state.busy;
  $('#exportSrtBtn').disabled = !has;
  $('#regroupBtn').disabled = !has;
}

// Ladicí háček pro testy: window.__titulky.setWords([...])
window.__titulky = {
  state,
  setWords(words) { state.groups = groupWords(words, { maxWords: state.style.maxWords }); renderEditor(); save(); },
};

syncStyleInputs();
fontsReady.then(buildPresets);

// ---------- Nezhasínat displej během dlouhé práce ----------
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => (wakeLock = null));
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.busy) keepAwake(true);
});

// ---------- Mobilní rozložení (záložky) ----------
const mobileQuery = window.matchMedia('(max-width: 760px)');
function setTab(tab) {
  document.body.dataset.tab = tab;
  document.querySelectorAll('#tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.go === tab));
  try { localStorage.setItem('titulky:tab', tab); } catch {}
  if (mobileQuery.matches) window.scrollTo({ top: 0 });
}
$('#tabbar').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-go]');
  if (b) setTab(b.dataset.go);
});
// Export je na mobilu v záložce Video, na počítači pod náhledem.
function placeExport() {
  const block = $('#exportBlock');
  if (mobileQuery.matches) $('#exportSlotMobile').appendChild(block);
  else $('.preview-wrap').appendChild(block);
}
mobileQuery.addEventListener('change', placeExport);
placeExport();
let savedTab = 'video';
try { savedTab = localStorage.getItem('titulky:tab') || 'video'; } catch {}
setTab(savedTab);

// ---------- Instalace na plochu (PWA) ----------
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
renderEditor();

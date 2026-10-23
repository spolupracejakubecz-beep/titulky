// Web Worker: přepis řeči pomocí Whisperu (transformers.js) přímo v prohlížeči.
// Běží mimo hlavní vlákno, aby se UI nezaseklo.
import { pipeline, env } from './vendor/transformers.min.js';

// Modely se stahují z Hugging Face jen poprvé, pak jsou v cache prohlížeče.
env.allowLocalModels = false;
env.useBrowserCache = true;
// WASM runtime ONNX bereme z lokální složky vendor/ (žádné CDN).
env.backends.onnx.wasm.wasmPaths = {
  mjs: new URL('./vendor/ort/ort-wasm-simd-threaded.asyncify.mjs', import.meta.url).href,
  wasm: new URL('./vendor/ort/ort-wasm-simd-threaded.asyncify.wasm', import.meta.url).href,
};

// Varianty modelů. Všechny "_timestamped" verze umí časování po slovech.
const MODELS = {
  small: {
    id: 'onnx-community/whisper-small_timestamped',
    dtype: {
      webgpu_f16: { encoder_model: 'fp16', decoder_model_merged: 'q4' },
      webgpu: { encoder_model: 'fp32', decoder_model_merged: 'q4' },
      wasm: { encoder_model: 'q8', decoder_model_merged: 'q8' },
    },
  },
  turbo: {
    id: 'onnx-community/whisper-large-v3-turbo_timestamped',
    dtype: {
      webgpu_f16: { encoder_model: 'q4f16', decoder_model_merged: 'q4f16' },
      webgpu: { encoder_model: 'q4', decoder_model_merged: 'q4' },
      wasm: { encoder_model: 'q8', decoder_model_merged: 'q8' },
    },
  },
  base: {
    id: 'onnx-community/whisper-base_timestamped',
    dtype: {
      webgpu: { encoder_model: 'fp32', decoder_model_merged: 'q4' },
      wasm: { encoder_model: 'q8', decoder_model_merged: 'q8' },
    },
  },
};

let asr = null;
let loadedKey = null;

// Kolik souborů modelu (.onnx) už je uložených v paměti prohlížeče.
async function cachedModelFiles(modelId) {
  try {
    const c = await caches.open(env.cacheKey || 'transformers-cache');
    const keys = await c.keys();
    return keys.filter((k) => k.url.includes(modelId) && /\.onnx(_data)?$/.test(k.url)).length;
  } catch {
    return 0;
  }
}

async function getPipeline(modelKey, device, hasF16) {
  const key = `${modelKey}|${device}|${hasF16}`;
  if (asr && loadedKey === key) return asr;
  if (asr) { try { await asr.dispose(); } catch {} asr = null; }

  const m = MODELS[modelKey];
  let dtype = m.dtype.wasm;
  if (device === 'webgpu') dtype = (hasF16 && m.dtype.webgpu_f16) || m.dtype.webgpu;

  const files = {};
  const fromCache = (await cachedModelFiles(m.id)) >= 2;
  self.postMessage({ type: 'status', text: fromCache ? 'Načítám model z paměti zařízení (nic se nestahuje)…' : 'Stahuji model (jen poprvé)…' });
  asr = await pipeline('automatic-speech-recognition', m.id, {
    device,
    dtype,
    progress_callback: (p) => {
      if (p.status === 'progress' && p.file) {
        files[p.file] = { loaded: p.loaded || 0, total: p.total || 0 };
        let loaded = 0, total = 0;
        for (const f of Object.values(files)) { loaded += f.loaded; total += f.total; }
        self.postMessage({ type: 'download', loaded, total, file: p.file, fromCache });
      }
    },
  });
  loadedKey = key;
  // Ověření, že se model opravdu uložil (jinak by se stahoval při každém otevření).
  if (!fromCache && (await cachedModelFiles(m.id)) < 2) {
    self.postMessage({ type: 'warn', text: 'Model se nepodařilo uložit do paměti prohlížeče (málo místa, nebo anonymní/soukromé okno). Příště se bude stahovat znovu.' });
  }
  return asr;
}

self.onmessage = async (e) => {
  const { type } = e.data;
  if (type !== 'transcribe') return;
  const { audio, modelKey, device, hasF16 } = e.data;
  try {
    const p = await getPipeline(modelKey, device, hasF16);

    self.postMessage({ type: 'status', text: 'Přepisuji řeč…' });
    const t0 = performance.now();
    const out = await p(audio, {
      language: 'czech',
      task: 'transcribe',
      return_timestamps: 'word',
      chunk_length_s: 30,
      stride_length_s: 5,
    });
    const words = (out.chunks || [])
      .map((c) => ({
        text: (c.text || '').trim(),
        start: c.timestamp?.[0] ?? 0,
        end: c.timestamp?.[1] ?? c.timestamp?.[0] ?? 0,
      }))
      .filter((w) => w.text.length > 0);

    self.postMessage({ type: 'result', words, text: out.text, seconds: (performance.now() - t0) / 1000 });
  } catch (err) {
    console.error(err);
    self.postMessage({ type: 'error', message: String(err?.message || err) });
  }
};

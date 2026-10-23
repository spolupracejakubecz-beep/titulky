// Export videa s vypálenými titulky. Používá WebCodecs (přes knihovnu Mediabunny),
// takže se kóduje přímo v prohlížeči a rychleji než v reálném čase.
import {
  Input, ALL_FORMATS, BlobSource, Output, Mp4OutputFormat, WebMOutputFormat,
  BufferTarget, Conversion, QUALITY_HIGH, canEncodeVideo,
} from './vendor/mediabunny.min.mjs';
import { drawCaptions } from './captions.js';

let current = null;

export async function cancelExport() {
  if (current) await current.cancel();
}

// maxSide: delší strana výstupu (1920 = Full HD pro Reels).
export async function exportVideo(file, groups, style, { maxSide = 1920, onProgress } = {}) {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const vTrack = await input.getPrimaryVideoTrack();
  if (!vTrack) throw new Error('Soubor neobsahuje video stopu.');

  // Výstupní rozměr: zachovat poměr stran, delší strana max maxSide, sudé rozměry (kvůli H.264).
  const dw = vTrack.displayWidth, dh = vTrack.displayHeight;
  const k = Math.min(1, maxSide / Math.max(dw, dh));
  const even = (n) => Math.max(2, Math.round(n / 2) * 2);
  const outW = even(dw * k), outH = even(dh * k);

  // MP4 + H.264 (to chce Instagram). Kdyby prohlížeč neuměl H.264, nouzově WebM/VP9.
  const useMp4 = await canEncodeVideo('avc', { width: outW, height: outH });
  const format = useMp4 ? new Mp4OutputFormat({ fastStart: 'in-memory' }) : new WebMOutputFormat();
  const videoCodec = useMp4 ? 'avc' : 'vp9';
  const audioCodec = useMp4 ? 'aac' : 'opus';

  const target = new BufferTarget();
  const output = new Output({ format, target });

  const canvas = document.createElement('canvas');
  canvas.width = outW; canvas.height = outH;
  const ctx = canvas.getContext('2d');

  const conversion = await Conversion.init({
    input,
    output,
    showWarnings: false,
    video: {
      codec: videoCodec,
      bitrate: QUALITY_HIGH,
      width: outW,
      height: outH,
      fit: 'contain',
      forceTranscode: true,
      process: (sample) => {
        ctx.clearRect(0, 0, outW, outH);
        sample.drawWithFit(ctx, { fit: 'contain' });
        drawCaptions(ctx, outW, outH, sample.timestamp, groups, style);
        return canvas;
      },
      processedWidth: outW,
      processedHeight: outH,
    },
    // Zvuk se zkopíruje beze změny, pokud už je ve správném formátu; jinak se překóduje.
    audio: { codec: audioCodec },
  });

  if (!conversion.isValid) {
    const why = conversion.discardedTracks.map((d) => `${d.track.type}: ${d.reason}`).join(', ');
    throw new Error('Tento soubor nejde v prohlížeči převést (' + why + ').');
  }
  const audioDropped = conversion.discardedTracks.some((d) => d.track.type === 'audio');

  conversion.onProgress = (p) => onProgress?.(p);
  current = conversion;
  try {
    await conversion.execute();
  } finally {
    current = null;
  }

  const blob = new Blob([target.buffer], { type: useMp4 ? 'video/mp4' : 'video/webm' });
  return { blob, ext: useMp4 ? 'mp4' : 'webm', width: outW, height: outH, audioDropped, fallback: !useMp4 };
}

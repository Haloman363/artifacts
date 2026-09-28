// Exporters. Images and SVG come from the last rendered frame; animations re-render every
// frame through `renderFrame(t, frameIndex) => canvas` so output is frame-exact.
import {
  BufferTarget,
  CanvasSource,
  canEncodeVideo,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  WebMOutputFormat,
} from "mediabunny";
import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { zipSync, strToU8 } from "fflate";
import { getLastGrid } from "./scriptSlayer.js";

export const download = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

// Nearest-neighbour upscale so dithered pixels stay crisp.
const scaled = (canvas, scale) => {
  const out = new OffscreenCanvas(Math.round(canvas.width * scale), Math.round(canvas.height * scale));
  const ctx = out.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
};

const MIME = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

export const exportImage = (canvas, format, scale) =>
  scaled(canvas, scale).convertToBlob({ type: MIME[format], quality: 0.95 });

// One <path> per colour built from horizontal pixel runs. `inkOnly` keeps only dark pixels
// as a single black layer (for print, laser, vinyl).
export const exportSvg = (canvas, { inkOnly = false, scale = 1 } = {}) => {
  const { width, height } = canvas;
  const data = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, width, height).data;
  const paths = new Map();
  const add = (key, d) => {
    const list = paths.get(key);
    if (list) list.push(d);
    else paths.set(key, [d]);
  };
  for (let y = 0; y < height; y++) {
    let x = 0;
    while (x < width) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      let run = 1;
      while (x + run < width) {
        const j = i + run * 4;
        if (data[j] !== r || data[j + 1] !== g || data[j + 2] !== b || data[j + 3] !== a) break;
        run++;
      }
      const dark = 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
      if (a > 0 && (!inkOnly || dark)) {
        const fill = inkOnly ? "#000" : `rgb(${r},${g},${b})`;
        add(a < 255 && !inkOnly ? `${fill}|${(a / 255).toFixed(3)}` : fill, `M${x} ${y}h${run}v1h-${run}z`);
      }
      x += run;
    }
  }
  const body = [...paths]
    .map(([key, ds]) => {
      const [fill, opacity] = key.split("|");
      return `<path fill="${fill}"${opacity ? ` fill-opacity="${opacity}"` : ""} d="${ds.join("")}"/>`;
    })
    .join("\n");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">\n${body}\n</svg>\n`;
  return new Blob([svg], { type: "image/svg+xml" });
};


// `grid` defaults to the most recent Script Slayer render; the preview passes its own snapshot.
export const textGrid = (grid = getLastGrid()) => {
  if (!grid) throw new Error("Add a Script Slayer stage to export text");
  return grid.lines.join("\n") + "\n";
};

export const exportText = (grid) => new Blob([textGrid(grid)], { type: "text/plain;charset=utf-8" });

const frameTimes = (duration, fps) => {
  const count = Math.max(1, Math.round(duration * fps));
  return Array.from({ length: count }, (_, i) => i / fps);
};

// Even dimensions keep H.264 encoders happy.
const evenCanvas = (w, h) => new OffscreenCanvas(w + (w % 2), h + (h % 2));

export const exportVideo = async ({ renderFrame, duration, fps, scale, format, onProgress, signal }) => {
  const first = await renderFrame(0, 0);
  const out = evenCanvas(Math.round(first.width * scale), Math.round(first.height * scale));
  const ctx = out.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const codec = format === "mp4" ? "avc" : "vp9";
  if (!(await canEncodeVideo(codec, { width: out.width, height: out.height }))) {
    throw new Error(`This browser cannot encode ${codec.toUpperCase()} at ${out.width}×${out.height}`);
  }
  const output = new Output({
    format: format === "mp4" ? new Mp4OutputFormat({ fastStart: "in-memory" }) : new WebMOutputFormat(),
    target: new BufferTarget(),
  });
  const source = new CanvasSource(out, { codec, quality: QUALITY_HIGH });
  output.addVideoTrack(source, { frameRate: fps });
  await output.start();

  const times = frameTimes(duration, fps);
  for (let i = 0; i < times.length; i++) {
    if (signal?.aborted) {
      await output.cancel();
      throw new DOMException("Export cancelled", "AbortError");
    }
    const frame = i === 0 ? first : await renderFrame(times[i], i);
    ctx.drawImage(frame, 0, 0, out.width, out.height);
    await source.add(times[i], 1 / fps);
    onProgress?.((i + 1) / times.length);
  }
  await output.finalize();
  return new Blob([output.target.buffer], { type: format === "mp4" ? "video/mp4" : "video/webm" });
};

export const exportGif = async ({ renderFrame, duration, fps, scale, onProgress, signal }) => {
  const gif = GIFEncoder();
  const times = frameTimes(duration, fps);
  const delay = Math.round(1000 / fps);
  for (let i = 0; i < times.length; i++) {
    if (signal?.aborted) throw new DOMException("Export cancelled", "AbortError");
    const frame = scaled(await renderFrame(times[i], i), scale);
    const { data, width, height } = frame.getContext("2d").getImageData(0, 0, frame.width, frame.height);
    const palette = quantize(data, 256, { format: "rgba4444", oneBitAlpha: true });
    gif.writeFrame(applyPalette(data, palette, "rgba4444"), width, height, { palette, delay, transparent: true });
    onProgress?.((i + 1) / times.length);
  }
  gif.finish();
  return new Blob([gif.bytes()], { type: "image/gif" });
};

// PNG sequence (and the text grid per frame when a Script Slayer stage is present) as a zip.
export const exportSequence = async ({ renderFrame, duration, fps, scale, withText, onProgress, signal }) => {
  const files = {};
  const times = frameTimes(duration, fps);
  const pad = String(times.length).length;
  for (let i = 0; i < times.length; i++) {
    if (signal?.aborted) throw new DOMException("Export cancelled", "AbortError");
    const frame = await renderFrame(times[i], i);
    const name = `frame-${String(i).padStart(pad, "0")}`;
    const blob = await scaled(frame, scale).convertToBlob({ type: "image/png" });
    files[`${name}.png`] = new Uint8Array(await blob.arrayBuffer());
    if (withText) files[`${name}.txt`] = strToU8(textGrid());
    onProgress?.((i + 1) / times.length);
  }
  return new Blob([zipSync(files, { level: 0 })], { type: "application/zip" });
};

// "Script Slayer" stage: renders the frame as a grid of glyphs. It uses the engine's
// FilterDefinition shape so it sits in the same chain as the engine filters and any
// effect placed after it post-processes the glyph image.
import { nearest } from "@gyng/ditherer-filters";
import { charsetGlyphs, rampFor } from "./charsets.js";

export const MAX_CUSTOM_CHARS = 10;

const FONTS = [
  { name: "Monospace", value: "monospace" },
  { name: "Courier", value: "'Courier New', Courier, monospace" },
  { name: "Menlo / DejaVu", value: "Menlo, 'DejaVu Sans Mono', monospace" },
  { name: "Serif", value: "serif" },
  { name: "Sans", value: "sans-serif" },
];

const optionTypes = {
  // Rendered by the UI as a visual glyph picker (ui/CharsetPicker.jsx).
  charset: { type: "CHARSET", label: "Character set", default: "ASCII / Classic ramp" },
  cellSize: { type: "RANGE", label: "Cell size", range: [4, 64], step: 1, default: 10 },
  depth: {
    type: "RANGE",
    label: "Character depth",
    range: [0.1, 4],
    step: 0.05,
    default: 1,
    desc: "Contrast curve applied before luminance picks a glyph",
  },
  offset: {
    type: "RANGE",
    label: "Character offset",
    range: [-1, 1],
    step: 0.01,
    default: 0,
    desc: "Shifts which glyph each luminance lands on (wraps around the set)",
  },
  colorMode: {
    type: "ENUM",
    label: "Glyph colour",
    options: [
      { name: "Source colour", value: "source" },
      { name: "Palette mapped", value: "palette" },
      { name: "Single colour", value: "single" },
    ],
    default: "source",
  },
  color: {
    type: "COLOR",
    label: "Colour",
    default: [255, 255, 255],
    visibleWhen: (o) => o.colorMode === "single",
  },
  palette: {
    type: "PALETTE",
    label: "Palette",
    default: nearest,
    visibleWhen: (o) => o.colorMode === "palette",
  },
  background: {
    type: "ENUM",
    label: "Background",
    options: [
      { name: "Transparent", value: "transparent" },
      { name: "Colour", value: "color" },
    ],
    default: "color",
  },
  backgroundColor: {
    type: "COLOR",
    label: "Background colour",
    default: [0, 0, 0],
    visibleWhen: (o) => o.background === "color",
  },
  font: { type: "ENUM", label: "Font", options: FONTS, default: "monospace" },
  bold: { type: "BOOL", label: "Bold", default: false },
  invert: { type: "BOOL", label: "Invert", default: false },
  customChars: {
    type: "STRING",
    label: "Custom characters",
    default: "",
    desc: `Up to ${MAX_CUSTOM_CHARS} extra glyphs injected into the set`,
  },
  sortByDensity: { type: "BOOL", label: "Sort by ink density", default: true },
};

const defaults = Object.fromEntries(Object.entries(optionTypes).map(([k, v]) => [k, v.default]));

// Glyph grid of the most recent render, for .txt export.
let lastGrid = null;
export const getLastGrid = () => lastGrid;

const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

const func = (input, options = defaults) => {
  const o = { ...defaults, ...options };
  const { width, height } = input;
  const cell = Math.max(2, Math.round(o.cellSize));
  const cols = Math.max(1, Math.floor(width / cell));
  const rows = Math.max(1, Math.floor(height / cell));
  const font = `${o.bold ? "bold " : ""}${cell}px ${o.font}`;

  const custom = [...(o.customChars ?? "")].slice(0, MAX_CUSTOM_CHARS).join("");
  const ramp = rampFor(charsetGlyphs(o.charset) + custom, o.font, o.sortByDensity);
  if (o.invert) ramp.reverse();

  // Average each cell by letting the browser downscale the frame to one pixel per cell.
  const small = new OffscreenCanvas(cols, rows);
  const sctx = small.getContext("2d", { willReadFrequently: true });
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(input, 0, 0, cols, rows);
  const px = sctx.getImageData(0, 0, cols, rows).data;

  const out = new OffscreenCanvas(width, height);
  const ctx = out.getContext("2d");
  if (o.background === "color") {
    ctx.fillStyle = rgb(o.backgroundColor);
    ctx.fillRect(0, 0, width, height);
  }
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const n = ramp.length;
  const offsetSteps = Math.round(o.offset * n);
  const palette = o.palette ?? nearest;
  const lines = [];
  let lastStyle = "";

  for (let y = 0; y < rows; y++) {
    let line = "";
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3];
      const lum = ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * (a / 255);
      const shaped = Math.pow(lum, 1 / o.depth);
      const idx = (((Math.min(n - 1, Math.floor(shaped * n)) + offsetSteps) % n) + n) % n;
      const glyph = ramp[idx];
      line += glyph;
      if (glyph === " " || glyph === "⠀") continue;

      const c =
        o.colorMode === "single"
          ? o.color
          : o.colorMode === "palette"
            ? palette.getColor([r, g, b, 255], palette.options)
            : [r, g, b];
      const style = rgb(c);
      if (style !== lastStyle) {
        ctx.fillStyle = style;
        lastStyle = style;
      }
      ctx.fillText(glyph, x * cell + cell / 2, y * cell + cell / 2);
    }
    lines.push(line);
  }

  lastGrid = { cols, rows, lines };
  return out;
};

export const scriptSlayer = {
  name: "Script Slayer",
  history: {},
  func,
  optionTypes,
  defaults,
  options: defaults,
  description: "Render the image as a grid of characters from 50 glyph sets",
  noGL: "Glyph rasterisation runs on Canvas2D",
};

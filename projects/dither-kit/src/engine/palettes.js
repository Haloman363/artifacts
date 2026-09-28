// Palette helpers on top of the engine's palette objects ({ name, getColor, options }).
import {
  createPalette,
  deserializePalette,
  findMatchingThemeKey,
  medianCutPalette,
  nearest,
  reducePaletteToCap,
  serializePalette,
  THEME_CATEGORIES,
  THEMES,
} from "@gyng/ditherer-filters";

export { THEME_CATEGORIES, THEMES, findMatchingThemeKey };

export const levelsPalette = (levels) => ({ ...nearest, options: { ...nearest.options, levels } });
export const colorsPalette = (colors) => createPalette(colors);

export const isLevelsPalette = (p) => p?.name === nearest.name;
export const paletteColors = (p) => (Array.isArray(p?.options?.colors) ? p.options.colors : null);

// Median-cut the frame down to `count` colours.
export const extractColors = (canvas, count) => {
  const small = new OffscreenCanvas(Math.min(canvas.width, 256), Math.min(canvas.height, 256));
  const ctx = small.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, small.width, small.height);
  const buf = ctx.getImageData(0, 0, small.width, small.height).data;
  const depth = Math.ceil(Math.log2(Math.max(2, count)));
  const colors = medianCutPalette(buf, depth, true, "AVERAGE").map(([r, g, b]) => [r, g, b, 255]);
  return reducePaletteToCap(colors, count);
};

const hex = (c) => c.slice(0, 3).map((v) => v.toString(16).padStart(2, "0")).join("");

// Lospec-compatible formats: .hex (one RRGGBB per line) and GIMP .gpl.
export const formatHex = (colors) => colors.map(hex).join("\n") + "\n";

export const formatGpl = (colors, name = "Dither Kit") =>
  [
    "GIMP Palette",
    `Name: ${name}`,
    "#",
    ...colors.map((c) => `${c[0].toString().padStart(3)} ${c[1].toString().padStart(3)} ${c[2].toString().padStart(3)}\t#${hex(c)}`),
  ].join("\n") + "\n";

export const parsePaletteFile = (text) => {
  const colors = [];
  if (/^GIMP Palette/.test(text)) {
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)/);
      if (m) colors.push([+m[1], +m[2], +m[3], 255]);
    }
  } else {
    for (const m of text.matchAll(/#?\b([0-9a-f]{6})\b/gi)) {
      const n = parseInt(m[1], 16);
      colors.push([(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]);
    }
  }
  if (!colors.length) throw new Error("No colours found in palette file");
  return colors;
};

// Palette options hold functions; presets store them in the engine's serialized form.
const isPalette = (v) => v && typeof v === "object" && typeof v.getColor === "function";

export const serializeOptions = (options) =>
  Object.fromEntries(Object.entries(options).map(([k, v]) => [k, isPalette(v) ? serializePalette(v) : v]));

export const deserializeOptions = (options) =>
  Object.fromEntries(
    Object.entries(options).map(([k, v]) => [k, v && v._serialized ? deserializePalette(v) : v]),
  );

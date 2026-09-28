// Whole-chain presets: built-ins plus user presets in localStorage, and JSON file import/export.
import { CATALOG, findEntry } from "./catalog.js";
import { deserializeOptions, serializeOptions } from "./palettes.js";

const KEY = "dither-kit:presets";

let nextId = 1;
export const newId = () => `s${Date.now().toString(36)}${nextId++}`;

// Catalog variants (e.g. "Floyd-Steinberg (Synthwave)") set only the options they change,
// so layer them over the filter's full defaults.
export const baseOptions = (filter) => ({ ...(filter.defaults ?? {}), ...(filter.options ?? {}) });

export const makeStage = (entry, options) => ({
  id: newId(),
  displayName: entry.displayName,
  category: entry.category,
  filter: entry.filter,
  options: { ...baseOptions(entry.filter), ...options },
  enabled: true,
  keyframes: {},
});

export const serializeChain = (stages) =>
  stages.map((s) => ({
    name: s.displayName,
    enabled: s.enabled,
    options: serializeOptions(s.options),
    keyframes: s.keyframes,
  }));

// Unknown filter names (e.g. from a newer engine) are skipped rather than failing the load.
export const deserializeChain = (items) =>
  items.flatMap((item) => {
    const entry = findEntry(item.name);
    if (!entry) return [];
    return [
      {
        ...makeStage(entry, deserializeOptions(item.options ?? {})),
        enabled: item.enabled ?? true,
        keyframes: item.keyframes ?? {},
      },
    ];
  });

const SS = "Script Slayer (ASCII)";

export const BUILTIN_PRESETS = [
  { name: "Game Boy", chain: [{ name: "Ordered (Gameboy)" }] },
  { name: "Mac 1-bit", chain: [{ name: "Atkinson (Mac)" }] },
  { name: "PICO-8", chain: [{ name: "Ordered (PICO-8)" }] },
  { name: "Synthwave glow", chain: [{ name: "Floyd-Steinberg (Synthwave)" }, { name: "Bloom" }] },
  { name: "VHS tape", chain: [{ name: "Posterize" }, { name: "VHS emulation" }] },
  { name: "CRT terminal", chain: [{ name: SS, options: { colorMode: "single", color: [60, 255, 120] } }, { name: "CRT emulation" }] },
  { name: "Matrix", chain: [{ name: SS, options: { charset: "Unicode / Matrix", colorMode: "single", color: [0, 255, 70], cellSize: 12 } }, { name: "Bloom" }] },
  { name: "Braille print", chain: [{ name: SS, options: { charset: "Braille / Braille full", colorMode: "single", color: [0, 0, 0], backgroundColor: [255, 255, 255], invert: true, cellSize: 8 } }] },
  { name: "Glitch stack", chain: [{ name: "Floyd-Steinberg" }, { name: "JPEG artifact" }, { name: "Chromatic aberration" }, { name: "Glitch" }] },
  { name: "CMYK print", chain: [{ name: "CMYK halftone" }] },
].filter((p) => p.chain.every((c) => CATALOG.some((e) => e.displayName === c.name)));

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
};

export const loadUserPresets = read;

export const saveUserPreset = (name, stages) => {
  const list = read().filter((p) => p.name !== name);
  list.push({ name, chain: serializeChain(stages) });
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
};

export const deleteUserPreset = (name) => {
  const list = read().filter((p) => p.name !== name);
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
};

// `chain` is already serialized (as stored in localStorage).
export const presetBlob = (name, chain) =>
  new Blob([JSON.stringify({ app: "dither-kit", version: 1, name, chain }, null, 2)], { type: "application/json" });

export const parsePresetFile = (text) => {
  const data = JSON.parse(text);
  if (data?.app !== "dither-kit" || !Array.isArray(data.chain)) throw new Error("Not a Dither Kit preset file");
  return data;
};

#!/usr/bin/env node
/**
 * render-check.js — rasterize the game's scene SVG in a forced visual state,
 * without a browser. Usage:
 *
 *   npm i sharp
 *   node tools/render-check.js idle
 *   node tools/render-check.js scream
 *   node tools/render-check.js corrupt
 *
 * Writes renders/check-<state>.png. Extend FORCE below for new states.
 */
const fs = require('fs');
const path = require('path');

const state = process.argv[2] || 'idle';
const htmlPath = path.join(__dirname, '..', 'index.html');
const outDir = path.join(__dirname, '..', 'renders');

const FORCE = {
  idle: [],
  scream: [
    ['<g id="faceScream" opacity="0">', '<g id="faceScream" opacity="1">'],
    ['<g id="faceIdle">', '<g id="faceIdle" opacity="0">'],
  ],
  alarmed: [
    ['<g id="faceAlarmed" opacity="0">', '<g id="faceAlarmed" opacity="1">'],
    ['<g id="faceIdle">', '<g id="faceIdle" opacity="0">'],
  ],
  corrupt: [
    ['<g id="houseGroup" opacity="0">', '<g id="houseGroup" opacity="1">'],
    ['id="houseWindow" opacity="0"', 'id="houseWindow" opacity="1"'],
    ['id="duskOverlay" x="0" y="0" width="390" height="700" fill="#12070C" opacity="0"',
     'id="duskOverlay" x="0" y="0" width="390" height="700" fill="#12070C" opacity="0.42"'],
    ['id="redVigRect" x="0" y="0" width="390" height="700" fill="url(#redvig)" opacity="0"',
     'id="redVigRect" x="0" y="0" width="390" height="700" fill="url(#redvig)" opacity="1"'],
    ['<g id="eyesCorrupt" opacity="0">', '<g id="eyesCorrupt" opacity="1">'],
  ],
};

if (!FORCE[state]) {
  console.error('Unknown state:', state, '— options:', Object.keys(FORCE).join(', '));
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const m = html.match(/<svg viewBox="0 0 390 700"[^>]*>([\s\S]*?)<\/svg>\s*<\/div>/);
if (!m) { console.error('Scene SVG not found in index.html'); process.exit(1); }

let inner = m[1];
for (const [from, to] of FORCE[state]) {
  if (!inner.includes(from)) console.warn('WARN: pattern not found:', from.slice(0, 60));
  inner = inner.split(from).join(to);
}

const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 700" width="390" height="700">'
  + inner + '</svg>';

fs.mkdirSync(outDir, { recursive: true });
const outPng = path.join(outDir, `check-${state}.png`);

require('sharp')(Buffer.from(svg)).png().toFile(outPng)
  .then(() => console.log('wrote', outPng))
  .catch((e) => { console.error('render failed:', e.message); process.exit(1); });

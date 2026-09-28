import { useRef, useState } from "react";
import {
  THEME_CATEGORIES,
  THEMES,
  colorsPalette,
  extractColors,
  findMatchingThemeKey,
  formatGpl,
  formatHex,
  isLevelsPalette,
  levelsPalette,
  paletteColors,
  parsePaletteFile,
} from "../engine/palettes.js";
import { download } from "../engine/export.js";

const toHex = (c) => "#" + c.slice(0, 3).map((v) => v.toString(16).padStart(2, "0")).join("");
const fromHex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).concat(255);

export function PalettePicker({ value, onChange, extractFrom }) {
  const fileRef = useRef(null);
  const [count, setCount] = useState(8);
  const [err, setErr] = useState(null);
  const colors = paletteColors(value);
  const levels = isLevelsPalette(value);
  const theme = colors ? findMatchingThemeKey(colors) : null;
  const mode = levels ? "__levels" : theme ? theme : "__custom";

  const pick = (key) => {
    if (key === "__levels") onChange(levelsPalette(2));
    else if (key === "__custom") onChange(colorsPalette(colors ?? THEMES.CGA));
    else onChange(colorsPalette(THEMES[key]));
  };

  const extract = async () => {
    setErr(null);
    try {
      onChange(colorsPalette(extractColors(await extractFrom(), count)));
    } catch (e) {
      setErr(e.message);
    }
  };

  const importFile = async (file) => {
    setErr(null);
    try {
      onChange(colorsPalette(parsePaletteFile(await file.text())));
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="palette">
      <select value={mode} onChange={(e) => pick(e.target.value)}>
        <option value="__levels">Levels per channel</option>
        <option value="__custom">Custom / extracted</option>
        {Object.entries(THEME_CATEGORIES).map(([cat, entries]) => (
          <optgroup key={cat} label={cat}>
            {entries.map((t) => (
              <option key={t.key} value={t.key} title={t.desc}>{t.key.replace(/_/g, " ")}</option>
            ))}
          </optgroup>
        ))}
      </select>

      {levels && (
        <div className="range">
          <input type="range" min={2} max={16} step={1} value={value.options.levels ?? 2}
            style={{ "--p": `${(((value.options.levels ?? 2) - 2) / 14) * 100}%` }}
            onChange={(e) => onChange(levelsPalette(+e.target.value))} />
          <span>{value.options.levels ?? 2}</span>
        </div>
      )}

      {colors && (
        <div className="swatches">
          {colors.map((c, i) => (
            <span key={i} className="swatch-edit">
              <input type="color" value={toHex(c)} onChange={(e) => {
                const next = [...colors];
                next[i] = fromHex(e.target.value);
                onChange(colorsPalette(next));
              }} />
              {colors.length > 2 && (
                <button className="x" title="Remove colour" onClick={() => onChange(colorsPalette(colors.filter((_, j) => j !== i)))}>×</button>
              )}
            </span>
          ))}
          <button className="ghost small" title="Add colour" onClick={() => onChange(colorsPalette([...colors, [255, 255, 255, 255]]))}>+</button>
        </div>
      )}

      <div className="row wrap">
        <select value={count} onChange={(e) => setCount(+e.target.value)} title="Colours to extract" aria-label="Colours to extract">
          {[2, 3, 4, 6, 8, 12, 16, 24, 32, 64].map((n) => <option key={n} value={n}>{n} colours</option>)}
        </select>
        <button className="ghost small" onClick={extract}>Extract</button>
        <button className="ghost small" onClick={() => fileRef.current.click()}>Import</button>
        {colors && (
          <>
            <button className="ghost small" onClick={() => download(new Blob([formatHex(colors)]), "palette.hex")}>.hex</button>
            <button className="ghost small" onClick={() => download(new Blob([formatGpl(colors)]), "palette.gpl")}>.gpl</button>
          </>
        )}
        <input ref={fileRef} type="file" accept=".hex,.gpl,.txt" hidden
          onChange={(e) => e.target.files[0] && importFile(e.target.files[0])} />
      </div>
      {err && <p className="error small">{err}</p>}
    </div>
  );
}

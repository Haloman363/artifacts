// Visual picker for Script Slayer glyph sets: category chips + tiles previewing each ramp.
import { useMemo, useState } from "react";
import { CHARSET_CATEGORIES, rampFor } from "../engine/charsets.js";

const SAMPLE = 9;

const sample = (glyphs) => {
  const ramp = rampFor(glyphs, "monospace");
  if (ramp.length <= SAMPLE) return ramp.join("");
  return Array.from({ length: SAMPLE }, (_, i) => ramp[Math.round((i / (SAMPLE - 1)) * (ramp.length - 1))]).join("");
};

export function CharsetPicker({ value, onChange }) {
  const [cat, setCat] = useState(() => value?.split(" / ")[0] ?? "ASCII");
  const tiles = useMemo(
    () => Object.entries(CHARSET_CATEGORIES[cat] ?? {}).map(([name, glyphs]) => ({ name, key: `${cat} / ${name}`, preview: sample(glyphs) })),
    [cat],
  );
  return (
    <div className="charset">
      <div className="chip-row">
        {Object.keys(CHARSET_CATEGORIES).map((c) => (
          <button key={c} className={`chip-btn ${c === cat ? "on" : ""} ${value?.startsWith(c + " / ") ? "has" : ""}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="charset-tiles">
        {tiles.map((t) => (
          <button key={t.key} className={t.key === value ? "on" : ""} onClick={() => onChange(t.key)} title={t.key}>
            <span className="glyphs">{t.preview}</span>
            <span className="tname">{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

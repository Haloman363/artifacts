import { useState } from "react";
import BackButton from "./BackButton.jsx";

// All weights convert to kg, lengths to meters, volumes to liters, areas to m²
const CATEGORIES = {
  weight: {
    label: "Weight",
    units: ["kg", "lbs", "tons", "grams"],
    toBase: { kg: 1, lbs: 0.453592, tons: 907.185, grams: 0.001 },
    refs: [
      { emoji: "🐻", description: "gummy bears",        perBase: 250      },
      { emoji: "🍔", description: "Big Macs",           perBase: 5.56     },
      { emoji: "🫙", description: "gallons of mayo",    perBase: 0.926    },
      { emoji: "🏀", description: "Shaquille O'Neals",  perBase: 0.00719  },
      { emoji: "🛻", description: "Ford F-150s",        perBase: 0.000544 },
    ],
  },
  length: {
    label: "Length",
    units: ["cm", "meters", "km", "inches", "feet", "miles"],
    toBase: { cm: 0.01, meters: 1, km: 1000, inches: 0.0254, feet: 0.3048, miles: 1609.34 },
    refs: [
      { emoji: "🌭", description: "hot dogs end-to-end",  perBase: 16.6     },
      { emoji: "🥖", description: "Subway footlongs",     perBase: 3.28     },
      { emoji: "🎳", description: "bowling lanes",        perBase: 0.0582   },
      { emoji: "🏈", description: "football fields",      perBase: 0.00917  },
      { emoji: "🛒", description: "laps around Walmart",  perBase: 0.000426 },
    ],
  },
  volume: {
    label: "Volume",
    units: ["ml", "liters", "gallons", "cups", "fl oz"],
    toBase: { ml: 0.001, liters: 1, gallons: 3.78541, cups: 0.236588, "fl oz": 0.0295735 },
    refs: [
      { emoji: "🥃", description: "shots of tequila",        perBase: 44.3      },
      { emoji: "🥤", description: "cans of Mountain Dew",    perBase: 2.78      },
      { emoji: "🧃", description: "2-liters of Coke",        perBase: 0.5       },
      { emoji: "🛁", description: "bathtubs (full)",         perBase: 0.00476   },
      { emoji: "🏊", description: "backyard swimming pools", perBase: 0.0000259 },
    ],
  },
  temperature: {
    label: "Temperature",
    units: ["C", "F", "K"],
  },
  area: {
    label: "Area",
    units: ["cm2", "m2", "km2", "sq ft", "acres"],
    toBase: { "cm2": 0.0001, "m2": 1, "km2": 1e6, "sq ft": 0.0929, "acres": 4046.86 },
    refs: [
      { emoji: "🧀", description: "slices of Kraft cheese", perBase: 625       },
      { emoji: "🚗", description: "parking spaces",         perBase: 0.0625    },
      { emoji: "🏀", description: "basketball courts",      perBase: 0.00219   },
      { emoji: "🏬", description: "Costcos",                perBase: 0.0000074 },
      { emoji: "🗺️", description: "Rhode Islands",          perBase: 2.62e-9   },
    ],
  },
};

function toBaseValue(category, value, unit) {
  const v = parseFloat(value);
  if (isNaN(v)) return null;
  if (category === "temperature") {
    if (unit === "C") return v;
    if (unit === "F") return (v - 32) * 5 / 9;
    if (unit === "K") return v - 273.15;
    return null;
  }
  const factor = CATEGORIES[category].toBase[unit];
  if (factor === undefined) return null;
  return v * factor;
}

function formatCount(n) {
  if (n >= 1e6)  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 10)   return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (n >= 0.01) return n.toFixed(2);
  return n.toExponential(2);
}

function getTempQuip(c) {
  if (c <= -40) return { emoji: "🥶", text: "colder than the plot of a Hallmark movie" };
  if (c <= 0)   return { emoji: "🍺", text: "freezing. Your beer is ruined, Nick" };
  if (c <= 15)  return { emoji: "🧥", text: "jacket weather (Americans will still wear shorts)" };
  if (c <= 22)  return { emoji: "😌", text: "the temp Goldilocks wanted. She was American." };
  if (c <= 30)  return { emoji: "🔥", text: "perfect BBQ weather — fire it up, Nick" };
  if (c <= 37)  return { emoji: "🚘", text: "hotter than a Chevy Tahoe in a July parking lot" };
  if (c <= 50)  return { emoji: "🧇", text: "surface of a Waffle House griddle" };
  return          { emoji: "☀️", text: "basically the surface of the sun. Nick is cooked." };
}

function doConvert(category, value, unit) {
  const base = toBaseValue(category, value, unit);
  if (base === null || isNaN(base)) return null;

  if (category === "temperature") {
    const quip = getTempQuip(base);
    return {
      kind: "temperature",
      quip,
      celsius:    base.toFixed(2),
      fahrenheit: ((base * 9 / 5) + 32).toFixed(2),
      kelvin:     (base + 273.15).toFixed(2),
    };
  }

  return {
    kind: "normal",
    rows: CATEGORIES[category].refs.map(r => ({
      emoji: r.emoji,
      description: r.description,
      countStr: formatCount(base * r.perBase),
    })),
  };
}

export default function App() {
  const [category, setCategory] = useState("weight");
  const [unit, setUnit]         = useState("kg");
  const [value, setValue]       = useState("");
  const [result, setResult]     = useState(null);
  const [animKey, setAnimKey]   = useState(0);

  function handleCategoryChange(cat) {
    setCategory(cat);
    setUnit(CATEGORIES[cat].units[0]);
    setValue("");
    setResult(null);
  }

  function handleConvert() {
    const r = doConvert(category, value, unit);
    setResult(r);
    setAnimKey(k => k + 1);
  }

  const canConvert = value.trim() !== "";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "Georgia, serif" }}>
      <BackButton />
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #8b6914 0%, #ffd700 45%, #b8860b 75%, #8b6914 100%)",
        padding: "1.8rem 1.5rem 1.4rem",
        textAlign: "center",
        borderBottom: "4px solid #6b4f10",
        boxShadow: "0 4px 40px #ffd70055",
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.3rem" }}>🇺🇸🦅🇺🇸</div>
        <h1 style={{
          margin: 0,
          fontSize: "clamp(1.5rem, 5vw, 2.4rem)",
          fontWeight: 900,
          color: "#0a0a0a",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          textShadow: "2px 2px 0 #6b4f10",
        }}>
          The Nick Measurement System™
        </h1>
        <p style={{
          margin: "0.5rem 0 0",
          color: "#3a2800",
          fontStyle: "italic",
          fontSize: "0.95rem",
          fontWeight: 600,
        }}>
          Converting normal units to things Nick can actually understand
        </p>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>

        {/* Category tabs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.2rem" }}>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <button key={key} onClick={() => handleCategoryChange(key)} style={{
              padding: "0.4rem 0.85rem",
              border: `2px solid ${category === key ? "#ffd700" : "#333"}`,
              background: category === key ? "#ffd700" : "#181818",
              color: category === key ? "#0a0a0a" : "#888",
              fontWeight: 700, fontSize: "0.8rem", borderRadius: "4px",
              cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em",
              fontFamily: "Georgia, serif", transition: "all 0.15s",
            }}>{cat.label}</button>
          ))}
        </div>

        {/* Input row */}
        <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.9rem" }}>
          <input
            type="number"
            value={value}
            placeholder="Enter a number..."
            onChange={e => { setValue(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === "Enter" && canConvert && handleConvert()}
            style={{
              flex: 1, padding: "0.75rem 1rem",
              background: "#111", border: "2px solid #333", borderRadius: "6px",
              color: "#ffd700", fontSize: "1.1rem", fontFamily: "Georgia, serif",
              outline: "none",
            }}
          />
          <select
            value={unit}
            onChange={e => { setUnit(e.target.value); setResult(null); }}
            style={{
              padding: "0.75rem 0.7rem",
              background: "#111", border: "2px solid #333", borderRadius: "6px",
              color: "#ffd700", fontSize: "1rem", fontFamily: "Georgia, serif",
              cursor: "pointer",
            }}
          >
            {CATEGORIES[category].units.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* Convert button */}
        <button
          onClick={handleConvert}
          disabled={!canConvert}
          style={{
            width: "100%", padding: "0.85rem",
            background: canConvert ? "linear-gradient(135deg, #8b6914, #ffd700, #8b6914)" : "#1a1a1a",
            border: "none", borderRadius: "6px",
            color: canConvert ? "#0a0a0a" : "#444",
            fontWeight: 900, fontSize: "1rem",
            textTransform: "uppercase", letterSpacing: "0.1em",
            cursor: canConvert ? "pointer" : "not-allowed",
            fontFamily: "Georgia, serif", marginBottom: "1.5rem", transition: "all 0.2s",
          }}
        >
          🦅 AMERICANIZE IT 🦅
        </button>

        {/* Result panel */}
        {result && (
          <div key={animKey} style={{
            background: "#111", border: "2px solid #ffd700",
            borderRadius: "10px", padding: "1.4rem",
            boxShadow: "0 0 30px #ffd70033",
            animation: "fadein 0.35s ease",
          }}>
            {result.kind === "temperature" ? (
              <>
                <div style={{ textAlign: "center", fontSize: "3rem", marginBottom: "0.5rem" }}>
                  {result.quip.emoji}
                </div>
                <p style={{
                  color: "#ffd700", fontSize: "1.1rem", textAlign: "center",
                  fontStyle: "italic", margin: "0 0 1.2rem", lineHeight: 1.5,
                }}>
                  That's <strong>{result.quip.text}</strong>
                </p>
                <div style={{ borderTop: "1px solid #2a2a2a", paddingTop: "1rem" }}>
                  {[
                    ["Celsius",    result.celsius + "°C"],
                    ["Fahrenheit", result.fahrenheit + "°F  ← the True Unit™"],
                    ["Kelvin",     result.kelvin + " K"],
                  ].map(([label, val]) => (
                    <div key={label} style={{
                      display: "flex", justifyContent: "space-between",
                      color: "#777", fontSize: "0.88rem", marginBottom: "0.35rem",
                    }}>
                      <span>{label}:</span>
                      <span style={{ color: "#ffd700" }}>{val}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p style={{
                  color: "#ffd700", fontSize: "0.8rem", textAlign: "center",
                  textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700,
                  margin: "0 0 1rem",
                }}>
                  🇺🇸 That's approximately... 🇺🇸
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  {result.rows.map((row, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: "0.8rem",
                      background: "#1a1a1a", border: "1px solid #252525",
                      borderRadius: "8px", padding: "0.7rem 1rem",
                    }}>
                      <span style={{ fontSize: "1.7rem", flexShrink: 0 }}>{row.emoji}</span>
                      <span style={{
                        color: "#fff", fontSize: "1.2rem", fontWeight: 900,
                        flexShrink: 0, minWidth: "80px",
                      }}>{row.countStr}</span>
                      <span style={{ color: "#999", fontSize: "0.88rem", fontStyle: "italic" }}>
                        {row.description}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{
              marginTop: "1.1rem", padding: "0.75rem",
              background: "#161616", borderRadius: "6px", borderLeft: "3px solid #ffd700",
            }}>
              <p style={{ color: "#555", fontSize: "0.78rem", margin: 0, fontStyle: "italic" }}>
                🇺🇸 Nick's Official Verdict: Measurement successfully Americanized. You're welcome, Nick.
              </p>
            </div>
          </div>
        )}

        <p style={{
          color: "#222", fontSize: "0.72rem", textAlign: "center",
          marginTop: "2rem", fontStyle: "italic",
        }}>
          The Nick Measurement System™ — proudly ignoring the metric system since forever
        </p>
      </div>

      <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input:focus { border-color: #ffd700 !important; box-shadow: 0 0 0 2px #ffd70022; }
        select option { background: #111; }
      `}</style>
    </div>
  );
}

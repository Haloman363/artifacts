import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Minus, Plus, TrendingUp } from "lucide-react";
import { DEFAULT_RATE, FIRST_YEAR, ITEMS, LAST_ACTUAL_YEAR, TODAY_YEAR, cpiFor, itemPrice } from "./data.js";

const STORAGE_KEY = "inflation-calc:v1";
const PRESET_YEARS = [1970, 1980, 1990, 2000, 2010, 2020];

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function money(n) {
  if (n >= 100) return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(n, digits = 0) {
  return `${n >= 0 ? "+" : "−"}${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: digits })}%`;
}

export default function InflationCalc() {
  const saved = useMemo(loadSaved, []);
  const [amountText, setAmountText] = useState(saved.amountText ?? "100");
  const [year, setYear] = useState(saved.year ?? 1990);
  const [mode, setMode] = useState(saved.mode ?? "then"); // "then": $ in <year> -> today, "now": $ today -> <year>
  const [rate, setRate] = useState(saved.rate ?? DEFAULT_RATE);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ amountText, year, mode, rate }));
    } catch {
      /* private mode etc. — state just won't persist */
    }
  }, [amountText, year, mode, rate]);

  const amount = Math.max(0, parseFloat(amountText.replace(/,/g, "")) || 0);
  const cpiThen = cpiFor(year, rate);
  const cpiNow = cpiFor(TODAY_YEAR, rate);
  const factor = cpiNow / cpiThen; // multiplier from <year> dollars to today's dollars
  const years = TODAY_YEAR - year;

  const result = mode === "then" ? amount * factor : amount / factor;
  const totalChange = (factor - 1) * 100;
  const annual = years > 0 ? (factor ** (1 / years) - 1) * 100 : 0;
  const dollarWorth = 100 / factor; // cents of a <year> dollar that one of today's dollars is worth

  const rows = useMemo(() => {
    return ITEMS.map((item) => {
      const then = itemPrice(item, year);
      if (then == null) return null;
      const actualMultiple = item.now / then;
      const cpiMultiple = factor;
      return {
        item,
        then,
        adjusted: then * cpiMultiple,
        actualMultiple,
        cpiMultiple,
        vsInflation: (actualMultiple / cpiMultiple - 1) * 100,
      };
    })
      .filter(Boolean)
      .sort((a, b) => b.vsInflation - a.vsInflation);
  }, [year, factor]);

  const series = useMemo(() => {
    const base = mode === "then" ? cpiThen : cpiNow;
    const pts = [];
    for (let y = year; y <= TODAY_YEAR; y++) pts.push([y, (amount * cpiFor(y, rate)) / base]);
    return pts;
  }, [amount, year, mode, rate, cpiThen, cpiNow]);

  return (
    <div
      className="ic-root min-h-full bg-gray-950 text-white pt-5"
      style={{
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 3rem)",
      }}
    >
      <style>{CSS}</style>
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="text-orange-400" size={22} />
          <h1 className="text-xl font-bold">Sticker Shock</h1>
        </div>
        <p className="text-sm text-gray-500 mb-5">See what everything costs today, in the money you remember.</p>

        {/* Inputs */}
        <section className="rounded-2xl bg-gray-900 border border-gray-800 p-4 mb-4">
          <div className="flex rounded-xl bg-gray-950 p-1 mb-4 text-sm" role="tablist" aria-label="Direction">
            {[
              ["then", `Past → ${TODAY_YEAR}`],
              ["now", `${TODAY_YEAR} → Past`],
            ].map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={mode === id}
                onClick={() => setMode(id)}
                className={`flex-1 min-h-[44px] rounded-lg font-medium transition-colors ${mode === id ? "bg-orange-500 text-gray-950" : "text-gray-400"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-3">
            <label className="flex-1">
              <span className="block text-xs text-gray-500 mb-1">{mode === "then" ? `Amount in ${year}` : `Amount today`}</span>
              <div className="flex items-center rounded-xl bg-gray-950 border border-gray-800 focus-within:border-orange-500 px-3">
                <span className="text-gray-500 text-xl">$</span>
                <input
                  value={amountText}
                  onChange={(e) => setAmountText(e.target.value.replace(/[^0-9.,]/g, ""))}
                  inputMode="decimal"
                  enterKeyHint="done"
                  autoComplete="off"
                  className="w-full bg-transparent py-3 pl-1 text-2xl font-semibold outline-none"
                  aria-label="Amount in dollars"
                />
              </div>
            </label>
            <button
              onClick={() => setMode(mode === "then" ? "now" : "then")}
              className="mb-1 w-[52px] h-[52px] shrink-0 flex items-center justify-center rounded-xl bg-gray-950 border border-gray-800 text-gray-400 active:scale-90 transition-transform"
              aria-label="Swap direction"
            >
              <ArrowDownUp size={18} />
            </button>
          </div>

          <div className="mt-5">
            <span className="block text-xs text-gray-500 mb-1">Year</span>
            <div className="flex items-center justify-between gap-3">
              <StepButton label="Previous year" disabled={year <= FIRST_YEAR} onClick={() => setYear(year - 1)}>
                <Minus size={20} />
              </StepButton>
              <span className="text-4xl font-semibold text-orange-400 tabular-nums">{year}</span>
              <StepButton label="Next year" disabled={year >= LAST_ACTUAL_YEAR} onClick={() => setYear(year + 1)}>
                <Plus size={20} />
              </StepButton>
            </div>
            <input
              type="range"
              min={FIRST_YEAR}
              max={LAST_ACTUAL_YEAR}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="ic-range mt-2"
              aria-label="Year"
            />
            <div className="grid grid-cols-6 gap-1.5 mt-2">
              {PRESET_YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`min-h-[44px] rounded-xl text-xs min-[360px]:text-sm border tabular-nums ${year === y ? "border-orange-500 text-orange-400 bg-orange-500/10" : "border-gray-800 text-gray-400"}`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Result */}
        <section className="rounded-2xl bg-gradient-to-br from-orange-950 to-gray-900 border border-orange-900/60 p-5 mb-4">
          <p className="text-sm text-orange-200/70">
            {mode === "then" ? `${money(amount)} in ${year} is the same buying power as` : `${money(amount)} today had the buying power of`}
          </p>
          <p className={`${money(result).length > 11 ? "text-3xl min-[360px]:text-4xl" : "text-4xl min-[360px]:text-5xl"} font-bold mt-1 tabular-nums break-all`}>{money(result)}</p>
          <p className="text-sm text-orange-200/70 mt-1">{mode === "then" ? `in ${TODAY_YEAR} dollars` : `in ${year} dollars`}</p>

          <div className="grid grid-cols-3 gap-1.5 min-[360px]:gap-2 mt-5 text-center">
            <Stat label={`Prices since ${year}`} value={pct(totalChange)} />
            <Stat label="Per year" value={pct(annual, 1)} />
            <Stat label="$1 today is" value={`${dollarWorth.toFixed(0)}¢`} sub={`in ${year} money`} />
          </div>
        </section>

        {/* Chart */}
        <section className="rounded-2xl bg-gray-900 border border-gray-800 p-4 mb-4">
          <h2 className="text-sm font-semibold">{mode === "then" ? `Matching ${money(amount)} from ${year}` : `What ${money(amount)} today was worth`}</h2>
          <Chart points={series} />
        </section>

        {/* Items */}
        <section className="mb-4">
          <h2 className="text-sm font-semibold mb-1">Things you buy, {year} vs. today</h2>
          <p className="text-xs text-gray-500 mb-3">
            Bar is the actual price rise; the white tick is how far it would have gone if it only tracked inflation.
          </p>
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500 rounded-2xl bg-gray-900 border border-gray-800 p-4">
              No item prices go back to {year}. Try 1950 or later.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <ItemRow key={r.item.id} row={r} />
              ))}
            </ul>
          )}
        </section>

        {/* Notes */}
        <details className="rounded-2xl bg-gray-900 border border-gray-800 p-4 text-xs text-gray-400">
          <summary className="text-sm text-gray-300 cursor-pointer min-h-[44px] flex items-center -my-2">About the numbers</summary>
          <div className="mt-3 space-y-3 leading-relaxed">
            <p>
              Inflation uses BLS CPI-U (all items, annual average) through {LAST_ACTUAL_YEAR}. {TODAY_YEAR} is a projection: the default is the Jan–Aug {TODAY_YEAR} average of the 12-month changes.
            </p>
            <label className="flex items-center justify-between gap-3">
              <span>Assumed {TODAY_YEAR} inflation</span>
              <span className="flex items-center gap-1 rounded-lg bg-gray-950 border border-gray-800 px-2">
                <input
                  type="number"
                  step="0.1"
                  min="-5"
                  max="30"
                  value={rate}
                  onChange={(e) => setRate(e.target.value === "" ? 0 : Number(e.target.value))}
                  className="w-16 bg-transparent py-2.5 text-base text-right text-gray-200 outline-none"
                  inputMode="decimal"
                />
                <span>%</span>
              </span>
            </label>
            <p>
              Item prices are rounded U.S. averages (BLS, EIA, Census, NATO, USPS, The Economist, U.S. DOL) with values between data points interpolated. "Today" prices are mid-{TODAY_YEAR} readings (BLS, AAA, Kelley Blue Book, Census); rent and the movie ticket are estimates. Treat it as a good gut-check, not an audit.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}

const CSS = `
.ic-root button, .ic-root summary, .ic-root input { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
.ic-root input[type=number]::-webkit-inner-spin-button { display: none; }
.ic-range { -webkit-appearance: none; appearance: none; width: 100%; height: 44px; background: transparent; touch-action: pan-y; }
.ic-range::-webkit-slider-runnable-track { height: 8px; border-radius: 9999px; background: #1f2937; }
.ic-range::-moz-range-track { height: 8px; border-radius: 9999px; background: #1f2937; }
.ic-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 28px; height: 28px; margin-top: -10px; border-radius: 9999px; background: #f97316; border: 3px solid #030712; box-shadow: 0 0 0 1px #f97316; }
.ic-range::-moz-range-thumb { width: 22px; height: 22px; border-radius: 9999px; background: #f97316; border: 3px solid #030712; box-shadow: 0 0 0 1px #f97316; }
`;

function StepButton({ label, onClick, disabled, children }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="w-12 h-12 shrink-0 flex items-center justify-center rounded-xl bg-gray-950 border border-gray-800 text-gray-300 active:scale-90 transition-transform disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl bg-black/25 px-1 min-[360px]:px-2 py-2.5">
      <div className="text-base min-[360px]:text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-orange-200/60 leading-tight">{label}</div>
      {sub && <div className="text-[11px] text-orange-200/60 leading-tight">{sub}</div>}
    </div>
  );
}

function ItemRow({ row }) {
  const { item, then, adjusted, actualMultiple, cpiMultiple, vsInflation } = row;
  const max = Math.max(actualMultiple, cpiMultiple);
  const hotter = vsInflation >= 0;
  return (
    <li className="rounded-2xl bg-gray-900 border border-gray-800 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">{item.icon}</span>
          <span className="text-sm font-medium leading-tight">{item.label}</span>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${hotter ? "bg-red-950 text-red-300" : "bg-emerald-950 text-emerald-300"}`}>
          {pct(vsInflation)}<span className="hidden min-[360px]:inline"> vs inflation</span>
        </span>
      </div>
      <div className="flex items-baseline gap-2 mt-2 tabular-nums">
        <span className="text-gray-500 text-sm">{money(then)}</span>
        <span className="text-gray-600">→</span>
        <span className="text-lg font-semibold">{money(item.now)}</span>
      </div>
      <div className="relative h-2 rounded-full bg-gray-800 mt-2.5">
        <div className={`h-2 rounded-full ${hotter ? "bg-red-400" : "bg-emerald-400"}`} style={{ width: `${(actualMultiple / max) * 100}%` }} />
        <div className="absolute -top-0.5 h-3 w-0.5 bg-white rounded" style={{ left: `calc(${(cpiMultiple / max) * 100}% - 1px)` }} />
      </div>
      <p className="text-xs text-gray-500 mt-1.5">If it only tracked inflation: {money(adjusted)}</p>
    </li>
  );
}

function Chart({ points }) {
  const W = 320;
  const H = 120;
  const pad = { l: 6, r: 6, t: 8, b: 18 };
  const [active, setActive] = useState(null);
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x0 = xs[0];
  const x1 = xs[xs.length - 1];
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const sx = (x) => pad.l + (x1 === x0 ? 0 : ((x - x0) / (x1 - x0)) * (W - pad.l - pad.r));
  const sy = (y) => pad.t + (yMax === yMin ? 0.5 : 1 - (y - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(" ");
  const area = `${line} L${sx(x1)},${H - pad.b} L${sx(x0)},${H - pad.b} Z`;
  const last = points[points.length - 1];
  const shown = active != null && points[active] ? points[active] : last;

  function scrub(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setActive(Math.round(t * (points.length - 1)));
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1 tabular-nums">
        <span className="text-white text-base font-semibold">{money(shown[1])}</span> in {shown[0]}
        {active == null && <span> · drag to explore</span>}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none"
        style={{ touchAction: "pan-y" }}
        role="img"
        aria-label="Value over time"
        onPointerDown={scrub}
        onPointerMove={(e) => e.buttons || e.pointerType === "touch" ? scrub(e) : undefined}
        onPointerLeave={() => setActive(null)}
        onPointerUp={(e) => e.pointerType === "touch" && setActive(null)}
        onPointerCancel={() => setActive(null)}
      >
        <path d={area} fill="rgb(249 115 22 / 0.15)" />
        <path d={line} fill="none" stroke="rgb(251 146 60)" strokeWidth="2" strokeLinejoin="round" />
        {active != null && <line x1={sx(shown[0])} x2={sx(shown[0])} y1={pad.t} y2={H - pad.b} stroke="rgb(107 114 128)" strokeDasharray="3 3" />}
        <circle cx={sx(shown[0])} cy={sy(shown[1])} r="4" fill="rgb(251 146 60)" stroke="#030712" strokeWidth="1.5" />
        <text x={pad.l} y={H - 4} fontSize="10" fill="rgb(107 114 128)">{x0}</text>
        <text x={W - pad.r} y={H - 4} fontSize="10" fill="rgb(107 114 128)" textAnchor="end">{x1}</text>
      </svg>
    </div>
  );
}

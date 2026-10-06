import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownUp, Check, ChevronDown, Minus, Plus, Share2, TrendingUp } from "lucide-react";
import {
  FIRST_ITEM_YEAR,
  FIRST_YEAR,
  GENERATED_AT,
  ITEMS,
  LAST_FULL_YEAR,
  MONTH_NAMES,
  TODAY,
  TODAY_YEAR,
  cpiAt,
  itemPrice,
  monthAvailable,
} from "./data.js";

const STORAGE_KEY = "inflation-calc:v2";
const PRESET_YEARS = [1970, 1980, 1990, 2000, 2010, 2020];
const MAX_AMOUNT = 1e12;

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

// Item prices: big numbers are averages, so show 3 significant figures ($397,433 -> $397,000).
function priceText(n) {
  if (n < 1000) return money(n);
  const mag = 10 ** (Math.floor(Math.log10(n)) - 2);
  return money(Math.round(n / mag) * mag);
}

function pct(n, digits = 0) {
  return `${n >= 0 ? "+" : "−"}${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: digits })}%`;
}

function parseAmount(text) {
  const n = parseFloat(text.replace(/,/g, ""));
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), MAX_AMOUNT) : 0;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

// Eases the displayed number toward `target` so changes read as movement, not a jump.
function useCountUp(target, ms = 450) {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    if (prefersReducedMotion()) {
      current.current = target;
      setValue(target);
      return undefined;
    }
    const from = current.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / ms);
      current.current = from + (target - from) * (1 - (1 - p) ** 3);
      setValue(current.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

export default function InflationCalc() {
  const saved = useMemo(loadSaved, []);
  const [amountText, setAmountText] = useState(saved.amountText ?? "100");
  const [year, setYear] = useState(Math.min(LAST_FULL_YEAR, Math.max(FIRST_YEAR, saved.year ?? 1990)));
  const [month, setMonth] = useState(saved.month ?? 0); // 0 = whole-year average
  const [mode, setMode] = useState(saved.mode ?? "then"); // "then": $ in <period> -> today, "now": $ today -> <period>
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ amountText, year, month, mode }));
    } catch {
      /* private mode etc. — state just won't persist */
    }
  }, [amountText, year, month, mode]);

  // A saved month can be unavailable for the year (e.g. Oct 2025 was never published).
  const activeMonth = monthAvailable(year, month) ? month : 0;
  const period = activeMonth ? `${MONTH_NAMES[activeMonth - 1]} ${year}` : `${year}`;

  const amount = parseAmount(amountText);
  const cpiThen = cpiAt(year, activeMonth);
  const factor = TODAY.cpi / cpiThen; // multiplier from <period> dollars to today's dollars
  // Mid-point of the period (mid-year for an annual average) to mid-point of today's month.
  const yearsElapsed = TODAY.year + (TODAY.month - 0.5) / 12 - (year + (activeMonth ? activeMonth - 0.5 : 6) / 12);

  const result = mode === "then" ? amount * factor : amount / factor;
  const shownResult = useCountUp(result);
  const totalChange = (factor - 1) * 100;
  const annual = yearsElapsed > 0 ? (factor ** (1 / yearsElapsed) - 1) * 100 : 0;
  const dollarWorth = 100 / factor; // cents of a <period> dollar that one of today's dollars is worth

  const rows = useMemo(
    () =>
      ITEMS.map((item) => {
        const then = itemPrice(item, year);
        if (then == null) return null;
        const actualMultiple = item.now / then;
        return {
          item,
          then,
          adjusted: then * factor,
          actualMultiple,
          cpiMultiple: factor,
          vsInflation: (actualMultiple / factor - 1) * 100,
        };
      })
        .filter(Boolean)
        .sort((a, b) => b.vsInflation - a.vsInflation),
    [year, factor],
  );
  const outpaced = rows.filter((r) => r.vsInflation >= 0).length;

  const series = useMemo(() => {
    const base = mode === "then" ? cpiThen : TODAY.cpi;
    const pts = [];
    for (let y = year; y <= TODAY_YEAR; y++) pts.push([y, (amount * cpiAt(y)) / base]);
    return pts;
  }, [amount, year, mode, cpiThen]);

  async function share() {
    const text =
      mode === "then"
        ? `${money(amount)} in ${period} buys what ${money(result)} does today (${TODAY.label}).`
        : `${money(amount)} today had the buying power of ${money(result)} in ${period}.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Sticker Shock", text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* share sheet dismissed, or clipboard unavailable */
    }
  }

  function changeYear(next) {
    setYear(next);
    if (!monthAvailable(next, month)) setMonth(0);
  }

  return (
    <div
      className="ic-root min-h-full bg-gray-950 text-white pt-5"
      style={{
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 3rem)",
        colorScheme: "dark",
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
              ["then", "Past → Today"],
              ["now", "Today → Past"],
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
            <label className="flex-1 min-w-0">
              <span className="block text-xs text-gray-500 mb-1">{mode === "then" ? `Amount in ${period}` : "Amount today"}</span>
              <div className="flex items-center rounded-xl bg-gray-950 border border-gray-800 focus-within:border-orange-500 px-3">
                <span className="text-gray-500 text-xl">$</span>
                <input
                  value={amountText}
                  onChange={(e) => setAmountText(e.target.value.replace(/[^0-9.,]/g, ""))}
                  onFocus={(e) => e.target.select()}
                  onBlur={() => setAmountText(amount.toLocaleString("en-US", { maximumFractionDigits: 2 }))}
                  inputMode="decimal"
                  enterKeyHint="done"
                  autoComplete="off"
                  className="w-full min-w-0 bg-transparent py-3 pl-1 text-2xl font-semibold outline-none"
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
              <StepButton label="Previous year" disabled={year <= FIRST_YEAR} onClick={() => changeYear(year - 1)}>
                <Minus size={20} />
              </StepButton>
              <span className="text-4xl font-semibold text-orange-400 tabular-nums" aria-live="polite">
                {year}
              </span>
              <StepButton label="Next year" disabled={year >= LAST_FULL_YEAR} onClick={() => changeYear(year + 1)}>
                <Plus size={20} />
              </StepButton>
            </div>
            <input
              type="range"
              min={FIRST_YEAR}
              max={LAST_FULL_YEAR}
              value={year}
              onChange={(e) => changeYear(Number(e.target.value))}
              className="ic-range mt-2"
              aria-label="Year"
            />
            <div className="grid grid-cols-6 gap-1.5 mt-2">
              {PRESET_YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => changeYear(y)}
                  className={`min-h-[44px] rounded-xl text-xs min-[360px]:text-sm border tabular-nums ${year === y ? "border-orange-500 text-orange-400 bg-orange-500/10" : "border-gray-800 text-gray-400"}`}
                >
                  {y}
                </button>
              ))}
            </div>

            <label className="flex items-center justify-between gap-3 mt-4">
              <span className="text-xs text-gray-500">Month</span>
              <span className="relative flex-1 max-w-[220px]">
                <select
                  value={activeMonth}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full min-h-[44px] appearance-none rounded-xl bg-gray-950 border border-gray-800 pl-3 pr-9 text-base text-gray-200 outline-none focus:border-orange-500"
                  aria-label="Month"
                >
                  <option value={0}>Whole-year average</option>
                  {MONTH_NAMES.map((name, i) => (
                    <option key={name} value={i + 1} disabled={!monthAvailable(year, i + 1)}>
                      {name}
                      {!monthAvailable(year, i + 1) ? " (not published)" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </span>
            </label>
          </div>
        </section>

        {/* Result */}
        <section className="rounded-2xl bg-gradient-to-br from-orange-950 to-gray-900 border border-orange-900/60 p-5 mb-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-orange-200/70">
              {mode === "then" ? `${money(amount)} in ${period} is the same buying power as` : `${money(amount)} today had the buying power of`}
            </p>
            <button
              onClick={share}
              className="shrink-0 -mt-1 -mr-2 w-11 h-11 flex items-center justify-center rounded-xl text-orange-200/70 active:bg-black/20"
              aria-label={copied ? "Copied" : "Share result"}
            >
              {copied ? <Check size={18} className="text-emerald-400" /> : <Share2 size={18} />}
            </button>
          </div>
          <p
            className={`${money(result).length > 11 ? "text-3xl min-[360px]:text-4xl" : "text-4xl min-[360px]:text-5xl"} font-bold mt-1 tabular-nums break-all`}
            aria-live="polite"
            aria-label={money(result)}
          >
            {money(shownResult)}
          </p>
          <p className="text-sm text-orange-200/70 mt-1">{mode === "then" ? `in today's dollars (${TODAY.label})` : `in ${period} dollars`}</p>

          <div className="grid grid-cols-3 gap-1.5 min-[360px]:gap-2 mt-5 text-center">
            <Stat label={`Prices since ${period}`} value={pct(totalChange)} />
            <Stat label="Per year" value={pct(annual, 1)} />
            <Stat label="$1 today is" value={`${dollarWorth.toFixed(0)}¢`} sub={`in ${period} money`} />
          </div>
        </section>

        {/* Chart */}
        <section className="rounded-2xl bg-gray-900 border border-gray-800 p-4 mb-4">
          <h2 className="text-sm font-semibold">{mode === "then" ? `Matching ${money(amount)} from ${period}` : `What ${money(amount)} today was worth`}</h2>
          <Chart points={series} />
        </section>

        {/* Items */}
        <section className="mb-4">
          <h2 className="text-sm font-semibold mb-1">Things you buy, {year} vs. today</h2>
          {rows.length > 0 && (
            <p className="text-sm text-gray-300 mb-1">
              <span className="font-semibold text-orange-400">{outpaced} of {rows.length}</span> outran inflation.
            </p>
          )}
          <p className="text-xs text-gray-500 mb-3">
            Bar is the actual price rise; the white tick is how far it would have gone if it only tracked inflation. Tap one for its history.
          </p>
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500 rounded-2xl bg-gray-900 border border-gray-800 p-4">
              No item prices go back to {year}. Try {FIRST_ITEM_YEAR} or later.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <ItemRow key={r.item.id} row={r} year={year} />
              ))}
            </ul>
          )}
        </section>

        {/* Notes */}
        <details className="rounded-2xl bg-gray-900 border border-gray-800 p-4 text-xs text-gray-400">
          <summary className="text-sm text-gray-300 cursor-pointer min-h-[44px] flex items-center -my-2">About the numbers</summary>
          <div className="mt-3 space-y-3 leading-relaxed">
            <p>
              Inflation is the BLS CPI-U (all items, U.S. city average, not seasonally adjusted). Past years use the annual average, or a single month if you pick one. "Today" is the latest published month, {TODAY.label} (index {TODAY.cpi.toFixed(3)}). BLS didn't publish October 2025, so that year's average interpolates the gap.
            </p>
            <p>
              Item prices are yearly national averages; "today" is each item's latest reading (mostly Jul–Sep 2026). Values between data points are interpolated. Sources:
            </p>
            <ul className="space-y-1">
              {ITEMS.map((i) => (
                <li key={i.id}>
                  <span className="text-gray-300">{i.label}:</span> {i.source}
                </li>
              ))}
            </ul>
            <p>Data last refreshed {GENERATED_AT}. A good gut-check, not an audit.</p>
          </div>
        </details>
      </div>
    </div>
  );
}

const CSS = `
.ic-root button, .ic-root summary, .ic-root input, .ic-root select { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
.ic-root :is(button, summary, input, select):focus-visible { outline: 2px solid #fb923c; outline-offset: 2px; }
.ic-range { -webkit-appearance: none; appearance: none; width: 100%; height: 44px; background: transparent; touch-action: pan-y; }
.ic-range::-webkit-slider-runnable-track { height: 8px; border-radius: 9999px; background: #1f2937; }
.ic-range::-moz-range-track { height: 8px; border-radius: 9999px; background: #1f2937; }
.ic-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 28px; height: 28px; margin-top: -10px; border-radius: 9999px; background: #f97316; border: 3px solid #030712; box-shadow: 0 0 0 1px #f97316; }
.ic-range::-moz-range-thumb { width: 22px; height: 22px; border-radius: 9999px; background: #f97316; border: 3px solid #030712; box-shadow: 0 0 0 1px #f97316; }
@media (prefers-reduced-motion: reduce) { .ic-root * { transition: none !important; } }
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

function ItemRow({ row, year }) {
  const { item, then, adjusted, actualMultiple, cpiMultiple, vsInflation } = row;
  const [open, setOpen] = useState(false);
  const max = Math.max(actualMultiple, cpiMultiple);
  const hotter = vsInflation >= 0;
  const flat = Math.abs(vsInflation) < 0.5;
  const tone = flat ? "bg-gray-800 text-gray-300" : hotter ? "bg-red-950 text-red-300" : "bg-emerald-950 text-emerald-300";
  return (
    <li className="rounded-2xl bg-gray-900 border border-gray-800">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="w-full text-left p-3 active:bg-gray-800/40 rounded-2xl">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium leading-tight">{item.label}</span>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${tone}`}>
            {flat ? "On par" : pct(vsInflation)}
            {!flat && <span className="hidden min-[360px]:inline"> vs inflation</span>}
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-2 tabular-nums">
          <span className="text-gray-500 text-sm">{priceText(then)}</span>
          <span className="text-gray-600">→</span>
          <span className="text-lg font-semibold">{priceText(item.now)}</span>
          <ChevronDown size={16} className={`ml-auto self-center text-gray-600 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
        <div className="relative h-2 rounded-full bg-gray-800 mt-2.5">
          <div className={`h-2 rounded-full ${flat ? "bg-gray-400" : hotter ? "bg-red-400" : "bg-emerald-400"}`} style={{ width: `${(actualMultiple / max) * 100}%` }} />
          <div className="absolute -top-0.5 h-3 w-0.5 bg-white rounded" style={{ left: `calc(${(cpiMultiple / max) * 100}% - 1px)` }} />
        </div>
        <p className="text-xs text-gray-500 mt-1.5">If it only tracked inflation: {priceText(adjusted)}</p>
      </button>
      {open && <ItemHistory item={item} year={year} then={then} factor={cpiMultiple} />}
    </li>
  );
}

// Actual price vs. the price had it only tracked inflation from the start year.
function ItemHistory({ item, year, then, factor }) {
  const cpiThen = TODAY.cpi / factor; // the CPI of the selected period
  const actual = [];
  const tracked = [];
  for (let y = year; y <= TODAY_YEAR; y++) {
    actual.push([y, itemPrice(item, y)]);
    tracked.push([y, (then * cpiAt(y)) / cpiThen]);
  }
  return (
    <div className="px-3 pb-3">
      <LineChart series={[{ points: tracked, color: "rgb(209 213 219)", dash: "4 3" }, { points: actual, color: "rgb(251 146 60)" }]} />
      <div className="flex items-center gap-4 text-[11px] text-gray-500 mt-1">
        <span className="flex items-center gap-1.5"><i className="inline-block w-4 h-0.5 bg-orange-400" /> Actual price</span>
        <span className="flex items-center gap-1.5"><i className="inline-block w-4 border-t border-dashed border-gray-300" /> Tracking inflation</span>
      </div>
      <p className="text-[11px] text-gray-600 mt-1.5">{item.source}</p>
    </div>
  );
}

function LineChart({ series }) {
  const W = 320;
  const H = 90;
  const pad = { l: 4, r: 4, t: 6, b: 4 };
  const all = series.flatMap((s) => s.points);
  const x0 = Math.min(...all.map((p) => p[0]));
  const x1 = Math.max(...all.map((p) => p[0]));
  const yMax = Math.max(...all.map((p) => p[1]));
  const yMin = Math.min(...all.map((p) => p[1]));
  const sx = (x) => pad.l + (x1 === x0 ? 0 : ((x - x0) / (x1 - x0)) * (W - pad.l - pad.r));
  const sy = (y) => pad.t + (yMax === yMin ? 0.5 : 1 - (y - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Price history">
      {series.map((s, i) => (
        <path
          key={i}
          d={s.points.map(([x, y], j) => `${j ? "L" : "M"}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(" ")}
          fill="none"
          stroke={s.color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeDasharray={s.dash}
        />
      ))}
    </svg>
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
        onPointerMove={(e) => (e.buttons || e.pointerType === "touch" ? scrub(e) : undefined)}
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

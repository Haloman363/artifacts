// Bundled so the app works offline (it's a PWA) — no network calls at runtime.
// Machine-fetched series live in data.generated.js (refresh with update-data.mjs);
// this file layers the hand-entered anchors on top and exposes lookups.
import { CPI_MONTHLY, GENERATED_AT, SERIES } from "./data.generated.js";

export { GENERATED_AT };
export const FIRST_YEAR = 1913;
export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ---- CPI-U (BLS, all items, U.S. city average, not seasonally adjusted, 1982-84 = 100) ----

// BLS didn't publish October 2025 (federal shutdown). Fill single gaps by interpolating
// neighbours when averaging a year, but don't offer the gap month as a choice.
function filled(months) {
  return months.map((v, i) => {
    if (v != null) return v;
    const prev = months[i - 1];
    const next = months[i + 1];
    return prev != null && next != null ? (prev + next) / 2 : null;
  });
}

const annualCpi = {};
for (const [year, months] of Object.entries(CPI_MONTHLY)) {
  const f = filled(months);
  if (f.every((v) => v != null)) annualCpi[year] = f.reduce((a, b) => a + b, 0) / 12;
}

export const LAST_FULL_YEAR = Math.max(...Object.keys(annualCpi).map(Number));

const lastYear = Math.max(...Object.keys(CPI_MONTHLY).map(Number));
const lastMonthIdx = CPI_MONTHLY[lastYear].reduce((acc, v, i) => (v != null ? i : acc), -1);

export const TODAY = {
  year: lastYear,
  month: lastMonthIdx + 1,
  cpi: CPI_MONTHLY[lastYear][lastMonthIdx],
  label: `${MONTH_NAMES[lastMonthIdx]} ${lastYear}`,
};
export const TODAY_YEAR = TODAY.year;

// month 0 = calendar-year average, 1..12 = that month.
export function monthAvailable(year, month) {
  return month === 0 || CPI_MONTHLY[year]?.[month - 1] != null;
}

export function cpiAt(year, month = 0) {
  if (year >= TODAY.year && month === 0) return TODAY.cpi;
  return month === 0 ? annualCpi[year] : CPI_MONTHLY[year][month - 1];
}

// ---- Everyday prices ----
// Each item resolves to [year, price] points; values in between are interpolated (or held,
// for step items like postage). `now` is the latest reading (see SERIES asOf dates).

// Full-year averages only; the current year is represented by `now`.
const series = (key) => Object.entries(SERIES[key].annual).filter(([y]) => +y < TODAY_YEAR).map(([y, v]) => [+y, v]);

// USPS first-class letter rate history: [effective date, cents]. Annual price is the
// time-weighted average over the year.
const STAMP_RATES = [
  ["1932-07-06", 3], ["1958-08-01", 4], ["1963-01-07", 5], ["1968-01-07", 6], ["1971-05-16", 8], ["1974-03-02", 10],
  ["1975-09-14", 13], ["1978-05-29", 15], ["1981-03-22", 18], ["1981-11-01", 20], ["1985-02-17", 22], ["1988-04-03", 25],
  ["1991-02-03", 29], ["1995-01-01", 32], ["1999-01-10", 33], ["2001-01-07", 34], ["2002-06-30", 37], ["2006-01-08", 39],
  ["2007-05-14", 41], ["2008-05-12", 42], ["2009-05-11", 44], ["2012-01-22", 45], ["2013-01-27", 46], ["2014-01-26", 49],
  ["2016-01-17", 47], ["2017-01-22", 49], ["2018-01-21", 50], ["2019-01-27", 55], ["2021-08-29", 58], ["2022-07-10", 60],
  ["2023-01-22", 63], ["2023-07-09", 66], ["2024-01-21", 68], ["2024-07-14", 73], ["2025-07-13", 78], ["2026-07-12", 82],
];

function stampAverage(year) {
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 1, 0, 1);
  let total = 0;
  STAMP_RATES.forEach(([d, cents], i) => {
    const from = Math.max(Date.parse(d), start);
    const to = Math.min(i + 1 < STAMP_RATES.length ? Date.parse(STAMP_RATES[i + 1][0]) : end, end);
    if (to > from) total += cents * (to - from);
  });
  return total / (end - start) / 100;
}

const STAMP_POINTS = [];
for (let y = 1950; y < TODAY_YEAR; y++) STAMP_POINTS.push([y, stampAverage(y)]);

// Movie tickets: NATO / Box Office Mojo averages up to 2019, then carried forward with the
// BLS "movie admissions" CPI index (no free machine-readable price series exists).
const MOVIE_ANCHORS = [[1970, 1.55], [1980, 2.69], [1990, 4.22], [2000, 5.39], [2010, 7.89], [2019, 9.16]];
const movieIdx = SERIES.movieIdx;
const movieBase = movieIdx.annual[2019];
const MOVIE_POINTS = [
  ...MOVIE_ANCHORS,
  ...Object.entries(movieIdx.annual)
    .filter(([y]) => +y > 2019)
    .map(([y, v]) => [+y, (9.16 * v) / movieBase]),
];

// Rent: Census median gross rent (decennial census / ACS 1-year), carried forward with the BLS
// "rent of primary residence" CPI after the last ACS year.
const RENT_ANCHORS = [[1960, 71], [1970, 108], [1980, 243], [1990, 447], [2000, 602], [2010, 855], [2020, 1096], [2022, 1300], [2023, 1406], [2024, 1487]];
const rentIdx = SERIES.rentIdx;
const RENT_POINTS = [
  ...RENT_ANCHORS,
  ...Object.entries(rentIdx.annual)
    .filter(([y]) => +y > 2024)
    .map(([y, v]) => [+y, (1487 * v) / rentIdx.annual[2024]]),
];

// New-car average transaction price: approximate (industry sources disagree by a few %).
// 2000 from Cox/KBB history, 2024-26 from Kelley Blue Book monthly reports.
const CAR_POINTS = [[1970, 3500], [1980, 7600], [1990, 16500], [2000, 21850], [2010, 29000], [2020, 38000], [2024, 48400], [2025, 49100]];

export const ITEMS = [
  {
    id: "gas", icon: "⛽", label: "Gallon of gas", source: "BLS (1976+); earlier years approximate",
    points: [[1950, 0.27], [1960, 0.31], [1970, 0.36], ...series("gas")], now: SERIES.gas.now,
  },
  { id: "eggs", icon: "🥚", label: "Dozen eggs", source: "BLS average price, grade A large", points: series("eggs"), now: SERIES.eggs.now },
  { id: "bread", icon: "🍞", label: "Loaf of bread (1 lb)", source: "BLS average price, white pan bread", points: series("bread"), now: SERIES.bread.now },
  { id: "burger", icon: "🍔", label: "Big Mac", source: "The Economist Big Mac index", points: series("bigmac"), now: SERIES.bigmac.now },
  {
    id: "movie", icon: "🎬", label: "Movie ticket", source: "NATO / Box Office Mojo to 2019, then BLS movie-admissions index",
    points: MOVIE_POINTS, now: (9.16 * movieIdx.now) / movieBase,
  },
  { id: "stamp", icon: "✉️", label: "First-class stamp", source: "USPS rate history", points: STAMP_POINTS, now: 0.82, step: true },
  { id: "wage", icon: "🧾", label: "Minimum wage / hr", source: "U.S. Dept. of Labor (federal)", points: series("wage"), now: SERIES.wage.now, step: true },
  {
    id: "rent", icon: "🏢", label: "Median rent / mo", source: "Census median gross rent, extended with BLS rent CPI",
    points: RENT_POINTS, now: (1487 * rentIdx.now) / rentIdx.annual[2024],
  },
  { id: "car", icon: "🚙", label: "New car", source: "Approximate average transaction price; 2024+ Kelley Blue Book", points: CAR_POINTS, now: 50089 },
  { id: "home", icon: "🏠", label: "New home (median)", source: "Census median sales price of new houses", points: series("home"), now: SERIES.home.now },
];

// Price of an item in `year`, or null if we have no data that far back.
export function itemPrice(item, year) {
  const pts = [...item.points, [TODAY_YEAR, item.now]];
  if (year < pts[0][0]) return null;
  if (year >= TODAY_YEAR) return item.now;
  for (let i = 0; i < pts.length - 1; i++) {
    const [y0, p0] = pts[i];
    const [y1, p1] = pts[i + 1];
    if (year >= y0 && year < y1) {
      if (item.step) return p0;
      return p0 + ((p1 - p0) * (year - y0)) / (y1 - y0);
    }
  }
  return item.now;
}

// Earliest year with data for at least one item (used for the "no items that far back" message).
export const FIRST_ITEM_YEAR = Math.min(...ITEMS.map((i) => i.points[0][0]));

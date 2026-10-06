// Bundled so the app works offline (it's a PWA) — no network calls.

// BLS CPI-U, U.S. city average, all items, annual averages (1982-84 = 100).
// 2025 is the annual average implied by the BLS-reported 2.7% change; "today" (2026) is a projection, see DEFAULT_RATE.
export const CPI = {
  1913: 9.9, 1914: 10.0, 1915: 10.1, 1916: 10.9, 1917: 12.8, 1918: 15.1, 1919: 17.3, 1920: 20.0,
  1921: 17.9, 1922: 16.8, 1923: 17.1, 1924: 17.1, 1925: 17.5, 1926: 17.7, 1927: 17.4, 1928: 17.1,
  1929: 17.1, 1930: 16.7, 1931: 15.2, 1932: 13.7, 1933: 13.0, 1934: 13.4, 1935: 13.7, 1936: 13.9,
  1937: 14.4, 1938: 14.1, 1939: 13.9, 1940: 14.0, 1941: 14.7, 1942: 16.3, 1943: 17.3, 1944: 17.6,
  1945: 18.0, 1946: 19.5, 1947: 22.3, 1948: 24.1, 1949: 23.8, 1950: 24.1, 1951: 26.0, 1952: 26.5,
  1953: 26.7, 1954: 26.9, 1955: 26.8, 1956: 27.2, 1957: 28.1, 1958: 28.9, 1959: 29.1, 1960: 29.6,
  1961: 29.9, 1962: 30.2, 1963: 30.6, 1964: 31.0, 1965: 31.5, 1966: 32.4, 1967: 33.4, 1968: 34.8,
  1969: 36.7, 1970: 38.8, 1971: 40.5, 1972: 41.8, 1973: 44.4, 1974: 49.3, 1975: 53.8, 1976: 56.9,
  1977: 60.6, 1978: 65.2, 1979: 72.6, 1980: 82.4, 1981: 90.9, 1982: 96.5, 1983: 99.6, 1984: 103.9,
  1985: 107.6, 1986: 109.6, 1987: 113.6, 1988: 118.3, 1989: 124.0, 1990: 130.7, 1991: 136.2,
  1992: 140.3, 1993: 144.5, 1994: 148.2, 1995: 152.4, 1996: 156.9, 1997: 160.5, 1998: 163.0,
  1999: 166.6, 2000: 172.2, 2001: 177.1, 2002: 179.9, 2003: 184.0, 2004: 188.9, 2005: 195.3,
  2006: 201.6, 2007: 207.3, 2008: 215.3, 2009: 214.5, 2010: 218.1, 2011: 224.9, 2012: 229.6,
  2013: 233.0, 2014: 236.7, 2015: 237.0, 2016: 240.0, 2017: 245.1, 2018: 251.1, 2019: 255.7,
  2020: 258.8, 2021: 271.0, 2022: 292.7, 2023: 304.7, 2024: 313.7, 2025: 322.2,
};

export const FIRST_YEAR = 1913;
export const LAST_ACTUAL_YEAR = 2025;
export const TODAY_YEAR = 2026;
// 2026 projection over the 2025 average: Jan–Aug 2026 12-month CPI changes averaged ~3.3%
// (2.4, 2.4, 3.3, 3.8, 4.2, 3.5, 3.4, 3.4). User-adjustable in the UI.
export const DEFAULT_RATE = 3.3;

export function cpiFor(year, rate = DEFAULT_RATE) {
  if (year >= TODAY_YEAR) return CPI[LAST_ACTUAL_YEAR] * (1 + rate / 100);
  return CPI[year];
}

// Rounded national averages (BLS, EIA, Census, NATO, USPS, The Economist, Fed. min wage).
// `points` are [year, price]; values in between are interpolated, or held (step) for
// prices that change in discrete jumps. `now` is the latest reading as of ~Sep 2026 (see
// each item), used as the TODAY_YEAR price.
export const ITEMS = [
  {
    id: "gas", icon: "⛽", label: "Gallon of gas", now: 4.3, // AAA ~$4.28–4.48, Sep 2026 (spike); EIA runs a few cents lower
    points: [[1950, 0.27], [1960, 0.31], [1970, 0.36], [1980, 1.19], [1981, 1.35], [1990, 1.16], [2000, 1.51], [2008, 3.27], [2010, 2.79], [2012, 3.68], [2016, 2.14], [2020, 2.17], [2022, 3.95], [2024, 3.3], [2025, 3.15]],
  },
  {
    id: "eggs", icon: "🥚", label: "Dozen eggs", now: 2.2, // BLS Jul 2026: $2.19
    points: [[1980, 0.84], [1990, 1.0], [2000, 0.96], [2010, 1.78], [2015, 2.47], [2020, 1.47], [2021, 1.67], [2022, 2.86], [2023, 2.8], [2024, 3.17], [2025, 4.71]],
  },
  {
    id: "bread", icon: "🍞", label: "Loaf of bread (1 lb)", now: 1.82, // BLS Aug 2026: $1.823/lb
    points: [[1980, 0.5], [1990, 0.7], [2000, 0.99], [2010, 1.38], [2020, 1.4], [2024, 1.95]],
  },
  {
    id: "burger", icon: "🍔", label: "Big Mac", now: 6.22, // The Economist Big Mac index, 2026
    points: [[1986, 1.6], [1990, 2.2], [2000, 2.54], [2010, 3.73], [2020, 5.71], [2024, 5.69]],
  },
  {
    id: "movie", icon: "🎬", label: "Movie ticket", now: 11.5, // unverified estimate; sources disagree ($10.75 NATO vs. higher)
    points: [[1970, 1.55], [1980, 2.69], [1990, 4.23], [2000, 5.39], [2010, 7.89], [2019, 9.16], [2024, 11.31]],
  },
  {
    id: "stamp", icon: "✉️", label: "First-class stamp", now: 0.82, step: true, // 82¢ since Jul 12, 2026
    points: [[1950, 0.03], [1960, 0.04], [1970, 0.06], [1975, 0.1], [1980, 0.15], [1985, 0.22], [1990, 0.25], [1995, 0.32], [2000, 0.33], [2005, 0.37], [2010, 0.44], [2015, 0.49], [2020, 0.55], [2022, 0.6], [2024, 0.73], [2025, 0.78]],
  },
  {
    id: "wage", icon: "🧾", label: "Minimum wage / hr", now: 7.25, step: true,
    points: [[1950, 0.75], [1956, 1.0], [1961, 1.15], [1963, 1.25], [1967, 1.4], [1968, 1.6], [1974, 2.0], [1975, 2.1], [1976, 2.3], [1978, 2.65], [1979, 2.9], [1980, 3.1], [1981, 3.35], [1990, 3.8], [1991, 4.25], [1996, 4.75], [1997, 5.15], [2007, 5.85], [2008, 6.55], [2009, 7.25]],
  },
  {
    id: "rent", icon: "🏢", label: "Median rent / mo", now: 1560, // estimate: ACS 2024 median gross rent $1,487 plus ~5%
    points: [[1960, 71], [1970, 108], [1980, 243], [1990, 447], [2000, 602], [2010, 855], [2020, 1100], [2022, 1300], [2023, 1406], [2024, 1487]],
  },
  {
    id: "car", icon: "🚙", label: "New car", now: 50100, // KBB average transaction price, Aug 2026: $50,089
    points: [[1970, 3400], [1980, 7600], [1990, 16500], [2000, 22000], [2010, 29000], [2020, 38000], [2024, 48400]],
  },
  {
    id: "home", icon: "🏠", label: "New home (median)", now: 399000, // Census Jan–Aug 2026 median ~$388k–425k
    points: [[1963, 18000], [1970, 23400], [1980, 64600], [1990, 122900], [2000, 169000], [2010, 221800], [2020, 336900], [2024, 420500]],
  },
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

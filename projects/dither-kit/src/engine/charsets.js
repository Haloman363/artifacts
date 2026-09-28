// Glyph sets for the Script Slayer stage, grouped the way the picker shows them.
// Each set lists its glyphs in any order; `rampFor` sorts them by measured ink density
// so luminance maps from sparse to dense regardless of font.

const range = (from, to) => {
  let s = "";
  for (let c = from; c <= to; c++) s += String.fromCodePoint(c);
  return s;
};

export const CHARSET_CATEGORIES = {
  ASCII: {
    "Classic ramp": " .:-=+*#%@",
    "Long ramp": " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    "Short ramp": " .oO@",
    "Letters lower": " abcdefghijklmnopqrstuvwxyz",
    "Letters upper": " ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "Punctuation": " .,:;!?'\"-_",
  },
  Numbers: {
    Digits: " 0123456789",
    Binary: " 01",
    Hex: " 0123456789ABCDEF",
    "Roman": " IVXLCDM",
  },
  Symbols: {
    Math: " +-×÷=≠≈<>±∑∏√∞",
    Currency: " $€£¥₩₿¢",
    Stars: " ·✦✧★☆✩✪✫✬✭✮✯",
    Typographic: " •‣⁃◦‧※⁂§¶†‡",
    Music: " ♩♪♫♬♭♮♯",
  },
  Blocks: {
    Shade: " ░▒▓█",
    "Vertical fill": " ▁▂▃▄▅▆▇█",
    "Horizontal fill": " ▏▎▍▌▋▊▉█",
    Quadrants: " ▖▗▘▝▚▞▙▛▜▟█",
    Sextants: " " + range(0x1fb00, 0x1fb3b),
  },
  Braille: {
    "Braille density": "⠀⠁⠃⠇⠏⠟⠿⡿⣿",
    "Braille full": range(0x2800, 0x28ff),
    "Braille dots": "⠀⠂⠆⠖⠶⡶⣶⣾⣿",
  },
  Geometric: {
    Circles: " ·∘○◌◍◎●◉",
    Squares: " ▫□▢▣▪■",
    Triangles: " ▵▴△▲◬",
    Diamonds: " ⋄◇◈◆",
    Mixed: " ·○□△◇●■▲◆",
  },
  Languages: {
    Katakana: " " + range(0x30a1, 0x30fa),
    Hiragana: " " + range(0x3041, 0x3096),
    Hangul: " ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ가나다라마바사아자차카타파하",
    Greek: " αβγδεζηθικλμνξοπρστυφχψωΩΣΦΨ",
    Cyrillic: " абвгдежзийклмнопрстуфхцчшщъыьэюяЖЩШЮ",
    Hebrew: " " + range(0x05d0, 0x05ea),
    Runic: " " + range(0x16a0, 0x16ea),
  },
  Cards: {
    Suits: " ♠♣♥♦♤♧♡♢",
    "Playing cards": " " + range(0x1f0a1, 0x1f0ae),
    "Chess": " ♙♘♗♖♕♔♟♞♝♜♛♚",
    Dice: " ⚀⚁⚂⚃⚄⚅",
  },
  "Box drawing": {
    Light: " ─│┌┐└┘├┤┬┴┼",
    Heavy: " ━┃┏┓┗┛┣┫┳┻╋",
    Double: " ═║╔╗╚╝╠╣╦╩╬",
    Diagonal: " ╱╲╳",
  },
  Arrows: {
    Simple: " ←↑→↓↔↕",
    Heavy: " ⇐⇑⇒⇓⇔⇕➔➜➤",
    Circular: " ↺↻⟲⟳",
  },
  Unicode: {
    Weather: " ☀☁☂☃☄★☾☽",
    Alchemy: " 🜀🜁🜂🜃🜄🜅🜆🜇",
    Zodiac: " ♈♉♊♋♌♍♎♏♐♑♒♓",
    Matrix: " ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ012345789Z:.=*+-<>¦",
  },
};

export const CHARSET_NAMES = Object.entries(CHARSET_CATEGORIES).flatMap(([cat, sets]) =>
  Object.keys(sets).map((name) => `${cat} / ${name}`),
);

export const charsetGlyphs = (key) => {
  const [cat, name] = key.split(" / ");
  return CHARSET_CATEGORIES[cat]?.[name] ?? CHARSET_CATEGORIES.ASCII["Classic ramp"];
};

// Measure how much of a cell each glyph covers so ramps run light → dark.
const densityCache = new Map();
const MEASURE = 24;
let measureCtx;

const inkDensity = (glyph, font) => {
  const key = `${font}|${glyph}`;
  if (densityCache.has(key)) return densityCache.get(key);
  measureCtx ??= new OffscreenCanvas(MEASURE, MEASURE).getContext("2d", { willReadFrequently: true });
  const ctx = measureCtx;
  ctx.clearRect(0, 0, MEASURE, MEASURE);
  ctx.font = `${MEASURE}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.fillText(glyph, MEASURE / 2, MEASURE / 2);
  const data = ctx.getImageData(0, 0, MEASURE, MEASURE).data;
  let ink = 0;
  for (let i = 3; i < data.length; i += 4) ink += data[i];
  densityCache.set(key, ink);
  return ink;
};

// Returns glyphs as an array (so astral-plane characters stay intact), sorted light → dark.
export const rampFor = (glyphs, font, sort = true) => {
  const list = [...new Set([...glyphs])];
  if (!sort) return list;
  return list
    .map((g) => [g, inkDensity(g, font)])
    .sort((a, b) => a[1] - b[1])
    .map(([g]) => g);
};

# DOLOS://21 — Development Context

This is a structured summary of an extended Claude.ai conversation that
built this game from scratch and then iterated on it heavily. It's not a
literal transcript (I don't have a clean way to export the raw
conversation text) — it's an organized recollection covering what exists,
why it's shaped the way it is, and where to find things. Read this before
making structural changes; a lot of decisions here were made for reasons
that aren't obvious from the code alone.

## What this is

A reimagining of the "21" card minigame from the Resident Evil 7 "Banned
Footage" DLC — you play blackjack-style 21 against a corrupted AI dealer,
with trump cards that let both sides bend the rules (peek at hole cards,
change targets, manipulate bets, sabotage the opponent's hand, etc).
Wrapped in a terminal/CRT/IT-horror aesthetic: the antagonist, DOLOS.SYS,
is themed as a corrupted root-access daemon rather than a supernatural
entity.

## Architecture at a glance

- **Single component**, `App.jsx`, default-exported as `Dolos21`. No
  routing library — a `screen` state string (`"title"`, `"game"`,
  `"codex"`, `"settings"`, etc.) drives which block of JSX renders, via a
  long sequence of `if (screen === "...") return (...)` statements inside
  the component body.
- **`game` state** is one big object holding the entire current match:
  cards, HP, trumps, bet, phase, mode, act/tier, everything. It's `null`
  when not in a match. `phase` within `game` (not to be confused with
  `screen`) drives the in-match state machine: `"bet"` → `"trumpReveal"` →
  `"play"` → `"reveal"` → `"result"`, plus special phases `"bossIntro"` and
  `"death"` added later for cinematic beats.
- **Three single-player modes** share almost all of the same code path:
  Campaign (`game.mode === "campaign"`), Endless Descent
  (`"endless"`), and the scripted Tutorial (`"tutorial"`). Multiplayer
  (`screen === "mp_game"`) is a mostly-separate code path with its own
  match object (`mp` state) since it's peer-synced rather than locally
  simulated.
- **AI opponent logic** lives in `oppStep(g0)` — a pure-ish function that
  takes the current game state and returns the next state after the
  opponent's turn (trump consideration, then hit/stay decision). Called
  from a `useEffect` with an intentional delay (2000–2900ms) so it doesn't
  feel instant.
- **Persistence** goes through `window.storage` (see README.md — this is
  the one thing that needs adaptation outside a Claude artifact). Keys in
  use: `dolos21-settings`, `dolos21-codex`, `dolos21-ngplus`,
  `dolos21-prologue-seen`, `dolos21-endless-best`, plus multiplayer session
  keys.
- **Testing during development** was done via a headless-Chromium +
  Puppeteer harness (not included in this export — it lived in a separate
  scratch directory, not part of the shipped app) that actually played
  through hands, clicked buttons, and asserted on rendered DOM/computed
  styles. Worth rebuilding something similar if you're going to keep
  iterating — a lot of bugs in this session were only caught that way, not
  by reading the code.

## Feature map

### Core game loop
Hole card + face-up card each, shared hit deck, target defaults to 21
(some trumps change it). Trump cards: `PEEK`, `RETURN`, `PLUS_ONE`,
`MINUS_ONE`, `DESTROY`, `ONE_UP`/`TWO_UP`/`ONE_DOWN`/`TWO_DOWN` (bet
manipulation), `EXCHANGE`, `PLUS_TWO`, `TARGET_17`/`TARGET_24`/`TARGET_27`,
`SHIELD`, `SWITCH`/`SWITCH_PLUS`, `PERFECT`, `FIREWALL`, `ROLLBACK`,
`LOVE`, `SABOTAGE`, `SEIZE`. Full definitions in the `TRUMPS` object; pixel
icons in `ICONS`.

### Betting
Both sides start each hand at bet ×1 (no pre-hand slider). `ONE_UP`/
`TWO_UP` raise the *opponent's* bet; `ONE_DOWN`/`TWO_DOWN` lower your own.
Floor is 0 (losing at bet 0 does zero integrity damage). **`SEIZE`** (added
late) implements the actual RE7 mechanic where bet-modifying trumps sit
"on the table" as removable objects: every bet-changing play gets logged
to `game.betModsLog` (`{ by, targetSide, amount, id }`), and `SEIZE` finds
the opponent's most recent entry and reverses it, removing it from the
log. The AI uses `SEIZE` too when it has one and the player has an active
modifier on the table.

### Campaign structure
Each of the 3 acts is **three encounters**, not one long fight: two
randomized "lesser" daemons (55%/75% of the act's base HP) followed by the
act's true named boss (`PROC_ICARUS` / `ICARUS.corrupt` / `DOLOS.SYS`,
always at full HP, fixed sprite). Lesser-encounter identities are rolled
by `randomEndlessIdentity(aiLevel)` — same function Endless mode uses.
Boss encounters trigger a full-screen `BossIntroCard` overlay before the
hand starts (`game.phase === "bossIntro"`), with extra weight for
`DOLOS.SYS` specifically (`isFinal` flag). Between acts, `actclear`
screen shows atmospheric bridge text from `ACT_BRIDGE`.

### Endless Descent
Depth-based scaling (`endlessTierCfg(tier, identity)`), `aiLevel =
min(3, tier)`. Same identity randomization as campaign's lesser
encounters, except at `aiLevel 3` there's roughly a 1-in-8 chance the
opponent visual rolls `"eye"` (a DOLOS fragment) instead of a daemon
sprite — kept rare on purpose so DOLOS.SYS stays special as the campaign's
real final boss.

### Randomized opponent identities
`randomEndlessIdentity()` combines a base mythological name (30-name pool:
Icarus, Tantalus, Sisyphus, Persephone, etc.) with a corruption-flavored
pattern (`PROC_<name>`, `<name>.corrupt`, `<name>.exe`, `<name>_DAEMON`,
etc.) and one of 8 visual types — the two existing Icarus sprites plus 5
new hand-built daemon silhouettes (spider, orb, glitch-block, tendril,
hooded) in `DAEMON_SPRITE_LOOKUP`. Also carries an optional **gimmick**
(`GIMMICKS` pool: shield-opener, aggressive bettor, cautious, reckless,
hoarder) that actually changes `oppStep`'s decision thresholds, shown to
the player as a visible flag so it's a perceivable difference, not a
hidden stat. **Watch out**: `ORPHEUS` is a substring of `MORPHEUS` — any
name-matching logic (see `loreForName`) needs to check longer names first
or it'll misattribute. This bit us once already.

### Codex / bestiary
Every identity you encounter gets logged (`codex` state, persisted) with
seen/defeated status. Defeated entries show a one-line lore snippet
(`NAME_LORE`, keyed by base mythological name) via `loreForName()`.

### New Game+
Unlocks permanently after beating `DOLOS.SYS` (`dolos21-ngplus` flag).
Tighter timers, +2 base damage, +15% opponent HP, sharper AI thresholds,
DOLOS gets 2 cheats per hand instead of 1 (`game.dolosCheated` is a
*count*, not a boolean, specifically to support this). Opt-in toggle on
the campaign start screen, only shown once unlocked.

### Accessibility / settings
Gear icon (top-right, all screens) opens a `settings` screen with sound,
large-text, and colorblind toggles, all persisted together under
`dolos21-settings`, auto-saved via a `useEffect` watching all three rather
than needing each toggle to remember to call a save function. Colorblind
mode remaps red→blue specifically on the classes that carry game meaning
(danger cards, mystery chips, opponent-vs-you distinctions), not a blanket
filter. Large text scales a specific set of text classes further, doesn't
touch layout-critical elements.

### Cinematics / narrative layer (built last, two passes)
- **Boss intro cards** — full-stop moment the first time a hand begins
  against an act's actual boss.
- **Letterboxing** (`<Letterbox/>`) — thin black bars, used on cutscene-ish
  screens (intro, prologue, actclear, boss intro).
- **Per-act color grading** — `actTint` prop on `Shell`, CSS filter classes
  `.actTint2`/`.actTint3` (Act 1 is deliberately the untinted baseline —
  note the prop check is `actTint >= 2`, not just truthy, because `1` is
  truthy in JS and would otherwise tint Act 1 too).
- **Death sequence** — losing holds on a red-static "INTEGRITY: 0" overlay
  (`game.phase === "death"`) for ~2.3s before cutting to the summary
  screen, instead of an instant transition.
- **Cheat banner** — DOLOS cheating gets a held, readable banner instead of
  just a flash.
- **DOLOS boss phase-shift** — corruption visuals during DOLOS.SYS's fight
  factor in *its* HP dropping, not just yours (`bossPhaseShift` in the
  corruption formula), plus the eye's mood escalates idle → hurt → dying.
- **Log fragments** — small chance (20%) of atmospheric found-text between
  hands (`LOG_FRAGMENTS`), purely flavor.
- **DOLOS personal reactions** — `dolosPersonalLine(stats)` occasionally
  (35% chance, Act 3 only) replaces the generic hand-start line with
  something referencing your actual run: a win streak, a narrow escape
  (won a hand at ≤20 HP), or heavy trump usage.
- **Flawless act tracker** — `game.flawless`, broken the instant any hand
  is lost, shown as a HUD badge and celebrated on the act-clear/victory
  screens.
- **Framing device / prologue** — a one-time-ever screen before a player's
  very first Act 1 (`dolos21-prologue-seen` flag), establishing who "you"
  are before the mechanics take over. Routed through a shared `enterAct1()`
  helper so both entry points (skip button, tutorial completion) check it
  consistently.

### Audio
Web Audio API, no audio files — everything is synthesized tones
(`tone()`) plus a persistent ambient drone (`startDrone`/`stopDrone`/
`updateDrone`) that's a pair of detuned low oscillators whose gain/pitch/
filter respond to a `corruption` value computed from HP and act. iOS
Safari requires audio to be unlocked by a real user gesture — there's a
`unlockAudio()` pattern wired to the first tap/click/keydown; don't remove
it or iOS will silently have no sound.

### Multiplayer
Host/guest, lobby codes, polling-based sync (~1.2s interval) through
`window.storage` with `shared: true`. Hole cards use commit-reveal
(SHA-256 hash committed first, revealed at showdown) so neither side can
see the other's hole card by reading shared storage directly. **This is
the piece that needs a real backend to work across devices** — see
README.md.

## Design decisions worth knowing

- **Trumps are hidden until a hand actually starts.** Early in development
  they were visible during the bet/ante screen, which read as broken —
  fixed by gating the trump display rows on `game.phase`, not just always
  rendering them.
- **The gear icon replaced a standalone `[SND]` corner button** that used
  to exist on every screen. Settings now live only behind the gear, which
  is reachable from *every* screen (not just the title), and opening
  settings mid-game correctly returns you to wherever you were
  (`settingsReturnTo` state) rather than bouncing to the title screen.
- **`DolosEye` is reused across many screens** (title, campaign start,
  in-game, victory) via one shared `.eyecv` CSS class. Sizing it for one
  context accidentally resizes it everywhere unless you scope the
  selector (e.g. `.opprow .eyecv` for in-game only) — this caused a real
  regression once, worth remembering if you touch its sizing again.
- **AI thinking delay is deliberately 2000–2900ms**, up from an original
  1150ms, specifically so the AI trump-play popup (`OppTrumpPopup`, held
  ~2.6s) has time to actually be read.

## Suggested next steps

- Wire up a real backend for multiplayer (see README.md).
- Clean up the ~24 harmless JSX build warnings (literal `>` characters).
- Consider splitting `App.jsx` into modules — it's ~4000 lines. The
  natural seams are: trump data/logic, the AI (`oppStep` and friends), the
  campaign/endless config functions, the multiplayer functions
  (`mp*`), and the screen components. Do this incrementally with a real
  test pass after each extraction, not all at once.
- Rebuild some form of automated testing (Puppeteer or Playwright) before
  making large changes — this codebase has enough interlocking state
  (phases, modes, act/tier progression, persisted flags) that manual
  clicking alone missed real bugs during development.

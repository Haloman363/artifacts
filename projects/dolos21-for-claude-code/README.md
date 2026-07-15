# DOLOS://21

A pixel-art IT-horror card game — a reimagining of Resident Evil 7's "Banned
Footage" 21 minigame, built as a single-page React app. Terminal/CRT
aesthetic, a corrupted daemon dealer, three campaign acts, an Endless
Descent mode, local multiplayer, New Game+, and a full trump-card system.

## Quick start

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. `npm run build` produces a production
build in `dist/`.

## Project structure

```
index.html
src/
  main.jsx        — entry point, installs the storage shim, mounts <App/>
  App.jsx          — the entire game (~4000 lines, single component)
  storageShim.js    — see "About window.storage" below, READ THIS FIRST
```

`App.jsx` is intentionally one file. It was built and iterated on inside a
Claude.ai artifact over a very long session, where the whole app has to be
a single component with no local imports. Splitting it into modules is
reasonable follow-up work, but do it carefully — see CONTEXT.md for how the
pieces fit together before you start moving code around.

## About `window.storage` — READ THIS FIRST

`App.jsx` calls `window.storage.get/set/delete(key, shared)` in ~25 places.
This is **not a standard browser API** — it's a persistence API that only
exists inside Claude.ai's artifact runtime. Outside that environment it
doesn't exist at all, and every one of those calls would silently fail.

`storageShim.js` fixes this by installing a `window.storage` polyfill
backed by `localStorage`, so the app runs correctly unmodified. Two
different things get stored under it:

- **Personal data** (`shared: false`) — settings, the codex/bestiary, New
  Game+ unlock, prologue-seen flag, Endless best score. The shim's
  localStorage-backed version of this is genuinely equivalent to what it
  was doing before. No further work needed here.

- **Shared data** (`shared: true`) — used **only** for multiplayer lobby
  and match state sync (host/guest polling each other's game state every
  ~1.2s). The shim currently backs this with localStorage too, which means
  multiplayer will only work between two tabs in the *same browser on the
  same device* — it is not real cross-device multiplayer. If you want
  actual multiplayer, replace the three functions in `storageShim.js`
  (`sharedGet`/`sharedSet`/`sharedDelete`) with real calls to a backend —
  Firebase Realtime Database, Supabase, a small WebSocket relay, whatever
  you'd rather run. The polling-based sync pattern in `App.jsx` (search for
  `mpWrite`, `mpDealHand`, the `setInterval` polling loops) doesn't need to
  change — it just needs those three functions to actually go over a
  network.

## Known non-issues

- `npm run build` prints ~24 esbuild warnings like `The character ">" is
  not valid inside a JSX element`. These come from literal `>` characters
  used as text (the whole UI is styled like a terminal prompt, e.g.
  `<div>&gt; SESSION HIJACKED...</div>` written as `<div>{'>'} ...`
  informally). The build still succeeds and the app is unaffected — it's
  JSX being pedantic, not a real error. Worth cleaning up eventually
  (wrap each literal `>` in `{'>'}`) but not urgent.

## For fuller context on how this was built

See `CONTEXT.md` in this same folder — it's a structured summary of the
full development history: what got built, in what order, the reasoning
behind non-obvious decisions, and a feature-by-feature map of where things
live in the code. It's not a full conversation transcript (that wasn't
something I could export directly), but should get a fresh session up to
speed fast without needing to reverse-engineer 4000 lines cold.

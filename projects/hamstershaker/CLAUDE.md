# HAMSTERSHAKER™

A single-file mobile web game inspired by RATSHAKER (the viral Unreal Engine horror-comedy
where you shake a rat in first person). This version swaps the rat for a hamster, keeps
the game's POV composition and escalating-dread structure, but stays atmospheric — it
deliberately does NOT borrow the original game's actual story content (the real game is
tagged for domestic abuse / child death / suicide themes; keep this project's horror at
the "wrong-feeling world" level: dread, accusation, corruption — no gore, no plot lift).

Owners: Jaymes & Emily (shared account). House style: gothic-dark aesthetic, comfortable
with horror; Emily has an established React/artifact game (DOLOS://21) with a headless
Chromium + esbuild testing pipeline that this project's verification approach mirrors.

## Files

- `index.html` — the entire game. No build step, no dependencies, no external assets
  except Google Fonts (Oswald + Crimson Pro). Open on a phone or serve statically.
- `tools/render-check.js` — extracts the scene SVG out of index.html, forces a given
  visual state, rasterizes to PNG with sharp. Used to verify art without a browser.
- `renders/` — verification renders from development (idle, scream face, stage-3 corruption).
- `DEVLOG.md` — full history of how the game evolved across the design conversation.

## Architecture (all inside index.html)

One `<svg viewBox="0 0 390 700" preserveAspectRatio="xMidYMid slice">` is the whole game
scene, overlaid by HTML HUD elements. Key SVG groups (by id):

- `armGroup` — the rigid first-person arm (forearm from bottom-right, sleeve, palm,
  `fingersFront` wrapping the hamster's belly). Driven by a STIFF spring.
- `hamsterLag` — nested INSIDE armGroup; the floppy hamster. Its transform is the DELTA
  between a loose spring and the hand spring, which produces the signature
  "rigid arm / dangling creature" contrast from the original game.
- `faceIdle` / `faceAlarmed` / `faceScream` — swapped by opacity based on shakeActivity
  thresholds (0.15 / 0.45).
- `eyesCorrupt` — black-void eyes with red rings, stage 3 only.
- `houseGroup` + `houseWindow` — horizon house (stage 2), lit red window (stage 3).
- `duskOverlay`, `redVigRect` — corruption darkening + pulsing red vignette.

### Core loops

- Logic tick (`setInterval` 90ms): meter decay, shakeActivity decay, face-state swap,
  random jitter target refresh, idle nag subtitles, stage-gated glitch/ash timers.
- Visual tick (`requestAnimationFrame`): two damped springs (`stepSpring`) — hand
  (stiffness 420, damping 24) and body (55, 5) — camera judder on the scene wrapper,
  idle breathing bob, ear sway, squash scale, red-vignette pulse.

### Input

1. Drag anywhere on the viewport — pointer speed maps to pulse strength.
2. DeviceMotion shake (iOS needs the "ENABLE SHAKE SENSOR" button →
   `DeviceMotionEvent.requestPermission()`).
3. Tap = weak pulse.

`pulse(strength)` is the single entry point: debounce 55ms, boosts shakeActivity and
the jitter target, adds 4 + strength*6 to the meter, fires squeak + haptics.

### Audio (Web Audio, all procedural, created lazily on first gesture)

- Squeak: per-pulse triangle chirp.
- Scream: continuous sawtooth carrier, amplitude-modulated by a square LFO (14–74 Hz);
  pitch 440–960 Hz tracks shakeActivity. A second detuned sawtooth fades in at stage ≥ 2.
- Drone: two sines at 52 / 53.3 Hz, gain = stage * 0.028.
- Meter completion: low sine boom (120→38 Hz) + white screen flash.

### Corruption stages (function `stage()`, driven by sessionStreak = meter fills this session)

| Stage | Trigger | Effects |
|-------|---------|---------|
| 0 | fresh | sunny-ish field, silly subtitles |
| 1 | 1+ fills | ash particles rise, uneasy subtitles, drone fades in |
| 2 | 3+ fills | house appears, red vignette pulses, detuned scream, HUD glitches ("IT HUNGERS") |
| 3 | 6+ fills | window lights red, void eyes, all-caps letter-spaced litany subtitles |

Subtitle pools: `FLAVOR_STAGES` (on meter completion) and `PROMPT_STAGES` (idle nagging),
both indexed by `stage()`. RESET wipes corruption ("The counter forgets. The hamster remembers.").

### Persistence

`window.storage` key `shake-the-hamster-stats` → `{total, bestMs}`. NOTE: window.storage
is a Claude.ai artifact API. When porting outside Claude artifacts, replace the two
functions `loadStats`/`saveStats` with localStorage (they're the only touch points, both
already wrapped in try/catch so the game runs fine if storage is absent).

## Verification workflow

No browser needed for art review: `node tools/render-check.js <state>` where state is
`idle`, `scream`, or `corrupt`. It regex-extracts the scene SVG from index.html, forces
the relevant opacities, and writes a PNG via sharp (`npm i sharp`). Extend the FORCE
table in that script when adding new visual states. For behavior/JS testing, the
headless Chromium + puppeteer approach from the DOLOS://21 pipeline applies directly.

## Known constraints / gotchas

- Claude.ai artifacts disallow localStorage — that's why window.storage is used.
- The scene SVG uses literal hex colors (no CSS vars) specifically so sharp can
  rasterize it standalone. Keep it that way if you want render-check to keep working.
- `preserveAspectRatio="slice"` crops sides on wide screens; designed portrait-first.
- Audio nodes are created once and reused; iOS requires the first creation to happen
  inside a user gesture (pulse() handles this via ensureYellNodes()).

## Ideas discussed but not yet built

- Motion blur smear on the hamster at peak velocity
- More corruption stages (field recedes, treeline advances, sky goes black)
- An actual "ending" when some threshold is crossed
- Gothic-reskin variant reusing the Shake Thy Rat exorcism theme (see DEVLOG)

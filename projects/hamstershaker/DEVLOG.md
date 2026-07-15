# DEVLOG — how this game came to be

This documents the design conversation (Claude.ai, July 2026) that produced index.html,
so a new session (Claude Code or otherwise) has the full decision history.

## 1. "Make an artifact inspired by RATSHAKER" — research + v1

Researched the game: RATSHAKER is a viral indie horror-comedy (Unreal Engine, PC/console).
You hold a rat in first person and physically shake it (gyro on console, mouse-shake on
PC); shaking fills a meter used to progress through a recursive haunted house. Reviews
specifically praise the "dangle physics" — a rigid realistic arm holding a floppy cartoon
rat. The real game's story goes very dark (domestic abuse, child death, suicide themes);
we decided from the start to take the MECHANIC and TONE-SHAPE, not the plot.

v1 was "Shake Thy Rat — A Pocket Exorcism": gothic-comedic reskin matching the users'
Grimoire Glam brand voice (solemn-elegant, "thine order" register). Dark plum/oxblood/
antique-gold palette, magic-circle progress ring, SVG rat, procedural squeaks, shake
detection via devicemotion + tap fallback, persistent stats via window.storage.

## 2. "Can it be shake the hamster" → chose "full cute chaos"

Offered two directions (keep gothic vs. bright meme energy); users picked cute chaos.
v2: pastel palette (bubblegum/sunshine/sky), Fredoka type, hamster in a spinning wheel
ring that sped up with the meter, inflating cheek pouches, comic burst words
(SQUEAK!/BOING!), confetti + fanfare on completion.

## 3. "I want a hand holding the hamster that yells when shaking"

v3 added a first-person mitten-style hand gripping the hamster, three face states
(idle → alarmed → screaming) driven by a decaying shakeActivity value, a continuous
oscillator "yell" whose pitch/volume tracked shake intensity, impact lines, and a
drag-to-shake input (pointer speed → pulse strength).

## 4. "Match the same visuals of the RATSHAKER POV and animations"

v4 was the big rebuild toward the game's actual feel:
- Sleeved forearm entering from the bottom of frame, individual fingers
- Split spring physics: stiff spring for the hand, loose spring for the hamster,
  so the creature visibly lags and overshoots (the dangle)
- Camera judder on the whole viewport
- Amplitude-modulated scream (square-wave LFO chopping a sawtooth) instead of a clean tone
- Burst words split into calm vs. panicked pools

## 5. "Fix it — it does not look at all like RATSHAKER"

The pastel card layout was wrong. Pulled actual game screenshots: the real look is a
dark first-person 3D scene (iconic dusk FIELD with treeline, later a dim house), a pale
grey-white uncanny rat held up at CENTER frame, realistic arm, chunky "RATSHAKER METER"
HUD bar top-center, heavy vignette.

v5 rebuilt from scratch to that composition:
- Full-screen scene: overcast dusk sky, treeline silhouette, ochre field with grass
  blades, vignette, center crosshair dot
- Realistic shaded arm (skin gradients + dark sleeve) from bottom-right; pale cream
  hamster with big glossy black eyes dangling at center, limp arms, pink feet
- "HAMSTERSHAKER™" bordered meter, Oswald type
- Flavor lines delivered as italic serif SUBTITLES near the bottom (like game voice lines)
- Completion = screen flash + low boom (no more confetti)
- NEW verification workflow: puppeteer/Chromium wouldn't install in the sandbox, so we
  rasterized the scene SVG directly with sharp and visually reviewed PNGs before shipping.
  Caught two malformed 8-digit hex colors and a bad thumb position this way.

## 6. "Better — more horror focused to match the game"

v6 (current) added the escalating-dread structure, gated on sessionStreak (meter fills):
- Stage 1: rising ash particles, uneasy subtitles, low drone (52 + 53.3 Hz beat)
- Stage 2: a house appears on the horizon, pulsing blood-red vignette, detuned second
  scream voice, HUD glitch flickers ("IT HUNGERS — n%")
- Stage 3: house window lights red, hamster's eyes become black voids with red rings,
  subtitles switch to stark all-caps litany ("KEEP. SHAKING." / "DO NOT STOP.")
- World darkens progressively; reset clears corruption
- Verified stage-3 composite with a forced-state sharp render before shipping

## Style notes for future edits

- Subtitles: stage 0–2 use italic Crimson Pro; stage 3 uses the `.dread` class
  (Oswald, letter-spaced caps). Keep new lines short — they render at 16.5px over the scene.
- The humor should never fully disappear; the original game's charm is that it stays
  funny WHILE being wrong. ("The hamster has unionized" energy early, dread later.)
- Horror ceiling: atmosphere and accusation only. No gore, no borrowed plot.

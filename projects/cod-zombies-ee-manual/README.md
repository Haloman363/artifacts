# 115 // Easter Egg Field Manual

A mobile-first, single-file reference app for the main Easter egg (main quest) walkthroughs of every **Call of Duty: Zombies** map from **World at War (2008)** through **Black Ops 4 (2018)**.

## What it is

- One self-contained `zombies-easter-egg-manual.html` — no build step, no server, no dependencies except Google Fonts loaded from a CDN.
- Organized **game → map**. Tap a game tab, tap a map card, get a full dossier: setup checklist, numbered major-step walkthrough, reward, field tips, and two links (a YouTube video-guide search and the CoD Wiki written guide).
- Themed as a grimy "element 115 dossier" (dark, military-stencil, cyan-115 glow + blood red).

## Run it

Just open the HTML file in any browser:

```bash
open zombies-easter-egg-manual.html        # macOS
# or double-click it, or serve it:
python3 -m http.server 8000                 # then visit http://localhost:8000
```

It's fully responsive and built for phones (safe-area insets, large tap targets, a slide-in detail sheet).

## Coverage

| Game | Maps | Quests with full walkthroughs |
|------|------|-------------------------------|
| World at War | 4 | Der Riese (Fly Trap) |
| Black Ops | 6 | Ascension, Call of the Dead, Shangri-La, Moon |
| Black Ops II | 5 | TranZit, Die Rise, Mob of the Dead, Buried, Origins |
| Black Ops III | 6 | Shadows of Evil, Der Eisendrache, Zetsubou, Gorod Krovi, Revelations |
| Black Ops 4 | 8 | Voyage, IX, Blood of the Dead, Classified, Dead of the Night, Ancient Evil, Alpha Omega, Tag der Toten |

Maps with no completable main quest (Nacht, Verrückt, Shi No Numa, Kino, "Five", The Giant) are flagged and list their hidden song instead.

**Accuracy tiers** (shown per map in the `accuracy` field):
- `Verified` — steps confirmed against current written guides (Der Eisendrache, Origins).
- `Shape only` — the reliable overall flow; exact ordered inputs should be followed from the linked video/wiki because they're partly randomized each match.

See `CLAUDE.md` for the data model and conventions, and `CONVERSATION-LOG.md` for how this was built.

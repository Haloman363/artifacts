# CLAUDE.md — project context

Context for continuing work on the 115 Easter Egg Field Manual in Claude Code.

## Architecture

- **Single file**: everything lives in `zombies-easter-egg-manual.html` (CSS in `<style>`, data + logic in one `<script>`). Keep it that way unless there's a strong reason to split — portability and "open in any browser" are the point.
- **No framework, no build, no bundler.** Vanilla HTML/CSS/JS. Only external dependency is Google Fonts via CDN (Black Ops One, Oswald, Inter, Space Mono).
- **No browser storage in the claude.ai artifact sandbox** — but this project now lives in Claude Code / a real browser, so `localStorage` works here. A "mark quest complete" progress tracker is therefore viable (it wasn't in the original artifact). See TODO.

## Data model

All content is one array, `DATA`, near the top of the script. Shape:

```js
DATA = [
  {
    id, name, ix, year, sub,      // a game (e.g. "Black Ops III")
    maps: [
      {
        n,         // map name
        q,         // quest name (or "No main quest ...")
        url,       // CoD Wiki page slug appended to WIKI base (optional; falls back to name)
        diff,      // 0–5 difficulty (0 = no quest)
        players,   // "1–4", "Co-op (recommended)", etc.
        reward,    // optional string
        accuracy,  // "Verified" | "Shape only" | "Verified (parts vary)" | ...
        rand,      // true => shows the "randomized steps" warning banner
        noee,      // true => no main quest; renders as a muted card + `easter` song note
        blurb,     // 1–2 sentence overview
        req: [],   // "Required Setup" checklist
        steps: [], // "Walkthrough — Major Steps" (HTML allowed, <b> for emphasis)
        tips: [],  // "Field Tips"
        easter,    // (noee maps) hidden/side easter egg description
        note,      // optional caveat callout (amber box)
      }
    ]
  }
]
```

Rendering is data-driven: `renderGame()` builds the map cards for the active tab; `openSheet(gi, mi)` builds the detail dossier. To add/edit a map, edit `DATA` only — no template changes needed.

### Adding a walkthrough
1. Find the map object in `DATA`.
2. Fill `req`, `steps`, `tips`, `reward`. Use `<b>…</b>` inside steps to highlight key nouns/actions.
3. Set `accuracy` honestly. If steps are randomized per match, set `rand: true`.

## Design system (tokens live in `:root`)

- `--bg #0c0d0b`, `--panel`, `--line` — dark dossier base.
- `--c115 #3fe0c6` — element-115 cyan glow (primary accent: quest names, step numbers, section rules).
- `--blood #c0392b` — the wiki CTA + difficulty pips.
- `--amber #e6a23a` — warnings / reward callout.
- Fonts: **Black Ops One** (app title only), **Oswald** (headers, uppercase), **Inter** (body), **Space Mono** (data/labels/step numbers).
- Motion respects `prefers-reduced-motion`.

## Content rules (important — keep these)

- **Walkthroughs are major-beat, not frame-perfect.** Many quests randomize symbol orders / part spawns each game; don't fabricate exact ordered inputs. Flag those with `rand: true` and lean on the video/wiki links.
- **No copyrighted game screenshots** are embedded. This is deliberate (Activision IP). The "Watch video guides" button covers the visual need instead.
- **Links:**
  - Video button → a YouTube *search* URL (`youtube.com/results?search_query=...`) scoped to `map + game + "easter egg guide"`. Search URLs don't rot and always surface current top guides. Prefer this over hardcoding video IDs.
  - Wiki button → `WIKI + (m.url || slugified name)`. `WIKI = "https://callofduty.fandom.com/wiki/"`.
- Sources used so far: Call of Duty Wiki (Fandom) main-quest index for the map/quest list; per-map written guides for the Verified maps. Not affiliated with Activision/Treyarch.

## TODO / good next steps

- **Verify more maps to `Verified`**: Mob of the Dead, Shadows of Evil, Tag der Toten, Moon are the usual next priorities.
- **Progress tracker**: with real `localStorage`, add a "completed" toggle per map + a per-game completion count in the tabs.
- **Search/filter bar**: filter maps by name/quest/difficulty across all games.
- **Wonder-weapon sub-guides**: build steps for the KT-4, Kraken, Ray Gun Mk3, elemental staffs/bows, etc.
- **Extend coverage**: Black Ops Cold War + Vanguard maps (data already structured to just append two more game objects).
- **Offline**: it's already offline-capable except fonts — optionally self-host the fonts to be 100% offline.

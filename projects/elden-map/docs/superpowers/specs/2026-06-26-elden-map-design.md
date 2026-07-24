# Elden Map — Design Spec

**Date:** 2026-06-26  
**Status:** Approved

---

## Context

This app is a GPS navigation PWA styled entirely in the Elden Ring aesthetic. The inspiration is the IRL Maps app (com.retryapps.game.maps.irl), which applies game visual themes to real-world navigation — but that app doesn't support Elden Ring and has significant UX gaps (no address search, no ETA, screen sleep issues). This project fills that gap for personal/friend use with a full Elden Ring immersion treatment: dark parchment map, gold UI, lore-phrased TTS voice, and Elden Ring sound effects on navigation events.

Audience: personal + share with friends (non-commercial). No app store submission needed — distributed as a PWA via Vercel URL.

---

## Architecture

Static React PWA, no backend. All logic runs in the browser. Deployed to Vercel (auto-HTTPS required for GPS on iOS).

**External dependencies:**
- **Mapbox GL JS** — map tiles + custom visual style
- **Mapbox Directions API** — routing, turn steps, ETA
- **Web Speech API** — browser TTS for lore-phrased voice prompts
- **Howler.js** — sound effect management (handles iOS audio unlock quirk)

No user accounts, no persistence. Route state is ephemeral (in-memory per session).

**iPhone install path:** Safari → Share → Add to Home Screen → PWA

---

## Map Visuals (Mapbox Studio Style)

Custom `mapbox-style.json` committed to repo, loaded at runtime.

| Element | Treatment |
|---|---|
| Background / land | `#27170d` dark brown + subtle parchment noise texture |
| Highways | Gold `#bd6707`, bold stroke |
| Arterial roads | Muted amber, medium stroke |
| Residential roads | Near-invisible dark grey — minor paths faint like Elden Ring map |
| Water | Deep indigo-black `#1a1a2e` (Siofra River style) |
| Labels | Cinzel font, uppercase, gold on dark |
| Player position | Animated golden circle with pulsing glow (Site of Grace beacon) |
| Destination marker | Site of Grace SVG icon (from Nexus Mods fan asset pack — personal use) |
| Turn waypoints | Small golden rhombus |
| Route line | Glowing amber polyline with subtle outer glow |

**Startup effect:** Map fades in from fog/darkness, "revealing" the area — mimics Elden Ring map discovery.

**Color palette reference:**
- Deep black: `#040200`
- Dark brown: `#27170d`
- Burnt gold: `#bd6707`
- Bright gold: `#f9c043`
- Accent orange: `#ed8a09`
- Indigo water: `#1a1a2e`

---

## UI Screens

### 1. Home / Search
- Full-screen dark parchment background
- Title: "ELDEN MAP" in Cinzel, gold, large — Elden Ring title treatment
- Search bar: stone-carved aesthetic, Cinzel font, gold border, glow on focus
- "Begin Journey" button: plays Elden Ring menu select sound on tap
- Recent destinations: rune-carved list items (localStorage, max 5)

### 2. Navigation View
- Map: 100% of screen
- Bottom HUD panel: semi-transparent dark overlay (equipment bar style)
  - Next turn arrow + street name (Cinzel uppercase)
  - Distance to next turn
  - ETA display (plain "~14 min" — readability over lore while driving)
- Top-right: Site of Grace icon button → recenters map on user position

**Sound events (Howler.js):**

| Event | Sound |
|---|---|
| Turn approaching (~300ft) | Soft Elden Ring UI chime |
| Turn now | Louder confirmation tone |
| Arrival | "Lost Grace Discovered" chime + golden particle burst on marker |
| Recalculating | Ominous low tone |

**Voice (Web Speech API):**  
Lore-phrased TTS. Phrase map (partial):

| Standard | Elden Ring |
|---|---|
| "Turn left in 200 feet" | "Seek the path left, Tarnished" |
| "Turn right" | "Bear right, Tarnished" |
| "You have arrived" | "A Site of Grace draws near" |
| "Recalculating" | "The path is lost. Seek guidance anew" |
| "Continue straight" | "Press onward, Tarnished" |

### 3. Arrival Screen
- Full-screen golden shimmer animation (fog gate style — CSS animation)
- Text: "A SITE OF GRACE HAS BEEN FOUND" — Elden Ring title treatment
- Tap anywhere → returns to Home

---

## File Structure

```
elden-map/
  src/
    App.jsx                   # screen router (Home / Navigate / Arrival)
    screens/
      Home.jsx
      Navigate.jsx
      Arrival.jsx
    components/
      MapView.jsx             # Mapbox GL instance + style
      HUD.jsx                 # turn card + ETA overlay
      SearchBar.jsx
    hooks/
      useNavigation.js        # Directions API calls, step tracking, recalc
      useVoice.js             # TTS with lore phrase lookup
      useSounds.js            # Howler sound events
    sounds/                   # .mp3 files (community-sourced Elden Ring SFX)
    style/
      mapbox-style.json       # Mapbox Studio export
    index.css                 # Cinzel import, CSS vars (gold palette, parchment)
  public/
    manifest.json             # PWA metadata (name, icons, display: standalone)
    icons/                    # App icon in Elden Ring style (192px, 512px)
  docs/
    superpowers/specs/        # this file
```

---

## Tech Stack

| Tool | Version / Notes |
|---|---|
| React + Vite | Latest — fast dev server, PWA plugin |
| mapbox-gl | v3.x |
| Howler.js | v2.x — iOS audio unlock handling |
| Cinzel | Google Fonts |
| Vercel | Deploy target, free tier |

---

## Assets & Licensing

- **Elden Ring SFX**: Community-sourced from Voicy / 101 Soundboards. Non-commercial personal sharing use — do not monetize.
- **Map icons**: Ultimate Elden Ring Map Resource Pack (Nexus Mods #960) — fan-extracted PNGs, personal use only.
- **Cinzel font**: OFL licensed, free to use.
- **Mapbox**: Free tier (50k map loads/month) — sufficient for friend sharing.

---

## Verification

1. `npm run dev` → opens on localhost, confirm map renders with dark parchment style
2. Allow GPS → confirm position marker appears as golden pulsing circle
3. Search a destination → confirm route line renders in amber glow
4. Drive/walk route → confirm HUD shows turn instructions, TTS fires with lore phrases
5. Complete route → confirm Arrival screen fires with golden shimmer + "Site of Grace" chime
6. On iPhone: open Vercel URL in Safari → Add to Home Screen → confirm app installs and GPS works over HTTPS

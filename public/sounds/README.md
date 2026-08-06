# Elden Map sound effects

Five `.mp3` files, loaded by `src/artifacts/elden-map/hooks/useSounds.js`.
Missing files are handled gracefully — Howler emits `loaderror` and the app stays
silent rather than breaking — so the app runs fine before these are added.

| Filename | Event | Description |
|----------|-------|-------------|
| `menu-select.mp3` | Tapping "Begin Journey" | Elden Ring UI selection sound |
| `chime-soft.mp3` | Turn approaching (~300 ft) | Soft UI chime |
| `chime-loud.mp3` | Confirmation | Louder confirmation tone |
| `grace-discovered.mp3` | Arrival | "Lost Grace Discovered" chime |
| `recalc.mp3` | Off-route recalculation | Ominous low tone |

## Sourcing

Download manually from:

- Voicy — https://www.voicy.network/official-soundboards/games/elden-ring
- 101 Soundboards — https://www.101soundboards.com (search "Elden Ring")

Save each with the exact filename above into this directory. Filenames must match
exactly; the hook looks them up by name.

Keep them small — these are short SFX, so a few hundred KB each is plenty. Files
are fetched over the network on first load and precached by the service worker.

## Licensing

These are community-sourced Elden Ring game sounds, © FromSoftware / Bandai Namco.
Used here for a non-commercial personal project. **Do not monetize.** If you fork
or redistribute this repo, source your own audio or remove these files.

# artifacts

A PWA hub of small React apps, built with Vite and served under `/artifacts/`.
Installable to a phone home screen; each app is reachable from a tile grid on the hub.

**Live:** https://haloman363.github.io/artifacts/

## Apps

| App | Route | Description |
|-----|-------|-------------|
| Lunch Quest | `/lunch-quest` | Lunch picker as an RPG quest |
| Nick System | `/nick-measurement` | Joke measurement-conversion tool |
| Brainrot | `/brainrot` | Brainrot slang translator |
| Subnet Calc | `/subnet-calc` | IPv4 subnet/CIDR calculator |
| Pomodoro | `/pomodoro` | Pomodoro timer |
| Claudagotchi | `/tamagotchi` | Lobster tamagotchi virtual pet |
| Car Maintenance | `/car-maintenance` | Service tracking by mileage and date, with due/overdue notifications |
| Peptides | `/peptides` | Peptide/supplement tracker with dose calculator and metrics log |
| Savings | `/savings` | Savings buckets with transaction log |
| Dolos://21 | `/dolos21` | Terminal-styled blackjack game |
| Hamstershaker | `/hamstershaker` | Hamster clicker game |
| Zombies EE Manual | `/zombies-ee-manual` | CoD Zombies easter egg step guide |

State is stored per-app in `localStorage` — nothing leaves the device, and there is no backend.

### Standalone projects

`projects/` holds apps that are **not** part of the hub build and are not reachable from the
tile grid. They have their own dependencies and build pipelines:

| Project | Status |
|---------|--------|
| `elden-map/` | Elden Ring map with routing and audio. React 19 + `mapbox-gl`; needs a `VITE_MAPBOX_TOKEN` in `.env`. Not ported to the hub. |
| `cod-zombies-ee-manual/` | Original static HTML; ported to the hub as `/zombies-ee-manual` |
| `dolos21-for-claude-code/` | Original standalone build; ported to the hub as `/dolos21` |
| `hamstershaker/` | Original static HTML; ported to the hub as `/hamstershaker` |

The last three are kept as the originals their hub versions were derived from. `elden-map` is
the only one with no hub equivalent — it pins React 19 against the hub's React 18 and needs a
Mapbox API token, so it builds and runs on its own:

```bash
cd projects/elden-map
npm install
echo "VITE_MAPBOX_TOKEN=your_token_here" > .env
npm run dev
```

## Development

```bash
npm install
npm run dev      # dev server
npm run build    # production build to dist/
npm run preview  # serve the built output
```

Requires Node 18+ (developed on v22).

## Structure

Two kinds of app live here — which one to use depends on how the app is built:

```
src/
  App.jsx              router: one <Route> per artifact
  hub/Hub.jsx          home screen tile grid (APPS array)
  artifacts/
    BackButton.jsx     shared layout chrome used by every artifact
    <app-slug>/        one folder per app, kebab-case
projects/
  <project-name>/      standalone apps with their own package.json and build
```

- **`src/artifacts/<app-slug>/`** — components wired into the shared hub router, sharing this
  repo's `package.json` and build. One folder per app, no flat files.
- **`projects/<project-name>/`** — standalone apps with their own dependencies and build
  pipeline. Not routed through `src/App.jsx`.

### Adding an artifact

1. Create `src/artifacts/<slug>/<Component>.jsx`
2. Import it in `src/App.jsx` and add a `<Route>` inside `<ArtifactLayout>`
3. Add a tile to the `APPS` array in `src/hub/Hub.jsx`

Steps 2 and 3 are both required — a route without a tile is unreachable from the hub.

If the app needs its own dependencies or build config, put it in `projects/` instead.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes `dist/`
to GitHub Pages. `base` is set to `/artifacts/` in `vite.config.js` to match the Pages path.

The PWA uses `registerType: "prompt"` — clients are notified of a new build rather than
updating silently, via the update banner and the hub's "Check for updates" button.

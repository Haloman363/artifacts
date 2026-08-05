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
| Elden Map | `/elden-map` | Elden Ring–styled GPS navigation with turn-by-turn directions |

State is stored per-app in `localStorage` — nothing leaves the device, and there is no backend.

### Mapbox token (Elden Map)

Elden Map needs a Mapbox token for map tiles, geocoding search, and driving directions.
Without one the route renders an explanatory notice instead of a broken map; every other
artifact is unaffected.

**Local development:**

```bash
cp projects/elden-map/.env.example .env
# then edit .env and set your pk. token
```

**Deployed builds:** the workflow reads the `MAPBOX_TOKEN` repository secret
(Settings → Secrets and variables → Actions) and passes it to the build as
`VITE_MAPBOX_TOKEN`.

> Vite inlines `VITE_*` values into the JavaScript bundle, so this token **is visible to
> anyone who loads the site** — that is unavoidable for a static build with no backend. The
> secret only keeps it out of git. Protect it with **URL restrictions** in the Mapbox
> dashboard (Account → Tokens → URL restrictions) scoped to `https://haloman363.github.io/*`,
> and use a public `pk.` token — never a secret `sk.` one.

### Standalone projects

`projects/` holds the original standalone versions of apps that were later ported into the
hub. They keep their own dependencies and build pipelines and are not routed or deployed:

| Project | Ported to |
|---------|-----------|
| `elden-map/` | `/elden-map` |
| `cod-zombies-ee-manual/` | `/zombies-ee-manual` |
| `dolos21-for-claude-code/` | `/dolos21` |
| `hamstershaker/` | `/hamstershaker` |

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

If an artifact pulls in a heavy dependency, import it with `lazy()` + `<Suspense>` rather
than a plain import. Workbox refuses to precache any single asset over 2 MB, so a large
library in the main bundle silently breaks offline support for the whole PWA. Elden Map does
this for `mapbox-gl` (~1.5 MB), which keeps the shared bundle near 536 kB.

If the app needs its own dependencies or build config, put it in `projects/` instead.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes `dist/`
to GitHub Pages. `base` is set to `/artifacts/` in `vite.config.js` to match the Pages path.

The PWA uses `registerType: "prompt"` — clients are notified of a new build rather than
updating silently, via the update banner and the hub's "Check for updates" button.

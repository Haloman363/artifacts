# artifacts

PWA hub of small React apps ("artifacts"), built with Vite and served under `/artifacts/`.

## Structure

Two kinds of app live here — pick based on how the app is built:

- **`src/artifacts/<app-slug>/`** — apps that are just a component wired into the shared hub's
  router (`src/App.jsx`) and share the hub's `package.json`/build. One folder per app, named with
  a kebab-case slug (e.g. `lunch-quest/`, `car-maintenance/`). Each folder holds that app's
  component file(s) only — no flat files directly in `src/artifacts/`.
  `src/artifacts/BackButton.jsx` is the exception: shared layout used by every artifact, stays at
  the top level.
- **`projects/<project-name>/`** — standalone apps with their own `package.json`, own Vite config,
  own build/deploy. Not routed through `src/App.jsx`. Use this when a project needs its own
  dependencies or build pipeline instead of piggybacking on the hub's.

When adding a new artifact:
1. New component that fits the hub's existing deps/router → new folder under `src/artifacts/`,
   then wire it into `src/App.jsx` (route) and `src/hub/Hub.jsx` (tile).
2. New standalone project (own package.json) → new folder under `projects/`.

Don't add flat files to `src/artifacts/` or `projects/` — always a folder per app, even for small
ones.

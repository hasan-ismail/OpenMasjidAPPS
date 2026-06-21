# OpenMasjidAPPS

The app catalog for [**OpenMasjidOS**](https://github.com/hasan-ismail/OpenMasjidOS) — a free,
self-hosted, masjid-themed platform for running Docker apps. This repo holds the apps; the
platform fetches one file from here (`catalog.json`) to populate its App Store.

> Building an app? Read **[CLAUDE.md](./CLAUDE.md)** — it's the authoritative contract.

## How it works

- Each app is a folder under `apps/<app-id>/` containing a `manifest.yaml`, a
  `docker-compose.yml`, an icon, and optional screenshots.
- `catalog.json` (repo root) is **generated** from those folders and is the only file the
  platform reads, from:
  `https://raw.githubusercontent.com/hasan-ismail/OpenMasjidAPPS/main/catalog.json`
- The platform installs an app by running its compose as `docker compose -p omos-<id> up -d`,
  injecting the user's answers to the app's `settings` as environment variables.

## Adding an app

1. Create `apps/<app-id>/` (folder name = the app `id`, kebab-case).
2. Add `manifest.yaml`, `docker-compose.yml`, `icon.svg`, and `screenshots/`.
3. Regenerate the catalog:
   ```
   npm install
   npm run build
   ```
4. Commit. (CI also rebuilds `catalog.json` automatically on push to `main`.)

## Licensing

The platform is AGPL-3.0, but apps run at arm's length as separate containers, so **each app
keeps its own license** (the `license` field in its manifest). Do not copy app definitions or
assets from umbrelOS or CasaOS — author them fresh. See [CLAUDE.md §10](./CLAUDE.md).

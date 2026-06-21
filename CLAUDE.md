# CLAUDE.md — OpenMasjidAPPS

> This file is the single source of truth for the **OpenMasjidAPPS** repository — the app
> catalog for **OpenMasjidOS**. Read it fully before writing anything. When in doubt, follow
> this document. If something is ambiguous, ask before guessing.

---

## 1. What this repo is

**OpenMasjidAPPS** is the **app catalog** consumed by **OpenMasjidOS**, a free, self-hosted,
masjid-themed platform for running Docker apps ("umbrelOS for masjids"). The platform is the
engine that finds, installs, runs, updates and removes apps; **this repo is where the apps
live**.

- **Platform repo (the engine):** https://github.com/hasan-ismail/OpenMasjidOS
- **This repo (the apps):** https://github.com/hasan-ismail/OpenMasjidAPPS
- The platform's app-store client fetches **one static file from this repo** — `catalog.json`
  at the repo root on the `main` branch — and renders it as the App Store. **There is no
  app-store server to run.** Publishing an app = adding a folder here and regenerating
  `catalog.json`.

The exact URL the platform fetches (from the OpenMasjidOS source,
`packages/core/src/config.ts`):

```
https://raw.githubusercontent.com/hasan-ismail/OpenMasjidAPPS/main/catalog.json
```

(Operators can override it with `OPENMASJID_CATALOG_URL`, but the default above is the contract.
Keep `catalog.json` at the repo **root** on **`main`**.)

### What we build here
The actual **end-user apps** — the things that are explicitly *out of scope* for the platform:
prayer-time displays, donation pages, announcement boards, event calendars, Quran resources,
admin tools, utilities. Each app is a normal Docker app described by a small manifest and a
`docker-compose.yml`.

### What we do NOT build here
The platform itself (installer, dashboard, daemon) — that's OpenMasjidOS. Don't reimplement
platform features in an app.

---

## 2. The contract — how the platform consumes an app (read this carefully)

This is grounded in the real OpenMasjidOS code, not just a spec. An app must fit it exactly.

1. **The catalog is `catalog.json`** at this repo's root. The platform accepts either a bare
   array `[ {app}, … ]` **or** an envelope `{ "apps": [ {app}, … ] }`. We publish the envelope.

2. **Each entry is one app object** with this shape (from `packages/core/src/apps/types.ts`,
   `CatalogApp`):

   | Field | Required | Notes |
   |-------|----------|-------|
   | `id` | ✅ | Unique, **kebab-case**, must match `^[a-z0-9][a-z0-9-]{0,79}$`. The platform **drops any entry with an invalid id** (security). Must equal the app's folder name here. |
   | `name` | ✅ | Display name. |
   | `version` | ✅ | Semver string, e.g. `1.0.0`. |
   | `compose` | ✅ | The app's **entire `docker-compose.yml` as a string** (embedded into the JSON). This is what actually runs. |
   | `tagline` | – | One short line shown on the card. |
   | `category` | – | One of: `displays` `donations` `community` `quran` `admin` `utilities`. |
   | `author` | – | |
   | `license` | – | The **app author's** choice (see §10). |
   | `icon` | – | An **absolute URL** to the icon (see §8). |
   | `screenshots` | – | Array of **absolute URLs**. |
   | `description` | – | Markdown, shown on the app detail page. |
   | `settings` | – | Array of setting fields the user fills in before install (see §7). |
   | `ports` | – | Array of `{ container: number, label?: string }` — informational metadata. The *actual* port publishing happens in the compose. |

3. **Install mechanics** (from `packages/core/src/apps/manager.ts`): when a user installs an
   app, the platform:
   - writes your `compose` string to `compose.yml`,
   - writes the user's `settings` answers to a **`.env` file**,
   - runs **`docker compose -p omos-<id> --env-file <.env> up -d --remove-orphans`**.

   So inside your compose, **reference settings as `${KEY}`** (standard compose env
   interpolation). Example: a setting with `key: LATITUDE` is available in the compose as
   `${LATITUDE}` and in the container's environment if you pass it through `environment:`.

4. **Discovery is by compose project name.** The platform names the project `omos-<id>` itself
   (`-p omos-<id>`) and finds your app's containers by the standard
   `com.docker.compose.project=omos-<id>` label that Docker adds automatically. **You do not
   need to add any special labels.** (`com.openmasjid.*` labels are platform-internal.)

5. **The app's "Open" URL** is derived at runtime from the **published host port** of your
   container. So your compose **must publish the web-UI port** (e.g. `ports: ["8080:80"]`).
   Pick a sensible default host port; if it clashes with something already running, the
   platform detects the conflict before install and lets the user pick a free port (it rewrites
   the host port for them). Don't hard-depend on a specific host port being free.

6. **Per-app data** lives under `/opt/openmasjid/apps/<id>/` on the host. Compose relative bind
   paths resolve next to the app there, but **prefer named volumes** for portability (see §5).

7. **No masjid profile is injected.** The platform holds **zero** masjid/prayer data. Anything
   masjid-specific (location, latitude/longitude, calculation method, Asr madhab, timezone for
   prayer math, masjid name) the app must collect through its **own `settings`** block and use
   internally. Never assume the platform will hand you these.

---

## 3. Repository structure

```
OpenMasjidAPPS/
├── CLAUDE.md                      # this file
├── README.md                     # human-facing
├── LICENSE                       # repo/tooling license (apps keep their own — see §10)
├── package.json                  # dev dep: yaml; "build" → build-catalog
├── catalog.json                  # GENERATED — the file the platform fetches (root, main)
├── apps/
│   └── <app-id>/                 # folder name MUST equal manifest id
│       ├── manifest.yaml         # human-authored metadata + settings
│       ├── docker-compose.yml    # the app's stack (becomes catalog `compose`)
│       ├── icon.svg              # or icon.png — square, simple
│       └── screenshots/
│           ├── 1.png
│           └── 2.png
├── scripts/
│   └── build-catalog.mjs         # aggregates apps/* → catalog.json
└── .github/workflows/
    └── build-catalog.yml         # regenerates + commits catalog.json on push
```

App source code (if an app is built here rather than using an existing public image) can live
under the app folder too, but the catalog only needs the manifest + compose + assets.

---

## 4. `manifest.yaml` — what you author per app

Humans/Claude write `manifest.yaml`; the build script (§6) merges it with the app's
`docker-compose.yml` into a `catalog.json` entry (embedding the compose text and rewriting icon
/ screenshot paths into absolute raw URLs).

```yaml
# apps/prayer-times-display/manifest.yaml
id: prayer-times-display          # MUST equal the folder name; kebab-case
name: Prayer Times Display
tagline: A beautiful prayer clock for your masjid's screens
category: displays                # displays | donations | community | quran | admin | utilities
version: 1.0.0
author: OpenMasjidAPPS
license: MIT                      # the app's own license (your choice)
icon: icon.svg                    # path within this app folder; build script → absolute URL
screenshots:                      # paths within this folder; build script → absolute URLs
  - screenshots/1.png
  - screenshots/2.png
description: |
  Full markdown description shown on the app's detail page. Explain what it does and how to
  use it after install.
# Everything the app needs is collected here — the platform injects no masjid data.
settings:
  - key: MASJID_NAME
    label: Masjid name
    type: text
    default: ""
  - key: LATITUDE
    label: Latitude
    type: text
  - key: LONGITUDE
    label: Longitude
    type: text
  - key: CALC_METHOD
    label: Prayer calculation method
    type: select
    options: [MWL, ISNA, Egypt, Makkah, Karachi, Tehran, Jafari]
    default: MWL
  - key: SCREEN_ORIENTATION
    label: Screen orientation
    type: select
    options: [landscape, portrait]
    default: landscape
ports:
  - container: 80
    label: Web interface
```

The build script copies these fields verbatim into the catalog entry, sets `compose` to the
contents of the app's `docker-compose.yml`, and rewrites `icon`/`screenshots` to absolute raw
URLs.

---

## 5. `docker-compose.yml` — rules for an app's stack

- **Reference settings as `${KEY}`** — they arrive via the platform's `--env-file`. Pass them
  into the container with an `environment:` block.
- **Publish the web-UI port** so the dashboard can offer "Open": `ports: ["8080:80"]`. Choose a
  non-privileged default host port (≥ 1024). Conflicts are handled by the platform.
- **Use named volumes** for persistence (cleanest + portable):
  ```yaml
  services:
    app:
      image: example/prayer-display:1.2.3
      restart: unless-stopped
      environment:
        MASJID_NAME: ${MASJID_NAME}
        LATITUDE: ${LATITUDE}
        LONGITUDE: ${LONGITUDE}
        CALC_METHOD: ${CALC_METHOD}
      ports:
        - "8080:80"
      volumes:
        - data:/data
  volumes:
    data:
  ```
- **Pin image tags** (`image: foo/bar:1.2.3`, never `:latest`) so installs are reproducible.
- **Least privilege.** Do **not** use `privileged: true`, `network_mode: host`, `pid: host`,
  `cap_add`, host device passthrough, or mount the Docker socket / sensitive host paths
  (`/etc`, `/root`, `/var`, `/`, …). The platform flags these as dangerous and will warn/block.
  If an app genuinely needs one, document why — but the answer is almost always "don't."
- **Don't add labels** for discovery — the platform handles project labels itself.
- **No reliance on a masjid profile** — collect everything via `settings`.
- Multi-service stacks are fine (e.g. app + db). All run under the one `omos-<id>` project.

---

## 6. `catalog.json` — generated, never hand-edited

`catalog.json` is **built** from `apps/*` by `scripts/build-catalog.mjs` and lives at the repo
root. The script:
1. reads each `apps/<id>/manifest.yaml`,
2. validates `id` (kebab regex), required fields, and category,
3. reads `apps/<id>/docker-compose.yml` into the entry's `compose` string,
4. rewrites `icon` / `screenshots` to absolute raw URLs
   (`https://raw.githubusercontent.com/hasan-ismail/OpenMasjidAPPS/main/apps/<id>/…`),
5. writes `{ "apps": [ … ] }` to `catalog.json`.

Run locally: `npm install && npm run build`. CI (`.github/workflows/build-catalog.yml`)
regenerates and commits `catalog.json` automatically when anything under `apps/` or `scripts/`
changes, so the published catalog is always in sync.

**Resulting catalog entry shape** (what the platform actually parses):

```json
{
  "apps": [
    {
      "id": "prayer-times-display",
      "name": "Prayer Times Display",
      "tagline": "A beautiful prayer clock for your masjid's screens",
      "category": "displays",
      "version": "1.0.0",
      "author": "OpenMasjidAPPS",
      "license": "MIT",
      "icon": "https://raw.githubusercontent.com/hasan-ismail/OpenMasjidAPPS/main/apps/prayer-times-display/icon.svg",
      "screenshots": ["https://raw.githubusercontent.com/hasan-ismail/OpenMasjidAPPS/main/apps/prayer-times-display/screenshots/1.png"],
      "description": "Full markdown…",
      "settings": [ { "key": "LATITUDE", "label": "Latitude", "type": "text" } ],
      "ports": [ { "container": 80, "label": "Web interface" } ],
      "compose": "services:\n  app:\n    image: example/prayer-display:1.2.3\n    ..."
    }
  ]
}
```

---

## 7. Settings field spec

Each item in `settings` (from `SettingField` in the platform):

```yaml
- key: LATITUDE            # the env var name; referenced as ${LATITUDE} in compose
  label: Latitude          # shown to the user in the install dialog
  type: text               # text | select | number | password | boolean
  options: [A, B, C]       # required only for type: select
  default: ""              # optional pre-filled value
```

- `text` / `number` / `password` render an input; `select` renders a dropdown (needs
  `options`); `boolean` a toggle.
- `key` should be a valid env-var name (UPPER_SNAKE_CASE recommended). It's what the user's
  answer is written as in the `.env` and what `${KEY}` resolves to in the compose.
- Collect **everything masjid-specific here** — the platform injects nothing.

---

## 8. Icons & screenshots

- **Icon:** a square `icon.svg` (preferred) or `icon.png` in the app folder, simple and legible
  at small sizes. The dashboard renders it via `<img>` from an **absolute URL**, so the build
  script rewrites `icon: icon.svg` → the raw GitHub URL. (A relative path would resolve against
  the *dashboard's* origin and 404 — always let the build script produce absolute URLs; never
  put a bare filename in `catalog.json` by hand.)
- **Screenshots:** PNGs under `apps/<id>/screenshots/`, referenced by path in the manifest;
  the build script makes them absolute too.
- Keep assets reasonably small. Don't embed sacred/Quranic text in decorative icon chrome.

---

## 9. Categories

Use exactly one of: `displays`, `donations`, `community`, `quran`, `admin`, `utilities`.
(The dashboard filters by these. An unknown category just won't filter cleanly.)

---

## 10. Security & licensing — read carefully

**Security**
- Apps run as **separate Docker containers** the platform manages at arm's length. Keep them
  self-contained and least-privilege (§5). The platform validates every compose and warns the
  user about dangerous settings — don't rely on a user clicking through warnings.
- Pin image versions; prefer trusted/official base images. Don't fetch-and-run arbitrary remote
  scripts at container start.

**Licensing (important)**
- OpenMasjidOS (the platform) is **AGPL-3.0**. Because apps run as **separate programs
  communicating at arm's length** (network, env vars), **app authors may license their app
  however they wish** — that's what the manifest `license` field is. AGPL does **not** reach
  into your app. Keep that boundary clean: an app never imports platform runtime code, and the
  platform never links app code.
- **Do NOT copy app manifests, compose files, icons, or assets from umbrelOS / `umbrel-apps`
  (PolyForm Noncommercial) or from CasaOS app stores** into this repo. Author everything fresh.
  You may take *inspiration* from how they structure things, but write original definitions.
- Decide a license for **this repo's tooling/scaffolding** (the build script, examples) — a
  permissive one (MIT) is reasonable; individual apps still carry their own `license`.

---

## 11. Quality bar for apps

- Apps are for **masjid volunteers**, not sysadmins. After install they should "just work" with
  the settings collected up front. Friendly, plain wording in the app's own UI.
- Display-type apps (prayer clocks, announcement boards) should look good full-screen on a TV.
- Respect the spirit of the platform's design: calm, dignified, modern. Don't put Quranic verses
  or sacred Arabic text into throwaway/decorative UI; if shown, it must be intentional, correct,
  and dignified.
- Make masjid-specific values **configurable** (via `settings`), never hard-coded.

---

## 12. Suggested first build order

1. **Repo scaffolding:** `package.json`, `scripts/build-catalog.mjs`, the CI workflow, an empty
   `apps/`, and a generated empty `catalog.json` — confirm `npm run build` works.
2. **One real app end-to-end:** `prayer-times-display` (manifest + compose + icon + a screenshot)
   → rebuild catalog → install it on a running OpenMasjidOS to verify the whole loop (settings
   prompt → install → Open works).
3. Then expand: an announcements/notice board, a donation page, an events calendar, Quran
   resources, etc. — one fully-working app at a time.

When picking an app's container image, prefer a maintained public image and drive it entirely
through `settings`-injected env. If no suitable image exists, you may build the app's source in
its folder and publish an image, then reference that pinned tag.

---

## 13. Definition of done (per app)

An app is "done" only when: its folder has a valid `manifest.yaml` (id == folder name, valid
kebab id, name + version present, valid category) and a `docker-compose.yml` that publishes its
web port, references its settings as `${KEY}`, uses named volumes, pins its image, and requests
no dangerous privileges; an icon (and ideally a screenshot) exist; `npm run build` regenerates
`catalog.json` with the new entry and the JSON is valid; and the app **installs and opens
cleanly on a real OpenMasjidOS instance** with only the settings collected at install time.

---

## 14. Working agreement for Claude (in this repo)

- Read this file first, every session. The **contract in §2** is a hard constraint — an app
  that doesn't fit it won't install.
- Never hand-edit `catalog.json`; change `apps/*` and run the build script.
- Keep `id` == folder name, kebab-case, matching `^[a-z0-9][a-z0-9-]{0,79}$`.
- Never assume the platform provides masjid data — collect it via `settings`.
- Never copy Umbrel/CasaOS app definitions or assets (see §10). Author fresh.
- Don't request privileged/host access in a compose unless truly unavoidable, and justify it.
- Pin image tags; prefer named volumes; publish the web port.
- If a task seems to require changing how the *platform* installs/serves apps, that belongs in
  the OpenMasjidOS repo (https://github.com/hasan-ismail/OpenMasjidOS) — stop and flag it.
```

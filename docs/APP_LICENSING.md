<!-- SPDX-License-Identifier: AGPL-3.0-only -->
<!-- Copyright (C) 2026 OpenMasjid-Solutions -->

# Licensing policy for OpenMasjid apps

This document is the licensing policy for **apps built for OpenMasjidOS**. Read it before
scaffolding a new app repo — especially if you are an **agent or team member building an official
OpenMasjid app**.

There are two audiences, and they are treated differently:

| Who is building the app | License | CLA |
|---|---|---|
| **OpenMasjid-Solutions** — official apps, incl. anything built by the team or its coding agents | **AGPL-3.0-only (required)** | **Required** (the OpenMasjid CLA) |
| **Third-party / community** authors listing an app in `registry.yaml` | **Their own choice** | Not required |

## Why the split

Apps run as **separate Docker containers at arm's length** from the platform (network, env vars,
the Fabric) — so an app is a separate program, and its license does not have to match the
platform's. That is why third-party authors keep their own license, and why merely **listing** an
app in `registry.yaml` never relicenses it.

**But the apps WE build are ours**, so we license them the same way as the rest of the suite:
**AGPL-3.0 + the OpenMasjid Contributor License Agreement (CLA)**. This keeps every official app's
public source AGPL-3.0 while letting OpenMasjid-Solutions also offer commercial/dual licenses — the
same model as OpenMasjidOS, OpenMasjidDisplay, OpenMasjidDonations, and this catalog repo.

## Checklist — a new **official** OpenMasjid app repo

Use **OpenMasjidDisplay** as the reference (copy its shape *and* its licensing files):

1. **`LICENSE`** — the full **AGPL-3.0** text (copy from any OpenMasjid repo).
2. **`CLA.md`** — copy `OpenMasjidDisplay/CLA.md` verbatim; change only the title line and the intro
   sentence to your app's name (e.g. "OpenMasjid Events"). The grant still runs to
   **OpenMasjid-Solutions**; the public tree stays AGPL-3.0.
3. **`.github/workflows/cla.yml`** — copy `OpenMasjidDisplay/.github/workflows/cla.yml` and set:
   - `path-to-document:` → `https://github.com/OpenMasjid-Solutions/<your-repo>/blob/<default-branch>/CLA.md`
   - `branch:` → your repo's default branch (usually `main`)
   - keep `allowlist: hasan-ismail,dependabot[bot],github-actions[bot]`.
4. **Repo setup (admin):** add a `PERSONAL_ACCESS_TOKEN` Actions secret (a token with
   `contents: write` + `pull-requests: write`). Org-wide Actions workflow permissions are already
   set to read/write, so the bot can store signatures under `signatures/version1/cla.json`.
5. **SPDX header on every source file**, in the right comment syntax, plus the copyright line:
   - `.ts/.tsx/.js/.cjs/.mjs/.css`: `// SPDX-License-Identifier: AGPL-3.0-only`
   - `.yml/.yaml/.sh/Dockerfile`: `# SPDX-License-Identifier: AGPL-3.0-only`
   - `.md/.html`: `<!-- SPDX-License-Identifier: AGPL-3.0-only -->`
   - then `Copyright (C) 2026 OpenMasjid-Solutions`
6. **`package.json`** (every one in the repo): `"license": "AGPL-3.0-only"`.
7. **`manifest.yaml`**: `license: AGPL-3.0-only`.
8. **`CONTRIBUTING.md`** — reference `CLA.md` as the canonical agreement, document DCO sign-off
   (`git commit -s`) and the one-sentence signing step.
9. **`README.md`** — a License + Contributing note (AGPL-3.0, CLA link, dual-licensing, signed on
   first PR).
10. **`CLAUDE.md`** (if the repo has one) — include the "Licensing & headers — non-negotiable"
    hard rule so future agents keep every file AGPL + CLA-covered.

## For third-party / community apps

You do **not** have to be AGPL and you do **not** sign our CLA. Set the `license:` field in your
`manifest.yaml` to whatever license your app actually uses, keep your code in your own repo, and
list it via a `registry.yaml` entry (see [`BUILDING_AN_APP.md`](BUILDING_AN_APP.md)). The catalog's
AGPL/CLA do not reach across the container boundary into your app.

/**
 * Builds catalog.json from apps/*.
 *
 * For each apps/<id>/ folder it reads manifest.yaml, validates it, embeds the
 * app's docker-compose.yml as the `compose` string, rewrites icon/screenshots
 * to absolute raw URLs, and writes { apps: [...] } to catalog.json at the repo
 * root — the exact file OpenMasjidOS fetches. See CLAUDE.md.
 *
 * Run: npm install && node scripts/build-catalog.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

// Update these if the repo is renamed/forked, or the catalog moves off `main`.
const REPO = 'hasan-ismail/OpenMasjidAPPS';
const BRANCH = 'main';

const APP_ID_RE = /^[a-z0-9][a-z0-9-]{0,79}$/; // must match OpenMasjidOS's isValidAppId
const CATEGORIES = new Set(['displays', 'donations', 'community', 'quran', 'admin', 'utilities']);
const APPS_DIR = 'apps';

const raw = (p) => `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${p.replace(/\\/g, '/')}`;

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

const apps = [];

if (existsSync(APPS_DIR)) {
  for (const id of readdirSync(APPS_DIR).sort()) {
    const dir = join(APPS_DIR, id);
    if (!statSync(dir).isDirectory()) continue;

    const manifestPath = join(dir, 'manifest.yaml');
    const composePath = join(dir, 'docker-compose.yml');
    if (!existsSync(manifestPath)) fail(`${id}: missing manifest.yaml`);
    if (!existsSync(composePath)) fail(`${id}: missing docker-compose.yml`);

    let m;
    try {
      m = parse(readFileSync(manifestPath, 'utf8')) ?? {};
    } catch (e) {
      fail(`${id}: manifest.yaml is not valid YAML — ${e.message}`);
    }

    if (m.id !== id) fail(`${id}: manifest id "${m.id}" must equal the folder name "${id}"`);
    if (!APP_ID_RE.test(id)) fail(`${id}: invalid id — use kebab-case (a-z, 0-9, -), max 80 chars`);
    if (!m.name) fail(`${id}: "name" is required`);
    if (!m.version) fail(`${id}: "version" is required`);
    if (m.category && !CATEGORIES.has(m.category)) {
      fail(`${id}: unknown category "${m.category}" (use: ${[...CATEGORIES].join(', ')})`);
    }

    apps.push({
      id,
      name: m.name,
      tagline: m.tagline,
      category: m.category,
      version: String(m.version),
      author: m.author,
      license: m.license,
      icon: m.icon ? raw(join(dir, m.icon)) : undefined,
      screenshots: Array.isArray(m.screenshots) ? m.screenshots.map((s) => raw(join(dir, s))) : undefined,
      description: m.description,
      settings: m.settings,
      ports: m.ports,
      compose: readFileSync(composePath, 'utf8'),
    });
  }
}

apps.sort((a, b) => a.name.localeCompare(b.name));
// Drop undefined keys for a tidy catalog.
const clean = apps.map((a) => JSON.parse(JSON.stringify(a)));
writeFileSync('catalog.json', JSON.stringify({ apps: clean }, null, 2) + '\n');
console.log(`✓ Built catalog.json with ${clean.length} app(s).`);

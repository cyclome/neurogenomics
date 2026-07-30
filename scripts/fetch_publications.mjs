#!/usr/bin/env node
/* ==========================================================================
   Build data/publications.js from the group's ORCID records.

     data/team.js  ──orcid iDs──▶  pub.orcid.org  ──DOIs──▶  api.crossref.org
                                                                    │
                                              full metadata ◀───────┘
                                                     │
                                            data/publications.js

   ORCID knows which papers belong to whom but its work summaries carry no
   author lists, so Crossref supplies the display metadata. The result is
   committed to the repo: visitors then load one small file instead of waiting
   on two external APIs, and the page keeps working when those APIs do not.

   Usage:  node scripts/fetch_publications.mjs
   Requires Node 20+ (built-in fetch). No dependencies.

   On any hard failure this exits non-zero WITHOUT touching the existing
   data/publications.js — a visibly failed job beats a silently emptied list.
   ========================================================================== */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEAM_FILE = join(ROOT, 'data', 'team.js');
const OUT_FILE = join(ROOT, 'data', 'publications.js');

const CONTACT = 'thomas.folkmann.hansen@regionh.dk';
const UA = `neurogenomic.dk publication list (+https://neurogenomic.dk; mailto:${CONTACT})`;

// Crossref work types we treat as publications.
const KEEP_TYPES = new Set(['journal-article', 'posted-content', 'proceedings-article', 'book-chapter']);

const AUTHORS_SHOWN = 10;      // before "+N more" (group members are never cut)
const CONCURRENCY = 5;

/* ── small utilities ─────────────────────────────────────────────────────── */

const log = (...a) => console.log(...a);

async function getJSON(url, { tries = 3 } = {}) {
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
    } catch (err) {
      if (attempt >= tries) throw new Error(`${url} — network error: ${err.message}`);
      await sleep(attempt * 1500);
      continue;
    }
    if (res.status === 404) return null;                     // unknown DOI: skip it
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status >= 500) && attempt < tries) {
      await sleep(attempt * 2000);
      continue;
    }
    throw new Error(`${url} — HTTP ${res.status}`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Run N tasks with a fixed number of workers, preserving input order.
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    })
  );
  return out;
}

/* ── team.js → ORCID iDs ─────────────────────────────────────────────────── */

async function readTeam() {
  const code = await readFile(TEAM_FILE, 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox, { filename: 'team.js' });
  const team = sandbox.window.NG_TEAM;
  if (!Array.isArray(team)) throw new Error('data/team.js did not set window.NG_TEAM to an array');
  return team;
}

const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

/* ── ORCID: works → DOIs ─────────────────────────────────────────────────── */

async function orcidDOIs(orcid) {
  const data = await getJSON(`https://pub.orcid.org/v3.0/${orcid}/works`);
  if (!data) throw new Error(`ORCID ${orcid} not found`);
  const dois = [];
  let withoutDoi = 0;

  for (const group of data.group || []) {
    const ids = group['external-ids']?.['external-id'] || [];
    const doi = ids.find((x) => String(x['external-id-type']).toLowerCase() === 'doi');
    if (doi?.['external-id-value']) dois.push(normaliseDOI(doi['external-id-value']));
    else withoutDoi++;
  }
  return { dois, withoutDoi };
}

function normaliseDOI(raw) {
  return String(raw)
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:/i, '')
    .toLowerCase();
}

/* ── Crossref: DOI → display metadata ────────────────────────────────────── */

async function crossref(doi) {
  const data = await getJSON(`https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=${CONTACT}`);
  const m = data?.message;
  if (!m) return null;
  if (!KEEP_TYPES.has(m.type)) return null;

  const title = clean(Array.isArray(m.title) ? m.title[0] : m.title);
  if (!title) return null;

  return {
    doi,
    title,
    authors: (m.author || []).map(authorName).filter(Boolean),
    journal: clean(pickJournal(m)),
    year: issuedYear(m),
    preprint: m.type === 'posted-content'
    // No url field: it is always https://doi.org/<doi>, and the page builds it.
  };
}

function authorName(a) {
  if (a.name) return clean(a.name);
  return clean([a.given, a.family].filter(Boolean).join(' '));
}

function pickJournal(m) {
  // Preprints put the server name in institution or group-title, not container-title.
  const container = Array.isArray(m['container-title']) ? m['container-title'][0] : m['container-title'];
  if (container) return container;
  if (m.institution?.[0]?.name) return m.institution[0].name;
  return m['group-title'] || '';
}

function issuedYear(m) {
  const parts =
    m.issued?.['date-parts']?.[0] ||
    m['published-print']?.['date-parts']?.[0] ||
    m['published-online']?.['date-parts']?.[0] ||
    m.created?.['date-parts']?.[0];
  const y = parts?.[0];
  return Number.isInteger(y) ? y : null;
}

// Crossref titles arrive with stray whitespace and the odd bit of JATS markup.
function clean(s) {
  return String(s ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ── author list condensation ────────────────────────────────────────────── */

function nameKey(name) {
  const parts = String(name).toLowerCase().replace(/[.,]/g, '').split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return `${parts[parts.length - 1]}|${parts[0][0]}`;
}

function condenseAuthors(authors, memberKeys) {
  if (authors.length <= AUTHORS_SHOWN + 2) return authors;
  const head = authors.slice(0, AUTHORS_SHOWN);
  // Never truncate away one of our own — pull later members up next to the ellipsis.
  const laterMembers = authors.slice(AUTHORS_SHOWN).filter((a) => memberKeys.has(nameKey(a)));
  const hidden = authors.length - AUTHORS_SHOWN - laterMembers.length;
  return [...head, `… (+${hidden} more)`, ...laterMembers];
}

/* ── main ────────────────────────────────────────────────────────────────── */

async function main() {
  const team = await readTeam();
  const members = team.filter((p) => p.orcid);

  for (const p of members) {
    if (!ORCID_RE.test(p.orcid)) {
      throw new Error(`${p.name}: "${p.orcid}" is not a valid ORCID iD (expected 0000-0000-0000-0000)`);
    }
  }

  if (!members.length) {
    log('No ORCID iDs in data/team.js yet — writing an empty list.');
    log('Add an "orcid" field to a member in data/team.js and re-run.');
    await write({ generated: null, count: 0, items: [] });
    return;
  }

  log(`Collecting works for ${members.length} member(s) with an ORCID iD…`);
  const seen = new Map();                       // doi → orcids that claim it
  let noDoiTotal = 0;

  for (const p of members) {
    const { dois, withoutDoi } = await orcidDOIs(p.orcid);
    noDoiTotal += withoutDoi;
    const fresh = dois.filter((d) => !seen.has(d)).length;
    dois.forEach((d) => seen.set(d, [...(seen.get(d) || []), p.orcid]));
    log(`  ${p.name.padEnd(28)} ${dois.length} DOI(s), ${fresh} new` +
        (withoutDoi ? `, ${withoutDoi} work(s) without a DOI skipped` : ''));
  }

  const dois = [...seen.keys()];
  if (!dois.length) throw new Error('ORCID returned no DOIs at all — refusing to overwrite the list');

  log(`Fetching metadata for ${dois.length} unique DOI(s) from Crossref…`);
  const fetched = await mapLimit(dois, CONCURRENCY, (doi) => crossref(doi));

  const dropped = fetched.filter((x) => !x).length;
  const memberKeys = new Set(team.map((p) => nameKey(p.name)));

  const items = fetched
    .filter(Boolean)
    .map((p) => ({ ...p, authors: condenseAuthors(p.authors, memberKeys) }))
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title));

  log(`Kept ${items.length}; ${dropped} not in Crossref or not a publication type` +
      (noDoiTotal ? `; ${noDoiTotal} ORCID work(s) had no DOI` : '') + '.');

  await write({ generated: new Date().toISOString(), count: items.length, items });
}

// Read back what is already on disk, so an unchanged list can be left alone.
async function existingItems() {
  try {
    const code = await readFile(OUT_FILE, 'utf8');
    const sandbox = { window: {} };
    vm.runInNewContext(code, sandbox, { filename: 'publications.js' });
    return sandbox.window.NG_PUBLICATIONS?.items ?? null;
  } catch {
    return null;                          // missing or unparseable: just rewrite it
  }
}

async function write(payload) {
  // `generated` is a fresh timestamp on every run, so writing unconditionally
  // would produce a commit and a Pages rebuild every week even when nothing
  // changed. Compare the publications themselves instead — which also makes
  // "Last updated" on the page mean "when the list last changed", not "when the
  // robot last ran".
  const before = await existingItems();
  if (before && JSON.stringify(before) === JSON.stringify(payload.items)) {
    log(`No change — data/publications.js left as it is (${payload.count} publication(s)).`);
    return;
  }

  const banner =
    '/* GENERATED FILE — do not edit by hand.\n' +
    '   Rebuilt by scripts/fetch_publications.mjs from the ORCID iDs in data/team.js,\n' +
    '   and weekly by .github/workflows/publications.yml. */\n';
  await writeFile(OUT_FILE, `${banner}window.NG_PUBLICATIONS = ${JSON.stringify(payload, null, 2)};\n`, 'utf8');
  log(`Wrote data/publications.js (${payload.count} publication(s)).`);
}

main().catch((err) => {
  console.error(`\nfetch_publications failed: ${err.message}`);
  console.error('data/publications.js was left unchanged.');
  process.exit(1);
});

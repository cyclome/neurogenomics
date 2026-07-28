#!/usr/bin/env node
/* ==========================================================================
   logo.svg → an inline <symbol> in index.html, plus favicon.svg.

   Why inline: the logo is black artwork on transparent, so as an <img> it
   disappears on a dark background. Inlined, the black strokes and fills become
   currentColor and the cyan becomes var(--accent), so both themes are handled
   by the stylesheet and no extra request is made for it.

   Run this once, and again whenever logo.svg changes:
       node scripts/inline_logo.mjs

   Idempotent — re-running replaces the previously injected block.
   ========================================================================== */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'logo.svg');
const HTML = join(ROOT, 'index.html');
const FAVICON = join(ROOT, 'favicon.svg');

const START = '<!--LOGO:START-->';
const END = '<!--LOGO:END-->';

// The helix sits between the two words; this window shows it and nothing else.
const FAVICON_VIEWBOX = '211 -5 78 158';

const svg = await readFile(SRC, 'utf8');

const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
if (!viewBox) throw new Error('logo.svg has no viewBox');

const inner = svg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>\s*$/)?.[1];
if (!inner) throw new Error('could not find the root <svg> element in logo.svg');

/* Recolour so the stylesheet owns the palette. Ids are prefixed because the
   symbol lives in the same document as everything else. */
function themed(body) {
  return body
    // Affinity/Serif writes serif:id="…" attributes. The xmlns:serif that
    // declares them lives on the root <svg>, which we drop — and favicon.svg is
    // parsed as XML, where an undeclared prefix is fatal rather than ignored.
    .replace(/\s+serif:[\w-]+="[^"]*"/g, '')
    .replace(/stroke:#000\b/g, 'stroke:currentColor')
    .replace(/fill:#000\b/g, 'fill:currentColor')
    .replace(/fill:#fff\b/g, 'fill:var(--logo-bg, #fff)')
    .replace(/#00a2f0/g, 'var(--accent, #00a2f0)')
    .replace(/id="_clip/g, 'id="ngclip')
    .replace(/url\(#_clip/g, 'url(#ngclip');
}

/* ── index.html ──────────────────────────────────────────────────────────── */

// fill="currentColor" on the symbol: most glyph paths declare only fill-rule
// and rely on the default black fill, so they need a colour handed down.
const symbol =
  `${START}<symbol id="ng-logo" viewBox="${viewBox}" fill="currentColor">` +
  themed(inner).trim() +
  `</symbol>${END}`;

let html = await readFile(HTML, 'utf8');
const placeholder = /<!-- LOGO_SYMBOL -->/;
const existing = new RegExp(`${START}[\\s\\S]*?${END}`);

if (existing.test(html)) html = html.replace(existing, symbol);
else if (placeholder.test(html)) html = html.replace(placeholder, symbol);
else throw new Error(`index.html has neither ${START}…${END} nor the <!-- LOGO_SYMBOL --> placeholder`);

await writeFile(HTML, html, 'utf8');
console.log(`index.html — injected <symbol id="ng-logo"> (${symbol.length} bytes)`);

/* ── favicon.svg ─────────────────────────────────────────────────────────── */

// currentColor again, but here the media query has to live inside the file:
// a favicon is rendered outside the page and inherits nothing from it.
const favicon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${FAVICON_VIEWBOX}" fill="currentColor">\n` +
  `<style>\n` +
  `  svg { color: #10161c }\n` +
  `  @media (prefers-color-scheme: dark) { svg { color: #e8eef5 } }\n` +
  `</style>\n` +
  themed(inner)
    .replace(/var\(--logo-bg, #fff\)/g, '#fff')
    .replace(/var\(--accent, (#00a2f0)\)/g, '$1')
    .trim() +
  `\n</svg>\n`;

await writeFile(FAVICON, favicon, 'utf8');
console.log(`favicon.svg — helix crop, viewBox="${FAVICON_VIEWBOX}"`);

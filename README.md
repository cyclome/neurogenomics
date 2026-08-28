# neurogenomic.dk

Website for the **Neurogenomics** research group. Static site — plain HTML, CSS and
JavaScript, no build step, no dependencies, no third-party requests. Hosted on GitHub
Pages.

Live: **https://neurogenomic.dk**

Open `index.html` straight from disk to preview it — data is loaded as plain script
files rather than with `fetch()`, so `file://` works and no local server is needed.

## Layout

```
index.html          all prose (hero, research, contact) + section skeletons
styles.css          every colour lives in the two token blocks at the top
app.js              scroll reveal, scroll-spy, renders the data files
logo.svg            source artwork; also inlined into index.html (see below)
favicon.svg         generated — a crop of the logo's helix
CNAME               neurogenomic.dk
data/
  team.js           current members  ← drives the publication list
  alumni.js         former members
  masters.js        previous master's/MD thesis students (names only)
  collaborators.js  external consortia and individual collaborators
  projects.js       current projects
  funders.js        funders and collaborators
  publications.js   GENERATED — do not edit by hand
assets/
  team/             square portraits
  funders/          funder logos
scripts/
  fetch_publications.mjs   ORCID + Crossref → data/publications.js
  inline_logo.mjs          logo.svg → <symbol> in index.html, + favicon.svg
```

## Everyday edits

**Add or change a person** — edit [`data/team.js`](data/team.js). Each entry takes
`name`, `role`, `bio`, `orcid`, `email`, `photo`. Drop a square portrait in
`assets/team/` and point `photo` at it; without a photo the card shows the person's
initials, which looks deliberate rather than broken.

**Someone leaves** — move their entry from `team.js` to
[`data/alumni.js`](data/alumni.js). Their papers then stop appearing in the
publication list. If their work should stay on the list, leave them in `team.js`.

**Add a funder** — edit [`data/funders.js`](data/funders.js). Logos render greyscale
and lift to full colour on hover, so loud and quiet marks sit together calmly. While
the list is empty the whole section is hidden.

**Change the prose** — it is all in `index.html`, in reading order.

**Change the colours** — the `:root` block in `styles.css`, plus the
`prefers-color-scheme: dark` block below it. The accent is the logo's cyan
(`#00a2f0`); `--accent-ink` is a darkened variant used for text and links, because
the logo cyan alone does not reach 4.5:1 contrast on white.

**Change the logo** — replace `logo.svg`, then run:

```bash
node scripts/inline_logo.mjs
```

This re-injects the logo as an inline `<symbol>` in `index.html` and regenerates
`favicon.svg`. It is inlined rather than used as an `<img>` because the artwork is
black on transparent and would vanish on a dark background — inlined, the black
becomes `currentColor` and the cyan becomes `var(--accent)`, so the stylesheet owns
both themes.

## Publications

`data/publications.js` is generated from the ORCID iDs in `data/team.js`:

```
data/team.js ──orcid iDs──▶ pub.orcid.org ──DOIs──▶ api.crossref.org ──▶ data/publications.js
```

ORCID knows which papers belong to whom, but its work summaries carry no author
lists, so Crossref supplies the display metadata. The result is committed to the repo,
so visitors load one file instead of waiting on two external APIs — and the page keeps
working when those APIs do not.

Rebuild it by hand (needs Node 20+):

```bash
node scripts/fetch_publications.mjs
```

Or let [`.github/workflows/publications.yml`](.github/workflows/publications.yml) do
it: every Monday, on any push that touches `data/team.js`, and on demand via **Run
workflow** in the Actions tab. It commits the file only if something changed.

Two things worth knowing:

- **Only works that are public on ORCID show up.** New members should set their works
  to public visibility, or their papers will be silently missing.
- **The list is everything on those ORCID records**, including work from before people
  joined the group. That is the trade-off for a list that maintains itself.
- **"Last updated" on the page means "when the list last changed"**, not "when the job
  last ran". A run that finds nothing new leaves the file completely alone, so an
  unchanged week produces no commit and no rebuild.

If the run fails it exits non-zero and leaves `data/publications.js` untouched — a
visibly failed job beats a silently emptied list.

## Deploying

Pushing to `main` deploys. Pages is configured to serve from `main` at the repository
root; `.nojekyll` stops GitHub from running Jekyll over the files.

### DNS (one-time)

At one.com, for `neurogenomic.dk`:

| Type    | Name | Value |
| ------- | ---- | ----- |
| `A`     | `@`  | `185.199.108.153` |
| `A`     | `@`  | `185.199.109.153` |
| `A`     | `@`  | `185.199.110.153` |
| `A`     | `@`  | `185.199.111.153` |
| `CNAME` | `www`| `cyclome.github.io` |

Optionally add `AAAA` records for `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`,
`2606:50c0:8002::153`, `2606:50c0:8003::153`.

**HTTPS cannot be enabled before this is done.** GitHub gets its certificate from
Let's Encrypt, which validates by requesting the domain over HTTP — with no `A`
record there is nothing to validate against, so the certificate is simply never
issued. Once the records resolve, GitHub issues one within minutes and **Enforce
HTTPS** in Settings → Pages becomes tickable.

### The other three domains

`neurogenomics.dk`, `neurogenomics.group` and `neurogenomic.group` each redirect here
from their own tiny GitHub Pages repo — see `../neurogenomics-redirects/`. GitHub Pages
serves one domain per `CNAME` file, so a separate repo per domain is the only way to do
it on Pages. one.com charges for web forwarding; this costs nothing, and plain DNS
records are included with the domains.

## Still to do

- [ ] Confirm the ORCID iDs in `data/team.js` are the right people
- [ ] Real bios for Thomas Folkmann Hansen and Lisette J. A. Kogelman (marked `[…]`)
- [ ] Portraits in `assets/team/`
- [ ] `og-image.png` — 1200×630, for link previews in Slack, LinkedIn and the like.
      Export it from the logo artwork, then uncomment the `og:image` and
      `twitter:card` tags in the `<head>` of `index.html`. Until then previews
      show title and description only.

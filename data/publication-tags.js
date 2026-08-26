/* ==========================================================================
   Manual topic-tag overrides for the "Recent work" filter.

   data/publications.js is GENERATED — it gets fully rewritten from ORCID/
   Crossref every week, so any tag written directly onto an item there would
   be wiped on the next run. This file is untouched by that script, so it is
   the place to add or correct tags. Keyed by DOI (lowercase, no "https://
   doi.org/" prefix — copy it exactly as it appears in publications.js).

   Most publications are already auto-tagged by keyword match on the title
   (see AUTO_TAG_RULES in app.js) for: gwas, migraine, headache, multiomics,
   and dbds-chb (titles mentioning "Danish Blood Donor Study"). Tags listed
   here are ADDED on top of those — they don't replace them.

   Valid tag keys (must match a data-filter value in index.html):
     gwas | migraine | dbds-chb | pgc | headache | multiomics | cyclome

   "dbds-chb", "pgc" and "cyclome" can rarely be told from a title alone —
   they usually need to be added here by hand.
   ========================================================================== */

window.NG_PUBLICATION_TAGS = {
  // '10.1000/example-doi': ['cyclome', 'pgc'],
};

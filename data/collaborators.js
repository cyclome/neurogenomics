/* ==========================================================================
   External collaborators — people and groups outside the Neurogenomics group.
   Team members belong in data/team.js instead; this file is for everyone else.

   Consortia
     name   (required)  Consortium name.
     role               The group's role in it, e.g. "Founding member".
     url                Optional link to the consortium's site.
     blurb              One sentence on what it is or does.

   Individuals
     name   (required)
     affiliation        Institution, shown after the name.
     url                Optional — turns the name into a link (lab page, ORCID, etc).

   While a list is empty, that half of the Collaborators section stays hidden;
   if both are empty the whole section is hidden.
   ========================================================================== */

window.NG_CONSORTIA = [
  { name: 'Danish Blood Donor Study', role: 'Steering group', url: 'https://bloddonor.dk/dbds-organisation/' },
  { name: 'Copenhagen Hospital Biobank', role: 'Working group, protocol co-PI' },
  { name: 'International Headache Genetics Consortium (IHGC)', role: 'Co-chair', url: 'https://www.headachegenetics.org/' },
  { name: 'International Consortium for Cluster Headache Genetics (CCG)', role: 'Danish PI', url: 'https://www.clusterheadachegenetics.org/' },
  { name: 'Chronic Pain Genomics Consortium', role: 'Danish PI', url: 'https://paingenomics.org/' }
];

window.NG_COLLABORATORS = [
  { name: 'Henriette Svarre Nielsen', affiliation: 'Professor, Hvidovre Hospital', url: 'https://orcid.org/0000-0003-2106-8103' },
  { name: 'Mette Nyegaard', affiliation: 'Professor, Statens Serum Institut', url: 'https://orcid.org/0000-0003-4973-8543' },
  { name: 'Dagmar Beier', affiliation: 'Professor, Odense University Hospital', url: 'https://orcid.org/0000-0002-3336-157X' },
  { name: 'Anders Juul', affiliation: 'Professor, Copenhagen University Hospital', url: 'https://orcid.org/0000-0002-0534-4350' },
  { name: 'Nicolai J. Wewer Albrechtsen', affiliation: 'Professor, Bispebjerg Hospital', url: 'https://orcid.org/0000-0003-4230-5753' },
  { name: 'Annelaura Bach Nielsen', affiliation: 'Associate Professor, Bispebjerg Hospital', url: 'https://scholar.google.com/citations?hl=en&user=sK4xp5oAAAAJ' },
  { name: 'Dale Nyholt', affiliation: 'Professor, Queensland University of Technology', url: 'https://orcid.org/0000-0001-7159-3040' }
];

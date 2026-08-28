/* ==========================================================================
   Current group members. Edit this file to add, remove or reorder people.

   Fields
     name   (required)  Full name as it should be displayed.
     role               Title / position.
     bio                One or two sentences.
     orcid              ORCID iD, digits only, e.g. "0000-0002-1825-0097".
                        Drives BOTH the ORCID link on the card and the
                        publication list — see scripts/fetch_publications.mjs.
     email              Shown as a mailto link. Omit if the person prefers not.
     photo              Path to a square portrait, e.g. "assets/team/name.jpg".
                        Leave out and the card shows initials instead.
     links              Extra links: [{ label: "Google Scholar", url: "…" }]

   Names below were taken from each person's own ORCID record. Only works that
   are PUBLIC on ORCID can appear in the publication list, so ask new members to
   set their works to public visibility.

   Former members live in data/alumni.js and do NOT feed the publication list.
   ========================================================================== */

window.NG_TEAM = [
  {
    name: 'Thomas Folkmann Hansen',
    role: 'Group leader',
    bio: '[One or two sentences: background, what you work on, what you are known for.]',
    orcid: '0000-0001-6703-7762',
    email: 'thomas.folkmann.hansen@regionh.dk',
    photo: null
  },
  {
    name: 'Lisette J. A. Kogelman',
    role: 'Senior bioinformatician',
    bio: '[Short description — e.g. multi-omics integration and the analysis pipelines behind the group\'s genetic studies.]',
    orcid: '0000-0001-9782-7810',
    photo: null
  },
  {
    name: 'Isa Amalie Olofsson',
    role: 'MD, PhD',
    bio: 'Project lead for the Migraine Twins Study and the Child and Adolescent Headache Biobank.',
    orcid: '0000-0002-7500-8045',
    photo: null
  },
  {
    name: 'Mona Ameri Chalmer',
    role: 'MD, PhD',
    bio: 'Currently on leave for clinical residency training in neurology.',
    orcid: '0000-0003-4609-1895',
    photo: null
  },
  {
    name: 'Marie Louise Lund Bjergstrøm',
    role: 'MD, PhD student',
    bio: 'Studies ADHD symptoms within the Cyclome project.',
    orcid: '0009-0009-1929-7768',
    photo: null
  },
  {
    name: 'Anna Lando Talbot',
    role: 'MD, PhD student',
    bio: 'Builds the Menstrual Multiomics Atlas within the Cyclome project.',
    orcid: '0000-0003-3755-7745',
    photo: null
  },
  {
    name: 'Tanya Ramdal Techlo',
    role: 'PhD student',
    orcid: '0000-0002-0869-3652',
    photo: null
  }
];

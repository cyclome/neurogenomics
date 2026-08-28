/* ==========================================================================
   Former group members, shown as a compact list under the team.

     name   (required)
     role               What they were in the group, e.g. "PhD" or "Postdoc".
     orcid              Optional — turns the name into a link to their ORCID.
     now                Optional — where they are now, shown after the role.

   Deliberately NOT read by scripts/fetch_publications.mjs: the publication
   list reflects the current group. Move someone here and their papers stop
   being pulled in, which is usually what you want — but not always, so if a
   former member's work should stay on the list, keep them in team.js instead.

   While this list is empty the "Previously in the group" heading stays hidden.
   ========================================================================== */

window.NG_ALUMNI = [
  { name: 'Ólafur B. Davíðsson',      role: 'PhD',      orcid: '0000-0002-7226-5409' },
  { name: 'Ragnar Pétur Kristjansson', role: 'PhD',      orcid: '0000-0002-3678-5693' },
  { name: 'Ann-Louise Esserlind',     role: 'PhD',      orcid: '0000-0001-9561-3595' },
  { name: 'Andreas Høiberg Rasmussen', role: 'Postdoc', orcid: '0000-0002-0504-2598' },
  { name: 'Jes Olesen',               role: 'Brain Prize Winner, Professor Emeratus', orcid: '0000-0002-6712-2702' }
];

/* ==========================================================================
   Funders and collaborators.

     name   (required)  Used as the link label and image alt text.
     logo               Path to a logo, e.g. "assets/funders/lundbeck.svg".
                        SVG preferred. Without a logo the name is shown as text.
     url                Optional link.
     grant              Optional — scheme and grant number, shown as a small
                        caption under the name/logo, e.g. "Ascending Investigator,
                        grant R507-2025-275".

   Logos render greyscale and lift to full colour on hover, so they sit
   together calmly regardless of how loud the individual marks are.

   While this list is empty the whole section stays hidden on the page.
   ========================================================================== */

window.NG_FUNDERS = [
  { name: 'Independent Research Fund Denmark', url: 'https://dff.dk',
    grant: 'Projects 2 – Health Research, grant 3101-00328B' },
  { name: 'Novo Nordisk Foundation', url: 'https://novonordiskfonden.dk/en/',
    grant: 'Non-diabetes Endocrinology Collaborative Projects, grant NNF25OC0104982' },
  { name: 'Lundbeck Foundation', url: 'https://lundbeckfonden.com',
    grant: 'Ascending Investigator, grant R507-2025-275' }
];

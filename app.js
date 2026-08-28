/* ==========================================================================
   Neurogenomics — neurogenomic.dk
   No dependencies, no build step. Data comes from the data/*.js files loaded
   just before this one (window.NG_TEAM / NG_FUNDERS / NG_PUBLICATIONS).
   Plain globals rather than fetch(), so the site also works when opened
   straight from disk with file://.
   ========================================================================== */
(function () {
  'use strict';

  var PUBS_COLLAPSED = 8;   // publications shown before "show all"
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── helpers ───────────────────────────────────────────────────────────── */

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function initials(name) {
    var parts = String(name).trim().split(/\s+/);
    var first = parts[0] || '';
    var last = parts.length > 1 ? parts[parts.length - 1] : '';
    return (first.charAt(0) + last.charAt(0)).toUpperCase();
  }

  /* ── scroll reveal ─────────────────────────────────────────────────────── */

  function initReveal() {
    var targets = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (n) { n.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        io.unobserve(e.target);         // reveal once, then stop watching
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    targets.forEach(function (n) { io.observe(n); });
    return io;
  }

  // Elements rendered from data after initReveal() ran need registering too.
  var revealObserver = null;
  function watchReveal(root) {
    var targets = (root || document).querySelectorAll('.reveal:not(.is-visible)');
    if (!revealObserver) {
      targets.forEach(function (n) { n.classList.add('is-visible'); });
      return;
    }
    targets.forEach(function (n) { revealObserver.observe(n); });
  }

  /* ── topbar: shadow + scroll-spy ───────────────────────────────────────── */

  function initTopbar() {
    var bar = document.querySelector('.topbar');
    var hero = document.querySelector('.hero');
    var links = Array.prototype.slice.call(document.querySelectorAll('.topbar-nav a'));

    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        bar.classList.toggle('is-stuck', !entries[0].isIntersecting);
      }, { rootMargin: '-60px 0px 0px 0px' }).observe(hero);
    } else {
      bar.classList.add('is-stuck');
    }

    if (!('IntersectionObserver' in window)) return;

    var visible = Object.create(null);
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      // topmost currently-visible section wins
      var active = null;
      links.forEach(function (a) {
        var id = a.getAttribute('href').slice(1);
        if (!active && visible[id]) active = id;
      });
      links.forEach(function (a) {
        var on = a.getAttribute('href').slice(1) === active;
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-25% 0px -60% 0px' });

    links.forEach(function (a) {
      var section = document.querySelector(a.getAttribute('href'));
      if (section) spy.observe(section);
    });
  }

  /* ── team ──────────────────────────────────────────────────────────────── */

  function renderTeam() {
    var grid = document.getElementById('team-grid');
    var people = window.NG_TEAM || [];
    if (!grid) return;
    if (!people.length) { grid.closest('section').hidden = true; return; }

    people.forEach(function (p, i) {
      var card = el('article', 'person reveal');
      card.style.setProperty('--delay', Math.min(i, 8) * 70 + 'ms');

      if (p.photo) {
        var img = el('img', 'person-photo');
        img.src = p.photo;
        img.alt = p.name;
        img.loading = 'lazy';
        img.width = 300;
        img.height = 300;
        card.appendChild(img);
      } else {
        var ph = el('div', 'person-photo', initials(p.name));
        ph.setAttribute('aria-hidden', 'true');
        card.appendChild(ph);
      }

      card.appendChild(el('h3', null, p.name));
      if (p.role) card.appendChild(el('p', 'role', p.role));
      if (p.bio) card.appendChild(el('p', 'bio', p.bio));

      var links = [];
      if (p.orcid) links.push(['ORCID', 'https://orcid.org/' + p.orcid]);
      if (p.email) links.push(['E-mail', 'mailto:' + p.email]);
      (p.links || []).forEach(function (l) { links.push([l.label, l.url]); });

      if (links.length) {
        var wrap = el('p', 'person-links');
        links.forEach(function (pair) {
          var a = el('a', null, pair[0]);
          a.href = pair[1];
          if (/^https?:/.test(pair[1])) { a.rel = 'noopener'; a.target = '_blank'; }
          wrap.appendChild(a);
        });
        card.appendChild(wrap);
      }
      grid.appendChild(card);
    });
    watchReveal(grid);
  }

  /* ── alumni ────────────────────────────────────────────────────────────── */

  function renderAlumni() {
    var list = document.getElementById('alumni-list');
    var wrap = document.getElementById('alumni-wrap');
    var people = window.NG_ALUMNI || [];
    if (!list || !wrap) return;
    if (!people.length) { wrap.hidden = true; return; }
    wrap.hidden = false;

    people.forEach(function (p) {
      var li = el('li', 'alumnus');
      if (p.orcid) {
        var a = el('a', null, p.name);
        a.href = 'https://orcid.org/' + p.orcid;
        a.rel = 'noopener';
        a.target = '_blank';
        li.appendChild(a);
      } else {
        li.appendChild(el('span', null, p.name));
      }
      var tail = [p.role, p.now].filter(Boolean).join(' · ');
      if (tail) li.appendChild(el('span', 'alumnus-role', tail));
      list.appendChild(li);
    });
    watchReveal(wrap);
  }

  /* ── master's students ────────────────────────────────────────────────── */

  function renderMasters() {
    var list = document.getElementById('masters-list');
    var wrap = document.getElementById('masters-wrap');
    var people = window.NG_MASTERS || [];
    if (!list || !wrap) return;
    if (!people.length) { wrap.hidden = true; return; }
    wrap.hidden = false;

    people.forEach(function (p) {
      var li = el('li', 'master');
      li.appendChild(el('span', null, p.name));
      if (p.degree) li.appendChild(el('span', 'master-degree', p.degree));
      list.appendChild(li);
    });
    watchReveal(wrap);
  }

  /* ── collaborators ─────────────────────────────────────────────────────── */

  function renderCollaborators() {
    var section = document.getElementById('collaborators');
    if (!section) return;
    var consortia = window.NG_CONSORTIA || [];
    var people = window.NG_COLLABORATORS || [];
    if (!consortia.length && !people.length) return;   // stays hidden
    section.hidden = false;

    var consortiaWrap = document.getElementById('consortia-wrap');
    var consortiaGrid = document.getElementById('consortia-grid');
    if (consortia.length) {
      consortiaWrap.hidden = false;
      consortia.forEach(function (c, i) {
        var card = el('article', 'card reveal');
        card.style.setProperty('--delay', Math.min(i, 8) * 80 + 'ms');
        var heading = c.url ? el('a', null, c.name) : null;
        if (heading) {
          heading.href = c.url;
          heading.rel = 'noopener';
          heading.target = '_blank';
          var h3 = el('h3');
          h3.appendChild(heading);
          card.appendChild(h3);
        } else {
          card.appendChild(el('h3', null, c.name));
        }
        if (c.role) card.appendChild(el('p', 'role', c.role));
        if (c.blurb) card.appendChild(el('p', null, c.blurb));
        consortiaGrid.appendChild(card);
      });
      watchReveal(consortiaGrid);
    }

    var collabWrap = document.getElementById('collab-wrap');
    var collabList = document.getElementById('collab-list');
    if (people.length) {
      collabWrap.hidden = false;
      people.forEach(function (p) {
        var li = el('li', 'collaborator');
        if (p.url) {
          var a = el('a', null, p.name);
          a.href = p.url;
          a.rel = 'noopener';
          a.target = '_blank';
          li.appendChild(a);
        } else {
          li.appendChild(el('span', null, p.name));
        }
        if (p.affiliation) li.appendChild(el('span', 'collaborator-meta', p.affiliation));
        collabList.appendChild(li);
      });
      watchReveal(collabWrap);
    }
  }

  /* ── projects ──────────────────────────────────────────────────────────── */

  function renderProjects() {
    var grid = document.getElementById('project-grid');
    var items = window.NG_PROJECTS || [];
    if (!grid) return;
    var section = grid.closest('section');
    if (!items.length) { section.hidden = true; return; }
    section.hidden = false;

    items.forEach(function (p, i) {
      var card = el('article', 'card reveal');
      card.style.setProperty('--delay', Math.min(i, 8) * 80 + 'ms');
      var heading = p.url ? el('a', null, p.name) : null;
      if (heading) {
        heading.href = p.url;
        heading.rel = 'noopener';
        heading.target = '_blank';
        var h3 = el('h3');
        h3.appendChild(heading);
        card.appendChild(h3);
      } else {
        card.appendChild(el('h3', null, p.name));
      }
      card.appendChild(el('p', null, p.blurb));
      grid.appendChild(card);
    });
    watchReveal(grid);
  }

  /* ── funders ───────────────────────────────────────────────────────────── */

  function renderFunders() {
    var grid = document.getElementById('funder-grid');
    var items = window.NG_FUNDERS || [];
    if (!grid) return;
    var section = grid.closest('section');
    if (!items.length) { section.hidden = true; return; }
    section.hidden = false;

    items.forEach(function (f, i) {
      var node;
      if (f.logo) {
        var img = el('img');
        img.src = f.logo;
        img.alt = f.name;
        img.loading = 'lazy';
        node = img;
      } else {
        node = el('span', 'funder-text', f.name);
      }
      var holder;
      if (f.url) {
        holder = el('a');
        holder.href = f.url;
        holder.rel = 'noopener';
        holder.target = '_blank';
        holder.setAttribute('aria-label', f.name);
        holder.appendChild(node);
      } else {
        holder = node;
      }
      var wrap = el('div', 'funder reveal');
      wrap.style.setProperty('--delay', Math.min(i, 8) * 60 + 'ms');
      wrap.appendChild(holder);
      if (f.grant) wrap.appendChild(el('span', 'funder-grant', f.grant));
      grid.appendChild(wrap);
    });
    watchReveal(grid);
  }

  /* ── publications ──────────────────────────────────────────────────────── */

  // Best-effort topic tags from the title alone. "dbds-chb", "pgc" and
  // "cyclome" mostly can't be told from a title, so they rely on
  // data/publication-tags.js instead — see that file's header comment.
  var AUTO_TAG_RULES = [
    [/genome-wide association|\bgwas\b/i, 'gwas'],
    [/migraine/i, 'migraine'],
    [/headache/i, 'headache'],
    [/multi-?omics?\b/i, 'multiomics'],
    [/danish blood donor/i, 'dbds-chb']
  ];

  function tagsFor(p) {
    var tags = [];
    AUTO_TAG_RULES.forEach(function (rule) {
      if (rule[0].test(p.title)) tags.push(rule[1]);
    });
    (window.NG_PUBLICATION_TAGS && window.NG_PUBLICATION_TAGS[p.doi] || []).forEach(function (t) {
      if (tags.indexOf(t) === -1) tags.push(t);
    });
    return tags;
  }

  // Bold the group's own members in the author string.
  function authorLine(authors, memberNames) {
    var p = el('p', 'pub-authors');
    if (!authors || !authors.length) return p;
    authors.forEach(function (a, i) {
      if (i) p.appendChild(document.createTextNode(', '));
      var isMember = memberNames.some(function (m) { return sameName(m, a); });
      p.appendChild(isMember ? el('b', null, a) : document.createTextNode(a));
    });
    return p;
  }

  // "Hansen TF" vs "Thomas Folkmann Hansen": compare surname + first initial.
  function nameKey(name) {
    var parts = String(name).toLowerCase().replace(/[.,]/g, '').split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    // Crossref gives "Given Family"; ORCID display names too. Take last as family.
    return parts[parts.length - 1] + '|' + parts[0].charAt(0);
  }
  function sameName(a, b) { return nameKey(a) === nameKey(b); }

  function pubNode(p, memberNames) {
    var item = el('article', 'pub');

    var href = p.doi ? 'https://doi.org/' + p.doi : null;
    var title = el(href ? 'a' : 'span', 'pub-title', p.title);
    if (href) { title.href = href; title.rel = 'noopener'; title.target = '_blank'; }
    item.appendChild(title);

    item.appendChild(authorLine(p.authors, memberNames));

    var meta = el('p', 'pub-meta');
    if (p.journal) {
      var j = el('em', null, p.journal);
      meta.appendChild(j);
    }
    if (p.year) meta.appendChild(document.createTextNode((p.journal ? ' · ' : '') + p.year));
    if (p.preprint) meta.appendChild(el('span', 'pub-preprint', 'Preprint'));
    item.appendChild(meta);

    return item;
  }

  function renderPublications() {
    var list = document.getElementById('pub-list');
    if (!list) return;
    var data = window.NG_PUBLICATIONS || {};
    var section = list.closest('section');
    var stamp = document.getElementById('pub-stamp');
    var moreWrap = document.getElementById('pub-more-wrap');
    var moreBtn = document.getElementById('pub-more');
    var countEl = document.getElementById('pub-count');
    var noResultsEl = document.getElementById('pub-no-results');
    var filterBtns = Array.prototype.slice.call(document.querySelectorAll('.pub-filter-btn'));

    var entries = (data.items || []).map(function (p) { return { pub: p, tags: tagsFor(p) }; });
    if (!entries.length) { section.hidden = true; return; }
    section.hidden = false;

    if (stamp && data.generated) {
      stamp.textContent = 'Last updated ' + String(data.generated).slice(0, 10) + '.';
    }

    var memberNames = (window.NG_TEAM || []).map(function (p) { return p.name; });
    var activeFilter = 'all';
    var expanded = false;

    function visible() {
      if (activeFilter === 'all') return entries;
      return entries.filter(function (x) { return x.tags.indexOf(activeFilter) !== -1; });
    }

    function paint() {
      var filtered = visible();
      var collapse = activeFilter === 'all' && !expanded && filtered.length > PUBS_COLLAPSED;
      var shown = collapse ? filtered.slice(0, PUBS_COLLAPSED) : filtered;

      list.textContent = '';
      var currentYear = null;
      shown.forEach(function (x) {
        var y = x.pub.year || 'Undated';
        if (y !== currentYear) {
          currentYear = y;
          list.appendChild(el('p', 'pub-year reveal', String(y)));
        }
        list.appendChild(pubNode(x.pub, memberNames));
      });
      watchReveal(list);

      if (countEl) {
        countEl.textContent = filtered.length + (filtered.length === 1 ? ' publication' : ' publications');
      }
      if (noResultsEl) noResultsEl.hidden = filtered.length !== 0;

      if (moreWrap && moreBtn) {
        if (activeFilter === 'all' && filtered.length > PUBS_COLLAPSED) {
          moreWrap.hidden = false;
          moreBtn.textContent = expanded ? 'Show fewer' : 'Show all ' + filtered.length + ' publications';
        } else {
          moreWrap.hidden = true;
        }
      }
    }

    if (moreBtn) {
      moreBtn.addEventListener('click', function () {
        expanded = !expanded;
        paint();
        if (!expanded) section.scrollIntoView({ block: 'start' });
      });
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        activeFilter = btn.dataset.filter;
        expanded = false;
        paint();
      });
    });

    paint();
  }

  /* ── go ────────────────────────────────────────────────────────────────── */

  revealObserver = initReveal() || null;
  initTopbar();
  renderTeam();
  renderAlumni();
  renderMasters();
  renderCollaborators();
  renderProjects();
  renderFunders();
  renderPublications();

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

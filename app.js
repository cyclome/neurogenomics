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
      holder.classList.add('reveal');
      holder.style.setProperty('--delay', Math.min(i, 8) * 60 + 'ms');
      grid.appendChild(holder);
    });
    watchReveal(grid);
  }

  /* ── publications ──────────────────────────────────────────────────────── */

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
    var items = data.items || [];
    var section = list.closest('section');
    var stamp = document.getElementById('pub-stamp');
    var moreWrap = document.getElementById('pub-more-wrap');
    var moreBtn = document.getElementById('pub-more');

    if (!items.length) { section.hidden = true; return; }
    section.hidden = false;

    if (stamp && data.generated) {
      stamp.textContent = 'Last updated ' + String(data.generated).slice(0, 10) + '.';
    }

    var memberNames = (window.NG_TEAM || []).map(function (p) { return p.name; });

    function paint(limit) {
      list.textContent = '';
      var shown = limit ? items.slice(0, limit) : items;
      var currentYear = null;
      shown.forEach(function (p) {
        var y = p.year || 'Undated';
        if (y !== currentYear) {
          currentYear = y;
          list.appendChild(el('p', 'pub-year reveal', String(y)));
        }
        list.appendChild(pubNode(p, memberNames));
      });
      watchReveal(list);
    }

    var expanded = items.length <= PUBS_COLLAPSED;
    paint(expanded ? 0 : PUBS_COLLAPSED);

    if (!expanded && moreWrap && moreBtn) {
      moreWrap.hidden = false;
      moreBtn.textContent = 'Show all ' + items.length + ' publications';
      moreBtn.addEventListener('click', function () {
        expanded = !expanded;
        paint(expanded ? 0 : PUBS_COLLAPSED);
        moreBtn.textContent = expanded
          ? 'Show fewer'
          : 'Show all ' + items.length + ' publications';
        if (!expanded) section.scrollIntoView({ block: 'start' });
      });
    }
  }

  /* ── go ────────────────────────────────────────────────────────────────── */

  revealObserver = initReveal() || null;
  initTopbar();
  renderTeam();
  renderAlumni();
  renderFunders();
  renderPublications();

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

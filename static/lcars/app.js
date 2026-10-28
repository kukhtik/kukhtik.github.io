/* ================================================================
   LCARS portfolio - behaviour
   - bilingual rendering from content-contract.json (one markup)
   - L-elbows generated as ONE connected path per framed block
   - GSAP + ScrollTrigger: runs extend, sections reveal, counters
     count, the linac schematic draws itself line by line
   ================================================================ */
(function () {
  'use strict';

  var CONTRACT = JSON.parse(document.getElementById('contract').textContent);
  var S = CONTRACT.site;

  /* ---------- interface copy (not in the contract) ---------- */
  var UI = {
    'ui.record':        { en: 'Service record',        ru: 'Служебная запись' },
    'ui.instrument':    { en: 'Linear accelerator · TrueBeam', ru: 'Линейный ускоритель · TrueBeam' },
    'ui.instrumentNote':{ en: 'Schematic · not to scale', ru: 'Схема · не в масштабе' },
    'ui.isodose':       { en: 'Isodose · central axis', ru: 'Изодоза · центральная ось' },
    'ui.mlc':           { en: 'MLC leaf pattern',       ru: 'Раскладка лепестков MLC' },
    'ui.wave':          { en: 'Beam-on pulse train',    ru: 'Импульсы пучка' },
    'ui.capabilities':  { en: 'Capabilities',           ru: 'Возможности' },
    'ui.availability':  { en: 'Availability',           ru: 'Доступность' },
    'ui.email':         { en: 'Email',                  ru: 'Почта' },
    'ui.github':        { en: 'GitHub',                 ru: 'GitHub' },
    'ui.location':      { en: 'Location',               ru: 'Город' },
    'ui.cta':           { en: 'Email me',               ru: 'Написать' },
    'ui.projects':      { en: 'Selected work',          ru: 'Избранные работы' },
    'ui.projectsNote':  { en: 'Measured results · NDA-safe', ru: 'Измеренные результаты · под NDA' },
    'ui.about':         { en: 'About',                  ru: 'Обо мне' },
    'ui.foot':          { en: 'Portfolio',              ru: 'Портфолио' },
    'ui.open':          { en: 'Open',                  ru: 'Открыть' },
    'ui.approach':      { en: 'Approach',               ru: 'Подход' },
    'ui.confidentiality':{ en: 'Disclosure',            ru: 'О раскрытии' },
    'ui.stack':         { en: 'Stack',                  ru: 'Стек' },
    'ui.machine':       { en: 'Machine readout',        ru: 'Показания установки' },
    'ro.gantry':        { en: 'Gantry angle',           ru: 'Угол гантри' },
    'ro.sad':           { en: 'SAD',                    ru: 'SAD' },
    'ro.field':         { en: 'Field at isocentre',     ru: 'Поле в изоцентре' },
    'ro.mlc':           { en: 'MLC aperture',           ru: 'Апертура MLC' },
    'ro.iso':           { en: 'Isocentre offset',       ru: 'Смещение изоцентра' },
    'ro.dmax':          { en: 'Dose d-max',             ru: 'Доза d-max' },
    'ro.d90':           { en: 'Depth d90',              ru: 'Глубина d90' },
    'ro.d50':           { en: 'Depth d50',              ru: 'Глубина d50' }
  };

  /* machine readouts - every value is read off the drawings in assets/ */
  var READOUTS = [
    { k: 'ro.gantry', v: '000', u: '°' },
    { k: 'ro.sad',    v: '100', u: 'cm' },
    { k: 'ro.field',  v: '20',  u: 'cm' },
    { k: 'ro.mlc',    v: '10 × 10', u: 'cm', plain: true },
    { k: 'ro.iso',    v: '0.0', u: 'mm' },
    { k: 'ro.dmax',   v: '1.5', u: 'cm' },
    { k: 'ro.d90',    v: '6.0', u: 'cm' },
    { k: 'ro.d50',    v: '17.4', u: 'cm' }
  ];

  /* the locale comes from the path, so /ru/ is the Russian build on first paint */
  var LANG = /\/ru(\/|$)/.test(location.pathname) ? 'ru' : 'en';

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    if (!root) return Array.prototype.slice.call(document.querySelectorAll(sel));
    if (root.nodeType) return Array.prototype.slice.call(root.querySelectorAll(sel));
    return Array.prototype.slice.call(root);
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function pick(obj) {
    if (obj && typeof obj === 'object' && (obj.en !== undefined || obj.ru !== undefined)) {
      return obj[LANG] !== undefined ? obj[LANG] : obj.en;
    }
    return obj;
  }
  function t(key) {
    if (UI[key]) return UI[key][LANG];
    var parts = key.split('.'), node = CONTRACT;
    for (var i = 0; i < parts.length; i++) {
      if (node === undefined || node === null) return '';
      node = node[parts[i]];
    }
    return pick(node);
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------- counters ---------- */
  function counterHTML(value) {
    /* every numeric token inside the value counts up from zero */
    return String(value).replace(/\d[\d,]*/g, function (tok) {
      var target = parseInt(tok.replace(/,/g, ''), 10);
      var comma = tok.indexOf(',') > -1;
      return '<span class="cnt" data-to="' + target + '" data-comma="' + (comma ? 1 : 0) + '">0</span>';
    });
  }
  function formatNum(n, comma) {
    var s = String(n);
    if (comma) {
      s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return s;
  }

  /* ---------- rendering ---------- */
  function renderFacts() {
    var box = $('#facts');
    box.innerHTML = '';
    S.facts.forEach(function (f, i) {
      var row = el('div', 'fact');
      row.appendChild(el('span', 'fact__k', pick(f.label)));
      var v = el('span', 'fact__v' + (i === 2 ? ' fact__v--accent' : ''), pick(f.value));
      row.appendChild(v);
      box.appendChild(row);
    });
  }

  function renderRecord() {
    var box = $('#record');
    box.innerHTML = '';
    var colours = ['bar--coral', 'bar--salmon', 'bar--amber'];
    S.record.forEach(function (r, i) {
      var row = el('div', 'rec__row');
      var bar = el('span', 'bar ' + colours[i % colours.length]);
      bar.setAttribute('data-od-id', 'record-bar-' + (i + 1));
      row.appendChild(bar);
      var body = el('div');
      body.appendChild(el('div', 'rec__when', r.when));
      body.appendChild(el('div', 'rec__title', pick(r.title)));
      body.appendChild(el('p', 'rec__text', pick(r.text)));
      row.appendChild(body);
      box.appendChild(row);
    });
  }

  function renderServices() {
    var box = $('#services');
    box.innerHTML = '';
    S.services.forEach(function (s) {
      var row = el('div', 'cap__row');
      var top = el('div', 'cap__top');
      top.appendChild(el('span', 'cap__num', s.number));
      top.appendChild(el('span', 'cap__title', pick(s.title)));
      row.appendChild(top);
      row.appendChild(el('p', 'cap__text', pick(s.text)));
      box.appendChild(row);
    });
  }

  function renderMore() {
    var box = $('#more');
    box.innerHTML = '';
    S.more.forEach(function (m, i) {
      var row = el('div', 'more__row');
      row.setAttribute('data-od-id', 'more-row-' + (i + 1));
      row.appendChild(el('span', 'bar ' + (i === 0 ? 'bar--amber' : 'bar--lavender')));
      var body = el('div');
      body.appendChild(el('div', 'more__t', pick(m.title)));
      body.appendChild(el('p', 'more__x', pick(m.text)));
      row.appendChild(body);
      var a = el('a', 'link', t('ui.open'));
      a.href = m.url;
      a.target = '_blank';
      a.rel = 'noopener';
      row.appendChild(a);
      box.appendChild(row);
    });
  }

  function renderReadouts() {
    var box = $('#readouts');
    box.innerHTML = '';
    READOUTS.forEach(function (r, i) {
      var cell = el('div', 'ro');
      cell.setAttribute('data-od-id', 'readout-' + (i + 1));
      cell.appendChild(el('div', 'ro__k', t(r.k)));
      var v = el('div', 'ro__v');
      v.textContent = r.v;
      v.appendChild(el('span', 'ro__u', r.u));
      cell.appendChild(v);
      box.appendChild(cell);
    });
  }

  function renderCards() {
    var box = $('#cards');
    box.innerHTML = '';
    var order = ['engineer-companion', 'vetka-dwg', 'geoconverter'];
    var accents = ['bar--periwinkle', 'bar--coral', 'bar--amber'];
    order.forEach(function (key, idx) {
      var p = CONTRACT.projects[key];
      var card = el('article', 'card');
      card.setAttribute('data-od-id', 'card-' + p.slug);

      var top = el('div', 'card__top');
      top.appendChild(el('span', 'bar ' + accents[idx]));
      top.appendChild(el('span', 'card__idx', '0' + (idx + 1)));
      var st = el('span', 'card__status card__status--' + p.status, t('ui.' + p.status) || pick(S.status_labels[p.status]));
      st.textContent = pick(S.status_labels[p.status]);
      top.appendChild(st);
      card.appendChild(top);

      card.appendChild(el('h3', 'card__title', pick(p.title)));
      card.appendChild(el('p', 'card__summary', pick(p.summary)));

      var metrics = el('div', 'metrics');
      p.results.forEach(function (r) {
        var m = el('div', 'metric');
        var v = el('div', 'metric__v');
        v.innerHTML = counterHTML(r.value);
        m.appendChild(v);
        m.appendChild(el('div', 'metric__l', pick(r.label)));
        metrics.appendChild(m);
      });
      card.appendChild(metrics);

      var chips = el('div', 'chips');
      p.stack.forEach(function (s) { chips.appendChild(el('span', 'chip', s)); });
      card.appendChild(chips);

      var det = el('details');
      det.appendChild(el('summary', null, t('ui.approach')));
      det.appendChild(el('p', 'detail__p', pick(p.problem)));
      var ul = el('ul');
      pick(p.approach).forEach(function (a) { ul.appendChild(el('li', 'detail__li', a)); });
      det.appendChild(ul);
      det.appendChild(el('p', 'detail__p', pick(p.confidentiality)));
      card.appendChild(det);

      var links = el('div', 'card__links');
      p.links.forEach(function (l) {
        var a = el('a', 'link', pick(l.label));
        a.href = l.url;
        a.target = '_blank';
        a.rel = 'noopener';
        links.appendChild(a);
      });
      card.appendChild(links);
      box.appendChild(card);
    });
  }

  function renderAbout() {
    var box = $('#about');
    box.innerHTML = '';
    pick(S.about).forEach(function (p) {
      var para = el('p', 'about__p', p);
      box.appendChild(para);
    });
  }

  function renderStaticText() {
    $$('[data-i18n]').forEach(function (node) {
      var v = t(node.getAttribute('data-i18n'));
      if (v !== '' && v !== undefined) node.textContent = v;
    });
    document.documentElement.setAttribute('lang', LANG);
    document.title = pick(S.seo.title);
    var md = $('#meta-desc');
    if (md) md.setAttribute('content', pick(S.seo.description));
    $$('.lang__btn').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === LANG ? 'true' : 'false');
    });
  }

  function renderAll() {
    renderStaticText();
    renderFacts();
    renderRecord();
    renderServices();
    renderMore();
    renderReadouts();
    renderCards();
    renderAbout();
  }

  /* ---------- language routing ---------- */
  function routeFor(lang) { return lang === 'ru' ? '/ru/' : '/'; }
  function applyLang(lang, push) {
    LANG = lang;
    renderAll();
    buildElbows();
    if (push) {
      try {
        history.pushState({ lang: lang }, '', routeFor(lang));
      } catch (e) {
        /* file:// preview - keep the hash so the state survives a reload */
        location.hash = lang === 'ru' ? '#ru' : '#en';
      }
    }
    try { localStorage.setItem('lcars-lang', lang); } catch (e) {}
    document.dispatchEvent(new CustomEvent('lcars:lang', { detail: { lang: lang } }));
  }

  /* ---------- L-elbows: one connected path per framed block ---------- */
  var ELBOW_COLOUR = {
    amber: 'var(--amber)',
    coral: 'var(--coral)',
    periwinkle: 'var(--periwinkle)',
    iris: 'var(--iris)'
  };

  /* horizontal run -> 90 deg -> vertical run, one continuous outline,
     rounded outer AND inner corner, semicircular caps (radius = t/2) */
  function elbowPath(W, H, t, r, armLen) {
    var c = t / 2;
    var d = [];
    d.push('M ' + r + ' 0');
    d.push('H ' + (armLen - c));
    d.push('A ' + c + ' ' + c + ' 0 0 1 ' + (armLen - c) + ' ' + t);
    d.push('H ' + (t + r));
    d.push('A ' + r + ' ' + r + ' 0 0 0 ' + t + ' ' + (t + r));
    d.push('V ' + (H - c));
    d.push('A ' + c + ' ' + c + ' 0 0 1 0 ' + (H - c));
    d.push('V ' + r);
    d.push('A ' + r + ' ' + r + ' 0 0 1 ' + r + ' 0');
    d.push('Z');
    return d.join(' ');
  }

  function buildElbows() {
    $$('.panel--elbow').forEach(function (panel) {
      var host = $('.elbow', panel);
      if (!host) return;
      var box = panel.getBoundingClientRect();
      if (!box.width || !box.height) return;
      var t = 20, r = 8;
      var armLen = Math.max(84, Math.round(box.width * 0.42));
      var W = Math.round(box.width), H = Math.round(box.height);
      host.style.color = ELBOW_COLOUR[panel.getAttribute('data-elbow')] || 'var(--coral)';
      host.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" ' +
        'style="width:100%;height:100%;overflow:visible" aria-hidden="true">' +
        '<path d="' + elbowPath(W, H, t, r, armLen) + '"></path></svg>';
    });
  }

  /* ---------- SVG draw-in ---------- */
  function drawableNodes(svg) {
    return $$('.drawing path, .drawing line, .drawing polyline, .drawing ellipse, .drawing circle', svg)
      .filter(function (n) {
        if (n.closest('.dim') !== null) return false;      /* dashed dimension lines fade in */
        if (n.classList.contains('dim')) return false;
        return true;
      });
  }

  function prepareDraw(svg) {
    var nodes = drawableNodes(svg);
    nodes.forEach(function (n) {
      var len = 0;
      try { len = n.getTotalLength(); } catch (e) { len = 0; }
      if (!len) return;
      n.style.strokeDasharray = len + ' ' + len;
      n.style.strokeDashoffset = len;
    });
    return nodes;
  }

  function playDraw(svg, tl) {
    var nodes = drawableNodes(svg);
    nodes.forEach(function (n) {
      var len = 0;
      try { len = n.getTotalLength(); } catch (e) { len = 0; }
      if (!len) return;
      tl.to(n, { strokeDashoffset: 0, duration: 0.9, ease: 'none' }, '<' + (Math.random() * 0.25));
    });
    $$('.drawing text', svg).forEach(function (t2, i) {
      tl.to(t2, { opacity: 1, duration: 0.35 }, '<' + (0.3 + i * 0.03));
    });
    $$('.drawing .dim', svg).forEach(function (d) {
      tl.to(d, { opacity: 1, duration: 0.4 }, '<0.2');
    });
  }

  /* ---------- counters ---------- */
  function runCounters(scope) {
    var nodes = (scope && scope.nodeType) ? $$( '.cnt', scope) : (scope || []).length ? scope : $$('.cnt');
    nodes.forEach(function (node) {
      if (node.dataset.done) return;
      node.dataset.done = '1';
      var to = parseFloat(node.getAttribute('data-to'));
      var comma = node.getAttribute('data-comma') === '1';
      var obj = { n: 0 };
      gsap.to(obj, {
        n: to,
        duration: 1.4,
        ease: 'power2.out',
        onUpdate: function () { node.textContent = formatNum(Math.round(obj.n), comma); },
        onComplete: function () { node.textContent = formatNum(to, comma); }
      });
    });
  }

  /* ---------- motion ---------- */
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initMotion() {
    if (!window.gsap) { revealFallback(); return; }
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    /* the top bar grows out of the left edge of the screen */
    gsap.from('.rail__bar', { scaleX: 0, duration: 1.1, ease: 'power3.out', transformOrigin: 'left center' });
    gsap.from('.rail__name', { xPercent: 40, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.35 });
    gsap.from('.rail__meta, .lang', { opacity: 0, duration: 0.6, delay: 0.55 });

    /* runs extend across the screen edge */
    $$('.run--bleed').forEach(function (r) {
      gsap.set(r, { scaleX: 0, transformOrigin: 'left center' });
      if (window.ScrollTrigger) {
        gsap.to(r, {
          scaleX: 1, duration: 1.1, ease: 'power2.out',
          scrollTrigger: { trigger: r, start: 'top 92%', toggleActions: 'play none none reverse' }
        });
      } else {
        gsap.to(r, { scaleX: 1, duration: 1.1, ease: 'power2.out' });
      }
    });

    /* sections reveal */
    var targets = $$('.panel, .card, .more__row, .about__p, .readouts .ro, .instrument');
    if (window.ScrollTrigger) {
      ScrollTrigger.batch(targets, {
        start: 'top 90%',
        once: true,
        onEnter: function (batch) {
          gsap.fromTo(batch, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.09, ease: 'power3.out', clearProps: 'transform' });
          runCounters(batch);
        }
      });
    } else {
      gsap.set(targets, { opacity: 1, y: 0 });
      runCounters(document);
    }

    /* the linac schematic draws itself, line by line */
    var linac = $('#stage-linac svg');
    if (linac) {
      prepareDraw(linac);
      var tl = gsap.timeline({ paused: true });
      playDraw(linac, tl);
      if (window.ScrollTrigger) {
        ScrollTrigger.create({ trigger: '#stage-linac', start: 'top 82%', once: true, onEnter: function () { tl.play(0); } });
      } else {
        tl.play(0);
      }
    }

    /* the isodose section draws after it is reached */
    var iso = $('#stage-isodose svg');
    if (iso) {
      prepareDraw(iso);
      var tl2 = gsap.timeline({ paused: true });
      playDraw(iso, tl2);
      if (window.ScrollTrigger) {
        ScrollTrigger.create({ trigger: '#stage-isodose', start: 'top 88%', once: true, onEnter: function () { tl2.play(0); } });
      } else {
        tl2.play(0);
      }
    }

    runCounters(document);
  }

  function revealFallback() {
    $$('[data-anim="up"]').forEach(function (n) { n.style.opacity = 1; n.style.transform = 'none'; });
    $$('.cnt').forEach(function (n) {
      n.textContent = formatNum(parseFloat(n.getAttribute('data-to')), n.getAttribute('data-comma') === '1');
    });
  }

  /* ---------- boot ---------- */
  function initialLang() {
    var p = location.pathname || '';
    if (/\/ru\/?$/.test(p) || /\/ru(\/|$)/.test(p)) return 'ru';
    if (location.hash === '#ru') return 'ru';
    try {
      var saved = localStorage.getItem('lcars-lang');
      if (saved === 'ru' || saved === 'en') return saved;
    } catch (e) {}
    return 'en';
  }

  function boot() {
    applyLang(initialLang(), false);
    initMotion();

    $$('.lang__btn').forEach(function (b) {
      b.addEventListener('click', function () {
        applyLang(b.getAttribute('data-lang'), true);
      });
    });
    window.addEventListener('popstate', function () { applyLang(initialLang(), false); });

    /* elbows follow the box they frame */
    var tmr;
    window.addEventListener('resize', function () {
      clearTimeout(tmr);
      tmr = setTimeout(function () {
        buildElbows();
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }, 120);
    });
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { buildElbows(); });
      $$('.panel--elbow').forEach(function (p) { ro.observe(p); });
    }
    if (window.ScrollTrigger) {
      setTimeout(function () { ScrollTrigger.refresh(); }, 400);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

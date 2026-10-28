/* =================================================================
   THE CONSOLE - behaviour
     - one markup, two languages: EN at /, RU at /ru/ ; every
       interface string lives in the page's own i18n object
     - the scroll is a mode dial: ONE scrubbed timeline drives the
       console through its five states
     - GSAP + ScrollTrigger, both vendored: no CDN, no fetch
     - prefers-reduced-motion: the console renders in its rest
       state, fully drawn, and the scroll does nothing
   ================================================================= */
(function () {
  'use strict';

  var CONTRACT = JSON.parse(document.getElementById('contract').textContent);
  var S = CONTRACT.site;
  var HTML = document.documentElement;
  var LANG = HTML.getAttribute('data-lang') === 'ru' ? 'ru' : 'en';

  /* ---------- the page's own interface copy, EN + RU ---------- */
  var I18N = {
    'ui.who':         { en: 'Maxim Kukhto',   ru: 'Максим Кухто' },
    'ui.mode':        { en: 'Mode',           ru: 'Режим' },
    'ui.clock':       { en: 'Local',          ru: 'Местное' },
    'ui.state0':      { en: 'Boot',           ru: 'Пуск' },
    'ui.state1':      { en: 'Machine',        ru: 'Установка' },
    'ui.state2':      { en: 'Dose',           ru: 'Доза' },
    'ui.state3':      { en: 'Leaves',         ru: 'Лепестки' },
    'ui.state4':      { en: 'Work',           ru: 'Работа' },
    'ui.state5':      { en: 'Rest',           ru: 'Покой' },

    'ui.capTitle':    { en: 'Capabilities',   ru: 'Возможности' },
    'ui.capTag':      { en: 'Three areas',    ru: 'Три направления' },
    'ui.recordTitle': { en: 'Service record', ru: 'Служебная запись' },
    'ui.recordTag':   { en: '2020 - 2026',    ru: '2020 - 2026' },
    'ui.reportTitle': { en: 'System online',  ru: 'Система в сети' },
    'ui.reportTag':   { en: 'Report',         ru: 'Отчёт' },

    'ui.insetsTitle': { en: 'Device panel',    ru: 'Панель приборов' },
    'ui.insetsTag':   { en: 'Off the machine', ru: 'Снято с установки' },
    'ui.isodoseTitle':{ en: 'Isodose - axis',  ru: 'Изодоза - ось' },
    'ui.mlcTitle':    { en: 'MLC leaves',      ru: 'Лепестки MLC' },
    'ui.waveTitle':   { en: 'Pulse train',     ru: 'Импульсы пучка' },

    'ui.contactCta':  { en: 'Write me',      ru: 'Написать' },
    'ui.github':      { en: 'GitHub',        ru: 'GitHub' },
    'ui.linkedin':    { en: 'LinkedIn',      ru: 'LinkedIn' },
    'ui.space':       { en: 'Open Space',    ru: 'Open Space' },
    'ui.domain':      { en: 'kukhto.is-a.dev', ru: 'kukhto.is-a.dev' },

    'ui.caseOpen':    { en: 'Open case',     ru: 'Открыть кейс' },
    'ui.stActive':    { en: 'Active',        ru: 'Активен' },
    'ui.stSet':       { en: 'Set',           ru: 'Задано' },
    'ui.stPrimary':   { en: 'Primary',       ru: 'Основное' },
    'ui.stLive':      { en: 'Live',          ru: 'В работе' },
    'ui.avail':       { en: 'Available',     ru: 'Доступен' },

    'ro.gantry':      { en: 'Gantry',        ru: 'Гантри' },
    'ro.head':        { en: 'Head',          ru: 'Головка' },
    'ro.mlc':         { en: 'MLC',           ru: 'MLC' },
    'ro.beam':        { en: 'Beam',          ru: 'Пучок' },
    'ro.isocentre':   { en: 'Isocentre',     ru: 'Изоцентр' },
    'ro.sad':         { en: 'SAD',           ru: 'SAD' },
    'ro.field':       { en: 'Field',         ru: 'Поле' },
    'ro.dmax':        { en: 'd_max',         ru: 'd_max' },
    'ro.d90':         { en: 'd_90',          ru: 'd_90' },
    'ro.d50':         { en: 'd_50',          ru: 'd_50' },
    'ro.iso':         { en: 'Isodose',       ru: 'Изодоза' },
    'ro.depth':       { en: 'Depth',         ru: 'Глубина' },
    'ro.leaves':      { en: 'Leaves',        ru: 'Лепестки' },
    'ro.gap':         { en: 'Leaf gap',      ru: 'Зазор' },
    'ro.aperture':    { en: 'Aperture',      ru: 'Апертура' },
    'ro.bankA':       { en: 'Bank A',        ru: 'Ряд A' },
    'ro.bankB':       { en: 'Bank B',        ru: 'Ряд B' },
    'ro.leafIndex':   { en: 'Leaf index',    ru: 'Индекс' },
    'ro.cases':       { en: 'Cases',         ru: 'Кейсы' },
    'ro.public':      { en: 'Public code',  ru: 'Открытый код' },
    'ro.nda':         { en: 'Under NDA',     ru: 'Под NDA' },
    'ro.commercial':  { en: 'Commercial',    ru: 'Коммерческий' },
    'ro.tests':       { en: 'Tests',         ru: 'Тесты' },
    'ro.p50':         { en: 'p50 latency',   ru: 'p50 задержка' },
    'ro.facts':       { en: 'Facts indexed', ru: 'Фактов в индексе' },
    'ro.accuracy':    { en: 'Accuracy',      ru: 'Точность' }
  };

  /* ---------- helpers ---------- */
  function $(sel, r) { return (r || document).querySelector(sel); }
  function $$(sel, r) {
    var l = r ? r.querySelectorAll(sel) : document.querySelectorAll(sel);
    return Array.prototype.slice.call(l);
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function pick(o) {
    if (o && typeof o === 'object' && (o.en !== undefined || o.ru !== undefined)) {
      return o[LANG] !== undefined ? o[LANG] : o.en;
    }
    return o;
  }
  function t(key) {
    if (I18N[key]) return I18N[key][LANG] !== undefined ? I18N[key][LANG] : I18N[key].en;
    var p = key.split('.'), n = CONTRACT;
    for (var i = 0; i < p.length; i++) {
      if (n === undefined || n === null) return '';
      n = n[p[i]];
    }
    return pick(n);
  }
  function host(name) {
    var b = $('[data-render="' + name + '"]');
    if (b) b.innerHTML = '';
    return b;
  }
  function group(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }

  /* ---------- the readout sets ----------
     every number is read off the drawings themselves or out of the
     contract: nothing is invented */
  var SETS = {
    0: [],
    1: [ { k:'ro.gantry', n:0, d:0, u:'\u00b0' },
         { k:'ro.head', n:6, d:0, u:'MV' },
         { k:'ro.mlc', n:10, d:0, u:'cm' },
         { k:'ro.beam', n:6, d:0, u:'MV' },
         { k:'ro.isocentre', n:0, d:0, u:'cm' },
         { k:'ro.sad', n:100, d:0, u:'cm' },
         { k:'ro.field', n:20, d:0, u:'cm' } ],
    2: [ { k:'ro.dmax', n:1.5, d:1, u:'cm' },
         { k:'ro.d90', n:6.0, d:1, u:'cm' },
         { k:'ro.d50', n:17.4, d:1, u:'cm' },
         { k:'ro.iso', n:100, d:0, u:'%' },
         { k:'ro.iso', n:50, d:0, u:'%' },
         { k:'ro.depth', n:40, d:0, u:'cm' } ],
    3: [ { k:'ro.mlc', n:10, d:0, u:'cm' },
         { k:'ro.leaves', n:30, d:0, u:'' },
         { k:'ro.gap', n:0.5, d:1, u:'mm' },
         { k:'ro.aperture', n:10, d:0, u:'cm' },
         { k:'ro.bankA', n:15, d:0, u:'' },
         { k:'ro.bankB', n:15, d:0, u:'' },
         { k:'ro.leafIndex', n:1, d:0, u:'- 15' } ],
    4: [ { k:'ro.cases', n:3, d:0, u:'' },
         { k:'ro.public', n:1, d:0, u:'' },
         { k:'ro.nda', n:1, d:0, u:'' },
         { k:'ro.commercial', n:1, d:0, u:'' },
         { k:'ro.tests', n:768, d:0, u:'/ 775' },
         { k:'ro.p50', n:130, d:0, u:'ms' },
         { k:'ro.facts', n:21214, d:0, u:'' },
         { k:'ro.accuracy', n:96, d:0, u:'/ 100' } ],
    5: [ { k:'ro.gantry', n:0, d:0, u:'\u00b0' },
         { k:'ro.head', n:6, d:0, u:'MV' },
         { k:'ro.mlc', n:10, d:0, u:'cm' },
         { k:'ro.beam', n:6, d:0, u:'MV' },
         { k:'ro.isocentre', n:0, d:0, u:'cm' },
         { k:'ro.sad', n:100, d:0, u:'cm' },
         { k:'ro.field', n:20, d:0, u:'cm' } ]
  };

  /* when each state's readouts come in, and how long they take to count */
  var START = { 1: 0.16, 2: 1.16, 3: 2.16, 4: 3.16, 5: 4.16 };
  var SPAN  = 0.72;

  /* the leader wires: a label on the drawing runs down to its readout cell */
  var WIRES = {
    1: [ { c:0, t:'GANTRY' }, { c:1, t:'TREATMENT HEAD' }, { c:2, t:'MLC' },
         { c:3, t:'BEAM' }, { c:4, t:'ISOCENTRE' }, { c:5, t:'SAD 100 CM' },
         { c:6, t:'FIELD 20 CM' } ],
    2: [ { c:0, t:'dmax 1.5 cm' }, { c:1, t:'d90 = 6.0 cm' },
         { c:2, t:'d50 = 17.4 cm' } ],
    3: [ { c:0, t:'FIELD 10 x 10 cm AT ISO' }, { c:2, t:'LEAF GAP 0.5 mm' },
         { c:4, t:'LEAF BANK A' }, { c:5, t:'LEAF BANK B' } ]
  };

  /* ---------- renderers ---------- */
  function renderReadouts(state) {
    var grid = $('#readouts-grid');
    if (!grid) return;
    var set = SETS[state] || [];
    grid.innerHTML = '';
    grid.style.setProperty('--cols', String(Math.max(set.length, 1)));
    set.forEach(function (spec, i) {
      var cell = el('div', 'readout');
      cell.setAttribute('data-od-id', 'readout-' + state + '-' + (i + 1));
      cell.appendChild(el('span', 'readout__k', t(spec.k)));
      var v = el('span', 'readout__v');
      var val = el('span', 'readout__n');
      val.textContent = spec.d ? String(spec.n).replace('.', ',') : group(spec.n);
      v.appendChild(val);
      if (spec.u) v.appendChild(el('u', null, spec.u));
      cell.appendChild(v);
      grid.appendChild(cell);
    });
  }

  function renderLadder() {
    var box = host('ladder');
    if (!box) return;
    for (var s = 0; s <= 5; s++) {
      var row = el('div', 'ladder__row');
      row.setAttribute('data-od-id', 'ladder-row-' + s);
      row.setAttribute('data-state', String(s));
      row.appendChild(el('span', 'ladder__rule'));
      row.appendChild(el('span', 'ladder__link'));
      row.appendChild(el('span', 'ladder__block', t('ui.state' + s)));
      box.appendChild(row);
    }
    box.appendChild(el('span', 'ladder__notch'));
  }

  function renderRecord() {
    var box = host('record');
    if (!box) return;
    var colours = ['coral', 'amber', 'lav'];
    S.record.forEach(function (r, i) {
      var row = el('div', 'rec__row');
      row.setAttribute('data-od-id', 'record-row-' + (i + 1));
      var head = el('div', 'rec__head');
      head.appendChild(el('span', 'rec__bar rec__bar--' + colours[i % 3]));
      head.appendChild(el('span', 'rec__when', r.when));
      row.appendChild(head);
      row.appendChild(el('div', 'rec__title', pick(r.title)));
      row.appendChild(el('p', 'rec__text', pick(r.text)));
      box.appendChild(row);
    });
  }

  function renderReport() {
    var box = host('report');
    if (!box) return;
    var f = S.facts;
    var rows = [
      { k: pick(f[2].label), v: pick(f[2].value), s: 'ui.stLive', c: 'warn' },
      { k: pick(f[0].label), v: pick(f[0].value), s: 'ui.stSet', c: 'on' },
      { k: pick(f[1].label), v: pick(f[1].value), s: 'ui.stSet', c: 'on' },
      { k: pick(f[4].label), v: pick(f[4].value), s: 'ui.stPrimary', c: 'on' },
      { k: pick(f[3].label), v: pick(f[3].value), s: 'ui.stActive', c: 'on' }
    ];
    rows.forEach(function (r, i) {
      var row = el('div', 'datarow');
      row.setAttribute('data-od-id', 'report-row-' + (i + 1));
      row.appendChild(el('div', 'datarow__k', r.k));
      row.appendChild(el('div', 'datarow__v', r.v));
      row.appendChild(el('div', 'datarow__s datarow__s--' + r.c, t(r.s)));
      box.appendChild(row);
    });
  }

  function renderCapabilities() {
    var box = host('capabilities');
    if (!box) return;
    S.services.forEach(function (s) {
      var row = el('div', 'cap');
      row.setAttribute('data-od-id', 'capability-' + s.number);
      var head = el('div', 'cap__head');
      head.appendChild(el('span', 'cap__num', s.number));
      head.appendChild(el('span', 'cap__title', pick(s.title)));
      row.appendChild(head);
      row.appendChild(el('p', 'cap__text', pick(s.text)));
      box.appendChild(row);
    });
  }

  var CASES = ['engineer-companion', 'vetka-dwg', 'geoconverter'];

  function renderCases() {
    var box = $('#cases');
    if (!box) return;
    box.innerHTML = '';
    CASES.forEach(function (key, i) {
      var p = CONTRACT.projects[key];
      var col = el('div', 'casecol');
      col.setAttribute('data-od-id', 'casecol-' + p.slug);
      var panel = el('article', 'casepanel');
      panel.setAttribute('data-od-id', 'case-' + p.slug);

      var full = el('div', 'casepanel__full');
      full.appendChild(el('span', 'case__tab', ('0' + (i + 1)).slice(-2)));
      full.appendChild(el('h3', 'case__title', pick(p.title)));
      full.appendChild(el('p', 'case__role', pick(p.summary)));

      var metrics = el('div', 'case__metrics');
      p.results.forEach(function (r, j) {
        var m = el('div', 'case__metric');
        m.setAttribute('data-od-id', 'case-metric-' + p.slug + '-' + (j + 1));
        m.appendChild(el('b', null, r.value));
        m.appendChild(el('span', null, pick(r.label)));
        metrics.appendChild(m);
      });
      full.appendChild(metrics);

      var stack = el('div', 'case__stack');
      p.stack.forEach(function (s) { stack.appendChild(el('span', null, s)); });
      full.appendChild(stack);

      var foot = el('div', 'case__foot');
      foot.appendChild(el('span', 'case__status', pick(S.status_labels[p.status])));
      var link = el('a', 'case__link', t('ui.caseOpen') + ' \u2197');
      link.setAttribute('href', p.links[0].url);
      link.setAttribute('rel', 'noopener');
      foot.appendChild(link);
      full.appendChild(foot);
      panel.appendChild(full);

      var compact = el('div', 'casepanel__compact');
      compact.appendChild(el('span', 'case__tab', ('0' + (i + 1)).slice(-2)));
      compact.appendChild(el('span', 'case__ctitle', pick(p.title)));
      compact.appendChild(el('span', 'case__cmetric', p.results[0].value + ' \u00b7 ' + pick(p.results[0].label)));
      panel.appendChild(compact);

      col.appendChild(panel);
      box.appendChild(col);
    });
  }

  function renderIdentity() {
    var eb = $('#identity-eyebrow');
    if (eb) eb.textContent = pick(S.role);
    var nm = $('#identity-name');
    if (nm) nm.textContent = pick(S.name);
    var ld = $('#identity-lead');
    if (ld) ld.textContent = pick(S.hero.lead);
    var side = $('#identity-side');
    if (side) {
      side.innerHTML = '';
      var av = el('span', 'pill pill--amber');
      av.appendChild(el('span', null, t('ui.avail')));
      av.appendChild(el('span', null, pick(S.facts[2].value)));
      side.appendChild(av);
      side.appendChild(el('span', 'pill pill--ghost', pick(S.location)));
      side.appendChild(el('span', 'pill pill--ghost', S.timezone));
      side.appendChild(el('span', 'pill pill--lav', pick(S.facts[4].value)));
    }
  }

  function fillLinks() {
    var mail = $('#contact-mail');
    if (mail) {
      mail.setAttribute('href', 'mailto:' + S.email);
      var lbl = $('#contact-mail-text');
      if (lbl) lbl.textContent = S.email;
    }
    var gh = $('#cta-github'); if (gh) gh.setAttribute('href', S.github);
    var li = $('#cta-linkedin'); if (li) li.setAttribute('href', S.linkedin);
    var dm = $('#cta-domain'); if (dm) dm.setAttribute('href', S.domain);
    var sp = $('#cta-space');
    if (sp) {
      var found = null;
      S.more.forEach(function (m) { if (!found && /Open Space/i.test(m.title.en)) found = m; });
      if (found) sp.setAttribute('href', found.url);
    }
    var desc = $('#meta-desc');
    if (desc) desc.setAttribute('content', pick(S.seo.description));
    document.title = pick(S.seo.title);
  }

  function applyI18n() {
    $$('[data-i18n]').forEach(function (n) {
      var v = t(n.getAttribute('data-i18n'));
      if (v) n.textContent = v;
    });
    var nb = $('.railblock__name');
    if (nb) nb.textContent = t('ui.who');
    HTML.setAttribute('lang', LANG);
    HTML.setAttribute('data-lang', LANG);
    $$('.railblock__langbtn').forEach(function (b) {
      if (b.getAttribute('data-lang') === LANG) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }

  function startClock() {
    var box = $('#clock');
    if (!box) return;
    function tick() {
      var d = new Date();
      var hh = String(d.getUTCHours() + 3).padStart(2, '0');
      var mm = String(d.getUTCMinutes()).padStart(2, '0');
      var ss = String(d.getUTCSeconds()).padStart(2, '0');
      box.textContent = hh + ':' + mm + ':' + ss;
    }
    tick();
    setInterval(tick, 1000);
  }

  /* =================================================================
     the drawings
     ================================================================= */
  function parts(root) {
    return $$('path,line,polyline,ellipse,circle', root);
  }
  function dash(root) {
    parts(root).forEach(function (n) {
      var len = 0;
      try { len = n.getTotalLength(); } catch (e) { len = 0; }
      if (!len) return;
      n.style.strokeDasharray = len + ' ' + len;
      n.style.strokeDashoffset = len;
    });
    $$('text', root).forEach(function (x) { x.style.opacity = 0; });
  }
  function undash(root) {
    parts(root).forEach(function (n) { n.style.strokeDashoffset = 0; });
    $$('text', root).forEach(function (x) { x.style.opacity = 1; });
  }

  /* the MLC leaf banks: closed at the centre, opened to the field outline */
  var LEAF_MID = 450;
  function leafGeom(n) {
    var d = n.getAttribute('d') || '';
    var v = (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
    if (v.length < 6) return null;
    var base, tip;
    if (v[0] < LEAF_MID) { base = v[0]; tip = v[2]; }
    else { base = v[2]; tip = v[0]; }
    return { base: base, tip: tip, y0: v[1], y1: v[5] };
  }
  function leafPath(g, tip) {
    return 'M ' + g.base + ' ' + g.y0 + ' L ' + tip.toFixed(2) + ' ' + g.y0 +
           ' L ' + tip.toFixed(2) + ' ' + g.y1 + ' L ' + g.base + ' ' + g.y1 + ' Z';
  }
  function closeLeaves(root) {
    $$('.leaf', root).forEach(function (n) {
      var g = leafGeom(n);
      if (!g) return;
      n.__g = g;
      n.setAttribute('d', leafPath(g, LEAF_MID));
    });
  }
  function openLeaves(root, p) {
    $$('.leaf', root).forEach(function (n) {
      var g = n.__g;
      if (!g) return;
      n.setAttribute('d', leafPath(g, LEAF_MID + (g.tip - LEAF_MID) * p));
    });
  }

  /* ---------- the leader wires ---------- */
  function drawWires(state) {
    var svg = $('#wires');
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return;
    svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);

    var map = WIRES[state];
    if (!map) return;
    var dwg = $('#plate');
    if (state === 2) dwg = $('#dose');
    if (state === 3) dwg = $('#mlc');
    if (!dwg) return;
    var inner = dwg.querySelector('svg');
    if (!inner) return;

    var grid = $('#readouts-grid');
    if (!grid) return;
    var cells = $$('.readout', grid);
    var gridBox = grid.getBoundingClientRect();

    var busY = gridBox.top - box.top - 12;
    var busL = gridBox.left - box.left + 6;
    var busR = gridBox.right - box.left - 6;
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', 'M ' + busL.toFixed(1) + ' ' + busY.toFixed(1) +
                    ' L ' + busR.toFixed(1) + ' ' + busY.toFixed(1));
    p.setAttribute('data-od-id', 'wire-bus');
    svg.appendChild(p);

    map.forEach(function (w) {
      var txt = null;
      $$('text', inner).forEach(function (x) {
        if (!txt && x.textContent.trim() === w.t) txt = x;
      });
      if (!txt) return;
      var r = txt.getBoundingClientRect();
      if (!r.width) return;
      var fx = r.left - box.left + r.width / 2;
      var fy = r.bottom - box.top;
      var cell = cells[w.c];
      if (!cell) return;
      var cb = cell.getBoundingClientRect();
      var cx = cb.left - box.left + cb.width / 2;
      var midY = busY - 18;
      var q = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      q.setAttribute('d', 'M ' + fx.toFixed(1) + ' ' + fy.toFixed(1) +
                      ' L ' + fx.toFixed(1) + ' ' + midY.toFixed(1) +
                      ' L ' + cx.toFixed(1) + ' ' + midY.toFixed(1) +
                      ' L ' + cx.toFixed(1) + ' ' + busY.toFixed(1));
      q.setAttribute('data-od-id', 'wire-' + w.c);
      svg.appendChild(q);
    });
  }


  /* =================================================================
     THE DIAL - the scroll is a mode dial
     -----------------------------------------------------------------
     Six poses on one scrubbed timeline: BOOT, MACHINE, DOSE, LEAVES,
     WORK, REST.  The frame never moves.  The centre changes by
     MORPHING: the outgoing drawing only leaves once the incoming one
     has arrived, so the middle of the console is never empty.
     ================================================================= */
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var currentState = -1;
  var timeline = null;

  function delta(fromEl, toEl) {
    var a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    return { x: (b.left + b.width / 2) - (a.left + a.width / 2),
             y: (b.top + b.height / 2) - (a.top + a.height / 2) };
  }

  /* ---------- the readout counters ---------- */
  function countReadouts(state) {
    var set = SETS[state] || [];
    var nodes = $$('#readouts-grid .readout__n');
    nodes.forEach(function (node, i) {
      var spec = set[i];
      if (!spec) return;
      if (!window.gsap) { node.textContent = readoutText(spec, spec.n); return; }
      var obj = { n: 0 };
      gsap.to(obj, {
        n: spec.n, duration: SPAN, ease: 'power2.out',
        onUpdate: function () { node.textContent = readoutText(spec, obj.n); },
        onComplete: function () { node.textContent = readoutText(spec, spec.n); }
      });
    });
  }

  function readoutText(spec, v) {
    if (spec.d) return v.toFixed(spec.d).replace('.', ',');
    return group(Math.round(v));
  }

  /* ---------- the ladder: the notch steps down the bars ---------- */
  function markState(state) {
    $$('.ladder__row').forEach(function (row) {
      row.classList.toggle('is-active', Number(row.getAttribute('data-state')) === state);
    });
    var notch = $('.ladder__notch');
    var row = $('.ladder__row[data-state="' + state + '"]');
    if (notch && row) {
      var top = row.offsetTop + (row.offsetHeight - notch.offsetHeight) / 2;
      if (window.gsap) gsap.to(notch, { top: top + 'px', duration: 0.35, ease: 'power2.out' });
      else notch.style.top = top + 'px';
    }
    var mode = $('#mode-value');
    if (mode) mode.textContent = t('ui.state' + state);
  }

  /* ---------- the discrete part of the dial ---------- */
  function onScroll(state) {
    if (state === currentState) return;
    currentState = state;
    markState(state);
    renderReadouts(state);
    countReadouts(state);
    drawWires(state);
    if (window.gsap) {
      gsap.to('#readouts-grid', { opacity: 1, duration: 0.25, ease: 'none' });
      /* at rest the portfolio folds into its dense rows */
      var full = state === 5 ? 0 : (state >= 4 ? 1 : 0);
      gsap.to('.casepanel__full', { opacity: full, duration: 0.3, ease: 'none' });
      gsap.to('.casepanel__compact', { opacity: state === 5 ? 1 : 0, duration: 0.3, ease: 'none' });
      /* the dense report fills the bottom-left in the work state */
      var rep = $('#panel-report');
      if (rep) {
        var h = rep.scrollHeight;
        gsap.to(rep, { height: state >= 4 ? h : 0, opacity: state >= 4 ? 1 : 0,
                       duration: 0.4, ease: 'power2.out' });
      }
      var contact = $('.contact');
      if (contact) gsap.to(contact, { opacity: state >= 4 ? 1 : 0, duration: 0.35, ease: 'none' });
    }
  }

  /* ---------- the boot animation ---------- */
  function bootAnimation() {
    if (!window.gsap) return;
    /* the amber rail extends in from the LEFT EDGE of the screen */
    gsap.fromTo('.frame__rail', { scaleX: 0 },
      { scaleX: 1, duration: 1.1, ease: 'power3.out', transformOrigin: 'left center' });
    /* the spine draws DOWN the full height */
    gsap.fromTo('.frame__spine', { scaleY: 0 },
      { scaleY: 1, duration: 1.3, ease: 'power3.out', transformOrigin: 'left top' });
    /* the label block drops from the top edge */
    gsap.fromTo('.railblock', { yPercent: -120, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.15 });
    gsap.fromTo('.ladder__row', { x: 40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: 'power3.out', delay: 0.35 });
    gsap.fromTo('.modebar', { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.5 });
    gsap.fromTo('#crosshair', { opacity: 0, scale: 0.4 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out', delay: 0.55 });
    gsap.fromTo('.dwg--plate', { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.7 });
  }

  /* ---------- reduced motion: the console renders in its rest state ---------- */
  function renderRest() {
    currentState = 5;
    markState(5);
    renderReadouts(5);
    $$('#readouts-grid .readout__n').forEach(function (node, i) {
      var spec = (SETS[5] || [])[i];
      if (spec) node.textContent = readoutText(spec, spec.n);
    });
    ['#plate', '#dose', '#mlc', '#wave'].forEach(function (sel) {
      var n = $(sel);
      if (n) { n.style.opacity = sel === '#plate' ? '1' : '0'; n.style.transform = 'none'; }
    });
    var plateSvg = $('#plate svg');
    if (plateSvg) undash(plateSvg);
    var cross = $('#crosshair');
    if (cross) cross.style.opacity = '0';
    var rep = $('#panel-report');
    if (rep) { rep.style.height = 'auto'; rep.style.opacity = '1'; }
    var contact = $('.contact');
    if (contact) contact.style.opacity = '1';
    var full = $('.casepanel__full');
    if (full) full.style.opacity = '0';
    var compact = $('.casepanel__compact');
    if (compact) compact.style.opacity = '1';
    drawWires(5);
  }

  /* ---------- layout ---------- */
  function layout() {
    if (timeline && timeline.invalidate) timeline.invalidate();
    drawWires(currentState < 0 ? 0 : currentState);
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  /* ---------- the language switch ---------- */
  function applyLang(lang) {
    LANG = lang;
    applyI18n();
    renderIdentity();
    renderLadder();
    renderRecord();
    renderReport();
    renderCapabilities();
    renderCases();
    fillLinks();
    markState(currentState < 0 ? 0 : currentState);
    renderReadouts(currentState < 0 ? 0 : currentState);
    layout();
  }

  /* =================================================================
     THE TIMELINE
     ================================================================= */
  function drawIn(svg, tl, at, dur) {
    if (!svg) return;
    dash(svg);
    var nodes = parts(svg);
    if (!nodes.length) return;
    if (!tl || !window.gsap) { undash(svg); return; }
    nodes.forEach(function (n, i) {
      var len = 0;
      try { len = n.getTotalLength(); } catch (e) { len = 0; }
      if (!len) return;
      tl.fromTo(n, { strokeDashoffset: len },
        { strokeDashoffset: 0, duration: dur, ease: 'none', immediateRender: false },
        at + i * 0.004);
    });
    $$('text', svg).forEach(function (x, i) {
      tl.fromTo(x, { opacity: 0 }, { opacity: 1, duration: 0.25, immediateRender: false }, at + 0.45 + i * 0.02);
    });
  }

  function buildTimeline() {
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#track',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.45
      }
    });

    var plateSvg = $('#plate svg');
    var doseSvg = $('#dose svg');
    var mlcSvg = $('#mlc svg');
    var waveSvg = $('#wave svg');
    var railcap = $('#railcap');
    var railcapR = $('#railcap-right');

    /* ---------- 0 -> 1 : BOOT becomes THE MACHINE ---------- */
    tl.fromTo('#plate', { opacity: 0, scale: 0.97 },
      { opacity: 1, scale: 1, ease: 'none', immediateRender: false }, 0);
    tl.to('#crosshair', { opacity: 0, ease: 'none', immediateRender: false }, 0);
    drawIn(plateSvg, tl, 0.05, 0.85);
    tl.fromTo('#readouts-grid', { opacity: 0 }, { opacity: 1, ease: 'none', immediateRender: false }, 0.16);

    /* ---------- 1 -> 2 : the machine parks in the rail, the dose comes ---------- */
    if (railcap) {
      tl.to('#plate', {
        scale: function () { return 104 / $('#plate svg').getBoundingClientRect().width; },
        x: function () { return delta($('#plate svg'), railcap).x; },
        y: function () { return delta($('#plate svg'), railcap).y; },
        transformOrigin: 'center center', ease: 'none', immediateRender: false
      }, 1);
      tl.to('#railcap', { opacity: 1, ease: 'none', immediateRender: false }, 1.15);
    }
    tl.to('#plate', { opacity: 0, duration: 0.3, ease: 'none', immediateRender: false }, 1.5);
    tl.fromTo('#dose', { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'none', immediateRender: false }, 1.4);
    drawIn(doseSvg, tl, 1.5, 0.75);

    /* ---------- 2 -> 3 : the dose slides out, the leaves come in ---------- */
    tl.to('#dose', { opacity: 0, x: 130, duration: 0.3, ease: 'none', immediateRender: false }, 2.1);
    tl.fromTo('#mlc', { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'none', immediateRender: false }, 2.0);
    drawIn(mlcSvg, tl, 2.25, 0.7);
    /* the leaf banks slide open leaf by leaf until the aperture is the field */
    if (mlcSvg && window.gsap) {
      closeLeaves(mlcSvg);
      var leafP = { p: 0 };
      tl.to(leafP, {
        p: 1, duration: 0.7, ease: 'power2.inOut', immediateRender: false,
        onUpdate: function () { openLeaves(mlcSvg, leafP.p); }
      }, 2.35);
    }

    /* ---------- 3 -> 4 : the leaves collapse into the bar, the work comes ---------- */
    if (railcapR) {
      tl.to('#mlc', {
        scale: function () { return 74 / $('#mlc svg').getBoundingClientRect().width; },
        x: function () { return delta($('#mlc svg'), railcapR).x; },
        y: function () { return delta($('#mlc svg'), railcapR).y; },
        transformOrigin: 'center center', ease: 'none', immediateRender: false
      }, 3);
      tl.to('#railcap-right', { opacity: 1, ease: 'none', immediateRender: false }, 3.35);
    }
    tl.to('#mlc', { opacity: 0, duration: 0.3, ease: 'none', immediateRender: false }, 3.1);
    /* the beam beats while the portfolio arrives */
    tl.fromTo('#wave', { opacity: 0, scale: 0.97 },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'none', immediateRender: false }, 3.0);
    drawIn(waveSvg, tl, 3.15, 0.55);
    tl.fromTo('.casepanel__full', { opacity: 0, xPercent: -104 },
      { opacity: 1, xPercent: 0, stagger: 0.12, ease: 'power2.out', immediateRender: false }, 3.5);

    /* ---------- 4 -> 5 : REST - the plate comes home, the counters finish ---------- */
    tl.to('#wave', { opacity: 0, duration: 0.3, ease: 'none', immediateRender: false }, 4.05);
    tl.to('#railcap', { opacity: 0, ease: 'none', immediateRender: false }, 4.1);
    tl.to('#railcap-right', { opacity: 0, ease: 'none', immediateRender: false }, 4.15);
    tl.fromTo('#plate', { opacity: 0, scale: 0.94 },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'none', immediateRender: false }, 3.95);

    return tl;
  }

  /* ---------- boot ---------- */
  function boot() {
    applyI18n();
    renderIdentity();
    renderLadder();
    renderRecord();
    renderReport();
    renderCapabilities();
    renderCases();
    fillLinks();
    startClock();

    /* the language switch is a real link to the other route: / and /ru/
       are two static pages built from the same markup, so the switch
       works on any static host with no server routing */
    window.addEventListener('popstate', function () {
      applyLang(/\/ru(\/|$)/.test(location.pathname) ? 'ru' : 'en');
    });

    if (reduced) {
      renderRest();
      return;
    }

    renderReadouts(0);
    timeline = buildTimeline();
    bootAnimation();
    onScroll(0);

    /* the dial's discrete state: which pose are we in? */
    if (window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: '#track', start: 'top top', end: 'bottom bottom', scrub: true,
        onUpdate: function (self) {
          var s = Math.min(5, Math.max(0, Math.round(self.progress * 5)));
          if (s !== currentState) onScroll(s);
        }
      });
    }

    var tmr;
    window.addEventListener('resize', function () {
      clearTimeout(tmr);
      tmr = setTimeout(layout, 150);
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { setTimeout(layout, 60); });
    }
    setTimeout(layout, 800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

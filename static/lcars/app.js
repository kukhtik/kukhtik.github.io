/* ================================================================
   LCARS portfolio — behaviour
   - bilingual rendering from one markup (EN `/`, RU `/ru/`)
   - L-elbows generated as ONE connected path per framed block
   - GSAP + ScrollTrigger (vendored): runs extend, blocks reveal,
     counters count, the linac / isodose drawings draw themselves
   - honours prefers-reduced-motion
   ================================================================ */
(function () {
  'use strict';

  var CONTRACT = JSON.parse(document.getElementById('contract').textContent);
  var S = CONTRACT.site;

  /* ---------- interface copy (RU + EN) ---------- */
  var UI = {
    'ui.capLabel':        { en: 'Python / AI',            ru: 'Python / AI' },
    'ui.contact':         { en: 'Email me',               ru: 'Написать' },
    'ui.tagRag':          { en: 'Offline RAG',            ru: 'Offline RAG' },
    'ui.tagCad':          { en: 'CAD / GIS',              ru: 'CAD / GIS' },
    'ui.tagAgents':       { en: 'LLM agents',             ru: 'LLM-агенты' },

    'ui.statusLegend':    { en: 'Status report',          ru: 'Сводка' },
    'ui.statusTag':       { en: '5 parameters',           ru: '5 параметров' },

    'ui.schematicLegend': { en: 'Linear accelerator · TrueBeam', ru: 'Линейный ускоритель · TrueBeam' },
    'ui.schematicNote':   { en: 'Schematic · not to scale', ru: 'Схема · не в масштабе' },
    'ui.stateLegend':     { en: 'Machine readout',        ru: 'Показания установки' },
    'ui.beamLegend':      { en: 'Dose distribution',      ru: 'Распределение дозы' },
    'ui.linacCapLeft':    { en: 'Gantry · head · MLC · isocentre', ru: 'Гантри · головка · MLC · изоцентр' },
    'ui.linacCapRight':   { en: 'Varian TrueBeam / VitalBeam', ru: 'Varian TrueBeam / VitalBeam' },

    'ui.instrumentLegend':{ en: 'Instrument set',         ru: 'Комплект приборов' },
    'ui.instrumentNote':  { en: 'Read off the machine above', ru: 'Снято с установки выше' },
    'ui.isodoseTitle':    { en: 'Isodose · central axis',  ru: 'Изодоза · центральная ось' },
    'ui.isodoseTag':      { en: '6 MV · sagittal',         ru: '6 МВ · сагитталь' },
    'ui.isodoseCap':      { en: 'Dose falls from the hot amber core through coral to the cold fringe; d-max 1.5 cm, d90 6.0 cm, d50 17.4 cm in water.',
                            ru: 'Доза падает от горячего янтарного центра через коралловый к холодной кромке; d-max 1.5 см, d90 6.0 см, d50 17.4 см в воде.' },
    'ui.mlcTitle':        { en: 'MLC leaf pattern',       ru: 'Раскладка лепестков MLC' },
    'ui.mlcTag':          { en: 'Aperture plane',         ru: 'Плоскость апертуры' },
    'ui.mlcCap':          { en: 'Two banks of tungsten leaves close on a 10 × 10 cm field at the isocentre — the aperture the beam actually takes.',
                            ru: 'Две банки вольфрамовых лепестков смыкаются на поле 10 × 10 см в изоцентре — та самая апертура, которую принимает пучок.' },
    'ui.waveTitle':       { en: 'Beam-on pulse train',    ru: 'Импульсы пучка' },
    'ui.waveTag':         { en: '6 MV · pulsed',           ru: '6 МВ · импульсный' },
    'ui.waveCap':         { en: 'Six pulses of 2.8 ms in an 8 ms period — a 35 % duty cycle, the reason the dosimetry checks are repeatable.',
                            ru: 'Шесть импульсов по 2.8 мс в периоде 8 мс — скважность 35 %, поэтому дозиметрические проверки повторяемы.' },

    'ui.capabilitiesLegend': { en: 'Capabilities',         ru: 'Возможности' },
    'ui.capabilitiesNote':   { en: 'What I build · 3 areas', ru: 'Что я делаю · 3 направления' },
    'ui.stackLegend':     { en: 'Toolchain',              ru: 'Стек' },
    'ui.stackTag':        { en: 'Per project',            ru: 'По проектам' },

    'ui.workLegend':      { en: 'Selected work',          ru: 'Избранные работы' },
    'ui.workNote':        { en: 'Measured results · NDA-safe', ru: 'Измеренные результаты · под NDA' },
    'ui.approach':        { en: 'Approach',               ru: 'Подход' },
    'ui.problem':         { en: 'Problem',                ru: 'Задача' },
    'ui.confidentiality': { en: 'Disclosure',             ru: 'О раскрытии' },
    'ui.stack':           { en: 'Stack',                  ru: 'Стек' },

    'ui.recordLegend':    { en: 'Service record',         ru: 'Служебная запись' },
    'ui.recordNote':      { en: '2020 → 2026',            ru: '2020 → 2026' },
    'ui.spaceLegend':     { en: 'Open space',             ru: 'Открытое пространство' },
    'ui.spaceTag':        { en: 'Elsewhere',              ru: 'В другом месте' },
    'ui.open':            { en: 'Open',                  ru: 'Открыть' },
    'ui.disclosureLegend':{ en: 'Disclosure',             ru: 'О раскрытии' },
    'ui.disclosureTag':   { en: 'Per project',            ru: 'По проектам' },

    'ui.aboutLegend':     { en: 'About',                  ru: 'Обо мне' },
    'ui.aboutNote':       { en: 'Nine years on the machine', ru: 'Девять лет на машине' },
    'ui.availabilityLegend': { en: 'Availability',         ru: 'Доступность' },
    'ui.availabilityTag': { en: 'Start / base / language', ru: 'Старт / база / язык' },

    'ui.contactLegend':   { en: 'Contact',                ru: 'Контакт' },
    'ui.contactNote':     { en: 'One primary channel',    ru: 'Один основной канал' },
    'ui.contactTitle':    { en: 'Let us talk about the work', ru: 'Поговорим о работе' },
    'ui.contactPanelLegend': { en: 'Direct',              ru: 'Прямо' },
    'ui.contactPanelTag': { en: 'Replies within 2 days',   ru: 'Ответ в течение 2 дней' },

    'ui.cv':              { en: 'Résumé',                 ru: 'Резюме' },
    'ui.footerLeft':      { en: 'LCARS portfolio · built from real service data', ru: 'Портфолио LCARS · построено на реальных сервисных данных' },

    'ui.email':           { en: 'Email',                  ru: 'Почта' },
    'ui.github':          { en: 'GitHub',                 ru: 'GitHub' },
    'ui.linkedin':        { en: 'LinkedIn',               ru: 'LinkedIn' },
    'ui.location':        { en: 'Based',                  ru: 'База' },
    'ui.timezone':        { en: 'Timezone',               ru: 'Часовой пояс' },
    'ui.english':         { en: 'English',                ru: 'Английский' },

    'ro.gantry':          { en: 'Gantry angle',           ru: 'Угол гантри' },
    'ro.sad':             { en: 'SAD',                    ru: 'SAD' },
    'ro.field':           { en: 'Field at isocentre',     ru: 'Поле в изоцентре' },
    'ro.mlc':             { en: 'MLC aperture',           ru: 'Апертура MLC' },
    'ro.iso':             { en: 'Isocentre offset',       ru: 'Смещение изоцентра' },
    'ro.dmax':            { en: 'Dose d-max',             ru: 'Доза d-max' },
    'ro.d90':             { en: 'Depth d90',              ru: 'Глубина d90' },
    'ro.d50':             { en: 'Depth d50',              ru: 'Глубина d50' },
    'ro.mode':            { en: 'Mode',                   ru: 'Режим' },
    'ro.energy':          { en: 'Nominal energy',         ru: 'Номинальная энергия' },
    'ro.mv':              { en: 'Monitor units',          ru: 'MU' },
    'ro.rate':            { en: 'Dose rate',              ru: 'Мощность дозы' },
    'ro.freq':            { en: 'Pulse frequency',        ru: 'Частота импульсов' },
    'ro.duty':            { en: 'Duty cycle',             ru: 'Скважность' }
  };

  /* machine readouts — every value is read off the drawings in assets/ */
  var READOUT_STATE = [
    { k: 'ro.gantry', v: '000', u: '°' },
    { k: 'ro.sad',    v: '100', u: 'cm' },
    { k: 'ro.field',  v: '20',  u: 'cm' },
    { k: 'ro.mlc',    v: '10 × 10', u: 'cm' },
    { k: 'ro.iso',    v: '0.0', u: 'mm' },
    { k: 'ro.mode',   v: '6',   u: 'MV' }
  ];
  var READOUT_BEAM = [
    { k: 'ro.energy', v: '6',   u: 'MV' },
    { k: 'ro.mv',     v: '120', u: 'MU/min' },
    { k: 'ro.rate',   v: '600', u: 'cGy/min' },
    { k: 'ro.freq',   v: '125', u: 'Hz' },
    { k: 'ro.duty',   v: '35',  u: '%' },
    { k: 'ro.dmax',   v: '1.5', u: 'cm' }
  ];

  var LANG = 'en';

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    var list = root ? root.querySelectorAll(sel) : document.querySelectorAll(sel);
    return Array.prototype.slice.call(list);
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
    if (UI[key]) return UI[key][LANG] !== undefined ? UI[key][LANG] : UI[key].en;
    var parts = key.split('.'), node = CONTRACT;
    for (var i = 0; i < parts.length; i++) {
      if (node === undefined || node === null) return '';
      node = node[parts[i]];
    }
    return pick(node);
  }
  function host(name) {
    var box = document.querySelector('[data-render="' + name + '"]');
    if (!box) return null;
    box.innerHTML = '';
    return box;
  }

  /* ---------- counters ---------- */
  function counterHTML(value) {
    return String(value).replace(/\d[\d,]*/g, function (tok) {
      var target = parseInt(tok.replace(/,/g, ''), 10);
      var comma = tok.indexOf(',') > -1;
      return '<span class="cnt" data-to="' + target + '" data-comma="' + (comma ? 1 : 0) + '">0</span>';
    });
  }
  function formatNum(n, comma) {
    var s = String(n);
    if (comma) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return s;
  }

  /* ---------- rendering ---------- */
  function renderFacts() {
    var box = host('facts');
    if (!box) return;
    S.facts.forEach(function (f) {
      var row = el('div', 'datarow');
      row.appendChild(el('div', 'datarow__k', pick(f.label)));
      row.appendChild(el('div', 'datarow__v datarow__v--fg', pick(f.value)));
      box.appendChild(row);
    });
  }

  function renderReadouts() {
    var state = host('readout-state');
    if (state) {
      READOUT_STATE.forEach(function (r) {
        var row = el('div', 'readout__row');
        row.appendChild(el('div', 'readout__k', t(r.k)));
        var v = el('div', 'readout__v');
        v.textContent = r.v;
        var u = el('span');
        u.textContent = ' ' + r.u;
        v.appendChild(u);
        row.appendChild(v);
        state.appendChild(row);
      });
    }
    var beam = host('readout-beam');
    if (beam) {
      READOUT_BEAM.forEach(function (r) {
        var row = el('div', 'readout__row');
        row.appendChild(el('div', 'readout__k', t(r.k)));
        var v = el('div', 'readout__v');
        v.textContent = r.v;
        var u = el('span');
        u.textContent = ' ' + r.u;
        v.appendChild(u);
        row.appendChild(v);
        beam.appendChild(row);
      });
    }
  }

  function renderRecord() {
    var box = host('record');
    if (!box) return;
    var colours = ['coral', 'salmon', 'amber'];
    S.record.forEach(function (r, i) {
      var row = el('div', 'rec__row');
      var head = el('div', 'rec__head');
      var bar = el('span', 'rec__bar');
      bar.style.setProperty('--rec-c', 'var(--' + colours[i % colours.length] + ')');
      bar.setAttribute('data-od-id', 'record-bar-' + (i + 1));
      head.appendChild(bar);
      head.appendChild(el('span', 'rec__when', r.when));
      row.appendChild(head);
      row.appendChild(el('div', 'rec__title', pick(r.title)));
      row.appendChild(el('p', 'rec__text', pick(r.text)));
      box.appendChild(row);
    });
  }

  function renderServices() {
    var box = host('services');
    if (!box) return;
    var cls = ['cap', 'cap cap--lav', 'cap cap--amber'];
    S.services.forEach(function (s, i) {
      var row = el('div', cls[i % cls.length]);
      row.setAttribute('data-od-id', 'capability-' + s.number);
      var left = el('div');
      left.appendChild(el('div', 'cap__num', s.number));
      left.appendChild(el('div', 'cap__title', pick(s.title)));
      row.appendChild(left);
      row.appendChild(el('p', 'cap__text', pick(s.text)));
      box.appendChild(row);
    });
  }

  /* the toolchain panel: one dense row per project, real stacks */
  function renderStacks() {
    var box = host('stacks');
    if (!box) return;
    var order = ['engineer-companion', 'vetka-dwg', 'geoconverter'];
    var colours = ['coral', 'lav', 'amber'];
    order.forEach(function (key, i) {
      var p = CONTRACT.projects[key];
      var row = el('div', 'row row--' + colours[i % colours.length]);
      row.setAttribute('data-od-id', 'stack-row-' + (i + 1));
      row.appendChild(el('span', 'row__bar'));
      var body = el('div');
      body.appendChild(el('div', 'row__t', pick(p.title)));
      var x = el('p', 'row__x');
      x.textContent = p.stack.join(' · ');
      body.appendChild(x);
      row.appendChild(body);
      box.appendChild(row);
    });
  }

  function renderMore() {
    var box = host('more');
    if (!box) return;
    S.more.forEach(function (m, i) {
      var row = el('div', 'row row--' + (i === 0 ? 'amber' : 'coral'));
      row.setAttribute('data-od-id', 'more-row-' + (i + 1));
      row.appendChild(el('span', 'row__bar'));
      var body = el('div');
      body.appendChild(el('div', 'row__t', pick(m.title)));
      body.appendChild(el('p', 'row__x', pick(m.text)));
      row.appendChild(body);
      box.appendChild(row);
    });
  }

  /* disclosure rows: the three project states, verbatim from the contract */
  function renderDisclosure() {
    var box = host('disclosure');
    if (!box) return;
    var order = ['engineer-companion', 'vetka-dwg', 'geoconverter'];
    order.forEach(function (key) {
      var p = CONTRACT.projects[key];
      var row = el('div', 'datarow');
      row.appendChild(el('div', 'datarow__k', pick(p.title)));
      row.appendChild(el('div', 'datarow__v datarow__v--coral', pick(S.status_labels[p.status])));
      box.appendChild(row);
    });
  }

  function renderAvailability() {
    var box = host('availability');
    if (!box) return;
    var rows = [
      { k: 'ui.availability', v: pick(S.facts[2].value) },
      { k: 'ui.location', v: pick(S.facts[0].value) },
      { k: 'ui.timezone', v: pick(S.facts[1].value) },
      { k: 'ui.english', v: pick(S.facts[3].value) }
    ];
    rows.forEach(function (r) {
      var row = el('div', 'datarow');
      row.appendChild(el('div', 'datarow__k', t(r.k)));
      row.appendChild(el('div', 'datarow__v datarow__v--amber', r.v));
      box.appendChild(row);
    });
  }

  function renderContact() {
    var box = host('contact');
    if (!box) return;
    var rows = [
      { k: 'ui.email', v: S.email },
      { k: 'ui.github', v: 'github.com/kukhtik' },
      { k: 'ui.linkedin', v: 'linkedin.com/in/max-kukhto' },
      { k: 'ui.cv', v: pick(S.cv).replace('assets/', '') },
      { k: 'ui.timezone', v: S.timezone }
    ];
    rows.forEach(function (r) {
      var row = el('div', 'datarow');
      row.appendChild(el('div', 'datarow__k', t(r.k)));
      row.appendChild(el('div', 'datarow__v datarow__v--fg', r.v));
      box.appendChild(row);
    });
  }

  function aboutList() {
    var a = S.about;
    if (!a) return [];
    if (Array.isArray(a)) return a;
    if (Array.isArray(a.items)) return a.items;
    if (Array.isArray(a.paragraphs)) return a.paragraphs;
    if (typeof a.text === 'string') return [a.text];
    return [];
  }

  function renderAbout() {
    var box = host('about');
    if (!box) return;
    pick(S.about).forEach(function (p, i) {
      var para = el('p', 'about__p');
      para.setAttribute('data-od-id', 'about-paragraph-' + (i + 1));
      para.textContent = p;
      box.appendChild(para);
    });
  }

  function renderCards() {
    var box = host('projects');
    if (!box) return;
    var order = ['engineer-companion', 'vetka-dwg', 'geoconverter'];
    var accents = ['lav', 'coral', 'amber'];
    order.forEach(function (key, idx) {
      var p = CONTRACT.projects[key];
      var card = el('article', 'card');
      card.style.setProperty('--card-c', 'var(--' + accents[idx] + ')');
      card.setAttribute('data-od-id', 'card-' + p.slug);

      var top = el('div', 'card__top');
      top.appendChild(el('span', 'card__bar'));
      top.appendChild(el('span', 'card__idx', '0' + (idx + 1)));
      top.appendChild(el('span', 'pill pill--' + accents[idx], pick(S.status_labels[p.status])));
      card.appendChild(top);

      card.appendChild(el('h3', 'card__title', pick(p.title)));
      card.appendChild(el('p', 'card__summary', pick(p.summary)));

      var metrics = el('div', 'metrics');
      p.results.forEach(function (r) {
        var m = el('div', 'metric');
        var v = el('div', 'metric__v');
        v.innerHTML = counterHTML(r.value);
        m.appendChild(v);
        m.appendChild(el('span', 'metric__l', pick(r.label)));
        metrics.appendChild(m);
      });
      card.appendChild(metrics);

      var chips = el('div', 'card__chips');
      p.stack.forEach(function (s) { chips.appendChild(el('span', 'chip', s)); });
      card.appendChild(chips);

      var det = el('details', 'card__more');
      det.appendChild(el('summary', null, t('ui.approach')));
      det.appendChild(el('p', 'row__x', pick(p.problem)));
      var ul = el('ul');
      pick(p.approach).forEach(function (a) { ul.appendChild(el('li', null, a)); });
      det.appendChild(ul);
      det.appendChild(el('p', 'row__x', pick(p.confidentiality)));
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

  function renderStaticText() {
    $$('[data-i18n]').forEach(function (node) {
      var v = t(node.getAttribute('data-i18n'));
      if (v !== '' && v !== undefined) node.textContent = v;
    });
    document.documentElement.setAttribute('lang', LANG);
    document.title = pick(S.seo.title);
    var md = document.getElementById('meta-desc');
    if (md) md.setAttribute('content', pick(S.seo.description));

    var mail = S.email;
    ['cta-mail', 'contact-mail'].forEach(function (id) {
      var a = document.getElementById(id);
      if (!a) return;
      a.href = 'mailto:' + mail;
      if (id === 'contact-mail') a.textContent = mail;
    });
    ['cta-github', 'cta-github-2'].forEach(function (id) {
      var a = document.getElementById(id);
      if (a) { a.href = S.github; a.target = '_blank'; a.rel = 'noopener'; }
    });
    ['cta-linkedin', 'cta-linkedin-2'].forEach(function (id) {
      var a = document.getElementById(id);
      if (a) { a.href = S.linkedin; a.target = '_blank'; a.rel = 'noopener'; }
    });
    ['cta-cv', 'cta-cv-2'].forEach(function (id) {
      var a = document.getElementById(id);
      if (a) { a.href = pick(S.cv); a.target = '_blank'; a.rel = 'noopener'; a.textContent = t('ui.cv'); }
    });
    $$('.langswitch__btn').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === LANG ? 'true' : 'false');
    });
  }

  function renderAll() {
    renderStaticText();
    renderFacts();
    renderReadouts();
    renderRecord();
    renderServices();
    renderStacks();
    renderMore();
    renderDisclosure();
    renderAvailability();
    renderContact();
    renderAbout();
    renderCards();
  }

  /* ---------- language routing: `/` = EN, `/ru/` = RU ---------- */
  function routeFor(lang) { return lang === 'ru' ? '/ru/' : '/'; }
  function applyLang(lang, push) {
    LANG = lang;
    renderAll();
    buildElbows();
    if (push) {
      try {
        history.pushState({ lang: lang }, '', routeFor(lang));
      } catch (e) {
        location.hash = lang === 'ru' ? '#ru' : '#en';
      }
    }
    try { localStorage.setItem('lcars-lang', lang); } catch (e) {}
    document.dispatchEvent(new CustomEvent('lcars:lang', { detail: { lang: lang } }));
  }

  /* ---------- L-elbows: ONE connected path per framed block ----------
     horizontal run -> 90 deg -> vertical run, outer AND inner corner
     rounded with the same radius, semicircular caps on both ends.  */
  var ELBOW_COLOUR = {
    amber: 'var(--amber)',
    coral: 'var(--coral)',
    lav: 'var(--lav-2)',
    salmon: 'var(--salmon)'
  };

  function elbowPath(W, H, t, r) {
    var c = t / 2;
    var d = [];
    d.push('M ' + r + ' 0');
    d.push('H ' + (W - c));
    d.push('A ' + c + ' ' + c + ' 0 0 1 ' + (W - c) + ' ' + t);
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
    $$('.elbow').forEach(function (hostEl) {
      var W = parseFloat(hostEl.getAttribute('data-arm-w')) || 220;
      var H = parseFloat(hostEl.getAttribute('data-arm-h')) || 130;
      var t = 16, r = 8;
      var colour = ELBOW_COLOUR[hostEl.getAttribute('data-elbow')] || 'var(--coral)';
      hostEl.style.setProperty('--elbow-c', colour);
      hostEl.style.width = W + 'px';
      hostEl.style.height = H + 'px';
      hostEl.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H +
        '" aria-hidden="true" focusable="false"><path d="' + elbowPath(W, H, t, r) + '"></path></svg>';
    });
  }

  /* ---------- SVG draw-in ---------- */
  function drawableNodes(svg) {
    return $$('.drawing path, .drawing line, .drawing polyline, .drawing ellipse, .drawing circle', svg)
      .filter(function (n) { return !n.classList.contains('dim'); });
  }

  function prepareDraw(svg) {
    drawableNodes(svg).forEach(function (n) {
      var len = 0;
      try { len = n.getTotalLength(); } catch (e) { len = 0; }
      if (!len) return;
      n.style.strokeDasharray = len + ' ' + len;
      n.style.strokeDashoffset = len;
    });
  }

  function playDraw(svg, tl) {
    drawableNodes(svg).forEach(function (n) {
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

  function mountDraw(selector) {
    var svg = $(selector);
    if (!svg) return;
    prepareDraw(svg);
    var tl = gsap.timeline({ paused: true });
    playDraw(svg, tl);
    if (window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: svg.closest('.dwg'),
        start: 'top 85%',
        once: true,
        onEnter: function () { tl.play(0); }
      });
    } else {
      tl.play(0);
    }
  }

  /* ---------- counters ---------- */
  function runCounters(scope) {
    var hosts = (scope && scope.nodeType) ? [scope] : (Array.isArray(scope) ? scope : []);
    var nodes = [];
    if (hosts.length) {
      hosts.forEach(function (h) { nodes = nodes.concat($$('.cnt', h)); });
    } else {
      nodes = $$('.cnt');
    }
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

    if (reduced) { showEverything(); return; }

    /* the top bar draws itself out of the left edge */
    gsap.from('.topbar', { scaleX: 0, duration: 1.1, ease: 'power3.out', transformOrigin: 'left center' });
    gsap.from('.topbar__id', { xPercent: 30, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.3 });
    gsap.from('.topbar__cap', { xPercent: 40, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.45 });
    gsap.from('.masthead__meta', { opacity: 0, duration: 0.6, delay: 0.5 });

    /* the rail blocks grow along the spine */
    gsap.from('.rail__block', {
      scaleY: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.2,
      transformOrigin: 'center'
    });

    /* each band reveals its own content */
    var targets = $$('.panel, .card, .cap, .rec__row, .about__p, .row, .instrument, .datarow, .readout');
    if (window.ScrollTrigger) {
      ScrollTrigger.batch(targets, {
        start: 'top 92%',
        once: true,
        onEnter: function (batch) {
          gsap.fromTo(batch,
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power3.out', clearProps: 'transform' });
          runCounters(batch);
        }
      });
    } else {
      gsap.set(targets, { opacity: 1, y: 0 });
    }

    /* the elbows draw themselves into their frame */
    $$('.elbow path').forEach(function (p) {
      try {
        var len = p.getTotalLength();
        if (!len) return;
        p.style.strokeDasharray = len + ' ' + len;
        p.style.strokeDashoffset = len;
        gsap.to(p, {
          strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut',
          scrollTrigger: { trigger: p.closest('.frame'), start: 'top 92%', once: true }
        });
      } catch (e) {}
    });

    mountDraw('[data-od-id="linac-drawing"] svg');
    mountDraw('[data-od-id="isodose-drawing"] svg');

    runCounters(document);
  }

  /* reduced motion: render the end state, no tweens */
  function showEverything() {
    $$('.rail__block').forEach(function (n) { n.style.transform = 'none'; });
    $$('.cnt').forEach(function (n) {
      n.textContent = formatNum(parseFloat(n.getAttribute('data-to')), n.getAttribute('data-comma') === '1');
    });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  function revealFallback() {
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

    $$('.langswitch__btn').forEach(function (b) {
      b.addEventListener('click', function () {
        applyLang(b.getAttribute('data-lang'), true);
      });
    });
    window.addEventListener('popstate', function () { applyLang(initialLang(), false); });

    var tmr;
    window.addEventListener('resize', function () {
      clearTimeout(tmr);
      tmr = setTimeout(function () {
        buildElbows();
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }, 140);
    });
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { buildElbows(); });
      $$('.frame').forEach(function (f) { ro.observe(f); });
    }
    if (window.ScrollTrigger) {
      setTimeout(function () { ScrollTrigger.refresh(); }, 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

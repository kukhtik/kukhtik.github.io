/* ===================================================================
   LCARS CONSOLE - the behaviour layer.
   The readout field is the template's data cascade: the first columns
   carry the live values, the rest is the log.
     1. BOOT      the console powers up when the page comes up
     2. CYCLE     the digits roll, the accent block breathes, the
                  availability lamp blinks
     3. STANDBY   after a while with nobody watching, the console dims
   Plus: the left panel of the section on screen lights up, the others dim.
   =================================================================== */
(function () {
  'use strict';

  var FULL_TIME = new Date(Date.UTC(2026, 10, 30)); // 30 Nov 2026
  var started = Date.now();
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pad(value, width) {
    var text = String(value);
    while (text.length < width) text = '0' + text;
    return text;
  }

  function daysUntil(target) {
    var now = new Date();
    var today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return Math.max(0, Math.round((target.getTime() - today) / 86400000));
  }

  function clock() {
    var now = new Date();
    var utc = new Date(now.getTime() + 3 * 3600000); // UTC+3
    return {
      'clock-h': pad(utc.getUTCHours(), 2),
      'clock-m': pad(utc.getUTCMinutes(), 2),
      'clock-s': pad(utc.getUTCSeconds(), 2),
      'date-d': pad(utc.getUTCDate(), 2),
      'date-m': pad(utc.getUTCMonth() + 1, 2),
      'date-y': pad(utc.getUTCFullYear(), 4)
    };
  }

  // LCARS stardate: a base number plus the progress through the year,
  // plus the time unit of the day (0-9).
  function stardate() {
    var now = new Date();
    var yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    var yearEnd = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));
    var base = 80000 + ((now - yearStart) / (yearEnd - yearStart)) * 1000;
    var seconds = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
    var unit = Math.floor(seconds / (86400 / 10));
    var text = base.toFixed(1) + '.' + unit;
    var dot = text.indexOf('.');
    return { 'sd-a': text.slice(0, dot), 'sd-b': text.slice(dot) };
  }

  function uptime() {
    var s = Math.floor((Date.now() - started) / 1000);
    return {
      'up-h': pad(Math.floor(s / 3600), 2),
      'up-m': pad(Math.floor((s % 3600) / 60), 2),
      'up-s': pad(s % 60, 2)
    };
  }

  var cells = {};
  document.querySelectorAll('[data-live]').forEach(function (el) {
    var key = el.getAttribute('data-live');
    (cells[key] = cells[key] || []).push(el);
  });

  function paint(key, value) {
    var list = cells[key];
    if (!list) return;
    list.forEach(function (el) {
      if (el.textContent === value) return;
      el.textContent = value;
      if (!reduced) {
        el.classList.remove('is-rolling');
        void el.offsetWidth;
        el.classList.add('is-rolling');
      }
    });
  }

  function tick() {
    var t = clock();
    for (var k in t) paint(k, t[k]);
    var sd = stardate();
    paint('sd-a', sd['sd-a']); paint('sd-b', sd['sd-b']);
    var up = uptime();
    for (var u in up) paint(u, up[u]);
    paint('days', pad(daysUntil(FULL_TIME), 2));
    paint('facts-a', '21'); paint('facts-b', '214');
  }

  // ---- the content flows in from beyond the edge when it comes into view ----
  function revealOnScroll() {
    if (reduced) return;
    var targets = document.querySelectorAll(
      '.lcars-text-bar, .lcars-list li, .readout__cell, .own-metric, .image-frame, .btn'
    );
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = el.parentElement ? el.parentElement.children : [];
        var index = Array.prototype.indexOf.call(siblings, el);
        el.style.setProperty('--d', (index * 45) + 'ms');
        el.classList.add('own-reveal', 'is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(function (el) { io.observe(el); });
  }

  // ---- 1. BOOT: the console powers up ----
  function boot() {
    if (reduced) return;
    document.querySelectorAll('.right-frame-top, .left-frame, .right-frame').forEach(function (el, i) {
      el.classList.add('own-boot');
      el.style.animationDelay = (i * 0.09) + 's';
    });
  }

  // ---- 3. STANDBY: the console powers down when nobody is watching ----
  var idle = 0;
  function wake() {
    idle = 0;
    document.body.classList.remove('is-standby');
  }
  ['pointerdown', 'keydown', 'wheel', 'touchstart', 'focus'].forEach(function (evt) {
    window.addEventListener(evt, wake, { passive: true });
  });
  function checkIdle() {
    idle += 1000;
    if (idle >= 12000) document.body.classList.add('is-standby');
  }

  // ---- the language switch: the URL always follows the stored choice ----
  function currentLang() {
    return /^\/ru(\/|$)/.test(location.pathname) ? 'ru' : 'en';
  }
  function otherLang() { return currentLang() === 'en' ? 'ru' : 'en'; }
  function counterpart(url) {
    var path = url.pathname.replace(/^\/ru(\/|$)/, '/');
    if (otherLang() === 'ru') path = '/ru' + (path === '/' ? '/' : path);
    return path + url.search + url.hash;
  }
  var stored = null;
  try { stored = localStorage.getItem('lcars-lang'); } catch (e) { stored = null; }
  if (stored && stored !== currentLang()) {
    location.replace(counterpart(location));
  }
  document.querySelectorAll('[data-lang-toggle]').forEach(function (el) {
    el.textContent = otherLang() === 'en' ? 'EN' : 'RU';
    el.setAttribute('href', counterpart(location));
    el.setAttribute('title', otherLang() === 'en' ? 'Switch to English' : 'Переключить на русский');
    el.addEventListener('click', function (ev) {
      try { localStorage.setItem('lcars-lang', otherLang()); } catch (e) { /* private mode */ }
      ev.preventDefault();
      location.href = counterpart(location);
    });
  });

  // ---- the left panel of the section on screen lights up ----
  var sections = [];
  function collectSections() {
    sections = [];
    document.querySelectorAll('main .block[id]').forEach(function (el) {
      sections.push({ id: el.id, el: el });
    });
  }
  function syncPanels() {
    var panels = document.querySelectorAll('.left-frame [data-target]');
    if (!panels.length) return;
    var current = sections.length ? sections[0].id : null;
    var main = document.getElementById('main');
    var probe = (main ? main.getBoundingClientRect().top + window.scrollY : 0) + 140;
    for (var i = 0; i < sections.length; i += 1) {
      if (sections[i].el.getBoundingClientRect().top + window.scrollY <= probe) current = sections[i].id;
    }
    panels.forEach(function (p) {
      var on = p.getAttribute('data-target') === current;
      p.classList.toggle('own-on', on);
      p.classList.toggle('own-off', !on);
    });
  }

  tick();
  boot();
  revealOnScroll();
  collectSections();
  syncPanels();

  if (!reduced) {
    window.setInterval(tick, 1000);
    window.setInterval(checkIdle, 1000);
    window.addEventListener('scroll', syncPanels, { passive: true });
    window.addEventListener('resize', function () { collectSections(); syncPanels(); });
  }
})();

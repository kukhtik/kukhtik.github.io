/* app.js — темы, часы, цифровое поле, 6 состояний. Без библиотек. */
(function () {
  "use strict";
  var html = document.documentElement;
  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var storedMotion = null;
  try { storedMotion = localStorage.getItem("lcars-motion"); } catch (e) {}
  var motion = storedMotion || (mqReduce.matches ? "reduced" : "full");

  function applyMotion(m) {
    motion = m;
    html.setAttribute("data-motion", m);
    try { localStorage.setItem("lcars-motion", m); } catch (e) {}
    var btn = document.getElementById("motion-toggle");
    if (btn) btn.textContent = "MOTION · " + (m === "full" ? "FULL" : m === "reduced" ? "REDUCED" : "OFF");
    if (window.__lcarsStars) window.__lcarsStars.setMode(m);
  }
  applyMotion(motion);

  var motionBtn = document.getElementById("motion-toggle");
  if (motionBtn) {
    motionBtn.addEventListener("click", function () {
      applyMotion(motion === "full" ? "off" : "full");
    });
  }

  /* тема */
  var saved = null;
  try { saved = localStorage.getItem("lcars-theme"); } catch (e) {}
  if (saved) html.setAttribute("data-theme", saved);
  document.querySelectorAll("[data-theme-value]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var t = btn.getAttribute("data-theme-value");
      html.setAttribute("data-theme", t);
      try { localStorage.setItem("lcars-theme", t); } catch (e) {}
      document.querySelectorAll("[data-theme-value]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
    });
    btn.setAttribute("aria-pressed", String(btn.getAttribute("data-theme-value") === html.getAttribute("data-theme")));
  });

  /* часы */
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  var t0 = Date.now();
  var clock = document.getElementById("clock");
  var dateEl = document.getElementById("date");
  var uptime = document.getElementById("uptime");
  function tick() {
    var d = new Date();
    if (clock) clock.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    if (dateEl) dateEl.textContent = d.getFullYear() + "." + pad(d.getMonth() + 1) + "." + pad(d.getDate());
    if (uptime) {
      var s = Math.floor((Date.now() - t0) / 1000);
      uptime.textContent = pad(Math.floor(s / 60)) + ":" + pad(s % 60);
    }
  }
  tick();
  setInterval(tick, 1000);

  /* фоновое звёздное поле (ambient) */
  var canvas = document.getElementById("stars");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var stars = [];
    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);
    for (var i = 0; i < 110; i++) {
      stars.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
                   z: 0.2 + Math.random() * 0.8, r: 0.3 + Math.random() * 1.1 });
    }
    var meteor = null;
    function drawMeteor() {
      if (!meteor) return;
      ctx.globalAlpha = meteor.life;
      ctx.strokeStyle = "#cfd8ff";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(meteor.x, meteor.y);
      ctx.lineTo(meteor.x + 90, meteor.y - 34);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    function draw() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (var k = 0; k < stars.length; k++) {
        var st = stars[k];
        ctx.globalAlpha = 0.12 + 0.5 * st.z;
        ctx.fillStyle = "#cfd8ff";
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, 6.2832);
        ctx.fill();
      }
      drawMeteor();
      ctx.globalAlpha = 1;
    }
    function step() {
      if (motion !== "full") return;
      for (var k = 0; k < stars.length; k++) {
        var s = stars[k];
        s.x -= 0.02 * s.z;
        if (s.x < -2) s.x = window.innerWidth + 2;
      }
      if (!meteor && Math.random() < 0.0015) {
        meteor = { x: window.innerWidth * (0.3 + Math.random() * 0.7), y: Math.random() * window.innerHeight * 0.6,
                   life: 1 };
      }
      if (meteor) {
        meteor.x -= 7; meteor.y += 2.6; meteor.life -= 0.012;
        if (meteor.life <= 0) meteor = null;
      }
      draw();
      if (motion === "full") requestAnimationFrame(step);
    }
    window.__lcarsStars = {
      setMode: function (m) {
        if (m === "off") { ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
        else if (m === "reduced") { draw(); }
        else { requestAnimationFrame(step); }
      }
    };
    if (motion === "off") { ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
    else if (motion === "reduced") { draw(); }
    else { requestAnimationFrame(step); }
  }

  /* состояния главной */
  var states = Array.prototype.slice.call(document.querySelectorAll(".state"));
  var steps = Array.prototype.slice.call(document.querySelectorAll(".track .step"));
  var current = 0;
  function setState(i) {
    if (i === current && states[i] && states[i].classList.contains("is-on")) return;
    current = i;
    states.forEach(function (el, k) { el.classList.toggle("is-on", k === i); });
    var num = document.getElementById("state-num");
    if (num) num.textContent = ("0" + (i + 1)).slice(-2) + " / " + ("0" + states.length).slice(-2);
    var ticks = document.querySelectorAll("#state-ticks i");
    for (var k = 0; k < ticks.length; k++) ticks[k].classList.toggle("is-on", k <= i);
    document.querySelectorAll("[data-state-link]").forEach(function (a) {
      a.setAttribute("aria-current", String(Number(a.getAttribute("data-state-link")) === i));
    });
    var chip = document.getElementById("state-chip");
    if (chip) {
      chip.textContent = ("0" + (i + 1)).slice(-2);
      chip.classList.remove("flip");
      void chip.offsetWidth;
      chip.classList.add("flip");
    }
    var bars = document.querySelector(".bars");
    if (bars && motion === "full") {
      bars.classList.remove("is-pulsing");
      void bars.offsetWidth;
      bars.classList.add("is-pulsing");
      setTimeout(function () { bars.classList.remove("is-pulsing"); }, 1100);
    }
  }
  if (states.length) setState(0);
  var trackEl = document.querySelector(".track");
  function onScroll() {
    if (!states.length) return;
    var i = Math.round(window.scrollY / Math.max(1, window.innerHeight));
    setState(Math.max(0, Math.min(states.length - 1, i)));
  }
  if (trackEl) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  }
  document.querySelectorAll("[data-state-link]").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var i = Number(a.getAttribute("data-state-link"));
      if (steps[i]) { ev.preventDefault(); steps[i].scrollIntoView({ behavior: motion === "full" ? "smooth" : "auto", block: "start" }); }
    });
  });
  var mlc = document.querySelector(".mlc-assembly");
  if (mlc) {
    var mlcLeaves = mlc.querySelectorAll(".mlc-bank use");
    var INNER = +mlc.dataset.inner, LW = +mlc.dataset.lw, GAP = +mlc.dataset.gap,
        CY = +mlc.dataset.cy, OPEN = +mlc.dataset.open, MIN = +mlc.dataset.min, PAIRS = +mlc.dataset.pairs;
    var mlcTick = false;
    var paintMlc = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      mlc.style.setProperty("--amp", String(1 - p));
      var pct = document.getElementById("scroll-pct");
      if (pct) pct.textContent = Math.round(p * 100) + "%";
      for (var k = 0; k < mlcLeaves.length; k++) {
        var r = mlcLeaves[k];
        var i = Math.round((parseFloat(r.getAttribute("x")) - INNER) / (LW + GAP));
        var local = Math.max(0, Math.min(1, p * PAIRS - i));
        var isUp = parseFloat(r.getAttribute("y")) < CY;
        r.setAttribute("transform", "translate(0 " + ((OPEN - MIN) * local * (isUp ? 1 : -1)).toFixed(2) + ")");
      }
      mlcTick = false;
    };
    window.addEventListener("scroll", function () {
      if (!mlcTick) { mlcTick = true; requestAnimationFrame(paintMlc); }
    }, { passive: true });
    paintMlc();
  }

  var progressBar = document.querySelector("#progress i");
  var ticking = false;
  function paintProgress() {
    if (!progressBar) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    progressBar.style.width = (ratio * 100).toFixed(2) + "%";
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(paintProgress); }
  }, { passive: true });
  paintProgress();

  var codeEl = document.getElementById("banner-code");
  if (codeEl) {
    var codes = [codeEl.textContent, "02-262011", "02-262033"];
    var ci = 0;
    setInterval(function () {
      if (motion !== "full") return;
      ci = (ci + 1) % codes.length;
      codeEl.textContent = codes[ci];
      codeEl.classList.remove("is-typing");
      void codeEl.offsetWidth;
      codeEl.classList.add("is-typing");
    }, 6000);
  }

  document.addEventListener("keydown", function (e) {
    if (!states.length) return;
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      if (steps[current + 1]) steps[current + 1].scrollIntoView({ behavior: "smooth" });
    }
    if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      if (steps[current - 1]) steps[current - 1].scrollIntoView({ behavior: "smooth" });
    }
  });
})();

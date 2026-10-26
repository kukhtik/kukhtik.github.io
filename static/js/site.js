/* site.js — 2 KB, no dependencies.
   Scroll reveals + instrument parallax. Without JS the page is complete
   (html.no-js keeps every [data-reveal] visible). */
(function () {
  var doc = document.documentElement;
  doc.classList.remove('no-js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = [].slice.call(document.querySelectorAll('[data-reveal]'));

  function show(el) { el.classList.add('is-in'); }

  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(show);
  } else {
    var pending = items.slice();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          show(e.target);
          var i = pending.indexOf(e.target);
          if (i > -1) pending.splice(i, 1);
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });

    items.forEach(function (el) { io.observe(el); });

    // Fast scroll / restored scroll position can jump past an element; sweep
    // anything that is already above the fold instead of leaving it invisible.
    var sweep = function () {
      if (!pending.length) return;
      var vh = window.innerHeight;
      pending = pending.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.96) { show(el); io.unobserve(el); return false; }
        return true;
      });
    };
    var queued = false;
    window.addEventListener('scroll', function () {
      if (queued || !pending.length) return;
      queued = true;
      requestAnimationFrame(function () { sweep(); queued = false; });
    }, { passive: true });
    window.addEventListener('load', sweep);
    sweep();
  }

  var dial = document.querySelector('[data-dial]');
  if (dial && !reduce && window.matchMedia('(hover: hover)').matches) {
    var raf = null, tx = 0, ty = 0;
    window.addEventListener('pointermove', function (ev) {
      var r = dial.getBoundingClientRect();
      tx = ((ev.clientX - (r.left + r.width / 2)) / window.innerWidth) * 12;
      ty = ((ev.clientY - (r.top + r.height / 2)) / window.innerHeight) * 12;
      if (!raf) raf = requestAnimationFrame(function () {
        dial.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0)';
        raf = null;
      });
    }, { passive: true });
  }
}());

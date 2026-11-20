/* =====================================================================
   v3.8 scroll effects (styles in effects.css)
     1. #about     the intro's words light up one by one as the card scrolls through the viewport
     2. #services  desktop: the service nearest the middle of the screen is active; a sticky picture follows it
   With reduced motion nothing moves: the intro is fully lit and the services keep their accordion.
   ===================================================================== */
(function () {
  'use strict';

  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var vh = function () { return window.innerHeight || document.documentElement.clientHeight; };
  var updaters = [];

  /* ---------- 1. About: text highlight ---------- */
  (function () {
    var card = document.querySelector('#about .glass-card');
    if (!card || reduced) return;
    var words = [];
    function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var parts = ch.nodeValue.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            var sp = document.createElement('span');
            sp.className = 'w'; sp.textContent = t;
            frag.appendChild(sp); words.push(sp);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && !ch.classList.contains('availability')) {
          split(ch);
        }
      });
    }
    card.querySelectorAll('p').forEach(split);
    if (!words.length) return;
    card.classList.add('hl');
    var lit = -1;
    updaters.push(function () {
      var r = card.getBoundingClientRect(), h = vh();
      /* starts when the card's top reaches 85% of the screen, done when its bottom is at 55% */
      var p = clamp((h * 0.85 - r.top) / Math.max(1, r.height + h * 0.3), 0, 1);
      var n = Math.round(p * words.length);
      if (n === lit) return;
      for (var i = Math.min(n, lit < 0 ? 0 : lit); i < Math.max(n, lit < 0 ? words.length : lit); i++) words[i].classList.toggle('lit', i < n);
      lit = n;
    });
  })();

  /* ---------- 2. Services: sticky picture follows the active service (desktop only) ---------- */
  (function () {
    var sec = document.getElementById('services'), media = document.getElementById('svcMedia');
    if (!sec || !media || reduced || !window.matchMedia) return;
    var items = Array.prototype.slice.call(sec.querySelectorAll('.svc')),
        figs = media.querySelectorAll('figure'), no = document.getElementById('svcMediaNo'),
        mq = window.matchMedia('(min-width:961px)'), cur = -1;
    function setActive(i) {
      if (i === cur) return;
      cur = i;
      items.forEach(function (it, k) {
        it.classList.toggle('open', k === i);
        var b = it.querySelector('.svc-row'); if (b) b.setAttribute('aria-expanded', k === i ? 'true' : 'false');
      });
      for (var k = 0; k < figs.length; k++) figs[k].classList.toggle('on', k === i);
      if (no) no.textContent = ('0' + (i + 1)).slice(-2);
    }
    function mode() {
      var on = mq.matches;
      sec.classList.toggle('svc-live', on);
      if (!on) {             /* back to the plain accordion, all closed */
        cur = -1;
        items.forEach(function (it) { it.classList.remove('open'); var b = it.querySelector('.svc-row'); if (b) b.setAttribute('aria-expanded', 'false'); });
      }
    }
    if (mq.addEventListener) mq.addEventListener('change', function () { mode(); run(); }); else if (mq.addListener) mq.addListener(function () { mode(); run(); });
    mode();
    /* a click centres that service (the accordion handler in script.js has already toggled it) */
    items.forEach(function (it) {
      var row = it.querySelector('.svc-row');
      if (row) row.addEventListener('click', function () {
        if (!mq.matches) return;
        var r = it.getBoundingClientRect();
        window.scrollTo({ top: window.pageYOffset + r.top + r.height / 2 - vh() / 2, behavior: 'smooth' });
        cur = -1; requestAnimationFrame(run);
      });
    });
    updaters.push(function () {
      if (!mq.matches) return;
      var mid = vh() / 2, best = 0, bd = Infinity;
      items.forEach(function (it, k) {
        var r = it.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bd) { bd = d; best = k; }
      });
      setActive(best);
    });
  })();

  /* ---------- one scroll loop for all ---------- */
  var raf = 0;
  function run() { raf = 0; for (var i = 0; i < updaters.length; i++) updaters[i](); }
  function request() { if (!raf) raf = requestAnimationFrame(run); }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  run();
})();

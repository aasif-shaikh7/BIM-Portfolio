/* =====================================================================
   v3.8 scroll effects (styles in effects.css)
     1. #about     the intro's words light up one by one as the card scrolls through the viewport
     2. #services  desktop: the service nearest the middle of the screen is active; a sticky picture follows it
     3. #workflow  pinned scroll story with an exploded BIM model:
                     0.00-0.25 Model       the layers drop in one by one (foundation -> walls)
                     0.25-0.50 Coordinate  the model explodes, layers are labelled, clashes are found and cleared
                     0.50-0.75 Document    fills fade to a line drawing on a drawing sheet (S-101)
                     0.75-1.00 Deliver     the model closes up again; IFC, BOQ, BBS, GFC are issued
   With reduced motion nothing moves: the intro is fully lit, the services keep their accordion, the workflow shows
   the exploded model with its labels next to the four steps.
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

  /* ---------- 3. Workflow: exploded BIM model ---------- */
  (function () {
    var sec = document.getElementById('workflow'), stack = document.getElementById('wfStack'),
        scene = document.getElementById('wfScene');
    if (!sec || !stack || !scene) return;
    var visual = sec.querySelector('.wf-visual'),
        plates = Array.prototype.slice.call(stack.querySelectorAll('.wf-plate')),
        labels = {}, clash = document.getElementById('wfClash'), sheet = document.getElementById('wfSheet'),
        deliver = document.getElementById('wfDeliver'),
        steps = Array.prototype.slice.call(sec.querySelectorAll('.flow-step'));
    Array.prototype.forEach.call(sec.querySelectorAll('.wf-labels span'), function (sp) { labels[sp.getAttribute('data-k')] = sp; });
    var dots = clash ? clash.querySelectorAll('b') : [];
    var SIN = Math.sin(58 * Math.PI / 180), live = !reduced, stepCur = -1;
    sec.classList.add('wf-js');
    if (live) sec.classList.add('wf-live');

    function draw(p) {
      var w = visual.clientWidth, h = visual.clientHeight, phone = (window.innerWidth || w) <= 900;
      /* the model sits left of centre so the layer labels fit beside its right corner */
      /* desktop: the model sits left of centre and is sized so the layer labels fit beside its right corner */
      var cx = w * (phone ? 0.5 : 0.40), cy = h * (phone ? 0.72 : 0.58);
      var s = phone ? Math.min(w / 600, h / 520) : Math.min(w / 640, h / 560, 1.2, (w - cx + 30 - 170) / 262);
      scene.style.setProperty('--wf-s', s.toFixed(3));
      scene.style.left = cx + 'px'; scene.style.top = cy + 'px';
      /* gap between layers: closed -> exploded (Coordinate) -> closed again (Deliver) */
      var spread = phone ? 40 : 54, gap = 16 + spread * ease(seg(p, 0.27, 0.40)) - spread * ease(seg(p, 0.77, 0.90));
      var rz = -38 + 10 * p;
      stack.style.setProperty('--wf-rz', rz.toFixed(2) + 'deg');
      var fill = 1 - 0.88 * ease(seg(p, 0.52, 0.60)) + 0.88 * ease(seg(p, 0.77, 0.86));
      stack.style.setProperty('--fill', fill.toFixed(3));
      stack.classList.toggle('drawn', fill < 0.5);
      var lab = seg(p, 0.30, 0.38) * (1 - seg(p, 0.72, 0.78));
      if (!live) lab = 1;
      var zs = {};
      plates.forEach(function (pl, i) {
        /* Model: each layer drops in, bottom first */
        var a = live ? ease(seg(p, 0.02 + i * 0.038, 0.10 + i * 0.038)) : 1;
        var z = i * gap + (1 - a) * 160;
        zs[pl.getAttribute('data-k')] = z;
        pl.style.transform = 'translateZ(' + z.toFixed(1) + 'px)';
        pl.style.opacity = a.toFixed(3);
      });
      Object.keys(labels).forEach(function (k) {
        var sp = labels[k], z = zs[k] || 0;
        sp.style.left = (cx + 262 * s) + 'px';
        sp.style.top = (cy - z * SIN * s) + 'px';
        sp.style.opacity = lab.toFixed(3);
      });
      if (clash) {
        var co = live ? seg(p, 0.37, 0.41) * (1 - seg(p, 0.49, 0.52)) : 0;
        clash.style.opacity = co.toFixed(3);
        clash.classList.toggle('ok', p > 0.455);
        var zb = (zs.beams + zs.columns) / 2, pos = [[-70, -18], [40, 22], [105, -40]];
        for (var d = 0; d < dots.length; d++) {
          dots[d].style.left = (cx + pos[d][0] * s) + 'px';
          dots[d].style.top = (cy - zb * SIN * s + pos[d][1] * s) + 'px';
        }
      }
      if (sheet) sheet.style.opacity = (live ? seg(p, 0.54, 0.61) * (1 - seg(p, 0.74, 0.79)) : 0).toFixed(3);
      if (deliver) {
        var dl = live ? ease(seg(p, 0.86, 0.94)) : 0;
        deliver.style.opacity = dl.toFixed(3);
        deliver.style.transform = 'translateY(' + ((1 - dl) * 16).toFixed(1) + 'px)';
      }
      if (live) {
        var idx = Math.min(3, Math.floor(p * 4));
        if (idx !== stepCur) { stepCur = idx; steps.forEach(function (st, k) { st.classList.toggle('active', k === idx); }); }
        if (steps[idx]) steps[idx].style.setProperty('--sp', clamp(p * 4 - idx, 0, 1).toFixed(3));
      }
    }
    if (!live) { draw(0.42); window.addEventListener('resize', function () { draw(0.42); }); return; }
    updaters.push(function () {
      var r = sec.getBoundingClientRect(), total = sec.offsetHeight - vh();
      draw(total > 0 ? clamp(-r.top / total, 0, 1) : 0);
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

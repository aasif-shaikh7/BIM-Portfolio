/* =====================================================================
   v3.6 HERO — scroll stage
   A camera move around the desk (assets/hero-frames[-hd]/f0001-f0240.webp) is drawn on a canvas as the page scrolls
   through the tall #home section; the pinned layers are placed for the current scroll progress p (0..1):
     0.00-0.12  name + hero text fade out (the name was drawn like a CAD plot on load)
     0.00-0.90  the film plays in one continuous shot: in front of the desk (back of the laptop) -> round behind him
                -> over his right shoulder onto the Revit model on the laptop screen
     0.18-0.55  skill cards pass (desktop: both sides; phones: one after the other)
     0.03-0.95  a level rail (Revit level heads) tracks the scroll
     0.84-1.00  the full-screen film shrinks into a rounded card (Apple-style) that then scrolls away with the page
   Frames on a canvas (not a paused <video>) scrub smoothly on every phone.
   With reduced motion, or without canvas support, the hero stays a plain one-screen hero (.is-static).
   ===================================================================== */
(function () {
  'use strict';

  var stage = document.getElementById('home');
  if (!stage || !stage.classList.contains('stage')) return;

  var $ = function (id) { return document.getElementById(id); };
  var pin = stage.querySelector('.stage-pin'),
      canvas = $('stageCanvas'), poster = $('stagePoster'), hero = $('stageHero'),
      fade = $('stageFade'), exit = $('stageExit'), hint = $('stageHint'),
      cardL = $('stageCardL'), cardR = $('stageCardR'),
      shade = stage.querySelector('.stage-shade'),
      levels = $('stageLevels'), lvList = $('lvList'), lvFill = $('lvFill'), lvMark = $('lvMark'), lvTag = $('lvTag');

  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- name entrance — "CAD drafting" (styles in stage.css):
     an outline copy of the name is drawn left to right by a plotter crosshair, then the metal letters fill in ---------- */
  var letters = stage.querySelectorAll('.stage-word > span');
  for (var li = 0; li < letters.length; li++) letters[li].style.setProperty('--i', li);
  var nameWrap = $('stageNameWrap'), nameH1 = nameWrap && nameWrap.querySelector('.stage-name');
  if (nameH1 && !reduced) {
    var ol = nameH1.cloneNode(true);
    ol.className = 'stage-name stage-name-ol';
    ol.setAttribute('aria-hidden', 'true');
    var olSr = ol.querySelector('.sr-only');
    if (olSr) olSr.parentNode.removeChild(olSr);
    nameWrap.insertBefore(ol, nameH1.nextSibling);
    var xh = document.createElement('span');
    xh.className = 'stage-xhair';
    xh.setAttribute('aria-hidden', 'true');
    nameWrap.appendChild(xh);
  }
  stage.classList.add('anim');
  requestAnimationFrame(function () { requestAnimationFrame(function () { stage.classList.add('in'); }); });

  var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  if (reduced || !ctx || !pin) { stage.classList.add('is-static'); return; }

  /* ---------- tuning ---------- */
  /* two frame sets: 1920x1080 (lanczos upscale, light sharpening, ~9 MB) for large screens, 1280x720 (~5 MB) for small */
  var FRAMES = 240,
      HD = (window.innerWidth || 0) * (window.devicePixelRatio || 1) > 1400,
      FW = HD ? 1920 : 1280, FH = HD ? 1080 : 720,
      DIR = HD ? 'assets/hero-frames-hd/' : 'assets/hero-frames/',
      VER = '?v=5';                   // bump whenever the frames are re-rendered (same file names)
  var frameUrl = function (i) { return DIR + 'f' + ('000' + (i + 1)).slice(-4) + '.webp' + VER; };
  var HERO_END = 0.12, FILM_END = 0.90, EXIT = [0.92, 1.0], CARD = [0.84, 1.0];

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var blur = function (px) { return px > 0.2 ? 'blur(' + px.toFixed(1) + 'px)' : 'none'; };

  stage.classList.add('is-live');
  canvas.width = FW;
  canvas.height = FH;
  ctx.imageSmoothingEnabled = true;
  if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';

  /* ---------- level rail: scroll progress shown as Revit level heads (3 m storeys) ---------- */
  var LEVELS = [['GROUND', 'G', '±0.000'], ['LEVEL 1', 'L1', '+3.000'], ['LEVEL 2', 'L2', '+6.000'], ['LEVEL 3', 'L3', '+9.000'],
                ['LEVEL 4', 'L4', '+12.000'], ['LEVEL 5', 'L5', '+15.000'], ['TERRACE', 'T', '+18.000']];
  var lvItems = [], lvCur = -1;
  if (lvList) {
    LEVELS.forEach(function (lv, i) {
      var item = document.createElement('li');
      item.style.bottom = (i / (LEVELS.length - 1) * 100) + '%';
      item.innerHTML = '<b></b><i></i>';
      item.firstChild.textContent = lv[1];
      lvList.appendChild(item);
      lvItems.push(item);
    });
  }
  function placeLevels(p, phone) {
    if (!levels) return;
    levels.style.opacity = String(seg(p, 0.03, 0.08) * (1 - seg(p, 0.82, 0.88)));
    var f = seg(p, 0.03, 0.95), n = LEVELS.length - 1,
        idx = Math.min(n, Math.floor(f * n + 0.0001));
    if (lvFill) lvFill.style.height = (f * 100).toFixed(2) + '%';
    if (lvMark) lvMark.style.bottom = (f * 100).toFixed(2) + '%';
    if (idx !== lvCur) {
      lvCur = idx;
      lvItems.forEach(function (it, i) { it.classList.toggle('on', i <= idx); it.classList.toggle('cur', i === idx); });
      if (lvTag) lvTag.textContent = (idx === 0 ? 'G' : idx === n ? 'TERRACE' : 'G+' + idx) + (phone ? '' : ' · ' + LEVELS[idx][2]);
    }
  }

  /* ---------- frames: cache + progressive loader ---------- */
  var frames = new Array(FRAMES), drawn = -1, want = 0, painted = false;
  function nearest(idx) {
    var i = idx;
    while (i >= 0 && !frames[i]) i--;                  // closest earlier frame that has loaded
    if (i < 0) { i = idx; while (i < FRAMES && !frames[i]) i++; }
    return i < FRAMES ? i : -1;
  }
  /* paint film frame `idx` (or the closest one that has loaded) */
  function paint(idx) {
    var i = nearest(idx);
    if (i < 0 || i === drawn) return;
    drawn = i;
    ctx.drawImage(frames[i], 0, 0, FW, FH);
    if (!painted && poster) { poster.style.opacity = '0'; painted = true; }
  }
  function loadImg(src, done) {
    return new Promise(function (res) {
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () { done(im); res(); };
      im.onerror = function () { res(); };
      im.src = src;
    });
  }
  (function preload() {
    var order = [], seen = {}, add = function (i) { if (!seen[i]) { seen[i] = 1; order.push(i); } };
    [16, 8, 4, 2, 1].forEach(function (step) { for (var i = 0; i < FRAMES; i += step) add(i); });
    add(FRAMES - 1);
    var k = 0, BATCH = 6;
    function frame(i) {
      return loadImg(frameUrl(i), function (im) { frames[i] = im; if (Math.abs(i - want) < 3 || !painted) paint(want); });
    }
    /* first frame, then the rest coarse-to-fine */
    frame(0).then(function next() {
      if (k >= order.length) return;
      var part = order.slice(k, k + BATCH); k += BATCH;
      return Promise.all(part.map(frame)).then(next);
    });
  })();

  /* ---------- layout for the current scroll progress ---------- */
  var s = { p: 0, vw: 0, vh: 0 };
  function measure() { s.vw = pin.clientWidth || window.innerWidth; s.vh = pin.clientHeight || window.innerHeight; }
  function progress() {
    var r = stage.getBoundingClientRect(), total = stage.offsetHeight - s.vh;
    return total > 0 ? clamp(-r.top / total, 0, 1) : 0;
  }
  function place() {
    var p = s.p, vw = s.vw, vh = s.vh, phone = vw < 768;

    /* film: cover the viewport; on narrow screens the visible slice follows the subject, then the laptop */
    var t = ease(seg(p, 0, FILM_END)),
        scale = Math.max(vw / 1280, vh / 720),
        W = 1280 * scale, H = 720 * scale,
        fx = 0.5 + 0.02 * t, fy = 0.52,
        ox = clamp(vw / 2 - fx * W, vw - W, 0),
        oy = clamp(vh / 2 - fy * H, vh - H, 0);
    /* end: the whole frame closes in to a rounded card; the film inside eases back a little */
    var cs = ease(seg(p, CARD[0], CARD[1]));
    canvas.style.cssText = 'left:' + ox + 'px;top:' + oy + 'px;width:' + W + 'px;height:' + H + 'px' +
      (cs > 0 ? ';transform:scale(' + (1 - 0.08 * cs).toFixed(4) + ')' : '');
    if (cs > 0) {
      var ix = cs * (phone ? 4 : 14), it = cs * (phone ? 12 : 9), ib = cs * (phone ? 16 : 15);   /* bottom: crops the desk shadow */
      pin.style.clipPath = 'inset(' + it.toFixed(2) + 'vh ' + ix.toFixed(2) + 'vw ' + ib.toFixed(2) + 'vh round ' + (cs * 28).toFixed(1) + 'px)';
    } else if (pin.style.clipPath) pin.style.clipPath = '';
    if (shade) shade.style.opacity = String(1 - 0.75 * cs);      /* the card shows the film edge to edge */
    if (poster && !painted) poster.style.cssText = 'left:' + ox + 'px;top:' + oy + 'px;width:' + W + 'px;height:' + H + 'px';

    /* 1. hero text */
    var hp = seg(p, 0, HERO_END);
    hero.style.opacity = String(1 - hp);
    hero.style.transform = 'translateY(' + (-hp * 40).toFixed(1) + 'px)';
    hero.style.filter = blur(hp * 14);
    hero.style.visibility = hp >= 1 ? 'hidden' : 'visible';
    if (fade) fade.style.opacity = String(seg(p, 0.1, 0.2));
    if (hint) hint.style.opacity = String(seg(p, 0.04, 0.1) * (1 - seg(p, 0.6, 0.7)));
    if (exit) exit.style.opacity = String(0.35 * ease(seg(p, EXIT[0], EXIT[1])));

    /* 2. skill cards */
    if (phone) {
      card(cardL, seg(p, 0.18, 0.25), seg(p, 0.33, 0.39), 0);
      card(cardR, seg(p, 0.41, 0.48), seg(p, 0.56, 0.62), 0);
    } else {
      var cin = seg(p, 0.18, 0.28), cout = seg(p, 0.46, 0.55);
      card(cardL, cin, cout, -1);
      card(cardR, cin, cout, 1);
    }

    /* 3. level-marker rail */
    placeLevels(p, phone);

    /* film frame */
    want = Math.min(FRAMES - 1, Math.round(seg(p, 0, FILM_END) * (FRAMES - 1)));
    paint(want);
  }
  function card(el, cin, cout, dir) {
    if (!el) return;
    var op = cin * (1 - cout);
    el.style.opacity = String(op);
    el.style.transform = dir
      ? 'translate(' + (dir * ((1 - cin) * 25 + cout * 15)).toFixed(1) + 'px,' + (dir * -cin * 8).toFixed(1) + 'px)'
      : 'translateY(' + ((1 - cin) * 25 - cout * 15).toFixed(1) + 'px)';
    el.style.filter = blur(Math.max((1 - cin) * 12, cout * 12));
    el.style.visibility = op > 0.01 ? 'visible' : 'hidden';
  }

  var raf = 0;
  function update() { raf = 0; s.p = progress(); place(); }
  function request() { if (!raf) raf = requestAnimationFrame(update); }
  function layout() { measure(); update(); }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', function () { measure(); request(); });
  window.addEventListener('orientationchange', function () { setTimeout(layout, 150); });
  layout();
})();

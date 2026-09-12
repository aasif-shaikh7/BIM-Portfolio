/* ============================================================
   ASIF SHAIKH — BIM Portfolio · script.js v2.6.2 "BBS tabs + dedup"
   Modules: header, mobile nav, reveal, services accordion,
   hero parallax, project modal, BBS carousel, single 12-project
   carousel (one at a time), slide preloading, is-active slide
   highlighting for the glass animations, floating Let's Talk,
   visitor counter, WhatsApp contact form.
   ============================================================ */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: blur state on scroll ---------- */
  var header = document.getElementById('siteHeader');
  function headerState() { if (header) header.classList.toggle('scrolled', window.scrollY > 30); }
  headerState();
  window.addEventListener('scroll', headerState, { passive: true });

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');
  function closeNav() {
    document.body.classList.remove('nav-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
  }
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mainNav.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeNav(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
  }, { threshold: .08 });
  document.querySelectorAll('.reveal').forEach(function (el) { revealObs.observe(el); });

  /* ---------- Services accordion (click/touch; hover handled in CSS) ---------- */
  document.querySelectorAll('.svc').forEach(function (svc) {
    var row = svc.querySelector('.svc-row');
    if (!row) return;
    row.addEventListener('click', function () {
      var isOpen = svc.classList.contains('open');
      document.querySelectorAll('.svc.open').forEach(function (o) {
        o.classList.remove('open');
        var b = o.querySelector('.svc-row'); if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) { svc.classList.add('open'); row.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---------- Hero parallax backdrop ---------- */
  var backdrop = document.getElementById('heroBackdrop');
  if (backdrop && !reducedMotion) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight * 1.2) backdrop.style.transform = 'translateY(' + (y * .22) + 'px)';
        ticking = false;
      });
    }, { passive: true });
  }

  
  /* ---------- Project modal ---------- */
  var modal = document.getElementById('projectModal'),
      title = document.getElementById('modalTitle'),
      gallery = document.getElementById('modalGallery');
  function openModal(btn) {
    if (!modal || !title || !gallery) return;
    title.textContent = btn.dataset.title || 'Project';
    var imgs = [];
    try { imgs = JSON.parse(btn.dataset.images || '[]'); } catch (e) { imgs = []; }
    gallery.innerHTML = imgs.map(function (x) {
      return '<img src="assets/' + String(x).replace(/[^a-zA-Z0-9._-]/g, '') + '" alt="' + (btn.dataset.title || 'Project') + ' project image" loading="lazy">';
    }).join('');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  document.querySelectorAll('.view-project').forEach(function (btn) {
    btn.addEventListener('click', function () { openModal(btn); });
  });
  var closeBtn = document.querySelector('.modal-close'), mBackdrop = document.querySelector('.modal-backdrop');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (mBackdrop) mBackdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeModal(); closeNav(); } });

  /* Preload the slide image that is about to enter view. Carousel images use
     loading="lazy" (57MB of assets must not all load upfront); flipping the
     attribute to "eager" one slide ahead prevents blank flashes during autoplay. */
  function preloadSlide(track, idx, n) {
    var el = track.children[((idx % n) + n) % n];
    var img = el ? (el.tagName === 'IMG' ? el : el.querySelector('img')) : null;
    if (img && img.getAttribute('loading') === 'lazy') img.setAttribute('loading', 'eager');
  }

  /* ---------- BBS carousel: autoplay, dots, counter, pause on hover/touch ---------- */
  (function () {
    var root = document.querySelector('.bbs-slideshow');
    if (!root) return;
    var track = root.querySelector('.bbs-slides');
    if (!track) return;
    var n = track.children.length;
    if (n < 2) return;
    var cur = root.querySelector('#bbs-current'), total = root.querySelector('#bbs-total'),
        prev = root.querySelector('.bbs-prev'), next = root.querySelector('.bbs-next'),
        i = 0, timer = null, paused = false, delay = 3000;
    if (total) total.textContent = n;
    track.style.transition = 'transform 650ms cubic-bezier(.22,.61,.36,1)';
    track.style.willChange = 'transform';
    var dots = document.createElement('div');
    dots.className = 'bbs-carousel-dots';
    for (var d = 0; d < n; d++) {
      var dot = document.createElement('button');
      dot.type = 'button'; dot.className = 'bbs-dot';
      dot.setAttribute('aria-label', 'Show slide ' + (d + 1));
      dot.dataset.index = d;
      dots.appendChild(dot);
    }
    root.appendChild(dots);
    var dotButtons = dots.querySelectorAll('.bbs-dot');
    /* mark the visible slide .is-active so glass animations run on it only */
    function setActive() { Array.prototype.forEach.call(track.children, function (s, k) { if (k === i) s.classList.add('is-active'); else s.classList.remove('is-active'); }); }
    function updateDots() { dotButtons.forEach(function (dot, idx) { dot.classList.toggle('active', idx === i); }); }
    function go(idx) { i = (idx + n) % n; track.style.transform = 'translate3d(' + (-i * 100) + '%,0,0)'; if (cur) cur.textContent = ('0' + (i + 1)).slice(-2); preloadSlide(track, i + 1, n); preloadSlide(track, i - 1, n); setActive(); updateDots(); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { stop(); if (!paused) timer = setInterval(function () { go(i + 1); }, delay); }
    function pause() { paused = true; stop(); }
    function resume() { paused = false; start(); }
    if (prev) prev.addEventListener('click', function () { go(i - 1); start(); });
    if (next) next.addEventListener('click', function () { go(i + 1); start(); });
    dotButtons.forEach(function (dot) { dot.addEventListener('click', function () { go(parseInt(dot.dataset.index, 10) || 0); start(); }); });
    root.addEventListener('mouseenter', pause);
    root.addEventListener('mouseleave', resume);
    root.addEventListener('touchstart', pause, { passive: true });
    root.addEventListener('touchend', resume, { passive: true });
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { paused = false; start(); } else pause(); });
    }, { threshold: .2 }).observe(root);
    setActive(); updateDots(); start();
  })();

  
  /* ---------- Projects carousel (01–12): arrows, dots, counter, swipe, autoplay ---------- */
  (function () {
    var root = document.querySelector('.proj-carousel');
    var track = document.getElementById('projTrack');
    if (!root || !track) return;
    var n = track.children.length;
    if (n < 2) return;
    var cur = root.querySelector('#proj-current'), total = root.querySelector('#proj-total'),
        prev = root.querySelector('.proj-prev'), next = root.querySelector('.proj-next'),
        i = 0, timer = null, paused = false, delay = 3000;
    if (total) total.textContent = ('0' + n).slice(-2);
    track.style.transition = 'transform 700ms cubic-bezier(.22,.61,.36,1)';
    track.style.willChange = 'transform';
    var dots = document.createElement('div');
    dots.className = 'proj-dots';
    for (var d = 0; d < n; d++) {
      var dot = document.createElement('button');
      dot.type = 'button'; dot.className = 'proj-dot';
      dot.setAttribute('aria-label', 'Show project ' + (d + 1));
      dot.dataset.index = d;
      dots.appendChild(dot);
    }
    root.appendChild(dots);
    var dotButtons = dots.querySelectorAll('.proj-dot');
    /* mark the visible slide .is-active so glass animations run on it only */
    function setActive() { Array.prototype.forEach.call(track.children, function (s, k) { if (k === i) s.classList.add('is-active'); else s.classList.remove('is-active'); }); }
    function updateDots() { dotButtons.forEach(function (dot, idx) { dot.classList.toggle('active', idx === i); }); }
    function go(idx) { i = (idx + n) % n; track.style.transform = 'translate3d(' + (-i * 100) + '%,0,0)'; if (cur) cur.textContent = ('0' + (i + 1)).slice(-2); preloadSlide(track, i + 1, n); preloadSlide(track, i - 1, n); setActive(); updateDots(); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { stop(); if (!paused && !reducedMotion) timer = setInterval(function () { go(i + 1); }, delay); }
    function pause() { paused = true; stop(); }
    function resume() { paused = false; start(); }
    if (prev) prev.addEventListener('click', function () { go(i - 1); start(); });
    if (next) next.addEventListener('click', function () { go(i + 1); start(); });
    dotButtons.forEach(function (dot) { dot.addEventListener('click', function () { go(parseInt(dot.dataset.index, 10) || 0); start(); }); });
    root.addEventListener('mouseenter', pause);
    root.addEventListener('mouseleave', resume);
    var sx = null;
    track.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; pause(); }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (sx !== null) {
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 42) go(i + (dx < 0 ? 1 : -1));
        sx = null;
      }
      resume();
    }, { passive: true });
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { paused = false; start(); } else pause(); });
    }, { threshold: .15 }).observe(root);
    setActive(); updateDots(); start();
  })();

  /* ---------- Floating "Let's Talk" — hide while contact section is on screen ---------- */
  (function () {
    var btn = document.querySelector('.lets-talk-float'), sec = document.getElementById('contact');
    if (!btn || !sec || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { btn.classList.toggle('hide', e.isIntersecting); });
    }, { threshold: .12 }).observe(sec);
  })();

  /* ---------- GoatCounter visitor counter ----------
     Unique-visitor-ish dedup:
     1) count.js never auto-fires — data-goatcounter-settings has
        {"no_onload":true} — this module decides *when* to count.
     2) Same browser counts at most once per calendar day
        (localStorage), so refreshing the page 100x does not
        inflate the number.
     3) The GoatCounter server adds IP/user-agent hysteresis on top. */
  (function () {
    var el = document.getElementById('goatcounter-counter');
    if (!el) return;
    var tries = 0;
    function guardRead() { try { return JSON.parse(localStorage.getItem('asif-gc-guard') || 'null'); } catch (e) { return null; } }
    function guardWrite(v) { try { localStorage.setItem('asif-gc-guard', JSON.stringify(v)); } catch (e) {} }
    function today() {
      var d = new Date();
      return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2);
    }
    function mayCount() { var g = guardRead(); return !g || g.day !== today(); }
    function countIfNew() {
      if (!window.goatcounter || typeof window.goatcounter.count !== 'function') return;
      if (!mayCount()) return;
      try { window.goatcounter.count(); } catch (e) {}
      guardWrite({ day: today() });
    }
    function url() {
      var s = document.querySelector('script[data-goatcounter]');
      if (!s || !s.dataset.goatcounter) return null;
      return s.dataset.goatcounter.replace(/\/count\/?$/, '') + '/counter/TOTAL.json?no_branding=1';
    }
    function render() {
      if (!window.goatcounter || typeof window.goatcounter.count !== 'function') {
        if (tries++ < 40) { setTimeout(render, 250); return; }
        el.textContent = '—'; return;
      }
      countIfNew();
      var u = url();
      if (!u) { el.textContent = '—'; return; }
      fetch(u).then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function (d) { el.textContent = d && typeof d.count === 'string' ? d.count : '—'; })
        .catch(function () { el.textContent = '—'; });
    }
    render();
  })();

  /* ---------- BBS reference tables: tab switch (Beam/Footing/Slab/Column) ---------- */
  (function () {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.bbs-tab'));
    if (!tabs.length) return;
    var tables = Array.prototype.slice.call(document.querySelectorAll('.bbs-ref'));
    var byId = {};
    tables.forEach(function (tb) { var m = /(?:^|\s)(beam|footing|slab|column)(?:\s|$)/.exec(tb.className); if (m) byId[m[1]] = tb; });
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var sel = t.dataset.table;
        tabs.forEach(function (x) { var on = x === t; x.classList.toggle('active', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
        tables.forEach(function (tb) { tb.classList.toggle('active', tb === byId[sel]); });
      });
    });
  })();

  /* ---------- Contact form → WhatsApp ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.elements.name.value || '').trim();
      var msg = (form.elements.message.value || '').trim();
      if (!msg) { form.elements.message.focus(); return; }
      var text = 'Hi Asif! ' + (name ? "I'm " + name + '. ' : '') + msg;
      window.open('https://wa.me/918291834576?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();

/* BIM Portfolio — Project Focus Carousel v1.2.6 */
(function () {
  'use strict';

  var VERSION = '1.2.6';
  var AUTOPLAY_MS = 2000;

  function init() {
    var track = document.querySelector('.project-grid');
    if (!track) return;

    var cards = Array.prototype.slice.call(track.querySelectorAll('.project-card'));
    if (cards.length < 2) return;

    /*
     * script.js contains the older carousel implementation and runs first.
     * Its 1-second timer uses this element's scrollBy/scrollTo methods.
     * Disable only those legacy calls on this project track. Native scrolling
     * is still available through Element.prototype and touch/wheel input.
     */
    track.scrollBy = function () {};
    track.scrollTo = function () {};

    var active = 0;
    var timer = null;
    var resumeTimer = null;
    var settleTimer = null;
    var dragging = false;
    var hovered = false;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var style = document.createElement('style');
    style.setAttribute('data-project-focus-carousel', VERSION);
    style.textContent = `
      .project-grid[data-focus-v126]{
        display:flex!important;flex-wrap:nowrap!important;align-items:center!important;
        gap:28px!important;width:100%!important;max-width:none!important;
        overflow-x:auto!important;overflow-y:visible!important;
        padding-top:115px!important;padding-bottom:115px!important;
        margin:-115px 0!important;padding-left:0!important;padding-right:0!important;
        scrollbar-width:none!important;-ms-overflow-style:none!important;
        scroll-behavior:auto!important;overscroll-behavior-x:contain;
        -webkit-overflow-scrolling:touch;
      }
      .project-grid[data-focus-v126]::-webkit-scrollbar{display:none!important}
      .project-grid[data-focus-v126]>.project-card{
        flex:0 0 var(--focus-card-width)!important;
        width:var(--focus-card-width)!important;min-width:var(--focus-card-width)!important;
        transform:scale(.67);transform-origin:center center;
        filter:grayscale(1) brightness(.50) blur(3px);opacity:.38;z-index:1;
        transition:transform 650ms cubic-bezier(.22,.61,.36,1),filter 650ms ease,opacity 650ms ease,box-shadow 650ms ease,border-color 650ms ease;
        will-change:transform,filter,opacity;
      }
      .project-grid[data-focus-v126]>.project-card.carousel-focus-active{
        transform:scale(1.66);filter:none;opacity:1;z-index:10;
        border-color:rgba(255,79,163,.86);
        box-shadow:0 30px 80px rgba(0,0,0,.46),0 0 0 2px rgba(118,88,255,.34),0 0 44px rgba(255,79,163,.23),0 0 84px rgba(118,88,255,.18);
      }
      .project-grid[data-focus-v126]>.project-card.carousel-focus-side{
        transform:scale(.67);filter:grayscale(1) brightness(.46) blur(3.2px);opacity:.34;z-index:2;
      }
      .project-grid[data-focus-v126]>.project-card:hover{transform:var(--focus-hover-transform)}
      .project-grid[data-focus-v126]>.project-card{--focus-hover-transform:scale(.67)}
      .project-grid[data-focus-v126]>.project-card.carousel-focus-active{--focus-hover-transform:scale(1.66)}
      @media(max-width:1050px){
        .project-grid[data-focus-v126]{gap:22px!important}
        .project-grid[data-focus-v126]>.project-card.carousel-focus-active{transform:scale(1.42);--focus-hover-transform:scale(1.42)}
      }
      @media(max-width:700px){
        .project-grid[data-focus-v126]{gap:16px!important;padding-top:70px!important;padding-bottom:70px!important;margin:-70px 0!important}
        .project-grid[data-focus-v126]>.project-card{transform:scale(.82);filter:grayscale(1) brightness(.63) blur(1.2px);opacity:.46;--focus-hover-transform:scale(.82)}
        .project-grid[data-focus-v126]>.project-card.carousel-focus-active{transform:scale(1.10);--focus-hover-transform:scale(1.10);filter:none;opacity:1}
        .project-grid[data-focus-v126]>.project-card.carousel-focus-side{transform:scale(.82);--focus-hover-transform:scale(.82);filter:grayscale(1) brightness(.60) blur(1.3px);opacity:.42}
      }
      @media(prefers-reduced-motion:reduce){.project-grid[data-focus-v126]>.project-card{transition:none!important}}
    `;
    document.head.appendChild(style);
    track.setAttribute('data-focus-v126', 'true');

    function nativeScrollTo(left, behavior) {
      Element.prototype.scrollTo.call(track, {left:left, behavior:behavior || 'auto'});
    }

    function layout() {
      var width = track.clientWidth;
      var gap = window.innerWidth <= 700 ? 16 : (window.innerWidth <= 1050 ? 22 : 28);
      var cardWidth;
      if (window.innerWidth <= 700) {
        cardWidth = Math.max(220, width - 56);
      } else if (window.innerWidth <= 1050) {
        cardWidth = Math.max(260, (width - gap) / 2);
      } else {
        cardWidth = Math.max(280, (width - gap * 2) / 3);
      }
      track.style.setProperty('--focus-card-width', cardWidth + 'px');
      var gutter = Math.max(0, (width - cardWidth) / 2);
      track.style.paddingLeft = gutter + 'px';
      track.style.paddingRight = gutter + 'px';
    }

    function applyState(index) {
      active = (index + cards.length) % cards.length;
      cards.forEach(function (card, i) {
        card.classList.remove('carousel-focus-active', 'carousel-focus-side');
        if (i === active) card.classList.add('carousel-focus-active');
        else if (i === active - 1 || i === active + 1) card.classList.add('carousel-focus-side');
      });
      var counter = document.querySelector('.project-carousel-label b');
      if (counter) counter.textContent = String(active + 1).padStart(2, '0');
    }

    function targetFor(index) {
      layout();
      var card = cards[index];
      var max = Math.max(0, track.scrollWidth - track.clientWidth);
      var target = card.offsetLeft - ((track.clientWidth - card.offsetWidth) / 2);
      return Math.max(0, Math.min(target, max));
    }

    function center(index, smooth) {
      var behavior = (!reduced && smooth) ? 'smooth' : 'auto';
      nativeScrollTo(targetFor(index), behavior);
    }

    function nearest() {
      var centerX = track.scrollLeft + track.clientWidth / 2;
      var best = 0;
      var distance = Infinity;
      cards.forEach(function (card, index) {
        var d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - centerX);
        if (d < distance) { distance = d; best = index; }
      });
      return best;
    }

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    function start() {
      stop();
      if (reduced || document.hidden || dragging || hovered) return;
      timer = setInterval(function () {
        if (dragging || hovered || document.hidden) return;
        var next = (active + 1) % cards.length;
        applyState(next);
        center(next, true);
      }, AUTOPLAY_MS);
    }

    function pause(ms) {
      stop();
      if (resumeTimer) clearTimeout(resumeTimer);
      if (ms !== Infinity) resumeTimer = setTimeout(start, ms || 1400);
    }

    function settle() {
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(function () {
        if (dragging) return;
        var index = nearest();
        applyState(index);
        center(index, true);
        pause(1300);
      }, 120);
    }

    track.addEventListener('mouseenter', function () { hovered = true; pause(Infinity); });
    track.addEventListener('mouseleave', function () { hovered = false; if (!dragging) start(); });
    track.addEventListener('pointerdown', function () { dragging = true; pause(Infinity); });
    track.addEventListener('pointerup', function () { dragging = false; settle(); });
    track.addEventListener('pointercancel', function () { dragging = false; settle(); });
    track.addEventListener('touchstart', function () { dragging = true; pause(Infinity); }, {passive:true});
    track.addEventListener('touchend', function () { dragging = false; settle(); }, {passive:true});
    track.addEventListener('touchcancel', function () { dragging = false; settle(); }, {passive:true});
    track.addEventListener('wheel', function () { pause(1700); settle(); }, {passive:true});

    track.addEventListener('scroll', function () {
      if (!dragging) settle();
    }, {passive:true});

    var prev = document.querySelector('.project-carousel-prev');
    var next = document.querySelector('.project-carousel-next');
    if (prev) prev.addEventListener('click', function () {
      pause(1400); var i = (active - 1 + cards.length) % cards.length; applyState(i); center(i, true);
    });
    if (next) next.addEventListener('click', function () {
      pause(1400); var i = (active + 1) % cards.length; applyState(i); center(i, true);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else { layout(); center(active, false); start(); }
    });
    window.addEventListener('resize', function () {
      stop(); layout(); center(active, false); start();
    }, {passive:true});

    applyState(0);
    layout();
    center(0, false);
    setTimeout(function () { layout(); center(active, false); start(); }, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
}());

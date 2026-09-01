/* BIM Portfolio — Project Focus Carousel v1.2.3 */
(function () {
  'use strict';

  var VERSION = '1.2.3';

  function init() {
    var track = document.querySelector('.project-grid');
    if (!track) return;

    var cards = Array.prototype.slice.call(track.querySelectorAll('.project-card'));
    if (!cards.length) return;

    if (track.getAttribute('data-focus-carousel-version')) return;
    track.setAttribute('data-focus-carousel-version', VERSION);

    var activeIndex = 0;
    var autoTimer = null;
    var settleTimer = null;
    var resumeTimer = null;
    var programmaticTimer = null;
    var pointerDown = false;
    var isProgrammaticScroll = false;
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var style = document.createElement('style');
    style.setAttribute('data-project-focus-carousel', VERSION);
    style.textContent = `
      /* v1.2.3 — stable center-focus carousel. The layout position never changes while scrolling. */
      .project-grid[data-focus-carousel-version] {
        display: flex !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        gap: 28px !important;
        overflow-x: auto !important;
        overflow-y: visible !important;
        width: 100% !important;
        max-width: none !important;
        padding-top: 105px !important;
        padding-bottom: 105px !important;
        margin: -105px 0 !important;
        scroll-snap-type: none !important;
        scroll-behavior: auto !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
        overscroll-behavior-x: contain;
        -webkit-overflow-scrolling: touch;
      }

      .project-grid[data-focus-carousel-version]::-webkit-scrollbar { display: none !important; }

      .project-grid[data-focus-carousel-version] > .carousel-focus-spacer {
        flex: 0 0 0px;
        width: 0;
        height: 1px;
        pointer-events: none;
      }

      .project-grid[data-focus-carousel-version] > .project-card {
        flex: 0 0 calc((100% - 56px) / 3) !important;
        width: calc((100% - 56px) / 3) !important;
        min-width: 0 !important;
        position: relative;
        transform: scale(.67);
        transform-origin: center center;
        filter: grayscale(1) brightness(.55) blur(2.8px);
        opacity: .40;
        z-index: 1;
        transition:
          transform 620ms cubic-bezier(.22,.61,.36,1),
          filter 620ms ease,
          opacity 620ms ease,
          box-shadow 620ms ease,
          border-color 620ms ease;
        will-change: transform, filter, opacity;
      }

      .project-grid[data-focus-carousel-version] > .project-card.carousel-focus-active {
        transform: scale(1.66);
        filter: none;
        opacity: 1;
        z-index: 10;
        border-color: rgba(255,79,163,.82);
        box-shadow:
          0 30px 80px rgba(0,0,0,.46),
          0 0 0 2px rgba(118,88,255,.34),
          0 0 44px rgba(255,79,163,.24),
          0 0 84px rgba(118,88,255,.18);
      }

      .project-grid[data-focus-carousel-version] > .project-card.carousel-focus-side {
        transform: scale(.67);
        filter: grayscale(1) brightness(.50) blur(3px);
        opacity: .36;
        z-index: 2;
      }

      /* The existing project hover rule must never compete with the focus transform. */
      .project-grid[data-focus-carousel-version] > .project-card:hover,
      .project-grid[data-focus-carousel-version] > .project-card.carousel-focus-active:hover,
      .project-grid[data-focus-carousel-version] > .project-card.carousel-focus-side:hover {
        transform: var(--carousel-transform, scale(.67));
        box-shadow: inherit;
      }

      .project-grid[data-focus-carousel-version] > .project-card.carousel-focus-active {
        --carousel-transform: scale(1.66);
      }

      .project-grid[data-focus-carousel-version] > .project-card.carousel-focus-side,
      .project-grid[data-focus-carousel-version] > .project-card:not(.carousel-focus-active) {
        --carousel-transform: scale(.67);
      }

      @media (max-width: 1050px) {
        .project-grid[data-focus-carousel-version] > .project-card {
          flex-basis: calc((100% - 28px) / 2) !important;
          width: calc((100% - 28px) / 2) !important;
        }
        .project-grid[data-focus-carousel-version] > .project-card.carousel-focus-active {
          transform: scale(1.38);
          --carousel-transform: scale(1.38);
        }
      }

      @media (max-width: 700px) {
        .project-grid[data-focus-carousel-version] {
          gap: 16px !important;
          padding-top: 55px !important;
          padding-bottom: 55px !important;
          margin: -55px 0 !important;
        }
        .project-grid[data-focus-carousel-version] > .project-card {
          flex-basis: calc(100% - 56px) !important;
          width: calc(100% - 56px) !important;
          transform: scale(.82);
          filter: grayscale(1) brightness(.66) blur(1.2px);
          opacity: .46;
          --carousel-transform: scale(.82);
        }
        .project-grid[data-focus-carousel-version] > .project-card.carousel-focus-active {
          transform: scale(1.10);
          --carousel-transform: scale(1.10);
          filter: none;
          opacity: 1;
        }
        .project-grid[data-focus-carousel-version] > .project-card.carousel-focus-side {
          transform: scale(.82);
          --carousel-transform: scale(.82);
          filter: grayscale(1) brightness(.63) blur(1.3px);
          opacity: .42;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .project-grid[data-focus-carousel-version] > .project-card {
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    var startSpacer = document.createElement('div');
    var endSpacer = document.createElement('div');
    startSpacer.className = 'carousel-focus-spacer carousel-focus-spacer-start';
    endSpacer.className = 'carousel-focus-spacer carousel-focus-spacer-end';
    startSpacer.setAttribute('aria-hidden', 'true');
    endSpacer.setAttribute('aria-hidden', 'true');
    track.insertBefore(startSpacer, cards[0]);
    track.appendChild(endSpacer);

    function layout() {
      if (!cards[0]) return;

      var cardWidth = cards[0].offsetWidth;
      var sideSpace = Math.max(0, (track.clientWidth - cardWidth) / 2);
      startSpacer.style.flexBasis = sideSpace + 'px';
      endSpacer.style.flexBasis = sideSpace + 'px';
    }

    function setClasses(index) {
      activeIndex = (index + cards.length) % cards.length;

      cards.forEach(function (card, i) {
        card.classList.remove('carousel-focus-active', 'carousel-focus-side');
        if (i === activeIndex) {
          card.classList.add('carousel-focus-active');
        } else if (i === activeIndex - 1 || i === activeIndex + 1) {
          card.classList.add('carousel-focus-side');
        }
      });
    }

    function getTarget(index) {
      var card = cards[index];
      if (!card) return 0;

      layout();

      /* Use the untransformed layout box. CSS scale must never affect centering math. */
      var target = card.offsetLeft - ((track.clientWidth - card.offsetWidth) / 2);
      var maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      return Math.max(0, Math.min(target, maxScroll));
    }

    function centerCard(index, behavior) {
      var target = getTarget(index);
      var useBehavior = reducedMotion ? 'auto' : (behavior || 'smooth');

      isProgrammaticScroll = true;
      if (programmaticTimer) window.clearTimeout(programmaticTimer);

      track.scrollTo({
        left: target,
        behavior: useBehavior
      });

      /* Keep the lock active for the full CSS scroll animation, not just the first scroll event. */
      programmaticTimer = window.setTimeout(function () {
        isProgrammaticScroll = false;
      }, useBehavior === 'smooth' ? 750 : 60);
    }

    function nearestCard() {
      var center = track.scrollLeft + (track.clientWidth / 2);
      var best = 0;
      var bestDistance = Infinity;

      cards.forEach(function (card, index) {
        var cardCenter = card.offsetLeft + (card.offsetWidth / 2);
        var distance = Math.abs(cardCenter - center);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });

      return best;
    }

    function pauseAutoplay(duration) {
      if (autoTimer) {
        window.clearInterval(autoTimer);
        autoTimer = null;
      }
      if (resumeTimer) window.clearTimeout(resumeTimer);

      if (duration !== Infinity) {
        resumeTimer = window.setTimeout(startAutoplay, duration || 1400);
      }
    }

    function startAutoplay() {
      if (reducedMotion || document.hidden || pointerDown) return;
      if (cards.length < 2) return;
      if (autoTimer) window.clearInterval(autoTimer);

      /* Exactly 1 second between carousel advances. */
      autoTimer = window.setInterval(function () {
        if (pointerDown || document.hidden) return;
        var nextIndex = (activeIndex + 1) % cards.length;
        setClasses(nextIndex);
        centerCard(nextIndex, 'smooth');
      }, 1000);
    }

    function settleUserScroll() {
      if (settleTimer) window.clearTimeout(settleTimer);

      settleTimer = window.setTimeout(function () {
        if (isProgrammaticScroll) return;

        var index = nearestCard();
        setClasses(index);
        centerCard(index, 'smooth');
        pauseAutoplay(1200);
      }, 130);
    }

    /* User interaction: holding/hovering pauses autoplay. */
    track.addEventListener('pointerdown', function () {
      pointerDown = true;
      pauseAutoplay(Infinity);
    }, { passive: true });

    track.addEventListener('pointerup', function () {
      pointerDown = false;
      settleUserScroll();
    }, { passive: true });

    track.addEventListener('pointercancel', function () {
      pointerDown = false;
      settleUserScroll();
    }, { passive: true });

    track.addEventListener('mouseenter', function () {
      pauseAutoplay(Infinity);
    });

    track.addEventListener('mouseleave', function () {
      if (!pointerDown) startAutoplay();
    });

    track.addEventListener('wheel', function () {
      pauseAutoplay(1600);
      settleUserScroll();
    }, { passive: true });

    /*
     * Critical stability fix:
     * Do NOT change the active class on every scroll event. During smooth scrolling,
     * changing scale/filter while the browser is animating scroll causes the visual
     * position to jump and produces the reported shake/glitch.
     */
    track.addEventListener('scroll', function () {
      if (!isProgrammaticScroll && !pointerDown) {
        settleUserScroll();
      }
    }, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        pauseAutoplay(Infinity);
      } else {
        centerCard(activeIndex, 'auto');
        startAutoplay();
      }
    });

    window.addEventListener('resize', function () {
      layout();
      centerCard(activeIndex, 'auto');
    }, { passive: true });

    /* Initial state: project 01 is centered before autoplay starts. */
    setClasses(0);
    layout();
    centerCard(0, 'auto');

    /* Recalculate after fonts/responsive CSS settle. */
    window.setTimeout(function () {
      layout();
      centerCard(activeIndex, 'auto');
      startAutoplay();
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}());

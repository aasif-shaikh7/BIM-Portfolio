/* BIM Portfolio — Focus Carousel v1.2.5 */
(function () {
  'use strict';

  function init() {
    var grid = document.querySelector('.project-grid');
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.project-card'));
    if (cards.length < 3) return;

    var activeIndex = 0;
    var isDragging = false;
    var pendingTimer = null;
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var style = document.createElement('style');
    style.setAttribute('data-carousel-focus', 'v1.2.5');
    style.textContent = `
      /* Stable center-focus presentation. Layout width never changes. */
      .project-carousel {
        overflow-x: auto !important;
        overflow-y: visible !important;
        scroll-snap-type: none !important;
        scroll-behavior: auto !important;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }

      .project-carousel::-webkit-scrollbar { display:none; }

      .project-carousel .project-card {
        position: relative;
        flex-shrink: 0;
        transform: scale(.67);
        transform-origin: center center;
        filter: grayscale(1) brightness(.60) blur(2.5px);
        opacity: .42;
        z-index: 1;
        transition: transform 650ms cubic-bezier(.22,.61,.36,1), filter 650ms ease, opacity 650ms ease, box-shadow 650ms ease, border-color 650ms ease;
        will-change: transform, filter, opacity;
      }

      .project-carousel .project-card.carousel-focus-active {
        transform: scale(1.66);
        filter: none;
        opacity: 1;
        z-index: 10;
        border-color: rgba(255,79,163,.78);
        box-shadow: 0 26px 74px rgba(0,0,0,.46), 0 0 0 2px rgba(118,88,255,.34), 0 0 44px rgba(255,79,163,.22), 0 0 82px rgba(118,88,255,.16);
      }

      .project-carousel .project-card.carousel-focus-side {
        transform: scale(.67);
        filter: grayscale(1) brightness(.56) blur(2.8px);
        opacity: .40;
        z-index: 2;
      }

      @media (max-width: 1050px) {
        .project-carousel .project-card.carousel-focus-active { transform: scale(1.38); }
        .project-carousel .project-card.carousel-focus-side { transform: scale(.67); }
      }

      @media (max-width: 700px) {
        .project-carousel .project-card { transform: scale(.82); filter: grayscale(1) brightness(.68) blur(1.25px); opacity: .48; }
        .project-carousel .project-card.carousel-focus-active { transform: scale(1.10); filter: none; opacity: 1; }
        .project-carousel .project-card.carousel-focus-side { transform: scale(.82); filter: grayscale(1) brightness(.64) blur(1.4px); opacity: .44; }
      }

      @media (prefers-reduced-motion: reduce) {
        .project-carousel .project-card { transition: none !important; }
      }
    `;
    document.head.appendChild(style);

    /* Add real layout spacers so the first and last cards can both be centered. */
    var startSpacer = document.createElement('div');
    var endSpacer = document.createElement('div');
    startSpacer.className = 'carousel-focus-spacer carousel-focus-spacer-start';
    endSpacer.className = 'carousel-focus-spacer carousel-focus-spacer-end';
    startSpacer.setAttribute('aria-hidden', 'true');
    endSpacer.setAttribute('aria-hidden', 'true');

    function syncSpacers() {
      var width = cards[0].getBoundingClientRect().width;
      var gap = parseFloat(getComputedStyle(grid).gap) || 0;
      var spacer = Math.max(0, (grid.clientWidth - width) / 2 - gap / 2);
      startSpacer.style.flex = '0 0 ' + spacer + 'px';
      endSpacer.style.flex = '0 0 ' + spacer + 'px';
    }

    grid.insertBefore(startSpacer, cards[0]);
    grid.appendChild(endSpacer);

    function applyFocus(index) {
      activeIndex = (index + cards.length) % cards.length;
      cards.forEach(function (card, cardIndex) {
        card.classList.remove('carousel-focus-active', 'carousel-focus-side');
        if (cardIndex === activeIndex) {
          card.classList.add('carousel-focus-active');
        } else if (cardIndex === activeIndex - 1 || cardIndex === activeIndex + 1) {
          card.classList.add('carousel-focus-side');
        }
      });
    }

    function centerIndex(index, behavior) {
      syncSpacers();
      var card = cards[index];
      if (!card) return;

      var target = card.offsetLeft - ((grid.clientWidth - card.offsetWidth) / 2);
      var maxScroll = Math.max(0, grid.scrollWidth - grid.clientWidth);
      target = Math.max(0, Math.min(target, maxScroll));

      grid.scrollTo({
        left: target,
        behavior: reducedMotion ? 'auto' : (behavior || 'smooth')
      });
    }

    function nearestIndex() {
      var center = grid.scrollLeft + (grid.clientWidth / 2);
      var best = 0;
      var distance = Infinity;

      cards.forEach(function (card, index) {
        var cardCenter = card.offsetLeft + (card.offsetWidth / 2);
        var delta = Math.abs(cardCenter - center);
        if (delta < distance) {
          distance = delta;
          best = index;
        }
      });

      return best;
    }

    function settleManualScroll() {
      if (pendingTimer) window.clearTimeout(pendingTimer);
      pendingTimer = window.setTimeout(function () {
        pendingTimer = null;
        if (isDragging) return;
        var index = nearestIndex();
        applyFocus(index);
        centerIndex(index, 'smooth');
      }, 120);
    }

    /* Programmatic movement from the existing portfolio carousel is redirected
       to an exact card index. This prevents the original scrollBy/scrollTo logic
       from skipping GENESIS or landing between cards. */
    var nativeScrollBy = grid.scrollBy.bind(grid);
    var nativeScrollTo = grid.scrollTo.bind(grid);

    grid.scrollBy = function (options, y) {
      var delta = typeof options === 'number' ? options : Number((options || {}).left || 0);
      if (Math.abs(delta) < 1) return;

      var direction = delta > 0 ? 1 : -1;
      applyFocus(activeIndex + direction);
      centerIndex(activeIndex, 'smooth');
    };

    grid.scrollTo = function (options, y) {
      var left = typeof options === 'number' ? options : Number((options || {}).left || 0);

      /* Existing autoplay uses scrollTo({left:0}) to wrap at the end. */
      if (typeof options === 'object' && left === 0 && activeIndex >= cards.length - 1) {
        applyFocus(0);
        centerIndex(0, reducedMotion ? 'auto' : 'smooth');
        return;
      }

      if (typeof options === 'object' && Number.isFinite(left)) {
        nativeScrollTo({ left: left, behavior: reducedMotion ? 'auto' : (options.behavior || 'smooth') });
      } else {
        nativeScrollTo(options, y);
      }
    };

    /* Native touch/trackpad scrolling still works; after release the nearest
       card becomes the active centered card. */
    grid.addEventListener('touchstart', function () {
      isDragging = true;
      if (pendingTimer) window.clearTimeout(pendingTimer);
    }, { passive: true });

    grid.addEventListener('touchend', function () {
      isDragging = false;
      settleManualScroll();
    }, { passive: true });

    grid.addEventListener('touchcancel', function () {
      isDragging = false;
      settleManualScroll();
    }, { passive: true });

    grid.addEventListener('pointerdown', function () {
      isDragging = true;
    }, { passive: true });

    grid.addEventListener('pointerup', function () {
      isDragging = false;
      settleManualScroll();
    }, { passive: true });

    grid.addEventListener('pointercancel', function () {
      isDragging = false;
      settleManualScroll();
    }, { passive: true });

    grid.addEventListener('wheel', settleManualScroll, { passive: true });

    grid.addEventListener('scroll', function () {
      /* Keep focus visual only; do not repeatedly change scrollLeft while scrolling. */
      if (!isDragging && !pendingTimer) {
        applyFocus(nearestIndex());
      }
    }, { passive: true });

    window.addEventListener('resize', function () {
      syncSpacers();
      centerIndex(activeIndex, reducedMotion ? 'auto' : 'smooth');
    }, { passive: true });

    /* Guaranteed initial state: GENESIS (project 01) is centered and highlighted. */
    syncSpacers();
    applyFocus(0);
    centerIndex(0, 'auto');

    /* Re-center after fonts/layout finish. */
    window.setTimeout(function () {
      syncSpacers();
      applyFocus(activeIndex);
      centerIndex(activeIndex, 'auto');
    }, 350);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}());

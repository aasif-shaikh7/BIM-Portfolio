/* BIM Portfolio — Focus Carousel v1.2.3 */
(function () {
  'use strict';

  function init() {
    var grid = document.querySelector('.project-grid');
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.project-card'));
    if (cards.length < 3) return;

    var activeIndex = 0;
    var rafId = null;
    var correctionTimer = null;
    var isProgrammaticScroll = false;
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var style = document.createElement('style');
    style.setAttribute('data-carousel-focus', 'v1.2.3');
    style.textContent = `
      /* Stable center-focus carousel. Layout space stays fixed; only visual scale changes. */
      .project-carousel {
        overflow-x: auto !important;
        overflow-y: visible !important;
        scroll-snap-type: none !important;
        scroll-behavior: auto !important;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding-left: var(--carousel-focus-gutter, 0px) !important;
        padding-right: var(--carousel-focus-gutter, 0px) !important;
        box-sizing: border-box;
      }

      .project-carousel::-webkit-scrollbar { display:none; }

      .project-carousel .project-card {
        position:relative;
        transform: scale(.67);
        transform-origin:center center;
        filter:grayscale(1) brightness(.64) blur(2.5px);
        opacity:.42;
        z-index:1;
        transition:transform 650ms cubic-bezier(.22,.61,.36,1),filter 650ms ease,opacity 650ms ease,box-shadow 650ms ease,border-color 650ms ease;
        will-change:transform,filter,opacity;
        flex-shrink:0;
      }

      .project-carousel .project-card.carousel-focus-active {
        transform:scale(1.66);
        filter:none;
        opacity:1;
        z-index:10;
        border-color:rgba(255,79,163,.76);
        box-shadow:0 26px 74px rgba(0,0,0,.46),0 0 0 2px rgba(118,88,255,.32),0 0 44px rgba(255,79,163,.22),0 0 82px rgba(118,88,255,.16);
      }

      .project-carousel .project-card.carousel-focus-side {
        transform:scale(.67);
        filter:grayscale(1) brightness(.58) blur(2.8px);
        opacity:.40;
        z-index:2;
      }

      .project-carousel .project-card.carousel-focus-active,
      .project-carousel .project-card.carousel-focus-side { pointer-events:auto; }

      @media(max-width:1050px){
        .project-carousel .project-card.carousel-focus-active{transform:scale(1.38);}
        .project-carousel .project-card.carousel-focus-side{transform:scale(.67);}
      }

      @media(max-width:700px){
        .project-carousel .project-card{transform:scale(.82);filter:grayscale(.92) brightness(.68) blur(1.25px);opacity:.48;}
        .project-carousel .project-card.carousel-focus-active{transform:scale(1.10);filter:none;opacity:1;}
        .project-carousel .project-card.carousel-focus-side{transform:scale(.82);filter:grayscale(1) brightness(.64) blur(1.4px);opacity:.44;}
      }

      @media(prefers-reduced-motion:reduce){
        .project-carousel .project-card{transition:none!important;}
      }
    `;
    document.head.appendChild(style);

    function cardWidth() {
      return cards[0] ? cards[0].getBoundingClientRect().width : 0;
    }

    function cardStep() {
      var first = cards[0];
      if (!first) return 0;
      var gap = parseFloat(getComputedStyle(grid).gap) || 0;
      return first.getBoundingClientRect().width + gap;
    }

    function setGutter() {
      var width = cardWidth();
      if (!width) return;
      var gutter = Math.max(0, (grid.clientWidth - width) / 2);
      grid.style.setProperty('--carousel-focus-gutter', gutter + 'px');
    }

    function centerCard(index, behavior) {
      if (!cards[index]) return;
      setGutter();

      var card = cards[index];
      var target = card.offsetLeft - ((grid.clientWidth - card.offsetWidth) / 2);
      var maxScroll = Math.max(0, grid.scrollWidth - grid.clientWidth);
      target = Math.max(0, Math.min(target, maxScroll));

      isProgrammaticScroll = true;
      if (reducedMotion) {
        grid.scrollLeft = target;
      } else {
        grid.scrollTo({
          left: target,
          behavior: behavior || 'smooth'
        });
      }

      window.setTimeout(function () {
        isProgrammaticScroll = false;
        updateFocusFromPosition();
      }, reducedMotion ? 0 : 720);
    }

    function nearestIndex() {
      var viewportCenter = grid.scrollLeft + (grid.clientWidth / 2);
      var best = 0;
      var bestDistance = Infinity;

      cards.forEach(function (card, index) {
        var center = card.offsetLeft + (card.offsetWidth / 2);
        var distance = Math.abs(center - viewportCenter);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });

      return best;
    }

    function applyFocus(index) {
      activeIndex = Math.max(0, Math.min(cards.length - 1, index));

      cards.forEach(function (card, index) {
        card.classList.remove('carousel-focus-active', 'carousel-focus-side');
        if (index === activeIndex) {
          card.classList.add('carousel-focus-active');
        } else if (index === activeIndex - 1 || index === activeIndex + 1) {
          card.classList.add('carousel-focus-side');
        }
      });
    }

    function updateFocusFromPosition() {
      var index = nearestIndex();
      applyFocus(index);
    }

    function scheduleFocusUpdate() {
      if (rafId) return;
      rafId = window.requestAnimationFrame(function () {
        rafId = null;
        updateFocusFromPosition();
      });
    }

    function settleAfterScroll() {
      if (correctionTimer) window.clearTimeout(correctionTimer);
      correctionTimer = window.setTimeout(function () {
        correctionTimer = null;
        if (isProgrammaticScroll) return;
        var index = nearestIndex();
        applyFocus(index);
        centerCard(index, reducedMotion ? 'auto' : 'smooth');
      }, 100);
    }

    /*
     * The existing portfolio carousel uses scrollBy/scrollTo. Wrap those methods
     * so its autoplay still works, but every movement settles on a truly centered card.
     * Native touch/drag scrolling remains untouched.
     */
    var originalScrollBy = grid.scrollBy.bind(grid);
    var originalScrollTo = grid.scrollTo.bind(grid);

    grid.scrollBy = function (options, y) {
      if (typeof options === 'number') {
        originalScrollBy(options, y);
      } else {
        originalScrollBy(options || { left: 0, top: 0 });
      }
      settleAfterScroll();
    };

    grid.scrollTo = function (options, y) {
      if (typeof options === 'number') {
        originalScrollTo(options, y);
        settleAfterScroll();
        return;
      }

      if (options && Object.prototype.hasOwnProperty.call(options, 'top') &&
          Object.prototype.hasOwnProperty.call(options, 'left') &&
          Number(options.left) === 0 && activeIndex > 0) {
        /* Existing carousel uses scrollTo({left:0}) at the end. Instead of a visible
           jump from the last card to the left edge, wrap cleanly to card 0's center. */
        centerCard(0, reducedMotion ? 'auto' : 'smooth');
        return;
      }

      originalScrollTo(options || { left: 0, top: 0 });
      settleAfterScroll();
    };

    grid.addEventListener('scroll', function () {
      scheduleFocusUpdate();
      settleAfterScroll();
    }, { passive:true });

    grid.addEventListener('touchstart', function () {
      if (correctionTimer) window.clearTimeout(correctionTimer);
    }, { passive:true });

    grid.addEventListener('touchend', function () {
      var index = nearestIndex();
      applyFocus(index);
      centerCard(index, reducedMotion ? 'auto' : 'smooth');
    }, { passive:true });

    grid.addEventListener('wheel', function () {
      settleAfterScroll();
    }, { passive:true });

    window.addEventListener('resize', function () {
      setGutter();
      centerCard(activeIndex, reducedMotion ? 'auto' : 'smooth');
    }, { passive:true });

    /* Stable initial state: first card is centered before visual emphasis is shown. */
    setGutter();
    applyFocus(0);
    centerCard(0, reducedMotion ? 'auto' : 'auto');

    /* Re-apply once layout/fonts have settled. */
    window.setTimeout(function () {
      setGutter();
      centerCard(activeIndex, reducedMotion ? 'auto' : 'auto');
    }, 250);
    window.setTimeout(function () {
      updateFocusFromPosition();
    }, 900);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }
}());

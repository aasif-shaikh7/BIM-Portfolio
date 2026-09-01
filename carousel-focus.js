/* BIM Portfolio — Focus Carousel v1.2.4 */
(function () {
  'use strict';

  function init() {
    var grid = document.querySelector('.project-grid');
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.project-card'));
    if (cards.length < 3) return;

    /* Remove any stale focus classes from an older cached script. */
    cards.forEach(function (card) {
      card.classList.remove('carousel-focus-active', 'carousel-focus-side');
    });

    var activeIndex = 0;
    var settleTimer = null;
    var resizeTimer = null;
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var style = document.createElement('style');
    style.setAttribute('data-carousel-focus', 'v1.2.4');
    style.textContent = `
      /*
       * Stable focus mode.
       * IMPORTANT: visual scale never participates in layout calculations.
       * Only the carousel scroll position chooses the active card.
       */
      .project-carousel {
        position:relative;
        overflow-x:auto !important;
        overflow-y:visible !important;
        scroll-snap-type:none !important;
        scroll-behavior:auto !important;
        scrollbar-width:none;
        -ms-overflow-style:none;
      }

      .project-carousel::-webkit-scrollbar { display:none; }

      .project-carousel .project-card {
        flex:0 0 calc((100% - 36px) / 3) !important;
        min-width:0;
        position:relative;
        transform:scale(.72);
        transform-origin:center center;
        filter:grayscale(1) brightness(.58) blur(2.4px);
        opacity:.42;
        z-index:1;
        transition:transform 620ms cubic-bezier(.22,.61,.36,1),filter 620ms ease,opacity 620ms ease,box-shadow 620ms ease,border-color 620ms ease;
        will-change:transform,filter,opacity;
      }

      .project-carousel .project-card.carousel-focus-active {
        transform:scale(1.50);
        filter:none;
        opacity:1;
        z-index:10;
        border-color:rgba(255,79,163,.78);
        box-shadow:0 28px 82px rgba(0,0,0,.48),0 0 0 2px rgba(118,88,255,.36),0 0 42px rgba(255,79,163,.22),0 0 80px rgba(118,88,255,.17);
      }

      .project-carousel .project-card.carousel-focus-side {
        transform:scale(.67);
        filter:grayscale(1) brightness(.55) blur(2.8px);
        opacity:.38;
        z-index:2;
      }

      /* Keep the focus effect inside the visible carousel area. */
      .project-carousel-section { overflow:visible !important; }

      @media(max-width:1050px){
        .project-carousel .project-card { flex-basis:calc((100% - 18px) / 2) !important; }
        .project-carousel .project-card.carousel-focus-active { transform:scale(1.22); }
        .project-carousel .project-card.carousel-focus-side { transform:scale(.72); }
      }

      @media(max-width:700px){
        .project-carousel .project-card { flex-basis:88% !important; transform:scale(.84); opacity:.48; filter:grayscale(.95) brightness(.66) blur(1.3px); }
        .project-carousel .project-card.carousel-focus-active { transform:scale(1.08); filter:none; opacity:1; }
        .project-carousel .project-card.carousel-focus-side { transform:scale(.82); filter:grayscale(1) brightness(.63) blur(1.4px); opacity:.44; }
      }

      @media(prefers-reduced-motion:reduce){
        .project-carousel .project-card { transition:none !important; }
      }
    `;
    document.head.appendChild(style);

    function gapSize() {
      return parseFloat(getComputedStyle(grid).gap) || 18;
    }

    function cardWidth() {
      return cards[0] ? cards[0].offsetWidth : 0;
    }

    /*
     * Since flex items have fixed layout widths, the center target is stable:
     * target = card's layout-left - (viewport-width - card-width) / 2.
     */
    function centerTarget(index) {
      var card = cards[index];
      if (!card) return 0;

      var target = card.offsetLeft - ((grid.clientWidth - card.offsetWidth) / 2);
      var max = Math.max(0, grid.scrollWidth - grid.clientWidth);
      return Math.max(0, Math.min(target, max));
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

    function updateFocus(index) {
      activeIndex = Math.max(0, Math.min(index, cards.length - 1));

      cards.forEach(function (card, cardIndex) {
        card.classList.remove('carousel-focus-active', 'carousel-focus-side');
        if (cardIndex === activeIndex) {
          card.classList.add('carousel-focus-active');
        } else if (cardIndex === activeIndex - 1 || cardIndex === activeIndex + 1) {
          card.classList.add('carousel-focus-side');
        }
      });
    }

    function centerActive(behavior) {
      var target = centerTarget(activeIndex);
      if (reducedMotion || behavior === 'auto') {
        grid.scrollLeft = target;
      } else {
        grid.scrollTo({ left:target, behavior:'smooth' });
      }
    }

    function settle() {
      if (settleTimer) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(function () {
        settleTimer = null;
        var index = nearestIndex();
        updateFocus(index);
        centerActive(reducedMotion ? 'auto' : 'smooth');
      }, 110);
    }

    /* Guard against the original carousel's repeated autoplay calls. */
    function patchScrollMethods() {
      if (grid.dataset.focusPatched === 'true') return;
      grid.dataset.focusPatched = 'true';

      var nativeScrollBy = Element.prototype.scrollBy;
      var nativeScrollTo = Element.prototype.scrollTo;

      grid.scrollBy = function () {
        nativeScrollBy.apply(grid, arguments);
        settle();
      };

      grid.scrollTo = function (options, y) {
        if (options && typeof options === 'object' && Number(options.left) === 0 && activeIndex === cards.length - 1) {
          activeIndex = 0;
          updateFocus(0);
          nativeScrollTo.call(grid, {left:centerTarget(0), behavior:reducedMotion ? 'auto' : 'smooth'});
          return;
        }
        nativeScrollTo.apply(grid, arguments);
        settle();
      };
    }

    function updateFromScroll() {
      updateFocus(nearestIndex());
      settle();
    }

    /* Mouse wheel + touch drag: allow natural movement, then center the nearest card. */
    grid.addEventListener('scroll', updateFromScroll, { passive:true });
    grid.addEventListener('touchstart', function () {
      if (settleTimer) window.clearTimeout(settleTimer);
    }, { passive:true });
    grid.addEventListener('touchend', function () {
      updateFocus(nearestIndex());
      centerActive(reducedMotion ? 'auto' : 'smooth');
    }, { passive:true });
    grid.addEventListener('pointerdown', function () {
      if (settleTimer) window.clearTimeout(settleTimer);
    });
    grid.addEventListener('pointerup', function () {
      updateFocus(nearestIndex());
      centerActive(reducedMotion ? 'auto' : 'smooth');
    });

    /* Pause the existing autoplay while the pointer is over the cards. */
    grid.addEventListener('mouseenter', function () {
      grid.dataset.focusHover = 'true';
    });
    grid.addEventListener('mouseleave', function () {
      grid.dataset.focusHover = 'false';
    });

    /* Keep the active card centered after responsive layout changes. */
    window.addEventListener('resize', function () {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        centerActive(reducedMotion ? 'auto' : 'smooth');
      }, 100);
    }, { passive:true });

    patchScrollMethods();

    /* Initial state: center card #1, then let the existing autoplay move it. */
    updateFocus(0);
    centerActive('auto');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }
}());

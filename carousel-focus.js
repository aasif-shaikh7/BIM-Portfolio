/* BIM Portfolio — Focus Carousel v1.2.0 */
(function () {
  'use strict';

  function init() {
    var grid = document.querySelector('.project-grid');
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.project-card'));
    if (cards.length < 3) return;

    var style = document.createElement('style');
    style.setAttribute('data-carousel-focus', 'v1.2.0');
    style.textContent = `
      /* Focused center-card presentation */
      .project-carousel .project-card {
        transform: scale(.92);
        filter: grayscale(0) blur(0);
        opacity: .88;
        z-index: 1;
        transform-origin: center center;
        transition: transform 650ms cubic-bezier(.22,.61,.36,1), filter 650ms ease, opacity 650ms ease, box-shadow 650ms ease;
        will-change: transform, filter, opacity;
      }

      .project-carousel .project-card.carousel-focus-active {
        transform: scale(1.42);
        filter: none;
        opacity: 1;
        z-index: 10;
        box-shadow: 0 24px 70px rgba(0,0,0,.42), 0 0 38px rgba(255,79,163,.18), 0 0 70px rgba(118,88,255,.16);
      }

      .project-carousel .project-card.carousel-focus-side {
        transform: scale(.67);
        filter: grayscale(.92) blur(2px);
        opacity: .5;
        z-index: 2;
      }

      /* Keep the focus effect inside the carousel viewport. */
      .project-carousel {
        overflow-x: clip;
        overflow-y: visible;
      }

      /* The scroll container must remain usable for touch and arrows. */
      .project-carousel .project-card.carousel-focus-active,
      .project-carousel .project-card.carousel-focus-side {
        pointer-events: auto;
      }

      @media (max-width: 1050px) {
        .project-carousel .project-card.carousel-focus-active { transform: scale(1.28); }
        .project-carousel .project-card.carousel-focus-side { transform: scale(.74); }
      }

      @media (max-width: 700px) {
        .project-carousel .project-card { transform: scale(.96); opacity: .78; }
        .project-carousel .project-card.carousel-focus-active {
          transform: scale(1.08);
          filter: none;
          opacity: 1;
        }
        .project-carousel .project-card.carousel-focus-side {
          transform: scale(.86);
          filter: grayscale(.8) blur(1px);
          opacity: .58;
        }
      }
    `;
    document.head.appendChild(style);

    var rafId = null;
    var ticking = false;

    function updateFocus() {
      ticking = false;

      var rect = grid.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var ranked = cards.map(function (card, index) {
        var cardRect = card.getBoundingClientRect();
        var center = cardRect.left + cardRect.width / 2;
        return {
          card: card,
          index: index,
          distance: Math.abs(center - centerX),
          center: center
        };
      }).sort(function (a, b) {
        return a.distance - b.distance;
      });

      var active = ranked[0];
      if (!active) return;

      cards.forEach(function (card) {
        card.classList.remove('carousel-focus-active', 'carousel-focus-side');
      });

      active.card.classList.add('carousel-focus-active');

      /* Only the immediately visible neighbor on each side is dimmed. */
      var visibleNeighbors = ranked
        .filter(function (item) {
          return item.index !== active.index && item.distance < rect.width;
        })
        .sort(function (a, b) { return a.distance - b.distance; })
        .slice(0, 2);

      visibleNeighbors.forEach(function (item) {
        item.card.classList.add('carousel-focus-side');
      });
    }

    function scheduleUpdate() {
      if (ticking) return;
      ticking = true;
      rafId = window.requestAnimationFrame(updateFocus);
    }

    grid.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    /* Recalculate after the existing carousel script starts moving. */
    window.setTimeout(updateFocus, 100);
    window.setTimeout(updateFocus, 700);
    window.setTimeout(updateFocus, 1400);

    /* Keep focus synchronized during smooth scrolling. */
    if ('MutationObserver' in window) {
      var observer = new MutationObserver(scheduleUpdate);
      observer.observe(grid, { childList: false, subtree: true, attributes: false });
    }

    /* Respect reduced-motion users. */
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion && reducedMotion.matches) {
      style.textContent += '\n.project-carousel .project-card,.project-carousel .project-card.carousel-focus-active,.project-carousel .project-card.carousel-focus-side{transition:none!important;}';
    }

    /* Avoid an unused requestAnimationFrame handle warning in older browsers. */
    void rafId;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}());

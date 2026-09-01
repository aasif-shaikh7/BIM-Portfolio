/* BIM Portfolio — Focus Carousel v1.2.2 */
(function () {
  'use strict';

  function init() {
    var grid = document.querySelector('.project-grid');
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.project-card'));
    if (cards.length < 3) return;

    var style = document.createElement('style');
    style.setAttribute('data-carousel-focus', 'v1.2.2');
    style.textContent = `
      /* Center-focus presentation: active card ~2/3 larger; visible neighbors ~1/3 smaller. */
      .project-carousel .project-card {
        transform: scale(.67);
        filter: grayscale(1) brightness(.68) blur(2.5px);
        opacity: .46;
        z-index: 1;
        transform-origin: center center;
        transition: transform 650ms cubic-bezier(.22,.61,.36,1), filter 650ms ease, opacity 650ms ease, box-shadow 650ms ease, border-color 650ms ease;
        will-change: transform, filter, opacity;
      }

      .project-carousel .project-card.carousel-focus-active {
        transform: scale(1.66);
        filter: none;
        opacity: 1;
        z-index: 10;
        border-color: rgba(255,79,163,.72);
        box-shadow: 0 28px 80px rgba(0,0,0,.46), 0 0 0 2px rgba(118,88,255,.35), 0 0 42px rgba(255,79,163,.22), 0 0 78px rgba(118,88,255,.18);
      }

      /* Keep adjacent cards visible but clearly de-emphasized. */
      .project-carousel .project-card.carousel-focus-side {
        transform: scale(.67);
        filter: grayscale(1) brightness(.62) blur(2.5px);
        opacity: .42;
        z-index: 2;
      }

      /* Important: the carousel must remain scrollable. */
      .project-carousel {
        overflow-x: auto;
        overflow-y: visible;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .project-carousel::-webkit-scrollbar { display: none; }
      .project-carousel .project-card.carousel-focus-active,
      .project-carousel .project-card.carousel-focus-side { pointer-events: auto; }

      @media (max-width: 1050px) {
        .project-carousel .project-card.carousel-focus-active { transform: scale(1.38); }
        .project-carousel .project-card.carousel-focus-side { transform: scale(.67); }
      }

      @media (max-width: 700px) {
        /* Mobile keeps the focus treatment usable instead of creating an oversized card. */
        .project-carousel .project-card { transform: scale(.82); opacity: .55; filter: grayscale(.9) brightness(.72) blur(1.2px); }
        .project-carousel .project-card.carousel-focus-active {
          transform: scale(1.10);
          filter: none;
          opacity: 1;
          border-color: rgba(255,79,163,.72);
          box-shadow: 0 18px 45px rgba(0,0,0,.38), 0 0 0 2px rgba(118,88,255,.28), 0 0 30px rgba(255,79,163,.18);
        }
        .project-carousel .project-card.carousel-focus-side {
          transform: scale(.82);
          filter: grayscale(1) brightness(.68) blur(1.2px);
          opacity: .48;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .project-carousel .project-card { transition: none !important; }
      }
    `;
    document.head.appendChild(style);

    var ticking = false;

    /*
     * Determine focus from the scroll coordinate, not transformed getBoundingClientRect().
     * This prevents the scale transform from changing which card is considered the center.
     */
    function updateFocus() {
      ticking = false;

      var viewportCenter = grid.scrollLeft + (grid.clientWidth / 2);
      var ranked = cards.map(function (card, index) {
        return {
          card: card,
          index: index,
          center: card.offsetLeft + (card.offsetWidth / 2),
          distance: Math.abs((card.offsetLeft + (card.offsetWidth / 2)) - viewportCenter)
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

      /* Only the immediate left/right neighbors receive the muted treatment. */
      if (cards[active.index - 1]) cards[active.index - 1].classList.add('carousel-focus-side');
      if (cards[active.index + 1]) cards[active.index + 1].classList.add('carousel-focus-side');
    }

    function scheduleUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateFocus);
    }

    grid.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    /* Re-evaluate focus after the existing autoplay script changes scroll position. */
    [100, 500, 1000, 1500].forEach(function (delay) {
      window.setTimeout(updateFocus, delay);
    });

    updateFocus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}());

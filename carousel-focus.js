/* BIM Portfolio — Focus Carousel v1.2.1 */
(function () {
  'use strict';

  function init() {
    var grid = document.querySelector('.project-grid');
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.project-card'));
    if (cards.length < 3) return;

    var style = document.createElement('style');
    style.setAttribute('data-carousel-focus', 'v1.2.1');
    style.textContent = `
      /* Focused center-card presentation: ~2/3 larger, side cards ~1/3 smaller. */
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
        transform: scale(1.66);
        filter: none;
        opacity: 1;
        z-index: 10;
        box-shadow: 0 28px 80px rgba(0,0,0,.46), 0 0 42px rgba(255,79,163,.20), 0 0 78px rgba(118,88,255,.18);
      }

      .project-carousel .project-card.carousel-focus-side {
        transform: scale(.67);
        filter: grayscale(.94) blur(2.5px);
        opacity: .48;
        z-index: 2;
      }

      .project-carousel {
        overflow-x: clip;
        overflow-y: visible;
      }

      .project-carousel .project-card.carousel-focus-active,
      .project-carousel .project-card.carousel-focus-side {
        pointer-events: auto;
      }

      @media (max-width: 1050px) {
        .project-carousel .project-card.carousel-focus-active { transform: scale(1.38); }
        .project-carousel .project-card.carousel-focus-side { transform: scale(.67); }
      }

      @media (max-width: 700px) {
        .project-carousel .project-card { transform: scale(.96); opacity: .78; }
        .project-carousel .project-card.carousel-focus-active {
          transform: scale(1.10);
          filter: none;
          opacity: 1;
        }
        .project-carousel .project-card.carousel-focus-side {
          transform: scale(.82);
          filter: grayscale(.88) blur(1.2px);
          opacity: .56;
        }
      }
    `;
    document.head.appendChild(style);

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
          distance: Math.abs(center - centerX)
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

      /* Dim only the two nearest visible neighbors. */
      ranked
        .filter(function (item) {
          return item.index !== active.index && item.distance < rect.width;
        })
        .slice(0, 2)
        .forEach(function (item) {
          item.card.classList.add('carousel-focus-side');
        });
    }

    function scheduleUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateFocus);
    }

    grid.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    window.setTimeout(updateFocus, 100);
    window.setTimeout(updateFocus, 700);
    window.setTimeout(updateFocus, 1400);

    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion && reducedMotion.matches) {
      style.textContent += '\n.project-carousel .project-card,.project-carousel .project-card.carousel-focus-active,.project-carousel .project-card.carousel-focus-side{transition:none!important;}';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}());

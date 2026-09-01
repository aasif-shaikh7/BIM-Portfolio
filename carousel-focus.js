/* BIM Portfolio — Project Focus Carousel v1.2.5 */
(function () {
  'use strict';

  var VERSION = '1.2.5';

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
      .project-grid[data-focus-carousel-version] {
        display:flex!important; flex-wrap:nowrap!important; align-items:center!important;
        gap:28px!important; overflow-x:auto!important; overflow-y:visible!important;
        width:100%!important; max-width:none!important; padding-top:110px!important;
        padding-bottom:110px!important; padding-left:0!important; padding-right:0!important;
        margin:-110px 0!important; scroll-snap-type:none!important; scroll-behavior:auto!important;
        scrollbar-width:none!important; -ms-overflow-style:none!important;
        overscroll-behavior-x:contain; -webkit-overflow-scrolling:touch;
      }
      .project-grid[data-focus-carousel-version]::-webkit-scrollbar{display:none!important}
      .project-grid[data-focus-carousel-version]>.project-card{
        flex:0 0 var(--carousel-card-width)!important; width:var(--carousel-card-width)!important;
        min-width:var(--carousel-card-width)!important; position:relative;
        transform:scale(.67); transform-origin:center center;
        filter:grayscale(1) brightness(.52) blur(3px); opacity:.38; z-index:1;
        transition:transform 620ms cubic-bezier(.22,.61,.36,1),filter 620ms ease,opacity 620ms ease,box-shadow 620ms ease,border-color 620ms ease;
        will-change:transform,filter,opacity;
      }
      .project-grid[data-focus-carousel-version]>.project-card.carousel-focus-active{
        transform:scale(1.66); filter:none; opacity:1; z-index:10;
        border-color:rgba(255,79,163,.85);
        box-shadow:0 30px 80px rgba(0,0,0,.46),0 0 0 2px rgba(118,88,255,.34),0 0 44px rgba(255,79,163,.24),0 0 84px rgba(118,88,255,.18);
      }
      .project-grid[data-focus-carousel-version]>.project-card.carousel-focus-side{
        transform:scale(.67); filter:grayscale(1) brightness(.48) blur(3.2px); opacity:.34; z-index:2;
      }
      .project-grid[data-focus-carousel-version]>.project-card:hover{transform:var(--carousel-transform)}
      .project-grid[data-focus-carousel-version]>.project-card{--carousel-transform:scale(.67)}
      .project-grid[data-focus-carousel-version]>.project-card.carousel-focus-active{--carousel-transform:scale(1.66)}
      @media(max-width:1050px){
        .project-grid[data-focus-carousel-version]{gap:22px!important}
        .project-grid[data-focus-carousel-version]>.project-card.carousel-focus-active{transform:scale(1.42);--carousel-transform:scale(1.42)}
      }
      @media(max-width:700px){
        .project-grid[data-focus-carousel-version]{gap:16px!important;padding-top:65px!important;padding-bottom:65px!important;margin:-65px 0!important}
        .project-grid[data-focus-carousel-version]>.project-card{transform:scale(.82);filter:grayscale(1) brightness(.64) blur(1.2px);opacity:.46;--carousel-transform:scale(.82)}
        .project-grid[data-focus-carousel-version]>.project-card.carousel-focus-active{transform:scale(1.10);--carousel-transform:scale(1.10);filter:none;opacity:1}
        .project-grid[data-focus-carousel-version]>.project-card.carousel-focus-side{transform:scale(.82);--carousel-transform:scale(.82);filter:grayscale(1) brightness(.62) blur(1.3px);opacity:.42}
      }
      @media(prefers-reduced-motion:reduce){.project-grid[data-focus-carousel-version]>.project-card{transition:none!important}}
    `;
    document.head.appendChild(style);

    function layout() {
      var trackWidth = track.clientWidth;
      var gap = window.innerWidth <= 700 ? 16 : (window.innerWidth <= 1050 ? 22 : 28);
      var cardWidth;
      if (window.innerWidth <= 700) cardWidth = Math.max(220, trackWidth - 56);
      else if (window.innerWidth <= 1050) cardWidth = Math.max(260, (trackWidth - gap) / 2);
      else cardWidth = Math.max(280, (trackWidth - gap * 2) / 3);
      track.style.setProperty('--carousel-card-width', cardWidth + 'px');
      var gutter = Math.max(0, (trackWidth - cardWidth) / 2);
      track.style.paddingLeft = gutter + 'px';
      track.style.paddingRight = gutter + 'px';
    }

    function setClasses(index) {
      activeIndex = (index + cards.length) % cards.length;
      cards.forEach(function(card, i) {
        card.classList.remove('carousel-focus-active','carousel-focus-side');
        if (i === activeIndex) card.classList.add('carousel-focus-active');
        else if (i === activeIndex - 1 || i === activeIndex + 1) card.classList.add('carousel-focus-side');
      });
    }

    function getTarget(index) {
      var card = cards[index];
      if (!card) return 0;
      layout();
      var target = card.offsetLeft - ((track.clientWidth - card.offsetWidth) / 2);
      var maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      return Math.max(0, Math.min(target, maxScroll));
    }

    function centerCard(index, behavior) {
      var target = getTarget(index);
      var useBehavior = reducedMotion ? 'auto' : (behavior || 'smooth');
      isProgrammaticScroll = true;
      if (programmaticTimer) window.clearTimeout(programmaticTimer);
      track.scrollTo({left:target, behavior:useBehavior});
      programmaticTimer = window.setTimeout(function(){isProgrammaticScroll=false}, useBehavior === 'smooth' ? 850 : 80);
    }

    function nearestCard() {
      var center = track.scrollLeft + track.clientWidth / 2, best=0, bestDistance=Infinity;
      cards.forEach(function(card,index){
        var d=Math.abs((card.offsetLeft+card.offsetWidth/2)-center);
        if(d<bestDistance){bestDistance=d;best=index}
      });
      return best;
    }

    function pauseAutoplay(duration) {
      if(autoTimer){window.clearInterval(autoTimer);autoTimer=null}
      if(resumeTimer) window.clearTimeout(resumeTimer);
      if(duration !== Infinity) resumeTimer=window.setTimeout(startAutoplay,duration || 1400);
    }

    function startAutoplay() {
      if(reducedMotion || document.hidden || pointerDown || cards.length<2) return;
      if(autoTimer) window.clearInterval(autoTimer);
      /* v1.2.5: comfortable 2-second interval between automatic card changes. */
      autoTimer=window.setInterval(function(){
        if(pointerDown || document.hidden) return;
        var nextIndex=(activeIndex+1)%cards.length;
        setClasses(nextIndex);
        centerCard(nextIndex,'smooth');
      },2000);
    }

    function settleUserScroll() {
      if(settleTimer) window.clearTimeout(settleTimer);
      settleTimer=window.setTimeout(function(){
        if(isProgrammaticScroll) return;
        var index=nearestCard();
        setClasses(index);
        centerCard(index,'smooth');
        pauseAutoplay(1200);
      },130);
    }

    track.addEventListener('pointerdown',function(){pointerDown=true;pauseAutoplay(Infinity)},{passive:true});
    track.addEventListener('pointerup',function(){pointerDown=false;settleUserScroll()},{passive:true});
    track.addEventListener('pointercancel',function(){pointerDown=false;settleUserScroll()},{passive:true});
    track.addEventListener('mouseenter',function(){pauseAutoplay(Infinity)});
    track.addEventListener('mouseleave',function(){if(!pointerDown)startAutoplay()});
    track.addEventListener('wheel',function(){pauseAutoplay(1600);settleUserScroll()},{passive:true});
    track.addEventListener('scroll',function(){if(!isProgrammaticScroll&&!pointerDown)settleUserScroll()},{passive:true});

    document.addEventListener('visibilitychange',function(){
      if(document.hidden) pauseAutoplay(Infinity);
      else {layout();centerCard(activeIndex,'auto');startAutoplay()}
    });
    window.addEventListener('resize',function(){layout();centerCard(activeIndex,'auto')},{passive:true});

    setClasses(0); layout(); centerCard(0,'auto');
    window.setTimeout(function(){layout();centerCard(activeIndex,'auto');startAutoplay()},350);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
}());

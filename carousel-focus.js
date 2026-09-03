/* BIM Portfolio — Project Focus Carousel v1.5.1 / Premium horizontal carousel */
(function () {
  'use strict';

  (function loadProfessionalBIMTheme(){
    var version='1.5.1';
    function loadCss(href,attr){
      if(!document.querySelector('link['+attr+']')){
        var link=document.createElement('link');
        link.rel='stylesheet'; link.href=href; link.setAttribute(attr,version); document.head.appendChild(link);
      }
    }
    loadCss('professional-bim.css?v='+version,'data-professional-bim-theme');
    loadCss('bim-background.css?v='+version,'data-bim-background-theme');
  }());

  (function themeController(){
    var KEY='bim-portfolio-theme',modes=['system','light','dark'],media=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null,root=document.documentElement;
    function saved(){var value;try{value=localStorage.getItem(KEY)}catch(e){}return modes.indexOf(value)>=0?value:'dark'}
    function effective(mode){return mode==='system'?(media&&media.matches?'dark':'light'):mode}
    function setMeta(theme){var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',theme==='dark'?'#0b1118':'#f4f6f8')}
    function apply(mode){var theme=effective(mode);root.setAttribute('data-theme',theme);root.setAttribute('data-theme-mode',mode);root.style.colorScheme=theme;setMeta(theme);document.querySelectorAll('.theme-control button').forEach(function(btn){btn.setAttribute('aria-pressed',btn.dataset.themeMode===mode?'true':'false')})}
    function save(mode){try{localStorage.setItem(KEY,mode)}catch(e){}apply(mode)}
    function build(){if(document.querySelector('.theme-control'))return;var header=document.querySelector('.site-header');if(!header)return;var box=document.createElement('div');box.className='theme-control';box.setAttribute('role','group');box.setAttribute('aria-label','Color theme');box.innerHTML='<button type="button" data-theme-mode="system">System</button><button type="button" data-theme-mode="light">Light</button><button type="button" data-theme-mode="dark">Dark</button>';box.querySelectorAll('button').forEach(function(btn){btn.addEventListener('click',function(){save(btn.dataset.themeMode)})});var cta=header.querySelector('.nav-cta');if(cta)cta.parentNode.insertBefore(box,cta);else header.appendChild(box);apply(saved())}
    function init(){build();apply(saved())}
    if(media){var listener=function(){if(root.getAttribute('data-theme-mode')==='system')apply('system')};if(media.addEventListener)media.addEventListener('change',listener);else if(media.addListener)media.addListener(listener)}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  }());

  function initCarousel(){
    var track=document.querySelector('.project-grid');
    if(!track)return;
    var cards=Array.prototype.slice.call(track.querySelectorAll('.project-card'));
    if(cards.length<2)return;

    var active=0,timer=null,resumeTimer=null,settleTimer=null,dragging=false,hovered=false;
    var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var version='1.5.1',AUTOPLAY_MS=2000;

    /* Override legacy script scrolling so two carousel controllers cannot fight each other. */
    var nativeScrollTo=Element.prototype.scrollTo;
    var legacyScrollTo=track.scrollTo,legacyScrollBy=track.scrollBy;
    track.scrollTo=function(){return nativeScrollTo.apply(track,arguments)};
    track.scrollBy=function(){return nativeScrollTo.apply(track,arguments)};

    var style=document.createElement('style');
    style.setAttribute('data-project-focus-carousel',version);
    style.textContent='\
.project-grid{position:relative;display:flex!important;gap:0!important;overflow-x:auto!important;overflow-y:hidden!important;scroll-snap-type:x mandatory!important;scroll-behavior:auto!important;scrollbar-width:none!important;align-items:stretch!important;padding-top:18px;padding-bottom:24px}\
.project-grid::-webkit-scrollbar{display:none}\
.project-grid .project-card{flex:0 0 var(--focus-card-width)!important;width:var(--focus-card-width)!important;scroll-snap-align:center!important;transition:transform .42s cubic-bezier(.22,.61,.36,1),opacity .42s ease,filter .42s ease,box-shadow .42s ease,border-color .42s ease!important;transform:scale(.67);transform-origin:center center;opacity:.46;filter:grayscale(.9) blur(1.1px) brightness(.68);z-index:1}\
.project-grid .project-card.carousel-focus-active{transform:scale(1.35);opacity:1;filter:none;z-index:5;box-shadow:0 28px 70px rgba(0,0,0,.42)!important;border-color:var(--bim-accent)!important}\
.project-grid .project-card.carousel-focus-side{transform:scale(.67);opacity:.52;filter:grayscale(.75) blur(.8px) brightness(.72);z-index:2}\
.project-grid .project-card:hover{transform:scale(.69)!important;filter:grayscale(.55) blur(.5px) brightness(.82)}\
.project-grid .project-card.carousel-focus-active:hover{transform:scale(1.35)!important;filter:none}\
.project-carousel-label{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:8px}\
.project-carousel-label b{font-weight:700}\
@media(max-width:1050px){.project-grid .project-card{transform:scale(.76)}.project-grid .project-card.carousel-focus-active{transform:scale(1.16)}.project-grid .project-card.carousel-focus-side{transform:scale(.76)}}\
@media(max-width:700px){.project-grid{padding-top:10px;padding-bottom:18px}.project-grid .project-card{transform:scale(.82);filter:grayscale(.35) blur(.35px) brightness(.8)}.project-grid .project-card.carousel-focus-active{transform:scale(1.08);filter:none}.project-grid .project-card.carousel-focus-side{transform:scale(.82);filter:grayscale(.3) blur(.3px) brightness(.8)}.project-grid .project-card:hover{transform:scale(.84)!important}.project-grid .project-card.carousel-focus-active:hover{transform:scale(1.08)!important}}\
@media(prefers-reduced-motion:reduce){.project-grid .project-card{transition:none!important}}';
    document.head.appendChild(style);

    function layout(){
      var width=track.clientWidth;
      var viewport=window.innerWidth;
      var gap=viewport<=700?16:(viewport<=1050?22:30);
      var cardWidth;
      if(viewport<=700)cardWidth=Math.max(250,width-44);
      else if(viewport<=1050)cardWidth=Math.max(330,(width-gap)/2);
      else cardWidth=Math.max(360,Math.min(470,(width-gap*2)/3));
      track.style.setProperty('--focus-card-width',cardWidth+'px');
      var gutter=Math.max(0,(width-cardWidth)/2);
      track.style.paddingLeft=gutter+'px';
      track.style.paddingRight=gutter+'px';
      track.style.columnGap=gap+'px';
    }
    function applyState(index){
      active=(index+cards.length)%cards.length;
      cards.forEach(function(card,i){
        card.classList.remove('carousel-focus-active','carousel-focus-side');
        if(i===active)card.classList.add('carousel-focus-active');
        else if(i===active-1||i===active+1)card.classList.add('carousel-focus-side');
      });
      var counter=document.querySelector('.project-carousel-label b');
      if(counter)counter.textContent=String(active+1).padStart(2,'0');
    }
    function targetFor(index){
      layout();
      var card=cards[index],max=Math.max(0,track.scrollWidth-track.clientWidth);
      return Math.max(0,Math.min(card.offsetLeft-(track.clientWidth-card.offsetWidth)/2,max));
    }
    function center(index,smooth){nativeScrollTo.call(track,{left:targetFor(index),behavior:(!reduced&&smooth)?'smooth':'auto'})}
    function nearest(){
      var centerX=track.scrollLeft+track.clientWidth/2,best=0,distance=Infinity;
      cards.forEach(function(card,index){var d=Math.abs(card.offsetLeft+card.offsetWidth/2-centerX);if(d<distance){distance=d;best=index}});
      return best;
    }
    function stop(){if(timer){clearInterval(timer);timer=null}}
    function start(){
      stop();
      if(reduced||document.hidden||dragging||hovered)return;
      timer=setInterval(function(){if(dragging||hovered||document.hidden)return;var next=(active+1)%cards.length;applyState(next);center(next,true)},AUTOPLAY_MS);
    }
    function pause(ms){stop();if(resumeTimer)clearTimeout(resumeTimer);if(ms!==Infinity)resumeTimer=setTimeout(start,ms||1400)}
    function settle(){
      if(settleTimer)clearTimeout(settleTimer);
      settleTimer=setTimeout(function(){if(dragging)return;var index=nearest();applyState(index);center(index,true);pause(1300)},120);
    }

    track.addEventListener('mouseenter',function(){hovered=true;pause(Infinity)});
    track.addEventListener('mouseleave',function(){hovered=false;if(!dragging)start()});
    track.addEventListener('pointerdown',function(){dragging=true;pause(Infinity)});
    track.addEventListener('pointerup',function(){dragging=false;settle()});
    track.addEventListener('pointercancel',function(){dragging=false;settle()});
    track.addEventListener('touchstart',function(){dragging=true;pause(Infinity)},{passive:true});
    track.addEventListener('touchend',function(){dragging=false;settle()},{passive:true});
    track.addEventListener('touchcancel',function(){dragging=false;settle()},{passive:true});
    track.addEventListener('wheel',function(){pause(1700);settle()},{passive:true});
    track.addEventListener('scroll',function(){if(!dragging)settle()});

    var prev=document.querySelector('.project-carousel-prev'),next=document.querySelector('.project-carousel-next');
    if(prev)prev.addEventListener('click',function(){pause(1400);var i=(active-1+cards.length)%cards.length;applyState(i);center(i,true)});
    if(next)next.addEventListener('click',function(){pause(1400);var i=(active+1)%cards.length;applyState(i);center(i,true)});

    document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else{layout();center(active,false);start()}});
    window.addEventListener('resize',function(){stop();layout();center(active,false);start()},{passive:true});

    applyState(0);
    layout();
    center(0,false);
    setTimeout(function(){layout();center(active,false);start()},250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initCarousel,{once:true});else initCarousel();
}());

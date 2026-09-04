/* BIM Portfolio — Project Focus Carousel v1.5.9 / isolated text-only theme selector */
(function () {
  'use strict';

  (function loadProfessionalBIMTheme(){
    var version='1.5.9';
    function loadCss(href,attr){
      if(!document.querySelector('link['+attr+']')){
        var link=document.createElement('link');
        link.rel='stylesheet'; link.href=href; link.setAttribute(attr,version); document.head.appendChild(link);
      }
    }
    loadCss('professional-bim.css?v='+version,'data-professional-bim-theme');
    loadCss('bim-background.css?v='+version,'data-bim-background-theme');
  }());

  /* Theme selector: isolated attribute names prevent legacy icon CSS from matching these buttons. */
  (function themeController(){
    var KEY='bim-portfolio-theme';
    var modes=['system','light','dark'];
    var media=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;
    var root=document.documentElement;

    function saved(){
      var value='';
      try{value=localStorage.getItem(KEY)||''}catch(e){}
      return modes.indexOf(value)>=0?value:'dark';
    }
    function effective(mode){
      return mode==='system'?(media&&media.matches?'dark':'light'):mode;
    }
    function setMeta(theme){
      var meta=document.querySelector('meta[name="theme-color"]');
      if(meta)meta.setAttribute('content',theme==='dark'?'#0b1118':'#f4f6f8');
    }
    function apply(mode){
      var theme=effective(mode);
      root.setAttribute('data-theme',theme);
      root.setAttribute('data-theme-mode',mode);
      root.style.colorScheme=theme;
      setMeta(theme);
      document.querySelectorAll('.theme-control-text-only button').forEach(function(btn){
        btn.setAttribute('aria-pressed',btn.getAttribute('data-theme-choice')===mode?'true':'false');
      });
    }
    function save(mode){
      try{localStorage.setItem(KEY,mode)}catch(e){}
      apply(mode);
    }
    function installStyle(){
      var old=document.getElementById('theme-text-only-style');
      if(old)old.remove();
      var style=document.createElement('style');
      style.id='theme-text-only-style';
      style.textContent='\
html body header.site-header .theme-control-text-only{display:flex!important;align-items:center!important;gap:0!important;margin-left:12px!important;padding:2px!important;border:1px solid #304252!important;border-radius:7px!important;background:#121c26!important;line-height:1!important;box-sizing:border-box!important;overflow:visible!important}\
html body header.site-header .theme-control-text-only button{all:unset!important;display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;position:relative!important;min-width:58px!important;height:34px!important;padding:0 9px!important;border:0!important;border-radius:5px!important;background:transparent!important;background-image:none!important;mask:none!important;-webkit-mask:none!important;box-shadow:none!important;color:#b9c6d1!important;font-family:"Chakra Petch",Arial,sans-serif!important;font-size:12px!important;font-weight:600!important;line-height:1!important;letter-spacing:0!important;text-indent:0!important;white-space:nowrap!important;cursor:pointer!important}\
html body header.site-header .theme-control-text-only button:before,html body header.site-header .theme-control-text-only button:after{display:none!important;content:none!important;background:none!important;background-image:none!important;mask:none!important;-webkit-mask:none!important;box-shadow:none!important;border:0!important}\
html body header.site-header .theme-control-text-only button svg,html body header.site-header .theme-control-text-only button img,html body header.site-header .theme-control-text-only button i,html body header.site-header .theme-control-text-only button span{display:none!important;width:0!important;height:0!important;overflow:hidden!important}\
html body header.site-header .theme-control-text-only button[aria-pressed="true"]{background:var(--bim-accent,#4f86b5)!important;color:#071019!important}\
html[data-theme="light"] body header.site-header .theme-control-text-only{background:#f0f3f6!important;border-color:#c8d2dc!important}\
html[data-theme="light"] body header.site-header .theme-control-text-only button{color:#526270!important}\
@media(max-width:700px){html body header.site-header .theme-control-text-only{margin-left:6px!important}html body header.site-header .theme-control-text-only button{min-width:50px!important;height:30px!important;padding:0 6px!important;font-size:11px!important}}';
      document.head.appendChild(style);
    }
    function build(){
      var header=document.querySelector('.site-header');
      if(!header)return;

      header.querySelectorAll('.theme-control,.theme-control-text-only').forEach(function(el){el.remove()});

      installStyle();
      var box=document.createElement('div');
      box.className='theme-control-text-only';
      box.id='theme-control-text-only';
      box.setAttribute('role','group');
      box.setAttribute('aria-label','Color theme');

      modes.forEach(function(mode){
        var btn=document.createElement('button');
        btn.type='button';
        btn.setAttribute('data-theme-choice',mode);
        btn.setAttribute('aria-label',mode==='system'?'System theme':mode==='light'?'Light theme':'Dark theme');
        btn.setAttribute('aria-pressed','false');
        btn.appendChild(document.createTextNode(mode.charAt(0).toUpperCase()+mode.slice(1)));
        btn.addEventListener('click',function(){save(mode)});
        box.appendChild(btn);
      });

      var cta=header.querySelector('.nav-cta');
      if(cta)cta.parentNode.insertBefore(box,cta);else header.appendChild(box);
      apply(saved());
    }
    function init(){build();apply(saved())}
    if(media){
      var listener=function(){if(root.getAttribute('data-theme-mode')==='system')apply('system')};
      if(media.addEventListener)media.addEventListener('change',listener);else if(media.addListener)media.addListener(listener);
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  }());

  function initCarousel(){
    var track=document.querySelector('.project-grid');
    if(!track)return;
    var cards=Array.prototype.slice.call(track.querySelectorAll('.project-card'));
    if(cards.length<2)return;

    var active=0,timer=null,resumeTimer=null,settleTimer=null,dragging=false,hovered=false,programmaticScroll=false;
    var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var version='1.5.8',AUTOPLAY_MS=1000;
    var nativeScrollTo=Element.prototype.scrollTo;

    track.scrollTo=function(){return undefined};
    track.scrollBy=function(){return undefined};

    var style=document.createElement('style');
    style.setAttribute('data-project-focus-carousel',version);
    style.textContent='\
.project-grid{position:relative;display:flex!important;gap:0!important;overflow-x:auto!important;overflow-y:hidden!important;scroll-snap-type:x mandatory!important;scroll-behavior:auto!important;scrollbar-width:none!important;align-items:stretch!important;padding-top:34px;padding-bottom:30px;isolation:isolate}\
.project-grid::-webkit-scrollbar{display:none}\
.project-grid:before{content:"";position:absolute;left:0;right:0;top:17px;height:1px;background:linear-gradient(90deg,transparent,var(--bim-border),transparent);pointer-events:none}\
.project-grid .project-card{position:relative;flex:0 0 var(--focus-card-width)!important;width:var(--focus-card-width)!important;scroll-snap-align:center!important;transition:transform .48s cubic-bezier(.22,.61,.36,1),opacity .48s ease,filter .48s ease,box-shadow .48s ease,border-color .48s ease!important;transform:scale(.72);transform-origin:center center;opacity:.48;filter:grayscale(.82) blur(.8px) brightness(.72);z-index:1}\
.project-grid .project-card:after{content:"";position:absolute;inset:10px;pointer-events:none;border:1px solid transparent;transition:border-color .4s ease,box-shadow .4s ease}\
.project-grid .project-card.carousel-focus-active{transform:scale(1.30);opacity:1;filter:none;z-index:5;box-shadow:0 24px 65px rgba(0,0,0,.48)!important;border-color:var(--bim-accent)!important}\
.project-grid .project-card.carousel-focus-active:after{border-color:rgba(143,182,212,.34);box-shadow:inset 0 0 0 1px rgba(79,134,181,.14)}\
.project-grid .project-card.carousel-focus-side{transform:scale(.72);opacity:.55;filter:grayscale(.68) blur(.55px) brightness(.76);z-index:2}\
.project-grid .project-card:hover{transform:scale(.74)!important;filter:grayscale(.45) blur(.35px) brightness(.84)}\
.project-grid .project-card.carousel-focus-active:hover{transform:scale(1.30)!important;filter:none}\
.project-grid .project-card .project-body{position:relative}\
.project-grid .project-card .project-body:before{content:"BIM / PROJECT";display:block;margin-bottom:8px;font:600 10px/1.2 "JetBrains Mono",monospace;letter-spacing:.16em;color:var(--bim-accent-light);opacity:.72}\
.project-grid .project-card.carousel-focus-active .project-body:before{content:"SELECTED / PROJECT";opacity:1}\
.project-carousel-label{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;margin:2px auto 0;min-height:28px;font-family:"JetBrains Mono",monospace;letter-spacing:.12em;color:var(--bim-muted)}\
.project-carousel-label b{font-weight:700;color:var(--bim-text);font-size:13px}\
.project-carousel-label .carousel-total{font-size:11px;opacity:.6}\
.project-carousel-label .carousel-dash{opacity:.35}\
.project-carousel-progress{width:min(280px,48vw);height:2px;margin:5px auto 0;background:var(--bim-border);overflow:hidden}\
.project-carousel-progress span{display:block;height:100%;width:0;background:var(--bim-accent);transition:width .45s ease}\
.project-carousel-meta{display:flex;justify-content:space-between;align-items:center;width:min(470px,72vw);margin:7px auto 0;font:500 9px/1 "JetBrains Mono",monospace;letter-spacing:.14em;color:var(--bim-muted);opacity:.65;text-transform:uppercase}\
@media(max-width:1050px){.project-grid .project-card{transform:scale(.78)}.project-grid .project-card.carousel-focus-active{transform:scale(1.16)}.project-grid .project-card.carousel-focus-side{transform:scale(.78)}.project-grid .project-card:hover{transform:scale(.80)!important}.project-grid .project-card.carousel-focus-active:hover{transform:scale(1.16)!important}}\
@media(max-width:700px){.project-grid{padding-top:26px;padding-bottom:18px}.project-grid:before{top:12px}.project-grid .project-card{transform:scale(.84);filter:grayscale(.3) blur(.25px) brightness(.82)}.project-grid .project-card.carousel-focus-active{transform:scale(1.07);filter:none}.project-grid .project-card.carousel-focus-side{transform:scale(.84);filter:grayscale(.25) blur(.2px) brightness(.82)}.project-grid .project-card:hover{transform:scale(.86)!important}.project-grid .project-card.carousel-focus-active:hover{transform:scale(1.07)!important}.project-carousel-progress{width:min(220px,58vw)}.project-carousel-meta{width:min(360px,82vw)}}\
@media(prefers-reduced-motion:reduce){.project-grid .project-card,.project-carousel-progress span{transition:none!important}}';
    document.head.appendChild(style);

    function ensureHud(){
      var label=document.querySelector('.project-carousel-label');
      if(!label){label=document.createElement('div');label.className='project-carousel-label';track.parentNode.insertBefore(label,track.nextSibling)}
      label.innerHTML='<b>01</b><span class="carousel-dash">/</span><span class="carousel-total">'+String(cards.length).padStart(2,'0')+'</span>';
      var progress=document.querySelector('.project-carousel-progress');
      if(!progress){progress=document.createElement('div');progress.className='project-carousel-progress';progress.innerHTML='<span></span>';label.parentNode.insertBefore(progress,label.nextSibling)}
      var meta=document.querySelector('.project-carousel-meta');
      if(!meta){meta=document.createElement('div');meta.className='project-carousel-meta';meta.innerHTML='<span>SELECTED WORK</span><span>AUTOPLAY 01S</span>';progress.parentNode.insertBefore(meta,progress.nextSibling)}
    }
    function layout(){
      var width=track.clientWidth,viewport=window.innerWidth,gap=viewport<=700?16:(viewport<=1050?24:32),cardWidth;
      if(viewport<=700)cardWidth=Math.max(250,width-44);
      else if(viewport<=1050)cardWidth=Math.max(330,(width-gap)/2);
      else cardWidth=Math.max(360,Math.min(470,(width-gap*2)/3));
      track.style.setProperty('--focus-card-width',cardWidth+'px');
      var gutter=Math.max(0,(width-cardWidth)/2);
      track.style.paddingLeft=gutter+'px';track.style.paddingRight=gutter+'px';track.style.columnGap=gap+'px';
    }
    function updateHud(){
      var label=document.querySelector('.project-carousel-label');
      if(label){var current=label.querySelector('b');if(current)current.textContent=String(active+1).padStart(2,'0')}
      var progress=document.querySelector('.project-carousel-progress span');
      if(progress)progress.style.width=((active+1)/cards.length*100)+'%';
    }
    function applyState(index){
      active=(index+cards.length)%cards.length;
      cards.forEach(function(card,i){card.classList.remove('carousel-focus-active','carousel-focus-side');if(i===active)card.classList.add('carousel-focus-active');else if(i===active-1||i===active+1)card.classList.add('carousel-focus-side')});
      updateHud();
    }
    function targetFor(index){
      layout();
      var card=cards[index],max=Math.max(0,track.scrollWidth-track.clientWidth);
      return Math.max(0,Math.min(card.offsetLeft-(track.clientWidth-card.offsetWidth)/2,max));
    }
    function center(index,smooth){
      programmaticScroll=true;
      nativeScrollTo.call(track,{left:targetFor(index),behavior:(!reduced&&smooth)?'smooth':'auto'});
      window.setTimeout(function(){programmaticScroll=false},smooth?650:50);
    }
    function nearest(){
      var centerX=track.scrollLeft+track.clientWidth/2,best=0,distance=Infinity;
      cards.forEach(function(card,index){var d=Math.abs(card.offsetLeft+card.offsetWidth/2-centerX);if(d<distance){distance=d;best=index}});
      return best;
    }
    function stop(){if(timer){clearTimeout(timer);timer=null}}
    function schedule(){
      stop();
      if(document.hidden||dragging||hovered)return;
      timer=setTimeout(function(){
        timer=null;
        if(document.hidden||dragging||hovered)return schedule();
        var next=(active+1)%cards.length;
        applyState(next);center(next,true);schedule();
      },AUTOPLAY_MS);
    }
    function pause(ms){
      stop();
      if(resumeTimer)clearTimeout(resumeTimer);
      if(ms!==Infinity)resumeTimer=setTimeout(schedule,ms||1400);
    }
    function settle(){
      if(settleTimer)clearTimeout(settleTimer);
      settleTimer=setTimeout(function(){if(dragging)return;var index=nearest();applyState(index);center(index,true);pause(1300)},130);
    }

    ensureHud();
    track.addEventListener('mouseenter',function(){hovered=true;pause(Infinity)});
    track.addEventListener('mouseleave',function(){hovered=false;if(!dragging)schedule()});
    track.addEventListener('pointerdown',function(){dragging=true;pause(Infinity)});
    track.addEventListener('pointerup',function(){dragging=false;settle()});
    track.addEventListener('pointercancel',function(){dragging=false;settle()});
    track.addEventListener('touchstart',function(){dragging=true;pause(Infinity)},{passive:true});
    track.addEventListener('touchend',function(){dragging=false;settle()},{passive:true});
    track.addEventListener('touchcancel',function(){dragging=false;settle()},{passive:true});
    track.addEventListener('wheel',function(){pause(1700);settle()},{passive:true});
    track.addEventListener('scroll',function(){if(!dragging&&!programmaticScroll)settle()},{passive:true});

    var prev=document.querySelector('.project-carousel-prev'),next=document.querySelector('.project-carousel-next');
    if(prev)prev.addEventListener('click',function(){pause(1400);var i=(active-1+cards.length)%cards.length;applyState(i);center(i,true);schedule()});
    if(next)next.addEventListener('click',function(){pause(1400);var i=(active+1)%cards.length;applyState(i);center(i,true);schedule()});

    document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else{layout();center(active,false);schedule()}});
    window.addEventListener('resize',function(){stop();layout();center(active,false);schedule()},{passive:true});

    applyState(0);layout();center(0,false);
    setTimeout(function(){layout();center(active,false);schedule()},350);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initCarousel,{once:true});else initCarousel();
}());

/* BIM Portfolio — Project Focus Carousel v1.3.3 */
(function () {
  'use strict';

  (function loadProfessionalBIMTheme(){
    if(document.querySelector('link[data-professional-bim-theme]')) return;
    var link=document.createElement('link');
    link.rel='stylesheet';
    link.href='professional-bim.css?v=1.3.3';
    link.setAttribute('data-professional-bim-theme','1.3.3');
    document.head.appendChild(link);
  }());

  /* Reliable Light / Dark / System theme controller. */
  (function themeController(){
    var KEY='bim-portfolio-theme';
    var modes=['system','light','dark'];
    var media=window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    var root=document.documentElement;
    function saved(){var value;try{value=localStorage.getItem(KEY)}catch(e){}return modes.indexOf(value)>=0?value:'system'}
    function effective(mode){return mode==='system'?(media&&media.matches?'dark':'light'):mode}
    function setMeta(theme){var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',theme==='dark'?'#100b1c':'#f7f5fa')}
    function apply(mode){var effectiveTheme=effective(mode);root.setAttribute('data-theme',effectiveTheme);root.setAttribute('data-theme-mode',mode);root.style.colorScheme=effectiveTheme;setMeta(effectiveTheme);document.querySelectorAll('.theme-control button').forEach(function(btn){btn.setAttribute('aria-pressed',btn.dataset.themeMode===mode?'true':'false')})}
    function save(mode){try{localStorage.setItem(KEY,mode)}catch(e){}apply(mode)}
    function build(){if(document.querySelector('.theme-control'))return;var header=document.querySelector('.site-header');if(!header)return;var box=document.createElement('div');box.className='theme-control';box.setAttribute('role','group');box.setAttribute('aria-label','Color theme');box.innerHTML='<button type="button" data-theme-mode="system" aria-label="Use system theme">System</button><button type="button" data-theme-mode="light" aria-label="Use light theme">Light</button><button type="button" data-theme-mode="dark" aria-label="Use dark theme">Dark</button>';box.querySelectorAll('button').forEach(function(btn){btn.addEventListener('click',function(){save(btn.dataset.themeMode)})});var cta=header.querySelector('.nav-cta');if(cta)cta.parentNode.insertBefore(box,cta);else header.appendChild(box);apply(saved())}
    function init(){build();apply(saved())}
    if(media){var listener=function(){if(root.getAttribute('data-theme-mode')==='system')apply('system')};if(media.addEventListener)media.addEventListener('change',listener);else if(media.addListener)media.addListener(listener)}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  }());

  var VERSION='1.3.3';
  var AUTOPLAY_MS=2000;
  function init(){
    var track=document.querySelector('.project-grid');if(!track)return;var cards=Array.prototype.slice.call(track.querySelectorAll('.project-card'));if(cards.length<2)return;
    var active=0,timer=null,resumeTimer=null,settleTimer=null,dragging=false,hovered=false,reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var style=document.createElement('style');style.setAttribute('data-project-focus-carousel',VERSION);style.textContent='';document.head.appendChild(style);
    function nativeScrollTo(left,behavior){Element.prototype.scrollTo.call(track,{left:left,behavior:behavior||'auto'})}
    function layout(){var width=track.clientWidth,gap=window.innerWidth<=700?16:(window.innerWidth<=1050?22:28),cardWidth;if(window.innerWidth<=700)cardWidth=Math.max(220,width-56);else if(window.innerWidth<=1050)cardWidth=Math.max(260,(width-gap)/2);else cardWidth=Math.max(280,(width-gap*2)/3);track.style.setProperty('--focus-card-width',cardWidth+'px');var gutter=Math.max(0,(width-cardWidth)/2);track.style.paddingLeft=gutter+'px';track.style.paddingRight=gutter+'px')}
    function applyState(index){active=(index+cards.length)%cards.length;cards.forEach(function(card,i){card.classList.remove('carousel-focus-active','carousel-focus-side');if(i===active)card.classList.add('carousel-focus-active');else if(i===active-1||i===active+1)card.classList.add('carousel-focus-side')});var counter=document.querySelector('.project-carousel-label b');if(counter)counter.textContent=String(active+1).padStart(2,'0')}
    function targetFor(index){layout();var card=cards[index],max=Math.max(0,track.scrollWidth-track.clientWidth),target=card.offsetLeft-((track.clientWidth-card.offsetWidth)/2);return Math.max(0,Math.min(target,max))}
    function center(index,smooth){nativeScrollTo(targetFor(index),(!reduced&&smooth)?'smooth':'auto')}
    function nearest(){var centerX=track.scrollLeft+track.clientWidth/2,best=0,distance=Infinity;cards.forEach(function(card,index){var d=Math.abs(card.offsetLeft+card.offsetWidth/2-centerX);if(d<distance){distance=d;best=index}});return best}
    function stop(){if(timer){clearInterval(timer);timer=null}}
    function start(){stop();if(reduced||document.hidden||dragging||hovered)return;timer=setInterval(function(){if(dragging||hovered||document.hidden)return;var next=(active+1)%cards.length;applyState(next);center(next,true)},AUTOPLAY_MS)}
    function pause(ms){stop();if(resumeTimer)clearTimeout(resumeTimer);if(ms!==Infinity)resumeTimer=setTimeout(start,ms||1400)}
    function settle(){if(settleTimer)clearTimeout(settleTimer);settleTimer=setTimeout(function(){if(dragging)return;var index=nearest();applyState(index);center(index,true);pause(1300)},120)}
    track.addEventListener('mouseenter',function(){hovered=true;pause(Infinity)});track.addEventListener('mouseleave',function(){hovered=false;if(!dragging)start()});track.addEventListener('pointerdown',function(){dragging=true;pause(Infinity)});track.addEventListener('pointerup',function(){dragging=false;settle()});track.addEventListener('pointercancel',function(){dragging=false;settle()});track.addEventListener('touchstart',function(){dragging=true;pause(Infinity)},{passive:true});track.addEventListener('touchend',function(){dragging=false;settle()},{passive:true});track.addEventListener('touchcancel',function(){dragging=false;settle()},{passive:true});track.addEventListener('wheel',function(){pause(1700);settle()},{passive:true});track.addEventListener('scroll',function(){if(!dragging)settle()},{passive:true});
    var prev=document.querySelector('.project-carousel-prev'),next=document.querySelector('.project-carousel-next');if(prev)prev.addEventListener('click',function(){pause(1400);var i=(active-1+cards.length)%cards.length;applyState(i);center(i,true)});if(next)next.addEventListener('click',function(){pause(1400);var i=(active+1)%cards.length;applyState(i);center(i,true)});
    document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else{layout();center(active,false);start()}});window.addEventListener('resize',function(){stop();layout();center(active,false);start()},{passive:true});applyState(0);layout();center(0,false);setTimeout(function(){layout();center(active,false);start()},250)
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
}());

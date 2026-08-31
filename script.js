const modal=document.getElementById('projectModal');
const title=document.getElementById('modalTitle');
const gallery=document.getElementById('modalGallery');
document.querySelectorAll('.view-project').forEach(btn=>{
  btn.addEventListener('click',()=>{
    title.textContent=btn.dataset.title;
    const imgs=JSON.parse(btn.dataset.images);
    gallery.innerHTML=imgs.map(x=>`<img src="assets/${x}" alt="${btn.dataset.title} project image" loading="lazy">`).join('');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  });
});
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';}
document.querySelector('.modal-close').addEventListener('click',closeModal);
document.querySelector('.modal-backdrop').addEventListener('click',closeModal);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')});},{threshold:.08});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

(function(){
  var root=document.querySelector('.bbs-slideshow'); if(!root)return;
  var track=root.querySelector('.bbs-slides'); if(!track)return;
  var slides=track.children,n=slides.length; if(n<2)return;
  var cur=root.querySelector('.bbs-current'),total=root.querySelector('.bbs-total'),prev=root.querySelector('.bbs-prev'),next=root.querySelector('.bbs-next'),i=0;
  if(total)total.textContent=n;
  function go(idx){i=(idx+n)%n;track.style.transform='translateX('+(-i*100)+'%)';if(cur)cur.textContent=i+1;}
  if(prev)prev.addEventListener('click',function(){go(i-1)});if(next)next.addEventListener('click',function(){go(i+1)});
  var playing=true,timer=null;function play(){if(playing)timer=setInterval(function(){go(i+1)},4500)}function stop(){if(timer)clearInterval(timer)}play();root.addEventListener('mouseenter',stop);root.addEventListener('mouseleave',play);
  var io=new IntersectionObserver(function(ents){ents.forEach(function(e){if(e.isIntersecting){playing=true;stop();play()}else{playing=false;stop()}})},{threshold:.2});io.observe(root);
})();

(function(){
  var el=document.getElementById('goatcounter-counter');if(!el)return;var tries=0;
  function counterUrl(){var s=document.querySelector('script[data-goatcounter]');if(!s||!s.dataset.goatcounter)return null;var base=s.dataset.goatcounter.replace(/\/count\/?$/,'');return base+'/counter/TOTAL.json?no_branding=1';}
  function render(){if(!window.goatcounter){if(tries<40){tries++;setTimeout(render,250);return}el.textContent='\u2014';return}var url=counterUrl();if(!url){el.textContent='\u2014';return}fetch(url).then(function(res){if(!res.ok)throw new Error('HTTP '+res.status);return res.json()}).then(function(data){el.textContent=data&&typeof data.count==='string'?data.count:'\u2014'}).catch(function(){el.textContent='\u2014'})}render();
})();

/* RESPONSIVE PROJECT CARD CAROUSEL */
(function(){
  var grid=document.querySelector('.project-grid');if(!grid)return;
  var cards=grid.querySelectorAll('.project-card');if(cards.length<2)return;
  var section=grid.closest('#projects')||grid.parentElement;section.classList.add('project-carousel-section');grid.classList.add('project-carousel');
  var controls=document.createElement('div');controls.className='project-carousel-controls';
  controls.innerHTML='<button type="button" class="project-carousel-btn project-carousel-prev" aria-label="Previous projects">←</button><span class="project-carousel-label">PROJECTS <b>01</b> / '+String(cards.length).padStart(2,'0')+'</span><button type="button" class="project-carousel-btn project-carousel-next" aria-label="Next projects">→</button>';
  grid.parentNode.insertBefore(controls,grid);
  var prev=controls.querySelector('.project-carousel-prev'),next=controls.querySelector('.project-carousel-next'),current=controls.querySelector('.project-carousel-label b');
  var style=document.createElement('style');style.textContent=`
    #projects.project-carousel-section{position:relative}
    #projects .project-carousel-controls{display:flex;align-items:center;justify-content:flex-end;gap:12px;margin:-28px 0 28px}
    #projects .project-carousel-label{font:700 10px/1 "Space Grotesk",sans-serif;letter-spacing:.14em;color:#777;margin-right:4px}
    #projects .project-carousel-label b{color:#111}
    #projects .project-carousel{display:flex!important;grid-template-columns:none!important;gap:22px!important;overflow-x:auto;overflow-y:visible;scroll-snap-type:x mandatory;scroll-behavior:smooth;padding:4px 4px 24px;margin:0 -4px;-ms-overflow-style:none;scrollbar-width:none;cursor:grab}
    #projects .project-carousel::-webkit-scrollbar{display:none}
    #projects .project-carousel:active{cursor:grabbing}
    #projects .project-carousel .project-card{flex:0 0 calc((100% - 44px)/3);min-width:0;scroll-snap-align:start}
    #projects .project-carousel-btn{width:42px;height:42px;border:1px solid #c8c5bc;border-radius:50%;background:#ebe9e2;color:#111;font:700 20px/1 "Space Grotesk",sans-serif;cursor:pointer;display:grid;place-items:center;transition:transform .2s ease,background .2s ease,border-color .2s ease}
    #projects .project-carousel-btn:hover{transform:translateY(-2px);background:#c9ff38;border-color:#111}
    @media(max-width:1050px){#projects .project-carousel .project-card{flex-basis:calc((100% - 22px)/2)}}
    @media(max-width:700px){#projects .project-carousel-controls{justify-content:space-between;margin:-12px 0 20px}#projects .project-carousel .project-card{flex-basis:88%}#projects .project-carousel{gap:14px;padding-bottom:18px}#projects .project-carousel-btn{width:38px;height:38px;font-size:18px}#projects .project-carousel-label{margin:0 auto}}
  `;document.head.appendChild(style);
  function cardStep(){var first=cards[0];if(!first)return grid.clientWidth;var gap=parseFloat(getComputedStyle(grid).gap)||22;return first.getBoundingClientRect().width+gap}
  function go(direction){grid.scrollBy({left:direction*cardStep(),behavior:'smooth'})}
  prev.addEventListener('click',function(){go(-1)});next.addEventListener('click',function(){go(1)});
  grid.addEventListener('scroll',function(){var index=Math.round(grid.scrollLeft/cardStep());index=Math.max(0,Math.min(cards.length-1,index));current.textContent=String(index+1).padStart(2,'0')},{passive:true});
  grid.addEventListener('wheel',function(e){if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.preventDefault();grid.scrollLeft+=e.deltaY}},{passive:false});
})();

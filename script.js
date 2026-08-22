
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
function closeModal(){
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
document.querySelector('.modal-close').addEventListener('click',closeModal);
document.querySelector('.modal-backdrop').addEventListener('click',closeModal);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
const obs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')});
},{threshold:.08});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

/* REINFORCEMENT DOCUMENTATION SLIDESHOW */
(function(){
  var root=document.querySelector('.bbs-slideshow');
  if(!root)return;
  var track=root.querySelector('.bbs-slides');
  if(!track)return;
  var slides=track.children;
  var n=slides.length;
  if(n<2)return;
  var cur=root.querySelector('.bbs-current');
  var total=root.querySelector('.bbs-total');
  var prev=root.querySelector('.bbs-prev');
  var next=root.querySelector('.bbs-next');
  var i=0;
  if(total)total.textContent=n;
  function go(idx){
    i=(idx+n)%n;
    track.style.transform='translateX('+(-i*100)+'%)';
    if(cur)cur.textContent=i+1;
  }
  if(prev)prev.addEventListener('click',function(){go(i-1)});
  if(next)next.addEventListener('click',function(){go(i+1)});
  var playing=true, timer=null;
  function play(){ if(playing) timer=setInterval(function(){go(i+1)},4500); }
  function stop(){ if(timer) clearInterval(timer); }
  play();
  root.addEventListener('mouseenter',stop);
  root.addEventListener('mouseleave',play);
  var io=new IntersectionObserver(function(ents){
    ents.forEach(function(e){
      if(e.isIntersecting){ playing=true; stop(); play(); }
      else { playing=false; stop(); }
    });
  },{threshold:.2});
  io.observe(root);
})();


/* GOATCOUNTER TOTAL VISITOR COUNTER
   Fetches the site-wide total from GoatCounter's JSON endpoint and renders it
   as plain text into .visitor-number. (No iframe => stays inside the pill,
   no overflow, no branding, styled by the existing .visitor-number CSS.) */
(function(){
  var el = document.getElementById('goatcounter-counter');
  if (!el) return;
  var tries = 0;

  function counterUrl(){
    var s = document.querySelector('script[data-goatcounter]');
    if (!s || !s.dataset.goatcounter) return null;
    // data-goatcounter is e.g. https://<code>.goatcounter.com/count
    var base = s.dataset.goatcounter.replace(/\/count\/?$/, '');
    return base + '/counter/TOTAL.json?no_branding=1';
  }

  function render(){
    // Wait for count.js so we can reuse its configured endpoint.
    if (!window.goatcounter) {
      if (tries < 40) { tries++; setTimeout(render, 250); return; }
      el.textContent = '\u2014';
      return;
    }

    var url = counterUrl();
    if (!url) { el.textContent = '\u2014'; return; }

    fetch(url)
      .then(function(res){
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(data){
        // data.count is the formatted total, e.g. "1,234"
        el.textContent = (data && typeof data.count === 'string') ? data.count : '\u2014';
      })
      .catch(function(){ el.textContent = '\u2014'; });
  }

  render();
})();

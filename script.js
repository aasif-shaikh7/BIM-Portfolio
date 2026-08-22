
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

/* GOATCOUNTER VISITOR COUNT */
(function(){
  function loadVisitorCount(){
    if (!window.goatcounter || !window.goatcounter.visit_count) {
      setTimeout(loadVisitorCount, 150);
      return;
    }
    var host = document.getElementById('siteVisitorCount');
    if (!host) return;

    var holder = document.createElement('span');
    holder.style.display = 'none';
    holder.id = 'goatcounter-total-source';
    document.body.appendChild(holder);

    window.goatcounter.visit_count({
      append: '#goatcounter-total-source',
      path: 'TOTAL',
      no_branding: true,
      style: 'div{display:inline!important;border:0!important;background:transparent!important;color:inherit!important;padding:0!important;margin:0!important;font:inherit!important} #gcvc-for{display:none!important} #gcvc-views{font:inherit!important;color:inherit!important}'
    });

    var tries = 0;
    var timer = setInterval(function(){
      tries++;
      var n = holder.querySelector('#gcvc-views');
      if (n && n.textContent.trim()) {
        host.textContent = n.textContent.trim();
        clearInterval(timer);
      }
      if (tries > 80) clearInterval(timer);
    }, 100);
  }
  loadVisitorCount();
})();
/* END GOATCOUNTER VISITOR COUNT */

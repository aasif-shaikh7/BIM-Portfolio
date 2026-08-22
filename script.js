
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



/* GOATCOUNTER TOTAL VISITOR COUNTER */
(function(){function init(){if(!window.goatcounter||typeof window.goatcounter.visit_count!=='function'){setTimeout(init,100);return;}window.goatcounter.visit_count({append:'#goatcounter-counter',path:'TOTAL',no_branding:true,style:`div{display:inline!important;border:0!important;padding:0!important;margin:0!important;background:transparent!important;color:inherit!important;font:inherit!important}#gcvc-for,#gcvc-by{display:none!important}#gcvc-views{display:inline!important;color:inherit!important;font:inherit!important}`});}init();})();

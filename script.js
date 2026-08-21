
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

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const grid = document.querySelector('#project-grid');
let activeTrigger;
function openDialog(dialog) { activeTrigger = document.activeElement; dialog.showModal(); document.body.style.overflow = 'hidden'; }
function installImageFallback(image) {
 image.addEventListener('error', () => {
  image.hidden = true; image.style.display = 'none';
  const fallback = image.parentElement.querySelector('.asset-fallback');
  if (fallback) fallback.hidden = false;
 }, { once: true });
}
window.portfolioProjects.forEach((project, index) => {
 const button = document.createElement('button'); button.className = 'project reveal';
 const frame = document.createElement('div'); frame.className = 'project-image';
 const image = document.createElement('img'); image.src = project.image; image.alt = project.title; image.loading = 'lazy';
 const fallback = document.createElement('div'); fallback.className = 'asset-fallback'; fallback.hidden = true;
 const label = document.createElement('span'); label.textContent = project.title;
 const notice = document.createElement('small'); notice.textContent = 'Reference image unavailable'; fallback.append(label, notice);
 frame.append(image, fallback);
 const meta = document.createElement('div'); meta.className = 'project-meta';
 const category = document.createElement('span'); category.textContent = project.category;
 const number = document.createElement('span'); number.textContent = '0' + (index + 1); meta.append(category, number);
 const title = document.createElement('h3'); title.textContent = project.title;
 const description = document.createElement('p'); description.textContent = project.description;
 button.append(frame, meta, title, description); button.setAttribute('aria-label', 'View ' + project.title);
 button.addEventListener('click', () => {
  const detail = document.querySelector('#project-detail');
  const heading = document.createElement('h2'); heading.textContent = project.title;
  const picture = document.createElement('img'); picture.src = project.image; picture.alt = project.title;
  const text = document.createElement('p'); text.textContent = project.description;
  const categoryLabel = document.createElement('div'); categoryLabel.className = 'section-label'; categoryLabel.textContent = project.category;
  detail.replaceChildren(categoryLabel, heading, picture, text);
  openDialog(document.querySelector('#project-dialog'));
 }); grid.append(button);
});
document.querySelectorAll('img').forEach(installImageFallback);
document.querySelectorAll('[data-about]').forEach(button => button.addEventListener('click', () => openDialog(document.querySelector('#about'))));
document.querySelectorAll('dialog').forEach(dialog => {
 dialog.querySelector('.close').addEventListener('click', () => dialog.close());
 dialog.addEventListener('click', event => { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); });
 dialog.addEventListener('close', () => { document.body.style.overflow = ''; activeTrigger?.focus(); });
});
if ('IntersectionObserver' in window) {
 document.documentElement.classList.add('js');
 const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: .08 });
 document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}
const hero = document.querySelector('.hero');
hero.addEventListener('pointermove', event => {
 if (reduceMotion.matches || event.pointerType === 'touch') return;
 const bounds = hero.getBoundingClientRect();
 const x = (event.clientX - bounds.left) / bounds.width - .5;
 const y = (event.clientY - bounds.top) / bounds.height - .5;
 hero.style.setProperty('--hero-rx', -y * 4 + 'deg'); hero.style.setProperty('--hero-ry', -3 + x * 8 + 'deg'); hero.style.setProperty('--type-x', x * 22 + 'px');
});
hero.addEventListener('pointerleave', () => { hero.style.setProperty('--hero-rx', '0deg'); hero.style.setProperty('--hero-ry', '-3deg'); hero.style.setProperty('--type-x', '0px'); });
const stage = document.querySelector('.cube-stage'); const cube = stage.querySelector('.cube'); let cubeX = -15; let cubeY = -35;
function rotateCube(x, y) { cube.classList.add('interacting'); cube.style.setProperty('--cube-x', x + 'deg'); cube.style.setProperty('--cube-y', y + 'deg'); }
stage.addEventListener('pointermove', event => { if (reduceMotion.matches || event.pointerType === 'touch') return; const bounds = stage.getBoundingClientRect(); rotateCube(-15 - ((event.clientY - bounds.top) / bounds.height - .5) * 70, -35 + ((event.clientX - bounds.left) / bounds.width - .5) * 110); });
stage.addEventListener('pointerleave', () => cube.classList.remove('interacting'));
stage.addEventListener('keydown', event => { if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return; event.preventDefault(); cubeY += event.key === 'ArrowLeft' ? -15 : event.key === 'ArrowRight' ? 15 : 0; cubeX += event.key === 'ArrowUp' ? 15 : event.key === 'ArrowDown' ? -15 : 0; rotateCube(cubeX, cubeY); });
document.querySelector('#party').addEventListener('click', () => { if (reduceMotion.matches) return; for (let index = 0; index < 65; index++) { const confetti = document.createElement('span'); confetti.className = 'confetti'; confetti.style.left = Math.random() * 100 + 'vw'; confetti.style.background = ['#b7c1f0', '#ed633f', '#c1ca98', '#f8db77'][index % 4]; confetti.style.setProperty('--drift', (Math.random() - .5) * 350 + 'px'); confetti.style.animationDelay = Math.random() * .5 + 's'; document.body.append(confetti); confetti.addEventListener('animationend', () => confetti.remove()); } });

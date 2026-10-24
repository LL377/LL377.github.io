"""Adapt the existing reference carousel to a mixed-aspect photo journal."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
f=root/'assets/ning-h.com/wp-content/themes/ning25/js/utility.js';s=f.read_text()
anchor=s.index('function updateProjectModalBody')
start=s.index("            modal.dataset.presentation" if "            modal.dataset.presentation" in s[anchor:] else "            let mediaHtml = '';",anchor)
end=s.index('            body.innerHTML = `\n            <div class="project-modal-media',start)
s=s[:start]+'''            modal.dataset.presentation = data.presentation || 'project';
            modal.querySelector('.modal-hint').textContent = data.presentation === 'case-study' ? '[ SCROLL TO READ ]' : '[ SCROLL/DRAG TO EXPLORE ]';
            if (data.presentation === 'case-study') {
                if (window.projectModalSwiper) { window.projectModalSwiper.destroy(true, true); window.projectModalSwiper = null; }
                body.innerHTML = `<article class="case-reader" tabindex="0" aria-label="${data.title}完整作品集" data-lenis-prevent>
                    <header class="case-heading"><h2>${data.title}</h2><a href="${data.link}" target="_blank" rel="noopener noreferrer">${data.linkLabel}</a></header>
                    <div class="case-pages">${data.media.map((item,index)=>`<img src="${item.url}" srcset="${item.srcset || ''}" sizes="(max-width: 767px) 100vw, 1501px" width="${item.width}" height="${item.height}" alt="${item.alt}" loading="${index < 2 ? 'eager' : 'lazy'}" decoding="async">`).join('')}</div>
                    <p class="case-end">END / ${data.title}</p>
                </article>`;
                gsap.fromTo(body, { opacity: 0 }, { opacity: 1, duration: 0.3 });
                updateProjectModalArrows(projectKey);
                return;
            }
            const mediaItems = [data.cover, ...(data.media || [])].filter(Boolean);
            const mediaHtml = mediaItems.map((item, index) => {
                const ratio = Number(item.ratio) > 0 ? Number(item.ratio) : 4/3;
                const label = String(item.alt || '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
                const visual = item.type === 'video'
                    ? `<video src="${item.url}" autoplay loop muted playsinline class="project-modal-video"></video>`
                    : `<img src="${item.url}" srcset="${item.srcset || ''}" sizes="(max-width: 767px) 86vw, 900px" alt="${label}" class="project-modal-img" loading="${index < 2 ? 'eager' : 'lazy'}" decoding="async" data-swiper-parallax-x="10%">`;
                return `<div class="swiper-slide" style="--slide-ratio:${ratio}">${visual}${data.presentation === 'journal' ? `<p class="media-caption">${String(index+1).padStart(2,'0')} / ${label}</p>` : ''}</div>`;
            }).join('');
''' + s[end:]
s=s.replace('>Live site</a>', ">${data.linkLabel || 'Live site'}</a>")
s=s.replace('                            eggModalInstance.openModal(\n                                null,\n                                \'生活片段 · 素材待补充\'\n                            );',"                            showProjectModal('project3');")
f.write_text(s)

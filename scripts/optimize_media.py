"""Create responsive WebP display assets; retain full-resolution download links."""
from pathlib import Path
import json
from PIL import Image, ImageOps
from lxml import html

root = Path(__file__).resolve().parents[1]
profile_file = root / 'content/profile.json'
profile = json.loads(profile_file.read_text())
page = html.fromstring((root / 'index.html').read_text())
cache = {}
before = after = 0

def optimize(url):
    global before, after
    if not url.startswith('/assets/profile/') or Path(url).suffix not in {'.jpg', '.png', '.webp'}:
        return None
    if url in cache:
        return cache[url]
    path = root / url.lstrip('/')
    # Reuse the original when rerunning this preparation step.
    if path.suffix == '.webp':
        for ext in ['.jpg', '.png']:
            if path.with_suffix(ext).exists():
                path = path.with_suffix(ext)
                break
    image = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    large = image.copy()
    large.thumbnail((1501, 4000), Image.Resampling.LANCZOS)
    dest = path.with_suffix('.webp')
    large.save(dest, quality=86, method=6)
    small = image.copy()
    small.thumbnail((800, 2400), Image.Resampling.LANCZOS)
    small_dest = path.with_name(path.stem + '-800.webp')
    small.save(small_dest, quality=84, method=6)
    large_url = '/' + str(dest.relative_to(root))
    small_url = '/' + str(small_dest.relative_to(root))
    result = dict(url=large_url, srcset=f'{small_url} {small.width}w, {large_url} {large.width}w', width=image.width, height=image.height)
    before += path.stat().st_size
    after += dest.stat().st_size
    cache[url] = result
    return result

for project in profile['projects']:
    for item in [project.get('cover', {}), *project.get('media', [])]:
        result = optimize(item.get('url', ''))
        if result:
            item.update(result)
for image in page.xpath('//img[@src]'):
    result = optimize(image.get('src'))
    if result:
        image.set('src', result['url'])
        image.set('srcset', result['srcset'])
        image.set('sizes', '(max-width: 767px) 100vw, 700px')
        image.set('width', str(result['width']))
        image.set('height', str(result['height']))
        image.set('loading', 'lazy')
        image.set('decoding', 'async')
        image.attrib.pop('fetchpriority', None)
head = page.find('head')
if not page.xpath('//script[@id="responsive-mode"]'):
    mode = html.Element('script', id='responsive-mode')
    mode.text = "if(matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('simple-layout');"
    head.insert(1, mode)
profile_file.write_text(json.dumps(profile, ensure_ascii=False, indent=2) + '\n')
data = {p['id']: {key: p[key] for key in ['title', 'description', 'cover', 'media', 'link', 'linkLabel', 'presentation'] if key in p} for p in profile['projects']}
(root / 'assets/profile/projects.js').write_text('window.projectsData = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n')
(root / 'index.html').write_text(html.tostring(page, encoding='unicode', doctype='<!DOCTYPE html>'))
print(f'{len(cache)} display assets: {before/1e6:.2f} MB -> {after/1e6:.2f} MB (full-size WebP); 800px alternatives also generated.')

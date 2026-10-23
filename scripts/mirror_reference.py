"""Download the public reference page dependencies for local reconstruction."""
import concurrent.futures, html, json, pathlib, re, urllib.parse, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE=ROOT/'reference/original/page.html'
BASE='https://ning-h.com/'
OPENER=urllib.request.build_opener(urllib.request.ProxyHandler({'http':'http://127.0.0.1:7890','https':'http://127.0.0.1:7890'}))
EXTENSIONS={'.css','.js','.woff','.woff2','.ttf','.otf','.webp','.png','.jpg','.jpeg','.svg','.gif','.mp4','.webm','.glb','.gltf','.pdf','.ico'}
ALLOWED={'ning-h.com','cdnjs.cloudflare.com','cdn.jsdelivr.net','unpkg.com','fonts.googleapis.com','fonts.gstatic.com'}
manifest={}
failures={}
def resolve(value, base):
    value=html.unescape(value).replace('\\/','/').strip()
    if value.startswith(('data:','#','mailto:','javascript:')): return None
    url=urllib.parse.urljoin(base,value)
    parts=urllib.parse.urlsplit(url)
    if parts.hostname not in ALLOWED: return None
    if pathlib.PurePosixPath(parts.path).suffix.lower() not in EXTENSIONS: return None
    return urllib.parse.urlunsplit((parts.scheme,parts.netloc,parts.path,parts.query,''))
def discover(text,base):
    values=re.findall(r'''https?://[^\s"'<>`\\)]+''',text)
    values+=re.findall(r'''(?:src|href|poster|data-src)\s*=\s*["']([^"']+)["']''',text)
    values+=re.findall(r'''url\(\s*["']?([^"')\s]+)''',text)
    values+=re.findall(r'''(?:from|import)\s*["']([^"']+)["']''',text)
    values+=re.findall(r'''["'](\.{0,2}/[^"']+\.(?:js|webp|png|jpg|mp4|woff2?))["']''',text)
    return {u for v in values if (u:=resolve(v,base))}
def local_path(url):
    p=urllib.parse.urlsplit(url)
    return pathlib.PurePosixPath('assets')/p.netloc/urllib.parse.unquote(p.path).lstrip('/')
def download(url):
    dest=ROOT/local_path(url)
    if dest.exists() and dest.stat().st_size>0:
        return url,dest.read_bytes(),None
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Referer':BASE})
        with OPENER.open(req,timeout=60) as res: data=res.read()
        if data[:200].lower().find(b'<!doctype html')>=0 and dest.suffix!='.html': raise ValueError('HTML returned instead of asset')
        dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
        return url,data,None
    except Exception as e: return url,None,str(e)
queue=discover(SOURCE.read_text(),BASE)
seen=set()
for round_no in range(6):
    batch=sorted(queue-seen)
    if not batch: break
    seen.update(batch);queue=set()
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for url,data,error in pool.map(download,batch):
            if error: failures[url]=error; print('FAILED',url,error,flush=True);continue
            path=local_path(url);manifest[url]='/'+str(path)
            print('OK',len(data),url,flush=True)
            if path.suffix in {'.css','.js'}: queue.update(discover(data.decode('utf-8',errors='replace'),url))
(ROOT/'reference/original/asset-manifest.json').write_text(json.dumps(manifest,indent=2))
(ROOT/'reference/original/download-failures.json').write_text(json.dumps(failures,indent=2))
print('TOTAL',len(manifest),'FAILED',len(failures),flush=True)

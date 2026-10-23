import json,pathlib,urllib.request,urllib.parse
root=pathlib.Path(__file__).resolve().parents[1]
opener=urllib.request.build_opener(urllib.request.ProxyHandler({'http':'http://127.0.0.1:7890','https':'http://127.0.0.1:7890'}))
manifest=json.loads((root/'reference/original/asset-manifest.json').read_text())
failures=json.loads((root/'reference/original/download-failures.json').read_text())
for url in list(failures):
 if '/sdk.js' in url or '/three/addons/' in url: del failures[url];continue
 for attempt in range(3):
  try:
   with opener.open(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=25) as response: data=response.read()
   p=urllib.parse.urlsplit(url); rel=pathlib.Path('assets')/p.netloc/p.path.lstrip('/')
   (root/rel).write_bytes(data);manifest[url]='/'+str(rel);del failures[url];print('OK',url,flush=True);break
  except Exception as error: print('retry',attempt,str(error),flush=True)
(root/'reference/original/asset-manifest.json').write_text(json.dumps(manifest,indent=2))
(root/'reference/original/download-failures.json').write_text(json.dumps(failures,indent=2))

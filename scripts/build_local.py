"""Build the local reference reproduction from retained source and local assets."""
import html,json,pathlib,re,shutil,urllib.parse
ROOT=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'reference/original/asset-manifest.json').read_text())
pairs=sorted(manifest.items(),key=lambda p:len(p[0]),reverse=True)
def rewrite(text):
 for url,path in pairs:
  text=text.replace(url,path).replace(html.escape(url,quote=True),path).replace(url.replace('/','\\/'),path)
 return text
for url,path in pairs:
 p=ROOT/path.lstrip('/')
 if p.suffix in {'.js','.css'}:
  raw=ROOT/'reference/original/assets'/p.relative_to(ROOT/'assets')
  if not raw.exists(): raw.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,raw)
  p.write_text(rewrite(raw.read_text()))
page=(ROOT/'reference/original/page.html').read_text()
# Remove WordPress prefetch and non-rendering discovery endpoints.
page=re.sub(r'<script\b[^>]*id=["\']breeze-prefetch[^>]*>.*?</script>','',page,flags=re.S)
page=re.sub(r'<script\b[^>]*type=["\']speculationrules["\'][^>]*>.*?</script>','',page,flags=re.S)
page=re.sub(r'<link\b[^>]*(?:api\.w\.org|wp-json|xmlrpc|rel=["\'](?:canonical|shortlink|dns-prefetch))[^^>]*>','',page)
page=re.sub(r'"(?:nonce|formNonce|wpRestNonce)":"[^"]*"',lambda m:m.group(0).split(':')[0]+':""',page)
page=page.replace('"ajaxUrl":"https://ning-h.com/wp-admin/admin-ajax.php"','"ajaxUrl":"/unavailable-wordpress-endpoint"')
page=page.replace('"restApiUrl":"https://ning-h.com/wp-json/bricks/v1/"','"restApiUrl":"/unavailable-wordpress-endpoint"')
page=page.replace('"baseUrl":"https://ning-h.com/"','"baseUrl":"/"')
page=rewrite(page)
page=page.replace('<head>','<head>\n<!-- Local reproduction of ning-h.com. Original design and code: Ning Huang. -->\n')
(ROOT/'index.html').write_text(page)
if (ROOT/'content/profile.json').exists():
 (ROOT/'reference/local-base.html').write_text(page)
 import subprocess,sys
 subprocess.run([sys.executable,str(ROOT/'scripts/personalize.py')],check=True)
dist=ROOT/'dist';dist.mkdir(exist_ok=True)
shutil.copy2(ROOT/'index.html',dist/'index.html')
shutil.copytree(ROOT/'assets',dist/'assets',dirs_exist_ok=True)
print('Built local page with',len(manifest),'local dependencies.')

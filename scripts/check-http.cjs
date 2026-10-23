const assert = require('node:assert/strict');
(async () => {
 const base='http://127.0.0.1:5173';
 const index=await fetch(base); assert.equal(index.status,200); assert.match(await index.text(),/class="cube cube-1"/);
 const checks=[['/assets/ning-h.com/wp-content/uploads/2025/06/FragmentMono-Regular.woff2','font/woff2'],['/assets/ning-h.com/wp-content/themes/ning25/js/script.js','text/javascript'],['/assets/ning-h.com/wp-content/themes/ning25/css/styles.css','text/css'],['/assets/ning-h.com/wp-content/uploads/2025/06/24_cover.webp','image/webp']];
 for(const [url,type] of checks){ const response=await fetch(base+url,{method:'HEAD'});assert.equal(response.status,200);assert.ok(response.headers.get('content-type').startsWith(type)); }
 const video='/assets/ning-h.com/wp-content/uploads/2025/06/showreel.mp4';
 const range=await fetch(base+video,{headers:{Range:'bytes=0-1023'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,1024);assert.match(range.headers.get('content-range'),/^bytes 0-1023\//);
 const invalid=await fetch(base+video,{headers:{Range:'bytes=999999999-'}});assert.equal(invalid.status,416);
 const empty=await fetch(base+'/assets/ning-h.com/wp-content/uploads/bricks/css/post-3589.min.css');assert.equal(empty.status,200);assert.equal(await empty.text(),'');
 console.log('PASS: page, fonts, CSS, JavaScript, images, video byte-range loading, invalid ranges, and empty reference stylesheet.');
})().catch(error=>{console.error(error);process.exitCode=1});

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.woff':'font/woff', '.ttf':'font/ttf', '.mp4':'video/mp4', '.webm':'video/webm', '.pdf':'application/pdf', '.ico':'image/x-icon' };
http.createServer((req,res) => {
 let name;
 try { name = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400); return res.end(); }
 const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
 if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
 fs.stat(file, (error, stat) => {
  if (error || !stat.isFile()) { res.writeHead(404); return res.end('Not found'); }
  const headers = { 'Content-Type':types[path.extname(file)] || 'application/octet-stream', 'Accept-Ranges':'bytes', 'Cache-Control':'no-cache' };
  let start = 0, end = stat.size - 1, status = 200;
  if (req.headers.range) {
   const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   if (!match || (!match[1] && !match[2])) { res.writeHead(416, { 'Content-Range':`bytes */${stat.size}` }); return res.end(); }
   if (match[1]) { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), end) : end; }
   else start = Math.max(0,stat.size - Number(match[2]));
   if (start > end || start >= stat.size || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) { res.writeHead(416, { 'Content-Range':`bytes */${stat.size}` }); return res.end(); }
   status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
  }
  headers['Content-Length'] = stat.size === 0 ? 0 : end-start+1;
  res.writeHead(status, headers);
  if (req.method === 'HEAD' || stat.size === 0) return res.end();
  const stream = fs.createReadStream(file, {start,end});
  stream.on('error', () => res.destroy());
  stream.pipe(res);
 });
}).listen(5173,'127.0.0.1',() => console.log('Local: http://127.0.0.1:5173'));

const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const localPaths = new Set(html.match(/\/assets\/[^\s"'<>),]+/g) || []);
const missing = [...localPaths].filter(p => !fs.existsSync(path.join(root,p)));
if (missing.length) throw new Error('Missing page assets: ' + missing.join(', '));
const assetManifest = JSON.parse(fs.readFileSync(path.join(root,'reference/original/asset-manifest.json')));
for (const p of Object.values(assetManifest)) if (!fs.existsSync(path.join(root,p))) throw new Error('Missing asset: '+p);
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g)].map(m => m[1]);
for (const script of scripts) {
 if (!script.startsWith('/assets/')) throw new Error('External script '+script);
 cp.execFileSync(process.execPath,['--check',path.join(root,script)],{stdio:'pipe'});
}
for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
 if (/\bsrc=/.test(m[1]) || /application\/|speculationrules/.test(m[1]) || !m[2].trim()) continue;
 cp.execFileSync(process.execPath,['--check'],{input:m[2],stdio:['pipe','pipe','pipe']});
}
cp.execFileSync(process.execPath,['--check',path.join(root,'server.cjs')]);
const customDir=path.join(root,'assets/ning-h.com/wp-content/themes/ning25');
for(const dir of ['css','js']) for(const name of fs.readdirSync(path.join(customDir,dir))) {
 const text=fs.readFileSync(path.join(customDir,dir,name),'utf8');
 for(const p of text.match(/\/assets\/[^\s"'<>),]+/g)||[]) if(!fs.existsSync(path.join(root,p))) throw new Error('Missing dynamic asset '+p);
}
console.log(`PASS: ${Object.keys(assetManifest).length} assets; ${scripts.length} scripts and inline scripts parse; dynamic project media resolves.`);

if (fs.existsSync(path.join(root,'content/profile.json'))) {
 const vm=require('node:vm'); const context={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'assets/profile/projects.js'),'utf8'),context);
 const projects=Object.values(context.window.projectsData);
 if(projects.length!==3 || !projects[0].title.startsWith('蘑菇租房')) throw new Error('Incorrect personal project order');
 const cardKeys=[...html.matchAll(/data-project="(project\d+)"/g)].map(m=>m[1]);
 if(cardKeys.join(',')!=='project1,project2,project3') throw new Error('Three animated cards must match their detail records');
 if(!html.includes('生活片段') || !html.includes('playlist')) throw new Error('Draggable life placeholder missing');
 for(const project of projects) if(!fs.existsSync(path.join(root,project.cover.url))) throw new Error('Missing personal cover');
 if(!html.includes('mailto:1537520542@qq.com') || !html.includes('aria-label="LAO LE 2026"')) throw new Error('Personal identity not applied');
 for(const old of ['h2009210@gmail.com','Generated Art Gallery','Veggie Taipei','Melbourne','instagram.com/ningh']) if(html.includes(old)) throw new Error('Reference identity remains: '+old);
 if(!fs.existsSync(path.join(root,'assets/profile/lao-le-resume.pdf'))) throw new Error('Resume not found');
 console.log('PASS: personal identity, Mogu-first project order, three card covers, email and resume.');
}

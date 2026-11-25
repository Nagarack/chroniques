'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const os=require('node:os');
const {createServer}=require('../server');const Q=require('../src/quick-help.js');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const all=['overview','character','combat','maps','inventory','session','grimoire','rules','chronicle','illustrations','campaign','settings','guide'];
test('Tutos express : toutes les rubriques joueur et MJ disposent de 3 gestes courts',()=>{
 for(const role of ['player','gm']){
  const pages=role==='gm'?[...all,'encounters','stories','today','comj']:all;
  for(const page of pages){const t=Q.tutorial(page,role);assert(t,role+': '+page);assert.equal(t.steps.length,3,page);assert.equal(t.role,role);for(const step of t.steps){assert(step.length>=18&&step.length<=185,role+' '+page+': '+step);assert(!/<[\w/]|\$\{|Math\.random|http:/.test(step),page);}}
  assert.deepEqual(new Set(Q.pages(role)),new Set(pages));
 }
});
test('Tutos express : droits des joueurs séparés des rubriques MJ et indications de dés physiques',()=>{
 assert.equal(Q.tutorial('stories','player'),null);
 assert.equal(Q.tutorial('encounters','player'),null);
 assert.match(Q.tutorial('campaign','gm').steps.join(' '),/co-MJ|propriétaire/);
 assert.match(Q.tutorial('combat','player').steps.join(' '),/dés/);
 assert.match(Q.tutorial('maps','gm').steps.join(' '),/fond|secrets|privés/);
 assert(!JSON.stringify(Q).includes('clé API'));
});
test('Tutos express : l’interface les présente sans envahir les écrans',()=>{
 const app=read('src/online-app.js'),css=read('src/styles.css'),index=read('index.html'),guide=read('GUIDE_UTILISATION.html');
 for(const token of ['quickHelpPage()', 'quickHelpAuth(mode)','<details class="quick-help"','Mode d’emploi','3 étapes · 30 s'])assert(app.includes(token),token);
 assert(index.includes('/src/quick-help.js'));
 assert(css.includes('.quick-help>summary')&&css.includes('.quick-help[open]'));
 assert(guide.includes('les tutoriels express'));
 assert(read('GUIDE_TESTEURS.md').includes('/tutos.html'));
 const staticPage=read('TUTOS_EXPRESS.html');assert(staticPage.includes('Je suis joueur')&&staticPage.includes('Je suis MJ ou co-MJ'));
 assert((staticPage.match(/<summary>/g)||[]).length===26);
});
test('Tutos express : routes HTTP, fichiers de cache PWA et aucun stockage de données privées',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-qh-'));
 const s=createServer({publicOrigin:null,dataFile:path.join(dir,'db.json'),setupKey:'quick-help-test'});
 await new Promise(ok=>s.server.listen(0,'127.0.0.1',ok));
 t.after(async()=>{await s.close();fs.rmSync(dir,{recursive:true,force:true});});
 const origin='http://127.0.0.1:'+s.server.address().port;
 for(const pathname of ['/src/quick-help.js','/tutos.html']){
  const response=await fetch(origin+pathname);assert.equal(response.status,200,pathname);assert.equal(response.headers.get('cache-control'),'no-store');assert((await response.text()).length>1000);
 }
 const sw=read('sw.js');assert(sw.includes("'/src/quick-help.js'"));assert.match(sw,/const CACHE='chroniques-public-v\d+/);
 assert(!sw.includes("'/api/state'"));assert(!sw.includes("'/tutos.html'"),'le cache hors ligne contient seulement le code, pas les données de campagne');
});
test('Migration de V3.7 vers la bêta tutoriels : refus d’écrasement et fins de ligne Windows',()=>{
 const bat=fs.readFileSync(path.join(root,'MIGRER_DONNEES.bat'));
 const text=bat.toString('utf8');
 for(const token of ['if exist "data\\chroniques-db.json"','copy /-Y','data\\media','remote-origin.txt'])assert(text.includes(token),token);
 assert(bat.includes(Buffer.from('\r\n')));
 assert(!/(^|[^\r])\n/.test(text));
});

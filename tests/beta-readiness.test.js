'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createServer}=require('../server');
const C=require('../src/combat-workspace.js');
const root=path.join(__dirname,'..');
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-v37-beta-'));
 const app=createServer({publicOrigin:null,dataFile:path.join(dir,'campaign-db.json'),setupKey:'test-key-v37'});
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const origin='http://127.0.0.1:'+app.server.address().port;
 async function req(url,body,cookie=''){
  const response=await fetch(origin+url,{method:body===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});
  const txt=await response.text();
  return {status:response.status,body:txt,headers:response.headers,data:(response.headers.get('content-type')||'').includes('json')?JSON.parse(txt):null,cookie:response.headers.get('set-cookie')?.split(';')[0]||''};
 }
 const owner=(await req('/api/setup',{setupKey:'test-key-v37',name:'MJ Beta',password:'test-password-BETA-2026'})).cookie;
 return {req,owner};
}
test('V3.7 : six modules isolés, ordre/visibilité validés et restauration sûre',()=>{
 assert.deepEqual(C.IDS,['turn','party','initiative','actions','creatures','journal']);
 const initial=C.blank();assert.equal(initial.panels.journal.visible,false);
 assert.equal(initial.panels.party.wide,true);
 const reordered=C.move(initial,'initiative','up');assert.notDeepEqual(reordered.order,initial.order);
 assert.equal(C.width(initial,'turn',true).panels.turn.wide,true);
 assert.equal(C.show(initial,'turn',false).panels.turn.visible,false);
 const hidden=C.IDS.reduce((v,id)=>C.show(v,id,false),initial);
 assert(C.IDS.some(id=>hidden.panels[id].visible),'impossible de masquer tous les panneaux');
 const corrupted=C.normalize({order:['secret','party','party','turn'],panels:{secret:{visible:true},turn:{visible:'yes'}}});
 assert(!corrupted.order.includes('secret'));assert.equal(corrupted.order.length,6);
 assert.equal(typeof corrupted.panels.turn.visible,'boolean');
});
test('V3.7 : préférences séparées par compte, campagne et mode',()=>{
 const a=C.key('Nora','camp-A','gm');
 assert.notEqual(a,C.key('Nora','camp-B','gm'));
 assert.notEqual(a,C.key('Lou','camp-A','gm'));
 assert.notEqual(a,C.key('Nora','camp-A','player'));
});
test('V3.7 : HTML intègre les scripts et le service worker n’inclut jamais les secrets',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const worker=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 const ui=fs.readFileSync(path.join(root,'src/online-app.js'),'utf8');
 for(const s of ['/src/combat-workspace.js','/src/workspace-layout.js','Chroniques'])assert(html.includes(s));
 for(const s of ["'/src/combat-workspace.js'","'/src/workspace-layout.js'",'chroniques-public-v'])assert(worker.includes(s));
 assert(!worker.includes("'/api/state'")&&!worker.includes("'/api/ai"));
 for(const s of ['function combatDesk(){',"if(actor!=='mj'||!CW)return ''",'data-fight-drag','data-fight-show','data-fight-hide','data-fight-step','data-fight-size','data-fight-reset','gmCombatView=\'desk\'','esc(x.msg)','data-mj-view="detail"'])assert(ui.includes(s),s);
 assert(!ui.includes('Math.random('));
});
test('V3.7 : les deux modules JS sont réellement servis par HTTP et le statut annonce la bonne version',async t=>{
 const f=await fixture(t);
 assert.equal((await f.req('/api/status')).data.version,require('../package.json').version);
 for(const url of ['/src/workspace-layout.js','/src/combat-workspace.js']){
  const r=await f.req(url);assert.equal(r.status,200,url);assert.match(r.headers.get('content-type'),/javascript/);assert(r.body.length>300,url);
 }
 const html=await f.req('/');assert.equal(html.status,200);assert(html.body.includes('combat-workspace.js'));
});
test('V3.7 : mode joueur d’un compte MJ retire les secrets et la capacité de modifier le combat',async t=>{
 const f=await fixture(t);
 const initial=await f.req('/api/state',undefined,f.owner);
 assert.equal(initial.data.viewer.role,'gm');
 const privateAction=await f.req('/api/action',{baseVersion:initial.data.version,kind:'gmNotes',value:'BETA_SECRET_ONLY'},f.owner);
 assert.equal(privateAction.status,200);
 assert.equal((await f.req('/api/view-mode',{mode:'player'},f.owner)).status,200);
 const player=await f.req('/api/state',undefined,f.owner);
 assert.equal(player.data.viewer.role,'player');assert.equal(player.data.state.gmNotes,undefined);
 assert(!player.body.includes('BETA_SECRET_ONLY'));
 assert.equal((await f.req('/api/action',{baseVersion:player.data.version,kind:'gmNotes',value:'NON'},f.owner)).status,403);
 assert.equal((await f.req('/api/management',undefined,f.owner)).status,403);
 assert.equal((await f.req('/api/view-mode',{mode:'gm'},f.owner)).status,200);
 assert.equal((await f.req('/api/state',undefined,f.owner)).data.state.gmNotes,'BETA_SECRET_ONLY');
});
test('V3.7 : changement de campagne isole les secrets et rejette les écritures d’onglets anciens',async t=>{
 const f=await fixture(t);
 const first=(await f.req('/api/campaigns',undefined,f.owner)).data.activeId;
 const secondCreate=await f.req('/api/campaigns/create',{title:'Campagne Beta B'},f.owner);
 assert.equal(secondCreate.status,200);
 const second=(await f.req('/api/campaigns',undefined,f.owner)).data.activeId;
 assert.notEqual(second,first);
 const current=(await f.req('/api/state',undefined,f.owner)).data;
 assert.equal((await f.req('/api/action',{baseVersion:current.version,kind:'gmNotes',value:'SECRET_BETA_B'},f.owner)).status,200);
 assert.equal((await f.req('/api/action',{campaignId:first,baseVersion:current.version,kind:'gmNotes',value:'ANCIEN_ONGLET'},f.owner)).status,409);
 assert.equal((await f.req('/api/campaigns/select',{campaignId:first},f.owner)).status,200);
 assert(!(await f.req('/api/state',undefined,f.owner)).body.includes('SECRET_BETA_B'));
 assert.equal((await f.req('/api/campaigns/select',{campaignId:second},f.owner)).status,200);
 assert((await f.req('/api/state',undefined,f.owner)).body.includes('SECRET_BETA_B'));
});
test('V3.7 : migration Windows CRLF, garde-fou anti-écrasement et PWA publique',()=>{
 const filename=path.join(root,'MIGRER_DONNEES.bat');const bat=fs.readFileSync(filename);
 const text=bat.toString('utf8');
 assert(bat.includes(Buffer.from('\r\n')));
 assert(!/(^|[^\r])\n/.test(text),'fin de ligne LF isolée dans script CMD');
 for(const token of ['if exist "data\\chroniques-db.json"','copy /-Y','data\\media','remote-origin.txt'])assert(text.includes(token),token);
 assert(fs.existsSync(path.join(root,'GUIDE_TESTEURS.md')));
});
test('V3.7 : préflight non destructif valide fichiers, base et configuration',t=>{
 const {preflight}=require('../scripts/preflight-beta');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-preflight-v37-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const output={log(){},warn(){},error(){}};
 const incomplete=preflight(dir,output);assert.equal(incomplete.ok,false);
 for(const file of ['server.js','index.html','sw.js','src/online-app.js','src/workspace-layout.js','src/combat-workspace.js','src/styles.css','GUIDE_TESTEURS.md','MIGRER_DONNEES.bat']){
  const f=path.join(dir,file);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,'test');
 }
 const empty=preflight(dir,output);assert.equal(empty.ok,true);assert.equal(empty.warnings.length,1);
 const db=path.join(dir,'data','chroniques-db.json');fs.mkdirSync(path.dirname(db),{recursive:true});
 fs.writeFileSync(db,JSON.stringify({format:5,users:[{id:'u',passHash:'secret'}],campaigns:[{id:'c'}]}));
 const yes=preflight(dir,output);assert.equal(yes.ok,true);assert.equal(yes.accounts,1);assert.equal(yes.campaigns,1);
 assert.equal(fs.readFileSync(db,'utf8'),JSON.stringify({format:5,users:[{id:'u',passHash:'secret'}],campaigns:[{id:'c'}]}));
});
test('V3.7 : outil de diagnostic Windows et scripts de migration utilisent CRLF',()=>{
 for(const script of ['MIGRER_DONNEES.bat','VERIFIER_BETA.bat','TESTER_CHRONIQUES.bat','DEMARRER_CHRONIQUES.bat']){
  const v=fs.readFileSync(path.join(root,script));const s=v.toString('utf8');
  assert(v.includes(Buffer.from('\r\n')),script);
  assert(!/(^|[^\r])\n/.test(s),script);
 }
 const bat=fs.readFileSync(path.join(root,'VERIFIER_BETA.bat'),'utf8');
 assert(bat.includes('node scripts\\preflight-beta.js'));assert(bat.includes('node --test'));
});
test('V3.7 : toutes les ressources PWA sont réellement accessibles par HTTP',async t=>{
 const f=await fixture(t);
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 const match=sw.match(/const ASSETS=\[([^\]]+)\]/);
 assert(match,'manifest PWA');
 const urls=[...match[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
 assert(urls.length>=15);
 for(const url of urls){const res=await f.req(url);assert.equal(res.status,200,'manquant dans le serveur : '+url);assert(res.body.length>10,url);}
});

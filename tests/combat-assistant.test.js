'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const L=require('../src/logic'),{createServer}=require('../server');
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-v14-')),dataFile=path.join(dir,'db.json');
 const app=createServer({publicOrigin:null,dataFile,setupKey:'v14-secret-for-tests'});await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});const base='http://127.0.0.1:'+app.server.address().port;
 async function call(route,body,cookie=''){const res=await fetch(base+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(cookie?{Cookie:cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});const contentType=res.headers.get('content-type')||'';return {status:res.status,body:contentType.includes('json')?await res.json():await res.text(),cookie:res.headers.get('set-cookie')?.split(';')[0]||''};}
 const gm=(await call('setup',{name:'MJ Combat',password:'secret-password-2026',setupKey:'v14-secret-for-tests'})).cookie;
 const invoke=async(cookie,kind,id,other={})=>{const st=(await call('state',undefined,cookie)).body;return call('action',{baseVersion:st.version,kind,id,...other},cookie);};
 return {call,gm,invoke,dataFile,app};
}
test('les initiatives sont saisies après les dés physiques, triées et départagées manuellement',()=>{
 const s=L.initialState();L.setInitiative(s,'mj','aelin',20);L.setInitiative(s,'mj','brunna',20);L.setInitiative(s,'mj','elyra',9);
 assert.deepEqual(s.combat.order,['aelin','brunna','elyra']);
 L.moveInitiative(s,'mj','brunna',-1);assert.deepEqual(s.combat.order,['brunna','aelin','elyra']);
 L.startCombat(s,'mj');assert.equal(L.activeId(s),'brunna');
 assert.throws(()=>L.moveInitiative(s,'mj','brunna',1),/interdit pendant/);
 L.moveInitiative(s,'mj','elyra',-1);assert.equal(L.activeId(s),'brunna');
 L.nextTurn(s,'mj');assert.equal(L.activeId(s),'elyra');
 assert.throws(()=>L.sortInitiative(s,'mj'),/plein combat/);
 assert.throws(()=>L.moveInitiative(s,'aelin','elyra',1),/MJ/);
 assert.throws(()=>L.moveInitiative(s,'mj','brunna',-1),/hors/);
});
test('dégâts après concentration : rappel DD sans jet automatique ni suppression',()=>{
 const s=L.initialState(),p=L.findPc(s,'aelin');p.concentration='Marque du chasseur';
 const before=p.hp;L.changeHp(s,'mj','aelin',-8);
 assert.equal(p.hp,before-8);assert.equal(p.concentration,'Marque du chasseur');
 assert.equal(p.concentrationChecks.length,1);assert.equal(p.concentrationChecks[0].dc,10);
 L.changeHp(s,'mj','aelin',-33); // tombe à zéro : concentration interrompue
 assert.equal(p.hp,0);assert.equal(p.concentration,'');assert.deepEqual(p.concentrationChecks,[]);
 assert.equal(L.concentrationDC(21),10);assert.equal(L.concentrationDC(22),11);assert.equal(L.concentrationDC(53),26);
});
test('sauvegarde de concentration saisie physiquement : succès ou échec décidés par le joueur',()=>{
 const s=L.initialState(),p=L.findPc(s,'aelin');p.concentration='Marque du chasseur';
 L.changeHp(s,'mj','aelin',-5);const c=p.concentrationChecks[0];
 assert.throws(()=>L.resolveConcentration(s,'mj','aelin',c.id,'other'),/invalide/);
 L.resolveConcentration(s,'aelin','aelin',c.id,'success');assert.equal(p.concentration,'Marque du chasseur');assert.deepEqual(p.concentrationChecks,[]);
 L.changeHp(s,'mj','aelin',-2);const c2=p.concentrationChecks[0];L.resolveConcentration(s,'mj','aelin',c2.id,'failure');assert.equal(p.concentration,'');
 assert.equal(p.hp,17);assert.match(s.combat.log[0].msg,/dés physiques/);
});
test('API initiative : le joueur ne peut pas changer l’ordre ni les initiatives',async t=>{
 const f=await fixture(t);const code=(await f.call('invites',{characterId:'aelin'},f.gm)).body.code;
 const player=(await f.call('join',{name:'Joueur Test',password:'player-strong-password',code})).cookie;
 assert.equal((await f.invoke(player,'sortInitiative','aelin')).status,403);
 assert.equal((await f.invoke(player,'moveInitiative','aelin',{direction:1})).status,403);
 assert.equal((await f.invoke(player,'init','aelin',{value:18})).status,403);
 let res=await f.invoke(f.gm,'init','aelin',{value:24});assert.equal(res.status,200);assert.equal(res.body.state.combat.order[0],'aelin');
 res=await f.invoke(f.gm,'moveInitiative','aelin',{direction:1});assert.equal(res.status,200);assert.equal(res.body.state.combat.order[1],'aelin');
 const file=JSON.parse(fs.readFileSync(f.dataFile,'utf8'));assert.equal(file.campaigns[0].state.combat.manualOrder,true);
});
test('API rappels visibles uniquement sur la fiche possédée ; succès sans dés ni nouveau coût',async t=>{
 const f=await fixture(t);const code=(await f.call('invites',{characterId:'aelin'},f.gm)).body.code;
 const player=(await f.call('join',{name:'Joueur Test',password:'player-strong-password',code})).cookie;
 assert.equal((await f.invoke(f.gm,'concentration','aelin',{value:'Marque du chasseur'})).status,200);
 let res=await f.invoke(f.gm,'hp','aelin',{delta:-6});assert.equal(res.status,200);
 const check=res.body.state.characters[0].concentrationChecks[0];assert.equal(check.dc,10);
 const pv=res.body.state.characters[0].hp;
 assert.equal((await f.invoke(player,'resolveConcentration','brunna',{checkId:check.id,result:'success'})).status,403);
 assert.equal((await f.invoke(player,'resolveConcentration','aelin',{checkId:'missing',result:'success'})).status,400);
 assert.equal((await f.invoke(player,'resolveConcentration','aelin',{checkId:check.id,result:'not-a-result'})).status,400);
 res=await f.invoke(player,'resolveConcentration','aelin',{checkId:check.id,result:'success'});assert.equal(res.status,200);assert.equal(res.body.state.characters[0].hp,pv);
 assert.equal(res.body.state.characters[0].concentration,'Marque du chasseur');
 const other=res.body.state.characters.find(p=>p.id==='brunna');assert.equal(other.concentrationChecks,undefined);
});
test('front-end : suivi physique, flèches initiative, rappels et aucun générateur de dés',async t=>{
 const f=await fixture(t),page=await fetch('http://127.0.0.1:'+f.app.server.address().port+'/src/online-app.js');
 assert.equal(page.status,200);const js=await page.text();assert.match(js,/data-initiative-move/);assert.match(js,/data-concentration-check/);assert.match(js,/d20/);
 assert.doesNotMatch(js,/Math\.random\(|rollDice\(/);
 assert.equal((await f.call('status')).body.version,require('../package.json').version);
});

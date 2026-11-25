'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {createServer}=require('../server');

async function fixture(t){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-beta-'));fs.mkdirSync(path.join(tmp,'data'));
 const app=createServer({publicOrigin:null,dataFile:path.join(tmp,'data','chroniques-db.json'),setupKey:'very-long-bootstrap-secret'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(async()=>{await app.close();fs.rmSync(tmp,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+app.server.address().port;
 const call=async(route,{method='GET',body,cookie=''}={})=>{const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;const r=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let d=await r.text();try{d=JSON.parse(d);}catch{}return {status:r.status,data:d,cookie:r.headers.get('set-cookie')?.split(';')[0]||''};};
 const gm=(await call('/api/setup',{method:'POST',body:{name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'}})).cookie;
 const st=(await call('/api/state',{cookie:gm})).data;
 const inv=await call('/api/invites',{method:'POST',cookie:gm,body:{characterId:st.state.characters[0].id}});
 const pl=(await call('/api/join',{method:'POST',body:{name:'Joueuse Test',password:'LongPassword-2026',code:inv.data.code}})).cookie;
 return {tmp,call,gm,pl};
}

test('Signalements : un joueur envoie, le fichier est écrit, seul le MJ propriétaire les lit',async t=>{
 const f=await fixture(t);
 assert.equal((await f.call('/api/report',{method:'POST',body:{message:'test'}})).status,401,'connexion requise');
 assert.equal((await f.call('/api/report',{method:'POST',cookie:f.pl,body:{message:''}})).status,400);
 const r=await f.call('/api/report',{method:'POST',cookie:f.pl,body:{message:'Le bouton Tour suivant ne répond pas.\u0007',severity:'bloquant',page:'Combat',device:'Android · Chrome',screen:'390×844',password:'ne-doit-pas-apparaitre'}});
 assert.equal(r.status,200);
 const file=path.join(f.tmp,'data','signalements.jsonl');const line=JSON.parse(fs.readFileSync(file,'utf8').trim());
 assert.equal(line.user,'Joueuse Test');assert.equal(line.role,'joueur');assert.equal(line.severity,'bloquant');assert.equal(line.page,'Combat');
 assert.ok(!/\u0007/.test(line.message),'caractères de contrôle retirés');assert.ok(!JSON.stringify(line).includes('ne-doit-pas-apparaitre'),'aucun champ inattendu enregistré');
 assert.equal((await f.call('/api/reports',{cookie:f.pl})).status,403);
 const list=await f.call('/api/reports',{cookie:f.gm});assert.equal(list.status,200);assert.equal(list.data.reports.length,1);assert.equal(list.data.reports[0].message.startsWith('Le bouton'),true);
 const big=await f.call('/api/report',{method:'POST',cookie:f.gm,body:{message:'x'.repeat(5000),severity:'nimporte'}});assert.equal(big.status,200);
 const last=(await f.call('/api/reports',{cookie:f.gm})).data.reports[0];assert.equal(last.message.length,2000);assert.equal(last.severity,'important');assert.equal(last.role,'MJ');
});

test('Interface : signalement accessible à tous, mot de passe oublié expliqué',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
 for(const k of ['data-task="report-open"','function reportModal()','function reportsPanel()','function resetForm(status)','data-reset-password','Mot de passe oublié ?','reinitialiser='])assert.ok(ui.includes(k),k);
 assert.ok(fs.readFileSync(path.join(__dirname,'../REINITIALISER_MOT_DE_PASSE.bat'),'utf8').includes('scripts\\reset-password.js'));
});

test('Hors connexion : seules les actions additives ou protégées contre les conflits sont mises de côté',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
 const m=/const QUEUEABLE=new Set\((\[[^\]]*\])\)/.exec(ui);assert.ok(m);const kinds=JSON.parse(m[1].replace(/'/g,'"'));
 assert.deepEqual(kinds.sort(),['companionHp','deathSave','exhaustion','hp','itemUse','npcHp','pcNotesSave','resource','sharedNoteSave','slot','tempHp','whisperSend']);
 for(const k of ['condition','next','undo','npcRemove'])assert.ok(!kinds.includes(k),k+' ne doit jamais être rejoué en différé');
 for(const k of ['function flushOutbox()','outboxSave()',"window.addEventListener('online'",'id="outbox-count"'])assert.ok(ui.includes(k),k);
});

'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {createServer}=require('../server');
const T=require('../src/tour');
const L=require('../src/logic');
const ROOT=path.join(__dirname,'..');

test('Visite guidée : étapes pour le MJ et le joueur, textes en français, sans action destructrice',()=>{
 for(const role of ['gm','player']){
  const s=T.steps(role);assert.ok(s.length>=6,role);
  for(const st of s){assert.ok(st.title&&st.text.length>40,st.title);if(st.target)assert.ok(!/data-task="(end|undo|logout|backup-now|demo-campaign)"/.test(st.target),'la visite ne cible aucun bouton qui agit');}
 }
 assert.ok(T.steps('gm').some(s=>/invite/.test(s.target||'')),'le MJ découvre les invitations');
 assert.ok(T.steps('player').some(s=>/note/.test(s.target||'')),'le joueur découvre les notes partagées');
});

test('Tutoriels : chaque état a une explication, aide-mémoire autonomes et servis',async t=>{
 const {CONDITION_HELP}=require('../src/ui-helpers');
 for(const c of L.STATES)assert.ok(typeof CONDITION_HELP[c]==='string'&&CONDITION_HELP[c].length>20,'explication manquante : '+c);
 for(const f of ['aide-joueur.html','aide-mj.html']){const h=fs.readFileSync(path.join(ROOT,f),'utf8');assert.ok(!/<script|onclick=|https?:\/\/(?!www\.w3)/i.test(h),f+' sans script ni ressource externe');assert.match(h,/@media print/);}
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-tuto-'));
 const app=createServer({publicOrigin:null,dataFile:path.join(dir,'db.json'),setupKey:'very-long-bootstrap-secret'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+app.server.address().port;
 for(const u of ['/aide-joueur.html','/aide-mj.html','/src/tour.js','/src/qr.js'])assert.equal((await fetch(base+u)).status,200,u);
});

test('Campagne d’entraînement : séparée, avec des monstres d’exemple, réservée au compte connecté',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-demo-'));
 const app=createServer({publicOrigin:null,dataFile:path.join(dir,'db.json'),setupKey:'very-long-bootstrap-secret'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+app.server.address().port;
 const call=async(route,{method='GET',body,cookie=''}={})=>{const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;const r=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let d=await r.text();try{d=JSON.parse(d);}catch{}return {status:r.status,data:d,cookie:r.headers.get('set-cookie')?.split(';')[0]||''};};
 assert.notEqual((await call('/api/campaigns/demo',{method:'POST',body:{}})).status,200,'connexion requise');
 const gm=(await call('/api/setup',{method:'POST',body:{name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'}})).cookie;
 const first=(await call('/api/state',{cookie:gm})).data;
 const r=await call('/api/campaigns/demo',{method:'POST',cookie:gm,body:{}});assert.equal(r.status,200);
 const st=(await call('/api/state',{cookie:gm})).data;
 assert.equal(st.state.title,'Campagne d’entraînement');assert.notEqual(st.viewer.campaignId,first.viewer.campaignId);
 assert.ok(st.state.combat.npcs.length>=3);assert.ok(st.state.combat.npcs.some(n=>n.defenses&&n.defenses.Poison==='immune'));
 assert.ok(st.state.combat.npcs.every(n=>n.abilities&&n.abilities.dex>=1));
});

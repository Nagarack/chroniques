'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {createServer}=require('../server');
const B=require('../src/bestiary');
const N=require('../src/creatures');
const L=require('../src/logic');

test('Bestiaire : chaque créature est complète et acceptée telle quelle par une fiche de créature',()=>{
 const ids=new Set();
 for(const m of B.list()){
  assert.ok(!ids.has(m.id),m.id);ids.add(m.id);
  assert.ok(m.xp>0&&m.hp>0&&m.ac>=5&&m.ac<=25,m.name);
  for(const v of Object.values(m.abilities))assert.ok(v>=1&&v<=30,m.name);
  for(const [t,v] of Object.entries(m.defenses)){assert.ok(L.DAMAGE_TYPES.includes(t),m.name+' '+t);assert.ok(['resist','vuln','immune'].includes(v));}
  const v=N.validate(B.creatureValues(m));
  assert.equal(v.cr,m.cr);assert.deepEqual(v.abilities,m.abilities);assert.equal(v.visibility,'hidden','masquée aux joueurs par défaut');
 }
 assert.ok(B.list().length>=30);
 assert.equal(B.get('gobelin').xp,50);assert.equal(B.get('ogre').xp,450);assert.equal(B.initiativeBonus(B.get('gobelin')),2);
});

test('Difficulté des rencontres : budget d’XP du groupe (règles 2024)',()=>{
 const lv=[3,3,3,3];
 let d=B.difficulty(lv,Array(4).fill('1/4'));assert.equal(d.xp,200);assert.deepEqual(d.budget,{low:600,moderate:900,high:1600});assert.equal(d.label,'Faible');
 d=B.difficulty(lv,['2','1/4','1/4','1/4','1/4']);assert.equal(d.xp,650);assert.equal(d.label,'Modérée');
 d=B.difficulty(lv,['3','3']);assert.equal(d.label,'Élevée');
 d=B.difficulty(lv,['5']);assert.equal(d.label,'Au-delà d’élevée');
 d=B.difficulty(lv,[null,'1']);assert.equal(d.unknown,1);assert.equal(d.xp,200);
 assert.equal(B.difficulty([],['1']).label,'Groupe vide');
});

test('Épuisement et rencontres complètes : bornes, repos long, champs étendus conservés au déploiement',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-best-'));
 const app=createServer({publicOrigin:null,dataFile:path.join(dir,'db.json'),setupKey:'very-long-bootstrap-secret'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+app.server.address().port;
 const call=async(route,{method='GET',body,cookie=''}={})=>{const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;const r=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let d=await r.text();try{d=JSON.parse(d);}catch{}return {status:r.status,data:d,cookie:r.headers.get('set-cookie')?.split(';')[0]||''};};
 const gm=(await call('/api/setup',{method:'POST',body:{name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'}})).cookie;
 const act=async(kind,extra={})=>{const st=(await call('/api/state',{cookie:gm})).data;return call('/api/action',{method:'POST',cookie:gm,body:{baseVersion:st.version,kind,...extra}});};
 const id=(await call('/api/state',{cookie:gm})).data.state.characters[0].id;
 let r;for(let i=0;i<8;i++)r=await act('exhaustion',{id,delta:1});
 assert.equal(r.data.state.characters.find(c=>c.id===id).exhaustion,6,'plafonné à 6');
 assert.equal((await act('exhaustion',{id,delta:3})).status,400);
 for(let i=0;i<4;i++)r=await act('exhaustion',{id,delta:-1});
 r=await act('rest',{id,type:'long'});assert.equal(r.data.state.characters.find(c=>c.id===id).exhaustion,1,'un repos long retire un niveau');
 // Modèle issu du bestiaire, rencontre, déploiement : défenses, caractéristiques et FP conservés.
 r=await act('templateAdd',{values:B.creatureValues(B.get('squelette')),icon:''});assert.equal(r.status,200);
 const tpl=r.data.state.gmLibrary.templates[0];assert.equal(tpl.cr,'1/4');assert.equal(tpl.defenses.Poison,'immune');
 r=await act('encounterAdd',{name:'Crypte',notes:''});const enc=r.data.state.gmLibrary.encounters[0];
 r=await act('encounterGroupAdd',{id:enc.id,templateId:tpl.id,quantity:2});assert.equal(r.status,200);
 r=await act('encounterDeploy',{id:enc.id});
 if(r.status!==200){const st=(await call('/api/state',{cookie:gm})).data;assert.fail('déploiement : '+JSON.stringify(r.data)+' '+Object.keys(st.state));}
 const npcs=r.data.state.combat.npcs.filter(n=>n.name==='Squelette');assert.equal(npcs.length,2);
 for(const n of npcs){assert.equal(n.cr,'1/4');assert.equal(n.defenses.Contondant,'vuln');assert.equal(n.abilities.con,15);}
 r=await act('npcHp',{id:npcs[0].id,delta:-4,damageType:'Contondant'});assert.equal(r.data.state.combat.npcs.find(n=>n.id===npcs[0].id).hp,13-8);
});

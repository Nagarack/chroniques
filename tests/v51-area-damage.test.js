'use strict';
const test=require('node:test');const assert=require('node:assert');
const AD=require('../src/area-damage.js');
test('zone de sort : jetons touchés (cercle, cube, cône, ligne), une demi-case de tolérance',()=>{
 // Carte carrée de 20 cases de 1,5 m : 1 case = 50 unités ; 1 m = 33,3 unités.
 const map={grid:{cells:20,scale:'1,5 m'},tokens:[{id:'a',kind:'pc',refId:'p1',x:500,y:500},{id:'b',kind:'npc',refId:'n1',x:700,y:500},{id:'c',kind:'npc',refId:'n2',x:500,y:780},{id:'d',kind:'npc',refId:'n3',x:300,y:500}]};
 const ids=a=>AD.tokensInArea(map,a,1).map(t=>t.id).sort().join('');
 assert.strictEqual(ids({shape:'circle',size:6,x:500,y:500}),'abd','sphère de 6 m : 200 unités + demi-case');
 assert.strictEqual(ids({shape:'circle',size:3,x:500,y:500}),'a');
 assert.strictEqual(ids({shape:'cone',size:9,x:500,y:500,angle:0}),'ab','cône vers la droite');
 assert.strictEqual(ids({shape:'cone',size:9,x:500,y:500,angle:90}),'ac','cône vers le bas');
 assert.strictEqual(ids({shape:'line',size:9,x:250,y:500,angle:0}),'ad','ligne horizontale');assert.strictEqual(ids({shape:'line',size:15,x:250,y:500,angle:0}),'abd');
 assert.strictEqual(ids({shape:'cube',size:3,x:500,y:500}),'a');
 assert.deepStrictEqual(AD.tokensInArea({tokens:map.tokens},{shape:'circle',size:6,x:500,y:500},1),[],'sans grille : rien');
});
test('dégâts de zone : moitié si réussite, puis résistance / vulnérabilité / immunité',()=>{
 const c={x:{name:'X',defenses:{}},r:{name:'R',defenses:{Feu:'resist'}},v:{name:'V',defenses:{Feu:'vuln'}},i:{name:'I',defenses:{Feu:'immune'}}};
 const rows=AD.plan({amount:27,type:'Feu',onSave:'half',targets:[{kind:'npc',id:'x'},{kind:'npc',id:'r',saved:true},{kind:'npc',id:'v',saved:true},{kind:'npc',id:'i'}],lookup:(k,id)=>c[id]});
 assert.deepStrictEqual(rows.map(r=>r.amount),[27,6,26,0]);
 assert.deepStrictEqual(AD.plan({amount:10,type:'',onSave:'none',targets:[{kind:'pc',id:'x',saved:true}],lookup:()=>c.x}).map(r=>r.amount),[0]);
 assert.throws(()=>AD.plan({amount:5,type:'',onSave:'half',targets:[],lookup:()=>c.x}),/au moins une cible/);
 assert.throws(()=>AD.plan({amount:5,type:'',onSave:'half',targets:[{kind:'pc',id:'x'},{kind:'pc',id:'x'}],lookup:()=>c.x}),/double/);
});
test('dégâts de zone : action serveur sur personnages et créatures, annulable',async t=>{
 const {createServer}=require('../server.js');const os=require('os'),fs=require('fs'),path=require('path');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ad-'));const app=createServer({publicOrigin:null,dataFile:path.join(dir,'db.json'),setupKey:'very-long-bootstrap-secret'});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));t.after(()=>app.server.close());const base='http://127.0.0.1:'+app.server.address().port;
 let cookie='';const call=async(p,body)=>{const r=await fetch(base+p,{method:body?'POST':'GET',headers:{'content-type':'application/json',origin:base,cookie},body:body?JSON.stringify(body):undefined});const sc=r.headers.get('set-cookie');if(sc)cookie=sc.split(';')[0];return {status:r.status,data:await r.json().catch(()=>null)};};
 await call('/api/setup',{name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'});
 const st=async()=>(await call('/api/state')).data;const act=async(kind,extra)=>call('/api/action',{kind,baseVersion:(await st()).version,...extra});
 {const x=await act('npcAdd',{values:{name:'Gobelin',kind:'monstre',hpMax:20,ac:13,initiative:10,speed:9,visibility:'public'}});assert.strictEqual(x.status,200,JSON.stringify(x.data));}
 const s0=(await st()).state;const npc=s0.combat.npcs[0],pc=s0.characters[0];
 {const x=await act('npcDefense',{id:npc.id,type:'Feu',value:'resist'});assert.strictEqual(x.status,200,JSON.stringify(x.data));}
 const pcHp=pc.hp;
 const r=await act('areaDamage',{amount:8,damageType:'Feu',onSave:'half',label:'Boule de feu',targets:[{kind:'pc',id:pc.id,saved:true},{kind:'npc',id:npc.id}]});assert.strictEqual(r.status,200,JSON.stringify(r.data));
 const s1=(await st()).state;assert.strictEqual(s1.characters[0].hp,pcHp-4);assert.strictEqual(s1.combat.npcs[0].hp,16,'résistance : 8 → 4');
 assert.ok(s1.combat.log.some(l=>l.msg.includes('Boule de feu')));
 assert.strictEqual((await act('areaDamage',{amount:8,damageType:'Bidule',targets:[{kind:'pc',id:pc.id}]})).status,400);
 assert.strictEqual((await act('undo',{})).status,200);assert.strictEqual((await st()).state.combat.npcs[0].hp,20,'annulable');
});

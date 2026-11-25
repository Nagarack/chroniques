'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {createServer}=require('../server');
const L=require('../src/logic');
const N=require('../src/creatures');

async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-def-'));
 const app=createServer({publicOrigin:null,dataFile:path.join(dir,'db.json'),setupKey:'very-long-bootstrap-secret'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+app.server.address().port;
 t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const call=async(route,{method='GET',body,cookie=''}={})=>{const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;const res=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let data=await res.text();try{data=JSON.parse(data);}catch{}return {status:res.status,data,cookie:res.headers.get('set-cookie')?.split(';')[0]||''};};
 const setup=await call('/api/setup',{method:'POST',body:{name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'}});
 const act=async(cookie,kind,extra={})=>{const st=(await call('/api/state',{cookie})).data;return call('/api/action',{method:'POST',cookie,body:{baseVersion:st.version,kind,...extra}});};
 return {call,act,gm:setup.cookie};
}
const pc=(r,id)=>r.data.state.characters.find(c=>c.id===id);

test('Défenses : types de dégâts identiques côté personnages et créatures',()=>{
 assert.deepEqual(L.DAMAGE_TYPES,N.DAMAGE_TYPES);assert.deepEqual(L.DEFENSE_STATES,N.DEFENSE_STATES);
 assert.deepEqual(L.adjustDamage({Feu:'resist'},'Feu',9),{amount:4,state:'resist'});
 assert.deepEqual(L.adjustDamage({Feu:'vuln'},'Feu',9),{amount:18,state:'vuln'});
 assert.deepEqual(L.adjustDamage({Feu:'immune'},'Feu',9),{amount:0,state:'immune'});
 assert.deepEqual(L.adjustDamage({Feu:'resist'},'Froid',9),{amount:9,state:null});
 assert.deepEqual(L.cleanDefenses({Feu:'resist',Inconnu:'resist',Froid:'nimporte'}),{Feu:'resist'});
});

test('Défenses : un personnage applique résistance, vulnérabilité et immunité aux dégâts typés',async t=>{
 const f=await fixture(t);const gs=(await f.call('/api/state',{cookie:f.gm})).data;const id=gs.state.characters[0].id,hp0=gs.state.characters[0].hp;
 let r=await f.act(f.gm,'defense',{id,type:'Feu',value:'resist'});assert.equal(r.status,200);
 r=await f.act(f.gm,'defense',{id,type:'Froid',value:'vuln'});r=await f.act(f.gm,'defense',{id,type:'Poison',value:'immune'});
 assert.deepEqual(pc(r,id).defenses,{Feu:'resist',Froid:'vuln',Poison:'immune'});
 r=await f.act(f.gm,'hp',{id,delta:-9,damageType:'Feu'});assert.equal(pc(r,id).hp,hp0-4);
 assert.match(r.data.state.combat.log[0].msg,/résistance : 9 → 4/);
 r=await f.act(f.gm,'hp',{id,delta:-3,damageType:'Froid'});assert.equal(pc(r,id).hp,hp0-4-6);
 const before=pc(r,id).hp;r=await f.act(f.gm,'hp',{id,delta:-8,damageType:'Poison'});assert.equal(pc(r,id).hp,before);assert.match(r.data.state.combat.log[0].msg,/aucun dégât/);
 r=await f.act(f.gm,'hp',{id,delta:-2});assert.equal(pc(r,id).hp,before-2,'sans type, aucun modificateur');
 r=await f.act(f.gm,'hp',{id,delta:-2,damageType:'Inconnu'});assert.equal(r.status,400);
 r=await f.act(f.gm,'defense',{id,type:'Feu',value:''});assert.equal(pc(r,id).defenses.Feu,undefined);
 r=await f.act(f.gm,'defense',{id,type:'Feu',value:'nimporte'});assert.equal(r.status,400);
});

test('Fiches de monstres : caractéristiques, traits, défenses, dégâts typés et confidentialité',async t=>{
 const f=await fixture(t);const gs=(await f.call('/api/state',{cookie:f.gm})).data;const cid=gs.state.characters[0].id;
 const values={name:'Ogre des brumes',kind:'monstre',hpMax:59,ac:11,initiative:-1,speed:12,visibility:'public',showHp:false,actions:'Massue : +6, 2d8+4 contondant',notes:'Craint le feu',traits:'Charge sauvage',legendary:'',defenses:{Feu:'vuln',Poison:'immune',Bidon:'resist'},abilities:{str:19,dex:8,con:16,int:5,wis:7,cha:7}};
 let r=await f.act(f.gm,'npcAdd',{values:{...values,abilities:{...values.abilities,str:31}}});assert.equal(r.status,400,'caractéristique hors limites refusée');
 r=await f.act(f.gm,'npcAdd',{values});assert.equal(r.status,200);
 const npc=r.data.state.combat.npcs[0];assert.deepEqual(npc.defenses,{Feu:'vuln',Poison:'immune'},'types inconnus retirés');assert.equal(npc.abilities.str,19);assert.equal(npc.traits,'Charge sauvage');
 r=await f.act(f.gm,'npcHp',{id:npc.id,delta:-10,damageType:'Feu'});assert.equal(r.data.state.combat.npcs[0].hp,59-20);
 r=await f.act(f.gm,'npcHp',{id:npc.id,delta:-10,damageType:'Poison'});assert.equal(r.data.state.combat.npcs[0].hp,59-20);
 r=await f.act(f.gm,'npcDefense',{id:npc.id,type:'Froid',value:'resist'});assert.equal(r.data.state.combat.npcs[0].defenses.Froid,'resist');
 const inv=await f.call('/api/invites',{method:'POST',cookie:f.gm,body:{characterId:cid}});
 const pl=await f.call('/api/join',{method:'POST',body:{name:'Joueuse Test',password:'LongPassword-2026',code:inv.data.code}});
 const view=(await f.call('/api/state',{cookie:pl.cookie})).data.state.combat.npcs[0];
 for(const k of ['defenses','abilities','traits','legendary','notes','actions','ac','hp'])assert.equal(view[k],undefined,k+' ne doit pas être visible des joueurs');
 const st=(await f.call('/api/state',{cookie:pl.cookie})).data;
 const denied=await f.call('/api/action',{method:'POST',cookie:pl.cookie,body:{baseVersion:st.version,kind:'npcDefense',id:npc.id,type:'Feu',value:'immune'}});assert.equal(denied.status,403);
});

test('Interface : aucun formulaire ne contient de champ nommé « id » (il masquerait form.id dans le navigateur)',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
 const offenders=[];
 for(const m of ui.matchAll(/<form id=\\?"([a-z0-9-]+)\\?"[^>]*>(.*?)<\/form>/gs))if(/name=\\?"(id|action|method|target|elements|length|submit|reset)\\?"/.test(m[2]))offenders.push(m[1]);
 assert.deepEqual(offenders,[],'champs qui masquent une propriété native du formulaire');
 assert.ok(ui.includes("getAttribute('id')"),'le gestionnaire submit lit l’attribut id, pas la propriété');
});

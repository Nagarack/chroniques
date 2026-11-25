'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), os=require('node:os'),path=require('node:path');
const {createServer}=require('../server');
async function fixture(t,existing){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-v06-'));const dataFile=path.join(dir,'db.json');if(existing)fs.writeFileSync(dataFile,JSON.stringify(existing));
 const app=createServer({publicOrigin:null,dataFile,setupKey:'one-time-bootstrap-key'});await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));const base='http://127.0.0.1:'+app.server.address().port;
 t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 async function call(route,body,token=''){
  const post=body!==undefined;const response=await fetch(base+'/api/'+route,{method:post?'POST':'GET',headers:{...(post?{'Content-Type':'application/json'}:{}),...(token?{'Cookie':token}:{})},body:post?JSON.stringify(body):undefined});
  return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]||''};
 }
 const mk=(name,password,other={})=>({name,password,...other});
 const gm=(await call('setup',mk('MJ Test','strong-gm-2026',{setupKey:'one-time-bootstrap-key'}))).cookie;
 assert.ok(gm);return {dir,dataFile,app,call,mk,gm};
}
async function join(f,name='Joueur Elfe',pc='aelin'){
 const invite=await f.call('invites',{characterId:pc},f.gm);assert.equal(invite.status,200);
 const player=await f.call('join',f.mk(name,'strong-player-2026',{code:invite.data.code}));assert.equal(player.status,200);
 return player.cookie;
}
const scores={str:14,dex:18,con:12,int:11,wis:16,cha:8};
test('édition complète côté serveur : propriétaire oui, autres joueurs non, validation stricte',async t=>{
 const f=await fixture(t),player=await join(f);
 const v=(await f.call('state',undefined,player)).data.version;
 const updated=await f.call('action',{kind:'editPc',baseVersion:v,id:'aelin',values:{name:'Aëlin des Feuilles',role:'Elfe',job:'Rôdeuse',level:4,hpMax:38,ac:16,passive:14,speed:9,scores}},player);
 assert.equal(updated.status,200);assert.equal(updated.data.state.characters[0].stats.abilities.dex,18);
 assert.equal(updated.data.state.characters[0].name,'Aëlin des Feuilles');
 assert.equal((await f.call('action',{kind:'editPc',baseVersion:updated.data.version,id:'brunna',values:{name:'Pirate',role:'Nain',job:'Guerrier',level:1,hpMax:5,ac:10,passive:10,speed:9,scores}},player)).status,403);
 assert.equal((await f.call('action',{kind:'editPc',baseVersion:updated.data.version,id:'aelin',values:{name:'Invalide',role:'Elfe',job:'Rôdeuse',level:22,hpMax:38,ac:16,passive:14,speed:9,scores}},player)).status,400);
 assert.equal((await f.call('state',undefined,f.gm)).data.state.characters[0].name,'Aëlin des Feuilles');
});
test('capacités, consommations, suppression de ressource utilisée refusée',async t=>{
 const f=await fixture(t),player=await join(f);
 let view=(await f.call('state',undefined,player)).data;
 const r=await f.call('action',{baseVersion:view.version,kind:'addResource',id:'aelin',name:'Point de maîtrise',max:2,rest:'short'},player);
 assert.equal(r.status,200);const newResource=r.data.state.characters[0].resources.at(-1);assert.equal(newResource.left,2);
 const a=await f.call('action',{baseVersion:r.data.version,kind:'addAbility',id:'aelin',name:'Esquive rusée',type:'bonus',description:'Suivi manuel',resourceId:newResource.id,concentration:false},player);
 assert.equal(a.status,200);const ability=a.data.state.characters[0].abilities.at(-1);
 assert.equal((await f.call('action',{baseVersion:a.data.version,kind:'removeResource',id:'aelin',resourceId:newResource.id},player)).status,400);
 const use=await f.call('action',{baseVersion:a.data.version,kind:'ability',id:'aelin',abilityId:ability.id},player);assert.equal(use.status,200);
 assert.equal(use.data.state.characters[0].resources.at(-1).left,1);
 const remove=await f.call('action',{baseVersion:use.data.version,kind:'removeAbility',id:'aelin',abilityId:ability.id},player);assert.equal(remove.status,200);
 const removeRes=await f.call('action',{baseVersion:remove.data.version,kind:'removeResource',id:'aelin',resourceId:newResource.id},player);assert.equal(removeRes.status,200);
 assert.equal(removeRes.data.state.characters[0].resources.some(r=>r.id===newResource.id),false);
});
test('invitations : liste MJ uniquement, révocation, code révoqué rejeté',async t=>{
 const f=await fixture(t);
 const first=await f.call('invites',{characterId:'brunna'},f.gm);assert.equal(first.status,200);
 const mgmt=await f.call('management',undefined,f.gm);assert.equal(mgmt.status,200);
 assert.equal(mgmt.data.invites.length,1);assert.ok(!JSON.stringify(mgmt.data).includes(first.data.code));
 assert.equal((await f.call('management')).status,401);
 assert.equal((await f.call('invite/revoke',{id:mgmt.data.invites[0].id})).status,401);
 assert.equal((await f.call('invite/revoke',{id:mgmt.data.invites[0].id},f.gm)).status,200);
 assert.equal((await f.call('join',f.mk('Nouvelle Joueur','strong-player-2026',{code:first.data.code}))).status,403);
 assert.equal((await f.call('management',undefined,f.gm)).data.invites.length,0);
});
test('MJ détache un joueur : compte révoqué, fiche conservée, ré-invitation possible',async t=>{
 const f=await fixture(t),player=await join(f);
 const roster=(await f.call('management',undefined,f.gm)).data;assert.equal(roster.members.length,1);
 const original=(await f.call('state',undefined,f.gm)).data.state.characters.find(p=>p.id==='aelin').name;
 assert.equal((await f.call('member/remove',{userId:roster.members[0].userId},player)).status,403);
 assert.equal((await f.call('member/remove',{userId:roster.members[0].userId},f.gm)).status,200);
 assert.equal((await f.call('state',undefined,player)).status,401);
 assert.equal((await f.call('login',f.mk('Joueur Elfe','strong-player-2026'))).status,401);
 assert.equal((await f.call('state',undefined,f.gm)).data.state.characters.find(p=>p.id==='aelin').name,original);
 assert.equal((await f.call('invites',{characterId:'aelin'},f.gm)).status,200);
});
test('changement de mot de passe invalide les autres sessions du compte',async t=>{
 const f=await fixture(t),player=await join(f);
 const another=(await f.call('login',f.mk('Joueur Elfe','strong-player-2026'))).cookie;
 assert.equal((await f.call('password',{currentPassword:'wrong',newPassword:'brand-new-pass-2026'},player)).status,403);
 assert.equal((await f.call('password',{currentPassword:'strong-player-2026',newPassword:'brand-new-pass-2026'},player)).status,200);
 assert.equal((await f.call('state',undefined,another)).status,401);
 assert.equal((await f.call('state',undefined,player)).status,200);
 assert.equal((await f.call('login',f.mk('Joueur Elfe','strong-player-2026'))).status,401);
 assert.equal((await f.call('login',f.mk('Joueur Elfe','brand-new-pass-2026'))).status,200);
});
test('même base de données que la V0.5, aucune migration destructive',async t=>{
 const f=await fixture(t),player=await join(f);
 const bytes=fs.readFileSync(f.dataFile,'utf8'),db=JSON.parse(bytes);
 assert.equal(db.format,5);assert.equal(db.users.length,2);
 const current=(await f.call('state',undefined,player)).data;
 assert.equal(current.viewer.characterId,'aelin');
});

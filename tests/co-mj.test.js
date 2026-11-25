'use strict';
const test=require('node:test'),assert=require('node:assert/strict'), fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createServer}=require('../server');
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-v24-')),dataFile=path.join(dir,'chroniques-db.json');
 const app=createServer({publicOrigin:null,dataFile,setupKey:'initialisation-test'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));
 const url='http://127.0.0.1:'+app.server.address().port;
 t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 async function call(route,body,cookie=''){
  const r=await fetch(url+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]||''};
 }
 const owner=(await call('setup',{setupKey:'initialisation-test',name:'MJ principal',password:'strong-owner-pass-2026'})).cookie;
 const iv=(await call('invites',{characterId:'aelin'},owner)).data;
 const player=(await call('join',{code:iv.code,name:'Joueur Alice',password:'strong-alice-pass-2026'})).cookie;
 const membership=(await call('management',undefined,owner)).data;
 const userId=membership.members.find(m=>m.characterId==='aelin').userId;
 return {dir,dataFile,app,call,owner,player,userId};
}
test('V2.4 : seul le MJ propriétaire peut promouvoir, la fiche reste attachée et le compte garde son mot de passe',async t=>{
 const f=await fixture(t);
 assert.equal((await f.call('member/role',{userId:f.userId,role:'gm'},f.player)).status,403);
 assert.equal((await f.call('state',undefined,f.player)).data.viewer.role,'player');
 assert.equal((await f.call('member/role',{userId:f.userId,role:'gm'},f.owner)).status,200);
 const view=(await f.call('state',undefined,f.player)).data;
 assert.equal(view.viewer.role,'gm');assert.equal(view.viewer.isOwner,false);assert.equal(view.viewer.characterId,'aelin');
 assert.equal(view.state.claimedCharacterIds.includes('aelin'),true);
 const roster=(await f.call('management',undefined,f.player)).data;
 assert.equal(roster.roleAssignments.find(m=>m.userId===f.userId).role,'gm');
 assert.equal(roster.members.find(m=>m.userId===f.userId).characterId,'aelin');
 assert.equal((await f.call('invites',{characterId:'aelin'},f.owner)).status,400);
 assert.equal((await f.call('login',{name:'Joueur Alice',password:'strong-alice-pass-2026'})).status,200);
});
test('V2.4 : co-MJ voit notes privées, ne peut ni nommer un autre MJ ni supprimer des membres',async t=>{
 const f=await fixture(t);
 const old=(await f.call('state',undefined,f.owner)).data;
 assert.equal((await f.call('action',{kind:'gmNotes',value:'Secret du dragon ancien',baseVersion:old.version},f.owner)).status,200);
 assert.equal((await f.call('state',undefined,f.player)).data.state.gmNotes,undefined);
 assert.equal((await f.call('member/role',{userId:f.userId,role:'gm'},f.owner)).status,200);
 assert.match((await f.call('state',undefined,f.player)).data.state.gmNotes,/Secret du dragon ancien/);
 assert.equal((await f.call('member/role',{userId:f.userId,role:'player'},f.player)).status,403);
 assert.equal((await f.call('member/remove',{userId:f.userId},f.player)).status,403);
 assert.equal((await f.call('invite/revoke',{id:'inconnu'},f.player)).status,403);
 assert.equal((await f.call('management',undefined,f.player)).status,200);
});
test('V2.4 : rétrogradation révoque immédiatement les droits privés, sans supprimer les données',async t=>{
 const f=await fixture(t);
 assert.equal((await f.call('member/role',{userId:f.userId,role:'gm'},f.owner)).status,200);
 const a=(await f.call('state',undefined,f.player)).data;
 assert.equal((await f.call('action',{kind:'gmNotes',value:'Notes ultra secrètes',baseVersion:a.version},f.player)).status,200);
 assert.equal((await f.call('member/role',{userId:f.userId,role:'player'},f.owner)).status,200);
 const b=(await f.call('state',undefined,f.player)).data;
 assert.equal(b.viewer.role,'player');assert.equal(b.viewer.characterId,'aelin');
 assert.equal(b.state.gmNotes,undefined);assert(!JSON.stringify(b).includes('Notes ultra secrètes'));
 assert.equal((await f.call('management',undefined,f.player)).status,403);
 assert.equal((await f.call('export',undefined,f.player)).status,403);
 assert.equal((await f.call('action',{kind:'gmNotes',value:'intrusion',baseVersion:b.version},f.player)).status,403);
 assert.equal((await f.call('state',undefined,f.owner)).data.state.gmNotes,'Notes ultra secrètes');
});
test('V2.4 : propriétaire protégé, changements invalides bloqués, comptes inconnus bloqués',async t=>{
 const f=await fixture(t);
 const ownerId=(await f.call('management',undefined,f.owner)).data.ownerId;
 assert.equal((await f.call('member/role',{userId:ownerId,role:'player'},f.owner)).status,403);
 assert.equal((await f.call('member/role',{userId:f.userId,role:'owner'},f.owner)).status,400);
 assert.equal((await f.call('member/role',{userId:'does-not-exist',role:'gm'},f.owner)).status,400);
 assert.equal((await f.call('member/role',{userId:f.userId,role:'player'},f.owner)).status,400);
 assert.equal((await f.call('state',undefined,f.owner)).data.viewer.isOwner,true);
});
test('V2.4 : rôles persistants au redémarrage avec le format 5, sans recréer de compte',async t=>{
 const f=await fixture(t);
 const prom=await f.call('member/role',{userId:f.userId,role:'gm'},f.owner);assert.equal(prom.status,200);
 const saved=JSON.parse(fs.readFileSync(f.dataFile,'utf8'));
 assert.equal(saved.format,5);assert.equal(saved.users.length,2);assert.equal(saved.campaigns[0].members.find(x=>x.userId===f.userId).role,'gm');
 const app2=createServer({publicOrigin:null,dataFile:f.dataFile});await new Promise(ok=>app2.server.listen(0,'127.0.0.1',ok));
 t.after(async()=>app2.close());
 const url='http://127.0.0.1:'+app2.server.address().port;
 const login=await fetch(url+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Joueur Alice',password:'strong-alice-pass-2026'})});
 assert.equal(login.status,200);
 const state=await fetch(url+'/api/state',{headers:{Cookie:login.headers.get('set-cookie')?.split(';')[0]}});
 assert.equal((await state.json()).viewer.role,'gm');
});
test('V2.4 : interface dédiée aux rôles, confirmation des secrets et statut propriétaire',()=>{
 const s=fs.readFileSync(path.join(__dirname,'..','src/online-app.js'),'utf8');
 assert.match(s,/data-member-role/);assert.match(s,/viewer\?\.isOwner/);
 assert.match(s,/notes secrètes de la campagne/);assert.match(s,/data-member-role-select/);assert.match(s,/Co-MJ créatures/);
 assert.match(s,/data-member-name/);
});

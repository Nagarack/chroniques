'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {createServer}=require('../server');

async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-test-'));
 const app=createServer({publicOrigin:null,dataFile:path.join(dir,'db.json'),setupKey:'very-long-bootstrap-secret'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+app.server.address().port;
 t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 async function call(route,{method='GET',body,cookie='',origin}={}){
  const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers['Cookie']=cookie;if(origin)headers.Origin=origin;
  const res=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  let data=await res.text();try{data=JSON.parse(data);}catch{}
  return {status:res.status,data,cookie:res.headers.get('set-cookie')?.split(';')[0]||''};
 }
 return {app,call,base,dir};
}
const post=(name,pw,extra={})=>({name,password:pw,...extra});
async function setup(f){const r=await f.call('/api/setup',{method:'POST',body:post('Maître Aubeciel','Strong-Password-2026',{setupKey:'very-long-bootstrap-secret'})});assert.equal(r.status,200);return r.cookie;}

test('installation unique, mot de passe haché, connexion, déconnexion',async t=>{
 const f=await fixture(t);
 assert.equal((await f.call('/api/status')).data.setupRequired,true);
 assert.equal((await f.call('/api/setup',{method:'POST',body:post('MJ Test','strong-password-2026',{setupKey:'invalid'})})).status,403);
 const gm=await setup(f);
 assert.equal((await f.call('/api/status')).data.setupRequired,false);
 assert.equal((await f.call('/api/setup',{method:'POST',body:post('Another MJ','strong-password-2026',{setupKey:'very-long-bootstrap-secret'})})).status,403);
 const db=JSON.parse(fs.readFileSync(path.join(f.dir,'db.json')));
 assert.ok(!JSON.stringify(db).includes('Strong-Password-2026'));
 assert.equal((await f.call('/api/state')).status,401);
 assert.equal((await f.call('/api/me',{cookie:gm})).data.role,'gm');
 assert.equal((await f.call('/api/login',{method:'POST',body:post('Maître Aubeciel','wrong-password')})).status,401);
 const logged=await f.call('/api/login',{method:'POST',body:post('maître aubeciel','Strong-Password-2026')});assert.equal(logged.status,200);
 assert.equal((await f.call('/api/logout',{method:'POST',cookie:logged.cookie})).status,200);
 assert.equal((await f.call('/api/state',{cookie:logged.cookie})).status,401);
});

test('codes usage unique et expiration, confidentialité par rôle, actions vérifiées',async t=>{
 const f=await fixture(t),gm=await setup(f);
 const before=await f.call('/api/state',{cookie:gm});assert.equal(before.status,200);
 const note=before.data.state.gmNotes;
 const invite=await f.call('/api/invites',{method:'POST',cookie:gm,body:{characterId:'aelin'}});
 assert.equal(invite.status,200);assert.ok(invite.data.code.length>12);
 const player=await f.call('/api/join',{method:'POST',body:post('Joueuse Aelin','LongPassword-2026',{code:invite.data.code})});
 assert.equal(player.status,200);
 assert.equal((await f.call('/api/join',{method:'POST',body:post('Autre Joueur','LongPassword-2026',{code:invite.data.code})})).status,403);
 const view=(await f.call('/api/state',{cookie:player.cookie})).data;
 assert.equal(view.viewer.role,'player');assert.equal(view.viewer.characterId,'aelin');assert.equal(view.state.gmNotes,undefined);
 assert.equal(view.state.characters.find(p=>p.id==='brunna').abilities.length,0);
 assert.equal(view.state.characters.find(p=>p.id==='brunna').owner,null);
 assert.equal(view.state.characters.find(p=>p.id==='brunna').privateNotes,undefined);
 assert.ok(view.state.characters.find(p=>p.id==='aelin').abilities.length>0);
 const deny=await f.call('/api/action',{method:'POST',cookie:player.cookie,body:{baseVersion:view.version,kind:'hp',id:'brunna',delta:-3}});
 assert.equal(deny.status,403);
 assert.equal((await f.call('/api/action',{method:'POST',cookie:player.cookie,body:{baseVersion:view.version,kind:'gmNotes',value:'Le secret'} })).status,403);
 assert.equal((await f.call('/api/invites',{method:'POST',cookie:player.cookie,body:{characterId:'elyra'}})).status,403);
 assert.equal((await f.call('/api/export',{cookie:player.cookie})).status,403);
 const good=await f.call('/api/action',{method:'POST',cookie:player.cookie,body:{baseVersion:view.version,kind:'hp',id:'aelin',delta:-5}});
 assert.equal(good.status,200);assert.equal(good.data.state.characters.find(p=>p.id==='aelin').hp,19);
 const conflict=await f.call('/api/action',{method:'POST',cookie:gm,body:{baseVersion:view.version,kind:'hp',id:'aelin',delta:1}});
 assert.equal(conflict.status,409);
 const refreshed=(await f.call('/api/state',{cookie:gm})).data;
 assert.equal(refreshed.state.gmNotes,note);
 assert.equal(refreshed.state.characters.find(p=>p.id==='aelin').hp,19);
 assert.equal((await f.call('/api/action',{method:'POST',cookie:gm,body:{baseVersion:refreshed.version,kind:'next'}})).status,400);
});

test('invitation liée à un personnage, enregistrement des combats, persistance, protection origin',async t=>{
 const f=await fixture(t),gm=await setup(f);
 const first=(await f.call('/api/state',{cookie:gm})).data;
 assert.equal((await f.call('/api/action',{method:'POST',cookie:gm,origin:'https://evil.test',body:{baseVersion:first.version,kind:'start'}})).status,403);
 const next=await f.call('/api/action',{method:'POST',cookie:gm,body:{baseVersion:first.version,kind:'start'}});
 assert.equal(next.status,200);assert.equal(next.data.state.combat.started,true);
 const n2=await f.call('/api/action',{method:'POST',cookie:gm,body:{baseVersion:next.data.version,kind:'next'}});
 assert.equal(n2.status,200);assert.equal(n2.data.state.combat.index,1);
 const exportResponse=await f.call('/api/export',{cookie:gm});assert.equal(exportResponse.status,200);assert.equal(exportResponse.data.state.combat.index,1);
 const stored=JSON.parse(fs.readFileSync(path.join(f.dir,'db.json')));assert.equal(stored.campaigns[0].version,n2.data.version);
 assert.equal(stored.campaigns[0].state.combat.index,1);
});

test('événements SSE annoncés lorsque le MJ modifie la campagne',async t=>{
 const f=await fixture(t),gm=await setup(f);
 const cancel=new AbortController();t.after(()=>cancel.abort());
 const stream=await fetch(f.base+'/api/events',{headers:{Cookie:gm},signal:cancel.signal});
 assert.equal(stream.status,200);assert.match(stream.headers.get('content-type'),/text\/event-stream/);
 const reader=stream.body.getReader();const first=await reader.read();assert.match(new TextDecoder().decode(first.value),/"version":1/);
 const current=(await f.call('/api/state',{cookie:gm})).data;
 const update=await f.call('/api/action',{method:'POST',cookie:gm,body:{baseVersion:current.version,kind:'hp',id:'aelin',delta:-1}});
 assert.equal(update.status,200);
 const second=await Promise.race([reader.read(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Aucun événement reçu')),1500))]);
 assert.match(new TextDecoder().decode(second.value),/"version":2/);
 cancel.abort();
});

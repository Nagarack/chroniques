'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {createServer}=require('../server');

async function boot(dataFile){
 const app=createServer({publicOrigin:null,dataFile,setupKey:'very-long-bootstrap-secret'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+app.server.address().port;
 const call=async(route,{method='GET',body,cookie=''}={})=>{const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;const res=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let data=await res.text();try{data=JSON.parse(data);}catch{}return {status:res.status,data,cookie:res.headers.get('set-cookie')?.split(';')[0]||''};};
 return {app,call};
}

test('Sessions : la connexion survit à un redémarrage du serveur et disparaît à la déconnexion',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-sessions-'));const dataFile=path.join(dir,'db.json');
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 let s=await boot(dataFile);
 const setup=await s.call('/api/setup',{method:'POST',body:{name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'}});
 assert.equal(setup.status,200);
 assert.equal((await s.call('/api/state',{cookie:setup.cookie})).status,200);
 await s.app.close();
 const file=dataFile+'.sessions';assert.ok(fs.existsSync(file),'fichier de sessions écrit');
 assert.ok(!fs.readFileSync(file,'utf8').includes(setup.cookie.split('=')[1]),'le jeton brut ne doit jamais être stocké');
 s=await boot(dataFile);
 assert.equal((await s.call('/api/state',{cookie:setup.cookie})).status,200,'session conservée après redémarrage');
 const out=await s.call('/api/logout',{method:'POST',cookie:setup.cookie});assert.equal(out.status,200);
 assert.equal((await s.call('/api/state',{cookie:setup.cookie})).status,401);
 await s.app.close();
 s=await boot(dataFile);
 assert.equal((await s.call('/api/state',{cookie:setup.cookie})).status,401,'une session fermée ne revient pas');
 await s.app.close();
});

test('Sessions : fichier corrompu ou session expirée ignorés sans empêcher le démarrage',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-sessions2-'));const dataFile=path.join(dir,'db.json');
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 fs.writeFileSync(dataFile+'.sessions','{pas du json');
 let s=await boot(dataFile);await s.app.close();
 fs.writeFileSync(dataFile+'.sessions',JSON.stringify([['a'.repeat(64),{uid:'x',campaignId:null,mode:null,expires:Date.now()-1000}]]));
 s=await boot(dataFile);assert.equal((await s.call('/api/status')).status,200);await s.app.close();
});

'use strict';
// Serveur de test avec un MJ et deux joueurs invités (partagé par plusieurs fichiers de tests).
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {createServer}=require('../server');
async function fixture(t){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-44-'));fs.mkdirSync(path.join(tmp,'data'));
 const app=createServer({publicOrigin:null,dataFile:path.join(tmp,'data','chroniques-db.json'),setupKey:'very-long-bootstrap-secret'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(async()=>{await app.close();fs.rmSync(tmp,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+app.server.address().port;
 const call=async(route,{method='GET',body,cookie=''}={})=>{const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;const r=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let d=await r.text();try{d=JSON.parse(d);}catch{}return {status:r.status,data:d};};
 const login=async(route,body)=>{const r=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return r.headers.get('set-cookie').split(';')[0];};
 const gm=await login('/api/setup',{name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'});
 const st=(await call('/api/state',{cookie:gm})).data.state;const [a,b]=st.characters;
 const join=async(pc,name)=>{const inv=await call('/api/invites',{method:'POST',cookie:gm,body:{characterId:pc.id}});return login('/api/join',{name,password:'LongPassword-2026',code:inv.data.code});};
 const pa=await join(a,'Joueuse Une'),pb=await join(b,'Joueur Deux');
 const action=async(kind,payload,cookie=gm)=>{const s=(await call('/api/state',{cookie})).data;return call('/api/action',{method:'POST',cookie,body:{kind,baseVersion:s.version,...payload}});};
 return {call,gm,pa,pb,a,b,action,base,tmp};
}

module.exports={fixture};

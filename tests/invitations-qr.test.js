'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {createServer}=require('../server');
const Q=require('../src/qr');

test('QR code : correction d’erreur et informations de format conformes à la norme',()=>{
 // Exemple de référence « HELLO WORLD » en version 1-M.
 const data=[32,91,11,120,209,114,220,77,67,64,236,17,236,17,236,17];
 assert.deepEqual(Q._test.reedSolomon(data,10),[196,35,39,119,235,215,231,226,93,23]);
 const table=['101010000010010','101000100100101','101111001111100','101101101001011','100010111111001','100000011001110','100111110010111','100101010100000'];
 table.forEach((bits,mask)=>assert.equal(Q._test.formatBits(mask).toString(2).padStart(15,'0'),bits,'masque '+mask));
 assert.equal(Q._test.pickVersion(60),4);assert.equal(Q._test.pickVersion(1),1);
 assert.throws(()=>Q.matrix('x'.repeat(400)),/trop long/);
});

test('QR code : motifs de repérage présents et SVG autonome',()=>{
 const m=Q.matrix('http://127.0.0.1:8080/#invitation=AbCdEfGhIjKlMnOp');const n=m.length;
 assert.equal((n-17)%4,0);
 for(const [x,y] of [[0,0],[n-7,0],[0,n-7]]){for(let i=0;i<7;i++){assert.ok(m[y][x+i]&&m[y+6][x+i]&&m[y+i][x]&&m[y+i][x+6],'bord du motif de repérage');}assert.ok(m[y+3][x+3]);}
 const svg=Q.svg('test',{label:'Invitation <A>'});
 assert.match(svg,/^<svg [^>]*viewBox="0 0 29 29"/);assert.ok(svg.includes('Invitation &lt;A&gt;'));assert.ok(!/https?:\/\//.test(svg.replace('http://www.w3.org/2000/svg','')));
});

test('Invitations : « inviter toute la table » crée un lien par personnage libre, réservé au MJ',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-inv-'));
 const app=createServer({publicOrigin:null,dataFile:path.join(dir,'db.json'),setupKey:'very-long-bootstrap-secret'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));
 t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+app.server.address().port;
 const call=async(route,{method='GET',body,cookie=''}={})=>{const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;const res=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let data=await res.text();try{data=JSON.parse(data);}catch{}return {status:res.status,data,cookie:res.headers.get('set-cookie')?.split(';')[0]||''};};
 const gm=(await call('/api/setup',{method:'POST',body:{name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'}})).cookie;
 let r=await call('/api/invites/all',{method:'POST',cookie:gm,body:{}});assert.equal(r.status,200);
 const n=r.data.invites.length;assert.ok(n>=2);assert.equal(new Set(r.data.invites.map(i=>i.code)).size,n);
 const first=r.data.invites[0];
 const pl=await call('/api/join',{method:'POST',body:{name:'Joueuse Lien',password:'LongPassword-2026',code:first.code}});assert.equal(pl.status,200);
 r=await call('/api/invites/all',{method:'POST',cookie:gm,body:{}});assert.equal(r.data.invites.length,n-1,'le personnage attribué n’est plus proposé');
 const old=await call('/api/join',{method:'POST',body:{name:'Autre Joueur',password:'LongPassword-2026',code:first.code}});assert.notEqual(old.status,200,'un lien utilisé ne resert pas');
 const denied=await call('/api/invites/all',{method:'POST',cookie:pl.cookie,body:{}});assert.equal(denied.status,403);
 const ui=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
 for(const k of ["'/#invitation='",'function readInviteFromUrl()','history.replaceState','data-task="invite-all"','data-invite-share','ChroniquesQR.svg('])assert.ok(ui.includes(k),k);
});

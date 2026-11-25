'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {createServer}=require('../server');
const A=require('../src/art-catalog');

test('Illustrations : toutes les icônes du catalogue existent localement, aucune URL externe',()=>{
 const ids=new Set();for(const k of ['npc','spell','item','character'])for(const e of A.byKind(k))ids.add(e.id);
 assert.ok(ids.size>=100);
 for(const id of ids){const src=A.src(id);assert.match(src,/^\/assets\/icons\/[a-z0-9-]+\.svg$/,id);assert.ok(fs.existsSync(path.join(__dirname,'..',src)),src);}
 assert.ok(!fs.readFileSync(path.join(__dirname,'../server.js'),'utf8').includes('game-icons.net'),'plus de domaine externe dans la politique de sécurité');
});

test('Illustrations : le serveur sert les icônes et refuse les autres chemins',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-icons-'));
 const app=createServer({publicOrigin:null,dataFile:path.join(dir,'db.json'),setupKey:'very-long-bootstrap-secret'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));
 t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+app.server.address().port;
 let r=await fetch(base+'/assets/icons/bear-head.svg');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/image\/svg\+xml/);assert.match(await r.text(),/^<svg /);
 r=await fetch(base+'/assets/icons/..%2Fserver.js');assert.notEqual(r.status,200);
 r=await fetch(base+'/assets/icons/inexistante.svg');assert.notEqual(r.status,200);
});

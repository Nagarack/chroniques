'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createServer}=require('../server');
const root=path.join(__dirname,'..');

test('application Android : sources présentes, interface intégrée = fichiers publics du serveur',()=>{
 for(const f of ['android/AndroidManifest.xml','android/src/app/chroniques/MainActivity.java','android/assets/start/index.html','scripts/dev/build-android.js'])assert.ok(fs.existsSync(path.join(root,f)),f);
 const server=fs.readFileSync(path.join(root,'server.js'),'utf8');const urls=[...server.matchAll(/\['(\/[^']*)',\s*\['([^']+)',\s*'([^']+)'\]\]/g)].map(m=>m[1]);
 for(const u of ['/','/src/online-app.js','/src/state-diff.js','/src/app-chronicle.js','/src/travel.js','/src/factions.js','/src/styles.css'])assert.ok(urls.includes(u),u);
 const java=fs.readFileSync(path.join(root,'android/src/app/chroniques/MainActivity.java'),'utf8');assert.match(java,/addJavascriptInterface\(new Bridge\(\), "ChroniquesAndroid"\)/);
 assert.match(fs.readFileSync(path.join(root,'android/AndroidManifest.xml'),'utf8'),/@VERSION_NAME@/);
 assert.match(fs.readFileSync(path.join(root,'src/pwa-register.js'),'utf8'),/ChroniquesAndroid/,'pas de service worker dans l’application');
});

test('le serveur propose l’APK quand il est présent',async t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-apk-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));fs.mkdirSync(path.join(tmp,'data'));
 const apk=path.join(tmp,'chroniques.apk');
 const app=createServer({publicOrigin:null,dataFile:path.join(tmp,'data','db.json'),setupKey:'very-long-bootstrap-secret',apkFile:apk,pushReminders:false,updateCheck:false});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(()=>app.close());const base='http://127.0.0.1:'+app.server.address().port;
 assert.equal((await (await fetch(base+'/api/status')).json()).android,false);assert.equal((await fetch(base+'/android/chroniques.apk')).status,404);
 fs.writeFileSync(apk,Buffer.from('PK\u0003\u0004apk'));
 assert.equal((await (await fetch(base+'/api/status')).json()).android,true);
 const r=await fetch(base+'/android');assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'application/vnd.android.package-archive');assert.match(r.headers.get('content-disposition'),/Chroniques-.*\.apk/);
});

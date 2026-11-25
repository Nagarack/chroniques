'use strict';
const test=require('node:test');const assert=require('node:assert');
const RT=require('../src/random-tables.js');
test('tables aléatoires : analyse des lignes, plages, trous et chevauchements',()=>{
 const r=RT.parseRows('1-3 : Gobelins\n4 : Marchand\nRien',"d6");
 assert.deepStrictEqual(r.rows.map(x=>[x.min,x.max]),[[1,3],[4,4],[5,5]]);
 assert.ok(r.warnings.some(w=>w.includes('Sans résultat : 6')));
 const d=RT.parseRows('01-50 : A\n50-99 : B\n00 : C','d100');assert.deepStrictEqual(d.rows.map(x=>[x.min,x.max]),[[1,50],[50,99],[100,100]]);assert.ok(d.warnings.some(w=>w.includes('Plusieurs résultats pour : 50')));
 assert.deepStrictEqual(RT.range('2d6'),{min:2,max:12});
 assert.throws(()=>RT.range('d7'),/Dé inconnu/);assert.throws(()=>RT.parseRows('','d6'),/au moins une ligne/);
 const p=RT.parseRows('3 gobelins surgissent\n2-3 loups affamés','d4');assert.strictEqual(p.rows[0].text,'3 gobelins surgissent');assert.strictEqual(p.rows[1].min,2);
});
test('tables aléatoires : le MJ saisit le total de son dé, rien n’est tiré par l’outil',()=>{
 const s={};RT.add(s,'rt-a',{name:'Route',die:'d6',rows:'1-2 : Loups\n3-6 : Rien',visibility:'private'});RT.add(s,'rt-b',{name:'Rumeurs',die:'d4',rows:'A\nB\nC\nD',visibility:'shared'});
 const r=RT.roll(s,'rt-a',2,false);assert.strictEqual(r.row.text,'Loups');
 assert.throws(()=>RT.roll(s,'rt-a',7),/entre 1 et 6/);assert.throws(()=>RT.roll(s,'rt-a',2.5),/Total invalide/);
 RT.roll(s,'rt-b',3,false);RT.roll(s,'rt-b',4,true);
 const pj=RT.projected(s);assert.strictEqual(pj.length,1,'table privée jamais envoyée');assert.deepStrictEqual(pj[0].history.map(h=>h.total),[4],'seuls les tirages annoncés');
 const src=require('fs').readFileSync(require('path').join(__dirname,'../src/random-tables.js'),'utf8');assert.ok(!/Math\.random|crypto\.getRandom|randomInt/.test(src),'aucun tirage aléatoire');
});
test('tables aléatoires : actions serveur, projection joueur et modèle de campagne',async t=>{
 const {createServer}=require('../server.js');const os=require('os'),fs=require('fs'),path=require('path');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rt-'));const app=createServer({publicOrigin:null,dataFile:path.join(dir,'db.json'),setupKey:'very-long-bootstrap-secret'});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));t.after(()=>app.server.close());const base='http://127.0.0.1:'+app.server.address().port;
 let cookie='';const call=async(p,body)=>{const r=await fetch(base+p,{method:body?'POST':'GET',headers:{'content-type':'application/json',origin:base,cookie},body:body?JSON.stringify(body):undefined});const sc=r.headers.get('set-cookie');if(sc)cookie=sc.split(';')[0];return {status:r.status,data:await r.json().catch(()=>null)};};
 assert.strictEqual((await call('/api/setup',{name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'})).status,200);
 const st=async()=>(await call('/api/state')).data;const act=async(kind,extra)=>call('/api/action',{kind,baseVersion:(await st()).version,...extra});
 assert.strictEqual((await act('tableAdd',{values:{name:'Météo',die:'d4',rows:'Soleil\nPluie\nBrume\nOrage',visibility:'private'}})).status,200);
 const tb=(await st()).state.randomTables[0];
 assert.strictEqual((await act('tableRoll',{tableId:tb.id,total:3,shared:false})).status,200);
 const s2=(await st()).state;assert.strictEqual(s2.randomTables[0].history[0].text,'Brume');assert.ok(s2.combat.log.some(l=>l.msg.includes('Brume')&&l.audience==='gm'));
 assert.strictEqual((await act('tableRoll',{tableId:tb.id,total:9})).status,400);
 const CT=require('../src/campaign-template.js');const ex=CT.exportTemplate(s2);assert.strictEqual(ex.tables.length,1);assert.deepStrictEqual(ex.tables[0].history,undefined);
 let n=0;const s3={};const r=CT.importTemplate(s3,ex,{random:k=>'x'.repeat(k-1)+(n++),writeImage:()=>null});assert.strictEqual(r.count['Tables aléatoires'],1);assert.strictEqual(s3.randomTables[0].rows[2].text,'Brume');assert.notStrictEqual(s3.randomTables[0].id,tb.id);
});

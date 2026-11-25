const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const W=require('../src/workspace-layout.js');
const ui=fs.readFileSync(path.join(root,'src/online-app.js'),'utf8');

test('V3.6 : dispositions par défaut et modules complets',()=>{
 const v=W.blank();assert.deepEqual(v.order,['notes','party','combat','session','shortcuts']);
 assert.equal(v.panels.notes.wide,true);assert(v.order.every(id=>v.panels[id].visible));
});
test('V3.6 : la disposition est isolée entre campagnes, comptes et modes',()=>{
 const original=W.key('Compte 1','campagne-A','gm');
 assert.notEqual(original,W.key('Compte 1','campagne-B','gm'));
 assert.notEqual(original,W.key('Compte 2','campagne-A','gm'));
 assert.notEqual(original,W.key('Compte 1','campagne-A','player'));
});
test('V3.6 : préférence corrompue ou manipulée est normalisée',()=>{
 const a=W.normalize({order:['party','party','secret','combat'],panels:{notes:{visible:false,wide:true},party:{visible:false,wide:true},combat:{visible:false},session:{visible:false},shortcuts:{visible:false},secret:{visible:true}}});
 assert.deepEqual(a.order,['party','combat','notes','session','shortcuts']);
 assert.equal(a.panels.notes.visible,true,'au moins un panneau doit rester visible');
 assert(!a.panels.secret);
 assert.equal(W.normalize(null).order[0],'notes');
});
test('V3.6 : déplacer et agrandir sans modifier le modèle source',()=>{
 const original=W.blank();const moved=W.move(original,'notes','down');
 assert.deepEqual(moved.order.slice(0,2),['party','notes']);
 assert.equal(original.order[0],'notes');
 assert.deepEqual(W.move(moved,'notes',0).order,original.order);
 const sized=W.width(moved,'party',true);assert.equal(sized.panels.party.wide,true);assert.equal(original.panels.party.wide,false);
});
test('V3.6 : masquer et réafficher les modules sans perdre les autres réglages',()=>{
 const a=W.show(W.width(W.blank(),'combat',true),'combat',false);
 assert.equal(a.panels.combat.visible,false);assert.equal(a.panels.combat.wide,true);
 const b=W.show(a,'combat',true);assert.equal(b.panels.combat.visible,true);assert.equal(b.panels.combat.wide,true);
});
test('V3.6 : accès au bureau réservé à la projection MJ, rendu sûr et navigation préservée',()=>{
 for(const token of ["if(actor!=='mj')return ''",'data-workspace-step','data-workspace-hide','data-workspace-show','data-workspace-size','data-workspace-reset','workspaceDesk()','data-workspace-drag','deskLoad();','workspace-panel'])assert(ui.includes(token),token);
 assert(ui.includes('esc(x.summary||x.impact'), 'mémoire de campagne échappée');
 assert(ui.includes('deskKey(){return W.key(viewer?.name,viewer?.campaignId,onboardRole())'));
});
test('V3.6 : chargement PWA public, scripts Windows et migration non destructive',()=>{
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 const bat=fs.readFileSync(path.join(root,'MIGRER_DONNEES.bat'));
 assert(index.includes('workspace-layout.js'));assert(sw.includes('/src/workspace-layout.js'));
 assert(sw.includes('chroniques-public-v'));assert(!sw.includes('/api/state'));
 assert(bat.includes(Buffer.from('\r\n')));assert(!bat.includes(Buffer.from('\n\n')));
 const t=bat.toString('utf8');for(const str of ['if exist "data\\chroniques-db.json"','copy /-Y','data\\media','remote-origin.txt'])assert(t.includes(str),str);
 assert(!ui.includes('Math.random('));
});

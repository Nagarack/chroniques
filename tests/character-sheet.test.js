'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const V=require('../src/sheet-view');const L=require('../src/logic');const P=require('../src/progression');
const root=path.join(__dirname,'..');const load=s=>fs.readFileSync(path.join(root,s),'utf8');
const view=(pc,st)=>V.build(pc,L.summary(st,pc.id),P.progression(pc,st.edition),P.slotRows(pc,st.edition));
test('V2.2 : résumé des PV, action, déplacement et concentration issus de la fiche existante',()=>{
 const st=L.initialState(),pc=st.characters[0],m=view(pc,st);
 assert.equal(m.hp,24);assert.equal(m.hpMax,28);assert.equal(m.hpPercent,24/28*100);assert.equal(m.statuses[0].value,'Disponible');assert.equal(m.statuses[3].value,'9 m');assert.equal(m.concentration,'Pas de concentration');assert.equal(m.resources,'Ressources 3/3');
 pc.economy.action=true;pc.economy.reaction=true;pc.economy.movement=4.5;
 const next=view(pc,st);assert.equal(next.statuses[0].value,'Utilisée');assert.equal(next.statuses[2].value,'Utilisée');assert.equal(next.statuses[3].value,'4,5 m');
});
test('V2.2 : action bonus reste conditionnelle, un blocage supprime la disponibilité',()=>{
 const st=L.initialState(),pc=st.characters[0];pc.resources.forEach(r=>r.left=0);
 let m=view(pc,st);assert.equal(m.statuses[1].value,'Conditionnelle');
 pc.conditions=['Étourdi'];m=view(pc,st);assert.equal(m.statuses[0].value,'Impossible');assert.equal(m.statuses[2].value,'Impossible');
});
test('V2.2 : indication de sorts selon le suivi réel ; aucune consommation simulée',()=>{
 const st=L.initialState(),pc=st.characters[2];const before=JSON.stringify(st);
 let m=view(pc,st);assert.match(m.spells,/théoriques \(suivi inactif\)/);
 P.initTracking(pc,st.edition);P.spendSlot(pc,st.edition,'1',1);m=view(pc,st);
 assert.match(m.spells,/Emplacements 8\/9/);
 assert.equal(m.tempHp,0);assert.equal(pc.hp,19);
 assert.notEqual(before,JSON.stringify(st),'Le test a modifié explicitement le suivi, pas la vue');
 const snapshot=JSON.stringify(st);V.build(pc,L.summary(st,pc.id),P.progression(pc,st.edition),P.slotRows(pc,st.edition));assert.equal(JSON.stringify(st),snapshot);
});
test('V2.2 : sections autorisées seulement, sans action de dés ni données serveur',()=>{
 assert.equal(V.section('build'),'build');assert.equal(V.section('actions'),'actions');assert.equal(V.section('__proto__'),'play');
 const app=load('src/online-app.js'),html=load('index.html'),styles=load('src/styles.css'),sw=load('sw.js'),server=load('server.js');
 for(const t of ['sheetSnapshot','data-sheet-section','Fiche en partie','Actions & ressources','Progression & règles','Tous les dés sont lancés physiquement'])assert(app.includes(t),t);
 for(const t of ['sheet-snapshot','sheet-status-grid','@media(max-width:390px)'])assert(styles.includes(t),t);
 assert(html.includes('/src/sheet-view.js'));assert(server.includes("'/src/sheet-view.js'"));assert(sw.includes("'/src/sheet-view.js'"));
 assert(!app.includes('Math.random() * 20'));assert(!sw.includes("'/api/"));
});

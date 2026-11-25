'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const L=require('../src/logic'),P=require('../src/progression'),N=require('../src/creatures'),MJ=require('../src/mj-dashboard');
const base=()=>L.initialState();
test('V2.3 : accès MJ seul et tableau en lecture seule',()=>{
 const state=base(),before=JSON.stringify(state);
 assert.throws(()=>MJ.build(state,'player',L,P),/réservé au MJ/);
 const board=MJ.build(state,'mj',L,P);
 assert.equal(board.members.length,3);assert.equal(board.npcs.length,0);
 assert.equal(board.members[0].name,'Aëlin Sylveronce');assert.equal(board.members[0].hp,24);
 assert.equal(JSON.stringify(state),before);
});
test('V2.3 : alertes PV, conditions et concentration à résoudre avec des dés réels',()=>{
 const state=base(),p=state.characters[0];p.hp=8;p.concentration='Bouclier magique';p.conditions=['Étourdi'];
 p.concentrationChecks=[{id:'ck1',damage:26,dc:13,round:3}];
 const board=MJ.build(state,'mj',L,P),m=board.members[0];
 assert.equal(m.checks[0].dc,13);assert(m.alerts.includes('PV bas'));assert(m.alerts.includes('État incapacitant'));
 assert.equal(board.pendingChecks,1);assert.equal(MJ.visibleMembers(board,'alert').length,1); // Seul Aëlin franchit les seuils d’alerte
 assert.equal(MJ.visibleMembers(board,'turn').length,0);
});
test('V2.3 : détail ressources et emplacements théoriques distincts du suivi actif',()=>{
 const state=base(),pc=state.characters[2];
 let m=MJ.build(state,'mj',L,P).members[2];
 assert.equal(m.spellSlots.tracked,false);assert.equal(m.spellSlots.hasSlots,true);
 assert.equal(m.resources.length,3);
 P.initTracking(pc,state.edition);P.spendSlot(pc,state.edition,'1',1);
 m=MJ.build(state,'mj',L,P).members[2];
 assert.equal(m.spellSlots.tracked,true);assert.equal(m.spellSlots.left,m.spellSlots.max-1);
});
test('V2.3 : monstres secrets uniquement dans le tableau MJ, pas de mutation',()=>{
 const state=base();N.add(state,'mj',{name:'Dragon secret',kind:'monstre',hpMax:89,ac:19,initiative:6,speed:9,visibility:'hidden',notes:'ne pas révéler',actions:'Souffle'});
 const before=JSON.stringify(state),board=MJ.build(state,'mj',L,P);
 assert.equal(board.npcs[0].hidden,true);assert.equal(board.npcs[0].name,'Dragon secret');assert.equal(board.npcs[0].notes,'ne pas révéler');
 assert.equal(JSON.stringify(state),before);
});
test('V2.3 : branchement autorisé, navigation concise et code public PWA sans secrets',()=>{
 const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
 const app=read('src/online-app.js'),server=read('server.js'),html=read('index.html'),sw=read('sw.js'),css=read('src/styles.css');
 assert(app.includes("if(actor!=='mj'||!MD)return combatDetails();"));
 for(const k of ['data-mj-view','data-mj-filter','data-mj-follow','mjDashboardHtml','Tableau MJ','Sauvegarde de concentration'])assert(app.includes(k),k);
 assert(html.includes('/src/mj-dashboard.js'));assert(sw.includes("'/src/mj-dashboard.js'"));assert(sw.includes('chroniques-public-v'));
 assert(server.includes("'/src/mj-dashboard.js'"));assert(!sw.includes("'/api/"));assert(css.includes('@media(max-width:590px)'));
 assert(!fs.existsSync(path.join(root,'data/chroniques-db.json')));
 assert(!MJ.build.toString().includes('Math.random'));
});

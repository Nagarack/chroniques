'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const L=require('../src/logic');
const N=require('../src/creatures');
const E=require('../src/encounters');

function base(){const s={characters:[{id:'pc1',name:'Aria',initiative:12,conditions:[],stats:{hp:20},hp:20}],combat:{started:false,round:1,index:0,order:[],npcs:[],log:[]}};return s;}

test('Créatures groupées : une seule entrée de tour, tous les membres avancent ensemble',()=>{
 const s=base();
 for(let i=1;i<=3;i++)N.add(s,'npc-g'+i,{name:'Gobelin '+i,kind:'monstre',hpMax:7,ac:15,initiative:14,speed:9,visibility:'hidden',group:'g-gob'});
 N.add(s,'npc-o',{name:'Orc',kind:'monstre',hpMax:15,ac:13,initiative:14,speed:9,visibility:'hidden'});
 assert.equal(N.find(s,'npc-g2').group,'g-gob');
 L.sortInitiative(s,'mj');
 const pos=s.combat.order.map(id=>id);const gi=['npc-g1','npc-g2','npc-g3'].map(id=>pos.indexOf(id)).sort((a,b)=>a-b);
 assert.equal(gi[2]-gi[0],2,'les membres du groupe restent adjacents');
 s.combat.started=true;
 s.combat.index=gi[0];
 L.nextTurn(s,'mj');
 assert.ok(!['npc-g1','npc-g2','npc-g3'].includes(L.activeId(s)),'le tour suivant saute tout le groupe');
 assert.equal(N.validate({name:'X',kind:'monstre',hpMax:1,ac:1,initiative:0,speed:0,visibility:'hidden',group:'Pas Valide !'}).group,'','identifiant de groupe nettoyé');
});

test('Actions légendaires : maximum lu dans le texte, dépense, coût multiple, recharge au tour de la créature',()=>{
 const s=base();
 N.add(s,'npc-d',{name:'Dragon',kind:'monstre',hpMax:200,ac:19,initiative:10,speed:12,visibility:'hidden',legendary:'3 actions légendaires par round : Détection ; Attaque de queue ; Attaque d’ailes (coûte 2 actions)'});
 const d=N.find(s,'npc-d');assert.equal(d.legendaryMax,3);assert.equal(d.legendaryLeft,3);
 N.legendary(s,'npc-d','spend',2,'Attaque d’ailes');assert.equal(d.legendaryLeft,1);
 assert.throws(()=>N.legendary(s,'npc-d','spend',2),/Plus assez/);
 assert.match(s.combat.log[0].msg,/Attaque d’ailes \(1\/3 restantes\)/);assert.equal(s.combat.log[0].audience,'gm');
 L.sortInitiative(s,'mj');s.combat.started=true;s.combat.index=s.combat.order.indexOf('pc1');
 L.nextTurn(s,'mj');assert.equal(L.activeId(s),'npc-d');assert.equal(d.legendaryLeft,3,'recharge au début de son tour');
 s.combat.started=false;N.add(s,'npc-x',{name:'Garde',kind:'pnj',hpMax:11,ac:16,initiative:5,speed:9,visibility:'hidden'});
 assert.throws(()=>N.legendary(s,'npc-x','spend'),/pas d’actions légendaires/);
 N.actionLog(s,'npc-x','Lance — +3, 1d6+1 perforant');assert.match(s.combat.log[0].msg,/^Garde · Lance/);
});

test('Rencontre déployée en plusieurs exemplaires : groupe commun',()=>{
 const s=base();
 E.addTemplate(s,'tpl-1',{name:'Squelette',kind:'monstre',hpMax:13,ac:13,initiative:2,speed:9,visibility:'hidden'});
 const e=E.addEncounter(s,'enc-1','Crypte');E.addGroup(s,'enc-1','grp-1','tpl-1',3);
 let k=0;const out=E.deploy(s,e.id,()=> 'npc-s'+(++k));
 const groups=new Set(out.created.map(c=>N.find(s,c.id).group));assert.equal(groups.size,1);assert.ok([...groups][0].startsWith('g-'));
});

test('Interface : boutons d’actions, compteur légendaire, regroupement, écran du MJ',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
 for(const k of ['function npcActionBar(','data-npc-action=','data-npc-legendary=','function gmScreenModal()','data-task="gm-screen"','name="group"'])assert.ok(ui.includes(k),k);
 const server=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');for(const k of ["case 'npcLegendary'","case 'npcActionLog'"])assert.ok(server.includes(k),k);
});

test('Aides d’interface : découpage des actions, coûts légendaires, rappel des dés, regroupement',()=>{
 const U=require('../src/ui-helpers');
 const acts=U.splitActions('Attaques multiples : 1 × morsure, 2 × griffes. Morsure : +14 au corps à corps, allonge 3 m, 2d10+8 perforant plus 2d6 feu. Souffle de feu (recharge 5-6) : sauvegarde de Dextérité DD 21 (moitié en cas de réussite), 18d6 feu.');
 assert.deepEqual(acts.map(a=>a.name),['Attaques multiples','Morsure','Souffle de feu (recharge 5-6)']);
 assert.equal(U.rollHint(acts[1].detail),'Attaque : d20+14 · Dégâts : 2d10+8 perforant + 2d6 feu');
 assert.match(U.rollHint(acts[2].detail),/^Sauvegarde de Dextérité DD 21 · Dégâts : 18d6 feu$/);
 const leg=U.splitLegendary('3 actions légendaires par round : Détection ; Attaque de queue ; Attaque d’ailes (coûte 2 actions) (sauvegarde de Dextérité DD 22, 2d6+8 contondant)');
 assert.deepEqual(leg.map(a=>[a.name,a.cost]),[['Détection',1],['Attaque de queue',1],['Attaque d’ailes',2]]);
 const rows=U.initRows([{id:'a',name:'Aria'},{id:'g1',name:'Gobelin 1',group:'g'},{id:'g2',name:'Gobelin 2',group:'g'},{id:'b',name:'Bran'},{id:'g3',name:'Gobelin 3',group:'g'}]);
 assert.deepEqual(rows.map(r=>r.members.length),[1,2,1,1],'seuls les membres consécutifs sont regroupés');assert.equal(U.groupName(rows[1].members),'Gobelin');
 assert.equal(U.tokenInitials('Aëlin Sylveronce'),'AS');assert.equal(U.tokenInitials('Gobelin 12'),'G12');
});

test('Pouvoirs à recharge : dépensés, rappel au tour de la créature, rechargés par le MJ',()=>{
 const s=base();N.add(s,'npc-d',{name:'Dragon',kind:'monstre',hpMax:200,ac:19,initiative:10,speed:12,visibility:'hidden',actions:'Morsure : +14, 2d10+8 perforant. Souffle de feu (recharge 5-6) : sauvegarde de Dextérité DD 21, 18d6 feu.'});
 N.actionLog(s,'npc-d','Souffle de feu (recharge 5-6) — …','Souffle de feu (recharge 5-6)');assert.deepEqual(N.find(s,'npc-d').spent,['Souffle de feu (recharge 5-6)']);
 assert.throws(()=>N.actionLog(s,'npc-d','x','Souffle de feu (recharge 5-6)'),/pas rechargé/);
 L.sortInitiative(s,'mj');s.combat.started=true;s.combat.index=s.combat.order.indexOf('pc1');L.nextTurn(s,'mj');
 assert.equal(L.activeId(s),'npc-d');assert.ok(s.combat.log.some(l=>l.audience==='gm'&&/lancez 1d6 pour Souffle de feu/.test(l.msg)));
 N.recharge(s,'npc-d','Souffle de feu (recharge 5-6)');assert.deepEqual(N.find(s,'npc-d').spent,[]);
});

test('Actions de repaire : rappel une fois par round au compte 20',()=>{
 const s=base();s.characters[0].initiative=22;s.characters.push({id:'pc2',name:'Bran',initiative:8,conditions:[],stats:{hp:20},hp:20});
 N.add(s,'npc-l',{name:'Liche',kind:'monstre',hpMax:135,ac:17,initiative:15,speed:9,visibility:'hidden',lair:'Les ombres s’animent : sauvegarde de Sagesse DD 18.'});
 L.sortInitiative(s,'mj');L.startCombat(s,'mj');assert.equal(L.activeId(s),'pc1');assert.deepEqual(s.combat.lairPending,[]);
 L.nextTurn(s,'mj');assert.equal(L.activeId(s),'npc-l');assert.deepEqual(s.combat.lairPending,['npc-l'],'déclenché en passant sous 20');
 s.combat.lairPending=[];L.nextTurn(s,'mj');assert.deepEqual(s.combat.lairPending,[],'une seule fois par round');
 L.nextTurn(s,'mj');L.nextTurn(s,'mj');assert.equal(s.combat.round,2);assert.deepEqual(s.combat.lairPending,['npc-l'],'de nouveau au round suivant');
});

test('Créatures lanceuses de sorts : données SRD, emplacements dépensés et restaurés, invisibles des joueurs',async()=>{
 const B=require('../src/bestiary');await B.loadFull();const v=B.creatureValues(B.get('srd-lich'));
 assert.equal(v.spellcasting.dc,20);assert.equal(v.spellcasting.attack,12);assert.deepEqual(v.spellcasting.slots,[4,3,3,3,3,1,1,1,1]);assert.match(v.spellcasting.spells,/Niv\. 3 : .*Boule de feu/);
 assert.ok(B.list().filter(m=>m.spellcasting).length>=30);
 const s=base();N.add(s,'npc-l',v);const n=N.find(s,'npc-l');assert.deepEqual(n.slotsUsed,Array(9).fill(0));
 N.slot(s,'npc-l',9,1);assert.throws(()=>N.slot(s,'npc-l',9,1),/Plus d’emplacement de niveau 9/);N.slot(s,'npc-l',9,-1);assert.equal(n.slotsUsed[8],0);
 N.slot(s,'npc-l',1,1);N.slot(s,'npc-l','reset');assert.deepEqual(n.slotsUsed,Array(9).fill(0));
 assert.throws(()=>N.validate({...v,spellcasting:{...v.spellcasting,slots:[10]}}),/Emplacements niveau 1/);
 assert.equal(N.publicNpc?N.publicNpc(n).spellcasting:undefined,undefined,'jamais dans la vue joueur');
});

'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const CG=require('../src/class-guide');
const P=require('../src/progression');

test('Guide de classe : toutes les classes couvertes, PV et CA de départ, achat de points',()=>{
 for(const id of Object.keys(P.CLASSES)){const c=CG.info(id);assert.ok(c,id);assert.equal(c.saves.length,2);assert.equal(new Set(c.order).size,6);}
 assert.equal(CG.startingHp('wizard',14),8);assert.equal(CG.startingHp('barbarian',8),11);assert.equal(CG.startingAc(15),12);
 assert.deepEqual(CG.standardArray('wizard'),{int:15,con:14,dex:13,wis:12,cha:10,str:8});
 assert.deepEqual(CG.pointBuy({str:15,dex:15,con:15,int:8,wis:8,cha:8}),{total:27,budget:27,valid:true});
 assert.equal(CG.pointBuy({str:16,dex:8,con:8,int:8,wis:8,cha:8}).valid,false);
 assert.equal(CG.averageGain('fighter',12),7);assert.equal(CG.rolledGain('fighter',8,1),1,'minimum 1 PV');assert.equal(CG.rolledGain('fighter',12,11),null,'au-delà du dé refusé');
});

test('Montée de niveau : maîtrise, amélioration, attaque supplémentaire, sous-classe, emplacements',()=>{
 const pc=(job,level,extra={})=>({job,level,stats:{hp:30,abilities:{con:14}},...extra});
 const f4=CG.levelUpPreview(pc('Guerrier',4),'2024').changes.join('\n');assert.match(f4,/maîtrise : \+2 → \+3/);assert.match(f4,/Attaque supplémentaire/);
 const f5=CG.levelUpPreview(pc('Guerrier',5),'2024').changes.join('\n');assert.match(f5,/Amélioration de caractéristiques ou don au niveau 6/);
 const w2=CG.levelUpPreview(pc('Magicien',2),'2024').changes.join('\n');assert.match(w2,/sous-classe/);assert.match(w2,/Emplacements de sorts : niv\. 1 × 3 → niv\. 1 × 4, niv\. 2 × 2/);
 assert.match(CG.levelUpPreview(pc('Clerc',18),'2024').changes.join('\n'),/Don épique/);
 assert.equal(CG.levelUpPreview(pc('Magicien',2),'2024').average,6);
});

test('Interface : assistant en trois étapes et fenêtre de montée de niveau',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
 for(const k of ['class="wizard"','data-wizard-standard','function wizardRefresh(','function levelUpModal(','id="levelup-form"','hpGain:gain'])assert.ok(ui.includes(k),k);
 const server=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');assert.ok(server.includes("intValue(b.hpGain,'PV gagnés',1,40)"));
});

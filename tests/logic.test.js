const test=require('node:test');
const assert=require('node:assert/strict');
const L=require('../src/logic.js');
const S=()=>L.initialState();

test('édition par défaut 2024, autres modes disponibles',()=>{
 const s=S();assert.equal(s.edition,'2024');
 assert(L.actionSet('2024').includes('Magie'));
 assert(L.actionSet('2014').includes('Lancer un sort'));
 assert.deepEqual(L.actionSet('custom',['Prier']),['Prier']);
});
test('MJ voit tous, joueurs ne modifient pas les autres',()=>{
 const s=S();assert(L.canEdit(s,'mj','elyra'));
 assert(L.canEdit(s,'aelin','aelin'));
 assert(!L.canViewDetail(s,'aelin','elyra'));
 assert.throws(()=>L.changeHp(s,'aelin','elyra',-3),/Accès refusé/);
 assert.throws(()=>L.setPrivateNotes(s,'aelin','tricher'),/MJ/);
});
test('les points de vie temporaires absorbent d’abord les dégâts',()=>{
 const s=S();L.setTempHp(s,'mj','aelin',6);L.changeHp(s,'mj','aelin',-8);
 assert.equal(L.findPc(s,'aelin').tempHp,0);assert.equal(L.findPc(s,'aelin').hp,22);
 L.changeHp(s,'mj','aelin',99);assert.equal(L.findPc(s,'aelin').hp,28);
});
test('action bonus exige une capacité non épuisée',()=>{
 const s=S(),p=L.findPc(s,'aelin');
 assert.equal(L.summary(s,p.id).bonus,true);
 L.useAbility(s,'aelin',p.id,'mark');
 assert.equal(L.summary(s,p.id).bonus,false);
 assert.equal(p.resources[0].left,2);
 assert.equal(p.concentration,'Marque du chasseur');
 assert.throws(()=>L.useAbility(s,'aelin',p.id,'mark'),/Action bonus utilisée/);
});
test('les réactions se régénèrent au début du prochain tour du personnage',()=>{
 const s=S();L.setInitiative(s,'mj','brunna',22);
 L.setInitiative(s,'mj','aelin',9);L.setInitiative(s,'mj','elyra',1);
 L.startCombat(s,'mj');assert.equal(L.activeId(s),'brunna');
 L.spendType(s,'mj','brunna','reaction');
 L.nextTurn(s,'mj');assert.equal(L.activeId(s),'aelin');
 assert.equal(L.findPc(s,'brunna').economy.reaction,true);
 L.nextTurn(s,'mj');L.nextTurn(s,'mj');
 assert.equal(s.combat.round,2);assert.equal(L.activeId(s),'brunna');
 assert.equal(L.findPc(s,'brunna').economy.reaction,false);
});
test('conditions bloquent les actions et la concentration',()=>{
 const s=S();L.toggleConcentration(s,'mj','aelin','Sort maintenu');
 L.toggleCondition(s,'mj','aelin','Paralysé');
 const p=L.findPc(s,'aelin');assert.equal(p.concentration,'');
 assert.equal(L.summary(s,'aelin').action,false);
 assert.equal(L.summary(s,'aelin').movement,0);
 assert.throws(()=>L.useAbility(s,'mj','aelin','arrows'),/Incapable/);
});
test('déplacement consommé et plafonné',()=>{
 const s=S();L.updateMovement(s,'aelin','aelin',7.5);
 assert.equal(L.summary(s,'aelin').movement,1.5);
 assert.throws(()=>L.updateMovement(s,'aelin','aelin',3),/insuffisant/);
});
test('repos court ne soigne pas automatiquement et recharge les capacités compatibles',()=>{
 const s=S(),p=L.findPc(s,'brunna');
 p.resources[0].left=0;p.resources[1].left=0;p.hp=21;
 L.rest(s,'brunna','brunna','short');assert.equal(p.hp,21);
 assert.equal(p.resources[0].left,1);assert.equal(p.resources[1].left,2);
});
test('repos long restaure les PV et les ressources; condition zéro PV est refusée',()=>{
 const s=S(),p=L.findPc(s,'aelin');p.resources[0].left=0;
 L.rest(s,'mj','aelin','long');assert.equal(p.hp,28);assert.equal(p.resources[0].left,3);
 L.changeHp(s,'mj','aelin',-999);
 assert.equal(p.hp,0);assert.throws(()=>L.rest(s,'mj','aelin','long'),/0 PV/);
});
test('insertion de personnage autorisée au MJ uniquement',()=>{
 const s=S();assert.throws(()=>L.addPc(s,'aelin',{name:'Non'}),/MJ/);
 const p=L.addPc(s,'mj',{name:'Nouveau',level:2,hp:14,ac:15});
 assert.equal(p.name,'Nouveau');assert(L.canEdit(s,p.id,p.id));
});
test('les sauvegardes de mort ne peuvent être faites qu’à 0 PV',()=>{
 const s=S();assert.throws(()=>L.deathSave(s,'mj','aelin','failure'),/encore des PV/);
 L.changeHp(s,'mj','aelin',-999);L.deathSave(s,'mj','aelin','failure');
 assert.equal(L.findPc(s,'aelin').deathSaves.failure,1);
 L.changeHp(s,'mj','aelin',3);assert.equal(L.findPc(s,'aelin').deathSaves.failure,0);
});
test('validation refus des fichiers incompatibles',()=>{
 const s=S();assert(L.validImport(s));assert.throws(()=>L.validImport({schemaVersion:3,characters:[]}),/invalide/);
});

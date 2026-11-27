/* Chroniques V2.3 — Résumé privé MJ calculé à partir de l'état autorisé du serveur. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesMjBoard=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DANGER=['Étourdi','Paralysé','Inconscient','Pétrifié','Incapable d’agir'];
 function build(state,role,logic,progression){
  if(role!=='mj')throw new Error('Tableau de bord réservé au MJ.');
  const turnId=state.combat.started?logic.activeId(state):null;
  const members=(state.characters||[]).map(p=>{
   const sum=logic.summary(state,p.id);
   const resources=(p.resources||[]).map(r=>({name:r.name,left:r.left,max:r.max,empty:r.max>0&&r.left<=0}));
   const slots=progression.slotRows(p,state.edition);
   const knownSlots=slots.filter(s=>s.left!==null);
   const leftSlots=knownSlots.reduce((total,s)=>total+s.left,0),maxSlots=knownSlots.reduce((total,s)=>total+s.max,0);
   const checks=(p.concentrationChecks||[]).map(c=>({id:c.id,dc:c.dc,damage:c.damage}));
   const alerts=[];
   if(p.hp<=0)alerts.push('0 PV');else if(p.hp*2<=p.stats.hp)alerts.push('PV bas');
   if(checks.length)alerts.push(checks.length>1?`${checks.length} sauvegardes de concentration à résoudre`:'Une sauvegarde de concentration à résoudre');
   if((p.conditions||[]).some(c=>DANGER.includes(c)))alerts.push('État incapacitant');
   return {id:p.id,name:p.name,job:p.job,level:p.level,initiative:p.initiative,hp:p.hp,hpMax:p.stats.hp,tempHp:p.tempHp||0,ac:p.stats.ac,
    turn:turnId===p.id,conditions:p.conditions||[],concentration:p.concentration||'',checks,resources,spellSlots:{tracked:knownSlots.length>0,left:leftSlots,max:maxSlots,hasSlots:slots.length>0},
    action:sum.action,bonus:sum.bonus,reaction:sum.reaction,movement:sum.movement,alerts,needsAttention:alerts.length>0};
  });
  const npcs=(state.combat.npcs||[]).map(n=>({id:n.id,name:n.name,kind:n.kind||'monstre',hp:n.hp,hpMax:n.hpMax,ac:n.ac,initiative:n.initiative,
   turn:turnId===n.id,hidden:n.visibility!=='public',conditions:n.conditions||[],notes:n.notes||'',actions:n.actions||''}));
  return {round:state.combat.started?state.combat.round:null,started:!!state.combat.started,turnId,privateTurn:!!state.combat.privateTurn,
   members,npcs,alerts:members.filter(m=>m.needsAttention).length,pendingChecks:members.reduce((sum,m)=>sum+m.checks.length,0)};
 }
 function visibleMembers(d,filter){if(filter==='alert')return d.members.filter(m=>m.needsAttention);if(filter==='turn')return d.members.filter(m=>m.turn);return d.members;}
 return {build,visibleMembers};
});

/* Chroniques V0.9 — repères de progression 5e (2014 / 2024), sans dépendance. */
(function(root, factory){const value=factory();if(typeof module==='object'&&module.exports)module.exports=value;if(root)root.ChroniquesProgression=value;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const CLASSES={
 barbarian:{name:'Barbare',caster:'none'},bard:{name:'Barde',caster:'full'},cleric:{name:'Clerc',caster:'full'},druid:{name:'Druide',caster:'full'},
 fighter:{name:'Guerrier',caster:'none'},monk:{name:'Moine',caster:'none'},paladin:{name:'Paladin',caster:'half'},ranger:{name:'Rôdeur',caster:'half'},
 rogue:{name:'Roublard',caster:'none'},sorcerer:{name:'Ensorceleur',caster:'full'},warlock:{name:'Occultiste',caster:'pact'},wizard:{name:'Magicien',caster:'full'}
};
const SKILLS={acrobaties:['Acrobaties','dex'],arcanes:['Arcanes','int'],athletisme:['Athlétisme','str'],discretion:['Discrétion','dex'],dressage:['Dressage','wis'],escamotage:['Escamotage','dex'],histoire:['Histoire','int'],intimidation:['Intimidation','cha'],intuition:['Intuition','wis'],investigation:['Investigation','int'],medecine:['Médecine','wis'],nature:['Nature','int'],perception:['Perception','wis'],persuasion:['Persuasion','cha'],religion:['Religion','int'],representation:['Représentation','cha'],survie:['Survie','wis'],tromperie:['Tromperie','cha']};
const FULL=[[],[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]];
const HALF=[[],[],[2],[3],[3],[4,2],[4,2],[4,3],[4,3],[4,3,2],[4,3,2],[4,3,3],[4,3,3],[4,3,3,1],[4,3,3,1],[4,3,3,2],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2]];
const THIRD=[[],[],[],[2],[3],[3],[3],[4,2],[4,2],[4,2],[4,3],[4,3],[4,3],[4,3,2],[4,3,2],[4,3,2],[4,3,3],[4,3,3],[4,3,3],[4,3,3,1],[4,3,3,1]];
const SUBCLASS_2014={cleric:1,sorcerer:1,warlock:1,druid:2,wizard:2};
function normalize(str){return String(str||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function detectClass(job){const map={barbare:'barbarian',barde:'bard',clerc:'cleric',druide:'druid',guerrier:'fighter',guerriere:'fighter',moine:'monk',paladin:'paladin',rodeur:'ranger',rodeuse:'ranger',roublard:'rogue',ensorceleur:'sorcerer',ensorceleuse:'sorcerer',occultiste:'warlock',magicien:'wizard',magicienne:'wizard',barbarian:'barbarian',bard:'bard',cleric:'cleric',druid:'druid',fighter:'fighter',monk:'monk',ranger:'ranger',rogue:'rogue',sorcerer:'sorcerer',warlock:'warlock',wizard:'wizard'};return map[normalize(job)]||null;}
function validEdition(edition){return edition==='2014'||edition==='2024';}
function slotsFor(classId,level,edition,subclass=''){
 if(!CLASSES[classId]||!validEdition(edition)||!Number.isInteger(level)||level<1||level>20)return {kind:'manual',slots:[],slotLevel:0};
 let type=CLASSES[classId].caster;
 if(type==='none'&&((classId==='fighter'&&normalize(subclass)==='chevalier occulte')||(classId==='rogue'&&normalize(subclass)==='filou arcanique')))type='third';
 if(type==='pact'){const slotLevel=Math.min(5,Math.ceil(level/2));const number=level===1?1:level>=17?4:level>=11?3:2;return {kind:'pact',slots:[number],slotLevel};}
 if(type==='none')return {kind:'none',slots:[],slotLevel:0};
 if(type==='full')return {kind:'standard',slots:FULL[level].slice(),slotLevel:0};
 if(type==='third')return {kind:'standard',slots:THIRD[level].slice(),slotLevel:0};
 // Ranger/Paladin : les emplacements arrivent au niveau 1 en 2024 ; au niveau 2 en 2014.
 if(type==='half')return {kind:'standard',slots:(edition==='2024'&&level===1?[2]:HALF[level]).slice(),slotLevel:0};
 return {kind:'manual',slots:[],slotLevel:0};
}
function subclassLevel(classId,edition){return !CLASSES[classId]||!validEdition(edition)?null:edition==='2024'?3:(SUBCLASS_2014[classId]||3);}
function progression(pc,edition){const classId=pc.progression?.classId||detectClass(pc.job);const sub=pc.progression?.subclass||'';const threshold=subclassLevel(classId,edition);
 const spells=slotsFor(classId,pc.level,edition,sub);return {classId,className:CLASSES[classId]?.name||null,subclass:sub,subclassLevel:threshold,subclassEligible:threshold!==null&&pc.level>=threshold,subclassSelectionDue:threshold!==null&&pc.level>=threshold&&!sub,spells,tracked:pc.progression?.spentSlots!==undefined&&pc.progression?.spentSlots!==null,skills:pc.progression?.skills||{},nextLevel:pc.level<20?pc.level+1:null};}
function slotRows(pc,edition){const p=progression(pc,edition),sp=p.spells;if(!p.tracked)return sp.slots.map((max,i)=>({level:sp.kind==='pact'?sp.slotLevel:i+1,max,left:null,used:0,key:sp.kind==='pact'?'pact':String(i+1)}));
 return sp.slots.map((max,i)=>{const key=sp.kind==='pact'?'pact':String(i+1);const used=Math.min(max,Math.max(0,Number(pc.progression.spentSlots[key])||0));return {level:sp.kind==='pact'?sp.slotLevel:i+1,max,used,left:max-used,key};});}
function initTracking(pc,edition){const p=progression(pc,edition);if(!['standard','pact'].includes(p.spells.kind)||!p.spells.slots.length)throw new Error('Aucun emplacement à suivre pour cette classe, cette édition et ce niveau.');
 pc.progression??={};if(pc.progression.spentSlots!==undefined&&pc.progression.spentSlots!==null)throw new Error('Suivi des emplacements déjà activé.');pc.progression.spentSlots={};}
function spendSlot(pc,edition,key,delta){if(!pc.progression||pc.progression.spentSlots==null)throw new Error('Activez d’abord le suivi des emplacements.');if(!Number.isInteger(delta)||![-1,1].includes(delta))throw new Error('Quantité invalide.');
 const slot=slotRows(pc,edition).find(x=>x.key===String(key));if(!slot)throw new Error('Emplacement inconnu.');const used=(pc.progression.spentSlots[key]||0)+delta;if(used<0||used>slot.max)throw new Error('Emplacement déjà épuisé ou entièrement restauré.');pc.progression.spentSlots[key]=used;}
function recoverSlots(pc,edition,rest){if(!pc.progression||pc.progression.spentSlots==null)return;const spell=progression(pc,edition).spells;
 if(rest==='long'||rest==='short'&&spell.kind==='pact')pc.progression.spentSlots={};}
function skillValue(pc,skillId){const entry=SKILLS[skillId];if(!entry)return null;const scores=pc.stats?.abilities||{};const score=scores[entry[1]];const mod=Number.isInteger(score)&&score>=1&&score<=30?Math.floor((score-10)/2):null;const pb=Number.isInteger(pc.level)&&pc.level>=1&&pc.level<=20?2+Math.floor((pc.level-1)/4):null;
 if(mod===null||pb===null)return null;const level=pc.progression?.skills?.[skillId]||'none';const effective=level==='expert'||level==='trained'?level:pc.origin?.grantedSkills?.includes(skillId)?'trained':'none';return mod+(effective==='expert'?2*pb:effective==='trained'?pb:0);}
return {CLASSES,SKILLS,detectClass,slotsFor,subclassLevel,progression,slotRows,initTracking,spendSlot,recoverSlots,skillValue};
});

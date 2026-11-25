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
// ---------- 5.3 : multiclassage (règles du SRD 5.1 ; mêmes principes en 2024, arrondis au supérieur) ----------
const HIT_DIE={barbarian:12,fighter:10,paladin:10,ranger:10,sorcerer:6,wizard:6,bard:8,cleric:8,druid:8,monk:8,rogue:8,warlock:8};
// Prérequis : chaque groupe doit être satisfait ; dans un groupe, une seule caractéristique suffit.
const PREREQ={barbarian:[['str']],bard:[['cha']],cleric:[['wis']],druid:[['wis']],fighter:[['str','dex']],monk:[['dex'],['wis']],paladin:[['str'],['cha']],ranger:[['dex'],['wis']],rogue:[['dex']],sorcerer:[['cha']],warlock:[['cha']],wizard:[['int']]};
const AB_NAMES={str:'Force',dex:'Dextérité',con:'Constitution',int:'Intelligence',wis:'Sagesse',cha:'Charisme'};
// Maîtrises acquises en prenant la classe en multiclassage (table du SRD 5.1, règles 2014).
const MC_PROFS={barbarian:'Boucliers, armes courantes, armes de guerre',bard:'Armures légères, une compétence au choix, un instrument de musique au choix',cleric:'Armures légères, armures intermédiaires, boucliers',druid:'Armures légères, armures intermédiaires, boucliers (ni armure ni bouclier en métal)',fighter:'Armures légères, armures intermédiaires, boucliers, armes courantes, armes de guerre',monk:'Armes courantes, épée courte',paladin:'Armures légères, armures intermédiaires, boucliers, armes courantes, armes de guerre',ranger:'Armures légères, armures intermédiaires, boucliers, armes courantes, armes de guerre, une compétence de la liste de classe',rogue:'Armures légères, une compétence de la liste de classe, outils de voleur',sorcerer:'Aucune',warlock:'Armures légères, armes courantes',wizard:'Aucune'};
const MAX_EXTRA_CLASSES=3;
function primaryClass(pc){return pc&&pc.progression&&pc.progression.classId||detectClass(pc&&pc.job);}
function extraClasses(pc){const list=pc&&pc.progression&&Array.isArray(pc.progression.multiclass)?pc.progression.multiclass:[];return list.filter(x=>x&&CLASSES[x.classId]&&Number.isInteger(x.level)&&x.level>=1);}
// Liste des classes du personnage, classe de départ en premier.
function classesOf(pc){const extra=extraClasses(pc);const total=Number.isInteger(pc&&pc.level)?pc.level:1;const used=extra.reduce((t,x)=>t+x.level,0);
 return [{classId:primaryClass(pc),level:Math.max(1,total-used),subclass:(pc&&pc.progression&&pc.progression.subclass)||'',primary:true},...extra.map(x=>({classId:x.classId,level:x.level,subclass:x.subclass||'',primary:false}))];}
function isMulticlass(pc){return extraClasses(pc).length>0;}
function classLabel(pc){return classesOf(pc).map(c=>(CLASSES[c.classId]?CLASSES[c.classId].name:(pc.job||'Classe'))+' '+c.level).join(' / ');}
function casterType(classId,subclass){let type=CLASSES[classId]?CLASSES[classId].caster:'none';if(type==='none'&&((classId==='fighter'&&normalize(subclass)==='chevalier occulte')||(classId==='rogue'&&normalize(subclass)==='filou arcanique')))type='third';return type;}
// Emplacements d’un personnage multiclassé : niveau de lanceur combiné si au moins deux classes ont l’aptitude Sorts,
// sinon la table de la seule classe concernée ; la magie de pacte reste à part.
function spellsFor(pc,edition){const list=classesOf(pc);if(list.length<2)return slotsFor(list[0].classId,pc.level,edition,list[0].subclass);
 if(!validEdition(edition)||!list.every(c=>CLASSES[c.classId]))return {kind:'manual',slots:[],slotLevel:0};
 const std=list.filter(c=>['full','half','third'].includes(casterType(c.classId,c.subclass)));const pactCls=list.find(c=>c.classId==='warlock');
 let base={kind:'none',slots:[],slotLevel:0};
 if(std.length===1)base=slotsFor(std[0].classId,std[0].level,edition,std[0].subclass);
 else if(std.length>1){const up=edition==='2024';let lvl=0;for(const c of std){const t=casterType(c.classId,c.subclass);lvl+=t==='full'?c.level:t==='half'?(up?Math.ceil(c.level/2):Math.floor(c.level/2)):(up?Math.ceil(c.level/3):Math.floor(c.level/3));}
  lvl=Math.min(20,lvl);if(lvl>=1)base={kind:'standard',slots:FULL[lvl].slice(),slotLevel:0,casterLevel:lvl};}
 if(!pactCls)return base;const pact=slotsFor('warlock',pactCls.level,edition);
 if(base.kind!=='standard'||!base.slots.length)return pact;
 return {kind:'mixed',slots:base.slots,slotLevel:0,casterLevel:base.casterLevel,pact:{slots:pact.slots,slotLevel:pact.slotLevel}};}
function hitDice(pc){const m=new Map();for(const c of classesOf(pc)){const d=HIT_DIE[c.classId];if(!d)continue;m.set(d,(m.get(d)||0)+c.level);}return [...m].sort((a,b)=>b[0]-a[0]).map(([die,count])=>({die,count}));}
function prereqCheck(pc,classId){const groups=PREREQ[classId];if(!groups)return {ok:false,known:false,text:'',missing:[]};const ab=(pc&&pc.stats&&pc.stats.abilities)||{};
 const known=groups.every(g=>g.some(k=>Number.isInteger(ab[k])));const missing=groups.filter(g=>!g.some(k=>Number(ab[k])>=13)).map(g=>g.map(k=>AB_NAMES[k]+' 13').join(' ou '));
 return {ok:missing.length===0,known,missing,text:groups.map(g=>g.map(k=>AB_NAMES[k]+' 13').join(' ou ')).join(' et ')};}
// Prérequis de la classe de départ et de la nouvelle classe.
function canMulticlass(pc,classId){const out=[],items=[];for(const id of [...new Set([primaryClass(pc),...extraClasses(pc).map(x=>x.classId),classId])].filter(Boolean)){const r=prereqCheck(pc,id);if(!r.ok){const name=CLASSES[id]?CLASSES[id].name:id,need=r.missing.join(' et ');out.push(name+' : '+need);items.push({classId:id,name,need});}}return {ok:out.length===0,missing:out,items};}
function multiclass(pc,op,v){v=v||{};const id=String(v.classId||'');if(!CLASSES[id])throw new Error('Classe inconnue.');pc.progression??={};const list=pc.progression.multiclass=extraClasses(pc).map(x=>({...x}));
 const primary=primaryClass(pc);const used=()=>list.reduce((t,x)=>t+x.level,0);const i=list.findIndex(x=>x.classId===id);
 if(op==='add'){if(id===primary)throw new Error('C’est déjà la classe de départ.');if(i>=0)throw new Error('Classe déjà présente.');if(list.length>=MAX_EXTRA_CLASSES)throw new Error('Trois classes supplémentaires au maximum.');
  const lvl=Number.isInteger(v.level)?v.level:1;if(lvl<1||pc.level-used()-lvl<1)throw new Error('Pas assez de niveaux : la classe de départ garde au moins un niveau.');list.push({classId:id,level:lvl,subclass:''});}
 else if(op==='level'){if(i<0)throw new Error('Classe absente.');const lvl=Number(v.level);if(!Number.isInteger(lvl)||lvl<1||lvl>19)throw new Error('Niveau de classe invalide.');if(pc.level-(used()-list[i].level)-lvl<1)throw new Error('La classe de départ doit garder au moins un niveau.');list[i].level=lvl;}
 else if(op==='subclass'){if(i<0)throw new Error('Classe absente.');const sub=String(v.subclass||'').replace(/[\u0000-\u001f]/g,' ').trim();if(sub.length>60)throw new Error('Sous-classe : 60 caractères maximum.');list[i].subclass=sub;}
 else if(op==='remove'){if(i<0)throw new Error('Classe absente.');list.splice(i,1);}
 else throw new Error('Opération inconnue.');
 if(!list.length)delete pc.progression.multiclass;return pc;}
function progression(pc,edition){const classId=primaryClass(pc);const sub=pc.progression?.subclass||'';const classes=classesOf(pc);const primaryLevel=classes[0].level;const threshold=subclassLevel(classId,edition);
 const spells=spellsFor(pc,edition);const extraDue=classes.slice(1).filter(c=>{const t=subclassLevel(c.classId,edition);return t!==null&&c.level>=t&&!c.subclass;}).map(c=>c.classId);
 return {classId,className:CLASSES[classId]?.name||null,subclass:sub,subclassLevel:threshold,subclassEligible:threshold!==null&&primaryLevel>=threshold,subclassSelectionDue:threshold!==null&&primaryLevel>=threshold&&!sub,spells,tracked:pc.progression?.spentSlots!==undefined&&pc.progression?.spentSlots!==null,skills:pc.progression?.skills||{},nextLevel:pc.level<20?pc.level+1:null,
  classes,multiclass:classes.length>1,extraSubclassDue:extraDue};}
function slotRows(pc,edition){const p=progression(pc,edition),sp=p.spells;
 const raw=sp.kind==='mixed'?[...sp.slots.map((max,i)=>({level:i+1,max,key:String(i+1)})),{level:sp.pact.slotLevel,max:sp.pact.slots[0],key:'pact',pact:true}]:sp.slots.map((max,i)=>({level:sp.kind==='pact'?sp.slotLevel:i+1,max,key:sp.kind==='pact'?'pact':String(i+1),pact:sp.kind==='pact'}));
 if(!p.tracked)return raw.map(r=>({...r,left:null,used:0}));
 return raw.map(r=>{const used=Math.min(r.max,Math.max(0,Number(pc.progression.spentSlots[r.key])||0));return {...r,used,left:r.max-used};});}
function initTracking(pc,edition){const p=progression(pc,edition);if(!['standard','pact','mixed'].includes(p.spells.kind)||!p.spells.slots.length)throw new Error('Aucun emplacement à suivre pour cette classe, cette édition et ce niveau.');
 pc.progression??={};if(pc.progression.spentSlots!==undefined&&pc.progression.spentSlots!==null)throw new Error('Suivi des emplacements déjà activé.');pc.progression.spentSlots={};}
function spendSlot(pc,edition,key,delta){if(!pc.progression||pc.progression.spentSlots==null)throw new Error('Activez d’abord le suivi des emplacements.');if(!Number.isInteger(delta)||![-1,1].includes(delta))throw new Error('Quantité invalide.');
 const slot=slotRows(pc,edition).find(x=>x.key===String(key));if(!slot)throw new Error('Emplacement inconnu.');const used=(pc.progression.spentSlots[key]||0)+delta;if(used<0||used>slot.max)throw new Error('Emplacement déjà épuisé ou entièrement restauré.');pc.progression.spentSlots[key]=used;}
// Repos long : tout revient. Repos court : seulement la magie de pacte.
function recoverSlots(pc,edition,rest){if(!pc.progression||pc.progression.spentSlots==null)return;const spell=progression(pc,edition).spells;
 if(rest==='long'||rest==='short'&&spell.kind==='pact')pc.progression.spentSlots={};else if(rest==='short'&&spell.kind==='mixed')delete pc.progression.spentSlots.pact;}
function skillValue(pc,skillId){const entry=SKILLS[skillId];if(!entry)return null;const scores=pc.stats?.abilities||{};const score=scores[entry[1]];const mod=Number.isInteger(score)&&score>=1&&score<=30?Math.floor((score-10)/2):null;const pb=Number.isInteger(pc.level)&&pc.level>=1&&pc.level<=20?2+Math.floor((pc.level-1)/4):null;
 if(mod===null||pb===null)return null;const level=pc.progression?.skills?.[skillId]||'none';const effective=level==='expert'||level==='trained'?level:pc.origin?.grantedSkills?.includes(skillId)?'trained':'none';return mod+(effective==='expert'?2*pb:effective==='trained'?pb:0);}
return {CLASSES,SKILLS,HIT_DIE,PREREQ,MC_PROFS,MAX_EXTRA_CLASSES,detectClass,slotsFor,subclassLevel,progression,slotRows,initTracking,spendSlot,recoverSlots,skillValue,classesOf,isMulticlass,classLabel,spellsFor,hitDice,prereqCheck,canMulticlass,multiclass,primaryClass};
});

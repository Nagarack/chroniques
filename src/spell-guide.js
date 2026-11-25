/* Chroniques V1.3 : repères pour dés PHYSIQUES uniquement. Aucun générateur aléatoire. */
(function(root,factory){const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;if(root)root.ChroniquesSpellGuide=m;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const BY_CLASS={bard:'cha',cleric:'wis',druid:'wis',paladin:'cha',ranger:'wis',sorcerer:'cha',warlock:'cha',wizard:'int'};
const LABELS={int:'Intelligence',wis:'Sagesse',cha:'Charisme'};
function ability(pc,progression){const p=progression.progression(pc,pc.origin?.edition||'2024');const id=p.classId;
 if(Object.hasOwn(BY_CLASS,id))return BY_CLASS[id];
 if(id==='fighter'&&p.subclass.toLocaleLowerCase('fr').includes('chevalier occulte'))return 'int';
 if(id==='rogue'&&p.subclass.toLocaleLowerCase('fr').includes('filou arcanique'))return 'int';
 return null;
}
// 5.4 : multiclassage — caractéristique, attaque et DD pour chaque classe qui lance des sorts.
function abilityFor(classId,subclass){if(Object.hasOwn(BY_CLASS,classId))return BY_CLASS[classId];const sub=String(subclass||'').toLocaleLowerCase('fr');
 if(classId==='fighter'&&sub.includes('chevalier occulte'))return 'int';if(classId==='rogue'&&sub.includes('filou arcanique'))return 'int';return null;}
function byClass(pc,progression){if(!progression.classesOf)return [];const pb=Number.isInteger(pc.level)&&pc.level>=1&&pc.level<=20?2+Math.floor((pc.level-1)/4):null;
 return progression.classesOf(pc).map(c=>{const attr=abilityFor(c.classId,c.subclass);if(!attr)return null;const raw=pc.stats?.abilities?.[attr];const modifier=Number.isInteger(raw)&&raw>=1&&raw<=30?Math.floor((raw-10)/2):null;
  return {classId:c.classId,className:progression.CLASSES[c.classId]?.name||c.classId,level:c.level,ability:attr,abilityLabel:LABELS[attr],modifier,proficiency:pb,attack:modifier===null||pb===null?null:modifier+pb,saveDC:modifier===null||pb===null?null:8+modifier+pb};}).filter(Boolean);}
function stats(pc,progression){const attr=ability(pc,progression);const pb=Number.isInteger(pc.level)&&pc.level>=1&&pc.level<=20?2+Math.floor((pc.level-1)/4):null;
 const raw=pc.stats?.abilities?.[attr];const modifier=Number.isInteger(raw)&&raw>=1&&raw<=30?Math.floor((raw-10)/2):null;
 return {ability:attr,abilityLabel:LABELS[attr]||null,modifier,proficiency:pb,attack:modifier===null||pb===null?null:modifier+pb,saveDC:modifier===null||pb===null?null:8+modifier+pb};
}
const tier=l=>l>=17?4:l>=11?3:l>=5?2:1;
function hint(spell,edition,pc,slotLevel=null){if(!spell)return {text:'Référez-vous au sort et au MJ.',kind:'unknown'};
 if(spell.manual)return {text:spell.diceHint||'Dés à préciser avec le MJ (sort personnalisé).',kind:'manual'};
 const level=Number.isInteger(pc?.level)?pc.level:1;
 const cast=Number.isInteger(slotLevel)&&slotLevel>=spell.level?slotLevel:spell.level;
 const extra=Math.max(0,cast-spell.level);
 // On ne suppose jamais de modificateur pour les jets de soin : le panneau général l'affiche séparément.
 switch(spell.id){
  case 'fire-bolt':return {kind:'attack',text:`Attaque magique : d20 + bonus affiché ; dégâts ${tier(level)}d10 (dés réels).`};
  case 'ray-of-frost':return {kind:'attack',text:`Attaque magique : d20 + bonus affiché ; dégâts ${tier(level)}d8 (dés réels).`};
  case 'eldritch-blast':return {kind:'attack',text:`${tier(level)} rayon(s) : un d20 d’attaque puis 1d10 de dégâts par rayon (dés réels).`};
  case 'sacred-flame':return {kind:'save',text:`Cible : sauvegarde de Dextérité contre le DD affiché ; ${tier(level)}d8 de dégâts (dés réels).`};
  case 'fireball':return {kind:'save',text:`Cible : sauvegarde de Dextérité contre le DD affiché ; ${8+extra}d6 de feu (moitié en cas de réussite selon les règles).`};
  case 'cure-wounds':return {kind:'heal',text:`Soins : ${edition==='2024'?2*(1+extra):1+extra}d8 + modificateur d’incantation (dés réels).`};
  case 'healing-word':return {kind:'heal',text:`Soins : ${edition==='2024'?2*(1+extra):1+extra}d4 + modificateur d’incantation (dés réels).`};
  case 'magic-missile':return {kind:'damage',text:`${3+extra} projectile(s) : 1d4 + 1 dégâts chacun ; aucun d20 d’attaque usuel.`};
  case 'thunderwave':return {kind:'save',text:`Cible : sauvegarde de Constitution contre le DD affiché ; ${2+extra}d8 de dégâts.`};
  case 'guidance':return {kind:'support',text:'Effet de soutien : 1d4 réel selon les conditions du sort, pas de jet automatique.'};
  case 'bless':return {kind:'support',text:'Les créatures bénéficiaires ajoutent 1d4 réel aux jets concernés selon les règles du sort.'};
  default:return {kind:'reference',text:'Vérifier la description du sort dans les règles de votre édition ; aucun jet automatisé.'};
 }
}
function validateRoll(b,pc,entries,spells){if(!['attack','save','damage','healing','other'].includes(b.rollKind))throw Error('Type de résultat incorrect.');
 if(!Number.isSafeInteger(b.total)||b.total<0||b.total>9999)throw Error('Total physique invalide (0 à 9999).');
 if(['attack','save'].includes(b.rollKind)&&b.total<1)throw Error('Total de d20 invalide.');
 const entry=entries(pc).find(e=>e.id===b.entryId);if(!entry)throw Error('Sélectionnez un sort enregistré.');
 const spell=spells.spellFor(entry);if(!spell)throw Error('Sort inconnu.');
 return {spellName:spell.name,rollKind:b.rollKind,total:b.total,at:new Date().toISOString(),source:'physical'};
}
return {BY_CLASS,stats,hint,validateRoll,abilityFor,byClass};
});

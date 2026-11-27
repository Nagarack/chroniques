/* Chroniques — aide à la création et à la montée de niveau (règles de base SRD 5.1 / 5.2).
   Ne lance aucun dé : propose des valeurs fixes ou reprend le résultat d'un vrai dé. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesClassGuide=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const P=(root&&root.ChroniquesProgression)||(typeof require==='function'?require('./progression.js'):null);
const KEYS=['str','dex','con','int','wis','cha'];
const LABEL={str:'Force',dex:'Dextérité',con:'Constitution',int:'Intelligence',wis:'Sagesse',cha:'Charisme'};
const CLASS={
 barbarian:{die:12,saves:['str','con'],order:['str','con','dex','wis','cha','int'],pitch:'Combattant au contact, encaisse énormément grâce à sa rage.',extra:[5]},
 bard:{die:8,saves:['dex','cha'],order:['cha','dex','con','wis','int','str'],pitch:'Lanceur de sorts polyvalent, soutien et inspiration du groupe.'},
 cleric:{die:8,saves:['wis','cha'],order:['wis','con','str','dex','cha','int'],pitch:'Soigne, protège et frappe au nom de son dieu.'},
 druid:{die:8,saves:['int','wis'],order:['wis','con','dex','int','cha','str'],pitch:'Magie de la nature, peut prendre forme animale.'},
 fighter:{die:10,saves:['str','con'],order:['str','con','dex','wis','cha','int'],pitch:'Maître des armes et des armures, simple et solide.',extra:[5,11,20],asi:[6,14]},
 monk:{die:8,saves:['str','dex'],order:['dex','wis','con','str','int','cha'],pitch:'Arts martiaux, mobilité et coups rapides.',extra:[5]},
 paladin:{die:10,saves:['wis','cha'],order:['str','cha','con','wis','dex','int'],pitch:'Guerrier sacré : armure lourde, soins et frappes divines.',extra:[5]},
 ranger:{die:10,saves:['str','dex'],order:['dex','wis','con','str','int','cha'],pitch:'Éclaireur et pisteur, à l’aise à distance.',extra:[5]},
 rogue:{die:8,saves:['dex','int'],order:['dex','con','int','wis','cha','str'],pitch:'Discrétion, compétences et attaque sournoise.',asi:[10]},
 sorcerer:{die:6,saves:['con','cha'],order:['cha','con','dex','wis','int','str'],pitch:'Magie innée, sorts puissants et modulables.'},
 warlock:{die:8,saves:['wis','cha'],order:['cha','con','dex','wis','int','str'],pitch:'Pacte avec une entité : peu d’emplacements, mais qui reviennent au repos court.'},
 wizard:{die:6,saves:['int','wis'],order:['int','con','dex','wis','cha','str'],pitch:'Érudit des arcanes, le plus vaste choix de sorts.'}
};
const STANDARD=[15,14,13,12,10,8];
// XP totale requise pour atteindre chaque niveau (index = niveau actuel → seuil du suivant). Identique en 2014 et 2024.
const XP_LEVELS=[0,300,900,2700,6500,14000,23000,34000,48000,64000,85000,100000,120000,140000,165000,195000,225000,265000,305000,355000,null];
const COST={8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};
const mod=v=>Math.floor((Number(v)-10)/2);
const prof=l=>2+Math.floor((Math.max(1,Math.min(20,l))-1)/4);
function info(classId){const c=CLASS[classId];if(!c)return null;return {...c,name:P&&P.CLASSES[classId]?P.CLASSES[classId].name:classId,caster:P&&P.CLASSES[classId]?P.CLASSES[classId].caster:'none',primary:c.order[0],savesLabel:c.saves.map(k=>LABEL[k])};}
function standardArray(classId){const c=CLASS[classId];const order=c?c.order:KEYS;return Object.fromEntries(order.map((k,i)=>[k,STANDARD[i]]));}
// Achat de points : 27 points, scores de 8 à 15 avant bonus.
function pointBuy(scores){let total=0,valid=true;for(const k of KEYS){const v=Number(scores[k]);if(!Number.isInteger(v)||COST[v]===undefined){valid=false;continue;}total+=COST[v];}return {total,budget:27,valid:valid&&total<=27};}
function startingHp(classId,con){const c=CLASS[classId];return c?Math.max(1,c.die+mod(con)):null;}
function startingAc(dex){return 10+mod(dex);}
function averageGain(classId,con){const c=CLASS[classId];return c?Math.max(1,c.die/2+1+mod(con)):null;}
function rolledGain(classId,con,roll){const c=CLASS[classId];const r=Math.floor(Number(roll));if(!c||!(r>=1&&r<=c.die))return null;return Math.max(1,r+mod(con));}
function asiAt(classId,level,edition){const c=CLASS[classId]||{};const base=[4,8,12,16,19].concat(c.asi||[]);if(!base.includes(level))return null;return edition==='2024'&&level===19?'Don épique':'Amélioration de caractéristiques ou don';}
function slotsText(sp){if(!sp||!sp.slots.length)return '—';if(sp.kind==='pact')return sp.slots[0]+(sp.slots[0]>1?' emplacements de niveau ':' emplacement de niveau ')+sp.slotLevel;return sp.slots.map((n,i)=>'niv. '+(i+1)+' × '+n).join(', ')+(sp.kind==='mixed'?' + pacte : '+sp.pact.slots[0]+(sp.pact.slots[0]>1?' emplacements de niveau ':' emplacement de niveau ')+sp.pact.slotLevel:'');}
// Ce qui change au prochain niveau : à confirmer par le joueur et le MJ avec le livre ou le SRD.
function levelUpPreview(pc,edition,targetClass){const primary=(pc.progression&&pc.progression.classId)||(P?P.detectClass(pc.job):null);
 const list=P&&P.classesOf?P.classesOf(pc):[{classId:primary,level:pc.level||1,subclass:'',primary:true}];
 const classId=targetClass&&CLASS[targetClass]?targetClass:primary;const cur=list.find(x=>x.classId===classId);const fromClass=cur?cur.level:0,toClass=fromClass+1;
 const c=CLASS[classId],from=pc.level||1,to=from+1;const con=(pc.stats&&pc.stats.abilities&&pc.stats.abilities.con)||10;
 const out={classId,className:c?info(classId).name:null,from,to,classLevel:toClass,newClass:!cur,hitDie:c?c.die:null,conMod:mod(con),average:c?averageGain(classId,con):null,changes:[]};
 if(list.length>1||!cur)out.changes.push((c?info(classId).name:'Classe')+' : niveau '+fromClass+' → '+toClass+' (niveau de personnage '+to+').');
 if(!cur&&P&&P.MC_PROFS){out.changes.push('Multiclassage, maîtrises acquises : '+P.MC_PROFS[classId]+'.');if(edition==='2024')out.changes.push('Vérifiez la table de multiclassage de la classe dans votre livre 2024.');}
 if(prof(to)>prof(from))out.changes.push('Bonus de maîtrise : +'+prof(from)+' → +'+prof(to)+' (attaques, compétences maîtrisées, DD des sorts).');
 const asi=c&&asiAt(classId,toClass,edition);if(asi)out.changes.push(asi+(list.length>1||!cur?' (niveau '+toClass+' de la classe).':' au niveau '+toClass+'.'));
 if(c&&c.extra&&c.extra.includes(toClass))out.changes.push(toClass===5?'Attaque supplémentaire : deux attaques par action Attaquer (ne se cumule pas entre classes).':'Attaque supplémentaire améliorée ('+(toClass===11?3:4)+' attaques par action Attaquer).');
 if(P&&classId){const lvl=P.subclassLevel(classId,edition);if(lvl===toClass)out.changes.push('Choix de la sous-classe.');
  let a,b;if(P.spellsFor){a=P.spellsFor(pc,edition);const clone=JSON.parse(JSON.stringify(pc));clone.level=to;if(classId!==primary){clone.progression=clone.progression||{};const l=(clone.progression.multiclass||[]).filter(x=>x.classId!==classId);l.push({classId,level:toClass,subclass:cur?cur.subclass:''});clone.progression.multiclass=l;}b=P.spellsFor(clone,edition);}
  else{a=P.slotsFor(classId,from,edition);b=P.slotsFor(classId,to,edition);}
  const ta=slotsText(a),tb=slotsText(b);if(ta!==tb&&tb!=='—')out.changes.push('Emplacements de sorts : '+ta+' → '+tb+'.');}
 if(!c)out.changes.push('Classe non reconnue : reportez-vous au livre pour les PV et capacités.');
 out.changes.push('Nouvelles capacités de classe : consultez la table de progression de la classe.');
 return out;}
return {XP_LEVELS,KEYS,LABEL,CLASS,STANDARD,COST,mod,prof,info,standardArray,pointBuy,startingHp,startingAc,averageGain,rolledGain,asiAt,levelUpPreview};
});

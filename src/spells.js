/* Chroniques — catalogue de sorts. Sélection d'origine complétée par les 319 sorts du SRD 5.1 en français
   (src/data/srd-spells-index.js, licence CC BY 4.0). Les textes complets sont chargés à la demande (src/data/srd-regles-fr.js). */
(function(root, factory){const m=factory(root);if(typeof module==='object'&&module.exports)module.exports=m;if(root)root.ChroniquesSpells=m;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
// id, nom, niveau, classes, temps (action / bonus / reaction / minute), portée, durée, composantes, concentration, rituel
const rows=[
 ['light','Lumière',0,'bard cleric sorcerer wizard','action','contact','1 heure','V M',false,false],
 ['mage-hand','Main du mage',0,'bard sorcerer warlock wizard','action','9 m','1 minute','V S',false,false],
 ['prestidigitation','Prestidigitation',0,'bard sorcerer warlock wizard','action','3 m','1 heure','V S',false,false],
 ['fire-bolt','Trait de feu',0,'sorcerer wizard','action','36 m','Instantanée','V S',false,false],
 ['ray-of-frost','Rayon de givre',0,'sorcerer wizard','action','18 m','Instantanée','V S',false,false],
 ['sacred-flame','Flamme sacrée',0,'cleric','action','18 m','Instantanée','V S',false,false],
 ['guidance','Assistance',0,'cleric druid','action','contact','1 minute','V S',true,false],
 ['druidcraft','Druidisme',0,'druid','action','9 m','Instantanée','V S',false,false],
 ['vicious-mockery','Moquerie cruelle',0,'bard','action','18 m','Instantanée','V',false,false],
 ['eldritch-blast','Décharge occulte',0,'warlock','action','36 m','Instantanée','V S',false,false],
 ['bless','Bénédiction',1,'cleric paladin','action','9 m','1 minute','V S M',true,false],
 ['bane','Fléau',1,'bard cleric','action','9 m','1 minute','V S M',true,false],
 ['healing-word','Mot de guérison',1,'bard cleric druid','bonus','18 m','Instantanée','V',false,false],
 ['cure-wounds','Soins',1,'bard cleric druid paladin ranger','action','contact','Instantanée','V S',false,false],
 ['shield','Bouclier',1,'sorcerer wizard','reaction','Personnelle','1 round','V S',false,false],
 ['magic-missile','Projectile magique',1,'sorcerer wizard','action','36 m','Instantanée','V S',false,false],
 ['mage-armor','Armure du mage',1,'sorcerer wizard','action','contact','8 heures','V S M',false,false],
 ['detect-magic','Détection de la magie',1,'bard cleric druid paladin ranger sorcerer wizard','action','Personnelle','10 minutes','V S',true,true],
 ['comprehend-languages','Compréhension des langues',1,'bard sorcerer warlock wizard','action','Personnelle','1 heure','V S M',false,true],
 ['entangle','Enchevêtrement',1,'druid','action','27 m','1 minute','V S',true,false],
 ['hunters-mark','Marque du chasseur',1,'ranger','bonus','27 m','1 heure','V',true,false],
 ['hex','Maléfice',1,'warlock','bonus','27 m','1 heure','V S M',true,false],
 ['thunderwave','Vague tonnante',1,'bard druid sorcerer wizard','action','Personnelle','Instantanée','V S',false,false],
 ['invisibility','Invisibilité',2,'bard sorcerer warlock wizard','action','contact','1 heure','V S M',true,false],
 ['misty-step','Foulée brumeuse',2,'sorcerer warlock wizard','bonus','Personnelle','Instantanée','V',false,false],
 ['darkness','Ténèbres',2,'sorcerer warlock wizard','action','18 m','10 minutes','V M',true,false],
 ['aid','Aide',2,'cleric paladin','action','9 m','8 heures','V S M',false,false],
 ['silence','Silence',2,'bard cleric ranger','action','36 m','10 minutes','V S',true,true],
 ['hold-person','Immobilisation de personne',2,'bard cleric druid sorcerer warlock wizard','action','18 m','1 minute','V S M',true,false],
 ['lesser-restoration','Restauration partielle',2,'bard cleric druid paladin ranger','action','contact','Instantanée','V S',false,false],
 ['fireball','Boule de feu',3,'sorcerer wizard','action','45 m','Instantanée','V S M',false,false],
 ['counterspell','Contresort',3,'sorcerer warlock wizard','reaction','18 m','Instantanée','S',false,false],
 ['dispel-magic','Dissipation de la magie',3,'bard cleric druid paladin sorcerer warlock wizard','action','36 m','Instantanée','V S',false,false],
 ['fly','Vol',3,'sorcerer warlock wizard','action','contact','10 minutes','V S M',true,false],
 ['haste','Hâte',3,'sorcerer wizard','action','9 m','1 minute','V S M',true,false],
 ['revivify','Retour à la vie',3,'cleric paladin','action','contact','Instantanée','V S M',false,false]
];
let INDEX=[];try{INDEX=(root&&root.ChroniquesSRDSpellIndex)||(typeof require==='function'?require('./data/srd-spells-index.js'):[]);}catch{INDEX=[];}
const SCHOOL=Object.fromEntries(INDEX.map(r=>[r[0],r[10]]));
const CHANGED24=new Set(INDEX.filter(r=>r[11]===1).map(r=>r[0]));
const known=new Set(rows.map(r=>r[0]));
const all=rows.concat(INDEX.filter(r=>!known.has(r[0])).map(r=>r.slice(0,10)));
const CATALOG=Object.freeze(all.map(([id,name,level,classes,castTime,range,duration,components,concentration,ritual])=>Object.freeze({id,name,level,classes:classes.split(' '),castTime,range,duration,components,concentration,ritual,school:SCHOOL[id]||'',srd:!!SCHOOL[id],changed2024:CHANGED24.has(id)})).sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name,'fr')));
const get=id=>CATALOG.find(x=>x.id===id)||null;
function txt(x,field,max=80){if(typeof x!=='string'||!x.trim()||x.trim().length>max)throw Error(field+' invalide.');return x.trim();}
function level(x){if(!Number.isInteger(x)||x<0||x>9)throw Error('Niveau de sort invalide.');return x;}
function spellFor(entry){if(!entry)return null;return entry.spellId?get(entry.spellId):entry.custom||null;}
function entries(pc){return Array.isArray(pc.grimoire)?pc.grimoire:[];}
function add(pc,classId,edition,body,id){
 if(entries(pc).length>=100)throw Error('Maximum 100 sorts par personnage.');
 if(!['2014','2024','custom'].includes(edition))throw Error('Édition invalide.');
 let spell, item;
 if(body.spellId){
  if(edition==='custom')throw Error('Catalogue automatique indisponible en règles personnalisées.');
  spell=get(body.spellId);if(!spell)throw Error('Sort introuvable dans le catalogue.');
  if(!spell.classes.includes(classId)&&body.allowOutsideClass!==true)throw Error('Sort hors liste de classe : demandez une validation manuelle.');
  if(entries(pc).some(e=>e.spellId===spell.id))throw Error('Sort déjà enregistré.');
  item={id,spellId:spell.id,prepared:spell.level===0||body.prepared===true};
 }else{
  const x=body.custom;if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Sort personnalisé incomplet.');
  spell={name:txt(x.name,'Nom du sort',70),level:level(x.level),castTime:txt(x.castTime,'Temps d’incantation',40),range:txt(x.range,'Portée',45),duration:txt(x.duration,'Durée',55),components:txt(x.components,'Composantes',35),concentration:x.concentration===true,ritual:x.ritual===true,diceHint:typeof x.diceHint==='string'?x.diceHint.trim().slice(0,100):'',manual:true};
  if(entries(pc).some(e=>e.custom?.name.toLowerCase()===spell.name.toLowerCase()))throw Error('Sort personnalisé déjà enregistré.');
  item={id,custom:spell,prepared:spell.level===0||body.prepared===true};
 }
 pc.grimoire??=[];pc.grimoire.push(item);return item;
}
function edit(pc,id,prepared){const e=entries(pc).find(x=>x.id===id);if(!e)throw Error('Sort introuvable.');if(typeof prepared!=='boolean')throw Error('État de préparation invalide.');const sp=spellFor(e);e.prepared=sp.level===0?true:prepared;}
function remove(pc,id){const old=entries(pc);const idx=old.findIndex(e=>e.id===id);if(idx<0)throw Error('Sort introuvable.');old.splice(idx,1);}
function slotOptions(pc,edition,entry,progression){const sp=spellFor(entry);if(!sp||sp.level===0||!entry?.prepared)return [];
 return progression.slotRows(pc,edition).filter(x=>x.left!==null&&x.left>0&&x.level>=sp.level);
}
function record(pc,edition,p,body,progression){
 const e=entries(pc).find(x=>x.id===body.entryId);if(!e)throw Error('Sort inconnu du personnage.');
 const sp=spellFor(e);if(!sp)throw Error('Sort inconnu du catalogue.');
 if(!e.prepared&&sp.level!==0&&body.manualUnprepared!==true)throw Error('Sort non préparé : validation manuelle nécessaire.');
 if(!['slot','manual'].includes(body.mode))throw Error('Mode de lancement incorrect.');
 const manual=body.mode==='manual';
 if(sp.level===0&&!manual)throw Error('Les tours de magie ne consomment pas d’emplacement.');
 if(!manual){
  const key=String(body.slotKey||'');const slot=slotOptions(pc,edition,{...e,prepared:true},progression).find(x=>x.key===key);
  if(!slot)throw Error('Emplacement insuffisant ou indisponible.');
 }
 if(sp.concentration&&pc.concentration&&pc.concentration!==sp.name&&body.replaceConcentration!==true)throw Error('Une concentration est déjà active : confirmez son remplacement.');
 if(!manual)progression.spendSlot(pc,edition,String(body.slotKey),1);
 if(sp.concentration)pc.concentration=sp.name;
 const stamp=new Date().toISOString();pc.spellHistory??=[];
 pc.spellHistory.unshift({name:sp.name,mode:manual?'manual':'slot',slotLevel:manual?null:(body.slotKey==='pact'?progression.progression(pc,edition).spells.slotLevel:Number(body.slotKey)),at:stamp});
 pc.spellHistory=pc.spellHistory.slice(0,25);
 return {spell:sp,mode:manual?'manual':'slot'};
}
const fold=x=>String(x||'').toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
function listForClass(classId,term='',maxLevel=9){const q=fold(term);return CATALOG.filter(s=>(!classId||s.classes.includes(classId))&&s.level<=maxLevel&&fold(s.name).includes(q));}
return {CATALOG,get,spellFor,entries,add,edit,remove,record,slotOptions,listForClass};
});

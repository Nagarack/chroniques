/* Chroniques V1.8 — bibliothèque privée du MJ ; aucun jet de dés virtuel. */
'use strict';
const N=require('./creatures');
const A=require('./art-catalog');
const MAX_TEMPLATES=60, MAX_ENCOUNTERS=40, MAX_GROUPS=16, MAX_PARTICIPANTS=30;
function error(message){const e=new Error(message);e.status=400;throw e;}
function text(v,label,max=100,empty=false){if(typeof v!=='string')error(label+' manquant.');const t=v.trim();if((!empty&&!t)||t.length>max)error(label+' invalide.');return t;}
function library(s){if(!s.gmLibrary || typeof s.gmLibrary!=='object'||Array.isArray(s.gmLibrary))s.gmLibrary={templates:[],encounters:[]};if(!Array.isArray(s.gmLibrary.templates))s.gmLibrary.templates=[];if(!Array.isArray(s.gmLibrary.encounters))s.gmLibrary.encounters=[];return s.gmLibrary;}
function templates(s){return Array.isArray(s.gmLibrary?.templates)?s.gmLibrary.templates:[];}
function encounters(s){return Array.isArray(s.gmLibrary?.encounters)?s.gmLibrary.encounters:[];}
function validatedIcon(icon){if(icon===undefined||icon===null||icon==='')return null;if(typeof icon!=='string'||!A.get(icon,'npc'))error('Icône de monstre/PNJ inconnue.');return icon;}
function templateValues(values,icon){const v=N.validate(values);return {...v,icon:validatedIcon(icon)};}
function addTemplate(s,id,values,icon){const l=library(s);if(l.templates.length>=MAX_TEMPLATES)error('Bibliothèque limitée à 60 modèles.');if(l.templates.some(x=>x.id===id))error('Identifiant de modèle déjà utilisé.');const tpl={id,...templateValues(values,icon)};l.templates.push(tpl);return tpl;}
function fromNpc(s,id,npcId,icon){const n=N.find(s,npcId);if(!n)error('Créature de départ introuvable.');return addTemplate(s,id,n,icon);}
function editTemplate(s,id,values,icon){const t=templates(s).find(x=>x.id===id);if(!t)error('Modèle introuvable.');Object.assign(t,templateValues(values,icon));return t;}
function removeTemplate(s,id){const l=library(s),i=l.templates.findIndex(t=>t.id===id);if(i===-1)error('Modèle introuvable.');if(l.encounters.some(e=>e.groups.some(g=>g.templateId===id)))error('Modèle utilisé par une rencontre : retirez les groupes concernés.');l.templates.splice(i,1);}
function addEncounter(s,id,name,notes=''){const l=library(s);if(l.encounters.length>=MAX_ENCOUNTERS)error('Maximum 40 rencontres préparées.');const e={id,name:text(name,'Nom de rencontre',90),notes:text(notes,'Notes du MJ',1000,true),groups:[]};l.encounters.push(e);return e;}
function editEncounter(s,id,name,notes=''){const e=encounters(s).find(x=>x.id===id);if(!e)error('Rencontre introuvable.');e.name=text(name,'Nom de rencontre',90);e.notes=text(notes,'Notes du MJ',1000,true);return e;}
function removeEncounter(s,id){const l=library(s),i=l.encounters.findIndex(e=>e.id===id);if(i===-1)error('Rencontre introuvable.');l.encounters.splice(i,1);}
function count(e){return e.groups.reduce((n,g)=>n+g.quantity,0);}
function addGroup(s,encounterId,groupId,templateId,quantity){const l=library(s),e=l.encounters.find(x=>x.id===encounterId);if(!e)error('Rencontre introuvable.');if(!l.templates.some(t=>t.id===templateId))error('Modèle absent de la bibliothèque.');if(!Number.isSafeInteger(quantity)||quantity<1||quantity>12)error('Quantité : 1 à 12 exemplaires.');if(e.groups.length>=MAX_GROUPS||count(e)+quantity>MAX_PARTICIPANTS)error('Une rencontre accepte au maximum 16 groupes et 30 créatures.');e.groups.push({id:groupId,templateId,quantity});return e;}
function removeGroup(s,encounterId,groupId){const e=encounters(s).find(x=>x.id===encounterId);if(!e)error('Rencontre introuvable.');const i=e.groups.findIndex(g=>g.id===groupId);if(i<0)error('Groupe introuvable.');e.groups.splice(i,1);return e;}
function deploy(s,encounterId,newId){const e=encounters(s).find(x=>x.id===encounterId);if(!e)error('Rencontre introuvable.');if(s.combat.started)error('Terminez le combat avant d’ajouter la rencontre.');const total=count(e);if(!total)error('Ajoutez des groupes à la rencontre.');if(N.list(s).length+total>100)error('Maximum 100 créatures déjà présentes et à ajouter.');
 const output=[];for(const g of e.groups){const t=templates(s).find(x=>x.id===g.templateId);if(!t)error('Un modèle de cette rencontre est introuvable.');let group='';for(let i=0;i<g.quantity;i++){
  const id=newId();if(g.quantity>1&&!group)group=('g-'+id).toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,40);const v={name:t.name,kind:t.kind,hpMax:t.hpMax,ac:t.ac,initiative:t.initiative,speed:t.speed,visibility:t.visibility,showHp:t.showHp,notes:t.notes,actions:t.actions,traits:t.traits||'',legendary:t.legendary||'',lair:t.lair||'',spellcasting:t.spellcasting||null,defenses:t.defenses||{},abilities:t.abilities||null,cr:t.cr||'',group};
  N.add(s,id,v);output.push({id,templateId:t.id,icon:t.icon||null,visibility:t.visibility,name:t.name});
 }}return {encounter:e,created:output};}
module.exports={MAX_TEMPLATES,MAX_ENCOUNTERS,MAX_PARTICIPANTS,library,templates,encounters,addTemplate,fromNpc,editTemplate,removeTemplate,addEncounter,editEncounter,removeEncounter,addGroup,removeGroup,deploy,count};

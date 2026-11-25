/* Chroniques V1.9 — carnet de campagne : séparation stricte des notes MJ et des informations publiées. */
'use strict';
const TYPES=Object.freeze({
 places:{label:'Lieux',limit:90,status:[]},
 quests:{label:'Quêtes',limit:90,status:['proposed','active','completed','failed']},
 npcs:{label:'PNJ récurrents',limit:100,status:[]},
 factions:{label:'Factions',limit:60,status:[]},
 treasures:{label:'Trésors & récompenses',limit:100,status:['hidden','discovered','distributed']},
 sessions:{label:'Séances',limit:100,status:['planned','completed','cancelled']},
 journal:{label:'Journal de campagne',limit:180,status:[]}
});
const VISIBILITY=['private','shared'];
const ATTITUDES=['','hostile','mefiant','neutre','amical','allie'];
function error(message){const e=new Error(message);e.status=400;throw e;}
function clean(value,label,max,optional=false){if(typeof value!=='string')error(label+' invalide.');const str=value.trim();if((!optional&&!str)||str.length>max)error(label+' invalide (maximum '+max+' caractères).');return str;}
function checkDate(value){const str=clean(value,'Date',10,true);if(!str)return '';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(str)||Number.isNaN(Date.parse(str+'T12:00:00Z'))||new Date(str+'T12:00:00Z').toISOString().slice(0,10)!==str)error('Date invalide (AAAA-MM-JJ).');return str;}
function board(s){if(!s.campaignPlanner||typeof s.campaignPlanner!=='object'||Array.isArray(s.campaignPlanner))s.campaignPlanner={};for(const k of Object.keys(TYPES))if(!Array.isArray(s.campaignPlanner[k]))s.campaignPlanner[k]=[];return s.campaignPlanner;}
function validated(type,value){if(!Object.hasOwn(TYPES,type))error('Section de campagne inconnue.');if(!value||typeof value!=='object'||Array.isArray(value))error('Fiche de campagne invalide.');
 const config=TYPES[type],visibility=value.visibility;
 if(!VISIBILITY.includes(visibility))error('Visibilité invalide.');
 const status=config.status.length?(config.status.includes(value.status)?value.status:null):'';
 if(config.status.length&&!status)error('État invalide pour '+type+'.');
 return {title:clean(value.title,'Titre',90),summary:clean(value.summary,'Description',850,true),privateNotes:clean(value.privateNotes,'Notes privées',1800,true),context:clean(value.context,'Lieu / contexte',110,true),visibility,status:status||'',date:checkDate(value.date||''),...(['npcs','factions'].includes(type)?{attitude:ATTITUDES.includes(value.attitude)?value.attitude:''}:{})};
}
function add(s,type,id,value){const b=board(s),p=validated(type,value);if(b[type].length>=TYPES[type].limit)error('Limite de cette section atteinte.');if(typeof id!=='string'||!/^cp-[a-zA-Z0-9_-]{7,45}$/.test(id)||b[type].some(e=>e.id===id))error('Identifiant invalide.');const x={id,...p};b[type].push(x);return x;}
function update(s,type,id,value){const b=board(s);if(!Object.hasOwn(TYPES,type))error('Section de campagne inconnue.');const i=b[type].findIndex(x=>x.id===id);if(i<0)error('Fiche introuvable.');const p=validated(type,value);const old=b[type][i];b[type][i]={id,...p,...(Array.isArray(old.objectives)?{objectives:old.objectives}:{})};return b[type][i];}
// Objectifs de quête : cochés par le MJ ; visibles des joueurs si la quête est partagée et l'objectif non secret.
const MAX_OBJECTIVES=20;
function quest(s,id){const q=board(s).quests.find(x=>x.id===id);if(!q)error('Quête introuvable.');if(!Array.isArray(q.objectives))q.objectives=[];return q;}
function objectiveAdd(s,questId,id,value){const q=quest(s,questId);if(q.objectives.length>=MAX_OBJECTIVES)error('Maximum '+MAX_OBJECTIVES+' objectifs par quête.');const o={id,text:clean(String(value?.text??''),'Objectif',160),secret:value?.secret===true,done:false};q.objectives.push(o);return o;}
function objectiveSet(s,questId,id,value){const q=quest(s,questId);const o=q.objectives.find(x=>x.id===id);if(!o)error('Objectif introuvable.');if(value&&'done' in value)o.done=value.done===true;if(value&&'secret' in value)o.secret=value.secret===true;if(value&&'text' in value)o.text=clean(String(value.text??''),'Objectif',160);return o;}
function objectiveRemove(s,questId,id){const q=quest(s,questId);const i=q.objectives.findIndex(x=>x.id===id);if(i<0)error('Objectif introuvable.');q.objectives.splice(i,1);}
function objectiveMove(s,questId,id,dir){const q=quest(s,questId);const i=q.objectives.findIndex(x=>x.id===id);if(i<0)error('Objectif introuvable.');const j=i+(dir<0?-1:1);if(j<0||j>=q.objectives.length)return;[q.objectives[i],q.objectives[j]]=[q.objectives[j],q.objectives[i]];}
function remove(s,type,id){const b=board(s);if(!Object.hasOwn(TYPES,type))error('Section de campagne inconnue.');const i=b[type].findIndex(x=>x.id===id);if(i<0)error('Fiche introuvable.');b[type].splice(i,1);}
function projected(s){const out={};const b=s?.campaignPlanner||{};for(const type of Object.keys(TYPES)){const collection=Array.isArray(b[type])?b[type]:[];out[type]=collection.filter(x=>x.visibility==='shared').map(x=>({id:x.id,title:x.title,summary:x.summary,context:x.context,status:x.status,date:x.date,...(x.attitude?{attitude:x.attitude}:{}),...(type==='quests'&&Array.isArray(x.objectives)&&x.objectives.some(o=>!o.secret)?{objectives:x.objectives.filter(o=>!o.secret).map(o=>({id:o.id,text:o.text,done:o.done}))}:{}),visibility:'shared'}));}return out;}
module.exports={TYPES,VISIBILITY,MAX_OBJECTIVES,board,validated,add,update,remove,projected,objectiveAdd,objectiveSet,objectiveRemove,objectiveMove};

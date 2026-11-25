/* Chroniques V2.9 — préparation de scénarios, exclusivement privée MJ. Les scénarios restent privés ; assistance externe uniquement après accord explicite. */
'use strict';
const LIMIT=50,STATUSES=Object.freeze(['draft','ready','running','archived']);
const REF_TYPES=Object.freeze(['places','quests','npcs','encounters','scenes']);
function bad(msg){const e=new Error(msg);e.status=400;throw e;}
function text(v,label,max,required=false){if(typeof v!=='string')bad(label+' invalide.');const s=v.trim();if(s.length>max||(required&&!s))bad(label+' invalide (maximum '+max+' caractères).');return s;}
function board(s){if(!Array.isArray(s.storyPlans))s.storyPlans=[];return s.storyPlans;}
function refs(s){const p=s.campaignPlanner||{};return {places:p.places||[],quests:p.quests||[],npcs:p.npcs||[],encounters:s.gmLibrary?.encounters||[],scenes:s.sessionFlow||[]};}
function validate(s,v){if(!v||typeof v!=='object'||Array.isArray(v))bad('Scénario invalide.');
 const status=text(v.status,'Statut',15);if(!STATUSES.includes(status))bad('Statut invalide.');
 if(!Array.isArray(v.acts)||v.acts.length!==3)bad('Trois actes sont nécessaires.');
 const acts=v.acts.map((a,i)=>{if(!a||typeof a!=='object'||Array.isArray(a))bad('Acte invalide.');return {title:text(a.title,'Titre de l’acte '+(i+1),75,true),challenge:text(a.challenge,'Situation de l’acte',700),outcome:text(a.outcome,'Conséquence de l’acte',700)};});
 if(!Array.isArray(v.links)||v.links.length>12)bad('Maximum 12 liens.');
 const available=refs(s),seen=new Set(),links=[];
 for(const link of v.links){if(!link||typeof link!=='object'||!REF_TYPES.includes(link.type)||typeof link.id!=='string'||!available[link.type].some(x=>x.id===link.id))bad('Lien de scénario introuvable.');const key=link.type+':'+link.id;if(seen.has(key))bad('Lien en double.');seen.add(key);links.push({type:link.type,id:link.id});}
 return {title:text(v.title,'Titre',100,true),pitch:text(v.pitch,'Pitch',450),hook:text(v.hook,'Accroche',800),objective:text(v.objective,'Objectif',500),antagonist:text(v.antagonist,'Adversité',500),stakes:text(v.stakes,'Enjeux',800),secret:text(v.secret,'Secrets du MJ',1800),finale:text(v.finale,'Dénouement',850),status,acts,links};
}
function add(s,id,v){const b=board(s);if(b.length>=LIMIT)bad('Limite de 50 scénarios atteinte.');if(typeof id!=='string'||!/^story-[A-Za-z0-9_-]{7,50}$/.test(id)||b.some(x=>x.id===id))bad('Identifiant invalide.');const p={id,...validate(s,v)};b.push(p);return p;}
function update(s,id,v){const b=board(s),i=b.findIndex(x=>x.id===id);if(i<0)bad('Scénario introuvable.');const p={id,...validate(s,v)};b[i]=p;return p;}
function remove(s,id){const b=board(s),i=b.findIndex(x=>x.id===id);if(i<0)bad('Scénario introuvable.');return b.splice(i,1)[0];}
module.exports={LIMIT,STATUSES,REF_TYPES,board,refs,validate,add,update,remove};

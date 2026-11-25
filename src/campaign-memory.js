/* Chroniques V3.1 — mémoire de campagne locale et manuelle ; aucune transmission IA. */
'use strict';
const LIMIT=250;
const TYPES=Object.freeze({event:'Événement',decision:'Décision',clue:'Indice',consequence:'Conséquence'});
const STATUS=Object.freeze({open:'À suivre',resolved:'Résolu'});
const VISIBILITY=Object.freeze({private:'MJ uniquement',shared:'Partagé aux joueurs'});
function bad(message){const error=new Error(message);error.status=400;throw error;}
function text(v,label,max,mandatory=false){if(typeof v!=='string')bad(label+' invalide.');const result=v.trim();if(result.length>max||(mandatory&&!result))bad(label+' invalide (maximum '+max+' caractères).');return result;}
function validDate(v){const str=text(v,'Date',10);if(!str)return '';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(str)||Number.isNaN(Date.parse(str+'T12:00:00Z'))||new Date(str+'T12:00:00Z').toISOString().slice(0,10)!==str)bad('Date invalide.');return str;}
function list(s){if(!Array.isArray(s.campaignMemory))s.campaignMemory=[];return s.campaignMemory;}
function validate(v){if(!v||typeof v!=='object'||Array.isArray(v))bad('Souvenir invalide.');
 const category=text(v.category,'Catégorie',20);if(!Object.hasOwn(TYPES,category))bad('Catégorie inconnue.');
 const status=text(v.status,'État',12);if(!Object.hasOwn(STATUS,status))bad('État inconnu.');
 const visibility=text(v.visibility,'Visibilité',12);if(!Object.hasOwn(VISIBILITY,visibility))bad('Visibilité inconnue.');
 return {title:text(v.title,'Titre',100,true),summary:text(v.summary,'Récit',1000,true),impact:text(v.impact,'Conséquences visibles',700),gmNotes:text(v.gmNotes,'Notes secrètes MJ',1600),session:text(v.session,'Séance',70),date:validDate(v.date||''),category,status,visibility};
}
function add(s,id,v){const entries=list(s);if(entries.length>=LIMIT)bad('Limite de '+LIMIT+' souvenirs atteinte.');
 if(typeof id!=='string'||!/^mem-[a-zA-Z0-9_-]{7,50}$/.test(id)||entries.some(x=>x.id===id))bad('Identifiant invalide.');const item={id,...validate(v)};entries.push(item);return item;}
function update(s,id,v){const entries=list(s),i=entries.findIndex(x=>x.id===id);if(i<0)bad('Souvenir introuvable.');entries[i]={id,...validate(v)};return entries[i];}
function remove(s,id){const entries=list(s),i=entries.findIndex(x=>x.id===id);if(i<0)bad('Souvenir introuvable.');return entries.splice(i,1)[0];}
function projected(s){return (Array.isArray(s?.campaignMemory)?s.campaignMemory:[]).filter(x=>x.visibility==='shared').map(({id,title,summary,impact,session,date,category,status})=>({id,title,summary,impact,session,date,category,status,visibility:'shared'}));}
function recap(s,canSeeSecrets=false){const items=canSeeSecrets?list(s):projected(s);
 const sorted=items.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
 return {open:sorted.filter(x=>x.status==='open'),recent:sorted.slice(0,12),total:items.length};
}
module.exports={LIMIT,TYPES,STATUS,VISIBILITY,list,validate,add,update,remove,projected,recap};

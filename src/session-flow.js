/* Chroniques V2.0 — scènes de séance, privées par défaut. */
'use strict';
const MAX_SCENES=120, STATUS=Object.freeze(['planned','active','completed']), VISIBILITY=Object.freeze(['private','shared']);
function bad(s){const e=new Error(s);e.status=400;throw e;}
function string(s,label,max,required=false){if(typeof s!=='string')bad(label+' invalide.');const v=s.trim();if(v.length>max||(required&&!v))bad(label+' invalide (maximum '+max+' caractères).');return v;}
function board(state){if(!Array.isArray(state.sessionFlow))state.sessionFlow=[];return state.sessionFlow;}
function allReferences(s){const p=s.campaignPlanner||{},enc=(s.gmLibrary||{}).encounters||[];return {places:Array.isArray(p.places)?p.places:[],quests:Array.isArray(p.quests)?p.quests:[],npcs:Array.isArray(p.npcs)?p.npcs:[],encounters:Array.isArray(enc)?enc:[]};}
function validate(s,input){if(!input||typeof input!=='object'||Array.isArray(input))bad('Scène invalide.');const status=string(input.status,'Statut',12),visibility=string(input.visibility,'Visibilité',12);if(!STATUS.includes(status)||!VISIBILITY.includes(visibility))bad('Statut ou visibilité invalide.');const refs=allReferences(s),links=Array.isArray(input.links)?input.links:null;if(!links||links.length>12)bad('Liens invalides (maximum 12).');const seen=new Set(),cleanLinks=[];
 for(const ref of links){if(!ref||typeof ref!=='object'||!Object.hasOwn(refs,ref.type)||typeof ref.id!=='string'||!refs[ref.type].some(e=>e.id===ref.id))bad('Référence de scène introuvable.');const key=ref.type+':'+ref.id;if(seen.has(key))bad('Lien en double.');seen.add(key);cleanLinks.push({type:ref.type,id:ref.id});}
 const trackId=input.trackId===undefined||input.trackId===null?'':string(input.trackId,'Ambiance',80);if(trackId&&!((s.ambience?.tracks)||[]).some(t=>t.id===trackId))bad('Piste d’ambiance introuvable.');
 return {title:string(input.title,'Titre',90,true),summary:string(input.summary,'Résumé partagé',750),gmNotes:string(input.gmNotes,'Notes MJ',2000),status,visibility,links:cleanLinks,...(trackId?{trackId}:{})};
}
function add(s,id,input){const arr=board(s);if(arr.length>=MAX_SCENES)bad('Limite de scènes atteinte.');if(typeof id!=='string'||!/^sc-[A-Za-z0-9_-]{7,48}$/.test(id)||arr.some(x=>x.id===id))bad('Identifiant invalide.');const scene={id,...validate(s,input)};arr.push(scene);return scene;}
function update(s,id,input){const arr=board(s),i=arr.findIndex(x=>x.id===id);if(i<0)bad('Scène introuvable.');arr[i]={id,...validate(s,input)};return arr[i];}
function remove(s,id){const arr=board(s),i=arr.findIndex(x=>x.id===id);if(i<0)bad('Scène introuvable.');arr.splice(i,1);}
function visibleLinks(s,scene){const refs=allReferences(s);return (scene.links||[]).filter(ref=>ref.type!=='encounters'&&refs[ref.type]?.some(e=>e.id===ref.id&&e.visibility==='shared')).map(ref=>({type:ref.type,id:ref.id}));}
function projected(s){return (Array.isArray(s?.sessionFlow)?s.sessionFlow:[]).filter(x=>x.visibility==='shared').map(x=>({id:x.id,title:x.title,summary:x.summary,status:x.status,visibility:'shared',links:visibleLinks(s,x)}));}
module.exports={STATUS,VISIBILITY,MAX_SCENES,board,add,update,remove,projected,validate};

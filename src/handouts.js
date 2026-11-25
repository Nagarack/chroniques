/* Chroniques — documents du MJ pour les joueurs (lettres, indices, cartes au trésor…).
   Un document reste privé jusqu'à son envoi ; chaque joueur ne reçoit que ceux qui lui sont adressés. */
'use strict';
const MAX=60;
function fail(m){const e=new Error(m);e.status=400;throw e;}
function text(v,label,max,required){const s=String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();if(required&&!s)fail(label+' requis.');if(s.length>max)fail(label+' : '+max+' caractères maximum.');return s;}
function list(s){if(!Array.isArray(s.handouts))s.handouts=[];return s.handouts;}
function find(s,id){return (Array.isArray(s.handouts)?s.handouts:[]).find(h=>h.id===id)||null;}
function values(v){return {title:text(v?.title,'Titre',100,true),text:text(v?.text,'Texte',4000,false)};}
function add(s,id,v){const arr=list(s);if(arr.length>=MAX)fail('Maximum '+MAX+' documents.');const h={id,...values(v),recipients:[],sentAt:null,readBy:[]};arr.push(h);return h;}
function update(s,id,v){const h=find(s,id);if(!h)fail('Document introuvable.');Object.assign(h,values(v));return h;}
function remove(s,id){const arr=list(s),i=arr.findIndex(h=>h.id===id);if(i<0)fail('Document introuvable.');return arr.splice(i,1)[0];}
// recipients : 'all' ou une liste d'identifiants de personnages existants.
function send(s,id,recipients){const h=find(s,id);if(!h)fail('Document introuvable.');const pcs=new Set((s.characters||[]).map(p=>p.id));
 let r;if(recipients==='all')r='all';else{if(!Array.isArray(recipients)||!recipients.length)fail('Choisissez au moins un destinataire.');r=[...new Set(recipients.map(String))];if(r.some(x=>!pcs.has(x)))fail('Destinataire introuvable.');}
 h.recipients=r;h.sentAt=new Date().toISOString();h.readBy=[];return h;}
function retract(s,id){const h=find(s,id);if(!h)fail('Document introuvable.');h.sentAt=null;h.recipients=[];h.readBy=[];return h;}
function addressedTo(h,charId){return !!h.sentAt&&!!charId&&(h.recipients==='all'||(Array.isArray(h.recipients)&&h.recipients.includes(charId)));}
function markRead(s,id,charId){const h=find(s,id);if(!h||!addressedTo(h,charId))fail('Document introuvable.');if(!h.readBy.includes(charId))h.readBy.push(charId);return h;}
function projected(s,u){return (Array.isArray(s.handouts)?s.handouts:[]).filter(h=>addressedTo(h,u.characterId)).map(h=>({id:h.id,title:h.title,text:h.text,hasImage:!!h.image,sentAt:h.sentAt,read:h.readBy.includes(u.characterId)}));}
module.exports={MAX,list,find,add,update,remove,send,retract,addressedTo,markRead,projected};

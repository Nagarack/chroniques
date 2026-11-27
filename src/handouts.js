/* Chroniques — documents du MJ pour les joueurs (lettres, indices, cartes au trésor…).
   Un document reste privé jusqu'à son envoi ; chaque joueur ne reçoit que ceux qui lui sont adressés. */
'use strict';
const MAX=60;
function fail(m){const e=new Error(m);e.status=400;throw e;}
function text(v,label,max,required){const s=String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();if(required&&!s)fail(label+' requis.');if(s.length>max)fail(label+' : '+max+' caractères maximum.');return s;}
function list(s){if(!Array.isArray(s.handouts))s.handouts=[];return s.handouts;}
function find(s,id){return (Array.isArray(s.handouts)?s.handouts:[]).find(h=>h.id===id)||null;}
function values(v){return {title:text(v?.title,'Titre',100,true),text:text(v?.text,'Texte',4000,false),lock:lockValues(v?.lock)};}
// 5.20 : document-énigme. Le texte et l’image restent cachés aux joueurs jusqu’à la bonne réponse ; les réponses attendues ne quittent jamais le serveur.
// Comparaison souple : sans accents, sans majuscules, sans ponctuation ni espaces (« Le Phare ! » = « le phare » = « LEPHARE »).
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/[^a-z0-9]+/g,'');
function lockValues(l){if(!l||typeof l!=='object')return null;const raw=Array.isArray(l.answers)?l.answers:String(l.answers??'').split(/[|\n;]/);
 const answers=[...new Set(raw.map(x=>text(x,'Réponse',80,false)).filter(x=>norm(x)))].slice(0,10);if(!answers.length)return null;
 return {question:text(l.question,'Question',200,false),answers};}
function answer(s,id,charId,given){const h=find(s,id);if(!h||!addressedTo(h,charId))fail('Document introuvable.');if(!h.lock)fail('Ce document n’est pas une énigme.');
 const t=text(given,'Réponse',120,true);if(h.solved)return {h,ok:true,already:true};
 h.attempts=Array.isArray(h.attempts)?h.attempts:[];h.attempts.push({charId,at:new Date().toISOString(),text:t});if(h.attempts.length>40)h.attempts.splice(0,h.attempts.length-40);
 const ok=h.lock.answers.some(a=>norm(a)===norm(t));if(ok)h.solved={by:charId,at:new Date().toISOString()};return {h,ok,already:false};}
const locked=h=>!!h.lock&&!h.solved;
function add(s,id,v){const arr=list(s);if(arr.length>=MAX)fail('Maximum '+MAX+' documents.');const h={id,...values(v),recipients:[],sentAt:null,readBy:[],solved:null,attempts:[]};arr.push(h);return h;}
function update(s,id,v){const h=find(s,id);if(!h)fail('Document introuvable.');const before=JSON.stringify(h.lock?.answers||null);Object.assign(h,values(v));if(JSON.stringify(h.lock?.answers||null)!==before){h.solved=null;h.attempts=[];}return h;}
function remove(s,id){const arr=list(s),i=arr.findIndex(h=>h.id===id);if(i<0)fail('Document introuvable.');return arr.splice(i,1)[0];}
// recipients : 'all' ou une liste d'identifiants de personnages existants.
function send(s,id,recipients){const h=find(s,id);if(!h)fail('Document introuvable.');const pcs=new Set((s.characters||[]).map(p=>p.id));
 let r;if(recipients==='all')r='all';else{if(!Array.isArray(recipients)||!recipients.length)fail('Choisissez au moins un destinataire.');r=[...new Set(recipients.map(String))];if(r.some(x=>!pcs.has(x)))fail('Destinataire introuvable.');}
 h.recipients=r;h.sentAt=new Date().toISOString();h.readBy=[];h.solved=null;h.attempts=[];return h;}
function retract(s,id){const h=find(s,id);if(!h)fail('Document introuvable.');h.sentAt=null;h.recipients=[];h.readBy=[];return h;}
function addressedTo(h,charId){return !!h.sentAt&&!!charId&&(h.recipients==='all'||(Array.isArray(h.recipients)&&h.recipients.includes(charId)));}
function markRead(s,id,charId){const h=find(s,id);if(!h||!addressedTo(h,charId))fail('Document introuvable.');if(!h.readBy.includes(charId))h.readBy.push(charId);return h;}
function projected(s,u){return (Array.isArray(s.handouts)?s.handouts:[]).filter(h=>addressedTo(h,u.characterId)).map(h=>{const base={id:h.id,title:h.title,sentAt:h.sentAt,read:h.readBy.includes(u.characterId)};
 if(locked(h))return {...base,text:'',hasImage:false,riddle:{question:h.lock.question||'',solved:false,tries:(h.attempts||[]).filter(a=>a.charId===u.characterId).length}};
 return {...base,text:h.text,hasImage:!!h.image,...(h.lock?{riddle:{question:h.lock.question||'',solved:true,by:h.solved?.by||null}}:{})};});}
module.exports={MAX,list,find,add,update,remove,send,retract,addressedTo,markRead,projected,answer,locked,norm};

/* Chroniques — « Étoiles et souhaits » (5.8) : retour de fin de séance. Le MJ ouvre un tour ; chaque joueur donne une
   étoile (ce qu’il a aimé) et un souhait (ce qu’il aimerait voir), et peut les modifier tant que le tour est ouvert.
   En mode anonyme, le MJ ne voit pas qui a écrit quoi : les noms ne sont jamais envoyés. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesFeedback=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const HISTORY=10;
function fail(m){const e=new Error(m);e.status=400;throw e;}
const clean=(v,label,max)=>{const t=String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();if(t.length>max)fail(label+' : '+max+' caractères maximum.');return t;};
function get(s){if(!s.feedback||typeof s.feedback!=='object')s.feedback={rounds:[]};if(!Array.isArray(s.feedback.rounds))s.feedback.rounds=[];return s.feedback;}
function current(s){const r=get(s).rounds[0];return r&&!r.closedAt?r:null;}
function open(s,id,v){if(current(s))fail('Un tour est déjà ouvert : clôturez-le d’abord.');const label=clean(v?.label,'Titre',80);
 const r={id,label,anonymous:v?.anonymous!==false,openedAt:new Date().toISOString(),entries:{}};const g=get(s);g.rounds.unshift(r);g.rounds=g.rounds.slice(0,HISTORY);return r;}
function send(s,userId,v){const r=current(s);if(!r)fail('Aucun retour de séance en cours.');const star=clean(v?.star,'Étoile',400),wish=clean(v?.wish,'Souhait',400);
 if(!star&&!wish){delete r.entries[userId];return null;}r.entries[userId]={star,wish,at:new Date().toISOString()};return r.entries[userId];}
function close(s){const r=current(s);if(!r)fail('Aucun retour de séance en cours.');r.closedAt=new Date().toISOString();return r;}
function remove(s,id){const g=get(s);const i=g.rounds.findIndex(r=>r.id===id);if(i<0)fail('Retour introuvable.');return g.rounds.splice(i,1)[0];}
// MJ : toutes les réponses (noms seulement hors anonymat), dans un ordre qui ne trahit pas l’auteur. Joueur : sa propre réponse.
function projected(s,u,nameOf){const g=s.feedback;if(!g)return undefined;const gm=u.role==='gm';
 const view=r=>{const out={id:r.id,label:r.label,anonymous:r.anonymous,openedAt:r.openedAt,closedAt:r.closedAt||null,count:Object.keys(r.entries||{}).length,mine:r.entries?.[u.id]||null};
  if(gm){const rows=Object.entries(r.entries||{}).map(([uid,e])=>({star:e.star,wish:e.wish,...(r.anonymous?{}:{name:nameOf?nameOf(uid):''})}));
   out.entries=r.anonymous?rows.sort((a,b)=>(a.star+a.wish).localeCompare(b.star+b.wish,'fr')):rows;}
  return out;};
 return {rounds:(g.rounds||[]).filter(r=>gm||!r.closedAt).map(view)};}
return {HISTORY,get,current,open,send,close,remove,projected};
});

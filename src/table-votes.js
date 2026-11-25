/* Chroniques — votes de table (5.5). Le MJ pose une question avec 2 à 8 réponses ; chaque compte de la campagne vote
   (et peut changer d’avis tant que le vote est ouvert). Vote anonyme : personne, pas même le MJ, ne voit qui a voté quoi. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesVotes=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const HISTORY=5;
function fail(m){const e=new Error(m);e.status=400;throw e;}
const clean=(v,label,max)=>{const t=String(v??'').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim();if(!t)fail(label+' obligatoire.');if(t.length>max)fail(label+' : '+max+' caractères maximum.');return t;};
function get(s){if(!s.votes||typeof s.votes!=='object')s.votes={active:null,history:[]};if(!Array.isArray(s.votes.history))s.votes.history=[];return s.votes;}
function start(s,id,v){const g=get(s);if(g.active)fail('Un vote est déjà en cours : terminez-le d’abord.');const question=clean(v?.question,'Question',140);
 const opts=(Array.isArray(v?.options)?v.options:[]).map(x=>String(x??'').trim()).filter(Boolean);if(opts.length<2||opts.length>8)fail('Proposez de 2 à 8 réponses.');
 const options=opts.map((t,i)=>({id:'o'+(i+1),text:clean(t,'Réponse',80)}));if(new Set(options.map(o=>o.text.toLocaleLowerCase('fr'))).size!==options.length)fail('Deux réponses identiques.');
 g.active={id,question,options,anonymous:v?.anonymous===true,ballots:{},startedAt:new Date().toISOString()};return g.active;}
function cast(s,userId,optionId){const a=get(s).active;if(!a)fail('Aucun vote en cours.');if(optionId===null){delete a.ballots[userId];return a;}if(!a.options.some(o=>o.id===optionId))fail('Réponse inconnue.');a.ballots[userId]=optionId;return a;}
function tally(a){const counts={};for(const o of a.options)counts[o.id]=0;for(const id of Object.values(a.ballots||{}))if(id in counts)counts[id]++;const max=Math.max(0,...Object.values(counts));
 return {counts,total:Object.values(counts).reduce((x,y)=>x+y,0),winners:max?a.options.filter(o=>counts[o.id]===max).map(o=>o.id):[]};}
function close(s){const g=get(s);const a=g.active;if(!a)fail('Aucun vote en cours.');const t=tally(a);g.history.unshift({...a,tally:t,closedAt:new Date().toISOString()});g.history=g.history.slice(0,HISTORY);g.active=null;return {vote:a,tally:t};}
function cancel(s){get(s).active=null;}
// Ce que voit chacun : décompte, son propre choix, et les noms seulement si le vote n’est pas anonyme.
function projected(s,userId,nameOf){const g=s.votes;if(!g)return undefined;const view=a=>{if(!a)return a;const t=a.tally||tally(a);const out={id:a.id,question:a.question,options:a.options,anonymous:a.anonymous,startedAt:a.startedAt,closedAt:a.closedAt,tally:t,mine:a.ballots?.[userId]??null};
  if(!a.anonymous){out.voters={};for(const [uid,oid] of Object.entries(a.ballots||{}))(out.voters[oid]=out.voters[oid]||[]).push(nameOf?nameOf(uid):'');}return out;};
 return {active:view(g.active),history:(g.history||[]).map(view)};}
return {get,start,cast,tally,close,cancel,projected};
});

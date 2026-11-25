/* Chroniques — tests et sauvegardes de groupe (5.4). Le MJ lance l’appel (compétence ou sauvegarde, DD, participants) ;
   chaque joueur lance son vrai d20, ajoute ses bonus et saisit le total. Test de groupe : réussi si au moins la moitié
   des participants réussissent. Sauvegarde de groupe : résultat de chacun (réussite / échec). */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesGroupChecks=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ABILITIES={str:'Force',dex:'Dextérité',con:'Constitution',int:'Intelligence',wis:'Sagesse',cha:'Charisme'};
const HISTORY=6;
function fail(m){const e=new Error(m);e.status=400;throw e;}
function get(s){if(!s.groupChecks||typeof s.groupChecks!=='object')s.groupChecks={active:null,history:[]};if(!Array.isArray(s.groupChecks.history))s.groupChecks.history=[];return s.groupChecks;}
function start(s,id,v){const g=get(s);if(g.active)fail('Un test de groupe est déjà en cours : terminez-le d’abord.');
 const kind=v?.kind==='save'?'save':'check';const label=String(v?.label??'').replace(/[\u0000-\u001f]/g,' ').trim();if(!label||label.length>60)fail('Indiquez la compétence ou la sauvegarde (60 caractères maximum).');
 const dc=Number(v?.dc);if(!Number.isInteger(dc)||dc<1||dc>40)fail('DD : nombre entier de 1 à 40.');
 const ids=[...new Set((Array.isArray(v?.ids)?v.ids:[]).map(String))].filter(x=>(s.characters||[]).some(p=>p.id===x));if(!ids.length)fail('Choisissez au moins un participant.');
 g.active={id,kind,label,dc,ids,showDc:v?.showDc===true,results:{},startedAt:new Date().toISOString()};return g.active;}
function answer(s,pcId,total){const g=get(s);const a=g.active;if(!a)fail('Aucun test de groupe en cours.');if(!a.ids.includes(pcId))fail('Ce personnage ne participe pas à ce test.');
 const n=Number(total);if(!Number.isInteger(n)||n<-10||n>60)fail('Total : nombre entier de -10 à 60 (d20 + bonus).');a.results[pcId]=n;return a;}
// Verdict : réussites individuelles et, pour un test, réussite du groupe si au moins la moitié réussit.
function verdict(a){const done=a.ids.filter(id=>a.results[id]!==undefined);const ok=done.filter(id=>a.results[id]>=a.dc);const need=Math.ceil(a.ids.length/2);
 return {answered:done.length,total:a.ids.length,successes:ok.length,failures:done.length-ok.length,need,complete:done.length===a.ids.length,groupSuccess:a.kind==='check'?ok.length>=need:null};}
function close(s){const g=get(s);const a=g.active;if(!a)fail('Aucun test de groupe en cours.');const v=verdict(a);g.history.unshift({...a,verdict:v,closedAt:new Date().toISOString()});g.history=g.history.slice(0,HISTORY);g.active=null;return {check:a,verdict:v};}
function cancel(s){get(s).active=null;}
// Joueurs : DD masqué si le MJ ne l’a pas montré ; seuls leurs propres totaux, et le nombre de réponses des autres.
function projected(s,myPcIds){const g=s.groupChecks;if(!g)return undefined;const hide=a=>{if(!a)return a;const own={};for(const id of myPcIds)if(a.results[id]!==undefined)own[id]=a.results[id];return {...a,dc:a.showDc?a.dc:null,results:own,answeredIds:Object.keys(a.results)};};
 return {active:hide(g.active),history:(g.history||[]).map(h=>({...hide(h),verdict:h.showDc?h.verdict:{...h.verdict,successes:null,failures:null,groupSuccess:h.verdict.groupSuccess}}))};}
return {ABILITIES,get,start,answer,verdict,close,cancel,projected};
});

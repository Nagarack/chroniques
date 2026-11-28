/* Chroniques — arcs des personnages (5.21) : un à trois objectifs personnels par héros, écrits par son joueur
   (« retrouver ma sœur »), que le MJ fait avancer au fil des séances. Un arc peut rester secret : seuls son joueur
   et le MJ le voient. Le MJ voit dans « Préparer la séance » depuis combien de séances un arc n’a pas bougé. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesArcs=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX=3,MAX_STEPS=12;
function fail(m){const e=new Error(m);e.status=400;throw e;}
const clean=(v,label,max,req)=>{const t=String(v??'').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim();if(req&&!t)fail(label+' requis.');if(t.length>max)fail(`${label} : ${max} caractères maximum.`);return t;};
const list=pc=>Array.isArray(pc?.arcs)?pc.arcs:[];
function find(pc,arcId){const a=list(pc).find(x=>x.id===arcId);if(!a)fail('Arc introuvable.');return a;}
function add(pc,id,v,now=new Date().toISOString()){if(!pc)fail('Personnage introuvable.');if(!Array.isArray(pc.arcs))pc.arcs=[];if(pc.arcs.length>=MAX)fail(`Au plus ${MAX} arcs par personnage.`);
 const a={id,text:clean(v?.text,'Objectif',160,true),secret:v?.secret===true,status:'open',createdAt:now,steps:[]};pc.arcs.push(a);return a;}
function update(pc,arcId,v){const a=find(pc,arcId);if(v&&'text' in v)a.text=clean(v.text,'Objectif',160,true);if(v&&'secret' in v)a.secret=v.secret===true;return a;}
function remove(pc,arcId){find(pc,arcId);pc.arcs=list(pc).filter(x=>x.id!==arcId);if(!pc.arcs.length)delete pc.arcs;}
// Réservé au MJ : « a avancé » (avec une note facultative), « accompli », « rouvrir ».
function progress(pc,arcId,step,note,now=new Date().toISOString()){const a=find(pc,arcId);
 if(step==='advance'){if(a.status==='done')fail('Cet arc est déjà accompli.');a.steps.push({at:now,note:clean(note,'Note',160,false)});if(a.steps.length>MAX_STEPS)a.steps.splice(0,a.steps.length-MAX_STEPS);}
 else if(step==='done'){a.status='done';a.doneAt=now;}else if(step==='reopen'){a.status='open';delete a.doneAt;}else fail('Étape inconnue.');return a;}
// Nombre de séances commencées depuis la dernière avancée (ou la création) de l’arc.
function sessionsSince(state,a){const ref=a.steps?.length?a.steps[a.steps.length-1].at:a.createdAt;const t=Date.parse(ref)||0;
 return [...(state.sessionHistory||[]),...(state.sessionStats?[state.sessionStats]:[])].filter(s=>Date.parse(s.startedAt)>t).length;}
const publicView=pc=>list(pc).filter(a=>!a.secret).map(a=>({...a,steps:a.steps.map(s=>({...s}))}));
return {MAX,list,add,update,remove,progress,sessionsSince,publicView};
});

/* Chroniques — maladies et poisons (5.5). Le MJ inflige une affliction (exemple du SRD 5.1 ou personnalisée) ;
   les sauvegardes se font avec de vrais dés : la fiche compte les réussites et les échecs saisis, jusqu’à la guérison. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesAfflictions=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const MAX=10;
function data(){return (typeof module==='object'&&module.exports&&typeof require==='function')?require('./data/srd-afflictions.js'):(root&&root.ChroniquesSRDAfflictions);}
function catalog(){const d=data();return d?d.items:[];}
function entry(ref){return catalog().find(x=>x.id===ref)||null;}
function fail(m){const e=new Error(m);e.status=400;throw e;}
const txt=(x,label,max)=>{const t=String(x??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();if(t.length>max)fail(label+' : '+max+' caractères maximum.');return t;};
function add(pc,id,v){const ref=String(v?.ref||'');const e=ref?entry(ref):null;if(ref&&!e)fail('Exemple inconnu.');const kind=e?e.kind:(v?.kind==='poison'?'poison':'disease');
 const name=e?e.id:txt(v?.name,'Nom',60);if(!name)fail('Donnez un nom à l’affliction.');let dc=v?.dc===''||v?.dc==null?(e?e.dc:null):Number(v.dc);if(dc!==null&&(!Number.isInteger(dc)||dc<1||dc>40))fail('DD : de 1 à 40.');
 pc.afflictions=Array.isArray(pc.afflictions)?pc.afflictions:[];if(pc.afflictions.length>=MAX)fail('Trop d’afflictions sur ce personnage.');
 const a={id,kind,ref:e?e.id:'',name,dc,note:txt(v?.note,'Note',200),successes:0,failures:0,since:new Date().toISOString()};pc.afflictions.push(a);return a;}
function find(pc,id){const a=(pc.afflictions||[]).find(x=>x.id===id);if(!a)fail('Affliction introuvable.');return a;}
// Sauvegarde du jour (ou de la période) : réussite ou échec, d’après le vrai dé.
function save(pc,id,success){const a=find(pc,id);if(success)a.successes++;else a.failures++;a.lastSave=new Date().toISOString();return a;}
function undoSave(pc,id,success){const a=find(pc,id);if(success&&a.successes>0)a.successes--;else if(!success&&a.failures>0)a.failures--;return a;}
function cure(pc,id){const list=pc.afflictions||[];const i=list.findIndex(x=>x.id===id);if(i<0)fail('Affliction introuvable.');const a=list.splice(i,1)[0];if(!list.length)delete pc.afflictions;return a;}
function view(a,lang){const e=a.ref?entry(a.ref):null;const t=e?(lang==='en'?e.en:e.fr):null;return {name:t?t.name:a.name,type:t?t.type:'',text:t?t.text:''};}
return {MAX,catalog,entry,add,save,undoSave,cure,view};
});

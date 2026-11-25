/* Chroniques — folie (règle optionnelle du SRD 5.1, 2014) (5.4). Le MJ impose une folie : le résultat du d100 et la durée
   (d10) sont lancés avec de vrais dés puis saisis ; l’effet vient des tables du SRD. Guérison par le MJ. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesMadness=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const KINDS={short:{label:'Folie passagère',dur:'1d10 minutes',unit:'minutes',mult:1},long:{label:'Folie persistante',dur:'1d10 × 10 heures',unit:'heures',mult:10},indefinite:{label:'Folie à durée illimitée',dur:'jusqu’à guérison',unit:'',mult:0}};
const MAX=10;
function tables(lang){const d=(typeof module==='object'&&module.exports&&typeof require==='function')?require('./data/srd-madness.js'):(root&&root.ChroniquesSRDMadness);return d?(lang==='en'?d.en:d.fr):null;}
function effect(kind,roll,lang){const t=tables(lang);const row=t&&t[kind]&&t[kind].find(r=>roll>=r[0]&&roll<=r[1]);return row?row[2]:'';}
function fail(m){const e=new Error(m);e.status=400;throw e;}
function add(pc,id,v){if(!KINDS[v?.kind])fail('Type de folie inconnu.');const roll=Number(v.roll);if(!Number.isInteger(roll)||roll<1||roll>100)fail('Résultat du d100 : de 1 à 100.');
 let duration=null;if(v.kind!=='indefinite'){const d=Number(v.duration);if(!Number.isInteger(d)||d<1||d>10)fail('Résultat du d10 : de 1 à 10.');duration=d*KINDS[v.kind].mult;}
 const note=String(v.note??'').replace(/[\u0000-\u001f]/g,' ').trim();if(note.length>140)fail('Note : 140 caractères maximum.');
 pc.madness=Array.isArray(pc.madness)?pc.madness:[];if(pc.madness.length>=MAX)fail('Trop de folies sur ce personnage.');const m={id,kind:v.kind,roll,duration,note,since:new Date().toISOString()};pc.madness.push(m);return m;}
function remove(pc,id){const list=Array.isArray(pc.madness)?pc.madness:[];const i=list.findIndex(x=>x.id===id);if(i<0)fail('Folie introuvable.');const m=list.splice(i,1)[0];if(!list.length)delete pc.madness;return m;}
function durationText(m){if(m.kind==='indefinite')return 'jusqu’à guérison';return m.duration+' '+KINDS[m.kind].unit;}
return {KINDS,MAX,tables,effect,add,remove,durationText};
});

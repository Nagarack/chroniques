/* Chroniques — tableau d’enquête (5.8). Le MJ prépare des indices (personnes, lieux, objets, événements, questions),
   les révèle au fil de la partie et les relie entre eux. Les joueurs voient les indices révélés et les liens entre
   indices révélés, et y notent leurs théories, visibles de toute la table. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesClues=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX=150,MAX_THEORIES=30,MAX_LINKS=12;
const TAGS={personne:'Personne',lieu:'Lieu',objet:'Objet',evenement:'Événement',question:'Question'};
const ICONS={personne:'👤',lieu:'📍',objet:'🗝',evenement:'⚡',question:'❓'};
function fail(m){const e=new Error(m);e.status=400;throw e;}
const clean=(v,label,max,required)=>{const t=String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();if(required&&!t)fail(label+' obligatoire.');if(t.length>max)fail(label+' : '+max+' caractères maximum.');return t;};
function list(s){if(!Array.isArray(s.clues))s.clues=[];return s.clues;}
function find(s,id){const c=list(s).find(x=>x.id===id);if(!c)fail('Indice introuvable.');return c;}
function values(v){return {title:clean(v?.title,'Titre',80,true),text:clean(v?.text,'Description',600,false),gmNote:clean(v?.gmNote,'Note du MJ',400,false),tag:Object.hasOwn(TAGS,v?.tag)?v.tag:'question'};}
function add(s,id,v){if(list(s).length>=MAX)fail('Maximum '+MAX+' indices.');const c={id,...values(v),revealed:v?.revealed===true,links:[],theories:[],createdAt:new Date().toISOString()};if(c.revealed)c.revealedAt=c.createdAt;s.clues.push(c);return c;}
function update(s,id,v){const c=find(s,id);Object.assign(c,values(v));return c;}
function reveal(s,id,on){const c=find(s,id);c.revealed=on===true;if(c.revealed)c.revealedAt=new Date().toISOString();else delete c.revealedAt;return c;}
function remove(s,id){const i=list(s).findIndex(x=>x.id===id);if(i<0)fail('Indice introuvable.');for(const c of s.clues)c.links=(c.links||[]).filter(x=>x!==id);return s.clues.splice(i,1)[0];}
// Lien symétrique entre deux indices ; un second appel le retire.
function link(s,a,b){if(a===b)fail('Un indice ne se relie pas à lui-même.');const x=find(s,a),y=find(s,b);const on=!(x.links||[]).includes(b);
 if(on&&((x.links||[]).length>=MAX_LINKS||(y.links||[]).length>=MAX_LINKS))fail('Maximum '+MAX_LINKS+' liens par indice.');
 for(const [p,q] of [[x,b],[y,a]]){p.links=(p.links||[]).filter(k=>k!==q);if(on)p.links.push(q);}return on;}
function theory(s,id,thId,author,text){const c=find(s,id);if(!c.revealed)fail('Indice pas encore révélé.');const t=clean(text,'Théorie',280,true);if((c.theories||[]).length>=MAX_THEORIES)fail('Maximum '+MAX_THEORIES+' théories par indice.');
 const th={id:thId,by:author.id,name:String(author.name||'').slice(0,60),text:t,at:new Date().toISOString()};(c.theories=c.theories||[]).push(th);return th;}
function theoryRemove(s,id,thId){const c=find(s,id);const i=(c.theories||[]).findIndex(t=>t.id===thId);if(i<0)fail('Théorie introuvable.');return c.theories.splice(i,1)[0];}
// Joueurs : indices révélés seulement, liens vers des indices révélés, jamais la note du MJ.
function projected(s,userId){const shown=(s.clues||[]).filter(c=>c.revealed);const ids=new Set(shown.map(c=>c.id));
 return shown.map(({gmNote,...c})=>({...c,links:(c.links||[]).filter(k=>ids.has(k)),theories:(c.theories||[]).map(({by,...t})=>({...t,mine:by===userId}))}));}
return {MAX,TAGS,ICONS,list,find,add,update,reveal,remove,link,theory,theoryRemove,projected};
});

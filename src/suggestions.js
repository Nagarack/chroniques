'use strict';
/* Chroniques — suggestions d’amélioration (5.9). Chaque compte (MJ ou joueur) propose une idée ; l’administrateur
   de ce serveur (le compte créé à l’installation) les lit toutes, les classe (nouvelle, retenue, faite, non retenue)
   et peut ajouter une réponse que l’auteur voit avec sa suggestion. Données gardées hors des campagnes. */
const MAX=1000,PER_USER=200;
const STATUS={nouvelle:'Nouvelle',retenue:'Retenue',faite:'Faite',non_retenue:'Non retenue'};
const CATEGORIES={combat:'Combat',cartes:'Cartes',fiches:'Fiches et inventaire',mj:'Outils du MJ',interface:'Interface et confort',autre:'Autre'};
function fail(m){const e=new Error(m);e.status=400;throw e;}
const clean=(v,label,max,min=0)=>{const t=String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();if(t.length<min)fail(min>1?label+' : '+min+' caractères au moins.':label+' obligatoire.');if(t.length>max)fail(label+' : '+max+' caractères maximum.');return t;};
function list(db){if(!Array.isArray(db.suggestions))db.suggestions=[];return db.suggestions;}
function add(db,id,user,v,{campaign='',version=''}={}){const all=list(db);if(all.length>=MAX)fail('Trop de suggestions enregistrées : l’administrateur doit d’abord faire du tri.');
 if(all.filter(x=>x.userId===user.id).length>=PER_USER)fail('Vous avez atteint '+PER_USER+' suggestions.');
 const s={id,at:new Date().toISOString(),userId:user.id,author:String(user.name||'').slice(0,60),campaign:String(campaign||'').slice(0,100),version:String(version||'').slice(0,20),
  category:Object.hasOwn(CATEGORIES,v?.category)?v.category:'autre',title:clean(v?.title,'Titre',100,1),text:clean(v?.text,'Description',2000,5),status:'nouvelle',reply:'',updatedAt:null};
 all.unshift(s);return s;}
function find(db,id){const s=list(db).find(x=>x.id===id);if(!s)fail('Suggestion introuvable.');return s;}
function setStatus(db,id,status,reply){const s=find(db,id);if(!Object.hasOwn(STATUS,status))fail('Statut inconnu.');s.status=status;if(reply!==undefined)s.reply=clean(reply,'Réponse',600);s.updatedAt=new Date().toISOString();return s;}
function remove(db,id){const all=list(db);const i=all.findIndex(x=>x.id===id);if(i<0)fail('Suggestion introuvable.');return all.splice(i,1)[0];}
function counts(db){const out={total:0};for(const k of Object.keys(STATUS))out[k]=0;for(const s of list(db)){out.total++;out[s.status]=(out[s.status]||0)+1;}return out;}
// L’auteur voit ses suggestions, leur statut et la réponse ; jamais celles des autres.
function forUser(db,userId){return list(db).filter(x=>x.userId===userId).map(({userId,...s})=>({...s}));}
function forAdmin(db){return list(db).map(({userId,...s})=>({...s}));}
module.exports={MAX,STATUS,CATEGORIES,list,add,find,setStatus,remove,counts,forUser,forAdmin};

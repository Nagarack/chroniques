/* Chroniques — objets maison du MJ : modèles réutilisables (jamais envoyés aux joueurs tant qu'ils ne sont pas donnés).
   Donner un objet en crée une copie indépendante dans l'inventaire du personnage ou dans la réserve de butin. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesHomebrewItems=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const I=(root&&root.ChroniquesInventory)||(typeof require==='function'?require('./inventory.js'):null);
const A=(root&&root.ChroniquesArt)||(typeof require==='function'?require('./art-catalog.js'):null);
const MAX=150;
const RARITIES=['','commun','peu commun','rare','très rare','légendaire','artefact'];
const RARITY_LABELS={'':'Sans rareté',commun:'Commun','peu commun':'Peu commun',rare:'Rare','très rare':'Très rare','légendaire':'Légendaire',artefact:'Artefact'};
function fail(m){const e=new Error(m);e.status=400;throw e;}
function list(s){if(!s.gmLibrary||typeof s.gmLibrary!=='object'||Array.isArray(s.gmLibrary))s.gmLibrary={templates:[],encounters:[]};if(!Array.isArray(s.gmLibrary.items))s.gmLibrary.items=[];return s.gmLibrary.items;}
function find(s,id){return (s.gmLibrary&&Array.isArray(s.gmLibrary.items)?s.gmLibrary.items:[]).find(x=>x.id===id)||null;}
// Mention visible des joueurs ajoutée devant la description : « Rare · harmonisation requise ».
function tagLine(v){return [v.rarity?RARITY_LABELS[v.rarity]:'',v.attunement?'harmonisation requise':''].filter(Boolean).join(' · ');}
function validate(v){if(!v||typeof v!=='object'||Array.isArray(v))fail('Objet invalide.');
 const rarity=RARITIES.includes(v.rarity)?v.rarity:fail('Rareté inconnue.');
 const base=I.validate({name:v.name,description:v.description??'',category:v.category||'other',quantity:1,weight:v.weight??0,chargesMax:v.chargesMax??0});
 const notes=String(v.notes??'');if(notes.length>1000)fail('Notes du MJ : 1000 caractères maximum.');
 const icon=String(v.icon||'');if(icon&&!(A&&A.get(icon,'item')))fail('Icône inconnue.');
 const out={name:base.name,category:base.category,rarity,attunement:!!v.attunement,weight:base.weight,chargesMax:base.chargesMax,description:base.description,notes:notes.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,''),icon};
 const tag=tagLine(out);if(tag&&(tag.length+3+out.description.length)>280)fail('Description trop longue : avec la rareté, 280 caractères au maximum ('+(277-tag.length)+' pour le texte).');
 return out;}
function add(s,id,v){const arr=list(s);if(arr.length>=MAX)fail('Bibliothèque limitée à '+MAX+' objets.');if(!/^hb-[A-Za-z0-9_-]{6,40}$/.test(id))fail('Identifiant invalide.');const item={id,...validate(v)};arr.push(item);return item;}
function update(s,id,v){const item=find(s,id);if(!item)fail('Objet maison introuvable.');Object.assign(item,validate(v));return item;}
function remove(s,id){const arr=list(s),i=arr.findIndex(x=>x.id===id);if(i<0)fail('Objet maison introuvable.');return arr.splice(i,1)[0];}
// Valeurs d'inventaire (copie indépendante) : les notes du MJ ne sont jamais copiées.
function toInventory(item,quantity=1){const tag=tagLine(item);return {name:item.name,description:(tag?tag+(item.description?' — '+item.description:''):item.description).slice(0,280),category:item.category,quantity,weight:item.weight,chargesMax:item.chargesMax,charges:item.chargesMax,equipped:false,attuned:false};}
// Point de départ depuis le catalogue SRD (le MJ peut ensuite tout modifier).
const SRD_RARITY={'artéfact':'artefact','Artéfact':'artefact','Artefact':'artefact'};
function fromSrd(e){const rarity=SRD_RARITY[e.rarity]||(RARITIES.includes(String(e.rarity||'').toLowerCase())?String(e.rarity).toLowerCase():'');const attunement=/harmonisation|attunement/i.test(e.full||e.short||'');
 const tag=tagLine({rarity,attunement});const room=tag?277-tag.length:280;return {name:e.name.slice(0,85),category:e.category||'other',rarity,attunement,weight:Math.round((Number(e.weight)||0)*100)/100,chargesMax:0,description:String(e.short||'').replace(/^Objet magique[^.]*\.\s*/,'').slice(0,room),notes:(String(e.full||'').length>String(e.short||'').length+20?String(e.full).slice(0,1000):''),icon:''};}
return {MAX,RARITIES,RARITY_LABELS,list,find,validate,add,update,remove,toInventory,fromSrd,tagLine};
});

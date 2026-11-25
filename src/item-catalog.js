/* Chroniques — catalogue d'objets SRD (équipement et objets magiques), chargé à la demande.
   Données : System Reference Document 5.1 (Wizards of the Coast), licence CC BY 4.0. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesItemCatalog=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
let DATA=null,loading=null;
function shape(row,kind){const [index,name,nameEn,category,weight,short,rarity,full,alias]=row;return Object.freeze({id:kind+':'+index,kind,name,nameEn,category,weight:Number(weight)||0,short:short||'',rarity:rarity||'',full:full||'',alias:alias||''});}
function build(raw){const mg=(raw.magic||[]).map(r=>shape(r,'mg')),seen=new Set(mg.map(e=>e.nameEn.toLowerCase()));const uniq=new Set();return [...(raw.equipment||[]).map(r=>shape(r,'eq')).filter(e=>!seen.has(e.nameEn.toLowerCase())),...mg].filter(e=>{const k=(e.name+'|'+e.nameEn).toLowerCase();if(uniq.has(k))return false;uniq.add(k);return true;});}
function loaded(){return DATA!==null;}
function load(){if(DATA)return Promise.resolve(DATA);if(loading)return loading;
 loading=new Promise((ok,ko)=>{
  if(typeof window==='undefined'||typeof document==='undefined'){try{DATA=build(require('./data/srd-items.js'));ok(DATA);}catch(e){ko(e);}return;}
  const EN=(typeof window!=='undefined'&&window.ChroniquesI18n&&window.ChroniquesI18n.lang==='en'),G=EN?'ChroniquesSRDItemsEn':'ChroniquesSRDItems';// 5.2 : noms et descriptions anglais si l'interface est en anglais.
  if(window[G]){DATA=build(window[G]);ok(DATA);return;}
  const sc=document.createElement('script');sc.src=EN?'/src/data/srd-items.en.js':'/src/data/srd-items.js';sc.onload=()=>{DATA=build(window[G]||{});ok(DATA);};sc.onerror=()=>{loading=null;ko(new Error('Catalogue d’objets indisponible.'));};document.head.appendChild(sc);
 });return loading;}
const norm=s=>String(s||'').toLocaleLowerCase('fr').normalize('NFD').replace(/[̀-ͯ]/g,'');
// Recherche sur le nom français et le nom anglais ; les débuts de nom passent en premier.
function search(q,limit=30){if(!DATA)return [];const n=norm(q).trim();if(!n)return [];
 const scored=[];for(const e of DATA){const a=norm(e.name),b=norm(e.nameEn),c=norm(e.alias);const i=Math.min(...[a.indexOf(n),b.indexOf(n),c?c.indexOf(n):-1].filter(x=>x>=0).concat([Infinity]));if(i!==Infinity)scored.push([i===0?0:1,e.kind==='eq'?0:1,e.name,e]);}
 return scored.sort((x,y)=>x[0]-y[0]||x[1]-y[1]||x[2].localeCompare(y[2],'fr')).slice(0,limit).map(x=>x[3]);}
function get(id){return DATA?DATA.find(e=>e.id===id)||null:null;}
// Valeurs prêtes pour l'inventaire (description limitée à 280 caractères par le modèle d'objet).
function toItemValues(e){return {name:e.name.slice(0,85),description:e.short.slice(0,280),category:e.category||'other',quantity:1,weight:Math.round(e.weight*100)/100,chargesMax:0,charges:0,equipped:false,attuned:false};}
return {load,loaded,search,get,toItemValues};
});

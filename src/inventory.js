/* Chroniques V2.6 — inventaire manuel et trésor partagé, aucun jet virtuel. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.ChroniquesInventory=api;})(typeof window!=='undefined'?window:null,function(){
'use strict';
const CATEGORIES=['weapon','armor','potion','consumable','tool','treasure','other'];
const LABELS={weapon:'Arme',armor:'Armure / équipement',potion:'Potion',consumable:'Consommable',tool:'Outil',treasure:'Trésor',other:'Divers'};
const MONEY=['cp','sp','ep','gp','pp'];
function integer(n,min,max,label){if(!Number.isSafeInteger(n)||n<min||n>max)throw new Error(label+' : nombre invalide.');return n;}
function text(s,label,max=100,optional=false){if(typeof s!=='string'||s.trim().length>(max)||(!optional&&!s.trim()))throw new Error(label+' : valeur invalide.');return s.trim();}
function list(pc){return Array.isArray(pc.inventoryItems)?pc.inventoryItems:[];}
function items(pc){pc.inventoryItems??=[];return pc.inventoryItems;}
function validate(v){if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Objet invalide.');const category=v.category||'other';if(!CATEGORIES.includes(category))throw new Error('Catégorie invalide.');
 const qty=integer(v.quantity??1,1,999,'Quantité'),weight=Number(v.weight??0);
 if(!Number.isFinite(weight)||weight<0||weight>10000||Math.round(weight*100)!==weight*100)throw new Error('Poids invalide.');
 const chargesMax=integer(v.chargesMax??0,0,999,'Charges maximum'),charges=integer(v.charges??chargesMax,0,chargesMax,'Charges restantes');
 // 5.4 : recharge des charges (aube, repos long, repos court) ; dés de recharge lancés à la table (ex. « 1d6+1 ») ou recharge complète.
 const recharge=RECHARGE.includes(v.recharge)?v.recharge:'';const rechargeDice=String(v.rechargeDice??'').replace(/\s+/g,'').toLowerCase();
 if(rechargeDice&&!/^(\d{1,2}d\d{1,3}([+-]\d{1,3})?|\d{1,3})$/.test(rechargeDice))throw new Error('Charges récupérées : par exemple 1d6+1, 1d3 ou 2 (vide = toutes).');
 const out={name:text(v.name,'Nom',85),description:text(v.description??'','Description',280,true),category,quantity:qty,weight,chargesMax,charges,equipped:Boolean(v.equipped),attuned:Boolean(v.attuned)};
 if(chargesMax&&recharge){out.recharge=recharge;if(rechargeDice)out.rechargeDice=rechargeDice;}return out;
}
const RECHARGE=['dawn','long','short'];
// Après un repos : recharge complète automatique, ou objet « à recharger » (dés à lancer) si une formule est indiquée.
function restRecharge(pc,type){const done=[],pending=[];for(const it of list(pc)){if(!it.recharge||!it.chargesMax||it.charges>=it.chargesMax)continue;
  const ok=type==='long'?['dawn','long','short'].includes(it.recharge):type==='short'&&it.recharge==='short';if(!ok)continue;
  if(it.rechargeDice&&/d/.test(it.rechargeDice)){it.rechargePending=true;pending.push(it);}else{const n=it.rechargeDice?Number(it.rechargeDice):it.chargesMax;it.charges=Math.min(it.chargesMax,it.charges+n);delete it.rechargePending;done.push(it);}}
 return {done,pending};}
function rechargeRange(dice){const m=/^(\d+)d(\d+)([+-]\d+)?$/.exec(String(dice||''));if(!m)return null;const n=+m[1],f=+m[2],b=+(m[3]||0);return [n+b,n*f+b];}
function recharge(pc,id,amount){const it=list(pc).find(x=>x.id===id);if(!it)throw new Error('Objet introuvable.');if(amount===null){delete it.rechargePending;return it;}
 const r=rechargeRange(it.rechargeDice);const n=Number(amount);if(!Number.isInteger(n)||n<0||(r&&(n<r[0]||n>r[1])))throw new Error(r?'Total attendu entre '+r[0]+' et '+r[1]+'.':'Nombre invalide.');
 it.charges=Math.min(it.chargesMax,it.charges+n);delete it.rechargePending;return it;}
function add(pc,id,v){const arr=items(pc);if(arr.length>=70)throw new Error('Maximum 70 objets par personnage.');if(arr.some(x=>x.id===id))throw new Error('Identifiant dupliqué.');const item={id,...validate(v)};arr.push(item);return item;}
function update(pc,id,v){const item=list(pc).find(x=>x.id===id);if(!item)throw new Error('Objet introuvable.');const next=validate(v);if(item.chargesMax===0&&next.chargesMax===0)next.charges=0;Object.assign(item,next);return item;}
function adjust(pc,id,field,delta){const item=list(pc).find(x=>x.id===id);if(!item)throw new Error('Objet introuvable.');if(!['quantity','charges'].includes(field))throw new Error('Champ invalide.');integer(delta,-100,100,'Variation');if(delta===0)throw new Error('Variation nulle.');const max=field==='quantity'?999:(item.chargesMax||0);const min=field==='quantity'?0:0;const next=integer((field==='quantity'?(item.quantity??1):(item.charges??0))+delta,min,max,'Nouvelle quantité');item[field]=next;return item;}
function money(pc,coins){if(!coins||typeof coins!=='object'||Array.isArray(coins)||Object.keys(coins).some(k=>!MONEY.includes(k)))throw new Error('Monnaie invalide.');pc.coins??={};for(const k of MONEY){pc.coins[k]=integer(coins[k]??0,0,999999,'Monnaie '+k);}return pc.coins;}
function stash(state){if(!Array.isArray(state.lootStash))state.lootStash=[];return state.lootStash;}
function lootAdd(state,id,v){const arr=stash(state);if(arr.length>=100)throw new Error('Maximum 100 lots de trésor.');const item={id,...validate(v)};arr.push(item);return item;}
function lootRemove(state,id){const arr=stash(state),i=arr.findIndex(x=>x.id===id);if(i<0)throw new Error('Lot introuvable.');return arr.splice(i,1)[0];}
function give(state,pc,lootId,newId,quantity){const arr=stash(state),source=arr.find(x=>x.id===lootId);if(!source)throw new Error('Lot introuvable.');integer(quantity,1,999,'Quantité attribuée');if(quantity>source.quantity)throw new Error('Quantité insuffisante.');const item=add(pc,newId,{...source,quantity});source.quantity-=quantity;if(source.quantity===0)arr.splice(arr.indexOf(source),1);return item;}
return {CATEGORIES,LABELS,MONEY,RECHARGE,restRecharge,rechargeRange,recharge,list,items,validate,add,update,adjust,money,stash,lootAdd,lootRemove,give};
});

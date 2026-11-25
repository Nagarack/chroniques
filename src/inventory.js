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
 if(chargesMax&&recharge){out.recharge=recharge;if(rechargeDice)out.rechargeDice=rechargeDice;}
 // 5.6 : contenant (sac, coffre, sac sans fond…) : capacité en kg ; holdMagic = le poids du contenu ne compte pas.
 const capacity=Number(v.capacity??0);if(!Number.isFinite(capacity)||capacity<0||capacity>2000)throw new Error('Capacité : de 0 à 2 000 kg.');
 if(capacity>0){out.capacity=Math.round(capacity*100)/100;if(v.holdMagic===true)out.holdMagic=true;}
 return out;
}
const OPTIONAL=['recharge','rechargeDice','capacity','holdMagic'];
function isContainer(it){return !!(it&&Number(it.capacity)>0);}
function contents(pc,cid){return list(pc).filter(x=>x.in===cid);}
function contentWeight(pc,cid){return Math.round(contents(pc,cid).reduce((n,x)=>n+(Number(x.weight)||0)*(Number(x.quantity)||0),0)*100)/100;}
// Objets dont le poids ne compte pas (rangés dans un contenant magique).
function weightless(pc,it){if(!it||!it.in)return false;const c=list(pc).find(x=>x.id===it.in);return !!(c&&c.holdMagic&&isContainer(c));}
function release(pc,cid){for(const x of list(pc))if(x.in===cid)delete x.in;}
function move(pc,itemId,into){const it=list(pc).find(x=>x.id===itemId);if(!it)throw new Error('Objet introuvable.');
 if(!into){delete it.in;return it;}const c=list(pc).find(x=>x.id===into);if(!c||!isContainer(c))throw new Error('Contenant introuvable.');if(c.id===it.id)throw new Error('Un objet ne se range pas dans lui-même.');
 if(isContainer(it))throw new Error('Un contenant ne se range pas dans un autre.');if(it.equipped||it.attuned)throw new Error('Retirez d’abord l’objet (équipé ou harmonisé).');
 const w=Math.round((contentWeight(pc,c.id)-(it.in===c.id?(Number(it.weight)||0)*(Number(it.quantity)||0):0)+(Number(it.weight)||0)*(Number(it.quantity)||0))*100)/100;
 if(w>c.capacity)throw new Error('Plus de place : '+String(w).replace('.',',')+' kg pour '+String(c.capacity).replace('.',',')+' kg de capacité.');it.in=c.id;return it;}
const RECHARGE=['dawn','long','short'];
// 5.5 : objets mystérieux. name/description = ce que voit le joueur ; secret = vraie nature (MJ seulement).
function setSecret(item,v){if(v===null){delete item.secret;delete item.unidentified;delete item.curseRevealed;return item;}
 const t=(x,label,max)=>{const r=String(x??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();if(r.length>max)throw new Error(label+' : '+max+' caractères maximum.');return r;};
 const name=t(v?.name,'Vrai nom',85),description=t(v?.description,'Vraie description',280),curse=t(v?.curse,'Malédiction',280);
 if(!name&&!curse)throw new Error('Indiquez le vrai nom ou la malédiction.');item.secret={name,description,curse};item.unidentified=!!name;if(!curse)delete item.curseRevealed;return item;}
function identify(item){if(!item.secret||!item.unidentified)throw new Error('Cet objet est déjà identifié.');item.name=item.secret.name;if(item.secret.description)item.description=item.secret.description;item.unidentified=false;
 if(!item.secret.curse)delete item.secret;return item;}
function revealCurse(item){if(!item.secret?.curse)throw new Error('Cet objet n’est pas maudit.');item.curseRevealed=true;return item;}
function liftCurse(item){if(!item.secret?.curse)throw new Error('Cet objet n’est pas maudit.');item.secret.curse='';delete item.curseRevealed;if(!item.unidentified)delete item.secret;return item;}
// Objet maudit porté ou harmonisé : impossible de s’en séparer (sauf MJ).
function curseLocked(item){return !!(item&&item.secret&&item.secret.curse&&(item.attuned||item.equipped));}
function playerView(item){const out={...item};const s=item.secret;delete out.secret;if(s&&s.curse&&item.curseRevealed)out.curse=s.curse;return out;}
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
function update(pc,id,v){const item=list(pc).find(x=>x.id===id);if(!item)throw new Error('Objet introuvable.');const next=validate(v);if(item.chargesMax===0&&next.chargesMax===0)next.charges=0;for(const k of OPTIONAL)if(!(k in next))delete item[k];if(next.equipped||next.attuned)delete item.in;Object.assign(item,next);if(!isContainer(item))release(pc,item.id);else if(item.in)delete item.in;return item;}
function adjust(pc,id,field,delta){const item=list(pc).find(x=>x.id===id);if(!item)throw new Error('Objet introuvable.');if(!['quantity','charges'].includes(field))throw new Error('Champ invalide.');integer(delta,-100,100,'Variation');if(delta===0)throw new Error('Variation nulle.');const max=field==='quantity'?999:(item.chargesMax||0);const min=field==='quantity'?0:0;const next=integer((field==='quantity'?(item.quantity??1):(item.charges??0))+delta,min,max,'Nouvelle quantité');item[field]=next;return item;}
function money(pc,coins){if(!coins||typeof coins!=='object'||Array.isArray(coins)||Object.keys(coins).some(k=>!MONEY.includes(k)))throw new Error('Monnaie invalide.');pc.coins??={};for(const k of MONEY){pc.coins[k]=integer(coins[k]??0,0,999999,'Monnaie '+k);}return pc.coins;}
function stash(state){if(!Array.isArray(state.lootStash))state.lootStash=[];return state.lootStash;}
function lootAdd(state,id,v){const arr=stash(state);if(arr.length>=100)throw new Error('Maximum 100 lots de trésor.');const item={id,...validate(v)};arr.push(item);return item;}
function lootRemove(state,id){const arr=stash(state),i=arr.findIndex(x=>x.id===id);if(i<0)throw new Error('Lot introuvable.');return arr.splice(i,1)[0];}
function give(state,pc,lootId,newId,quantity){const arr=stash(state),source=arr.find(x=>x.id===lootId);if(!source)throw new Error('Lot introuvable.');integer(quantity,1,999,'Quantité attribuée');if(quantity>source.quantity)throw new Error('Quantité insuffisante.');const item=add(pc,newId,{...source,quantity});source.quantity-=quantity;if(source.quantity===0)arr.splice(arr.indexOf(source),1);return item;}
return {isContainer,contents,contentWeight,weightless,release,move,CATEGORIES,LABELS,MONEY,RECHARGE,setSecret,identify,revealCurse,liftCurse,curseLocked,playerView,restRecharge,rechargeRange,recharge,list,items,validate,add,update,adjust,money,stash,lootAdd,lootRemove,give};
});

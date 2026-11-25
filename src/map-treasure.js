/* Chroniques V2.7 — Coffres et trésors associés aux repères. Aucun dé virtuel. */
'use strict';
const CM=require('./campaign-maps');
const I=require('./inventory');
const MAX_LOTS=30;
function bad(msg){throw new Error(msg);}
function pinAt(state,mapId,pinId){
 const pin=CM.markerRead(state,mapId,pinId);
 if(!pin)bad('Repère introuvable.');
 return pin;
}
function list(pin){return Array.isArray(pin.loot)?pin.loot:[];}
function write(pin){if(!Array.isArray(pin.loot))pin.loot=[];return pin.loot;}
function qty(source,amount){if(!Number.isSafeInteger(amount)||amount<1||amount>999)bad('Quantité invalide.');if(amount>(source.quantity??1))bad('Quantité insuffisante.');return amount;}
function ensureSlot(pin){if(list(pin).length>=MAX_LOTS)bad('Maximum 30 lots par repère.');}
function item(pin,lotId){const lot=list(pin).find(x=>x.id===lotId);if(!lot)bad('Objet introuvable dans ce repère.');return lot;}
function add(state,mapId,pinId,id,values){const pin=pinAt(state,mapId,pinId);ensureSlot(pin);const data=I.validate(values);const lot={id,...data};write(pin).push(lot);return lot;}
function fromStash(state,mapId,pinId,stashId,id,amount){
 const pin=pinAt(state,mapId,pinId);ensureSlot(pin);
 const stash=I.stash(state),source=stash.find(x=>x.id===stashId);
 if(!source)bad('Trésor de campagne introuvable.');qty(source,amount);
 const lot={...source,id,quantity:amount,equipped:false,attuned:false};
 write(pin).push(lot);source.quantity-=amount;
 if(source.quantity===0)stash.splice(stash.indexOf(source),1);
 return lot;
}
function toCharacter(state,mapId,pinId,lotId,pc,newId,amount){
 const pin=pinAt(state,mapId,pinId),source=item(pin,lotId);qty(source,amount);
 const received=I.add(pc,newId,{...source,quantity:amount,equipped:false,attuned:false});
 source.quantity-=amount;
 if(source.quantity===0)write(pin).splice(list(pin).indexOf(source),1);
 return received;
}
function toStash(state,mapId,pinId,lotId,newId,amount){
 const pin=pinAt(state,mapId,pinId),source=item(pin,lotId);qty(source,amount);
 I.lootAdd(state,newId,{...source,quantity:amount,equipped:false,attuned:false});
 source.quantity-=amount;
 if(source.quantity===0)write(pin).splice(list(pin).indexOf(source),1);
}
function remove(state,mapId,pinId,lotId){const pin=pinAt(state,mapId,pinId),idx=list(pin).findIndex(x=>x.id===lotId);if(idx<0)bad('Lot introuvable.');return write(pin).splice(idx,1)[0];}
function reveal(state,mapId,pinId,value){if(typeof value!=='boolean')bad('Visibilité du contenu invalide.');const pin=pinAt(state,mapId,pinId);pin.lootRevealed=value;return pin;}
function publicSummary(pin){return pin.lootRevealed===true?list(pin).map(x=>({name:String(x.name||'Objet'),quantity:Number(x.quantity??1)})):null;}
module.exports={MAX_LOTS,pinAt,list,add,fromStash,toCharacter,toStash,remove,reveal,publicSummary};

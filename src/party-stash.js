/* Chroniques — coffre commun du groupe : objets et pièces que chaque joueur peut déposer ou reprendre.
   Le MJ peut y ajouter des objets, en retirer, ou réserver les retraits à lui seul (« le MJ distribue »).
   Tout le groupe voit le contenu du coffre ; chaque mouvement est écrit dans le journal. */
'use strict';
const I=require('./inventory.js');
const MAX_ITEMS=70;
function fail(m,status=400){const e=new Error(m);e.status=status;throw e;}
function get(s){if(!s.partyStash||typeof s.partyStash!=='object')s.partyStash={inventoryItems:[],coins:{},withdraw:'all'};
 const st=s.partyStash;if(!Array.isArray(st.inventoryItems))st.inventoryItems=[];if(!st.coins||typeof st.coins!=='object')st.coins={};if(!['all','gm'].includes(st.withdraw))st.withdraw='all';return st;}
const qty=(v,max)=>{const n=v==null?1:Number(v);if(!Number.isSafeInteger(n)||n<1||n>999)fail('Quantité invalide.');if(n>max)fail('Quantité insuffisante.');return n;};
// Déplace `n` exemplaires d'un objet d'un conteneur à l'autre ; renvoie {item,newId,whole}.
function move(from,to,itemId,n,newId){const item=I.list(from).find(x=>x.id===itemId);if(!item)fail('Objet introuvable.');
 const count=qty(n,item.quantity??1);const whole=count===(item.quantity??1);
 // Un objet identique déjà présent (même nom, même catégorie, sans charges) est simplement empilé.
 const same=I.list(to).find(x=>x.name===item.name&&x.category===item.category&&!x.chargesMax&&!item.chargesMax&&(x.notes||'')===(item.notes||'')&&(x.description||'')===(item.description||''));
 if(same)same.quantity=Math.min(9999,(same.quantity??1)+count);
 else{if(I.list(to).length>=MAX_ITEMS)fail('Coffre ou sac plein (70 objets différents).');const {id,equipped,attuned,...rest}=item;try{I.add(to,newId,{...rest,quantity:count,equipped:false,attuned:false});}catch(e){fail(e.message);}}
 if(whole)from.inventoryItems=I.list(from).filter(x=>x.id!==item.id);else item.quantity-=count;
 return {item,count,whole,newId:same?null:newId,stackedId:same?same.id:null};}
function deposit(s,pc,itemId,n,newId){return move(pc,get(s),String(itemId||''),n,newId);}
function withdraw(s,pc,itemId,n,newId,isGm){const st=get(s);if(st.withdraw==='gm'&&!isGm)fail('Le MJ distribue lui-même le contenu du coffre.',403);return move(st,pc,String(itemId||''),n,newId);}
function coins(s,pc,amounts,direction,isGm){const st=get(s);if(!['in','out'].includes(direction))fail('Sens invalide.');if(direction==='out'&&st.withdraw==='gm'&&!isGm)fail('Le MJ distribue lui-même le contenu du coffre.',403);
 const a={};let any=false;for(const k of I.MONEY){const v=Number(amounts&&amounts[k]||0);if(!Number.isSafeInteger(v)||v<0||v>9999999)fail('Montant invalide.');a[k]=v;if(v)any=true;}if(!any)fail('Indiquez un montant.');
 const src=direction==='in'?(pc.coins??={}):st.coins,dst=direction==='in'?st.coins:(pc.coins??={});
 for(const k of I.MONEY)if((Number(src[k])||0)<a[k])fail('Pas assez de pièces ('+k+').');
 for(const k of I.MONEY){src[k]=(Number(src[k])||0)-a[k];dst[k]=Math.min(9999999,(Number(dst[k])||0)+a[k]);}return a;}
function add(s,id,values){const st=get(s);if(st.inventoryItems.length>=MAX_ITEMS)fail('Coffre plein (70 objets différents).');try{return I.add(st,id,values);}catch(e){fail(e.message);}}
function remove(s,itemId){const st=get(s);const n=st.inventoryItems.length;st.inventoryItems=st.inventoryItems.filter(x=>x.id!==itemId);if(n===st.inventoryItems.length)fail('Objet introuvable.');}
function settings(s,v){const st=get(s);if(!['all','gm'].includes(v&&v.withdraw))fail('Réglage invalide.');st.withdraw=v.withdraw;}
module.exports={MAX_ITEMS,get,deposit,withdraw,coins,add,remove,settings};

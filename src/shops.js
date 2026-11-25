/* Chroniques — marchands préparés par le MJ. Les joueurs ne voient que les boutiques ouvertes ;
   un achat débite la bourse du personnage (G.pay) et ajoute une copie de l'objet à son inventaire. */
'use strict';
const I=require('./inventory');
const G=require('./gear');
const MAX_SHOPS=20,MAX_ITEMS=80;
function fail(m){const e=new Error(m);e.status=400;throw e;}
function text(v,label,max,empty=false){const s=String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();if(!s&&!empty)fail(label+' requis.');if(s.length>max)fail(label+' : '+max+' caractères maximum.');return s;}
function int(v,label,min,max){const n=Number(v);if(!Number.isInteger(n)||n<min||n>max)fail(label+' invalide.');return n;}
function list(s){if(!Array.isArray(s.shops))s.shops=[];return s.shops;}
function find(s,id){return (Array.isArray(s.shops)?s.shops:[]).find(x=>x.id===id)||null;}
function add(s,id,v){const arr=list(s);if(arr.length>=MAX_SHOPS)fail('Maximum '+MAX_SHOPS+' marchands.');const shop={id,name:text(v?.name,'Nom du marchand',70),description:text(v?.description,'Description',300,true),open:false,items:[]};arr.push(shop);return shop;}
function update(s,id,v){const shop=find(s,id);if(!shop)fail('Marchand introuvable.');shop.name=text(v?.name,'Nom du marchand',70);shop.description=text(v?.description,'Description',300,true);return shop;}
function remove(s,id){const arr=list(s),i=arr.findIndex(x=>x.id===id);if(i<0)fail('Marchand introuvable.');return arr.splice(i,1)[0];}
function setOpen(s,id,open){const shop=find(s,id);if(!shop)fail('Marchand introuvable.');shop.open=!!open;return shop;}
function itemAdd(s,id,itemId,v){const shop=find(s,id);if(!shop)fail('Marchand introuvable.');if(shop.items.length>=MAX_ITEMS)fail('Maximum '+MAX_ITEMS+' articles par marchand.');
 const values=I.validate({...v?.values,quantity:1,equipped:false,attuned:false});const entry={id:itemId,values,price:int(v?.price,'Prix',0,100_000_000),stock:int(v?.stock??-1,'Stock',-1,999),icon:typeof v?.icon==='string'?v.icon.slice(0,80):'',libItemId:typeof v?.libItemId==='string'?v.libItemId.slice(0,60):''};shop.items.push(entry);return entry;}
function itemSet(s,id,itemId,v){const shop=find(s,id),it=shop?.items.find(x=>x.id===itemId);if(!it)fail('Article introuvable.');if(v&&'price' in v)it.price=int(v.price,'Prix',0,100_000_000);if(v&&'stock' in v)it.stock=int(v.stock,'Stock',-1,999);return it;}
function itemRemove(s,id,itemId){const shop=find(s,id),i=shop?shop.items.findIndex(x=>x.id===itemId):-1;if(i<0)fail('Article introuvable.');return shop.items.splice(i,1)[0];}
// Achat : vérifie l'ouverture, le stock et la bourse ; renvoie l'objet ajouté et le prix payé.
function buy(s,pc,shopId,itemId,qty,newId,{gm=false}={}){const shop=find(s,shopId);if(!shop||(!shop.open&&!gm))fail('Cette boutique est fermée.');const it=shop.items.find(x=>x.id===itemId);if(!it)fail('Article introuvable.');
 const q=int(qty,'Quantité',1,99);if(it.stock!==-1&&it.stock<q)fail('Stock insuffisant ('+it.stock+' disponible'+(it.stock>1?'s':'')+').');
 const total=it.price*q;const coins=G.pay(pc.coins||{},total);if(!coins){fail('Pas assez d’argent : il manque '+G.formatPrice(total-G.coinsValue(pc.coins||{}))+'.');}
 const item=I.add(pc,newId,{...it.values,quantity:q});pc.coins={...(pc.coins||{}),...coins};if(it.stock!==-1)it.stock-=q;return {item,total,entry:it,shop};}
function projected(s,u){return (Array.isArray(s.shops)?s.shops:[]).filter(x=>u.role==='gm'||x.open).map(x=>({...x,items:x.items.filter(i=>u.role==='gm'||i.stock!==0).map(i=>({...i,libItemId:u.role==='gm'?i.libItemId:''}))}));}
module.exports={MAX_SHOPS,MAX_ITEMS,list,find,add,update,remove,setOpen,itemAdd,itemSet,itemRemove,buy,projected};

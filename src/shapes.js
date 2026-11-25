/* Chroniques — formes temporaires (5.6) : Forme sauvage du druide et sort Métamorphose, d’après le SRD.
   Règles 2014 (SRD 5.1) : la forme a ses propres PV ; les dégâts la frappent d’abord et, à 0 PV, le personnage reprend
   sa forme normale et subit le surplus. Règles 2024 (SRD 5.2) : le personnage garde ses PV et gagne des PV temporaires
   (niveau de druide pour la Forme sauvage, PV de la bête pour Métamorphose).
   Rien n’est lancé : les jets d’attaque et de dégâts de la forme se font avec les vrais dés. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesShapes=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KINDS={wild:'Forme sauvage',poly:'Métamorphose',other:'Autre transformation'};
// Facteur de puissance maximum de la Forme sauvage selon le niveau de druide : [niveau, FP 2014, restriction 2014, FP 2024, restriction 2024].
const WILD_LIMITS=[[2,'1/4','ni vol ni nage','1/4','pas de vitesse de vol'],[4,'1/2','pas de vol','1/2','pas de vitesse de vol'],[8,'1','','1','']];
const crValue=cr=>{const t=String(cr??'');if(t.includes('/')){const [a,b]=t.split('/').map(Number);return b?a/b:0;}const n=Number(t);return Number.isFinite(n)?n:0;};
function wildLimit(level,edition){const lv=Math.max(1,Math.floor(Number(level)||1));let out=null;for(const r of WILD_LIMITS)if(lv>=r[0])out=r;if(!out)return null;
 return edition==='2024'?{cr:out[3],note:out[4]}:{cr:out[1],note:out[2]};}
function fail(m){const e=new Error(m);e.status=400;throw e;}
const txt=(v,label,max)=>{const t=String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();if(t.length>max)fail(label+' : '+max+' caractères maximum.');return t;};
const int=(v,label,min,max)=>{const n=Number(v);if(!Number.isInteger(n)||n<min||n>max)fail(label+' : nombre entier de '+min+' à '+max+'.');return n;};
// beast : créature du bestiaire ({name,cr,hp,ac,speed,abilities,traits,actions,id}) ou null pour une forme saisie à la main.
function start(pc,v,beast,edition){if(!pc)fail('Personnage introuvable.');if(pc.form)fail('Déjà transformé : reprenez d’abord votre forme normale.');if(!(pc.hp>0))fail('Un personnage à 0 PV ne peut pas se transformer.');
 const kind=Object.hasOwn(KINDS,v?.kind)?v.kind:'wild';const rule=edition==='2024'?'2024':'2014';
 const src=beast?{name:beast.name,cr:String(beast.cr??''),hp:beast.hp,ac:beast.ac,speed:beast.speed,abilities:beast.abilities?{...beast.abilities}:null,traits:String(beast.traits||'').slice(0,1500),actions:String(beast.actions||'').slice(0,1500),srd:String(beast.id||'')}
  :{name:txt(v?.name,'Nom de la forme',60),cr:'',hp:int(v?.hp,'PV de la forme',1,999),ac:int(v?.ac,'CA de la forme',1,40),speed:v?.speed==null||v.speed===''?null:int(v.speed,'Vitesse',0,200),abilities:null,traits:txt(v?.traits,'Notes',600),actions:'',srd:''};
 if(!src.name)fail('Nom de la forme obligatoire.');
 const f={kind,rule,...src,startedAt:new Date().toISOString()};
 if(rule==='2014'){f.hpMax=f.hp;}
 else{const def=kind==='wild'?Math.max(1,Number(pc.level)||1):Number(src.hp)||0;const temp=v?.tempHp==null||v.tempHp===''?def:int(v.tempHp,'PV temporaires',0,999);f.tempHp=temp;delete f.hp;if(temp>(Number(pc.tempHp)||0))pc.tempHp=temp;}
 pc.form=f;return f;}
function end(pc){if(!pc?.form)fail('Aucune forme en cours.');const f=pc.form;delete pc.form;return f;}
// Résumé partagé avec le groupe (PV de la forme si règles 2014).
function summary(f){if(!f)return null;return {name:f.name,srd:f.srd||'',kind:f.kind,rule:f.rule,ac:f.ac,...(f.hpMax?{hp:f.hp,hpMax:f.hpMax}:{})};}
return {KINDS,WILD_LIMITS,wildLimit,crValue,start,end,summary};
});

/* Chroniques — export et import d'un personnage entre campagnes (fichier .json).
   L'export ne contient que la fiche (ni compte, ni illustrations, ni données d'autres joueurs) ;
   l'import revalide chaque champ côté serveur avec les mêmes règles que la saisie manuelle. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesCharacterTransfer=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const FORMAT='chroniques-personnage',VERSION=1;
const SCORE_KEYS=['str','dex','con','int','wis','cha'];
function exportCharacter(pc,campaignTitle,edition){if(!pc)return null;const ab=pc.stats?.abilities||{};
 return {format:FORMAT,version:VERSION,exportedAt:new Date().toISOString(),from:{campaign:String(campaignTitle||''),edition:String(edition||'')},
  character:{name:pc.name,role:pc.role,job:pc.job,level:pc.level,xp:Number(pc.xp)||0,hpMax:pc.stats?.hp,ac:pc.stats?.ac,passive:pc.stats?.passive,speed:pc.speed,
   scores:Object.fromEntries(SCORE_KEYS.map(k=>[k,ab[k]??null])),
   classId:pc.progression?.classId||'',subclass:pc.progression?.subclass||'',
   resources:(pc.resources||[]).map(r=>({name:r.name,max:r.max,rest:r.rest})),
   abilities:(pc.abilities||[]).map(a=>({name:a.name,type:a.type,description:a.description||'',concentration:!!a.concentration,resource:a.cost?.resource?((pc.resources||[]).find(r=>r.id===a.cost.resource)||{}).name||'':''})),
   inventory:(pc.inventoryItems||[]).map(({id,image,...rest})=>rest),coins:pc.coins?{...pc.coins}:null,
   spells:(pc.grimoire||[]).map(e=>e.spellId?{spellId:e.spellId,prepared:!!e.prepared}:e.custom?{custom:{name:e.custom.name,level:e.custom.level,castTime:e.custom.castTime,range:e.custom.range,duration:e.custom.duration,components:e.custom.components,concentration:!!e.custom.concentration,ritual:!!e.custom.ritual,diceHint:e.custom.diceHint||''},prepared:!!e.prepared}:null).filter(Boolean),
   companions:(pc.companions||[]).map(({id,hp,...rest})=>rest),privateNotes:String(pc.privateNotes||''),
   history:(pc.history||[]).filter(e=>!e.gm).map(e=>({at:e.at,world:e.world||'',text:e.text}))}};}
function fileName(pc){return 'personnage_'+String(pc?.name||'sans-nom').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,40)+'.json';}
function check(data){if(!data||typeof data!=='object'||data.format!==FORMAT)throw Object.assign(new Error('Ce fichier n’est pas un personnage exporté depuis Chroniques.'),{status:400});
 if(data.version!==VERSION)throw Object.assign(new Error('Version de fichier personnage non prise en charge.'),{status:400});
 const c=data.character;if(!c||typeof c!=='object'||Array.isArray(c))throw Object.assign(new Error('Fiche absente du fichier.'),{status:400});return c;}
return {FORMAT,VERSION,exportCharacter,fileName,check};
});

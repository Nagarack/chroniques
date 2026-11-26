/* Chroniques — import d’un personnage exporté depuis Foundry VTT (système dnd5e, « Export Data » d’un acteur) (5.14).
   Le fichier est seulement lu comme des données : on en tire une fiche au format « chroniques-personnage », que le serveur
   revalide ensuite champ par champ comme un import Chroniques ordinaire. Rien n’est exécuté, les textes HTML sont réduits à du texte. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesFoundryImport=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SCORE_KEYS=['str','dex','con','int','wis','cha'];
const CLASS_IDS={barbarian:'barbarian',barbare:'barbarian',bard:'bard',barde:'bard',cleric:'cleric',clerc:'cleric',druid:'druid',druide:'druid',fighter:'fighter',guerrier:'fighter',monk:'monk',moine:'monk',paladin:'paladin',ranger:'ranger',rodeur:'ranger',rogue:'rogue',roublard:'rogue',sorcerer:'sorcerer',ensorceleur:'sorcerer',warlock:'warlock',occultiste:'warlock',wizard:'wizard',magicien:'wizard'};
const ITEM_TYPES={weapon:'weapon',equipment:'armor',consumable:'consumable',tool:'tool',loot:'treasure',container:'other',backpack:'other'};
const LB=0.45,FT=0.3;
const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const slug=s=>fold(s).replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
// HTML de Foundry → texte simple (aucune balise conservée), longueur limitée.
function plain(html,max){return String(html||'').replace(/<br\s*\/?>/gi,'\n').replace(/<\/(p|div|li|h\d)>/gi,'\n').replace(/<[^>]*>/g,'').replace(/@\w+\[[^\]]*\](\{([^}]*)\})?/g,(m,_,label)=>label||'')
 .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&rsquo;/g,'’').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/\n{3,}/g,'\n\n').trim().slice(0,max);}
const num=(v,d=0)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const clampInt=(v,lo,hi,d)=>{const n=Math.round(num(v,d));return Math.max(lo,Math.min(hi,n));};
function isFoundryActor(d){return !!d&&typeof d==='object'&&!Array.isArray(d)&&typeof d.name==='string'&&d.system&&typeof d.system==='object'&&d.system.abilities&&Array.isArray(d.items);}
// Convertit l’acteur ; knownSpell(id) dit si un identifiant de sort SRD existe dans Chroniques (« acid-splash »…).
function convert(d,{knownSpell=()=>false,edition=''}={}){if(!isFoundryActor(d))throw Object.assign(new Error('Ce fichier n’est pas un personnage exporté depuis Foundry VTT (dnd5e).'),{status:400});
 if(d.type&&d.type!=='character')throw Object.assign(new Error('Seuls les personnages joueurs (type « character ») peuvent être importés.'),{status:400});
 const sys=d.system,items=d.items.filter(x=>x&&typeof x==='object');const notes=[];
 const scores=Object.fromEntries(SCORE_KEYS.map(k=>{const v=sys.abilities?.[k]?.value;return [k,Number.isInteger(v)&&v>=1&&v<=30?v:null];}));
 const mod=k=>scores[k]==null?0:Math.floor((scores[k]-10)/2);
 const classes=items.filter(x=>x.type==='class');const level=clampInt(classes.reduce((t,c)=>t+num(c.system?.levels,0),0)||num(sys.details?.level,1),1,20,1);
 const main=classes.slice().sort((a,b)=>num(b.system?.levels)-num(a.system?.levels))[0];
 const classId=main?CLASS_IDS[fold(main.system?.identifier||main.name).replace(/[^a-z]/g,'')]||'':'';
 const sub=items.find(x=>x.type==='subclass');
 const job=(classes.length>1?classes.map(c=>c.name+' '+num(c.system?.levels,1)).join(' / '):(main?.name||'Aventurier')).slice(0,60);
 const race=items.find(x=>x.type==='race')?.name||(typeof sys.details?.race==='string'?sys.details.race:'')||'';
 const hpMax=clampInt(sys.attributes?.hp?.max??sys.attributes?.hp?.value,1,999,10);
 const ac=sys.attributes?.ac||{};let acv=num(ac.flat,NaN);if(!Number.isFinite(acv))acv=num(ac.value,NaN);if(!Number.isFinite(acv)){acv=10+mod('dex');notes.push('CA estimée (10 + Dextérité) : vérifiez-la.');}
 const mv=sys.attributes?.movement||{};const walk=num(mv.walk,30);const speed=Math.round((mv.units==='m'?walk:walk*FT)*2)/2;
 const passive=clampInt(sys.skills?.prc?.passive??(10+mod('wis')),1,40,10);
 const cur=sys.currency||{};const coins={cp:clampInt(cur.cp,0,999999,0),sp:clampInt(cur.sp,0,999999,0),ep:clampInt(cur.ep,0,999999,0),gp:clampInt(cur.gp,0,999999,0),pp:clampInt(cur.pp,0,999999,0)};
 const inventory=items.filter(x=>Object.hasOwn(ITEM_TYPES,x.type)).slice(0,70).map(x=>{const s=x.system||{};const wRaw=typeof s.weight==='object'&&s.weight?num(s.weight.value):num(s.weight);const unit=typeof s.weight==='object'&&s.weight?.units;
  const kg=Math.round((unit==='kg'?wRaw:wRaw*LB)*100)/100;const uses=s.uses||{};const max=clampInt(uses.max,0,999,0);
  const cat=x.type==='consumable'&&fold(s.type?.value||s.consumableType)==='potion'?'potion':ITEM_TYPES[x.type];
  return {name:String(x.name||'Objet').slice(0,85),description:plain(s.description?.value,280),category:cat,quantity:clampInt(s.quantity,1,999,1),weight:Math.min(10000,Math.max(0,kg)),chargesMax:max,charges:max?clampInt(max-num(uses.spent,0),0,max,max):0,equipped:s.equipped===true,attuned:s.attuned===true||s.attunement===2};});
 const spells=items.filter(x=>x.type==='spell').slice(0,100).map(x=>{const s=x.system||{};const id=slug(s.identifier||x.name);const prepared=s.preparation?.prepared===true||s.preparation?.mode==='always'||s.prepared===1||s.prepared===2;
  if(knownSpell(id))return {spellId:id,prepared};
  const act=s.activation?.type;const comps=Array.isArray(s.properties)?s.properties:Object.keys(s.components||{}).filter(k=>s.components[k]===true);
  return {custom:{name:String(x.name||'Sort').slice(0,60),level:clampInt(s.level,0,9,0),castTime:act==='bonus'?'bonus':act==='reaction'?'reaction':'action',range:String(s.range?.value?s.range.value+' '+(s.range.units||''):'').trim().slice(0,40),duration:String(s.duration?.value?s.duration.value+' '+(s.duration.units||''):(s.duration?.units||'')).trim().slice(0,40),
   components:comps.filter(c=>['vocal','somatic','material','v','s','m'].includes(String(c).toLowerCase())).map(c=>String(c)[0].toUpperCase()).join(' ').slice(0,20),concentration:comps.includes('concentration')||s.components?.concentration===true,ritual:comps.includes('ritual')||s.components?.ritual===true,diceHint:''},prepared};});
 const abilities=items.filter(x=>x.type==='feat').slice(0,35).map(x=>({name:String(x.name||'Capacité').slice(0,60),type:x.system?.activation?.type==='bonus'?'bonus':x.system?.activation?.type==='reaction'?'reaction':x.system?.activation?.type==='action'?'action':'free',description:plain(x.system?.description?.value,400),concentration:false,resource:''}));
 const skipped=d.items.length-inventory.length-spells.length-abilities.length-classes.length-(sub?1:0)-items.filter(x=>x.type==='race'||x.type==='background').length;
 if(skipped>0)notes.push(skipped+' élément(s) Foundry sans équivalent ignoré(s).');
 const bio=plain(sys.details?.biography?.value,2500);
 return {data:{format:'chroniques-personnage',version:1,exportedAt:new Date().toISOString(),from:{campaign:'Foundry VTT',edition:String(edition||'')},
  character:{name:String(d.name).slice(0,60),role:String(race).slice(0,40),job,level,xp:clampInt(sys.details?.xp?.value,0,9999999,0),hpMax,ac:clampInt(acv,1,40,10),passive,speed:Math.max(0,Math.min(60,speed)),scores,classId,subclass:String(sub?.name||'').slice(0,70),
   resources:[],abilities,inventory,coins,spells,companions:[],privateNotes:bio?'Biographie (Foundry VTT) :\n'+bio:'',history:[]}},notes};}
return {isFoundryActor,convert,plain,slug};
});

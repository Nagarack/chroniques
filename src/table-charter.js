/* Chroniques — charte de la table (5.3) : règles maison, lignes et voiles, carte X.
   - Règles maison : saisies par le MJ, partagées ou réservées au MJ, éventuellement rappelées dans l’Écran du MJ.
   - Lignes (sujets exclus du jeu) et voiles (sujets évoqués hors champ) : chacun peut en ajouter, sans nom d’auteur ;
     seul le MJ peut en retirer.
   - Carte X et pause : un signal anonyme envoyé au MJ. Aucun nom n’est enregistré, ni dans la campagne ni dans le journal. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesCharter=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const CATS=[['jeu','Déroulement de la partie'],['combat','Combat'],['magie','Magie'],['repos','Repos & voyage'],['personnages','Création et progression'],['autre','Autre']];
const CAT_IDS=CATS.map(c=>c[0]);
const MAX_RULES=60,MAX_LIMITS=40,MAX_SIGNALS=10;
// Exemples de règles maison courantes, à ajouter d’un clic puis à adapter.
const PRESETS=[
 {title:'Boire une potion',category:'combat',text:'Boire une potion soi-même est une action bonus ; la faire boire à un autre personnage reste une action.'},
 {title:'Coups critiques',category:'combat',text:'Sur un coup critique, un des dés de dégâts doublés compte pour sa valeur maximale ; l’autre est lancé normalement.'},
 {title:'Prise en tenaille',category:'combat',text:'Deux alliés de part et d’autre d’une créature au corps à corps ont l’avantage sur leurs attaques contre elle.'},
 {title:'Repos long',category:'repos',text:'Un repos long n’est possible que dans un lieu sûr (auberge, camp gardé, refuge) ; ailleurs, seul un repos court est accordé.'},
 {title:'Composantes matérielles',category:'magie',text:'Les composantes sans coût indiqué sont supposées présentes dans la sacoche ou le focaliseur : pas de suivi.'},
 {title:'Personnage absent',category:'jeu',text:'Un personnage dont le joueur est absent reste en retrait ; il gagne quand même l’XP de la séance.'},
 {title:'Téléphones',category:'jeu',text:'Téléphones posés pendant les scènes ; pause de dix minutes toutes les deux heures environ.'},
 {title:'Mort d’un personnage',category:'personnages',text:'Un nouveau personnage arrive au niveau du groupe, avec l’équipement de départ de sa classe.'}];
// Exemples de sujets que les tables choisissent souvent d’exclure ou de voiler.
const LIMIT_IDEAS=['Violences sexuelles','Violence envers les enfants','Torture détaillée','Araignées et insectes','Automutilation','Maltraitance animale','Racisme et discriminations','Scènes de romance'];
const str=(v,max)=>String(v==null?'':v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim().slice(0,max);
function fail(msg){throw Object.assign(new Error(msg),{status:400});}
function ensure(state){const c=state.tableCharter&&typeof state.tableCharter==='object'?state.tableCharter:(state.tableCharter={});
 for(const k of ['rules','lines','veils','signals'])if(!Array.isArray(c[k]))c[k]=[];if(typeof c.intro!=='string')c.intro='';if(!c.options||typeof c.options!=='object')c.options={};return c;}
function cleanRule(v,old){v=v||{};const title=str(v.title,80);if(!title)fail('Donnez un titre à la règle.');const text=str(v.text,1500);
 const category=CAT_IDS.includes(v.category)?v.category:(old?.category||'autre');const visibility=v.visibility==='gm'?'gm':'shared';
 return {title,text,category,visibility,screen:v.screen===true};}
function ruleAdd(state,id,v){const c=ensure(state);if(c.rules.length>=MAX_RULES)fail('Maximum '+MAX_RULES+' règles maison.');const r={id,...cleanRule(v),updatedAt:new Date().toISOString()};c.rules.push(r);return r;}
function ruleUpdate(state,id,v){const c=ensure(state);const r=c.rules.find(x=>x.id===id);if(!r)fail('Règle introuvable.');Object.assign(r,cleanRule(v,r),{updatedAt:new Date().toISOString()});return r;}
function ruleRemove(state,id){const c=ensure(state);const i=c.rules.findIndex(x=>x.id===id);if(i<0)fail('Règle introuvable.');return c.rules.splice(i,1)[0];}
function setIntro(state,text){ensure(state).intro=str(text,2000);}
// Options de table : « Retarder son tour » (pas une règle officielle de la 5e édition, activée par défaut).
function setOptions(state,v){const o=ensure(state).options;if(v&&typeof v.delay==='boolean')o.delay=v.delay;return o;}
function allowDelay(state){return !(state&&state.tableCharter&&state.tableCharter.options&&state.tableCharter.options.delay===false);}
function listOf(c,kind){if(kind==='line')return c.lines;if(kind==='veil')return c.veils;fail('Type de limite inconnu.');}
function limitAdd(state,id,kind,text){const c=ensure(state);const list=listOf(c,kind);const t=str(text,120);if(!t)fail('Écrivez le sujet concerné.');
 if(list.length>=MAX_LIMITS)fail('Maximum '+MAX_LIMITS+' sujets par liste.');const key=t.toLocaleLowerCase('fr');if(list.some(x=>x.text.toLocaleLowerCase('fr')===key))return null;
 // Une ligne l’emporte sur un voile identique.
 if(kind==='line')c.veils=c.veils.filter(x=>x.text.toLocaleLowerCase('fr')!==key);else if(c.lines.some(x=>x.text.toLocaleLowerCase('fr')===key))return null;
 const e={id,text:t};listOf(c,kind).push(e);return e;}
function limitRemove(state,kind,id){const c=ensure(state);const list=listOf(c,kind);const i=list.findIndex(x=>x.id===id);if(i<0)fail('Sujet introuvable.');return list.splice(i,1)[0];}
// Signal anonyme : seulement le type et l’heure.
function signal(state,id,kind){if(kind!=='x'&&kind!=='pause')fail('Signal inconnu.');const c=ensure(state);const e={id,kind,at:new Date().toISOString()};c.signals.unshift(e);c.signals=c.signals.slice(0,MAX_SIGNALS);return e;}
function signalAck(state,id){const c=ensure(state);if(id)c.signals=c.signals.filter(x=>x.id!==id);else c.signals=[];}
// Ce que reçoivent les joueurs : règles partagées et limites ; jamais les signaux ni les règles réservées au MJ.
function projected(state){const c=state&&state.tableCharter;if(!c)return undefined;return {intro:c.intro||'',options:{...(c.options||{})},rules:(c.rules||[]).filter(r=>r.visibility!=='gm').map(r=>({...r})),lines:(c.lines||[]).map(x=>({...x})),veils:(c.veils||[]).map(x=>({...x})),signals:[]};}
function screenRules(state){return ((state&&state.tableCharter&&state.tableCharter.rules)||[]).filter(r=>r.screen);}
function catLabel(id){const c=CATS.find(x=>x[0]===id);return c?c[1]:'Autre';}
return {CATS,PRESETS,LIMIT_IDEAS,MAX_RULES,MAX_LIMITS,ensure,setOptions,allowDelay,ruleAdd,ruleUpdate,ruleRemove,setIntro,limitAdd,limitRemove,signal,signalAck,projected,screenRules,catLabel};
});

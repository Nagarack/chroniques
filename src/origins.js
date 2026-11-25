/* Chroniques V1.0 — origines (métadonnées et règles numériques SRD). CC BY 4.0 : voir README. */
(function(root,factory){const v=factory();if(typeof module==='object'&&module.exports)module.exports=v;if(root)root.ChroniquesOrigins=v;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ABILITIES={str:'FOR',dex:'DEX',con:'CON',int:'INT',wis:'SAG',cha:'CHA'};
// Les noms hors SRD sont autorisés en saisie libre, sans attribution automatique de traits.
const SPECIES_2024={
 dragonborn:{name:'Drakéide',speed:9,traits:['Ascendance draconique : choix manuel','Souffle et résistance : détails à renseigner']},
 dwarf:{name:'Nain',speed:9,traits:['Résilience naine','Vision dans le noir','Connaissance de la pierre']},
 elf:{name:'Elfe',speed:9,traits:['Lignée elfique : choix manuel','Ascendance féerique','Vision dans le noir']},
 gnome:{name:'Gnome',speed:9,traits:['Lignée gnome : choix manuel','Ruse gnome','Vision dans le noir']},
 goliath:{name:'Goliath',speed:10.5,traits:['Ascendance de géant : choix manuel','Grande carrure']},
 halfling:{name:'Halfelin',speed:9,traits:['Chance','Bravoure','Agilité halfeline']},
 human:{name:'Humain',speed:9,traits:['Ingéniosité','Polyvalence : don d’origine à choisir']},
 orc:{name:'Orc',speed:9,traits:['Montée d’adrénaline','Endurance implacable','Vision dans le noir']},
 tiefling:{name:'Tieffelin',speed:9,traits:['Héritage fiélon : choix manuel','Résistance et magie héritée à préciser']}
};
const SPECIES_2014={
 dragonborn:{name:'Drakéide',speed:9,bonus:{str:2,cha:1},traits:['Ascendance draconique à choisir']},
 dwarf:{name:'Nain',speed:7.5,bonus:{con:2},traits:['Sous-race et bonus supplémentaire à renseigner']},
 elf:{name:'Elfe',speed:9,bonus:{dex:2},traits:['Sous-race et bonus supplémentaire à renseigner']},
 gnome:{name:'Gnome',speed:7.5,bonus:{int:2},traits:['Sous-race et bonus supplémentaire à renseigner']},
 halfelf:{name:'Demi-elfe',speed:9,bonus:{cha:2},traits:['Deux bonus +1 supplémentaires à renseigner manuellement']},
 halforc:{name:'Demi-orc',speed:9,bonus:{str:2,con:1},traits:['Endurance implacable','Attaques sauvages']},
 halfling:{name:'Halfelin',speed:7.5,bonus:{dex:2},traits:['Sous-race et bonus supplémentaire à renseigner']},
 human:{name:'Humain (standard)',speed:9,bonus:{str:1,dex:1,con:1,int:1,wis:1,cha:1},traits:['Humain standard (pas variante)']},
 tiefling:{name:'Tieffelin',speed:9,bonus:{int:1,cha:2},traits:['Héritage infernal']}
};
const BACKGROUNDS_2024={
 acolyte:{name:'Acolyte',scores:['int','wis','cha'],skills:['intuition','religion'],feat:'Initié à la magie (Clerc)',tool:'Matériel de calligraphie'},
 criminal:{name:'Criminel',scores:['dex','con','int'],skills:['escamotage','discretion'],feat:'Alerte',tool:'Outils de voleur'},
 sage:{name:'Sage',scores:['con','int','wis'],skills:['arcanes','histoire'],feat:'Initié à la magie (Magicien)',tool:'Matériel de calligraphie'},
 soldier:{name:'Soldat',scores:['str','dex','con'],skills:['athletisme','intimidation'],feat:'Attaquant sauvage',tool:'Jeu au choix'}
};
const BACKGROUNDS_2014={acolyte:{name:'Acolyte',scores:[],skills:['intuition','religion'],feat:'',tool:'Deux langues au choix'}};
const VARIANTS_2024={
 dragonborn:{black:{name:'Dragon noir'},blue:{name:'Dragon bleu'},brass:{name:'Dragon d’airain'},bronze:{name:'Dragon de bronze'},copper:{name:'Dragon de cuivre'},gold:{name:'Dragon d’or'},green:{name:'Dragon vert'},red:{name:'Dragon rouge'},silver:{name:'Dragon d’argent'},white:{name:'Dragon blanc'}},
 elf:{drow:{name:'Drow'},high:{name:'Haut-elfe'},wood:{name:'Elfe des bois'}},
 gnome:{forest:{name:'Gnome des forêts'},rock:{name:'Gnome des roches'}},
 goliath:{cloud:{name:'Nuage'},fire:{name:'Feu'},frost:{name:'Givre'},hill:{name:'Collines'},stone:{name:'Pierre'},storm:{name:'Tempête'}},
 tiefling:{abyssal:{name:'Abyssal'},chthonic:{name:'Chthonien'},infernal:{name:'Infernal'}}
};
// Sous-races présentes dans le SRD 5.1 uniquement : les autres peuvent être indiquées dans les notes.
const VARIANTS_2014={
 dwarf:{hill:{name:'Nain des collines',bonus:{wis:1},traits:['Robustesse naine : PV supplémentaires à renseigner manuellement']}},
 elf:{high:{name:'Haut-elfe',bonus:{int:1},traits:['Tour de magie et langue supplémentaires à renseigner']}},
 gnome:{rock:{name:'Gnome des roches',bonus:{con:1},traits:['Bricolage et expertise sur objets : à renseigner']}},
 halfling:{lightfoot:{name:'Halfelin pied-léger',bonus:{cha:1},traits:['Discrétion naturelle à renseigner']}}
};
const KEYS=Object.keys(ABILITIES);
function speciesFor(edition){return edition==='2014'?SPECIES_2014:edition==='2024'?SPECIES_2024:{ };}
function backgroundsFor(edition){return edition==='2014'?BACKGROUNDS_2014:edition==='2024'?BACKGROUNDS_2024:{ };}
function validateText(value,max=65){return typeof value==='string'&&value.trim().length>0&&value.trim().length<=max?value.trim():null;}
function compute(input,edition){
 if(!['2014','2024'].includes(edition))throw new Error('Choisissez les règles 2014 ou 2024.');
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Origine absente.');
 const species=speciesFor(edition)[input.speciesId]||null;
 if(!species&&input.speciesId!=='custom')throw new Error('Espèce inconnue pour cette édition.');
 const speciesName=species?species.name:validateText(input.speciesName);
 if(!speciesName)throw new Error('Indiquez un nom pour l’espèce personnalisée.');
 const variants=edition==='2014'?VARIANTS_2014:VARIANTS_2024;
 const specificVariants=variants[input.speciesId]||{};
 const variantId=input.variantId||null;
 if(variantId&&(typeof variantId!=='string'||!Object.hasOwn(specificVariants,variantId)))throw new Error('Sous-race, lignée ou ascendance inconnue pour cette espèce.');
 const variant=variantId?specificVariants[variantId]:null;
 const background=backgroundsFor(edition)[input.backgroundId]||null;
 if(!background&&input.backgroundId!=='custom')throw new Error('Historique inconnu pour cette édition.');
 const backgroundName=background?background.name:validateText(input.backgroundName);
 if(!backgroundName)throw new Error('Indiquez un nom pour l’historique personnalisé.');
 const baseScores={};const bonuses={};
 if(!input.baseScores||typeof input.baseScores!=='object'||Array.isArray(input.baseScores))throw new Error('Scores de base manquants.');
 for(const k of KEYS){const v=input.baseScores[k];if(v!==null&&(!Number.isInteger(v)||v<1||v>20))throw new Error('Score de base '+ABILITIES[k]+' invalide (1–20).');baseScores[k]=v===null?null:v;bonuses[k]=0;}
 let eligible=[];let distribution='none';
 if(edition==='2024'){
  if(background){eligible=background.scores.slice();}
  else{if(!Array.isArray(input.customEligible)||input.customEligible.length!==3||new Set(input.customEligible).size!==3||input.customEligible.some(k=>!KEYS.includes(k)))throw new Error('Historique personnalisé : choisissez 3 caractéristiques distinctes.');eligible=input.customEligible.slice();}
  if(input.distribution==='triple'){distribution='triple';for(const k of eligible)bonuses[k]=1;}
  else if(input.distribution==='split'){
   distribution='split';if(input.plus2===input.plus1||![input.plus2,input.plus1].every(k=>eligible.includes(k)))throw new Error('Sélectionnez deux caractéristiques différentes autorisées par l’historique.');
   bonuses[input.plus2]=2;bonuses[input.plus1]=1;
  }else throw new Error('Choisissez +2/+1 ou +1/+1/+1 pour l’historique.');
 }else{for(const [k,v] of Object.entries(species?.bonus||{}))bonuses[k]=v;for(const [k,v] of Object.entries(variant?.bonus||{}))bonuses[k]+=v;}
 const finalScores={};for(const k of KEYS){const b=baseScores[k],bonus=bonuses[k];if(b!==null&&b+bonus>20)throw new Error('Le score '+ABILITIES[k]+' dépasserait 20 avec le bonus d’origine.');finalScores[k]=b===null?null:b+bonus;}
 return {origin:{edition,speciesId:input.speciesId,speciesName,variantId,variantName:variant?.name||null,backgroundId:input.backgroundId,backgroundName,distribution,plus2:distribution==='split'?input.plus2:null,plus1:distribution==='split'?input.plus1:null,eligible,baseScores,bonuses,grantedSkills:background?.skills.slice()||[],originFeat:background?.feat||null,tool:background?.tool||null,speciesTraits:[...(species?.traits||[]),...(variant?.traits||[])],speedReference:species?.speed??null,manualDetails:validateText(input.manualDetails||'',280)||''},finalScores};
}
function fromFinalScores(scores,bonuses){const base={};for(const k of KEYS){const value=scores?.[k];if(value===null||value===undefined){base[k]=null;continue;}if(!Number.isInteger(value)||value<1||value>30)throw new Error('Score '+ABILITIES[k]+' invalide.');const candidate=value-(bonuses?.[k]||0);if(candidate<1||candidate>20)throw new Error('Le score '+ABILITIES[k]+' ne correspond pas aux bonus d’origine.');base[k]=candidate;}return base;}
return {ABILITIES,KEYS,SPECIES_2024,SPECIES_2014,VARIANTS_2024,VARIANTS_2014,BACKGROUNDS_2024,BACKGROUNDS_2014,speciesFor,backgroundsFor,compute,fromFinalScores};
});

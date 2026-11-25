/* Chroniques V1.1 — repères de traits d'espèce SRD 5.1 et 5.2.1.
 * La dépense d'une utilisation n'exécute pas le sort, l'action ni ses effets en jeu.
 * CC BY 4.0 — attribution des SRD dans README.md.
 */
(function(root,factory){const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;if(root)root.ChroniquesHeritage=m;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const FEATURE_LIMIT=80;
const pb=n=>Number.isInteger(n)&&n>=1&&n<=20?2+Math.floor((n-1)/4):0;
const names={
 acid:'acide',fire:'feu',cold:'froid',lightning:'foudre',poison:'poison',necrotic:'nécrotique'
};
const dragons={black:'acid',blue:'lightning',brass:'fire',bronze:'lightning',copper:'acid',gold:'fire',green:'poison',red:'fire',silver:'cold',white:'cold'};
function create(id,name,description,level=1,uses=null,rest=null,kind='trait'){
 return {id,name,description,level,uses,rest,kind};
}
function features(pc,edition){
 const o=pc?.origin;
 if(!o||o.edition!==edition||!['2014','2024'].includes(edition)||o.speciesId==='custom')return [];
 const s=o.speciesId,v=o.variantId||'',level=Number(pc.level)||1,p=pb(level),x=[];
 const a=(...args)=>x.push(create(...args));
 if(edition==='2024'){
  if(s==='dragonborn'){
   if(v&&dragons[v])a('dr-resist','Résistance draconique',`Résistance aux dégâts de ${names[dragons[v]]}.`);
   else a('dr-choice','Ascendance draconique à choisir','Choisissez une ascendance avant de déterminer la résistance et le type de souffle.');
   a('dr-breath','Souffle draconique',`Remplace une attaque de l’action Attaquer ; dégâts ${level>=17?'4':level>=11?'3':level>=5?'2':'1'}d10${v&&dragons[v]?' de '+names[dragons[v]]:''}. Sauvegarde DEX : DD 8 + CON + maîtrise ; zone au choix.`,1,p,'long','attaque');
   a('dr-flight','Vol draconique','Action bonus : ailes temporaires, 10 minutes ; vitesse de vol = vitesse normale.',5,1,'long','bonus');
   a('dr-dark','Vision dans le noir','18 m.');
  }
  if(s==='dwarf'){
   a('dw-dark','Vision dans le noir','36 m.');
   a('dw-resilience','Résilience naine','Résistance au poison ; avantage aux sauvegardes contre l’état Empoisonné.');
   a('dw-toughness','Robustesse naine','+1 PV max par niveau, à intégrer manuellement au total de PV.');
   a('dw-stone','Connaissance de la pierre','Action bonus : perception des vibrations sur pierre pendant 10 minutes (18 m).',1,p,'long','bonus');
  }
  if(s==='elf'){
   a('elf-trance','Transe, sens aiguisés et ascendance féerique','Choix de compétence (Intuition, Perception ou Survie), protection contre Charmé ; repos long en transe de 4 h.');
   if(v==='drow'){a('elf-dark','Vision dans le noir supérieure','36 m.');a('elf-cantrip','Lumières dansantes','Tour de magie connu, sans utilisation limitée.',1,null,null,'sort');}
   else{a('elf-dark','Vision dans le noir','18 m.');if(v==='high')a('elf-cantrip','Prestidigitation','Tour de magie remplaçable après un repos long par un autre tour de magie de magicien.',1,null,null,'sort');if(v==='wood')a('elf-cantrip','Druidisme','Tour de magie connu ; la vitesse de l’elfe des bois est de 10,5 m.',1,null,null,'sort');}
   const spells={drow:['Lueurs féeriques','Ténèbres'],high:['Détection de la magie','Foulée brumeuse'],wood:['Grande foulée','Passage sans trace']}[v];
   if(spells){a('elf-spell-3',spells[0],'Une incantation gratuite par repos long ; peut aussi être lancé avec un emplacement de sort approprié.',3,1,'long','sort');a('elf-spell-5',spells[1],'Une incantation gratuite par repos long ; peut aussi être lancé avec un emplacement de sort approprié.',5,1,'long','sort');}
   else a('elf-choice','Lignée elfique à sélectionner','Choisir Drow, Haut-elfe ou Elfe des bois pour afficher les sorts raciaux.');
  }
  if(s==='gnome'){
   a('gn-cunning','Ruse gnome','Avantage aux sauvegardes d’INT, SAG et CHA.');
   if(v==='forest'){
    a('gn-minor','Illusion mineure','Tour de magie racial.',1,null,null,'sort');
    a('gn-animals','Communication avec les animaux','Utilisations sans emplacement ; sort également lançable avec un emplacement adapté.',1,p,'long','sort');
   }else if(v==='rock')a('gn-tinker','Prestidigitation et bricolage','Prestidigitation et création de petites inventions selon la lignée ; gestion manuelle.');
   else a('gn-choice','Lignée gnome à choisir','Choisissez des forêts ou des roches pour les capacités associées.');
  }
  if(s==='goliath'){
   const choice={cloud:['Pas des nuages','Action bonus : téléportation courte.'],fire:['Brûlure du feu','Dégâts de feu supplémentaires sur une attaque qui touche.'],frost:['Froid du givre','Dégâts de froid et ralentissement sur une attaque qui touche.'],hill:['Chute des collines','Peut mettre une cible à terre sur une attaque réussie.'],stone:['Endurance de pierre','Réaction : réduit les dégâts reçus.'],storm:['Tonnerre de tempête','Réaction : dégâts de tonnerre en riposte.']}[v];
   if(choice)a('gol-giant',choice[0],choice[1]+' Vérifier les conditions et les dés dans les règles.',1,p,'long',v==='cloud'?'bonus':['stone','storm'].includes(v)?'reaction':'trait');
   else a('gol-choice','Ascendance de géant à choisir','Sélectionnez votre ascendance de géant.');
   a('gol-large','Grande forme','Action bonus : taille Grande pendant 10 minutes si l’espace le permet.',5,1,'long','bonus');
   a('gol-power','Carrure puissante','Avantage pour se libérer d’Agrippé ; capacité de port augmentée.');
  }
  if(s==='halfling')a('hf-luck','Chance et discrétion naturelle','Relance du 1 sur un test au d20 selon les règles ; les autres avantages ne sont pas appliqués automatiquement.');
  if(s==='human')a('hu-origin','Ingéniosité et polyvalence','Gain d’Inspiration héroïque au repos long, choix d’une compétence et d’un don d’origine ; à enregistrer manuellement.');
  if(s==='orc'){
   a('orc-rush','Montée d’adrénaline',`Action bonus : Foncer et gagner ${p} PV temporaires ; le compteur revient au repos court ou long.`,1,p,'short','bonus');
   a('orc-endure','Endurance implacable','À 0 PV, tomber à 1 PV à la place sous réserve des conditions.',1,1,'long','reaction');
   a('orc-dark','Vision dans le noir','36 m.');
  }
  if(s==='tiefling'){
   a('tf-thaum','Thaumaturgie','Tour de magie racial.',1,null,null,'sort');
   const legacy={abyssal:['poison','Aspersion de poison','Rayon empoisonné','Immobilisation de personne'],chthonic:['nécrotique','Contact glacial','Simulacre de vie','Rayon affaiblissant'],infernal:['feu','Trait de feu','Représailles infernales','Ténèbres']}[v];
   if(legacy){a('tf-resist','Résistance fiélonne','Résistance aux dégâts de '+legacy[0]+'.');a('tf-cantrip',legacy[1],'Tour de magie racial.',1,null,null,'sort');a('tf-spell-3',legacy[2],'Une incantation gratuite par repos long ; possible avec un emplacement approprié.',3,1,'long','sort');a('tf-spell-5',legacy[3],'Une incantation gratuite par repos long ; possible avec un emplacement approprié.',5,1,'long','sort');}
   else a('tf-choice','Héritage fiélon à choisir','Choisissez Abyssal, Chthonien ou Infernal pour révéler les sorts de l’héritage.');
  }
 }else{
  if(s==='tiefling'){
   a('tf14-resist','Résistance infernale et thaumaturgie','Résistance au feu ; tour de magie Thaumaturgie.');
   a('tf14-rebuke','Représailles infernales','Une incantation gratuite au niveau 2 par repos long.',3,1,'long','sort');
   a('tf14-dark','Ténèbres','Une incantation gratuite par repos long.',5,1,'long','sort');
  }
  if(s==='halforc')a('ho14-endure','Endurance implacable','À 0 PV, tomber à 1 PV selon les conditions.',1,1,'long','trait');
  if(s==='dragonborn')a('dr14-breath','Souffle draconique','Action et jets du souffle à résoudre selon les règles 2014 ; ascendance à préciser.',1,1,'short','action');
  if(s==='dwarf')a('dw14-resist','Résilience naine','Avantage aux sauvegardes contre le poison et résistance au poison.');
  if(s==='human')a('hu14-traits','Humain standard','Les bonus de caractéristiques sont comptés dans Origines.');
  if(s==='elf'&&v==='high')a('elf14-cantrip','Tour de magie de haut-elfe','Tour de magie de magicien choisi manuellement.',1,null,null,'sort');
 }
 const uses=pc.heritageSpent&&typeof pc.heritageSpent==='object'&&!Array.isArray(pc.heritageSpent)?pc.heritageSpent:{};
 return x.slice(0,FEATURE_LIMIT).map(f=>{
  const unlocked=level>=f.level,spent=Number.isSafeInteger(uses[f.id])&&uses[f.id]>=0?uses[f.id]:0;
  return {...f,unlocked,spent:Math.min(spent,f.uses??0),left:f.uses===null?null:Math.max(0,f.uses-spent)};
 });
}
function spend(pc,edition,featureId,delta){
 if(!Number.isInteger(delta)||![-1,1].includes(delta))throw new Error('Variation de capacité invalide.');
 const feat=features(pc,edition).find(x=>x.id===featureId);if(!feat||!feat.unlocked||feat.uses===null)throw new Error('Capacité verrouillée ou non suivie.');
 if(delta===1&&feat.left<=0)throw new Error('Capacité déjà épuisée.');
 if(delta===-1&&feat.spent<=0)throw new Error('Aucune utilisation à restaurer.');
 pc.heritageSpent??={};pc.heritageSpent[feat.id]=feat.spent+delta;return feat;
}
function recover(pc,edition,rest){
 if(!['short','long'].includes(rest))throw new Error('Repos invalide.');
 if(!pc.heritageSpent)return;
 for(const f of features(pc,edition))if(f.uses!==null&&(rest==='long'||f.rest==='short'))delete pc.heritageSpent[f.id];
}
function featList(pc){return (Array.isArray(pc.feats)?pc.feats:[]).map(f=>({...f,unlocked:(pc.level||1)>=f.level}));}
return {features,spend,recover,featList,pb};
});

/* Chroniques — bestiaire SRD prêt à l'emploi et difficulté des rencontres.
   Statistiques issues du System Reference Document 5.1 (Wizards of the Coast, licence CC BY 4.0),
   noms et descriptions courtes rédigés en français pour Chroniques. Les dés restent physiques :
   les actions indiquent seulement les dés à lancer.
   Les résistances « aux dégâts non magiques » ne sont pas appliquées automatiquement : elles figurent
   dans les traits pour que le MJ les applique lui-même. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesBestiary=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const XP_BY_CR={'0':10,'1/8':25,'1/4':50,'1/2':100,'1':200,'2':450,'3':700,'4':1100,'5':1800,'6':2300,'7':2900,'8':3900,'9':5000,'10':5900,'11':7200,'12':8400,'13':10000,'14':11500,'15':13000,'16':15000,'17':18000,'18':20000,'19':22000,'20':25000,'21':33000,'22':41000,'23':50000,'24':62000,'25':75000,'26':90000,'27':105000,'28':120000,'29':135000,'30':155000};
// Budget d'XP par personnage selon son niveau (règles 2024, SRD 5.2) : [faible, modérée, élevée].
const BUDGET=[null,[50,75,100],[100,150,200],[150,225,400],[250,375,500],[500,750,1100],[600,1000,1400],[750,1300,1700],[1000,1700,2100],[1300,2000,2600],[1600,2300,3100],[1900,2900,4100],[2200,3700,4700],[2600,4200,5400],[2900,4900,6200],[3300,5400,7800],[3800,6100,9800],[4500,7200,11700],[5000,8700,14200],[5500,10700,17200],[6400,13200,22000]];
const NM='Résiste aux dégâts contondants, perforants et tranchants d’attaques non magiques (à appliquer par le MJ).';
const ab=(str,dex,con,int,wis,cha)=>({str,dex,con,int,wis,cha});
const M=[
 ['kobold','Kobold','1/8','Humanoïde',5,12,9,ab(7,15,9,8,7,8),{},'Sensibilité au soleil. Tactique de meute.','Dague : +4, 1d4+2 perforant. Fronde : +4 (9/36 m), 1d4+2 contondant.'],
 ['rat-geant','Rat géant','1/8','Bête',7,12,9,ab(7,15,11,2,10,4),{},'Odorat aiguisé. Tactique de meute.','Morsure : +4, 1d4+2 perforant.'],
 ['bandit','Bandit','1/8','Humanoïde',11,12,9,ab(11,12,12,10,10,10),{},'','Cimeterre : +3, 1d6+1 tranchant. Arbalète légère : +3 (24/96 m), 1d8+1 perforant.'],
 ['garde','Garde','1/8','Humanoïde',11,16,9,ab(13,12,12,10,11,10),{},'','Lance : +3, 1d6+1 perforant (1d8+1 à deux mains).'],
 ['cultiste','Cultiste','1/8','Humanoïde',9,12,9,ab(11,12,10,10,11,10),{},'Dévotion sombre : avantage aux sauvegardes contre charme et terreur.','Cimeterre : +3, 1d6+1 tranchant.'],
 ['gobelin','Gobelin','1/4','Humanoïde',7,15,9,ab(8,14,10,10,8,8),{},'Fuite agile : se désengager ou se cacher en action bonus.','Cimeterre : +4, 1d6+2 tranchant. Arc court : +4 (24/96 m), 1d6+2 perforant.'],
 ['squelette','Squelette','1/4','Mort-vivant',13,13,9,ab(10,14,15,6,8,5),{Contondant:'vuln',Poison:'immune'},'Immunisé à l’épuisement et à l’empoisonnement.','Épée courte : +4, 1d6+2 perforant. Arc court : +4 (24/96 m), 1d6+2 perforant.'],
 ['zombie','Zombie','1/4','Mort-vivant',22,8,6,ab(13,6,16,3,6,5),{Poison:'immune'},'Robustesse de mort-vivant : à 0 PV, sauvegarde de Constitution (DD 5 + dégâts) pour rester à 1 PV, sauf dégâts radiants ou coup critique.','Coup : +3, 1d6+1 contondant.'],
 ['loup','Loup','1/4','Bête',11,13,12,ab(12,15,12,3,12,6),{},'Ouïe et odorat aiguisés. Tactique de meute.','Morsure : +4, 2d4+2 perforant ; la cible tombe à terre si elle rate une sauvegarde de Force DD 11.'],
 ['acolyte','Acolyte','1/4','Humanoïde',9,10,9,ab(10,10,10,10,14,11),{},'Sorts de prêtre (Sagesse, DD 12) : flamme sacrée, soins, bénédiction, sanctuaire.','Gourdin : +2, 1d4 contondant.'],
 ['orc','Orc','1/2','Humanoïde',15,13,9,ab(16,12,16,7,11,10),{},'Agressif : se déplace vers un ennemi en action bonus.','Hache à deux mains : +5, 1d12+3 tranchant. Javeline : +5 (9/36 m), 1d6+3 perforant.'],
 ['hobgobelin','Hobgobelin','1/2','Humanoïde',11,18,9,ab(13,12,12,10,10,9),{},'Avantage martial : +2d6 dégâts une fois par tour si un allié est à 1,5 m de la cible.','Épée longue : +3, 1d8+1 tranchant. Arc long : +3 (45/180 m), 1d8+1 perforant.'],
 ['gnoll','Gnoll','1/2','Humanoïde',22,15,9,ab(14,12,11,6,10,7),{},'Déchaînement : après avoir réduit une créature à 0 PV, déplacement et morsure en action bonus.','Morsure : +4, 1d4+2 perforant. Lance : +4, 1d6+2 perforant. Arc long : +3, 1d8+1 perforant.'],
 ['worg','Worg','1/2','Créature monstrueuse',26,13,15,ab(16,13,13,7,11,8),{},'Ouïe et odorat aiguisés.','Morsure : +5, 2d6+3 perforant ; à terre si sauvegarde de Force DD 13 ratée.'],
 ['ombre','Ombre','1/2','Mort-vivant',16,12,12,ab(6,14,13,6,10,8),{Radiant:'vuln',Acide:'resist',Froid:'resist',Feu:'resist',Foudre:'resist',Tonnerre:'resist',Nécrotique:'immune',Poison:'immune'},NM+' Furtivité dans l’ombre (se cacher en action bonus). Faiblesse au soleil.','Toucher affaiblissant : +4, 2d6+2 nécrotique ; la Force de la cible baisse de 1d4 jusqu’à un repos.'],
 ['goule','Goule','1','Mort-vivant',22,12,9,ab(13,15,10,7,10,6),{Poison:'immune'},'Immunisée au charme, à l’épuisement et à l’empoisonnement.','Morsure : +2, 2d6+2 perforant. Griffes : +4, 2d4+2 tranchant ; paralysie 1 minute si sauvegarde de Constitution DD 10 ratée (sauf elfes et morts-vivants).'],
 ['loup-sinistre','Loup sinistre','1','Bête',37,14,15,ab(17,15,15,3,12,7),{},'Ouïe et odorat aiguisés. Tactique de meute.','Morsure : +5, 2d6+3 perforant ; à terre si sauvegarde de Force DD 13 ratée.'],
 ['ours-brun','Ours brun','1','Bête',34,11,12,ab(19,10,16,2,13,7),{},'Odorat aiguisé.','Attaques multiples : morsure et griffes. Morsure : +6, 1d8+4 perforant. Griffes : +6, 2d6+4 tranchant.'],
 ['araignee-geante','Araignée géante','1','Bête',26,14,9,ab(14,16,12,2,11,4),{},'Pattes d’araignée, sens de la toile, déplacement dans la toile.','Morsure : +5, 1d8+3 perforant et 2d8 poison (moitié si sauvegarde de Constitution DD 11). Toile (recharge 5-6) : +5 (9/18 m), la cible est entravée.'],
 ['gobelours','Gobelours','1','Humanoïde',27,16,9,ab(15,14,13,8,11,9),{},'Brute : un dé de dégâts supplémentaire au corps à corps. Attaque surprise : +2d6 contre une créature surprise.','Morgenstern : +4, 2d8+2 perforant. Javeline : +4, 2d6+2 perforant (1d6+2 à distance).'],
 ['spectre','Spectre','1','Mort-vivant',22,12,0,ab(1,14,11,10,10,11),{Acide:'resist',Froid:'resist',Feu:'resist',Foudre:'resist',Tonnerre:'resist',Nécrotique:'immune',Poison:'immune'},'Vol 15 m (vol stationnaire). '+NM+' Mouvement incorporel. Sensibilité au soleil.','Drain de vie : +4, 3d6 nécrotique ; les PV maximum de la cible baissent d’autant (sauvegarde de Constitution DD 10).'],
 ['harpie','Harpie','1','Créature monstrueuse',38,11,6,ab(12,13,12,7,10,13),{},'Vol 12 m.','Griffes : +3, 2d4+1 tranchant. Gourdin : +3, 1d4+1 contondant. Chant envoûtant : charme les humanoïdes à 90 m (sauvegarde de Sagesse DD 11).'],
 ['capitaine-bandit','Capitaine bandit','2','Humanoïde',65,15,9,ab(15,16,14,14,11,14),{},'Parade (réaction) : +2 à la CA contre une attaque au corps à corps.','Attaques multiples : deux coups de cimeterre et un de dague. Cimeterre : +5, 1d6+3 tranchant. Dague : +5, 1d4+3 perforant.'],
 ['ogre','Ogre','2','Géant',59,11,12,ab(19,8,16,5,7,7),{},'','Massue : +6, 2d8+4 contondant. Javeline : +6 (9/36 m), 2d6+4 perforant.'],
 ['gargouille','Gargouille','2','Élémentaire',52,15,9,ab(15,11,16,6,11,7),{Poison:'immune'},NM+' Vol 18 m. Apparence trompeuse : immobile, elle ressemble à une statue.','Attaques multiples : morsure et griffes. Morsure : +4, 1d6+2 perforant. Griffes : +4, 1d6+2 tranchant.'],
 ['cube-gelatineux','Cube gélatineux','2','Vase',84,6,4.5,ab(14,3,20,1,6,1),{},'Transparent : difficile à repérer à l’arrêt.','Pseudopode : +4, 3d6 acide. Engloutir : la créature est engloutie, 3d6 acide (sauvegarde de Dextérité DD 12).'],
 ['mimique','Mimique','2','Créature monstrueuse',58,12,4.5,ab(17,12,15,5,13,8),{Acide:'immune'},'Change de forme (par exemple en coffre). Adhésif : agrippe ce qui la touche.','Pseudopode : +5, 1d8+3 contondant, la cible est agrippée. Morsure : +5, 1d8+3 perforant et 1d8 acide.'],
 ['hibours','Hibours','3','Créature monstrueuse',59,13,12,ab(20,12,17,3,12,7),{},'Vue et odorat aiguisés.','Attaques multiples : bec et griffes. Bec : +7, 1d10+5 perforant. Griffes : +7, 2d8+5 tranchant.'],
 ['minotaure','Minotaure','3','Créature monstrueuse',76,14,12,ab(18,11,16,6,16,9),{},'Charge : +2d8 si 3 m parcourus en ligne droite, puis repousse ou fait tomber (sauvegarde de Force DD 14). Mémoire des labyrinthes. Imprudent.','Grande hache : +6, 2d12+4 tranchant. Encorner : +6, 2d8+4 perforant.'],
 ['basilic','Basilic','3','Créature monstrueuse',52,15,6,ab(16,8,15,2,8,7),{},'Regard pétrifiant à 9 m (sauvegarde de Constitution DD 12).','Morsure : +5, 2d6+3 perforant et 2d6 poison.'],
 ['manticore','Manticore','3','Créature monstrueuse',68,14,9,ab(17,16,17,7,12,8),{},'Vol 15 m. Repousse ses pointes de queue (24 par jour).','Attaques multiples : morsure et deux griffes, ou trois pointes. Morsure : +5, 1d8+3 perforant. Griffes : +5, 1d6+3 tranchant. Pointe de queue : +5 (30/60 m), 1d8+3 perforant.'],
 ['veteran','Vétéran','3','Humanoïde',58,17,9,ab(16,13,14,10,11,10),{},'','Attaques multiples : deux coups d’épée longue et un d’épée courte. Épée longue : +5, 1d8+3 tranchant. Épée courte : +5, 1d6+3 perforant. Arbalète lourde : +3, 1d10+1 perforant.'],
 ['troll','Troll','5','Géant',84,15,9,ab(18,13,20,7,9,7),{},'Régénération : récupère 10 PV au début de son tour, sauf s’il a subi des dégâts d’acide ou de feu ; ne meurt que s’il commence son tour à 0 PV sans régénérer.','Attaques multiples : morsure et deux griffes. Morsure : +7, 1d6+4 perforant. Griffes : +7, 2d6+4 tranchant.'],
 ['rejeton-vampire','Rejeton vampire','5','Mort-vivant',82,15,9,ab(16,16,16,11,10,12),{Nécrotique:'resist'},NM+' Régénération 10 (sauf dégâts radiants ou eau bénite). Pattes d’araignée. Faiblesses du vampire.','Attaques multiples : deux attaques, une seule morsure. Griffes : +6, 2d4+3 tranchant. Morsure : +6, 1d6+3 perforant et 3d6 nécrotique.'],
 ['mage','Mage','6','Humanoïde',40,12,9,ab(9,14,11,17,12,11),{},'Sorts de magicien (Intelligence, DD 14, +6) : projectile magique, bouclier, boule de feu, contresort, vol, invisibilité supérieure, cône de froid… CA 15 avec armure de mage.','Dague : +5, 1d4+2 perforant.'],
 ['wiverne','Wiverne','6','Dragon',110,13,6,ab(19,10,16,5,12,6),{},'Vol 24 m.','Attaques multiples : morsure et dard (en vol : griffes possibles). Morsure : +7, 2d6+4 perforant. Griffes : +7, 2d8+4 tranchant. Dard : +7, 2d6+4 perforant et 7d6 poison (moitié si sauvegarde de Constitution DD 15).'],
 ['jeune-dragon-rouge','Jeune dragon rouge','10','Dragon',178,18,12,ab(23,10,21,14,11,19),{Feu:'immune'},'Vol 24 m, escalade 12 m.','Attaques multiples : morsure et deux griffes. Morsure : +10, 2d10+6 perforant et 1d6 feu. Griffes : +10, 2d6+6 tranchant. Souffle de feu (recharge 5-6) : cône de 9 m, 16d6 feu (moitié si sauvegarde de Dextérité DD 17).']
];
// Correspondance avec l'index SRD : ces fiches rédigées en français remplacent l'entrée SRD équivalente.
const SRD_OF={kobold:'kobold','rat-geant':'giant-rat',bandit:'bandit',garde:'guard',cultiste:'cultist',gobelin:'goblin',squelette:'skeleton',zombie:'zombie',loup:'wolf',acolyte:'acolyte',orc:'orc',hobgobelin:'hobgoblin',gnoll:'gnoll',worg:'worg',ombre:'shadow',goule:'ghoul','loup-sinistre':'dire-wolf','ours-brun':'brown-bear','araignee-geante':'giant-spider',gobelours:'bugbear',spectre:'specter',harpie:'harpy','capitaine-bandit':'bandit-captain',ogre:'ogre',gargouille:'gargoyle','cube-gelatineux':'gelatinous-cube',mimique:'mimic',hibours:'owlbear',minotaure:'minotaur',basilic:'basilisk',manticore:'manticore',veteran:'veteran',troll:'troll','rejeton-vampire':'vampire-spawn',mage:'mage',wiverne:'wyvern','jeune-dragon-rouge':'young-red-dragon'};
const CURATED=M.map(([id,name,cr,type,hp,ac,speed,abilities,defenses,traits,actions])=>Object.freeze({id,name,cr,type,hp,ac,speed,abilities,defenses,traits,actions,legendary:'',xp:XP_BY_CR[cr],srd:SRD_OF[id]||'',curated:true}));
let FULL=null,loading=null;
function fromSrd(r){const [index,name,nameEn,cr,type,hp,ac,speed,a,defenses,traits,actions,legendary,xp,sc,alias]=r;return Object.freeze({spellcasting:sc?{ability:sc[0],dc:sc[1],attack:sc[2],slots:sc[3],spells:sc[4]}:null,id:'srd-'+index,name,nameEn,cr,type,hp,ac,speed,abilities:{str:a[0],dex:a[1],con:a[2],int:a[3],wis:a[4],cha:a[5]},defenses:defenses||{},traits:traits||'',actions:actions||'',legendary:legendary||'',xp:xp||XP_BY_CR[cr]||0,srd:index,alias:alias||''});}
function merge(rows){const curatedBySrd=new Map(CURATED.map(c=>[c.srd,c]));const out=rows.map(r=>{const e=fromSrd(r);const c=curatedBySrd.get(e.srd);const en=typeof window!=='undefined'&&window.ChroniquesI18n&&window.ChroniquesI18n.lang==='en';if(c&&en)return Object.freeze({...c,...e,alias:''});return c?Object.freeze({...c,name:e.name,nameEn:e.nameEn,legendary:e.legendary,spellcasting:e.spellcasting,alias:e.name!==c.name?c.name:e.alias}):e;});
 for(const c of CURATED)if(!out.some(e=>e.id===c.id))out.push(c);
 const order=cr=>cr.includes('/')?Number(cr.split('/')[0])/Number(cr.split('/')[1]):Number(cr);return out.sort((x,y)=>order(x.cr)-order(y.cr)||x.name.localeCompare(y.name,'fr'));}
function fullLoaded(){return FULL!==null;}
// Charge le bestiaire SRD complet (334 créatures) à la demande : navigateur → script, Node → require.
function loadFull(){if(FULL)return Promise.resolve(FULL);if(loading)return loading;
 loading=new Promise((ok,ko)=>{
  if(typeof window==='undefined'||typeof document==='undefined'){try{FULL=merge(require('./data/srd-monsters.js'));ok(FULL);}catch(e){ko(e);}return;}
  const EN=(typeof window!=='undefined'&&window.ChroniquesI18n&&window.ChroniquesI18n.lang==='en'),G=EN?'ChroniquesSRDMonstersEn':'ChroniquesSRDMonsters';// 5.2 : noms et textes anglais si l'interface est en anglais.
  if(window[G]){FULL=merge(window[G]);ok(FULL);return;}
  const sc=document.createElement('script');sc.src=EN?'/src/data/srd-monsters.en.js':'/src/data/srd-monsters.js';sc.onload=()=>{FULL=merge(window[G]||[]);ok(FULL);};sc.onerror=()=>{loading=null;ko(new Error('Bestiaire SRD indisponible.'));};document.head.appendChild(sc);
 });return loading;}
function list(){return FULL||CURATED;}
function get(id){return list().find(m=>m.id===id)||CURATED.find(m=>m.id===id)||null;}
function initiativeBonus(m){return Math.floor((m.abilities.dex-10)/2);}
// Valeurs prêtes pour une fiche de créature (masquée par défaut ; l'initiative réelle est saisie après le jet).
// Sorts groupés par niveau, en texte lisible : « Tours de magie : … · Niv. 1 : … · 3/jour : … ».
function spellcastingValues(sc){if(!sc)return null;const by=new Map();for(const [lvl,name,usage] of sc.spells||[]){const k=usage?usage:(lvl===0?'Tours de magie':'Niv. '+lvl);if(!by.has(k))by.set(k,[]);by.get(k).push(name);}
 const spells=[...by.entries()].map(([k,v])=>k+' : '+v.join(', ')).join(' · ').slice(0,1500);
 return {ability:sc.ability||'',dc:sc.dc??null,attack:sc.attack??null,slots:(sc.slots||[]).slice(0,9).concat(Array(9).fill(0)).slice(0,9).map(n=>Math.min(9,Number(n)||0)),spells};}
function creatureValues(m,{visibility='hidden'}={}){return {srd:m.srd||'',name:m.name,kind:'monstre',hpMax:m.hp,ac:m.ac,initiative:initiativeBonus(m),speed:Math.round(m.speed),visibility,showHp:false,actions:m.actions,notes:`Bestiaire SRD : ${m.type}${m.nameEn&&m.nameEn!==m.name?' ('+m.nameEn+')':''}, FP ${m.cr} (${m.xp} XP). Initiative : 1d20 ${initiativeBonus(m)>=0?'+':'−'} ${Math.abs(initiativeBonus(m))}.`,traits:m.traits,legendary:m.legendary||'',defenses:{...m.defenses},abilities:{...m.abilities},cr:m.cr,spellcasting:spellcastingValues(m.spellcasting)};}
function xpFor(cr){return XP_BY_CR[String(cr)]??null;}
// Difficulté d'une rencontre : total d'XP des créatures comparé au budget du groupe.
function difficulty(levels,crs){
 const lv=(levels||[]).map(n=>Math.min(20,Math.max(1,Math.floor(Number(n)||1))));
 const budget=lv.reduce((b,l)=>[b[0]+BUDGET[l][0],b[1]+BUDGET[l][1],b[2]+BUDGET[l][2]],[0,0,0]);
 let xp=0,unknown=0;for(const cr of crs||[]){const v=xpFor(cr);if(v===null)unknown++;else xp+=v;}
 const label=!lv.length?'Groupe vide':xp===0?'Aucune créature cotée':xp<=budget[0]?'Faible':xp<=budget[1]?'Modérée':xp<=budget[2]?'Élevée':'Au-delà d’élevée';
 return {xp,unknown,budget:{low:budget[0],moderate:budget[1],high:budget[2]},label};
}
// Milieux : regroupement AUTOMATIQUE d'après le type et les capacités notées (nage, vol, fouissement,
// sensibilité au soleil…). Aide au choix, pas une table officielle ; aucun tirage au hasard.
const HABITATS=[['aquatique','Eaux et côtes'],['souterrain','Souterrains'],['airs','Airs et montagnes'],['nature','Forêts et plaines'],['crypte','Cryptes et ruines'],['ville','Villes et routes'],['plans','Plans et magie'],['dragons','Dragons']];
function habitats(m){const t=String(m.traits||'')+' '+String(m.actions||'');const type=(String(m.type||'').match(/^(Nuée de bêtes|Créature monstrueuse|Créature artificielle|Mort-vivant|[^\s(]+)/)||[''])[0];const out=new Set();
 if(/déplacements : [^·]*nage|amphibie|respiration aquatique|respire sous l’eau|retenir son souffle/i.test(t))out.add('aquatique');
 if(/sensibilité au soleil|creusement|fouissement|toile|pattes d’araignée|vision aveugle/i.test(t)||['Aberration','Vase'].includes(type)||/drow|duergar|grimlock|torve|kobold|quaggoth/i.test(m.name+' '+(m.nameEn||'')))out.add('souterrain');
 if(/déplacements : [^·]*vol/i.test(t))out.add('airs');
 if(['Bête','Plante','Fée','Nuée de bêtes'].includes(type)||(type==='Créature monstrueuse'&&!out.has('souterrain')))out.add('nature');
 if(['Mort-vivant','Créature artificielle'].includes(type))out.add('crypte');
 if(type==='Humanoïde'||/(^| )(rat|chat|chien|cheval|mule|corbeau)/i.test(m.name))out.add('ville');
 if(['Céleste','Fiélon','Élémentaire'].includes(type))out.add('plans');
 if(type==='Dragon')out.add('dragons');
 if(type==='Géant')out.add(/givre|nuages|tempête/i.test(m.name)?'airs':'nature');
 if(!out.size)out.add('nature');return [...out];}
return {HABITATS,habitats,list,get,creatureValues,xpFor,difficulty,XP_BY_CR,BUDGET,initiativeBonus,loadFull,fullLoaded,curated:()=>CURATED};
});

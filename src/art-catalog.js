/* Chroniques — illustrations EXISTANTES de Game-icons.net, hébergées localement (assets/icons).
 * Licence CC BY 3.0 ; auteurs Lorc et Delapouite. Voir CREDITS_ILLUSTRATIONS.md.
 * Elles ne sont PAS des illustrations officielles de D&D. Aucune connexion Internet requise.
 * Aucune donnée de campagne ni jeton n'est envoyé dans les URL d'images.
 */
(function(root,factory){const a=factory();if(typeof module==='object'&&module.exports)module.exports=a;if(root)root.ChroniquesArt=a;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const catalog={
 npc: {
  delapouite:`bear-head centaur devil-mask fairy floating-ghost fish-monster giant-squid goblin-head golem-head ice-golem kraken-tentacle mermaid metal-golem-head mummy-head ogre orc-head rattlesnake resting-vampire rock-golem sand-snake shambling-zombie slime spider-eye spider-mask spiked-dragon-head tiger-head tiger unicorn vampire-dracula`,
  lorc:`alien-skull angular-spider bat-wing crowned-skull cyclops daemon-skull direwolf double-dragon dragon-breath dragon-head dragon-spiral ghost hound hydra sea-dragon robot-golem skull-crossed-bones skull-shield snake snake-totem spider-web squid-head tentacles-skull werewolf wolf-head wolf-howl`
 },
 spell: {
  delapouite:`bolt-spell-cast fire-flower fire-gem fire-iris fire-spell-cast flint-spark healing healing-shield holy-water ice-iris ice-spell-cast lightning-dome lightning-flame magic-potion magick-trick sparkles spell-book temporary-shield water-flask`,
  lorc:`alien-fire arcing-bolt aura beams-aura big-wave black-hand-shield bolt-eye dragon-breath fireball fire-shield flame-claws frozen-orb ghost-ally magic-palm poison-bottle skull-bolt thunder-skull`
 },
 item: {
  delapouite:`3d-hammer abdominal-armor ancient-sword armor-upgrade backpack black-knight-helm bone-mace boss-key bow-arrow cape-armor centurion-helmet chest chest-armor coins coins-pile crescent-staff crystal-earrings dagger-rose diamond-ring flanged-mace gauntlet gloves health-potion heart-key jewel-crown leather-armor magic-axe magic-potion magic-trident mimic-chest ninja-armor overlord-helm pendant-key quiver ring roman-shield rusty-sword samurai-helmet scroll-quill sharp-axe shoulder-armor skull-staff spartan-helmet spiked-shield viking-shield`,
  lorc:`battle-axe bloody-sword dragon-shield poison-bottle skull-ring skull-shield skeleton-key`
 },
 character: {
  portraits:`delapouite/barbarian lorc/lyre delapouite/sun-priest cathelineau/tree-face lorc/crested-helmet delapouite/monk-face lorc/visored-helm lorc/bowman darkzaitzev/hooded-assassin lorc/magic-swirl delapouite/warlock-hood delapouite/wizard-face delapouite/woman-elf-face kier-heyl/elf-helmet delapouite/dwarf-face kier-heyl/dwarf-helmet delapouite/viking-head delapouite/kenku-head lorc/lizardman darkzaitzev/hooded-figure lorc/cowled cathelineau/swordwoman cathelineau/swordman cathelineau/nun-face cathelineau/witch-face lorc/pointy-hat darkzaitzev/ninja-head delapouite/archer cathelineau/bad-gnome lorc/imp lorc/horned-helm delapouite/robin-hood-hat lorc/beard skoll/troll`,
  delapouite:`bear-head centaur devil-mask fairy goblin-head golem-head mermaid mummy-head ogre orc-head samurai-helmet tiger-head unicorn vampire-dracula`,
  lorc:`cyclops dragon-head ghost hound skull-mask werewolf wolf-head`
 }
};
const LABELS_FR={barbarian:'Barbare',lyre:'Barde (lyre)','sun-priest':'Clerc','tree-face':'Druide','crested-helmet':'Guerrier','monk-face':'Moine','visored-helm':'Paladin',bowman:'Rôdeur (archer)','hooded-assassin':'Roublard','magic-swirl':'Ensorceleur','warlock-hood':'Occultiste','wizard-face':'Magicien','woman-elf-face':'Elfe','elf-helmet':'Elfe casqué','dwarf-face':'Nain','dwarf-helmet':'Nain casqué','viking-head':'Guerrier du Nord','kenku-head':'Kenku','lizardman':'Homme-lézard / drakéide','hooded-figure':'Silhouette encapuchonnée',cowled:'Voyageur encapuchonné',swordwoman:'Bretteuse',swordman:'Bretteur','nun-face':'Religieuse','witch-face':'Sorcière','pointy-hat':'Chapeau de mage','ninja-head':'Ombre masquée',archer:'Archer','bad-gnome':'Gnome',imp:'Tieffelin / diablotin','horned-helm':'Casque à cornes','robin-hood-hat':'Chapeau d’éclaireur',beard:'Barbu',troll:'Troll'};
const entries=[];
for(const [kind,authors] of Object.entries(catalog))for(const [group,names] of Object.entries(authors))for(const ref of names.split(/\s+/).filter(Boolean)){
 // Le groupe « portraits » liste des identifiants complets auteur/icône (aventuriers, proposés en premier).
 const [artist,slug]=group==='portraits'?ref.split('/'):[group,ref];const id=artist+'/'+slug;
 if(!entries.some(x=>x.id===id&&x.kind===kind))entries.push(Object.freeze({id,kind,name:slug.replace(/-/g,' '),label:LABELS_FR[slug]||'',artist,license:'CC BY 3.0'}));
}
// Portraits d'aventuriers (classes, espèces, archétypes) ; les autres icônes « character » sont des créatures.
const PORTRAITS=new Set(catalog.character.portraits.split(/\s+/).filter(Boolean));
function isPortrait(id){return PORTRAITS.has(id);}
function byKind(kind){return entries.filter(e=>e.kind===kind);}
function get(id,kind){return entries.find(e=>e.id===id&&(!kind||e.kind===kind))||null;}
function src(id){if(!entries.some(e=>e.id===id))return null;const slug=id.split('/')[1];return `/assets/icons/${slug}.svg`;}
function suggest(kind,name){const text=String(name||'').toLowerCase();const e=byKind(kind).find(e=>text.includes(e.name.replace(/\s+/g,' '))||e.name.split(' ').every(part=>part.length>2&&text.includes(part)));return e||byKind(kind)[0]||null;}
const mapping={
 npc:[[/dragon|drak|wyvern/i,'lorc/dragon-head'],[/loup|wolf/i,'lorc/wolf-head'],[/orc/i,'delapouite/orc-head'],[/gobelin|goblin/i,'delapouite/goblin-head'],[/golem/i,'delapouite/golem-head'],[/zombi/i,'delapouite/shambling-zombie'],[/fantôme|spectre|ghost/i,'lorc/ghost'],[/vampir/i,'delapouite/vampire-dracula'],[/hydre|hydra/i,'lorc/hydra'],[/araign|spider/i,'lorc/angular-spider'],[/licorne|unicorn/i,'delapouite/unicorn'],[/ours|bear/i,'delapouite/bear-head'],[/squelet|skull/i,'lorc/skull-crossed-bones']],
 spell:[[/boule de feu|fireball/i,'lorc/fireball'],[/trait de feu|flam|incend/i,'delapouite/fire-spell-cast'],[/guéri|soins|healing/i,'delapouite/healing'],[/bouclier|shield/i,'delapouite/healing-shield'],[/froid|givre|ice|frost/i,'delapouite/ice-spell-cast'],[/éclair|thunder|lightning/i,'delapouite/lightning-flame'],[/mage|magie|enchant|arcane/i,'delapouite/spell-book'],[/eau|water/i,'delapouite/water-flask'],[/bénédic|bless|sacré|holy/i,'delapouite/holy-water']],
 item:[[/épée|sword|lame/i,'delapouite/ancient-sword'],[/hache|axe/i,'delapouite/sharp-axe'],[/arc|bow/i,'delapouite/bow-arrow'],[/armure|armor|cuir/i,'delapouite/leather-armor'],[/bouclier|shield/i,'delapouite/spiked-shield'],[/potion|soin|health/i,'delapouite/health-potion'],[/coffre|chest/i,'delapouite/chest'],[/bague|ring/i,'delapouite/diamond-ring'],[/clé|key/i,'delapouite/boss-key'],[/or|pièce|coin/i,'delapouite/coins'],[/dague|dagger/i,'delapouite/dagger-rose'],[/casque|helm/i,'delapouite/black-knight-helm']]
};
// Portrait par défaut d'un aventurier selon sa classe (aucune image choisie).
const CLASS_PORTRAITS={barbarian:'delapouite/barbarian',bard:'lorc/lyre',cleric:'delapouite/sun-priest',druid:'cathelineau/tree-face',fighter:'lorc/crested-helmet',monk:'delapouite/monk-face',paladin:'lorc/visored-helm',ranger:'lorc/bowman',rogue:'darkzaitzev/hooded-assassin',sorcerer:'lorc/magic-swirl',warlock:'delapouite/warlock-hood',wizard:'delapouite/wizard-face'};
function classPortrait(classId){return CLASS_PORTRAITS[classId]||'darkzaitzev/hooded-figure';}
function contextual(kind,name){const text=String(name||'');const found=(mapping[kind]||[]).find(([re])=>re.test(text));const e=found?get(found[1],kind):null;return e?src(e.id):null;}
return {entries,byKind,get,src,suggest,contextual,classPortrait,CLASS_PORTRAITS,PORTRAITS,isPortrait};
});

/* Chroniques V2.7 — parcours guidés selon le rôle (progression locale par appareil). */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.ChroniquesOnboarding=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
const gm=[
 {id:'campaign',title:'Vérifier la campagne',description:'Ouvre Campagne. Vérifie le nom, les joueurs et qui possède le rôle MJ.',page:'campaign',action:'Ouvrir Campagne'},
 {id:'characters',title:'Préparer les personnages',description:'Ouvre les fiches : crée un personnage ou vérifie ses caractéristiques avec son joueur.',page:'character',action:'Voir les fiches'},
 {id:'invite',title:'Inviter ton groupe',description:'Dans Campagne, choisis un personnage puis « Inviter ce joueur » : un QR code à scanner et un lien à envoyer, valables 24 h.',page:'campaign',action:'Gérer les invitations'},
 {id:'stories',title:'Préparer le fil de l’aventure',description:'Dans Assistant de scénario, pose une accroche, les enjeux et trois temps forts. Relie ensuite tes lieux et tes scènes.',page:'stories',action:'Ouvrir l’assistant'},
 {id:'maps',title:'Préparer une carte ou une rencontre',description:'Ajoute une carte ou une rencontre, puis décide ce que les joueurs peuvent découvrir.',page:'maps',action:'Ouvrir les cartes'},
 {id:'combat',title:'Vérifier le tableau MJ',description:'Teste les initiatives notées après les jets réels et les ressources avant la séance.',page:'combat',action:'Ouvrir le combat'},
 {id:'memory',title:'Retrouver les décisions importantes',description:'Dans Journal & quêtes, consigne les décisions, indices et conséquences. Partage uniquement les souvenirs utiles aux joueurs.',page:'chronicle',action:'Ouvrir la mémoire'},
 {id:'inventory',title:'Préparer et distribuer le butin',description:'Prépare un coffre dans Cartes de campagne, déplace un objet depuis ta réserve MJ, révèle-le si besoin et attribue son contenu.',page:'maps',action:'Préparer un coffre'}
];
const player=[
 {id:'sheet',title:'Découvrir ta fiche',description:'Vérifie ton personnage, tes caractéristiques et tes PV avec ton MJ.',page:'character',action:'Ouvrir ma fiche'},
 {id:'actions',title:'Comprendre tes actions',description:'Repère action, action bonus, réaction, déplacements et ressources. Utilise toujours tes vrais dés.',page:'combat',action:'Ouvrir le combat'},
 {id:'spells',title:'Consulter tes sorts',description:'Vérifie tes sorts connus ou préparés et les emplacements disponibles.',page:'grimoire',action:'Ouvrir le grimoire'},
 {id:'inventory',title:'Vérifier ton équipement',description:'Ajoute, équipe et suis tes objets sans modifier automatiquement tes statistiques.',page:'inventory',action:'Mon inventaire'},
 {id:'maps',title:'Voir les découvertes',description:'Consulte les cartes, repères et contenus de coffres révélés par le MJ.',page:'maps',action:'Voir les cartes'},
 {id:'mobile',title:'Installer sur ton téléphone',description:'Sur iPhone, Safari → Partager → Sur l’écran d’accueil. Sur Android, Chrome → Installer.',page:'guide',action:'Ouvrir l’aide'}
];
function steps(role){return role==='gm'?gm:player;}
function decode(value,role){const valid=steps(role).map(x=>x.id);if(!value||typeof value!=='object')return [];return [...new Set(Array.isArray(value.done)?value.done:[])].filter(x=>valid.includes(x));}
function key(name,role){return 'chroniques-onboarding-v26-'+encodeURIComponent(String(name||'').slice(0,50))+'-'+role;}
function progress(role,done){return {total:steps(role).length,done:decode({done},role).length,next:steps(role).find(x=>!done.includes(x.id))||null};}
return {steps,decode,key,progress};
});

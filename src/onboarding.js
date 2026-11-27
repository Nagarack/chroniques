/* Chroniques V2.7 — parcours guidés selon le rôle (progression locale par appareil). */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.ChroniquesOnboarding=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
const gm=[
 {id:'campaign',title:'Vérifier la campagne',description:'Ouvrez Mes campagnes. Vérifiez le nom, les joueurs et qui possède le rôle de MJ.',page:'campaign',action:'Ouvrir Mes campagnes'},
 {id:'characters',title:'Préparer les personnages',description:'Ouvrez les fiches : créez un personnage ou vérifiez ses caractéristiques avec son joueur.',page:'character',action:'Voir les fiches'},
 {id:'invite',title:'Inviter votre groupe',description:'Dans Mes campagnes, choisissez un personnage puis « Inviter ce joueur » : un QR code à scanner et un lien à envoyer, valables 24 h.',page:'campaign',action:'Gérer les invitations'},
 {id:'stories',title:'Préparer le fil de l’aventure',description:'Dans l’assistant de scénario, posez une accroche, les enjeux et trois temps forts. Reliez ensuite vos lieux et vos scènes.',page:'stories',action:'Ouvrir l’assistant'},
 {id:'maps',title:'Préparer une carte ou une rencontre',description:'Ajoutez une carte ou une rencontre, puis décidez de ce que les joueurs peuvent découvrir.',page:'maps',action:'Ouvrir les cartes'},
 {id:'combat',title:'Vérifier le tableau MJ',description:'Essayez la saisie des initiatives (après de vrais jets) et le suivi des ressources avant la séance.',page:'combat',action:'Ouvrir le combat'},
 {id:'memory',title:'Retrouver les décisions importantes',description:'Dans la Chronique, consignez les décisions, les indices et leurs conséquences. Ne partagez que les souvenirs utiles aux joueurs.',page:'chronicle',action:'Ouvrir la mémoire'},
 {id:'inventory',title:'Préparer et distribuer le butin',description:'Préparez un coffre sur une carte, déplacez-y un objet de votre réserve, révélez-le au bon moment et attribuez son contenu.',page:'maps',action:'Préparer un coffre'}
];
const player=[
 {id:'sheet',title:'Découvrir votre fiche',description:'Vérifiez votre personnage, ses caractéristiques et ses PV avec votre MJ.',page:'character',action:'Ouvrir ma fiche'},
 {id:'actions',title:'Comprendre vos actions',description:'Repérez l’action, l’action bonus, la réaction, le déplacement et vos ressources. Lancez toujours vos vrais dés.',page:'combat',action:'Ouvrir le combat'},
 {id:'spells',title:'Consulter vos sorts',description:'Vérifiez vos sorts connus ou préparés et les emplacements disponibles.',page:'grimoire',action:'Ouvrir le grimoire'},
 {id:'inventory',title:'Vérifier votre équipement',description:'Ajoutez, équipez et suivez vos objets ; vos statistiques ne changent pas toutes seules.',page:'inventory',action:'Mon inventaire'},
 {id:'maps',title:'Voir les découvertes',description:'Consultez les cartes, les repères et le contenu des coffres révélés par le MJ.',page:'maps',action:'Voir les cartes'},
 {id:'mobile',title:'Installer sur votre téléphone',description:'Android : installez l’application Chroniques (Paramètres → Application Android) ou, dans Chrome, Menu ⋮ → Installer. iPhone : Safari → Partager → Sur l’écran d’accueil.',page:'guide',action:'Ouvrir l’aide'}
];
function steps(role){return role==='gm'?gm:player;}
function decode(value,role){const valid=steps(role).map(x=>x.id);if(!value||typeof value!=='object')return [];return [...new Set(Array.isArray(value.done)?value.done:[])].filter(x=>valid.includes(x));}
function key(name,role){return 'chroniques-onboarding-v26-'+encodeURIComponent(String(name||'').slice(0,50))+'-'+role;}
function progress(role,done){return {total:steps(role).length,done:decode({done},role).length,next:steps(role).find(x=>!done.includes(x.id))||null};}
return {steps,decode,key,progress};
});

# Journal des modifications

## 5.12.0 — Lecture à voix haute, ordre de marche et veilles, écran allumé, couleur de campagne, sauvegarde et historique de l’administration
- **Lecture à voix haute** : bouton « 🔊 Lire à voix haute » sous le texte à lire des scènes (MJ ; joueurs quand la scène est en scène) et dans les documents reçus. Voix intégrée à l’appareil (synthèse vocale du navigateur), en français ou en anglais selon la langue ; « ■ Arrêter la lecture » pour couper. Le bouton n’apparaît pas si l’appareil ne sait pas lire.
- **Ordre de marche et tours de garde** (Chronique → Voyages) : chaque joueur place son personnage devant, au milieu ou derrière ; le MJ place tout le monde et partage la nuit (6 à 12 h) en 1 à 4 veilles. Horaires de chaque veille depuis le début du repos, rappel SRD (au plus 2 h d’activité légère pendant un repos long). L’ordre de marche s’affiche dans le panneau du voyage en cours.
- **Écran toujours allumé** (Mon compte, par appareil) : empêche la mise en veille tant que Chroniques est affiché. Automatique sur l’écran de table, le lien spectateur et en mode table unique. Selon le navigateur (API Screen Wake Lock).
- **Couleur et emblème de la campagne** (Mes campagnes, MJ) : 8 couleurs et 20 emblèmes ; liseré en haut de l’écran, emblème à la place de ✦ et dans la liste des campagnes. La couleur reste décorative (jamais sur du texte).
- **Administration → Serveur** : « 💾 Sauvegarder maintenant » (sauvegarde complète, copie miroir comprise), liste des 10 dernières sauvegardes complètes et **historique de l’administration** (liens de mot de passe, connexions fermées, suspensions, réactivations, sauvegardes, décisions sur les suggestions ; 200 derniers).

## 5.11.0 — Lunes, signal sur la carte, gestion des comptes, sauts et chutes
- **Lunes du calendrier** (Chronique → Calendrier → « 🌙 Lunes », MJ) : jusqu’à trois lunes avec leur cycle (décimales permises) et le nombre de jours avant la prochaine pleine lune. Les huit phases s’affichent sous la date pour toute la table ; chaque pleine lune franchie quand le temps passe (repos, voyage, « Faire passer ») est annoncée dans le journal. Changer de calendrier garde la phase.
- **Signal sur la carte** : Alt+clic, appui long ou bouton « 📍 Signaler » ; une onde (bleue pour le MJ) s’affiche quelques secondes chez toute la table avec le nom de son auteur, y compris sur l’écran de table (pas sur le lien spectateur, mis à jour toutes les 4 secondes). Rien n’est enregistré ; un signal par personne et par demi-seconde ; sur une carte privée, seul le MJ le reçoit. Animation réduite si le système le demande.
- **Gestion des comptes** (Administration → Serveur → Comptes) : lien de nouveau mot de passe pour n’importe quel compte (2 h, usage unique), fermeture de toutes ses connexions (ou de vos autres connexions), suspension et réactivation. Un compte suspendu ne se connecte plus (mot de passe, clé d’accès, lien de réinitialisation) ; ses données restent en place. L’administrateur ne peut pas se suspendre.
- **Sauts et chutes** (fiche → Actions & ressources) : sauts en longueur et en hauteur, avec et sans élan, depuis la Force (SRD 5.1 et 5.2), option sort Saut (× 3) ; hauteur de chute → nombre de d6 contondants à lancer (20d6 au plus) et rappel « À terre ». En mètres ou en pieds selon la langue.

## 5.10.0 — Mode table unique, personnalité, journal de voyage, accessibilité, administration du serveur
**Autour de la table**
- **Mode table unique** (Mon compte, MJ) : une seule tablette posée sur la table. Elle affiche « Qui joue ? » ; chaque joueur touche son personnage et voit sa fiche comme sur son propre appareil, puis la rend avec « Changer de joueur ». Le serveur traite la tablette comme un joueur (aucun secret du MJ envoyé, seules les actions du personnage choisi) ; réglages du compte, invitations, export et administration y sont fermés. Seul le code du MJ (4 à 8 chiffres) en fait sortir, et le mode survit à un redémarrage du serveur.
- **Personnalité** (fiche → Histoire) : traits, idéaux, liens et défauts (SRD 5.1), gardés pour le joueur et le MJ ou partagés avec le groupe ; liens avec les autres personnages (« doit la vie à Brunna »), visibles de toute la table, avec ce que les autres disent de chacun.

**Exploration**
- **Journal de voyage** (Chronique → Voyages) : départ, heures de marche, déplacements sur la carte en hexagones, campements et arrivée s’inscrivent seuls, jour par jour, avec la date du monde et les kilomètres. Chacun ajoute lieux et rencontres ; le MJ peut garder une note pour lui.

**Accessibilité**
- **Lecture facilitée** : police OpenDyslexic (SIL OFL 1.1, fournie avec Chroniques), texte plus espacé, sans italique.
- **Couleurs pour daltoniens** : palette Okabe-Ito pour les jetons, zones de sort et dessins, symbole sur chaque jeton (● ▲ ■ ◆ ★ ✕) et tracés différents pour les zones et les dessins. Réglages propres à chaque appareil.

**Améliorer Chroniques ensemble**
- **Idées de tous** : chacun voit les idées des autres, sans leur auteur ni leur campagne, et les soutient d’un « +1 » (pas les siennes). L’administrateur trie par soutiens.
- **Administration du serveur** : nouveaux onglets Serveur (version, durée de fonctionnement, adresse, comptes et leurs campagnes, campagnes avec MJ, membres, dernière activité et taille, base, images, sauvegardes, espace libre, dernière sauvegarde complète, copie miroir) et Signalements (toutes campagnes).

**Corrections** : la ligne du groupe sur l’accueil ne contient plus d’élément interactif dans un bouton (accessibilité).

## 5.9.0 — Mise en scène, rencontres posées sur la carte, suggestions et administration
**Raconter**
- **Mise en scène** : une scène de séance reçoit un texte à lire et une image. « 🎭 Mettre en scène » l’affiche sur l’écran de table, sur l’accueil des joueurs et chez le spectateur, passe la scène « en cours » et lance son ambiance sonore. Les notes du MJ ne sont jamais envoyées ; l’image n’est servie aux joueurs que pendant la mise en scène.

**Combat**
- **Rencontre posée sur une carte** : en lançant une rencontre préparée, choisissez une carte puis touchez-la : un jeton par créature, en formation autour du point touché, masqué si la créature l’est. La place disponible sur la carte est vérifiée avant d’ajouter les créatures.

**Améliorer Chroniques ensemble**
- **Suggestions d’amélioration** : chaque compte, MJ ou joueur, envoie une idée depuis Mon compte → « 💡 Proposer une amélioration » (domaine, idée, détails) et retrouve ensuite son statut et la réponse.
- **Administration** : l’administrateur du serveur (le compte créé à l’installation) lit les suggestions de toutes les campagnes, les filtre, les marque « nouvelle », « retenue », « faite » ou « non retenue », répond à l’auteur, les supprime ou copie la liste. Un compteur signale les nouvelles suggestions. Les suggestions sont gardées hors des campagnes, dans la base du serveur.

## 5.8.0 — Horloges, étoiles et souhaits, tableau d’enquête, dessins et altitude sur les cartes
**Préparer et raconter**
- **Horloges de progression** (Séance du jour) : un cercle de 4 à 12 segments pour une menace qui approche ou un projet qui avance. Le MJ remplit ou retire un segment, l’horloge pleine est annoncée au journal. Visible des joueurs (accueil, écran de table, spectateur) ou secrète ; la note reste au MJ.
- **Tableau d’enquête** (Chronique → Enquête) : indices classés (personnes, lieux, objets, événements, questions), révélés au fil de la partie et reliés entre eux. La note du MJ n’est jamais envoyée ; les joueurs ne voient que les indices révélés et les liens entre eux, et y notent leurs théories (chacun retire les siennes, le MJ toutes).

**Autour de la table**
- **Étoiles et souhaits** (Chronique → Séances) : retour de fin de séance. Chaque joueur écrit une étoile et un souhait depuis son accueil et peut les modifier tant que le tour est ouvert. En mode anonyme, aucun nom n’est envoyé au MJ ; les dix derniers tours restent consultables.

**Cartes**
- **Dessiner** : trait libre ou flèche, cinq couleurs, pour le MJ et les joueurs, en direct pour toute la table. Chacun annule ou efface ses propres traits ; le MJ peut tout effacer.
- **Altitude des jetons** (vol, lévitation, fosse) : réglée dans le panneau du jeton (le joueur pour son propre jeton), affichée en mètres ou en pieds sur le jeton.

## 5.7.0 — Hébergement sur un autre serveur
- **Guide d’hébergement** (`HEBERGEMENT.md`, en anglais `HOSTING.en.md`) : serveur loué Linux, mini-PC ou tunnel Cloudflare ; transfert des données, adresse HTTPS, service qui redémarre seul, côté joueurs (application Android, icônes, clés d’accès).
- **Modèles prêts à copier** (dossier `hebergement/`) : Caddy (HTTPS automatique), nginx (flux en direct non retenu, envois jusqu’à 50 Mo) et service systemd qui lance `scripts/launcher.js`, pour que les mises à jour depuis l’application s’installent aussi sous Linux.
- **Réglage `CHRONIQUES_PROXY`** (`cloudflare`, `standard` ou `none`) : derrière Caddy ou nginx, la limite des essais de mot de passe s’applique à chaque visiteur, et non plus à tous les joueurs à la fois. Les en-têtes du proxy ne sont crus que pour les connexions venant de la machine elle-même : un visiteur ne peut plus s’inventer une adresse en envoyant un en-tête Cloudflare. Sans réglage, le comportement ne change pas pour un tunnel Cloudflare.
- **Transfert des données sous Windows, Linux et macOS** : `node scripts/migrate-data.js <ancien dossier>` copie la base, les connexions, les images, les signalements et les réglages de mise à jour, refuse d’écraser une base existante ; `--sans-adresse` en cas de changement de domaine.
- Arrêt du serveur plus fiable : les connexions restées ouvertes (navigateur, proxy) sont fermées au lieu de bloquer l’arrêt. Les tests automatiques de GitHub s’arrêtent désormais au bout de 3 minutes sur un test bloqué, au lieu de tourner 6 heures.

## 5.6.0 — Formes temporaires, contenants, lumières reliées aux cartes, jour et nuit, météo, états de santé
**Personnages**
- **Forme sauvage et Métamorphose** : fiche → En partie → « 🐾 Se transformer », à partir d’une bête du bestiaire SRD ou d’une forme personnalisée (le niveau maximum de FP de la Forme sauvage est rappelé). Règles 2014 : la forme a ses propres PV ; les dégâts la frappent d’abord et, à 0 PV, le personnage reprend sa forme normale et subit le surplus. Règles 2024 : PV temporaires (niveau pour la Forme sauvage, PV de la bête pour Métamorphose). Le groupe voit la forme dans l’ordre d’initiative.
- **Contenants** : un objet peut devenir un contenant (capacité en kg, contenu sans poids pour un sac sans fond). Le catalogue SRD règle le sac à dos, le sac, la bourse, le coffre, le sac sans fond et le havresac magique. « Ranger dans » place un objet dans un contenant ; la charge transportée en tient compte. Un contenant plein ne se donne pas et ne se dépose pas au coffre tant qu’il n’est pas vidé.

**Exploration**
- **Lumières reliées à l’inventaire et aux cartes** : « 🔥 Allumer » sur une torche, une bougie ou une flasque d’huile retire une unité du sac ; les joueurs allument et éteignent eux-mêmes leur lumière. Tant qu’elle brûle, le jeton du porteur éclaire la carte (une lumière réglée à la main sur le jeton reste prioritaire) ; quand elle s’éteint avec l’heure du monde, le jeton aussi. Les lumières s’usent désormais aussi lors des déplacements du groupe sur la carte en hexagones et des intermèdes.
- **Jour et nuit** : éclairage « Selon l’heure du monde » dans la vision des jetons : lieu éclairé de 6 h à 20 h, obscurité la nuit.
- **Météo du jour** : le MJ choisit le ciel, les précipitations, la température, le vent et une note ; les joueurs la voient à l’accueil, ainsi que l’écran de table et le spectateur. Descriptif seulement ; le MJ voit en plus des repères de visibilité.

**Combat**
- **États de santé** : quand les PV d’une créature sont cachés, les joueurs, l’écran de table et le spectateur voient « Indemne », « Blessé », « En sang », « Au bord de la mort » ou « Hors de combat ». Le MJ peut les masquer (case dans l’ordre d’initiative).

**Corrections** : modifier un objet retire bien une recharge ou une capacité effacée ; un groupe de créatures aux PV cachés n’affiche plus « undefined » chez les joueurs.

## 5.5.0 — Votes, objets mystérieux, maladies et poisons, langues, mémorial, statistiques, spectateur, hexagones
**À la table**
- **Votes de table** : le MJ pose une question (2 à 8 réponses) depuis la page Combat ou Séance du jour ; chacun vote depuis son appareil et peut changer d’avis. Vote anonyme possible : personne, pas même le MJ, ne voit qui a voté quoi. Résultat noté au journal.
- **Objets non identifiés ou maudits** : sur un objet d’inventaire, le MJ indique la vraie nature et une éventuelle malédiction. Le joueur voit le nom apparent (« ❔ ») jusqu’à l’identification ; un objet maudit porté ou harmonisé ne peut plus être retiré, donné ni déposé. Boutons Identifier, Révéler la malédiction, Lever la malédiction. La vraie nature n’est jamais envoyée au joueur avant l’identification.
- **Maladies et poisons** : les 3 maladies et 14 poisons d’exemple du SRD 5.1 (ou une affliction personnalisée), avec DD et texte de la règle sur la fiche ; le joueur note chaque sauvegarde réussie ou ratée (vrai dé), le MJ déclare la guérison.
- **Langues secrètes** : chaque fiche a ses langues ; le MJ envoie un message dans une langue. Seuls les personnages qui la parlent lisent le texte, les autres voient des signes ; le texte n’est jamais envoyé aux autres joueurs.

**Campagne**
- **Mémorial** : le MJ inscrit un personnage tombé (circonstances, épitaphe). Il quitte le combat et les listes du groupe ; sa fiche reste consultable dans la nouvelle page Mémorial, et il peut être ramené à la vie.
- **Statistiques de la campagne** (Chronique) : séances, temps de jeu, combats, rounds, créatures vaincues, XP, quêtes terminées, niveau moyen, héros tombés, et dégâts / soins / chutes par personnage, cumulés au fil des séances.
- **Carte en hexagones** : grille « Hexagones » pour les cartes du monde (échelle en km, miles ou lieues). Outil « Hexagones » : marquer les hexagones explorés, cacher les autres aux joueurs, déplacer le groupe (🚩) ; le trajet est exploré et la durée de marche, selon l’allure, notée au journal (et l’heure du monde avancée si vous le souhaitez).

**Partager**
- **Accès spectateur** (Paramètres) : un lien en lecture seule, avec QR code, pour un ami ou un public en diffusion. Il montre l’écran de table (carte, initiative, résumé partagé) sans fiche, secret du MJ, message privé ni vote. Le lien se remplace ou se désactive à tout moment.

**Limites connues** : l’anonymat des votes vaut dans l’application (le fichier de la campagne, sur le serveur du MJ, garde les bulletins) ; le spectateur se met à jour toutes les 4 secondes.

## 5.4.0 — Murs et portes, pièges, tests de groupe, folie, recharges, agenda
**Cartes**
- **Murs et portes** : nouvel outil « Murs et portes » (MJ) pour tracer des murs et des portes, aimantés à la grille. La vision des jetons s’arrête aux murs et aux portes fermées ; une porte s’ouvre ou se ferme d’un clic sur la carte, et le brouillard se lève alors derrière elle. Les murs restent invisibles pour les joueurs.
- **Pièges** : un repère « Piège » a désormais un état (caché, repéré, désamorcé, déclenché), des DD pour le repérer, le désamorcer et y résister, et peut s’inspirer d’un des huit pièges d’exemple du SRD (DD pré-remplis, extraits de la règle affichés). « Repéré » ou « Déclenché » le révèle aux joueurs ; les DD restent réservés au MJ.

**À la table**
- **Tests et sauvegardes de groupe** : le MJ choisit la compétence ou la sauvegarde, le DD (montré ou caché) et les participants ; chaque joueur saisit le total de son vrai d20. Verdict automatique : le groupe réussit si au moins la moitié réussit (test) ou réussite / échec de chacun (sauvegarde), noté dans le journal.
- **Recharge des objets magiques** : chaque objet à charges peut se recharger à l’aube, après un repos long ou après un repos court. Après le repos, les objets dont la recharge se lance aux dés (ex. 1d6+1) attendent le total de vos vrais dés ; les autres se rechargent seuls. Les objets du catalogue SRD arrivent avec leurs charges et leur recharge.
- **Folie** (règle optionnelle du SRD 5.1) : le MJ applique une folie passagère, persistante ou illimitée avec les résultats du d100 et du d10 ; l’effet du SRD s’affiche sur la fiche jusqu’à guérison.
- **Sorts par classe (multiclassage)** : caractéristique, bonus d’attaque et DD pour chaque classe qui lance des sorts ; chaque sort du grimoire est rattaché à sa classe.
- **Agenda** : « 📅 Ajouter à mon agenda » sur la prochaine séance (fichier .ics pour Google Agenda, l’iPhone, Outlook), avec un rappel deux heures avant.

**Autres**
- Repos court d’un personnage multiclassé : le total maximal tient compte du plus grand dé de vie.
- Licence : Chroniques est sous droits d’auteur, tous droits réservés (`LICENSE.md`) ; les contenus du SRD restent sous CC BY 4.0.

**Limites connues** : les murs ne gênent pas la révélation manuelle du MJ ; la vision ne tient pas compte des murs pour les zones déjà découvertes avant leur tracé.

## 5.3.0 — Multiclassage, charte de la table, intermèdes, vision des jetons
**À la table**
- **Multiclassage** : « Monter de niveau » demande quelle classe gagne le niveau (classe actuelle ou nouvelle classe, avec vérification des prérequis à 13). Panneau « Classes » sur la fiche (Progression & règles) : niveaux par classe, sous-classes, dés de vie par type, maîtrises acquises (table du SRD 5.1). Emplacements de sorts combinés selon les règles de multiclassage (moitié et tiers arrondis à l’inférieur en 2014, au supérieur en 2024) ; la magie de pacte reste à part et revient au repos court.
- **Inspiration héroïque** : le MJ l’accorde ou la retire (fiche, ou bouton « ✦ Inspirer » sur les cartes du groupe) ; le joueur l’utilise ou la donne à un personnage qui n’en a pas. Rappel de la règle de l’édition (avantage en 2014, relance d’un dé en 2024). Visible dans la vue du groupe et l’historique.
- **Préparer une action** : déclencheur et action notés, l’action du tour est consommée ; « Déclencher » utilise la réaction ; sans déclencheur, l’action préparée est perdue au début du tour suivant. Les actions préparées des créatures restent secrètes.
- **Retarder son tour** (option de table, désactivable dans la charte) : le participant sort de l’ordre, puis « Agir maintenant » le replace juste après le tour en cours. Un tour retardé non repris est perdu au round suivant.
- **Distances en pieds** : Mon compte → « Distances : mètres / pieds ». Tout ce qui s’affiche est converti (1,5 m = 5 ft), y compris les textes de règles ; par défaut, pieds en anglais et mètres en français. Les champs de saisie restent en mètres, sauf le déplacement en combat.

**Campagne**
- **Charte de la table** (nouvelle page) : règles maison classées par rubrique, partagées ou réservées au MJ, avec rappel facultatif dans l’Écran du MJ et exemples courants à ajouter d’un clic ; notes de séance zéro. Les règles maison sont incluses dans les modèles de campagne.
- **Outils de sécurité** : lignes (sujets absents du jeu) et voiles (sujets hors champ), que chacun peut ajouter sans que son nom apparaisse ; **carte X** et **demande de pause** anonymes : le MJ reçoit un bandeau et une notification, sans aucun nom enregistré (ni dans la campagne, ni dans le journal).
- **Intermèdes** : le MJ accorde des jours d’intermède au groupe (et peut avancer la date du monde) ; chaque joueur les consacre à ses activités : artisanat (5 po de valeur par jour, matières premières à moitié prix, coopération), formation (250 jours à 1 po), profession, recherches, récupération… Repères du SRD 5.1, modifiables ; aucun dé virtuel.
- **Vision des jetons** : sur une carte avec brouillard et grille, les jetons des aventuriers révèlent automatiquement un cercle autour d’eux quand ils bougent. En lieu éclairé : portée de vue choisie par le MJ ; dans l’obscurité : vision dans le noir (d’après l’espèce de la fiche) ou lumière du jeton (bougie, torche, lanterne, sort Lumière). Les zones explorées restent visibles.

**Limites connues** : la vision ne gère ni murs ni lignes de vue (le MJ retouche le brouillard à la main) ; les maîtrises de multiclassage affichées sont celles de la table 2014 du SRD (à vérifier dans le livre 2024) ; les sorts connus et préparés de chaque classe restent à gérer dans le grimoire.

## 5.2.0 — Chroniques en anglais, iPhone
- **🌐 Interface en anglais** : bouton « English / Français » dans Mon compte et sur l’écran de connexion ; par défaut, la langue de l’appareil. Chacun choisit sa langue : les données de la campagne ne changent pas, un MJ francophone et des joueurs anglophones peuvent partager la même table.
- **Tout est traduit** : environ 5 000 textes d’interface et messages du serveur, les fenêtres de confirmation, les dates, les notifications (dans la langue de chaque compte), les tutoriels express, les aide-mémoire MJ et joueur, un guide d’utilisation anglais condensé et les écrans de l’application Android.
- **Règles en anglais** : textes officiels du SRD 5.1 anglais (CC BY 4.0) pour les règles, les états, les 319 sorts, les 334 créatures et les objets, chargés seulement si la langue est l’anglais. Les noms français déjà enregistrés dans la campagne (sorts, monstres, objets) s’affichent en anglais.
- **📱 iPhone et iPad** : pas d’application App Store (compte Apple payant), mais une page d’installation pas à pas (`/iphone`) : Safari → Partager → Sur l’écran d’accueil ; plein écran et notifications (iOS 16.4+). Lien sur l’écran de connexion des iPhone et dans Paramètres.
- **Android** : les textes de l’application (premier écran, serveur injoignable, notifications, mises à jour) suivent la langue choisie.
- Corrections : derniers tutoiements des tutoriels express et du guide, « potions bues ».
- Limites connues : les distances de l’interface restent en mètres (les textes officiels anglais parlent en pieds : 1,5 m = 5 ft) ; le guide anglais est un résumé du guide français ; les textes écrits par le MJ et les joueurs ne sont jamais traduits.

## 5.1.0 — Téléphones corrigés, tables aléatoires, dégâts de zone, clés d’accès
**Correction importante (téléphones et application Android)**
- Sur les écrans étroits et avec la taille du texte « Grande », l’en-tête débordait à droite : « Mon affichage » (MJ / joueur) et « Mon compte » devenaient inaccessibles, et la barre du bas était coupée. L’en-tête passe sur deux lignes (logo et boutons, puis « Mon affichage »), « Mon compte » devient un bouton ☰, et plus aucune page ne déborde en largeur (vérifié sur toutes les pages, MJ et joueur, de 320 à 412 px de large).

**Nouveautés**
- **🎲 Tables aléatoires** (Séance du jour, ou Ctrl+K) : vos tables de rencontres, butin, rumeurs, météo… Écrivez « 1-3 : … » ou une ligne par résultat, lancez votre vrai dé, saisissez le total : Chroniques lit la ligne. Dés d4 à d100, 2d6, 3d6… ; trous et chevauchements signalés ; tables privées ou visibles des joueurs ; résultats annoncés ou non ; incluses dans les modèles de campagne. Aucun tirage n’est fait par l’outil.
- **💥 Dégâts de zone** : une seule saisie pour plusieurs cibles (Bureau de combat, Ctrl+K, ou « 💥 Dégâts » sous une zone posée sur la carte, qui pré-coche les jetons touchés). Pour chaque cible : sauvegarde réussie ou ratée ; moitié ou aucun dégât selon le sort, puis résistance, vulnérabilité ou immunité. Aperçu avant validation, annulable.
- **Zones de sort** : la liste des zones posées indique maintenant les créatures et personnages touchés.
- **🔑 Clés d’accès** (Paramètres) : connexion par empreinte, visage ou code de l’appareil, sans mot de passe (WebAuthn, sans dépendance). Le secret reste sur l’appareil ; vérification de l’utilisateur obligatoire ; défis à usage unique ; détection des clés copiées. Disponible dans les navigateurs sur l’adresse HTTPS (ou localhost) ; pas dans l’application Android.
- **♫ Ambiance des scènes** : une scène peut lancer une piste d’ambiance quand elle passe « en cours ».
- **Hors connexion** : les emplacements de sorts dépensés et les objets utilisés (potion, munition, charge) sont aussi notés sur l’appareil pendant une coupure, puis envoyés au retour du réseau (le serveur revérifie).

## 5.0.2 — Relecture complète des textes
- **Vouvoiement partout** : aide rapide, premiers pas, visite guidée, messages d’erreur, écrans vides, combat (« À vous de jouer ! »), cartes, butin, préparation de séance et guides imprimables s’adressent désormais tous à l’utilisateur avec « vous ». Seul le message d’invitation à copier pour un ami reste au tutoiement, plus naturel entre joueurs.
- **Textes périmés retirés** : mentions de « V0.3 », de « prototype » et de « migrations pas encore disponibles » dans les Paramètres ; l’encadré d’installation sur téléphone présente maintenant l’application Android ; la page « Serveur inaccessible » explique quoi vérifier.
- **Coquilles et accents** : « Reconnexion », « SÉCURITÉ … accès distant », guide de migration réécrit avec ses accents, « Partager avec les joueurs », « Visible des joueurs », règle du jet de sauvegarde contre la mort formulée correctement.
- Aucune modification des règles, des données ni du fonctionnement.

## 5.0.1 — Publication automatique par GitHub
- **Versions publiées automatiquement** : chaque nouvelle version envoyée sur le dépôt GitHub privé est testée, construite (ZIP + application Android signée) et publiée par GitHub Actions. Le ZIP publié contient déjà l’adresse du dépôt et la clé de vérification : votre serveur trouve et vérifie seul les versions suivantes, puis propose « Installer et redémarrer ». Guide : `PUBLIER_UNE_VERSION.md`.
- **Jeton GitHub dans l’application** : pour un dépôt privé, collez un jeton en lecture seule dans Paramètres → Mettre à jour Chroniques (enregistré dans `config/`, jamais affiché ni inclus dans les ZIP).
- **Application Android** : « Mettre à jour l’application » télécharge la nouvelle version depuis le serveur du MJ et ouvre l’installateur d’Android (une confirmation suffit).
- Téléchargements GitHub plus sûrs : le jeton n’est jamais transmis au stockage externe de GitHub.

## 5.0.0 — Application Android, récit de campagne, voyages, factions, synchronisation légère
**Application Android (nouveau)**
- **Chroniques pour Android** (`android/chroniques.apk`, aussi proposé par chaque serveur à l’adresse `/android`) : la même application que le site, au choix de chacun. L’interface complète est intégrée à l’application : démarrage immédiat et consultation hors connexion quand le serveur a la même version ; sinon l’interface du serveur est utilisée (toujours compatible) et l’application propose sa mise à jour.
- Choix du serveur au premier lancement (adresse du site), serveurs mémorisés ; envoi de photos et fichiers ; enregistrement des exports (modèles, personnages, sauvegardes) où l’on veut ; impression et PDF ; bouton retour qui ferme les fenêtres.
- Notifications : rappel de séance et « À vous de jouer ! » (vérification environ toutes les 15 minutes ; pendant un combat, « Partie en cours » reste à l’écoute toutes les 15 secondes quand l’application est en arrière-plan, 4 h maximum, désactivable).
- Android 7 ou plus récent. Construit sans Gradle par `scripts/dev/build-android.js` ; signé avec la clé de l’éditeur.

**À la table**
- **« À vous de jouer ! »** : notification au joueur dont c’est le tour, seulement si son application n’est pas à l’écran (Web Push sur le site en HTTPS, ou application Android). Réglable par joueur.
- **« Précédemment dans… »** : le MJ compose en un clic un récit à partir de la dernière séance (faits notés, montées de niveau, quêtes en cours, date du monde), le corrige, le publie sur l’accueil des joueurs et peut l’afficher sur l’écran de table.
- **Écran de table** : bandeau « Au tour de … » au-dessus du plan de bataille, et affichage du récit avant le combat.
- **Voyage & exploration** (Journal & quêtes → Calendrier) : destination, distance, rythme du SRD (lent 3 km/h, normal 4,5 km/h, rapide 6 km/h, avec leurs effets), heures de marche, rappel de marche forcée (Constitution DD 10 + 1 par heure au-delà de 8), campement, rations décomptées dans les inventaires, lumières (torche, lanterne, bougie…) qui s’éteignent quand le temps passe. Le calendrier du monde avance avec le voyage.

**Pour le MJ**
- **Réputation auprès des factions** (Carnet de campagne → Factions) : chaque faction du carnet gagne une réputation du groupe de −5 à +5 (« +1 / −1 » avec une raison) et ses membres (PNJ du carnet) ; pour une faction publiée, chaque changement s’inscrit dans l’historique des personnages. Les membres secrets restent cachés aux joueurs.
- **Relations PNJ ↔ personnages** (allié, rival, dette, famille, secret partagé…), éventuellement secrètes ; visibles sur la fiche du PNJ et dans l’historique du personnage.
- **Frise & bilan** (Journal & quêtes) : chronologie des séances, montées de niveau, quêtes terminées, documents et événements du monde ; bilan chiffré par période (combats, rounds, adversaires, XP, dégâts encaissés, soins, chutes à 0 PV, objets, quêtes). Le **livre de campagne** inclut désormais la frise, le bilan, les historiques et les cartes.
- **Co-MJ créatures** (Mes campagnes → rôle) : un co-MJ restreint qui gère les monstres en combat (PV, états, concentration, actions, tour suivant) depuis le Poste co-MJ, sans accès au carnet, aux notes ni aux autres fiches. Le co-MJ complet existe toujours.

**Technique**
- **Synchronisation légère** : chaque appareil ne reçoit plus que les modifications depuis sa dernière version (journal, PV, états…), avec retour automatique à l’état complet en cas de doute. Nettement moins de données à chaque action.
- **Publication automatique** : workflows GitHub Actions (tests sous Windows, macOS et Linux ; à chaque étiquette `v…` : APK signé, ZIP, fiche de version signée, version GitHub). Les mises à jour automatiques savent lire une source `github:compte/dépôt`, privée (jeton) ou publique. Guide : `PUBLIER_UNE_VERSION.md`.
- **Fiches de test** d’une page (MJ et joueur) : `FICHES_DE_TEST.html`, à imprimer pour une séance d’essai.

## 4.9.0 — Historique des personnages, coffre du groupe, séance du jour, rappels, mises à jour signées
**Pour le MJ**
- **Historique de chaque personnage** (fiche → onglet « Historique ») : tenu automatiquement — niveaux, XP gagnée (avec la raison), objets achetés, reçus, donnés, déposés ou repris dans le coffre, harmonisations, sorts appris, compagnons, chutes à 0 PV, mort, épuisement, combats terminés, objectifs et quêtes accomplis, documents reçus. Le MJ y ajoute des **notes secrètes** (jamais envoyées au joueur) ou **visibles** du joueur, et peut supprimer une entrée. Filtres (progression, objets, combats, quêtes, notes) et recherche. Le joueur voit l’historique de son personnage, sans les notes secrètes ; les autres joueurs n’y ont pas accès. L’historique visible suit le personnage exporté.
- **Vue du groupe** (Accueil ou Combat → « Vue du groupe ») : CA, PV, Perception, Investigation et Intuition passives, les six sauvegardes (★ = maîtrise de la classe) et le DD des sorts de tout le groupe, calculés depuis les fiches. Les dons, objets et multiclasses ne sont pas pris en compte.
- **Séance du jour** (Préparation → Séance du jour) : une page qui réunit la date prévue, les scènes en cours et à venir, les rencontres reliées (bouton Déployer), les PNJ et lieux concernés avec vos secrets, les quêtes actives et leurs objectifs restants, les documents pas encore envoyés et les événements du calendrier. Imprimable.
- **PNJ express** (Journal & quêtes → PNJ récurrents, ou la recherche) : nom, rôle, trait, voix, ce qu’il veut, secret. Chaque champ propose des idées écrites que vous choisissez (rien n’est tiré au hasard). Le PNJ est rangé dans le carnet, privé par défaut ; publié, les joueurs voient nom, rôle, trait et voix, jamais le secret.
- **Lieux reliés aux cartes** : un repère peut désigner un lieu, un PNJ ou une quête du carnet ; la fiche du carnet affiche « 📍 Carte · repère » et « ＋ Placer sur une carte ». Les joueurs ont le lien vers la fiche seulement si elle est publiée.
- **Modèles de campagne** (Paramètres → Modèle de campagne) : exportez votre préparation (carnet, scènes, monstres et objets maison, rencontres, documents, marchands, cartes avec images et repères, trésor du MJ) et importez-la dans une autre campagne. Jamais de personnages, de joueurs ni de ce qui s’est passé en partie. À l’import, tout repasse par les contrôles habituels et reçoit de nouveaux identifiants (les liens entre scènes, PNJ, rencontres et repères sont conservés).
- **Poste co-MJ** (Préparation → Poste co-MJ, ou l’adresse `/#poste-comj` sur une tablette) : un écran consacré aux créatures — PV, dégâts typés, états, concentration, actions légendaires, recharges, emplacements, bloc de statistiques — avec le tour en cours et « Tour suivant ». Pour un co-MJ (rôle existant dans Mes campagnes) ou votre deuxième appareil.

**En combat**
- **Durées d’états précises** : « jusqu’à la fin du prochain tour du lanceur », « au début du tour de la cible », et rappel de sauvegarde à chaque fin de tour (ex. Sagesse DD 15). Le compte à rebours ⏳ s’affiche sur l’état.
- **Concentration des créatures** : le MJ note le sort maintenu ; à chaque dégât, Chroniques rappelle la sauvegarde de Constitution (DD 10 ou moitié des dégâts) à lancer aux dés, puis « Réussi / Raté ». À 0 PV, la concentration tombe.
- **Minuteur de tour** facultatif (30 s à 3 min) : affiché sur l’écran de table et chez le joueur dont c’est le tour (vibration à la fin). Il ne fait jamais passer le tour tout seul.

**Pour toute la table**
- **Coffre du groupe** (Inventaire) : objets et pièces communs. Chacun dépose (« Donner à… → Coffre du groupe ») et reprend ; tout est noté dans le journal et l’historique. Le MJ peut réserver les retraits (« le MJ distribue »), ajouter ou retirer des objets.
- **Rappel de séance** (Paramètres → Rappel de séance) : une notification la veille de la séance choisie, même application fermée. Exige une adresse HTTPS (accès Internet) ou « localhost » ; sur iPhone/iPad, iOS 16.4+ et Chroniques ajouté à l’écran d’accueil. Notifications chiffrées de bout en bout (norme Web Push), sans service tiers autre que celui du navigateur.

**Mises à jour**
- **Téléchargement automatique des mises à jour signées** (facultatif) : avec un fichier `config/update-source.json` (adresse de la fiche de version + clé publique de l’éditeur, jeton facultatif pour un dépôt GitHub privé), Chroniques vérifie régulièrement, télécharge la nouvelle version, contrôle la **signature Ed25519** et l’**empreinte SHA-256**, puis vous propose « Installer et redémarrer ». Rien ne s’installe sans votre accord. Outil de l’éditeur : `node scripts/dev/sign-release.js` (création des clés, signature de chaque version).

## 4.8.0 — Mises à jour depuis l’application, hors ligne, carnet personnel, milieux, tableaux
**Mises à jour plus simples**
- **Paramètres → Mettre à jour Chroniques** (MJ propriétaire) : envoyez le fichier .zip de la nouvelle version, Chroniques le vérifie (bonne application, version plus récente), puis « Installer et redémarrer ». Le serveur sauvegarde les données, installe, vérifie la nouvelle version sur une copie de la base et redémarre seul ; en cas d’échec, l’ancienne version est remise en place automatiquement. Les téléphones et l’écran de table se rechargent d’eux-mêmes sur la nouvelle version.
- Cela fonctionne quand Chroniques est lancé par `DEMARRER_CHRONIQUES.bat` (nouveau lanceur). Une mise à jour envoyée s’installe aussi au prochain démarrage. `METTRE_A_JOUR.bat` reste disponible. **Cette version 4.8.0 s’installe encore avec METTRE_A_JOUR.bat** ; les suivantes pourront passer par l’application.

**Jouer malgré les coupures**
- **Hors connexion**, Chroniques s’ouvre quand même sur un appareil déjà utilisé (en HTTPS ou sur le PC du serveur), avec les dernières données reçues et un bandeau « Hors connexion ». Les points de vie, PV temporaires, ressources, sauvegardes contre la mort, carnet personnel et chuchotements sont notés tout de suite à l’écran et envoyés au retour du réseau. Les actions qui pourraient entrer en conflit (états, tour suivant…) attendent le réseau.

**Nouveautés**
- **Carnet personnel** sur la fiche (onglet En partie) : secrets, objectifs, rumeurs. Visible seulement du joueur et du MJ ; il suit le personnage exporté.
- **Bestiaire par milieu** : filtres Eaux et côtes, Souterrains, Airs et montagnes, Forêts et plaines, Cryptes et ruines, Villes et routes, Plans et magie, Dragons, plus « FP jusqu’à » et un repère de FP selon le niveau du groupe. Regroupement automatique d’après le type et les capacités (nage, vol, fouissement, sensibilité au soleil…), pas une table officielle ; aucun tirage au hasard.
- **Règles des créatures** : nouveau chapitre « Créatures : profils et créatures légendaires » (lire un profil, actions légendaires, antres, actions d’antre, effets régionaux). Le SRD ne contient pas les actions d’antre propres à chaque créature : elles restent à écrire dans le champ « Actions de repaire » de vos monstres.

**Finitions**
- **Vrais tableaux** dans les règles, les sorts et les objets magiques (colonnes reconstituées depuis le PDF officiel) ; les encadrés de règles sont présentés à part.
- **Sorts et règles 2024** : 126 sorts dont la fiche diffère dans le SRD 5.2 (niveau, incantation, portée, durée, composantes, école, classes ou dés) sont marqués « ≠ 2024 » dans le grimoire des campagnes 2024, avec le détail 2014 → 2024 dans leur description. Repérage automatique : le texte peut aussi avoir changé.
- **Guenaude nocturne** : ses derniers textes anglais sont traduits ; les noms d’actions mal traduits (« Hag Form Only ») utilisent le nom officiel français. Le bestiaire ne contient plus d’anglais.

## 4.7.0 — Bestiaire et objets magiques en français officiel
- **Les 334 créatures du SRD** ont maintenant leur **bloc de statistiques officiel en français** (traduction du SRD 5.1 publiée par Wizards of the Coast) : bouton « 📖 Fiche officielle en français » dans le bestiaire, et « 📖 Fiche » parmi les actions d’une créature en combat. Caractéristiques, sauvegardes, compétences, résistances, sens, langues, traits, actions, réactions et actions légendaires, tels qu’imprimés.
- **Plus de texte anglais dans le bestiaire** : les 78 créatures dont certaines capacités restaient en anglais (« [SRD] … ») utilisent le texte officiel français (il en reste une, la guenaude nocturne, dont les capacités ne correspondent pas une à une). Les noms suivent la traduction officielle (Zombi, Strige, Cockatrice, Sectateur…) ; l’ancien nom reste affiché entre parenthèses et fonctionne dans la recherche.
- **Les 362 objets magiques du SRD** ont leur **nom et leur description officiels en français** (catalogue de l’inventaire et de la Bibliothèque MJ), y compris les variantes (ceinturons de force de géant, pierres de Ioun, figurines merveilleuses, parchemins de sort…). Les anciens noms (« Langue de feu »…) se trouvent toujours avec la recherche. Les potions de soins gardent leurs noms habituels et leurs dés.
- **Actions des créatures** : une action décrite en plusieurs phrases garde tout son texte (DD, dégâts, effets) dans l’infobulle et le journal, au lieu de s’arrêter à la première phrase.

## 4.6.0 — Règles en français, chuchotements, compagnons, calendrier, ambiance sonore, sauvegardes guidées
**Règles et sorts en français (SRD 5.1 officiel)**
- **Règles du jeu** (nouvelle rubrique) : le Document de Référence du Système 5.1 en français, publié par Wizards of the Coast sous licence Creative Commons : utiliser les caractéristiques, l’aventure (voyage, repos…), le combat, lancer des sorts, les états, niveaux et multiclassage, pièges, maladies, folie, poisons et règles des objets magiques. Recherche instantanée (« à terre », « abri », « lutte »), sommaire par chapitre, sections précédente / suivante. Consultable hors ligne une fois chargé.
- **Les 319 sorts du SRD** sont maintenant dans le catalogue du grimoire (au lieu de 36), avec leur **description complète** : bouton « 📖 Description » sur chaque sort, et « Lire la description » avant de l’ajouter. Les **cartes de sorts imprimées** contiennent le texte du sort.
- **États cliquables** : en combat et sur l’accueil, un clic sur « À terre », « Empoigné »… affiche la règle officielle.
- La recherche Ctrl+K trouve aussi les règles ; un sort s’ouvre directement sur sa description.
- Quelques noms de sorts suivent désormais la traduction officielle : Foulée brumeuse, Armure du mage, Vague tonnante, Retour à la vie, Main du mage.

**Nouvelles fonctionnalités**
- **Chuchotements** : messages privés entre le MJ et chaque joueur (bouton ✉ en haut). Badge des messages non lus, notification et vibration à la réception ; les autres joueurs n’en voient rien.
- **Compagnons, familiers et montures** : mini-fiche sur la fiche du personnage (PV, CA, vitesse, attaques). « Envoyer au combat » l’ajoute à l’initiative juste après son maître ; le joueur gère ses PV, place son jeton sur la carte et est prévenu quand c’est son tour. « Rappeler » reporte ses PV sur la fiche.
- **Objectifs de quête** : cases à cocher dans chaque quête du carnet ; les joueurs voient la progression des quêtes publiées. Un objectif peut rester secret jusqu’à ce que le MJ le révèle.
- **Calendrier du monde** (Journal → Calendrier) : date et heure dans la fiction, saisons et moment de la journée, boutons +10 min / +1 h / +8 h / +1 jour, voyages de plusieurs jours, calendrier grégorien, douze mois de trente jours ou mois personnalisés, ère. Le repos long du groupe fait passer 8 heures. Événements prévus (publics ou secrets) annoncés quand la date est atteinte. La date s’affiche à l’accueil et sur l’écran de table.
- **Ambiance sonore** (Préparer la séance) : le MJ dépose ses musiques et bruitages (MP3, OGG, WAV, M4A…) sur son serveur et les lance d’un clic ; ils sont joués sur l’écran de table, en boucle ou une fois, avec réglage du volume. Option : permettre aux joueurs d’écouter sur leur appareil.
- **Export / import de personnage** : « Exporter ce personnage » (onglet Progression) produit un fichier .json ; le MJ d’une autre campagne l’importe dans Paramètres. Caractéristiques, ressources, capacités, inventaire, bourse, sorts et compagnons suivent ; chaque élément est revérifié.

**Sauvegardes**
- **Restaurer une sauvegarde** (Paramètres, MJ propriétaire) : liste des sauvegardes manuelles, quotidiennes et automatiques ; « Tester » relit entièrement le fichier et vérifie la campagne, les personnages et les images ; « Restaurer » remet la campagne dans cet état après avoir créé une sauvegarde de sécurité de l’état actuel. Les comptes et invitations ne sont pas touchés.
- **Sauvegarde quotidienne automatique** quand Chroniques est utilisé (les 20 dernières sont gardées).
- **Copie miroir** : chaque sauvegarde peut être copiée automatiquement vers une clé USB ou un dossier synchronisé (OneDrive, Google Drive, Dropbox).

**Confort et accessibilité**
- **Affichage plus fluide** : l’écran n’est plus reconstruit entièrement à chaque changement ; seules les parties modifiées sont mises à jour. Les images ne se rechargent plus, la saisie en cours, le focus et les volets ouverts sont conservés quand un autre joueur agit. Les mises à jour rapprochées sont regroupées.
- **Code découpé** en modules (règles, vues de la 4.6, mise à jour de l’affichage, calendrier, transfert de personnage) pour faciliter l’entretien.
- **Accessibilité** : vérification automatique (axe-core) des écrans principaux et corrections (noms des boutons et champs, contrastes, éléments cliquables utilisables au clavier).

## 4.5.0 — Plus simple à utiliser, écran de table, repos guidé, XP
**Ergonomie**
- **Onglets** : la Bibliothèque MJ (Monstres · Objets · Marchands · Rencontres) et Journal & quêtes (Séances · Documents · Résumés · Mémoire · Carnet) ne s’étirent plus sur des écrans entiers. L’onglet choisi est mémorisé.
- **Recherche globale** : Ctrl+K (⌘K sur Mac) ou la loupe en haut. Personnages, créatures, monstres et objets maison, 334 créatures et 598 objets du SRD, sorts, cartes, documents, carnet, et des commandes (« Écran du MJ », « Repos long pour tout le groupe », « Imprimer ma fiche »…). Flèches et Entrée au clavier.
- **Panneau de combat du joueur** : pendant un combat, l’accueil et l’écran Combat du joueur montrent l’essentiel en gros boutons (PV avec dégâts et soins, action, action bonus, réaction, emplacements de sorts, potions). Quand c’est son tour, « À toi de jouer ! » s’affiche et le téléphone vibre ; sinon « Tu joues dans 2 tours ».
- **Quoi de neuf ?** : après une mise à jour, un bandeau présente les nouveautés ; la visite guidée couvre maintenant la Bibliothèque MJ, le Journal, les cartes tactiques, l’inventaire et la recherche.
- **Suppressions annulables** : supprimer un objet, un monstre, un marchand, un document, une rencontre, une date ou des zones se fait d’un clic, avec « Annuler » dans la notification, au lieu d’une fenêtre de confirmation. Les images supprimées sont conservées quelques minutes au cas où.
- **Taille du texte** réglable (Mon compte) : normale, grande, très grande.

**Nouvelles fonctionnalités**
- **Écran de table** (TV ou vidéoprojecteur) : Combat → « Écran de table » ouvre une fenêtre plein écran avec la carte choisie (« Afficher sur l’écran de table » dans Cartes), le brouillard, les jetons visibles, les zones, l’ordre d’initiative et les images présentées par le MJ. Elle reçoit exactement ce qu’un joueur verrait : aucune créature masquée, aucun secret.
- **Repos guidé** : le repos court propose de dépenser des dés de vie (lancés pour de vrai) ; la Constitution est ajoutée à chaque dé et les PV mis à jour. « Repos long (groupe) » restaure tout le groupe en un clic ; les dés de vie reviennent selon l’édition (tous en 2024, la moitié en 2014).
- **XP et jalons** : Journal → Résumés → Récompenses. L’XP des créatures vaincues de la séance est proposée, à partager ou pour chacun ; « Jalon » donne directement accès au niveau suivant. La fiche affiche l’XP et « ★ Niveau disponible ».
- **Cartes de sorts imprimables** depuis le Grimoire (3 par ligne, A4), avec lignes pour noter l’effet.
- **Factions et attitudes** : nouvelle rubrique « Factions » dans le carnet ; PNJ et factions ont une attitude envers le groupe (hostile, méfiant, neutre, amical, allié).
- **Livre de campagne (PDF)** : aventuriers, résumés de séance, mémoire, documents et carnet réunis ; édition des joueurs sans secrets, ou édition du MJ avec ses notes.

## 4.4.0 — Documents pour les joueurs, monstres lanceurs de sorts, fiche imprimable, organisation des séances
- **Documents pour les joueurs** (Journal & quêtes) : le MJ prépare une lettre, un indice ou une affiche (texte et image), puis l’envoie à un joueur, à plusieurs ou à toute la table. Le joueur reçoit une alerte et un badge « non lu » ; le MJ voit qui l’a lu, peut le renvoyer ou le retirer. Un brouillon ou un document adressé à un autre reste invisible, image comprise.
- **Monstres lanceurs de sorts** : DD, bonus d’attaque, emplacements des niveaux 1 à 9 et liste des sorts dans la fiche de créature. En combat : « Lancer » dépense un emplacement et rappelle le DD et le bonus d’attaque, « +1 » rend un emplacement, « Repos long » restaure tout. Les 36 créatures du SRD qui lancent des sorts (liche, mage, prêtre…) arrivent avec leurs emplacements et leurs sorts, aux noms français. Rien n’est montré aux joueurs.
- **Fiche de personnage imprimable** : menu ⋯ de la fiche ou onglet Progression → « Fiche imprimable ». Aperçu, puis « Imprimer / PDF » (choisir « Enregistrer au format PDF »). Caractéristiques et sauvegardes, compétences, actions, ressources à cocher, dons, sorts, équipement, bourse et notes ; toujours en encre sombre sur fond blanc, quel que soit le thème.
- **Organisation des séances** : le MJ propose des dates, chaque joueur répond pour son personnage (oui / peut-être / non), le bilan s’affiche par date et « Retenir » fixe la séance. La prochaine séance apparaît à l’accueil de tous, avec le compte à rebours.

## 4.3.0 — Inventaire vivant, marchands, carte tactique, outils du MJ
**Inventaire**
- **Boire une potion** : Chroniques indique les dés à lancer (2d4+2, 4d4+4…), vous saisissez le total obtenu et les PV sont soignés ; la potion est retirée. Les objets à charges et les consommables s’utilisent en un clic, avec une ligne au journal.
- **Munitions** : « Tirer (−1) » sur les flèches, carreaux, billes et aiguilles, avec un avertissement quand il en reste 5 ou moins.
- **Alertes** : charge transportée (Force × 7,5 kg) avec barre et avertissement de surcharge ; maximum de 3 objets harmonisés (le 4e est refusé).
- **CA d’équipement** : « Équiper » une armure ou un bouclier calcule la CA (Dextérité plafonnée, défense sans armure du barbare et du moine, bonus +1 à +3, Force requise) ; le joueur l’applique à sa fiche d’un clic.
- **Donner un objet** à un autre personnage, avec son illustration.
- **Partager l’or du butin** à parts égales entre les personnages choisis (MJ), reste indivisible signalé.
- **Marchands** : le MJ prépare des boutiques (vos objets maison, objets du SRD au prix officiel, articles libres, stock limité ou non) et les ouvre au bon moment. Les joueurs achètent depuis leur inventaire ; la bourse est débitée et la monnaie rendue automatiquement.

**Combat et carte**
- **Jeton actif** : sur la carte, le jeton de la créature (ou du groupe) dont c’est le tour est mis en évidence.
- **Mesurer** : faites glisser sur la carte pour lire la distance en cases et en mètres (règle 2024 : diagonales comptées comme une case). Pour le MJ et les joueurs.
- **Zones de sort** : cercle, cône, ligne ou cube de la taille voulue, posés sur la carte et visibles de tous ; chacun retire les siens, le MJ peut tout effacer.
- **Pouvoirs à recharge** (« recharge 5-6 ») : une fois utilisés, ils sont marqués « à recharger » ; au début du tour de la créature, le journal du MJ rappelle de lancer 1d6, puis un clic les rend disponibles.
- **Actions de repaire** : nouveau champ dans la fiche de créature ; au compte 20 de l’initiative, un bandeau les rappelle au MJ une fois par round.
- **Vue du groupe** (MJ, écran Combat) : PV, CA, Perception passive, concentration, épuisement et états de chaque aventurier. **Alerte** quand un aventurier tombe à 0 PV, avec ses jets contre la mort.

## 4.2.0 — Vos propres images pour les monstres et objets maison
- **Importer une image** dans la fiche d’un monstre maison ou d’un objet maison (JPG, PNG, WebP, HEIC). Elle est réduite et compressée sur votre appareil, puis stockée sur votre serveur ; elle remplace l’icône du catalogue. Aperçu immédiat, et « Retirer l’image actuelle » en modification.
- L’image suit la fiche : chaque créature ajoutée au combat (depuis la recherche du bestiaire ou une rencontre) et chaque objet donné à un joueur reçoit sa propre copie. Supprimer ou modifier la fiche maison ne touche jamais les exemplaires déjà en jeu.
- Confidentialité : les images de la bibliothèque ne sont lisibles que par le MJ. Un joueur voit l’image d’un objet qu’il possède, et celle d’une créature seulement quand elle est révélée.
- Les monstres maison ajoutés depuis le combat gardent désormais aussi leur icône du catalogue.

## 4.1.0 — Monstres et objets maison, portraits selon la classe
- **Portraits corrigés** : les anciennes versions proposaient des têtes de monstres (gobelin…) comme portraits d’aventuriers. Au premier démarrage, ces icônes sont retirées des personnages et chacun affiche le portrait de sa classe (Rôdeur → archer, Magicien → visage de mage…). Les photos importées sont conservées. Dans Illustrations, le portrait de la classe est suggéré en premier ; les créatures sont rangées à part (forme animale, lycanthrope…).
- **Créer un monstre** : fiche complète (PV, CA, FP, caractéristiques, actions, traits, actions légendaires, défenses, icône), enregistrée dans votre bestiaire maison. Accessible depuis l’accueil (Autres raccourcis), le combat et la Bibliothèque MJ ; vos monstres apparaissent dans la recherche du bestiaire en combat. On peut aussi partir d’une créature du SRD.
- **Créer un objet** : objets maison avec catégorie, rareté, harmonisation, charges, poids, icône, description pour les joueurs et notes secrètes du MJ. « Donner » en place une copie dans l’inventaire d’un personnage (avec son icône) ou dans la réserve de butin ; les notes du MJ ne sont jamais copiées. Possibilité de copier un objet du SRD pour le modifier. Les objets maison apparaissent en premier dans la recherche d’objets de l’inventaire (MJ).
- La page « Rencontres » devient **Bibliothèque MJ** : vos monstres, vos objets et vos rencontres.
- Correctif : le formulaire de créature contenait un champ qui masquait une propriété native du formulaire.

## 4.0.0 — Bestiaire et objets SRD complets, outils de combat, cartes vivantes
- **Bestiaire SRD complet** : 334 créatures (les 37 fiches rédigées en français et toutes les créatures du SRD 5.1, noms traduits, actions, traits, actions légendaires, défenses, FP et XP), chargé à la demande. Recherche par nom français ou anglais dans Combat et Rencontres.
- **Catalogue d’objets SRD** : 598 entrées (237 équipements, 361 objets magiques) à ajouter à l’inventaire en un clic depuis l’inventaire. Recherche sans accents, en français ou en anglais. 119 noms d’objets magiques restent en anglais faute de traduction officielle libre.
- **Créatures identiques groupées** : ajouter 4 gobelins crée un groupe qui joue sur une seule initiative ; une seule ligne « Gobelin ×4 » dans l’ordre du tour, avec les PV de chacun. Les rencontres déployées en plusieurs exemplaires sont groupées aussi.
- **Actions de monstres en boutons** : un clic note l’attaque au journal du MJ et rappelle les dés à lancer (« Attaque : d20+14 · Dégâts : 2d10+8 perforant »). Les dés restent physiques.
- **Actions légendaires** : compteur par créature (coût de 1 à 3 actions), rechargé automatiquement au début de son tour.
- **Écran du MJ** : aide-mémoire des règles (actions, abri, DD, concentration, jets contre la mort, repos, états) avec recherche, depuis le combat ou Aide & tutoriel.
- **Résumé de séance automatique, sans IA** : combats, rounds, dégâts encaissés, soins, chutes à 0 PV, créatures vaincues et XP, objets obtenus, scènes terminées, repos. Nouvelle séance après 6 h d’inactivité ou à la demande. Le MJ peut le copier, le partager aux joueurs ou l’ajouter à la mémoire de campagne ; la version joueurs ne contient aucun secret.
- **Création de personnage guidée** en trois étapes (classe expliquée, répartition standard ou achat de points, PV et CA calculés). **Montée de niveau assistée** : ce qui change (maîtrise, amélioration de caractéristiques, attaque supplémentaire, sous-classe, emplacements de sorts) et PV gagnés en valeur fixe ou d’après un vrai dé.
- **Cartes** : grille réglable (les jetons s’alignent sur les cases), jetons des aventuriers, des créatures du combat ou libres, à faire glisser au doigt ou à la souris ; chaque joueur déplace uniquement le sien. **Brouillard de guerre** : le MJ révèle les zones au fil de l’exploration (zones petites, moyennes ou grandes, annulation de la dernière zone).
- **Mot de passe oublié** : le MJ crée un lien de réinitialisation valable 2 heures (Campagne → Invitations). Pour le compte du MJ lui-même : `REINITIALISER_MOT_DE_PASSE.bat`.
- **Signaler un problème** : bouton dans Mon compte ; le message, la page, l’appareil et la gravité sont enregistrés dans `data/signalements.jsonl` et listés dans Paramètres pour le MJ.
- **Coupures réseau** : les PV, l’épuisement et les notes partagées saisis hors connexion sont mis de côté et envoyés au retour du réseau (compteur dans la barre du haut).
- Correctif : les fenêtres (créature, signalement…) passaient sous la barre du haut ; elles s’affichent désormais au premier plan.
- Technique : aides d’interface pures extraites dans `src/ui-helpers.js` et testées directement ; plusieurs tests ne dépendent plus du texte exact de l’interface.

## 3.9.0 — Invitations en un scan, mise à jour en un clic, apparence apaisée
- **Écran Illustrations réparé** : les icônes s'affichent de nouveau (elles sont désormais hébergées sur votre serveur, sans connexion Internet) ; état vide expliqué avec un bouton vers l'écran utile.
- **Invitations** : lien direct qui pré-remplit le code, **QR code** à scanner autour de la table (générateur intégré, vérifié par un décodeur indépendant), bouton **Partager** sur téléphone, **« Inviter toute la table »**. Un joueur déjà inscrit qui ouvre un lien se voit proposer de rejoindre la campagne.
- **Mise à jour en un clic** : glissez le ZIP sur `METTRE_A_JOUR.bat`. Sauvegarde, vérification de la nouvelle version sur une copie de la base, et retour automatique à l'ancienne version en cas d'échec. `REVENIR_VERSION_PRECEDENTE.bat` pour revenir en arrière. Les titres de fenêtres affichent la vraie version.
- **Rappel de sauvegarde** pour le MJ propriétaire (aucune sauvegarde, ou plus de 7 jours) avec un bouton « Sauvegarder maintenant ».
- **Tutoriels** : visite guidée qui met en surbrillance les vrais boutons (MJ et joueur), campagne d'entraînement avec monstres d'exemple, aide-mémoire imprimables joueur et MJ, explication des 14 états au survol.
- **Bestiaire SRD** : 37 créatures en français (FP, PV, CA, caractéristiques, défenses, actions), à ajouter au combat ou aux modèles en un clic.
- **Difficulté des rencontres** selon le budget d'XP du groupe (méthode 2024) ; facteur de puissance sur les créatures et modèles.
- **Épuisement** : niveaux 0 à 6, effets selon l'édition (2014 ou 2024), un niveau retiré par repos long.
- **Apparence apaisée** : une seule couleur d'accent, neutres calmes, presque plus de cadres, largeur de page cohérente. Thème **automatique** par défaut (clair « parchemin » ou sombre selon l'appareil), réglable dans Mon compte → Apparence.
- Correctif : après une inscription par lien, le bandeau d'invitation ne s'affiche plus.

## 3.8.0 — Règles, confort et apparence
- **Résistances, vulnérabilités et immunités** par type de dégâts (13 types SRD) pour les personnages et les créatures. Le type choisi avant d'enregistrer des dégâts applique ÷ 2, × 2 ou 0, et le journal affiche le calcul.
- **Fiches de monstres complètes** : six caractéristiques avec modificateurs, traits, actions légendaires et défenses. Jamais transmises aux joueurs.
- **Correctif** : la création d'un monstre ou PNJ depuis le formulaire ne fonctionnait pas (un champ caché masquait l'identifiant du formulaire). Corrigé, avec un test qui empêche le retour du problème.
- **Correctif** : le menu « Mon compte » pouvait passer sous le contenu de la page et devenir inaccessible.
- **Sessions conservées** après un redémarrage du serveur (fichier `data/chroniques-db.json.sessions`, jetons stockés sous forme hachée).
- **Raccourcis clavier** : `?` aide, `/` recherche, `Échap` fermer ; en combat (MJ) `N` tour suivant, `U` annuler.
- **Filtres instantanés** dans le bestiaire, l'inventaire et les notes partagées (dès 4 éléments).
- **Journal et grimoire allégés côté joueur** : rubriques vides masquées, textes réduits, panneaux secondaires repliés (journal −77 % de hauteur, grimoire −32 %).
- **Thème « vélin clair »** au choix : Mon compte → Apparence (Sombre, Clair, Automatique), mémorisé par appareil. Généré automatiquement à partir du thème sombre (`scripts/generate-light-theme.js`).
- `GUIDE_UTILISATION.html` mis à jour : plus de mentions de versions dans les titres, nouvelle section « À la table ».

## 3.7.4 — Allègement côté joueur
- Barre du haut : état de la connexion réduit à une pastille (masquée sur téléphone tant que tout va bien), bouton **?** pour le mode d'emploi à la demande, sélecteur de campagne affiché seulement s'il y en a plusieurs.
- **Fiche joueur compacte** : en-tête sur une ligne avec menu « ⋯ », PV affichés une seule fois, économie du tour visible seulement en combat, titres redondants supprimés (hauteur de page −40 %).
- **Tableau de bord joueur** : « Mon personnage » en grand, les autres joueurs en lignes compactes.
- **Bandeau « À vous de jouer ! »** au tour du joueur.
- **Combat côté joueur** : boutons réservés au MJ retirés, états et concentration repliés.
- Icônes SVG au trait pour la navigation, ornements sobres (filet à losange), mentions de version dynamiques (source unique : `package.json`).
- Nettoyage de l'archive : un seul `MIGRER_DONNEES.bat`, code mort supprimé, tests renommés par fonctionnalité.

## 3.7.3 — Invitations et notes partagées
- **Message d'invitation** prêt à envoyer (lien + code + étapes) avec bouton de copie.
- **Notes partagées des joueurs** : écrites et modifiées par les joueurs, **lecture seule pour le MJ** (appliqué par le serveur), détection des conflits d'édition.

## 3.7.2 — Thème « scriptorium de nuit » et boutons de PV
- Nouvelle identité visuelle (encre, cuir, vélin, rubrique, lapis), polices hébergées localement.
- Boutons de PV rapides (±1, ±5, ±10).
- **Durées d'états** décomptées automatiquement à la fin du tour de la créature.

## 3.7.1 — Fiabilité
- **« ↩ Annuler »** pour le MJ (10 dernières actions de combat).
- Rejeu automatique des variations de PV en cas de conflit de version.
- Bandeau « Connexion perdue ».
- Sauvegardes automatiques tournantes dans `data/auto-backups/` (10 conservées).
- Paquet nettoyé : aucune base, image ou URL privée dans l'archive ; tests indépendants de `config/remote-origin.txt`.

## 3.7.0 — Bêta testeurs
- Bureau de combat modulable (six panneaux), bureau MJ personnalisable, multicampagne, tutoriels express, permissions vérifiées côté serveur.

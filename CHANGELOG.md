# Journal des modifications

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

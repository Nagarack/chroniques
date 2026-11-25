# Chroniques

Assistant de table **Donjons & Dragons 5e** (règles 2014 et 2024) pour le Maître du Jeu et les joueurs. Serveur Node.js 20+ sans dépendance, interface web utilisable sur PC, Android et iPhone (PWA). **Tous les dés restent physiques** : l'application suit les PV, ressources, états, initiative, cartes et notes, mais ne lance jamais de dé.

Historique : voir `CHANGELOG.md`. Recette de test : `GUIDE_TESTEURS.md`.

## Démarrer

1. Installer [Node.js](https://nodejs.org) 20 ou plus récent.
2. Double-cliquer **`DEMARRER_CHRONIQUES.bat`** (ou `npm start`). Au premier lancement, la console affiche une **clé initiale** : elle sert à créer le compte du Maître du Jeu sur `http://127.0.0.1:8080`.
3. Pour jouer à distance : `CONFIGURER_URL_HTTPS.bat` enregistre l'adresse publique (tunnel Cloudflare vers `http://127.0.0.1:8080`) ; `REVENIR_MODE_LOCAL.bat` la retire. `PROTEGER_CLOUDFLARE_ACCESS.bat` aide à restreindre l'accès.

## Inviter des joueurs

**Campagne → Invitations des joueurs** : « Inviter ce joueur » ou « Inviter toute la table ». Chaque invitation affiche un **QR code** à scanner et un **lien** qui pré-remplit le code (bouton Partager sur téléphone). Valable 24 h, une seule fois. Pour jouer à distance, configurez d'abord l'adresse HTTPS : sinon le lien ne fonctionne que sur le PC du MJ.

## À la table

- **Règles du jeu en français** : le SRD 5.1 officiel (combat, états, repos, magie…) avec recherche, et la description complète des 319 sorts du SRD dans le grimoire et sur les cartes imprimées.
- **Chuchotements** : messages privés MJ ↔ joueur (bouton ✉).
- **Compagnons, familiers et montures** : mini-fiches, envoi au combat avec leur propre tour, PV gérés par le joueur, jeton sur la carte.
- **Objectifs de quête** cochables, visibles des joueurs pour les quêtes publiées (objectifs secrets possibles).
- **Calendrier du monde** : date et heure de la fiction, saisons, voyages, repos qui font passer le temps, événements prévus.
- **Ambiance sonore** : musiques et bruitages stockés sur votre serveur, lancés par le MJ, joués sur l’écran de table.
- **Export / import de personnage** entre campagnes (fichier .json).
- **Carnet personnel** par personnage (joueur et MJ seulement), **bestiaire filtré par milieu**, **mode hors connexion** (dernières données affichées, PV et notes envoyés au retour du réseau).
- **Application Android** (`android/chroniques.apk`, ou `/android` sur le serveur du MJ) : la même application que le site, au choix de chacun — interface intégrée (démarrage rapide, consultation hors connexion), photos, exports, impression, notifications « À vous de jouer ! » et rappels de séance. Android 7 ou plus récent ; installation hors Play Store (autoriser l’installation depuis le navigateur).
- **Récit et mémoire** : « Précédemment dans… » composé à partir de la dernière séance et relu par le MJ, frise chronologique, bilan chiffré, livre de campagne complet. **Voyage & exploration** (rythme, distance, marche forcée, rations, lumières) et **factions** avec réputation, **relations** PNJ ↔ personnages, **co-MJ créatures** au rôle restreint.
- **Synchronisation légère** : seuls les changements sont envoyés aux appareils. **Publication automatique** des versions avec GitHub Actions (voir `PUBLIER_UNE_VERSION.md`).
- **Historique de chaque personnage** (fiche → Historique) : niveaux, XP, objets, combats, quêtes et documents notés automatiquement ; notes du MJ secrètes ou visibles. **Coffre du groupe** commun dans l’Inventaire.
- **Pour le MJ** : **Séance du jour** (tout ce qui est prévu sur une page, imprimable), **Vue du groupe** (sauvegardes, scores passifs, DD des sorts), **PNJ express** (idées écrites, aucun tirage), **lieux du carnet reliés aux repères de carte**, **modèles de campagne** (exporter / importer la préparation), **poste co-MJ** pour les créatures (`/#poste-comj`), durées d’états précises, concentration des créatures et minuteur de tour.
- **Rappel de séance** par notification la veille (Paramètres → Rappel de séance ; adresse HTTPS nécessaire, iOS 16.4+ avec Chroniques sur l’écran d’accueil).
- **Apparence** : automatique par défaut ; Mon compte → Apparence (Sombre, Clair, Automatique).
- **Aide** : visite guidée, aide-mémoire imprimables (`/aide-joueur.html`, `/aide-mj.html`) et campagne d'entraînement dans Aide & tutoriel.
- **Recherche globale** : Ctrl+K (ou la loupe) pour tout retrouver et lancer des commandes.
- **Écran de table** : carte, brouillard, jetons et initiative en plein écran sur une TV, sans aucun secret.
- **Repos guidé, XP et jalons, cartes de sorts, livre de campagne en PDF, factions et attitudes.**
- **Documents pour les joueurs** : lettres, indices et images envoyés à un joueur ou à toute la table (Journal & quêtes).
- **Organisation des séances** : dates proposées, disponibilités des joueurs, prochaine séance affichée à l’accueil.
- **Fiche imprimable** : aperçu puis impression ou PDF depuis la fiche.
- **Monstres lanceurs de sorts** : emplacements et sorts suivis en combat ; les lanceurs du SRD arrivent tout prêts.
- **Inventaire vivant** : boire une potion (dés réels), munitions, charge transportée, 3 harmonisations, CA calculée depuis l’armure et le bouclier, dons entre joueurs, partage de l’or, **marchands** dont les achats débitent la bourse.
- **Carte tactique** : jeton actif mis en évidence, mesure des distances, zones de sort (cercle, cône, ligne, cube).
- **Outils du MJ en combat** : vue du groupe et alerte à 0 PV, pouvoirs à recharge 5-6, actions de repaire à l’initiative 20.
- **Monstres et objets maison** : « Créer un monstre » et « Créer un objet » depuis l’accueil, le combat ou la Bibliothèque MJ, avec une icône du catalogue ou votre propre image ; les objets se donnent aux joueurs en un clic, sans vos notes secrètes.
- **Bestiaire SRD (334 créatures, fiches officielles en français) et objets SRD (598, objets magiques en français officiel)** : dans Combat, la Bibliothèque MJ et l’inventaire. Plusieurs exemplaires d’une créature partagent une initiative ; leurs actions et actions légendaires sont des boutons qui rappellent les dés.
- **Écran du MJ** : aide-mémoire des règles, depuis le combat.
- **Résumé de séance** : dans Journal & quêtes, construit automatiquement (sans IA), à partager ou non.
- **Personnages** : création guidée en trois étapes ; montée de niveau qui explique ce qui change.
- **Cartes** : grille, jetons à faire glisser, brouillard de guerre révélé par le MJ.
- **Mot de passe oublié** : le MJ crée un lien de réinitialisation (Campagne → Invitations) ; pour son propre compte, `REINITIALISER_MOT_DE_PASSE.bat`.
- **Signaler un problème** : Mon compte → Signaler un problème ; les messages arrivent dans `data/signalements.jsonl` et dans Paramètres.
- **Difficulté des rencontres, épuisement** : dans la Bibliothèque MJ et sur la fiche.
- **Portraits** : sans image choisie, chaque aventurier affiche l’icône de sa classe.
- **Raccourcis** : `?` aide de l'écran, `/` recherche, `Échap` fermer ; en combat, pour le MJ, `N` tour suivant et `U` annuler.
- **Résistances et vulnérabilités** : réglables sur chaque fiche et chaque créature ; choisir le type de dégâts avant de les enregistrer.
- **Tables aléatoires** (5.1) : vos tables, votre dé, le total saisi, la ligne affichée.
- **Dégâts de zone** (5.1) : plusieurs cibles en une saisie, sauvegardes et résistances appliquées ; cibles touchées par une zone de la carte.
- **Clés d’accès** (5.1) : connexion par empreinte, visage ou code de l’appareil (Paramètres).

## Mettre à jour

**Depuis l’application (à partir de la 4.8)** : Paramètres → « Mettre à jour Chroniques » → envoyer le fichier .zip → « Installer et redémarrer ». Sauvegarde, vérification et retour arrière automatique sont faits comme avec le script ; il faut que le serveur ait été lancé par `DEMARRER_CHRONIQUES.bat`.

**Avec le script** : Fermez le serveur, puis **glissez le ZIP de la nouvelle version sur `METTRE_A_JOUR.bat`**. Le script sauvegarde la base et les images, met de côté la version actuelle, installe la nouvelle, la vérifie sur une copie de la base et revient tout seul en arrière si quelque chose échoue. `REVENIR_VERSION_PRECEDENTE.bat` remet la version précédente. Les dossiers `data`, `config` et `backups` ne sont jamais modifiés.

**Publication automatique (5.0.1)** : les versions publiées sur le dépôt GitHub arrivent seules sur votre serveur (voir `PUBLIER_UNE_VERSION.md` ; pour un dépôt privé, collez un jeton en lecture dans Paramètres → Mettre à jour Chroniques).

**Mises à jour automatiques signées (facultatif, à partir de la 4.9)** : Chroniques peut aller chercher lui-même les nouvelles versions publiées par l’éditeur, vérifier leur signature et les préparer ; vous n’avez plus qu’à cliquer sur « Installer et redémarrer ». L’éditeur peut livrer un fichier `update-source.json` (adresse + clé publique, **sans jeton**) à la racine : toutes les installations sont alors réglées d’office. Sinon, ou pour compléter, copiez `update-source.exemple.json` dans `config/update-source.json` (propre à votre installation, jamais dans les ZIP ; `"enabled": false` désactive) et renseignez :
- `manifest` : l’adresse HTTPS de la fiche de version (`chroniques-maj.json`) ;
- `publicKey` : la clé publique de l’éditeur (affichée une fois par `node scripts/dev/sign-release.js cles <dossier-secret>`) ;
- `token` (facultatif) : un jeton d’accès en lecture si les fichiers sont sur un dépôt GitHub privé (lu **uniquement** dans `config/update-source.json`, jamais dans les ZIP) ;
- `autoDownload` : `true` pour télécharger dès qu’une version est annoncée (vérification toutes les 6 heures), `false` pour attendre « Télécharger » dans Paramètres.

Côté éditeur, pour chaque version : `node scripts/dev/sign-release.js signer Chroniques_Vx.zip --cle <privee.pem> --url <adresse HTTPS du zip> --notes "…"` crée `chroniques-maj.json`, à publier à l’adresse `manifest` avec le ZIP. Une fiche modifiée, une autre clé ou un ZIP différent de celui signé sont refusés. La clé privée ne doit jamais être partagée ni mise dans le ZIP.

Venant d'une version antérieure à 3.9 (sans METTRE_A_JOUR.bat) : utilisez une dernière fois la méthode « dossier neuf + MIGRER_DONNEES.bat » ci-dessous.

## Sauvegardes et migration

- `SAUVEGARDER_CHRONIQUES.bat` (ou `npm run backup`), ou « Sauvegarder maintenant » dans Chroniques, copie la base et les images. Le serveur fait aussi une sauvegarde quotidienne automatique (20 conservées) et des copies avant modification dans `data/auto-backups/` (10 conservées).
- **Restaurer** : Paramètres → « Restaurer une sauvegarde » (MJ propriétaire). « Tester » relit la sauvegarde sans rien changer ; « Restaurer » crée d’abord une sauvegarde de sécurité de l’état actuel.
- **Copie miroir** : indiquez dans Paramètres un dossier de clé USB ou un dossier OneDrive / Google Drive / Dropbox ; chaque sauvegarde y est recopiée.
- **Nouvelle version :** sauvegarder, arrêter l'ancien serveur, extraire dans un **dossier vide**, lancer **`MIGRER_DONNEES.bat`** et indiquer l'ancien dossier. Le script copie la base, `data/media` et `config/remote-origin.txt`, et **refuse d'écraser** une base existante. Détails : `LIRE_AVANT_MIGRATION.txt`.

## Vérifier

`VERIFIER_BETA.bat` (contrôle de l'installation + tests), `TESTER_CHRONIQUES.bat` ou `npm test`. Les tests couvrent la logique, l'API, les permissions et le code de l'interface ; ils ne remplacent pas un essai sur de vrais téléphones.

## Sécurité

Les permissions sont vérifiées **côté serveur** par campagne et par rôle : un joueur ne reçoit jamais les données réservées au MJ, et le MJ est en lecture seule sur les notes partagées des joueurs. Les mots de passe sont hachés (scrypt). Les clés d’accès (WebAuthn) ne stockent sur le serveur qu’une clé publique ; la vérification de l’utilisateur est obligatoire. Aucune base, clé, image personnelle ni URL privée n'est incluse dans l'archive. Les fonctions IA sont désactivées tant qu'aucune clé n'est configurée.

## Structure

- `server.js` : serveur HTTP, API, temps réel (SSE), persistance JSON atomique.
- `src/` : logique de jeu (`logic.js`, `progression.js`, `spells.js`…), interface (`online-app.js`, `ui-helpers.js`, `styles.css`, `theme.js`) et modules (cartes, créatures, rencontres, résumé de séance, guide de classe…). `src/data/` contient les données SRD générées par `scripts/dev/build-srd-data.js` (bestiaire, objets) et `scripts/dev/build-srd-fr.py` (règles et sorts en français). L’affichage est mis à jour finement par `dom-morph.js` ; les vues de la 4.6 sont dans `app-extras.js`, les règles dans `rules-ref.js`. `styles-light.css` est **généré** : après toute modification de `styles.css`, lancer `node scripts/generate-light-theme.js` (un test vérifie qu'il est à jour).
- `assets/` : icônes, fond cartographique, polices (`assets/fonts/`).
- `scripts/` : sauvegarde, contrôle de l'installation, configuration Cloudflare, génération des tutoriels.
- `tests/` : suite `node --test`, un fichier par fonctionnalité.
- `data/` et `config/` : vos données et votre configuration (jamais livrées dans l'archive).

## Crédits et licences

Voir `CREDITS_ILLUSTRATIONS.md` (illustrations, bestiaire SRD, règles et sorts en français du SRD 5.1 — licence CC BY 4.0, Wizards of the Coast) et `assets/fonts/LICENSES.txt` (polices IM Fell English et Alegreya Sans, licence SIL OFL 1.1). Repères de règles : SRD 5.1 et 5.2.1.

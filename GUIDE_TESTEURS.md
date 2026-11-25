# Chroniques — Recette bêta

Cette version est une **bêta** : lisez ces points avant d'inviter de vrais joueurs. L'application est hébergée sur **le PC du MJ** (Windows, Node.js 20+) et le serveur doit rester démarré. Les jets de dés se font **physiquement**.

## Avant de commencer — 10 minutes

1. Dans l'ancienne version, exécuter `SAUVEGARDER_CHRONIQUES.bat`, puis arrêter le serveur. **Conserver l'ancien dossier et sa sauvegarde.**
2. Extraire cette version dans un **dossier neuf et vide**, lancer `MIGRER_DONNEES.bat` et saisir le chemin de l'ancien dossier (celui qui contient `server.js`).
3. Lancer **`VERIFIER_BETA.bat`** : contrôle non destructif du dossier, de la base et de Node.js, puis suite de tests.
4. Lancer `DEMARRER_CHRONIQUES.bat`. Ouvrir `http://127.0.0.1:8080` sur le PC, ou votre domaine HTTPS si le tunnel Cloudflare est actif (service HTTP vers `127.0.0.1:8080`).
5. Garder un navigateur MJ **et un navigateur Joueur distinct**. Ne partagez aucun mot de passe, code d'invitation ou note privée dans les captures de bugs.
6. Avant une présentation publique, vérifier Cloudflare Access ou une protection équivalente : la simple présence du domaine HTTPS ne restreint pas l'accès.

## Aide intégrée

La **visite guidée** (Aide & tutoriel, ou le bandeau d'accueil) montre les vrais boutons écran par écran. Le bouton **?** de la barre du haut ouvre le **Mode d'emploi** de l'écran en cours (trois gestes, différents pour le MJ et les joueurs) ; il se referme au changement d'écran. À la première connexion, un rappel **« Vos premiers pas »** guide le démarrage. Un index imprimable de toutes les aides est disponible sur **`/tutos.html`**, sans connexion.

## Grille de test — à cocher à la table

- [ ] **Connexion et rôles :** un joueur voit sa fiche et non les notes privées ; le MJ bascule en mode Joueur et revient.
- [ ] **Invitation :** « Inviter ce joueur » ; un joueur scanne le QR code avec son téléphone et arrive sur le formulaire avec le code déjà rempli. Essayer aussi « Inviter toute la table » et le bouton Partager.
- [ ] **Mise à jour :** sur une copie de l'installation, glisser un ZIP sur METTRE_A_JOUR.bat ; vérifier que campagnes et images sont intactes, puis tester REVENIR_VERSION_PRECEDENTE.bat.
- [ ] **Visite guidée :** la lancer en MJ et en joueur, sur PC et téléphone ; chaque étape doit montrer le bon bouton.
- [ ] **Bestiaire et difficulté :** ajouter des gobelins depuis le bestiaire, composer une rencontre et lire sa difficulté.
- [ ] **Portraits (4.1) :** chaque aventurier sans image choisie affiche l’icône de sa classe (Rôdeuse → archer) ; plus aucune tête de gobelin.
- [ ] **Monstres maison (4.1) :** Accueil → Autres raccourcis → Créer un monstre ; le retrouver dans la recherche du bestiaire en combat et l’ajouter en 2 exemplaires.
- [ ] **Objets maison (4.1) :** Créer un objet avec une note secrète, le donner à un joueur : le joueur le voit dans son inventaire, sans la note.
- [ ] **Application Android (5.0) :** installer depuis Paramètres → Application Android ; choisir le serveur ; se connecter ; envoyer une photo, exporter un personnage, imprimer ; couper le Wi-Fi puis rouvrir (interface toujours là) ; écran éteint pendant un combat → « À vous de jouer ! ».
- [ ] **Récit, frise, bilan (5.0) :** composer « Précédemment… », publier, l’afficher sur la TV ; vérifier la frise et le bilan après deux séances ; livre de campagne.
- [ ] **Voyage et factions (5.0) :** voyage de 40 km à rythme normal (marche forcée au-delà de 8 h), torche qui s’éteint, rations ; réputation d’une faction du carnet (+1 avec une raison) ; relation PNJ ↔ personnage secrète invisible du joueur.
- [ ] **Co-MJ créatures (5.0) :** nommer un joueur « Co-MJ créatures » : il gère les monstres, ne voit ni le carnet ni les notes secrètes.
- [ ] **Synchronisation (5.0) :** à six appareils, enchaîner les actions rapidement : tout le monde voit la même chose ; un téléphone coupé une minute se remet à jour seul.
- [ ] Imprimer **FICHES_DE_TEST.html** (une page MJ, une page joueur) pour la séance d’essai.
- [ ] **Historique (4.9) :** distribuer de l’XP, donner un objet, tomber à 0 PV ; ouvrir Fiche → Historique côté joueur et côté MJ. Ajouter une note secrète (MJ) : le joueur ne doit jamais la voir.
- [ ] **Coffre du groupe (4.9) :** un joueur dépose un objet (Donner à… → Coffre du groupe), un autre le reprend ; essayer « le MJ distribue ».
- [ ] **Rappel de séance (4.9) :** en HTTPS, Paramètres → Activer sur cet appareil → « Envoyer un essai » (Android, PC, iPhone ajouté à l’écran d’accueil). Fixer une séance pour le lendemain soir : la notification arrive à partir de 18 h la veille.
- [ ] **Séance du jour, Vue du groupe, PNJ express, Poste co-MJ (4.9) :** préparer une scène reliée à un PNJ et une rencontre, vérifier la page et l’impression ; ouvrir `/#poste-comj` sur une tablette.
- [ ] **Combat (4.9) :** état « jusqu’à la fin du prochain tour du lanceur » avec sauvegarde rappelée ; concentration d’un monstre ; minuteur de tour sur l’écran de table.
- [ ] **Modèle de campagne (4.9) :** exporter, créer une campagne vide, importer : scènes, PNJ, rencontres et cartes reliés correctement.
- [ ] **Mises à jour signées (4.9, éditeur) :** créer les clés, signer un ZIP, publier la fiche et le ZIP, configurer `config/update-source.json`, « Vérifier maintenant » puis « Télécharger » et « Installer ».
- [ ] **Mise à jour (4.8) :** installer 4.8 avec METTRE_A_JOUR.bat, puis pour la version suivante : Paramètres → Mettre à jour → envoyer le ZIP → Installer et redémarrer ; vérifier que les téléphones se rechargent.
- [ ] **Hors connexion (4.8) :** sur un téléphone déjà connecté en HTTPS, couper le Wi-Fi et les données, rouvrir Chroniques, retirer des PV, rétablir le réseau : les PV arrivent chez le MJ.
- [ ] **Bestiaire et objets (4.7) :** dans la Bibliothèque MJ, ouvrir « 📖 Fiche officielle » d’un monstre ; en combat, « 📖 Fiche » ; chercher « Langue de feu » dans le catalogue d’objets.
- [ ] **Règles (4.6) :** Règles du jeu → chercher « à terre », « abri » ; dans le grimoire, ouvrir 📖 Description ; imprimer des cartes de sorts (texte présent).
- [ ] **Chuchotements (4.6) :** le MJ écrit à un joueur ; vérifier badge, vibration sur téléphone, et que l’autre joueur ne voit rien.
- [ ] **Compagnon (4.6) :** ajouter un familier, l’envoyer au combat, lui retirer des PV depuis le téléphone, placer son jeton.
- [ ] **Calendrier et sons (4.6) :** activer le calendrier, faire un repos long ; ajouter un MP3 et le lancer sur l’écran de table (TV).
- [ ] **Sauvegardes (4.6) :** Paramètres → Tester une sauvegarde puis Restaurer ; essayer une copie miroir vers une clé USB ou OneDrive.
- [ ] **Recherche (4.5) :** Ctrl+K, taper « liche », « potion » ou le nom d’un personnage ; essayer la commande « Écran du MJ ».
- [ ] **Écran de table (4.5) :** brancher une TV ou un vidéoprojecteur, ouvrir « Écran de table » ; vérifier qu’aucune créature masquée n’apparaît et que le tour actif suit.
- [ ] **Panneau joueur (4.5) :** pendant un combat, sur téléphone, vérifier la vibration « À vous de jouer ! » et les boutons Action / Action bonus / Réaction.
- [ ] **Repos et XP (4.5) :** repos court avec un dé de vie réel ; repos long du groupe ; distribuer l’XP de la séance puis passer un niveau.
- [ ] **Impressions (4.5) :** cartes de sorts et livre de campagne en PDF.
- [ ] **Annuler (4.5) :** supprimer un objet maison puis « Annuler » dans la notification.
- [ ] **Séances (4.4) :** le MJ propose deux dates, chaque joueur répond sur téléphone, le MJ retient une date : elle s’affiche à l’accueil de tous.
- [ ] **Documents (4.4) :** le MJ envoie une lettre avec image à un seul joueur ; lui seul reçoit l’alerte et peut l’ouvrir ; le MJ voit « lu par ».
- [ ] **Lanceurs de sorts (4.4) :** ajouter une Liche au combat, « Lancer » un sort de niveau 3, puis « Repos long ».
- [ ] **Fiche imprimable (4.4) :** imprimer une fiche en PDF depuis un ordinateur et depuis un téléphone ; vérifier qu’elle tient sur une page lisible.
- [ ] **Potion (4.3) :** un joueur blessé « Boit » une potion de soins, saisit le total de ses dés : PV soignés, potion retirée.
- [ ] **Équipement (4.3) :** équiper une cotte de mailles et un bouclier, appliquer la CA proposée ; vérifier la charge transportée et le refus d’un 4e objet harmonisé.
- [ ] **Échanges (4.3) :** donner une potion à un autre joueur ; le MJ partage 100 po entre trois personnages.
- [ ] **Marchand (4.3) :** le MJ crée une boutique (un objet SRD au prix officiel, un article libre), l’ouvre ; un joueur achète sur téléphone et voit sa bourse diminuer.
- [ ] **Carte tactique (4.3) :** avec une grille, mesurer une distance au doigt, poser un cône de 9 m depuis un jeton ; le jeton de la créature active est entouré.
- [ ] **Outils MJ (4.3) :** utiliser le souffle d’un dragon puis le recharger au tour suivant ; créer un monstre avec des actions de repaire et voir le bandeau au compte 20 ; faire tomber un joueur à 0 PV et voir l’alerte.
- [ ] **Images maison (4.2) :** créer un monstre avec une photo prise au téléphone, l’ajouter au combat puis le révéler : le joueur voit l’image seulement après la révélation. Même essai avec un objet donné à un joueur.
- [ ] **Bestiaire complet (4.0) :** chercher « dragon rouge » ou « lich » ; ajouter 4 gobelins : une seule ligne « Gobelin ×4 » dans l'initiative, un seul tour pour le groupe.
- [ ] **Actions de monstres :** cliquer « Cimeterre » sur un gobelin : le journal MJ note l'action et le message rappelle « d20+4 ». Sur un dragon adulte, dépenser une action légendaire coûtant 2 ; le compteur se recharge à son tour.
- [ ] **Écran du MJ :** l'ouvrir depuis le combat, chercher « abri ».
- [ ] **Objets SRD :** dans l'inventaire, chercher « potion de soins » ou « longsword » et ajouter l'objet.
- [ ] **Résumé de séance :** après un combat, ouvrir Journal & quêtes ; vérifier les dégâts, créatures vaincues et XP ; le partager et contrôler côté joueur qu'aucune créature masquée n'y figure.
- [ ] **Création guidée :** créer un personnage en trois étapes (répartition standard, PV et CA proposés) ; passer un niveau avec un vrai dé de vie.
- [ ] **Cartes vivantes :** ajouter une grille et les jetons des aventuriers ; un joueur déplace son jeton (pas celui des autres) au doigt sur téléphone ; activer le brouillard et révéler une salle.
- [ ] **Mot de passe oublié :** créer un lien de réinitialisation pour un joueur, l'ouvrir dans un autre navigateur, choisir un nouveau mot de passe.
- [ ] **Coupure réseau :** couper le Wi-Fi d'un téléphone joueur, retirer des PV, rétablir : la valeur arrive chez le MJ.
- [ ] **Épuisement :** monter à 2, vérifier le texte d'effet selon l'édition, faire un repos long (retour à 1).
- [ ] **Illustrations :** les icônes s'affichent, même sans connexion Internet.
- [ ] **Multicampagne :** créer ou rejoindre une autre campagne, changer de campagne, vérifier que personnages, notes et bureau ne se mélangent pas.
- [ ] **Accueil MJ :** déplacer, masquer et réafficher un panneau du bureau ; actualiser et vérifier la disposition.
- [ ] **Combat MJ :** ouvrir le bureau de combat, démarrer, saisir les initiatives réelles, avancer un tour.
- [ ] **Annuler (MJ) :** faire une erreur de PV, cliquer « ↩ Annuler » ; vérifier que la valeur revient.
- [ ] **Durées d'états (MJ) :** minuter un état sur 1 round ; il doit disparaître à la fin du tour de la créature.
- [ ] **Joueur en combat :** « À vous de jouer ! » s'affiche au bon moment ; la fiche tient sur un écran de téléphone avec PV et boutons rapides visibles.
- [ ] **Fiches :** modifier PV et ressources depuis un compte autorisé ; vérifier la synchronisation sur un deuxième écran.
- [ ] **Notes partagées :** deux joueurs écrivent et modifient ; le MJ lit sans pouvoir modifier ; un conflit d'édition affiche un message clair.
- [ ] **Dés physiques :** aucun jet automatique ; résultats et blessures saisis à la main.
- [ ] **Monstres :** créer une créature avec ses six caractéristiques et ses défenses, la modifier, la masquer ; un joueur ne voit ni ses notes, ni ses caractéristiques.
- [ ] **Résistances :** régler une résistance au feu sur un personnage, enregistrer 9 dégâts de feu ; il doit en perdre 4 et le journal doit afficher « 9 → 4 ».
- [ ] **Raccourcis (MJ, ordinateur) :** en combat, `N` passe le tour, `U` l'annule ; `?` ouvre l'aide, `Échap` la ferme.
- [ ] **Recherche :** avec au moins 4 créatures, objets ou notes, le champ « Filtrer » réduit la liste en direct.
- [ ] **Apparence :** Mon compte → Apparence passe en thème clair ; le choix est conservé après rechargement.
- [ ] **Redémarrage :** arrêter puis relancer le serveur pendant que les joueurs sont connectés ; ils doivent rester connectés.
- [ ] **Cartes et trésors :** placer et révéler un repère, créer un coffre, distribuer un objet.
- [ ] **Lisibilité :** thème sombre confortable sur PC et téléphone, textes assez grands, aucun chevauchement avec un nom long.
- [ ] **Reconnexion :** couper puis restaurer le réseau ; le bandeau rouge « Connexion perdue » apparaît puis disparaît, sans perte de données.
- [ ] **Sauvegarde :** lancer une sauvegarde et vérifier son existence (des copies automatiques sont aussi faites dans `data/auto-backups/`).

## Signalement des bugs

Le plus simple : **Mon compte → Signaler un problème** dans l'application. Page, appareil, taille d'écran et version sont ajoutés automatiquement ; le MJ retrouve les messages dans **Paramètres** et dans `data/signalements.jsonl`. Sinon, noter **l'heure**, le **rôle** (MJ, co-MJ, joueur), la **campagne de test**, l'**appareil**, le **navigateur**, la **page**, la **manipulation** et le **résultat observé**, avec une capture sans secrets. Exemple :

> `03/11 — 20:15 — Joueur — campagne démonstration — iPhone/Safari — Cartes — je révèle un repère, l'image ne charge pas — attendu : apparition du repère`.

**Gravité :** bloquant (impossible de jouer ou de se connecter), important (action ou permission incorrecte), cosmétique (mise en page).

## Limites connues

- La disposition des panneaux est propre au navigateur et ne se synchronise pas entre appareils.
- « Initiative et détails » reste nécessaire pour certains réglages avancés (créatures, états).
- Les défenses ne gèrent que les types de dégâts du SRD ; les cas particuliers (dégâts non magiques, adamantium…) restent à l'appréciation du MJ.
- Le thème clair est généré automatiquement : quelques détails peuvent encore manquer de contraste, signalez-les.
- Les contrôles automatisés ne remplacent pas un essai réel sous Windows, Safari, Android et Cloudflare Tunnel.
- Les données officielles hors SRD ne sont pas fournies (Manuel des monstres, Guide du maître…) ; seul le SRD sous licence CC BY 4.0 est inclus. 119 noms d'objets magiques et quelques textes de traits sont encore en anglais.
- Le brouillard de guerre masque l'affichage : l'image complète de la carte reste techniquement téléchargeable par un joueur. Pour un secret absolu, gardez la carte privée.
- Le résumé de séance se fonde sur ce qui a été saisi : il ne connaît pas l'auteur des dégâts.
- Les fonctions IA restent **désactivées** tant qu'aucune clé n'est configurée explicitement.

## Retour arrière

Arrêter le serveur, relancer l'ancienne version depuis **son dossier intact**. Les modifications faites dans la nouvelle base ne sont pas recopiées en arrière : conservez les sauvegardes séparément et n'écrasez jamais l'ancienne base.

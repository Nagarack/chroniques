# Crédits et licences des illustrations — Chroniques V1.6

## Bibliothèque pré-intégrée

Cette version propose **164 choix organisés à partir de 140 icônes distinctes** pour les personnages, monstres et PNJ, sorts, objets et équipements. Les illustrations sont des œuvres existantes de la collection [Game-icons.net](https://game-icons.net/). Elles sont affichées depuis leur site lorsque le navigateur dispose d'Internet ; **elles ne sont pas fournies sous forme d'images locales dans le ZIP**.

- Artistes des fichiers référencés : **Lorc** et **Delapouite** ; pour quelques portraits d’aventuriers (V4.1) : **Cathelineau** (tree-face, swordwoman, swordman, nun-face, witch-face, bad-gnome), **DarkZaitzev** (hooded-assassin, hooded-figure, ninja-head), **Kier Heyl** (elf-helmet, dwarf-helmet) et **Skoll** (troll).
- Licence : **Creative Commons Attribution 3.0 (CC BY 3.0)**.
- Répertoire source : https://github.com/game-icons/icons
- Licence : https://creativecommons.org/licenses/by/3.0/
- Recommandation de crédit des auteurs : *Icons made by Lorc, Delapouite, Cathelineau, DarkZaitzev, Kier Heyl and Skoll. Available on https://game-icons.net.*
- Des adaptations de couleur et de fond peuvent être effectuées par le service de rendu Game-icons.net.

Chaque choix dans l'interface indique l'artiste correspondant. Le code `src/art-catalog.js` définit la liste des icônes sélectionnées avec leur nom et leur source. L'application n'affirme pas que ces icônes sont des représentations officielles des monstres, sorts, équipements ou personnages de Donjons & Dragons.

## Images importées par les membres du groupe

Un utilisateur peut importer une image autorisée par ses droits : illustration personnelle, image achetée avec les droits d'utilisation adéquats ou image libre de droits. Le MJ ou le joueur reste responsable de disposer des droits nécessaires pour l'utiliser et l'afficher aux participants.

Les images importées sont stockées dans `data/media/` sur l'ordinateur hébergeant Chroniques. Les noms de fichiers sont aléatoires et les téléchargements exigent une session autorisée. Une créature cachée ne divulgue ni l'URL ni l'image aux joueurs.

## Et les illustrations officielles de D&D ?

Cette version **n'intègre pas** les illustrations officielles des livres Wizards of the Coast, ni des illustrations copiées de sites sans licence claire. La disponibilité publique d'une image sur le Web ne signifie pas qu'elle est librement redistribuable.

## Polices

- **IM Fell English** (Igino Marini) et **Alegreya Sans** (Juan Pablo del Peral) — licence SIL Open Font License 1.1, distribuées via Fontsource. Texte complet : `assets/fonts/LICENSES.txt`. Les polices sont hébergées localement ; aucun appel à un service externe.

## Bestiaire SRD

Le bestiaire intégré (`src/bestiary.js`) reprend des statistiques de créatures du System Reference Document 5.1, traduites et résumées en français pour Chroniques.

This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.

## Bestiaire SRD complet et catalogue d'objets

`src/data/srd-monsters.js` (334 créatures) et `src/data/srd-items.js` (équipement et objets magiques) sont générés par `scripts/dev/build-srd-data.js` à partir des données JSON du projet 5e-database (https://github.com/5e-bits/5e-database, code sous licence MIT), qui reprennent le SRD 5.1. Les noms sont traduits en français par Chroniques (noms d'équipement : traduction française du même projet) ; les actions d'attaque sont reformulées en français à partir des données ; les textes non traduits sont signalés par [SRD] et restent en anglais. Ce contenu est soumis à la licence CC BY 4.0 indiquée ci-dessus. Le Manuel des monstres et le Guide du maître complets ne sont pas inclus (ils ne sont pas sous licence libre).

## Icônes

Les icônes Game-icons.net (Lorc, Delapouite et autres, CC BY 3.0) sont désormais copiées dans `assets/icons` à partir du paquet `@iconify-json/game-icons`, sans modification de dessin (couleur de remplissage uniquement). Aucune connexion à Game-icons.net n'est nécessaire.

## QR codes

Les QR codes d'invitation sont produits par un générateur écrit pour Chroniques (`src/qr.js`), sans bibliothèque externe.

## Règles et sorts en français (SRD 5.1 officiel en français)

`src/data/srd-regles-fr.js` (règles : caractéristiques, aventure, combat, magie, états, niveaux, dangers, objets magiques ; textes complets des 319 sorts), `src/data/srd-spells-index.js` (catalogue des sorts), `src/data/srd-monstres-fr.js` (blocs de statistiques des créatures) et `scripts/dev/srd-objets-fr.json` (noms et descriptions des objets magiques, repris dans `src/data/srd-items.js`) sont générés par `scripts/dev/build-srd-fr.py` à partir de la traduction française officielle du SRD 5.1 (« Document de Référence du Système 5.1 », fichier SRD_CC_v5.1_FR.pdf), sans réécriture du texte. Les identifiants anglais des sorts sont retrouvés dans les données du projet 5e-database.

Ce travail comprend la documentation tirée du Document de Référence du Système 5.1 (« SRD 5.1 ») par Wizards of the Coast LLC et disponible à l'adresse https://dnd.wizards.com/fr/resources/systems-reference-document. Le SRD 5.1 est distribué en vertu de la licence Creative Commons Attribution 4.0 International disponible à l'adresse https://creativecommons.org/licenses/by/4.0/legalcode.fr.

Modifications apportées par Chroniques : mise en page (paragraphes, listes et tableaux reconstitués depuis le PDF, en-têtes et pieds de page retirés), découpage par sections pour la recherche. Les tableaux complexes peuvent apparaître simplifiés.

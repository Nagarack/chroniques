# Publication automatique des versions (site + application Android)

## Comment ça marche

1. Claude prépare une nouvelle version et l’envoie sur votre dépôt GitHub privé, avec une étiquette `vX.Y.Z`.
2. GitHub Actions (onglet *Actions* du dépôt) lance les tests, construit l’application Android signée, le ZIP et la fiche de version signée, puis publie la version (onglet *Releases*).
3. Votre serveur Chroniques vérifie toutes les 6 heures (ou tout de suite : Paramètres → « Vérifier maintenant »), télécharge la version, contrôle la signature et l’empreinte, puis affiche **« Installer et redémarrer »**. Rien ne s’installe sans votre accord.
4. Une fois le serveur à jour, l’application Android des joueurs le détecte et propose **« Mettre à jour »** (Android demande une confirmation).

## À faire une seule fois

### 1. Créer le dépôt privé
Sur github.com → bouton **New** (nouveau dépôt) → nom : `chroniques` → **Private** → ne cochez rien d’autre (pas de README) → *Create repository*.

### 2. Relier GitHub à Claude
claude.ai → **Paramètres → Connecteurs → GitHub** → se connecter, puis autoriser l’application GitHub de Claude sur le dépôt `chroniques` (« Only select repositories »). C’est ce qui permet à Claude d’y envoyer les nouvelles versions.

### 3. Enregistrer les 3 secrets
Dans le dépôt : **Settings → Secrets and variables → Actions → New repository secret**, trois fois, en copiant le contenu des fichiers fournis (dossier « secrets-github ») :

| Nom du secret | Contenu |
|---|---|
| `CHRONIQUES_UPDATE_KEY` | tout le fichier `CHRONIQUES_UPDATE_KEY.txt` (lignes BEGIN/END comprises) |
| `CHRONIQUES_KEYSTORE_B64` | tout le fichier `CHRONIQUES_KEYSTORE_B64.txt` (une seule longue ligne) |
| `CHRONIQUES_KEYSTORE_PASS` | le mot de passe de `CHRONIQUES_KEYSTORE_PASS.txt` |

Gardez aussi ces fichiers dans un endroit sûr (gestionnaire de mots de passe, clé USB) : sans eux, impossible de publier une version que les serveurs et les téléphones accepteront.

### 4. Créer le jeton de lecture pour votre serveur
Le dépôt étant privé, votre serveur a besoin d’un jeton pour lire les versions :
github.com → photo de profil → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token** :
- *Repository access* : **Only select repositories** → `chroniques` ;
- *Permissions → Repository permissions → Contents* : **Read-only** ;
- durée : 1 an (GitHub vous préviendra avant l’expiration).

Copiez le jeton (`github_pat_…`). Il se colle dans Chroniques, à l’étape suivante.

### 5. Première installation
Quand Claude a publié la première version automatique, téléchargez son ZIP dans l’onglet *Releases* du dépôt, puis Chroniques → **Paramètres → Mettre à jour Chroniques → envoyer le ZIP → Installer et redémarrer**.
Ensuite, dans le même panneau, collez le jeton dans **« Jeton GitHub en lecture »** → *Enregistrer*. C’est terminé : les versions suivantes arriveront seules.

## Si un autre MJ utilise Chroniques
Il a besoin de son propre jeton (créé par vous avec le même réglage « lecture seule »), à coller dans son Chroniques. Vous pouvez le révoquer à tout moment.

## En cas de problème
- **La publication échoue** : onglet *Actions* du dépôt → la ligne rouge → l’étape en erreur indique la cause (secret manquant, test en échec…). Dites-le à Claude.
- **Le serveur ne voit pas la version** : Paramètres → Mettre à jour → « Vérifier maintenant » affiche le message d’erreur (jeton expiré, pas d’accès Internet…).
- **Publier sans GitHub** reste possible : `node scripts/dev/package.js dist` (ZIP), `node scripts/dev/build-android.js` (APK), puis envoi du ZIP dans Paramètres.

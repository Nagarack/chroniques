# Héberger Chroniques sur un serveur

Le site, l’application Android et l’écran de table sont servis par le même programme (`server.js`). Héberger Chroniques ailleurs, c’est faire tourner ce programme sur une autre machine (PC toujours allumé, mini-PC, serveur loué) et lui donner une adresse HTTPS.

**Principe :** Chroniques écoute en HTTP sur `127.0.0.1:8080`, invisible depuis Internet. Un intermédiaire installé sur la **même machine** s’occupe du HTTPS :

| Intermédiaire | Pour qui | Réglage Chroniques |
|---|---|---|
| **Tunnel Cloudflare** (`cloudflared`) | aucun port à ouvrir, fonctionne derrière une box | `CHRONIQUES_PROXY=cloudflare` (par défaut quand une adresse HTTPS est configurée) |
| **Caddy** (le plus simple) ou **nginx** | serveur loué (VPS) avec votre nom de domaine | `CHRONIQUES_PROXY=standard` |

Le réglage `CHRONIQUES_PROXY` indique où lire l’adresse réelle des visiteurs, qui sert à limiter les essais de mot de passe. Chroniques ne croit ces en-têtes que pour les connexions venant de la machine elle-même : un visiteur ne peut pas s’inventer une adresse.

Prérequis : **Node.js 20 ou plus récent** (`node -v`) et, sous Linux, `unzip` (mises à jour depuis l’application).

---

## 1. Installer Chroniques

1. Téléchargez le ZIP de la dernière version (page *Releases* du dépôt GitHub).
2. Décompressez-le dans un **dossier vide**, par exemple `/opt/chroniques` sous Linux.

## 2. Récupérer les données de l’ancienne installation

**Arrêtez l’ancien serveur d’abord**, sinon les deux bases divergent. Copiez ensuite le dossier de l’ancienne installation sur la nouvelle machine (clé USB, `scp`, `rsync`…), puis :

```
node scripts/migrate-data.js /chemin/vers/ancien/dossier
```

Le script copie les comptes et campagnes (`data/chroniques-db.json`), les connexions en cours, les images et sons (`data/media/`), les signalements et les réglages de mise à jour (`config/update-source.json`). Il refuse de remplacer une base existante. Ajoutez `--sans-adresse` si le domaine change : l’ancienne adresse HTTPS n’est alors pas reprise. Sous Windows, `MIGRER_DONNEES.bat` fait la même chose.

**Nouvelle installation sans données :** le compte MJ se crée en mode local, avant de configurer l’adresse HTTPS. Sur un serveur distant, ouvrez un tunnel SSH depuis votre PC (`ssh -L 8080:127.0.0.1:8080 vous@serveur`), lancez Chroniques sur le serveur, puis ouvrez `http://localhost:8080` sur votre PC. La clé de première configuration s’affiche dans les messages du serveur (`journalctl -u chroniques` avec le service ci-dessous).

## 3. Indiquer l’adresse HTTPS

```
node scripts/set-remote-origin.js https://jeu.mondomaine.fr
```

Ou bien, sans fichier : variable d’environnement `CHRONIQUES_PUBLIC_ORIGIN=https://jeu.mondomaine.fr`. Chroniques refuse alors toute requête qui n’arrive pas par cette adresse.

## 4. Mettre le HTTPS devant Chroniques

### Option A — Tunnel Cloudflare
Dans Cloudflare, créez un tunnel vers `http://127.0.0.1:8080` avec votre nom de domaine, et installez `cloudflared` sur la machine de Chroniques. Aucun autre réglage (`PROTEGER_CLOUDFLARE_ACCESS.bat` aide à restreindre l’accès sous Windows).

### Option B — Caddy ou nginx sur un serveur loué
1. Chez votre fournisseur de domaine, faites pointer `jeu.mondomaine.fr` vers l’adresse IP du serveur (enregistrement A, et AAAA pour l’IPv6).
2. Ouvrez seulement les ports 80 et 443 dans le pare-feu (jamais le 8080).
3. Copiez le modèle :
   - **Caddy** : `hebergement/Caddyfile` → `/etc/caddy/Caddyfile` (certificat HTTPS automatique) ;
   - **nginx** : `hebergement/nginx-chroniques.conf` → `/etc/nginx/sites-available/chroniques`, puis certificat avec `certbot --nginx`.
4. Dans le modèle, remplacez `jeu.mondomaine.fr` par votre domaine, puis rechargez Caddy ou nginx.

Chroniques compresse lui-même ses fichiers (brotli ou gzip) : rien à activer de ce côté dans nginx ou Caddy.

Ce qui compte dans les modèles : le domaine demandé (`Host`) est transmis tel quel, l’adresse du visiteur aussi (`X-Forwarded-For`), le flux en direct `/api/events` n’est pas retenu (`proxy_buffering off` pour nginx) et les envois jusqu’à 50 Mo passent.

## 5. Démarrer Chroniques comme un service

Lancez toujours **`node scripts/launcher.js`** (et non `server.js`) : le lanceur installe les mises à jour faites depuis l’application et relance le serveur.

Sous Linux, le modèle `hebergement/chroniques.service` le fait démarrer avec la machine et redémarrer en cas d’arrêt. Les commandes d’installation sont en tête du fichier. Pensez à y mettre `CHRONIQUES_PROXY=cloudflare` si vous utilisez un tunnel.

Au démarrage, le message indique l’intermédiaire reconnu, par exemple : `HTTPS public : https://jeu.mondomaine.fr/ via proxy standard (Caddy, nginx…)`.

## 6. Côté joueurs

- **Android** : Paramètres → « Changer de serveur », puis la nouvelle adresse.
- **Navigateur, iPhone, tablette, TV** : ouvrir la nouvelle adresse. Une icône installée sur l’écran d’accueil reste liée à l’ancienne adresse : supprimez-la et réinstallez-la.
- Les comptes et mots de passe sont conservés. Les **clés d’accès** (connexion sans mot de passe) sont liées au nom de domaine : si le domaine change, chacun se connecte avec son mot de passe, puis recrée sa clé.

## Entretien

- **Administration** : le compte créé à l’installation est l’administrateur du serveur. Il lit les suggestions d’amélioration de tous les comptes dans « Administration » (menu Bibliothèque & réglages). Le transfert des données le conserve. Dans l’onglet Serveur, il peut aussi créer un lien de nouveau mot de passe pour un compte, fermer ses connexions ou le suspendre, lancer une sauvegarde complète et relire l’historique de ces gestes.

- **Sauvegarde** : Chroniques fait seul une sauvegarde complète par jour (base et images) dans `backups/`, et garde les 10 dernières copies de la base dans `data/auto-backups/`. `node scripts/backup.js` en fait une à la demande. Copiez régulièrement `backups/` sur une autre machine (ou réglez la copie miroir dans Paramètres).
- **Mot de passe MJ oublié** : arrêtez le service, puis `node scripts/reset-password.js "Nom du compte"`.
- **Revenir en mode local** : `node scripts/set-remote-origin.js --off` (et coupez la route publique).

## Réglages (variables d’environnement)

| Variable | Rôle | Par défaut |
|---|---|---|
| `HOST` | adresse d’écoute | `127.0.0.1` (à garder avec un intermédiaire) |
| `PORT` | port d’écoute | `8080` |
| `CHRONIQUES_PUBLIC_ORIGIN` | adresse HTTPS publique | contenu de `config/remote-origin.txt` |
| `CHRONIQUES_PROXY` | `cloudflare`, `standard` ou `none` | `cloudflare` avec une adresse HTTPS, sinon `none` |
| `CHRONIQUES_SETUP_KEY` | clé de première configuration fixe | tirée au hasard à chaque démarrage |
| `CHRONIQUES_PUSH_CONTACT` | contact des notifications (rappels de séance) | — |

**Ne copiez jamais** les dossiers `data/`, `config/` ou `backups/` dans un dépôt public : ils contiennent les comptes et les réglages privés.

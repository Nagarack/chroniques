# Hosting Chroniques on a server

The website, the Android app and the table screen are all served by the same program (`server.js`). Hosting Chroniques elsewhere means running that program on another machine (an always-on PC, a mini PC, a rented server) and giving it an HTTPS address.

**How it works:** Chroniques listens over HTTP on `127.0.0.1:8080`, unreachable from the Internet. A front end installed on the **same machine** provides HTTPS:

| Front end | For | Chroniques setting |
|---|---|---|
| **Cloudflare Tunnel** (`cloudflared`) | no port to open, works behind a home router | `CHRONIQUES_PROXY=cloudflare` (default once an HTTPS address is set) |
| **Caddy** (simplest) or **nginx** | rented server (VPS) with your own domain | `CHRONIQUES_PROXY=standard` |

`CHRONIQUES_PROXY` tells Chroniques where to read each visitor’s real address, which is used to limit password attempts. Those headers are only trusted for connections coming from the machine itself, so a visitor cannot fake an address.

Requirements: **Node.js 20 or newer** (`node -v`) and, on Linux, `unzip` (in-app updates).

## 1. Install Chroniques
Download the latest release ZIP (GitHub *Releases* page) and unzip it into an **empty folder**, e.g. `/opt/chroniques` on Linux.

## 2. Bring over your data
**Stop the old server first.** Copy the old installation folder to the new machine, then run:

```
node scripts/migrate-data.js /path/to/old/folder
```

It copies accounts and campaigns (`data/chroniques-db.json`), open sessions, images and sounds (`data/media/`), reports and update settings (`config/update-source.json`), and never overwrites an existing database. Add `--sans-adresse` when the domain changes so the old HTTPS address is not carried over. On Windows, `MIGRER_DONNEES.bat` does the same.

**Fresh install with no data:** the GM account is created in local mode, before setting the HTTPS address. On a remote server, open an SSH tunnel from your PC (`ssh -L 8080:127.0.0.1:8080 you@server`), start Chroniques on the server, then open `http://localhost:8080` on your PC. The first-setup key is printed in the server messages (`journalctl -u chroniques` with the service below).

## 3. Set the HTTPS address
```
node scripts/set-remote-origin.js https://game.mydomain.com
```
or use the environment variable `CHRONIQUES_PUBLIC_ORIGIN=https://game.mydomain.com`. Chroniques then rejects any request that does not come through that address.

## 4. Put HTTPS in front of Chroniques
**Option A — Cloudflare Tunnel:** create a tunnel to `http://127.0.0.1:8080` with your domain and install `cloudflared` on the Chroniques machine.

**Option B — Caddy or nginx on a rented server:**
1. Point `game.mydomain.com` at the server’s IP address (A record, plus AAAA for IPv6).
2. Open only ports 80 and 443 in the firewall (never 8080).
3. Copy the template: **Caddy** `hebergement/Caddyfile` → `/etc/caddy/Caddyfile` (automatic HTTPS certificate); **nginx** `hebergement/nginx-chroniques.conf` → `/etc/nginx/sites-available/chroniques`, then get a certificate with `certbot --nginx`.
4. Replace `jeu.mondomaine.fr` with your domain in the template and reload Caddy or nginx.

Chroniques compresses its own files (brotli or gzip): nothing to turn on for that in nginx or Caddy.

The templates pass the requested domain (`Host`) and the visitor’s address (`X-Forwarded-For`), never hold back the live stream `/api/events`, and accept uploads up to 50 MB.

## 5. Run Chroniques as a service
Always start **`node scripts/launcher.js`** (not `server.js`): the launcher installs updates started from the app and restarts the server. On Linux, `hebergement/chroniques.service` starts it at boot and restarts it if it stops; the install commands are at the top of the file. Set `CHRONIQUES_PROXY=cloudflare` there if you use a tunnel.

## 6. Players
- **Android:** Settings → “Change server”, then the new address.
- **Browser, iPhone, tablet, TV:** open the new address. A home-screen icon stays tied to the old address: remove it and add it again.
- Accounts and passwords are kept. **Passkeys** are tied to the domain name: if it changes, everyone signs in with their password and creates a new passkey.

## Maintenance
- **Administration:** the account created at installation is the server administrator. It reads everyone’s improvement suggestions in “Administration” (Library & settings menu). Moving the data keeps it. In the Server tab it can also create a new password link for an account, sign it out everywhere or suspend it, start a full backup and review the history of these actions.
- **Backups:** Chroniques makes a full daily backup (database and images) in `backups/` and keeps the last 10 database copies in `data/auto-backups/`. `node scripts/backup.js` makes one on demand. Copy `backups/` to another machine regularly (or set up the mirror copy in Settings).
- **Forgotten GM password:** stop the service, then `node scripts/reset-password.js "Account name"`.
- **Back to local mode:** `node scripts/set-remote-origin.js --off` (and turn off the public route).

## Settings (environment variables)
| Variable | Purpose | Default |
|---|---|---|
| `HOST` | listening address | `127.0.0.1` (keep it with a front end) |
| `PORT` | listening port | `8080` |
| `CHRONIQUES_PUBLIC_ORIGIN` | public HTTPS address | contents of `config/remote-origin.txt` |
| `CHRONIQUES_PROXY` | `cloudflare`, `standard` or `none` | `cloudflare` with an HTTPS address, otherwise `none` |
| `CHRONIQUES_SETUP_KEY` | fixed first-setup key | random at each start |
| `CHRONIQUES_PUSH_CONTACT` | contact for notifications (session reminders) | — |

**Never** put the `data/`, `config/` or `backups/` folders in a public repository: they hold the accounts and private settings.

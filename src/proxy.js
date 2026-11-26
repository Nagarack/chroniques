'use strict';
/* Chroniques — proxy devant le serveur (5.7). Chroniques écoute en HTTP sur 127.0.0.1 ; le HTTPS est assuré soit par
   un tunnel Cloudflare, soit par un serveur web (Caddy, nginx…) installé sur la même machine.
   L’adresse réelle du visiteur sert à limiter les essais de mot de passe : elle n’est lue dans les en-têtes que si la
   connexion vient de la machine elle-même, et seulement dans l’en-tête du proxy choisi. */
const MODES=['cloudflare','standard','none'];
function mode(value,publicOrigin){const v=String(value??'').trim().toLowerCase();if(!v)return publicOrigin?'cloudflare':'none';
 if(!MODES.includes(v))throw new Error('CHRONIQUES_PROXY : « '+value+' » inconnu. Valeurs possibles : cloudflare, standard (Caddy, nginx…) ou none.');return v;}
const IP=/^[a-fA-F0-9:.]{2,45}$/;
const clean=v=>{const t=String(v??'').trim();return IP.test(t)?t:'';};
function isLoopback(addr){const a=String(addr||'');return a==='::1'||/^127\./.test(a)||/^::ffff:127\./.test(a);}
function clientIp(req,m){const peer=req?.socket?.remoteAddress||'';if(m==='none'||!isLoopback(peer))return peer;const h=req.headers||{};
 if(m==='cloudflare')return clean(h['cf-connecting-ip'])||peer;
 // Caddy remplace X-Forwarded-For, nginx y ajoute l’adresse du visiteur : la dernière valeur est celle vue par le proxy.
 const list=String(h['x-forwarded-for']||'').split(',').map(x=>x.trim()).filter(Boolean);return clean(list.at(-1))||peer;}
function label(m){return m==='cloudflare'?'tunnel Cloudflare':m==='standard'?'proxy standard (Caddy, nginx…)':'aucun proxy';}
module.exports={MODES,mode,clientIp,isLoopback,label};

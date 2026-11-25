'use strict';
/** A remotely-managed Cloudflare Tunnel maps a known HTTPS hostname to HTTP loopback. */
const fs=require('node:fs');
const path=require('node:path');
function validateRemoteOrigin(value){
 if(value==null||value==='')return null;
 if(typeof value!=='string'||value!==value.trim())throw new Error('Adresse HTTPS invalide.');
 let parsed;
 try{parsed=new URL(value);}catch{throw new Error('Adresse HTTPS invalide.');}
 if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.port||parsed.pathname!=='/'||parsed.search||parsed.hash)throw new Error('Entrez uniquement https://app.votredomaine.fr (sans port ni chemin).');
 const host=parsed.hostname;
 if(host.length>253||!host.includes('.')||!host.split('.').every(part=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(part))||!/^[a-z]{2,63}$/.test(host.split('.').at(-1))||host.endsWith('.ts.net')||host.endsWith('.trycloudflare.com')||host==='localhost')throw new Error('Un domaine public permanent est requis (pas une URL Tailscale ou temporaire).');
 return parsed.origin;
}
function getRemoteOrigin(opts={},root=path.resolve(__dirname,'..')){
 if(Object.hasOwn(opts,'publicOrigin'))return validateRemoteOrigin(opts.publicOrigin);
 if(process.env.CHRONIQUES_PUBLIC_ORIGIN)return validateRemoteOrigin(process.env.CHRONIQUES_PUBLIC_ORIGIN);
 const file=path.join(root,'config','remote-origin.txt');
 return fs.existsSync(file)?validateRemoteOrigin(fs.readFileSync(file,'utf8').trim()):null;
}
module.exports={getRemoteOrigin,validateRemoteOrigin};

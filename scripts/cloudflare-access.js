'use strict';
/** A cautious CLI for protecting an EXISTING Cloudflare Tunnel hostname with Access.
 * Default is preview-only. The module NEVER handles tunnel tokens or stores API credentials.
 * Network changes require --apply and an interactive Windows-script confirmation.
 */
const fs=require('node:fs');
const path=require('node:path');
const {validateRemoteOrigin}=require('../src/network-config');
const apiBase='https://api.cloudflare.com/client/v4';
function cleanEmails(s){
 const values=Array.isArray(s)?s:String(s||'').split(/[,;\n\r]+/);
 const emails=[...new Set(values.map(x=>String(x).trim().toLowerCase()).filter(Boolean))];
 if(!emails.length||emails.length>35||emails.some(x=>x.length>254||!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(x)))throw new Error('Indiquez 1 à 35 adresses e-mail valides, séparées par des virgules.');
 return emails;
}
function buildConfig({accountId, origin, emails}){
 if(!/^[0-9a-f]{32}$/i.test(String(accountId||'')))throw new Error('Account ID Cloudflare invalide (32 caractères hexadécimaux).');
 const publicOrigin=validateRemoteOrigin(origin);
 if(!publicOrigin)throw new Error('L’URL HTTPS doit avoir été configurée dans Chroniques.');
 const addr=cleanEmails(emails);
 return {accountId:String(accountId).toLowerCase(),hostname:new URL(publicOrigin).hostname, emails:addr};
}
function applicationPayload(config){return {
 name:'Chroniques — accès privé', type:'self_hosted', session_duration:'12h',
 destinations:[{type:'public',uri:config.hostname}],
 policies:[{name:'Joueurs Chroniques — e-mails autorisés', decision:'allow', precedence:1,
   include:config.emails.map(email=>({email:{email}}))}]
};}
function appHosts(app){return [app.domain,...(app.destinations||[]).map(x=>x.uri),...(app.self_hosted_domains||[])].filter(Boolean).map(x=>String(x).replace(/^https?:\/\//,'').replace(/\/.*$/,''));}
async function requestApi(pathname,token,init={},transport=globalThis.fetch){
 const response=await transport(apiBase+pathname,{...init,headers:{Authorization:`Bearer ${token}`,'content-type':'application/json',...(init.headers||{})},signal:AbortSignal.timeout(16000)});
 const data=await response.json().catch(()=>null);
 if(!response.ok||!data?.success)throw new Error('Cloudflare API : '+(data?.errors||[]).map(e=>e.message).join(' ; ').slice(0,300)+` (HTTP ${response.status})`);
 return data.result;
}
async function protect(config,token,transport=globalThis.fetch){
 if(!token||token.length<15)throw new Error('Jeton API manquant ou invalide.');
 const apps=await requestApi(`/accounts/${config.accountId}/access/apps?per_page=100`,token,{},transport);
 if(!Array.isArray(apps))throw new Error('Réponse API inattendue : applications non listées.');
 if(apps.some(app=>appHosts(app).includes(config.hostname)))throw new Error('Une application Access protège déjà ce domaine : aucune modification effectuée. Vérifiez sa règle dans Cloudflare.');
 const app=await requestApi(`/accounts/${config.accountId}/access/apps`,token,
   {method:'POST',body:JSON.stringify(applicationPayload(config))},transport);
 if(!app?.id)throw new Error('Cloudflare n’a pas confirmé l’identifiant de l’application créée. Vérifiez manuellement.');
 const check=await requestApi(`/accounts/${config.accountId}/access/apps/${app.id}`,token,{},transport);
 if(!appHosts(check).includes(config.hostname))throw new Error('Application créée, mais domaine non confirmé : vérifiez Access avant de partager le site.');
 return {id:app.id,hostname:config.hostname,verified:true};
}
function configuredOrigin(root){const f=path.join(root,'config','remote-origin.txt');if(!fs.existsSync(f))throw new Error('Configurez d’abord l’URL HTTPS dans Chroniques.');return fs.readFileSync(f,'utf8').trim();}
async function main(env=process.env,args=process.argv.slice(2),io=console){
 const root=path.resolve(__dirname,'..');const mode=args.includes('--apply')?'apply':'preview';
 const config=buildConfig({accountId:env.CF_ACCOUNT_ID,origin:configuredOrigin(root),emails:env.CF_ALLOWED_EMAILS});
 io.log(`\nChroniques — Cloudflare Access (${mode==='apply'?'APPLICATION':'APERCU SANS MODIFICATION'})`);
 io.log('Domaine : '+config.hostname);io.log('Adresses autorisées : '+config.emails.join(', '));
 io.log('Règle : Allow sur ces adresses uniquement. Durée de session : 12 h.');
 io.log('IMPORTANT : activer One-time PIN dans Cloudflare et vérifier une connexion en navigation privée.');
 if(mode!=='apply'){io.log('Aucune modification Cloudflare. Pour appliquer : exécuter l’assistant Windows et confirmer.');return;}
 const result=await protect(config,env.CF_API_TOKEN);
 io.log('Application Access créée et domaine vérifié : '+result.hostname);
 io.log('VÉRIFICATION MANUELLE OBLIGATOIRE : contrôler la règle dans Zero Trust et le challenge en navigation privée.');
}
if(require.main===module){main().catch(e=>{console.error('ERREUR : '+e.message);process.exitCode=1;});}
module.exports={cleanEmails,buildConfig,applicationPayload,appHosts,protect,requestApi,main};

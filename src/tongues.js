/* Chroniques — langues et messages en langue (5.5). Chaque personnage note les langues qu’il parle ; le MJ peut écrire
   un message dans une langue : seuls les personnages qui la parlent le lisent, les autres ne voient que des signes.
   Le texte n’est jamais envoyé aux joueurs qui ne parlent pas la langue (le brouillage est fait par le serveur). */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesTongues=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const STANDARD=['Commun','Elfique','Géant','Gnome','Gobelin','Halfelin','Nain','Orc'];
const EXOTIC=['Abyssal','Céleste','Commun des profondeurs','Draconique','Infernal','Primordial','Profond','Sylvestre'];
const MAX_LANG=20,MAX_MSG=30;
function fail(m){const e=new Error(m);e.status=400;throw e;}
const norm=t=>String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
function cleanName(t){const v=String(t??'').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim();if(!v)fail('Nom de langue vide.');if(v.length>30)fail('Langue : 30 caractères maximum.');return v;}
function setLanguages(pc,list){if(!Array.isArray(list))fail('Liste de langues invalide.');const out=[];for(const x of list){const v=cleanName(x);if(!out.some(y=>norm(y)===norm(v)))out.push(v);}if(out.length>MAX_LANG)fail(MAX_LANG+' langues au maximum.');pc.languages=out;return out;}
function speaks(pc,lang){return (pc&&Array.isArray(pc.languages)?pc.languages:[]).some(x=>norm(x)===norm(lang));}
function send(s,id,v){const language=cleanName(v?.language);const text=String(v?.text??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();if(!text)fail('Message vide.');if(text.length>600)fail('Message : 600 caractères maximum.');
 const title=String(v?.title??'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,80);if(!Array.isArray(s.tongueMessages))s.tongueMessages=[];const m={id,language,title,text,at:new Date().toISOString()};s.tongueMessages.unshift(m);s.tongueMessages=s.tongueMessages.slice(0,MAX_MSG);return m;}
function remove(s,id){const i=(s.tongueMessages||[]).findIndex(x=>x.id===id);if(i<0)fail('Message introuvable.');s.tongueMessages.splice(i,1);}
// Signes de remplacement, différents selon la langue, de même longueur que le texte (sans rien révéler du contenu).
const GLYPHS=['ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ','αβγδεζηθικλμνξπρστυφχψωϑϕϖ','бгджзийлпфцчшщъыьэюяѣѳѵ','◇◆○●◐◑◒◓△▲▽▼□■◁▷◈◉◊⬡⬢','∂∆∇∑∫≈≠≡⊂⊃⊕⊗⊙⊥∠∴∵∞∝']; // Jeux de signes courants des polices système.
function hash(t){let h=2166136261;for(const c of String(t))h=Math.imul(h^c.codePointAt(0),16777619)>>>0;return h;}
function garble(m){const set=[...GLYPHS[hash(norm(m.language))%GLYPHS.length]];let h=hash(m.id);let out='';for(const c of m.text){if(/\s/.test(c)){out+=c;continue;}if(/[.,;:!?…«»"'’()-]/.test(c)){out+=c;continue;}h=Math.imul(h^0x5bd1e995,1103515245)+12345>>>0;out+=set[h%set.length];}return out;}
// Vue d’un joueur : texte clair si un de ses personnages parle la langue, sinon des signes.
function projected(s,pcs){return (s.tongueMessages||[]).map(m=>{const ok=(pcs||[]).some(p=>speaks(p,m.language));return {id:m.id,language:m.language,title:m.title,at:m.at,readable:ok,text:ok?m.text:garble(m)};});}
return {STANDARD,EXOTIC,MAX_LANG,setLanguages,speaks,send,remove,garble,projected};
});

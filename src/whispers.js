/* Chroniques — chuchotements : messages privés entre le MJ et un personnage joueur.
   Chaque fil est rattaché à un personnage ; un joueur ne reçoit que le sien, les autres joueurs n'en voient rien. */
'use strict';
const MAX_PER_THREAD=120,MAX_TEXT=600;
function fail(m,status=400){const e=new Error(m);e.status=status;throw e;}
function list(s){if(!Array.isArray(s.whispers))s.whispers=[];return s.whispers;}
function clean(v){const t=String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();if(!t)fail('Message vide.');if(t.length>MAX_TEXT)fail('Message : '+MAX_TEXT+' caractères maximum.');return t;}
// from : 'mj' ou l'identifiant du personnage qui écrit. charId : le fil concerné.
function send(s,id,charId,from,text){if(!(s.characters||[]).some(p=>p.id===charId))fail('Personnage introuvable.');const w={id,charId,from:from==='mj'?'mj':charId,text:clean(text),at:new Date().toISOString(),read:false};
 const arr=list(s);arr.push(w);const mine=arr.filter(x=>x.charId===charId);if(mine.length>MAX_PER_THREAD){const drop=new Set(mine.slice(0,mine.length-MAX_PER_THREAD).map(x=>x.id));s.whispers=arr.filter(x=>!drop.has(x.id));}return w;}
// Marque comme lus les messages reçus par le lecteur dans ce fil.
function markRead(s,charId,reader){let n=0;for(const w of list(s))if(w.charId===charId&&!w.read&&(reader==='mj'?w.from!=='mj':w.from==='mj')){w.read=true;n++;}return n;}
function clearThread(s,charId){s.whispers=list(s).filter(w=>w.charId!==charId);}
function removeCharacter(s,charId){if(Array.isArray(s.whispers))s.whispers=s.whispers.filter(w=>w.charId!==charId);}
function projected(s,u){return (Array.isArray(s.whispers)?s.whispers:[]).filter(w=>u&&u.characterId&&w.charId===u.characterId).map(w=>({...w}));}
function unread(whispers,reader,charId){return (whispers||[]).filter(w=>!w.read&&(reader==='mj'?w.from!=='mj'&&(!charId||w.charId===charId):w.from==='mj'&&w.charId===reader)).length;}
module.exports={MAX_PER_THREAD,MAX_TEXT,list,send,markRead,clearThread,removeCharacter,projected,unread};

/* Chroniques — relevé des PV des personnages à chaque round du dernier combat (5.20), pour le graphique du bilan.
   Seuls les personnages joueurs sont relevés (leurs PV sont déjà connus de toute la table) ; jamais les créatures du MJ. */
'use strict';
const MAX_ROUNDS=40;
const snap=(s)=>{const hp={};for(const p of s.characters||[])hp[p.id]=Math.max(0,Number(p.hp)||0);return {round:Number(s.combat?.round)||1,hp};};
function observe(prev,next){const c=next?.combat;if(!c)return;const startedNow=!!c.started&&!prev?.combat?.started;
 if(startedNow){next.combatChart={at:new Date().toISOString(),names:Object.fromEntries((next.characters||[]).map(p=>[p.id,p.name])),max:Object.fromEntries((next.characters||[]).map(p=>[p.id,Number(p.stats?.hp)||Number(p.hpMax)||0])),rounds:[snap(next)]};return;}
 const ch=next.combatChart;if(!c.started||!ch||!Array.isArray(ch.rounds))return;const cur=snap(next);const last=ch.rounds[ch.rounds.length-1];
 if(cur.round!==last.round){if(ch.rounds.length<MAX_ROUNDS)ch.rounds.push(cur);}else last.hp=cur.hp;   // dans un même round, on garde l’état le plus récent
}
module.exports={observe,MAX_ROUNDS};

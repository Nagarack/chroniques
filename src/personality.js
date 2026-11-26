/* Chroniques — personnalité du personnage (5.10) : traits, idéaux, liens et défauts (SRD 5.1, « Personnalité et
   historique »), gardés pour le joueur et le MJ sauf s’il choisit de les partager ; et liens avec les autres
   personnages du groupe (« doit la vie à Brunna »), visibles de toute la table. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesPersonality=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const FIELDS={traits:'Traits de personnalité',ideals:'Idéaux',bonds:'Liens',flaws:'Défauts'};
const HINTS={traits:'Ex. Je cite un proverbe pour chaque situation.',ideals:'Ex. La liberté : personne ne devrait vivre enchaîné.',bonds:'Ex. Je protège le temple où j’ai grandi.',flaws:'Ex. Je ne résiste jamais à un pari.'};
const MAX_TIES=12;
function fail(m){const e=new Error(m);e.status=400;throw e;}
const clean=(v,label,max)=>{const t=String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();if(t.length>max)fail(label+' : '+max+' caractères maximum.');return t;};
function set(pc,v){if(!pc)fail('Personnage introuvable.');const out={};for(const [k,label] of Object.entries(FIELDS))out[k]=clean(v?.[k],label,500);out.shared=v?.shared===true;
 if(!Object.keys(FIELDS).some(k=>out[k])){delete pc.personality;return null;}pc.personality=out;return out;}
// Lien vers un autre personnage du groupe ; un texte vide le retire.
function tie(state,pc,toId,text){if(!pc)fail('Personnage introuvable.');if(toId===pc.id)fail('Choisissez un autre personnage.');const other=(state.characters||[]).find(p=>p.id===toId);if(!other)fail('Personnage introuvable.');
 const t=clean(text,'Lien',160);pc.ties=(pc.ties||[]).filter(x=>x.to!==toId);if(t){if(pc.ties.length>=MAX_TIES)fail('Maximum '+MAX_TIES+' liens.');pc.ties.push({to:toId,text:t});}if(!pc.ties.length)delete pc.ties;return t||null;}
// Retire les liens vers un personnage disparu.
function prune(state){const ids=new Set((state.characters||[]).map(p=>p.id));for(const p of state.characters||[])if(p.ties){p.ties=p.ties.filter(t=>ids.has(t.to));if(!p.ties.length)delete p.ties;}}
return {FIELDS,HINTS,MAX_TIES,set,tie,prune};
});

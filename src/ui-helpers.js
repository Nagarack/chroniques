/* Chroniques — aides d'interface pures (sans état, sans DOM), testables séparément.
   Extraites de online-app.js en V4 : textes de règles, découpage des actions de monstres, regroupement d'initiative, jetons. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesUiHelpers=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const CONDITION_HELP={
 'Aveuglé':'Ne voit rien et échoue aux tests qui demandent la vue. Attaques contre lui avec avantage ; ses attaques avec désavantage.',
 'Charmé':'Ne peut pas attaquer celui qui l’a charmé ni le viser avec un effet nuisible ; ce dernier a l’avantage pour interagir socialement avec lui.',
 'Effrayé':'Désavantage aux tests de caractéristique et aux attaques tant que la source de sa peur est en vue ; ne peut pas s’en approcher volontairement.',
 'Empoisonné':'Désavantage aux jets d’attaque et aux tests de caractéristique.',
 'Entravé':'Vitesse 0. Attaques contre lui avec avantage, ses attaques avec désavantage, désavantage aux sauvegardes de Dextérité.',
 'Agrippé':'Vitesse 0 tant que la prise dure. Se libérer demande une action (test ou sauvegarde selon l’édition).',
 'À terre':'Ne peut que ramper ou se relever (moitié du déplacement). Ses attaques avec désavantage ; au corps à corps, les attaques contre lui ont l’avantage, à distance le désavantage.',
 'Incapable d’agir':'Ne peut faire ni action, ni action bonus, ni réaction.',
 'Étourdi':'Incapable d’agir. Échoue aux sauvegardes de Force et de Dextérité ; attaques contre lui avec avantage.',
 'Paralysé':'Incapable d’agir, ne bouge ni ne parle. Échoue aux sauvegardes de Force et de Dextérité ; une attaque qui le touche à 1,5 m est un coup critique.',
 'Inconscient':'Incapable d’agir, lâche ce qu’il tient et tombe à terre. Échoue aux sauvegardes de Force et de Dextérité ; coup critique automatique à 1,5 m.',
 'Assourdi':'N’entend rien et échoue aux tests qui demandent l’ouïe.',
 'Invisible':'Ne peut pas être vu sans moyen spécial. Ses attaques avec avantage ; attaques contre lui avec désavantage.',
 'Pétrifié':'Changé en pierre : incapable d’agir, ne bouge ni ne parle. Résistance à tous les dégâts ; échoue aux sauvegardes de Force et de Dextérité.'};
// Découpe « Nom : description. Nom : description. » en actions cliquables (journal MJ, aucun dé lancé).
// Une phrase sans « Nom : » prolonge l'action précédente (textes officiels de plusieurs phrases).
function splitActions(text){const out=[];for(const raw of String(text||'').split(/\.\s+(?=[A-ZÀ-ÖØ-Ý])/)){const x=raw.trim().replace(/\.$/,'');if(!x)continue;const i=x.indexOf(' : ');if(i>0&&i<60)out.push({name:x.slice(0,i),detail:x.slice(i+3)});else if(out.length)out[out.length-1].detail+='. '+x;}return out.slice(0,12);}
function splitLegendary(text){const t=String(text||''),i=t.indexOf(' : ');if(i<0)return [];return t.slice(i+3).split(/\s;\s/).map(x=>x.trim()).filter(Boolean).map(x=>{const c=/\(coûte (\d) actions?\)/i.exec(x);return {name:x.replace(/\s*\(coûte \d actions?\)/i,'').replace(/\s*\(.*$/,'').trim()||x,detail:x,cost:c?Number(c[1]):1};}).slice(0,8);}
function rollHint(detail){const atk=/^([+−-]\d+)/.exec(detail),dc=/(sauvegarde de [A-Za-zéÉ]+ DD \d+)/.exec(detail),dice=(detail.match(/\d+d\d+(?:[+−-]\d+)?(?: [a-zéèêûô]+)?/g)||[]).join(' + ');return [atk?'Attaque : d20'+atk[1].replace('−','-'):'',dc?dc[1].replace(/^s/,'S'):'',dice?'Dégâts : '+dice:''].filter(Boolean).join(' · ');}
const GM_SCREEN=[
 ['Actions pendant son tour',[['Action','Attaquer, lancer un sort, Foncer (vitesse doublée), Se désengager, Esquiver, Aider, Se cacher, Chercher, Utiliser un objet, Se tenir prêt.'],['Action bonus','Seulement si une capacité ou un sort le permet.'],['Réaction','Une par round, se recharge au début de son tour (attaque d’opportunité, sort de réaction…).'],['Déplacement','Fractionnable avant et après l’action. Terrain difficile : 1 m coûte 2 m. Se relever : la moitié de la vitesse.']]],
 ['Abri et visibilité',[['Abri partiel (½)','+2 à la CA et aux sauvegardes de Dextérité.'],['Abri important (¾)','+5 à la CA et aux sauvegardes de Dextérité.'],['Abri total','Ne peut pas être ciblé directement.'],['Cible invisible ou non vue','Désavantage pour l’attaquer ; ses attaques ont l’avantage.']]],
 ['Difficultés (DD)',[['Très facile','5'],['Facile','10'],['Moyenne','15'],['Difficile','20'],['Très difficile','25'],['Quasi impossible','30']]],
 ['Concentration',[['Dégâts subis','Sauvegarde de Constitution, DD 10 ou moitié des dégâts (le plus élevé).'],['Fin automatique','Incapable d’agir, mort, ou nouveau sort de concentration.']]],
 ['À 0 point de vie',[['Jet contre la mort','d20 sans modificateur : 10 ou plus = succès, moins de 10 = échec.'],['1 et 20','1 compte pour deux échecs ; 20 rend 1 PV.'],['Trois succès / trois échecs','Stabilisé / mort. Des dégâts à 0 PV ajoutent un échec (deux si coup critique).'],['Mort instantanée','Si les dégâts restants après 0 PV atteignent le maximum de PV.']]],
 ['Repos',[['Court (1 h)','Dépenser des dés de vie pour récupérer des PV.'],['Long (8 h)','Tous les PV, la moitié des dés de vie, un niveau d’épuisement en moins.']]]];
// Les créatures d'un même groupe consécutives dans l'ordre forment une seule ligne (un seul tour).
function initRows(ordered){const rows=[];ordered.forEach((p,i)=>{const last=rows[rows.length-1];if(p.group&&last&&last.p.group===p.group&&last.i+last.members.length===i)last.members.push(p);else rows.push({p,i,members:[p]});});return rows;}
function groupName(members){const base=members.map(m=>m.name.replace(/\s+\d+$/,''));return base.every(b=>b===base[0])?base[0]:members[0].name;}
function tokenInitials(label){const w=String(label||'?').trim().split(/\s+/);const last=w[w.length-1];if(w.length>1&&/^\d+$/.test(last))return (w[0][0]||'?').toUpperCase()+last;return w.slice(0,2).map(x=>(x[0]||'').toUpperCase()).join('')||'?';}
return {CONDITION_HELP,GM_SCREEN,splitActions,splitLegendary,rollHint,initRows,groupName,tokenInitials};
});

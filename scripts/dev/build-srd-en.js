#!/usr/bin/env node
'use strict';
/**
 * Génère les données SRD 5.1 EN ANGLAIS (interface anglaise de Chroniques, 5.2) à partir des données JSON
 * du projet 5e-database (https://github.com/5e-bits/5e-database, dossier src/2014/en). Lecture de données
 * uniquement : aucun code du projet n'est exécuté.
 *   node scripts/dev/build-srd-en.js <chemin vers 5e-database/src>
 * Contenu : System Reference Document 5.1, Wizards of the Coast, licence CC BY 4.0.
 * Les champs qui servent de clés dans Chroniques (types de dégâts, type de créature, rareté, temps
 * d'incantation…) restent en français : seuls les noms et les textes affichés sont en anglais.
 * Écrit : src/data/srd-spells-index.en.js, srd-regles-en.js, srd-monstres-en.js, srd-monsters.en.js,
 * srd-items.en.js, et i18n/en/90-srd-noms.json (noms français → anglais pour l'affichage).
 */
const fs=require('node:fs'),path=require('node:path');
const SRC=process.argv[2];if(!SRC){console.error('Usage : node scripts/dev/build-srd-en.js <5e-database/src>');process.exit(1);}
const ROOT=path.join(__dirname,'..','..'),OUT=path.join(ROOT,'src','data');
const load=f=>JSON.parse(fs.readFileSync(path.join(SRC,'2014','en',f),'utf8'));
const ATTR='This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.';
const head=`/* GÉNÉRÉ par scripts/dev/build-srd-en.js — ne pas modifier à la main.\n   ${ATTR}\n   Data: 5e-database (MIT) — https://github.com/5e-bits/5e-database */\n`;
const umd=(name,data)=>head+`(function(r){var d=${JSON.stringify(data)};if(typeof module==="object"&&module.exports)module.exports=d;if(r)r.${name}=d;})(typeof globalThis!=="undefined"?globalThis:this);\n`;
const clip=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;
const md=s=>String(s||'').replace(/\*\*\*(.+?)\*\*\*/g,'$1').replace(/\*\*(.+?)\*\*/g,'$1').replace(/(^|\s)\*(\S.*?)\*/g,'$1$2').replace(/_(\S.*?)_/g,'$1');
const names={};// français → anglais
const addName=(fr,en)=>{if(fr&&en&&fr!==en&&!/[{}]/.test(fr))names[fr]=en;};
// ---------- Sorts ----------
const FRIDX=require(path.join(OUT,'srd-spells-index.js'));const FRR=require(path.join(OUT,'srd-regles-fr.js'));
const spells=load('5e-SRD-Spells.json');const byIdx=Object.fromEntries(spells.map(s=>[s.index,s]));
const enIndex=FRIDX.map(r=>{const s=byIdx[r[0]];if(!s)return r;addName(r[1],s.name);const row=r.slice();row[1]=s.name;row[5]=s.range;row[6]=(s.concentration?'Concentration, ':'')+s.duration;row[10]=s.school?.name||r[10];return row;});
const enSpells={};for(const [id,fr] of Object.entries(FRR.spells)){const s=byIdx[id];if(!s){continue;}
 enSpells[id]={name:s.name,level:s.level,school:s.school?.name||'',ritual:!!s.ritual,castTime:s.casting_time,range:s.range,components:(s.components||[]).join(', ')+(s.material?' ('+s.material.replace(/\.$/,'')+')':''),duration:(s.concentration?'Concentration, ':'')+s.duration,
  text:(s.desc||[]).map(md),higher:(s.higher_level||[]).length?s.higher_level.map(md).join(' '):null,classes:fr.classes};}
// ---------- Règles (chapitres aux mêmes identifiants que la version française) ----------
const sections=Object.fromEntries(load('5e-SRD-Rule-Sections.json').map(s=>[s.index,s]));
function splitMd(desc){const out=[];let cur=null;const lines=String(desc||'').split('\n');let para=[];
 const flush=()=>{if(cur&&para.length){const t=para.join(' ').trim();if(t)cur.text.push(md(t));}para=[];};
 for(const raw of lines){const l=raw.replace(/\s+$/,'');const h=/^(#{1,6})\s+(.*)$/.exec(l);
  if(h){flush();cur={title:md(h[2]),level:h[1].length<=2?1:2,text:[]};out.push(cur);continue;}
  if(!cur){cur={title:'',level:1,text:[]};out.push(cur);}
  if(!l.trim()){flush();continue;}
  if(/^\s*[-*]\s+/.test(l)){flush();cur.text.push('• '+md(l.replace(/^\s*[-*]\s+/,'')));continue;}
  if(/^\|/.test(l)){flush();if(/^\|[\s:|-]+\|?$/.test(l))continue;cur.text.push(l.split('|').map(x=>md(x.trim())).filter(Boolean).join(' · '));continue;}
  para.push(l.trim());}
 flush();return out.filter(s=>s.title||s.text.length).map(s=>({...s,title:s.title||'—'}));}
const chap=(id,title,ids)=>({id,title,sections:ids.flatMap(i=>sections[i]?splitMd(sections[i].desc):[])});
const conditions=load('5e-SRD-Conditions.json');
const rules=[
 chap('caracteristiques','Using Ability Scores',['ability-scores-and-modifiers','advantage-and-disadvantage','proficiency-bonus','ability-checks','using-each-ability','saving-throws']),
 chap('aventure','Adventuring',['time','movement','the-environment','resting','between-adventures']),
 chap('combat','Combat',['the-order-of-combat','movement-and-position','actions-in-combat','making-an-attack','cover','damage-and-healing','mounted-combat','underwater-combat']),
 chap('magie','Spellcasting',['what-is-a-spell','casting-a-spell']),
 {id:'etats',title:'Conditions',sections:[{title:'Conditions',level:1,text:['Conditions alter a creature’s capabilities in a variety of ways and can arise as a result of a spell, a class feature, a monster’s attack, or other effect. Most conditions, such as blinded, are impairments, but a few, such as invisible, can be advantageous.']},...conditions.map(c=>({title:c.name,level:2,text:(c.desc||[]).map(x=>md(String(x).replace(/^-\s*/,'• ')))}))]},
 chap('dangers','Traps, Diseases, Madness and Poisons',['traps','diseases','madness','poisons']),
 chap('objets-magiques','Magic Items: General Rules',['attunement','wearing-and-wielding-items','activating-an-item','sentient-magic-items','objects','standard-exchange-rates'])
].filter(c=>c.sections.length);
// ---------- Créatures : blocs de statistiques officiels ----------
const monsters=load('5e-SRD-Monsters.json');const FRM=require(path.join(OUT,'srd-monstres-fr.js'));
const SIZE={Tiny:'Tiny',Small:'Small',Medium:'Medium',Large:'Large',Huge:'Huge',Gargantuan:'Gargantuan'};
const crText=cr=>cr===0.125?'1/8':cr===0.25?'1/4':cr===0.5?'1/2':String(cr);
const speedText=sp=>Object.entries(sp||{}).filter(([k])=>k!=='hover').map(([k,v])=>(k==='walk'?'':k+' ')+v+(k==='fly'&&sp.hover?' (hover)':'')).join(', ');
const blocks={};const MON=[];const FRMON=require(path.join(OUT,'srd-monsters.js'));const frMon=Object.fromEntries(FRMON.map(r=>[r[0],r]));
for(const m of monsters){const fr=FRM[m.index];if(fr&&typeof fr==='object')addName(fr.n,m.name);if(frMon[m.index])addName(frMon[m.index][1],m.name);
 const ac=Array.isArray(m.armor_class)?m.armor_class[0]:{value:m.armor_class};
 const acTxt=ac.value+(ac.armor&&ac.armor.length?' ('+ac.armor.map(a=>a.name.toLowerCase()).join(', ')+')':ac.type&&ac.type!=='dex'?' ('+ac.type+' armor)':'');
 const prof=m.proficiencies||[];const saves=prof.filter(p=>/^Saving Throw:/.test(p.proficiency.name)).map(p=>p.proficiency.name.replace('Saving Throw: ','')+' +'+p.value).join(', ');
 const skills=prof.filter(p=>/^Skill:/.test(p.proficiency.name)).map(p=>p.proficiency.name.replace('Skill: ','')+' +'+p.value).join(', ');
 const senses=Object.entries(m.senses||{}).map(([k,v])=>k==='passive_perception'?'passive Perception '+v:k.replace(/_/g,' ')+' '+v).join(', ');
 const f={ac:acTxt,hp:m.hit_points+' ('+(m.hit_points_roll||m.hit_dice)+')',speed:speedText(m.speed),...(saves?{saves}:{}),...(skills?{skills}:{}),
  ...(m.damage_vulnerabilities?.length?{vuln:m.damage_vulnerabilities.join(', ')}:{}),...(m.damage_resistances?.length?{res:m.damage_resistances.join(', ')}:{}),
  ...(m.damage_immunities?.length?{immDmg:m.damage_immunities.join(', ')}:{}),...((m.condition_immunities||[]).length?{immCond:m.condition_immunities.map(c=>c.name.toLowerCase()).join(', ')}:{}),
  senses,lang:m.languages||'—',cr:crText(m.challenge_rating)+' ('+Number(m.xp||0).toLocaleString('en-US')+' XP)'};
 const pair=a=>[a.name+(a.usage?.type==='recharge on roll'?' (Recharge '+a.usage.min_value+(a.usage.min_value<6?'–6':'')+')':a.usage?.type==='per day'?' ('+a.usage.times+'/Day)':''),md(a.desc||'')];
 blocks[m.index]={n:m.name,m:(SIZE[m.size]||m.size)+' '+m.type+(m.subtype?' ('+m.subtype+')':'')+', '+m.alignment,f,a:[m.strength,m.dexterity,m.constitution,m.intelligence,m.wisdom,m.charisma],
  t:(m.special_abilities||[]).map(pair),ac:(m.actions||[]).map(pair),r:(m.reactions||[]).map(pair),l:(m.legendary_actions||[]).map(pair),
  li:(m.legendary_actions||[]).length?'The '+m.name.toLowerCase()+' can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature’s turn. The '+m.name.toLowerCase()+' regains spent legendary actions at the start of its turn.':''};
 // Liste du bestiaire : mêmes champs que la version française, noms et textes en anglais.
 const r=frMon[m.index];if(r){const row=r.slice();row[1]=m.name;row[2]=m.name;
  const others=Object.entries(m.speed||{}).filter(([k])=>!['walk','hover'].includes(k)).map(([k,v])=>k+' '+v);
  row[10]=clip([others.length?'Speed: '+others.join(', ')+'.':'',...(m.special_abilities||[]).map(a=>a.name+': '+md(a.desc||'').replace(/\s+/g,' '))].filter(Boolean).join(' · '),1200);
  row[11]=clip((m.actions||[]).map(a=>pair(a).join(': ').replace(/\s+/g,' ')).join(' '),1200);
  row[12]=clip((m.legendary_actions||[]).length?'3 legendary actions per round: '+m.legendary_actions.map(a=>a.name).join('; '):'',1200);
  if(row[14]&&Array.isArray(row[14][4]))row[14]=[...row[14].slice(0,4),row[14][4].map(([lv,nm,use])=>[lv,(Object.values(enSpells).find(s=>s.name&&FRR.spells&&Object.entries(FRR.spells).some(([id,x])=>x.name===nm&&enSpells[id]===s))||{}).name||nm,String(use).replace('à volonté','at will').replace('/jour','/day')])];
  row[15]='';MON.push(row);}}
for(const [k,v] of Object.entries(FRM))if(typeof v==='string')blocks[k]=v;
// ---------- Équipement et objets magiques ----------
const FRI=require(path.join(OUT,'srd-items.js'));const eqEn=Object.fromEntries(load('5e-SRD-Equipment.json').map(e=>[e.index,e]));const mgEn=Object.fromEntries(load('5e-SRD-Magic-Items.json').map(e=>[e.index,e]));
const DMGEN=s=>String(s||'').toLowerCase();
const equipment=FRI.equipment.map(r=>{const e=eqEn[r[0]];if(!e)return r;addName(r[1],e.name);const row=r.slice();row[1]=e.name;row[2]=e.name;let desc='';
 if(e.damage)desc=e.damage.damage_dice+' '+DMGEN(e.damage.damage_type?.name)+(e.properties?.length?', '+e.properties.map(p=>p.name.toLowerCase()).join(', '):'')+(e.two_handed_damage?' (two-handed '+e.two_handed_damage.damage_dice+')':'')+(e.range&&e.range.long?', range '+e.range.normal+'/'+e.range.long+' ft.':'');
 if(e.armor_class)desc=(e.armor_category==='Shield'?'Shield: +'+e.armor_class.base+' AC':'AC '+e.armor_class.base+(e.armor_class.dex_bonus?(e.armor_class.max_bonus?' + Dex (max '+e.armor_class.max_bonus+')':' + Dex'):''))+(e.str_minimum?', Strength '+e.str_minimum+' required':'')+(e.stealth_disadvantage?', disadvantage on Stealth':'');
 if(!desc&&e.desc&&e.desc.length)desc=md(e.desc.join(' '));
 row[5]=clip([desc,e.cost?'Cost: '+e.cost.quantity+' '+e.cost.unit:''].filter(Boolean).join('. '),280);return row;});
const magic=FRI.magic.map(r=>{const e=mgEn[r[0]];if(!e)return r;addName(r[1],e.name);const row=r.slice();row[1]=e.name;row[2]=e.name;const body=(e.desc||[]).map(md);
 row[5]=clip(body.join(' ').replace(/\s+/g,' '),280);if(row.length>7)row[7]=clip(body.join('\n'),4000);if(row.length>8)row[8]='';return row;});
// ---------- Écriture ----------
const write=(f,c)=>{fs.writeFileSync(path.join(OUT,f),c);console.log(f,fs.statSync(path.join(OUT,f)).size,'octets');};
write('srd-spells-index.en.js',umd('ChroniquesSRDSpellIndexEn',enIndex));
write('srd-regles-en.js',umd('ChroniquesSRDEn',{lang:'en',attribution:ATTR,spells:enSpells,rules}));
write('srd-monstres-en.js',umd('ChroniquesSRDMonstresEn',blocks));
write('srd-monsters.en.js',umd('ChroniquesSRDMonstersEn',MON));
write('srd-items.en.js',umd('ChroniquesSRDItemsEn',{equipment,magic}));
// Noms français → anglais (sorts, créatures, objets) pour l'affichage des données déjà en français dans la campagne.
const sorted=Object.fromEntries(Object.entries(names).sort((a,b)=>a[0].localeCompare(b[0],'fr')));
fs.writeFileSync(path.join(ROOT,'i18n','en','90-srd-noms.json'),JSON.stringify(sorted,null,0).replace(/","/g,'",\n"'));
console.log('Noms traduits :',Object.keys(sorted).length,'· chapitres :',rules.map(c=>c.id+'('+c.sections.length+')').join(' '));

/* Chroniques V0.4 — règles de suivi, sans dépendances. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ChroniquesLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const CLAMP = (n, min, max) => Math.min(max, Math.max(min, Number.isFinite(+n) ? +n : min));
  const STATES = ['Aveuglé', 'Charmé', 'Effrayé', 'Empoisonné', 'Entravé', 'Agrippé', 'À terre', 'Incapable d’agir', 'Étourdi', 'Paralysé', 'Inconscient', 'Assourdi', 'Invisible', 'Pétrifié'];
  const BLOCKED = ['Incapable d’agir', 'Étourdi', 'Paralysé', 'Inconscient', 'Pétrifié'];
  const IMMOBILE = ['Agrippé', 'Entravé', 'Paralysé', 'Inconscient', 'Étourdi', 'Pétrifié'];
  const CORE_ACTIONS = {
    '2024': ['Attaquer', 'Foncer', 'Se désengager', 'Esquiver', 'Aider', 'Se cacher', 'Influencer', 'Magie', 'Préparer', 'Chercher', 'Étudier', 'Utiliser'],
    '2014': ['Attaquer', 'Lancer un sort', 'Foncer', 'Se désengager', 'Esquiver', 'Aider', 'Se cacher', 'Préparer', 'Chercher', 'Utiliser un objet']
  };
  const clone = x => JSON.parse(JSON.stringify(x));
  const MAX_NAME = 70;

  function char(id, name, role, job, level, stats, speed, owner, abilities, resources, conditions=[], initiative=0) {
    return {id, name, role, job, level, stats, speed, owner, abilities, resources,
      hp:stats.hp, tempHp:0, conditions, initiative, concentration:'', exhaustion:0,
      economy:{action:false,bonus:false,reaction:false,movement:0},
      deathSaves:{success:0,failure:0}, notes:'', privateNotes:''};
  }
  function initialState() {
    const pcs = [
      char('aelin','Aëlin Sylveronce','Elfe','Rôdeuse',3,{hp:28,ac:15,passive:14},9,'aelin',[
        {id:'arrows',name:'Tir à l’arc',type:'action',description:'Attaque à distance — vérifier le modificateur sur la fiche.'},
        {id:'mark',name:'Marque du chasseur',type:'bonus',cost:{resource:'slots1',amount:1},concentration:true,description:'Exemple : emplacement niveau 1 ; les utilisations gratuites éventuelles se gèrent séparément.'}
      ],[{id:'slots1',name:'Emplacements · niveau 1',left:3,max:3,rest:'long'}],[],3),
      char('brunna','Brunna Forgepierre','Naine','Guerrière',4,{hp:39,ac:18,passive:12},7.5,'brunna',[
        {id:'sword',name:'Épée longue',type:'action',description:'Attaque au corps à corps.'},
        {id:'surge',name:'Sursaut d’action',type:'free',cost:{resource:'surge',amount:1},description:'Action supplémentaire selon la capacité de classe ; à appliquer manuellement.',special:'grantAction'},
        {id:'second',name:'Second souffle',type:'bonus',cost:{resource:'second',amount:1},description:'Soins à déterminer par le joueur.'}
      ],[{id:'surge',name:'Sursaut d’action',left:1,max:1,rest:'short'}, {id:'second',name:'Second souffle',left:2,max:2,rest:'short'}],[],1),
      char('elyra','Elyra Clairlune','Humaine','Magicienne',5,{hp:27,ac:13,passive:13},9,'elyra',[
        {id:'ray',name:'Rayon de givre',type:'action',description:'Tour de magie : aucun emplacement.'},
        {id:'shield',name:'Bouclier',type:'reaction',cost:{resource:'slots1',amount:1},description:'Déclencheur nécessaire : être touché par une attaque ou ciblé par Projectile magique.'},
        {id:'misty',name:'Foulée brumeuse',type:'bonus',cost:{resource:'slots2',amount:1},description:'Sort de niveau 2, téléportation.'}
      ],[{id:'slots1',name:'Emplacements · niveau 1',left:4,max:4,rest:'long'},
         {id:'slots2',name:'Emplacements · niveau 2',left:3,max:3,rest:'long'},
         {id:'slots3',name:'Emplacements · niveau 3',left:2,max:2,rest:'long'}],['À terre'],0)
    ];
    pcs[0].hp=24; pcs[1].hp=33; pcs[2].hp=19; pcs[2].concentration='Détection de la magie';
    return {
      schemaVersion:4, migrations:{classPortraits:true}, title:'Les Brumes d’Aubéciel', edition:'2024', customActions:['Attaquer', 'Se cacher', 'Utiliser'],
      characters:pcs, combat:{started:false,round:1,index:0,order:pcs.map(p=>p.id),manualOrder:false,log:[]},
      gmNotes:'Un symbole étrange est gravé sur la porte nord. Les joueurs ne connaissent pas encore sa signification.',
      changeCount:0, lastEdited:new Date().toISOString()
    };
  }
  function findPc(state,id) { return state.characters.find(p=>p.id===id) || null; }
  function actorPc(state, actor) { return actor==='mj' ? null : findPc(state,actor); }
  function canViewDetail(state, actor, id) { const pc=findPc(state,id);return !!pc && (actor==='mj'||pc.owner===actor); }
  function canEdit(state, actor, id) { return canViewDetail(state, actor, id); }
  function requireEdit(state,actor,id){if(!canEdit(state,actor,id))throw new Error('Accès refusé à cette fiche.'); const p=findPc(state,id); if(!p)throw new Error('Personnage introuvable.');return p;}
  function actionSet(edition, customActions) {return edition==='custom' ? [...(customActions||[])] : [...(CORE_ACTIONS[edition]||CORE_ACTIONS['2024'])];}
  function isBlocked(pc) {return pc.hp<=0 || pc.conditions.some(c=>BLOCKED.includes(c));}
  function speedAvailable(pc) {return (pc.hp<=0||pc.conditions.some(c=>IMMOBILE.includes(c)))?0:Math.max(0,pc.speed-pc.economy.movement);}
  function abilityAvailable(pc, ability) {
    const missing=ability.cost&&!(pc.resources.find(r=>r.id===ability.cost.resource)?.left>=ability.cost.amount);
    if(isBlocked(pc))return {allowed:false,reason:'Incapable d’agir'};
    if(missing)return {allowed:false,reason:'Ressource épuisée'};
    if(ability.type==='action'&&pc.economy.action)return {allowed:false,reason:'Action utilisée'};
    if(ability.type==='bonus'&&pc.economy.bonus)return {allowed:false,reason:'Action bonus utilisée'};
    if(ability.type==='reaction'&&pc.economy.reaction)return {allowed:false,reason:'Réaction utilisée'};
    return {allowed:true,reason:''};
  }
  // D&D 5e 2014/2024 : calculs communs, indépendants des classes et options non renseignées.
  function abilityModifier(score){return Number.isInteger(score)&&score>=1&&score<=30?Math.floor((score-10)/2):null;}
  function proficiencyBonus(level){return Number.isInteger(level)&&level>=1&&level<=20?2+Math.floor((level-1)/4):null;}
  function baseRulesSummary(pc){
    const scores=pc.stats?.abilities||{};
    const mods=Object.fromEntries(['str','dex','con','int','wis','cha'].map(key=>[key,abilityModifier(scores[key])]));
    const pb=proficiencyBonus(pc.level);
    return {proficiency:pb,modifiers:mods,
      initiativeBase:mods.dex,
      passivePerceptionBase:mods.wis===null?null:10+mods.wis,
      note:'Valeurs de base sans compétences, maîtrise, expertise, équipement, dons ni effets temporaires.'};
  }
  function summary(state, id) {
    const pc=findPc(state,id); if(!pc)throw new Error('Personnage introuvable.');
    const blocked=isBlocked(pc);
    return {
      action:!blocked&&!pc.economy.action,
      bonus:!blocked&&!pc.economy.bonus&&pc.abilities.some(a=>a.type==='bonus'&&abilityAvailable(pc,a).allowed),
      reaction:!blocked&&!pc.economy.reaction, // p. ex. attaque d’opportunité si le déclencheur s’applique
      movement:speedAvailable(pc),
      abilities:pc.abilities.map(a=>({...a,...abilityAvailable(pc,a)})),
      conditions:pc.conditions.slice(), hp:pc.hp, tempHp:pc.tempHp, concentration:pc.concentration
    };
  }
  function log(state,msg){state.combat.log.unshift({id:Math.random().toString(36).slice(2,11),msg,when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});state.combat.log=state.combat.log.slice(0,60);}
  function participants(state){return [...state.characters.filter(p=>!p.fallen),...(state.combat.npcs||[])];}
  function startCombat(state,actor) {
    if(actor!=='mj')throw new Error('Seul le MJ gère l’initiative dans cette démonstration.');
    state.combat.round=1;state.combat.index=0;state.combat.delayed=[];state.combat.readied=[];
    if(!state.combat.manualOrder || !validOrder(state))sortInitiative(state,actor);
    state.combat.order=state.combat.order.slice();
    state.combat.started=true;state.combat.turnStartedAt=new Date().toISOString();
    for(const n of state.combat.npcs||[])if(n.legendaryMax)n.legendaryLeft=n.legendaryMax;
    state.combat.lairRound=0;state.combat.lairPending=[];checkLair(state);
    for(const p of state.characters)p.concentrationChecks=[];
    for(const p of state.characters)p.economy={action:false,bonus:false,reaction:false,movement:0};
    log(state,'Combat lancé · ordre d’initiative défini');
    return state;
  }
  function activeId(state){ return state.combat.order[state.combat.index]; }
  function validOrder(state){const ids=participants(state).map(p=>p.id);return state.combat.order?.length===ids.length && new Set(state.combat.order).size===ids.length && ids.every(id=>state.combat.order.includes(id));}
  // L'ordre vient des initiatives lancées réellement ; le MJ tranche les égalités.
  function sortInitiative(state,actor){
    if(actor!=='mj')throw new Error('Accès réservé au MJ.');
    if(state.combat.started)throw new Error('Ne pas trier en plein combat : déplacez un participant manuellement.');
    state.combat.order=participants(state).sort((a,b)=>b.initiative-a.initiative||String(a.group||'').localeCompare(String(b.group||''))).map(p=>p.id);
    state.combat.manualOrder=false;log(state,'Ordre trié d’après les initiatives saisies (dés physiques)');return state;
  }
  function moveInitiative(state,actor,id,direction){
    if(actor!=='mj')throw new Error('Accès réservé au MJ.');
    if(!validOrder(state))throw new Error('Ordre d’initiative invalide.');
    if(direction!==-1&&direction!==1)throw new Error('Sens de déplacement incorrect.');
    const from=state.combat.order.indexOf(id),to=from+direction;
    if(from<0||to<0||to>=state.combat.order.length)throw new Error('Déplacement hors de la liste.');
    const current=state.combat.started?activeId(state):null;
    // Ne jamais déplacer un tour déjà joué ou actif : cela provoquerait un second tour ou un tour sauté.
    if(state.combat.started && (from<=state.combat.index||to<=state.combat.index))
      throw new Error('Déplacement interdit pendant ce round : seul l’ordre des tours à venir peut changer.');
    [state.combat.order[from],state.combat.order[to]]=[state.combat.order[to],state.combat.order[from]];
    if(current)state.combat.index=state.combat.order.indexOf(current);
    state.combat.manualOrder=true;
    log(state,'Ordre d’initiative ajusté manuellement · '+(participants(state).find(p=>p.id===id)?.name||'participant'));
    if((state.combat.npcs||[]).some(p=>p.id===id))state.combat.log[0].audience='gm';
    return state;
  }
  function concentrationDC(damage){return Math.max(10,Math.floor(damage/2));}
  // La sauvegarde de CON n'est JAMAIS lancée ici : le joueur annonce son dé physique.
  function resolveConcentration(state,actor,id,checkId,result){
    const p=requireEdit(state,actor,id),checks=Array.isArray(p.concentrationChecks)?p.concentrationChecks:[];
    const ix=checks.findIndex(c=>c.id===checkId);
    if(ix<0)throw new Error('Rappel de concentration introuvable.');
    if(!['success','failure'].includes(result))throw new Error('Résultat de sauvegarde invalide.');
    checks.splice(ix,1);
    if(result==='failure'){p.concentration='';p.concentrationChecks=[];}
    log(state,p.name+' · sauvegarde de concentration '+(result==='success'?'réussie':'ratée')+' (dés physiques)');
    return state;
  }
  function combatTarget(state,id){return findPc(state,id)||(state.combat.npcs||[]).find(n=>n.id===id);}
  function timerNote(state,target,msg){if(findPc(state,target.id))log(state,msg);else{state.combat.log.unshift({id:Math.random().toString(36).slice(2,11),msg,when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),audience:'gm'});state.combat.log=state.combat.log.slice(0,60);}}
  // Durée d'un état : « jusqu'à la fin (ou au début) du Ne tour de <créature de référence> », avec rappel facultatif
  // d'une sauvegarde à refaire à la fin de chaque tour de la cible (le dé reste physique, le MJ décide).
  function setConditionTimer(state,actor,id,condition,rounds,opts={}){
    if(actor!=='mj')throw new Error('Seul le MJ règle les durées d’états.');
    const target=combatTarget(state,id);if(!target)throw new Error('Créature introuvable.');
    if(!(target.conditions||[]).includes(condition))throw new Error('Cette créature n’a pas cet état.');
    const r=Math.floor(Number(rounds));if(!Number.isFinite(r)||r<0||r>99)throw new Error('Durée invalide : 0 à 99 rounds.');
    const when=opts.when==='start'?'start':'end';const anchor=opts.anchor?String(opts.anchor):id;
    const anc=combatTarget(state,anchor);if(!anc)throw new Error('Créature de référence introuvable.');
    const save=String(opts.save||'').replace(/[\u0000-\u001f]/g,' ').trim();if(save.length>50)throw new Error('Sauvegarde : 50 caractères maximum.');
    state.combat.timers=(state.combat.timers||[]).filter(t=>!(t.id===id&&t.condition===condition));
    if(r>0||save)state.combat.timers.push({id,condition,rounds:r>0?r:0,when,anchor,...(save?{save}:{})});
    timerNote(state,target,target.name+' · '+condition+(r>0?' jusqu’'+(when==='start'?'au début':'à la fin')+' du '+(r>1?r+'e ':'prochain ')+'tour de '+(anchor===id?'la cible':anc.name):'')+(save?' · sauvegarde à chaque fin de tour : '+save:'')+(r<=0&&!save?' : durée retirée':''));
    return state;
  }
  function tickConditionTimers(state,turnId,phase='end'){
    const timers=state.combat.timers||[];if(!timers.length)return;const keep=[];
    for(const t of timers){
      const target=combatTarget(state,t.id);
      if(!target||!(target.conditions||[]).includes(t.condition))continue;
      if(phase==='end'&&t.save&&t.id===turnId&&t.id!==undefined)timerNote(state,target,target.name+' · fin de tour : nouvelle sauvegarde '+t.save+' pour mettre fin à « '+t.condition+' » (dé physique)');
      if(!t.rounds||(t.anchor||t.id)!==turnId||(t.when||'end')!==phase){keep.push(t);continue;}
      t.rounds--;
      if(t.rounds>0){keep.push(t);continue;}
      target.conditions=target.conditions.filter(c=>c!==t.condition);
      timerNote(state,target,'Fin de l’état « '+t.condition+' » · '+target.name);
    }
    state.combat.timers=keep;
  }
  function nextTurn(state,actor,opts={}){
    if(actor!=='mj'&&!opts.internal)throw new Error('Seul le MJ fait avancer les tours.');
    if(!state.combat.started)throw new Error('Le combat n’a pas commencé.');
    if(!state.combat.order.length)return state;
    const groupOf=id=>{const n=(state.combat.npcs||[]).find(x=>x.id===id);return n&&n.group?n.group:'';};
    const g=groupOf(activeId(state));if(!opts.delaying)tickConditionTimers(state,activeId(state));
    let steps=1;if(g){while(state.combat.index+steps<state.combat.order.length&&groupOf(state.combat.order[state.combat.index+steps])===g){tickConditionTimers(state,state.combat.order[state.combat.index+steps]);steps++;}}
    state.combat.index+=steps;if(state.combat.index>=state.combat.order.length){state.combat.index=0;state.combat.round++;}
    {const first=(state.combat.npcs||[]).find(x=>x.id===activeId(state));const ng=first&&first.group;for(const n of state.combat.npcs||[])if(n.legendaryMax&&(n.id===activeId(state)||(ng&&n.group===ng)))n.legendaryLeft=n.legendaryMax;}
    {const now=activeId(state);const ng=groupOf(now);tickConditionTimers(state,now,'start');if(ng)for(const id of state.combat.order)if(id!==now&&groupOf(id)===ng)tickConditionTimers(state,id,'start');}
    state.combat.turnStartedAt=new Date().toISOString();
    checkLair(state);
    {const n=(state.combat.npcs||[]).find(x=>x.id===activeId(state));const ng=n&&n.group;for(const m of state.combat.npcs||[])if((m.id===activeId(state)||(ng&&m.group===ng))&&Array.isArray(m.spent)&&m.spent.length&&m.hp>0)state.combat.log.unshift({id:'recharge-'+m.id+'-'+state.combat.round,msg:m.name+' · lancez 1d6 pour '+m.spent.join(', ')+' (le pouvoir revient sur le résultat indiqué)',when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),audience:'gm'});}
    {const now=activeId(state);const who=participants(state).find(x=>x.id===now);const secret=!findPc(state,now);
     // Tour retardé jusqu’à revenir à sa place : le tour retardé est perdu, le nouveau tour commence normalement.
     if((state.combat.delayed||[]).some(d=>d.id===now)){state.combat.delayed=state.combat.delayed.filter(d=>d.id!==now);noteTurn(state,(who?.name||'Participant')+' n’a pas repris son tour retardé : il est perdu',secret);}
     // Une action préparée dure jusqu’au début du tour suivant de celui qui l’a préparée.
     if((state.combat.readied||[]).some(r=>r.id===now)){state.combat.readied=state.combat.readied.filter(r=>r.id!==now);noteTurn(state,(who?.name||'Participant')+' · action préparée non déclenchée : elle est perdue',secret);}}
    const pc=findPc(state,activeId(state));
    if(pc){pc.economy={action:false,bonus:false,reaction:false,movement:0}; log(state,'Début de tour · '+pc.name+' · round '+state.combat.round);}
    else {const npc=(state.combat.npcs||[]).find(n=>n.id===activeId(state));if(npc){state.combat.log.unshift({id:'npc-turn-'+state.combat.round+'-'+state.combat.index,msg:'Début de tour · '+npc.name+' · round '+state.combat.round,when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),audience:'gm'});}}
    return state;
  }
  function noteTurn(state,msg,secret){if(!secret){log(state,msg);return;}state.combat.log.unshift({id:Math.random().toString(36).slice(2,11),msg,when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),audience:'gm'});state.combat.log=state.combat.log.slice(0,60);}
  // 5.3 : retarder son tour (option de table) et préparer une action (règle officielle : action + réaction au déclencheur).
  function controls(state,actor,id){const pc=findPc(state,id);if(pc){if(!canEdit(state,actor,id))throw new Error('Accès refusé à cette fiche.');return {who:pc,pc:true};}
    const n=(state.combat.npcs||[]).find(x=>x.id===id);if(!n)throw new Error('Participant introuvable.');if(actor!=='mj')throw new Error('Accès réservé au MJ.');return {who:n,pc:false};}
  function delayTurn(state,actor,id){if(!state.combat.started)throw new Error('Le combat n’a pas commencé.');const {who,pc}=controls(state,actor,id);
    if(activeId(state)!==id)throw new Error('On ne peut retarder que son propre tour, au moment où il commence.');if(who.group)throw new Error('Les créatures groupées jouent ensemble : déplacez le groupe avec ↑ et ↓.');
    state.combat.delayed=(state.combat.delayed||[]).filter(d=>d.id!==id);state.combat.delayed.push({id,round:state.combat.round});noteTurn(state,who.name+' retarde son tour',!pc);
    nextTurn(state,actor,{internal:true,delaying:true});return state;}
  function actNow(state,actor,id){if(!state.combat.started)throw new Error('Le combat n’a pas commencé.');const {who,pc}=controls(state,actor,id);
    if(!(state.combat.delayed||[]).some(d=>d.id===id))throw new Error(who.name+' n’a pas retardé son tour.');
    const order=state.combat.order;const cur=activeId(state);const grp=x=>((state.combat.npcs||[]).find(n=>n.id===x)||{}).group||'';
    let j=order.indexOf(cur);while(grp(cur)&&j+1<order.length&&grp(order[j+1])===grp(cur))j++;const target=order[j];
    order.splice(order.indexOf(id),1);order.splice(order.indexOf(target)+1,0,id);state.combat.index=order.indexOf(cur);state.combat.manualOrder=true;
    state.combat.delayed=state.combat.delayed.filter(d=>d.id!==id);noteTurn(state,who.name+' reprend son tour : il joue juste après '+(participants(state).find(x=>x.id===cur)?.name||'le tour en cours')+' (nouvelle place dans l’initiative)',!pc);return state;}
  const clip=(v,max,label)=>{const t=String(v==null?'':v).replace(/[\u0000-\u001f]/g,' ').trim();if(t.length>max)throw new Error(label+' : '+max+' caractères maximum.');return t;};
  function readyAction(state,actor,id,trigger,what,spell){if(!state.combat.started)throw new Error('Le combat n’a pas commencé.');const {who,pc}=controls(state,actor,id);
    const tr=clip(trigger,140,'Déclencheur'),wh=clip(what,140,'Action');if(!tr)throw new Error('Décrivez le déclencheur (ce qui doit se produire).');if(!wh)throw new Error('Décrivez l’action préparée.');
    if(pc){if(isBlocked(who))throw new Error('Ce personnage est incapable d’agir.');if(who.economy.action)throw new Error('L’action de ce tour est déjà utilisée.');who.economy.action=true;}
    state.combat.readied=(state.combat.readied||[]).filter(r=>r.id!==id);state.combat.readied.push({id,trigger:tr,action:wh,spell:spell===true,round:state.combat.round});
    noteTurn(state,who.name+' prépare une action : '+wh+' · déclencheur : '+tr+(spell?' (sort : concentration jusqu’au déclenchement)':''),!pc);return state;}
  function readyResolve(state,actor,id,mode){const {who,pc}=controls(state,actor,id);const r=(state.combat.readied||[]).find(x=>x.id===id);if(!r)throw new Error('Aucune action préparée.');
    if(mode==='use'){if(pc){if(isBlocked(who))throw new Error('Ce personnage est incapable d’agir.');if(who.economy.reaction)throw new Error('La réaction est déjà utilisée : l’action préparée ne peut pas être déclenchée.');who.economy.reaction=true;}}
    else if(mode!=='cancel')throw new Error('Choix inconnu.');
    state.combat.readied=state.combat.readied.filter(x=>x.id!==id);noteTurn(state,mode==='use'?who.name+' déclenche son action préparée : '+r.action+' (réaction utilisée)':who.name+' renonce à son action préparée',!pc);return state;}
  // Actions de repaire : au compte 20 de l'initiative (en perdant les égalités), une fois par round.
  function checkLair(state){const lair=(state.combat.npcs||[]).filter(n=>n.lair&&n.hp>0);if(!lair.length)return;const id=activeId(state);const p=participants(state).find(x=>x.id===id);
    if(!p||state.combat.lairRound===state.combat.round||Number(p.initiative)>=20)return;state.combat.lairRound=state.combat.round;state.combat.lairPending=lair.map(n=>n.id);
    state.combat.log.unshift({id:'lair-'+state.combat.round,msg:'Initiative 20 · actions de repaire : '+lair.map(n=>n.name).join(', '),when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),audience:'gm'});}
  function endCombat(state,actor){if(actor!=='mj')throw new Error('Accès réservé au MJ.');state.combat.started=false;state.combat.timers=[];state.combat.delayed=[];state.combat.readied=[];log(state,'Fin du combat');return state;}
  function setInitiative(state,actor,id,n){if(actor!=='mj')throw new Error('Accès réservé au MJ.');const p=findPc(state,id);if(!p)throw new Error('Personnage introuvable.');p.initiative=Math.floor(CLAMP(n,-99,99));if(!state.combat.started&&!state.combat.manualOrder)sortInitiative(state,actor);return state;}
  function spendType(state,actor,id,type){
    const p=requireEdit(state,actor,id);if(!['action','bonus','reaction'].includes(type))throw new Error('Type inconnu.');
    if(isBlocked(p))throw new Error('Ce personnage est incapable d’agir.');
    if(p.economy[type])throw new Error('Cette possibilité a déjà été consommée.');
    p.economy[type]=true;log(state,p.name+' · '+({action:'action',bonus:'action bonus',reaction:'réaction'}[type])+' utilisée');return state;
  }
  function resetEconomy(state,actor,id){const p=requireEdit(state,actor,id);p.economy={action:false,bonus:false,reaction:false,movement:0};log(state,p.name+' · économie de tour réinitialisée manuellement');return state;}
  function useAbility(state,actor,id,abilityId){
    const p=requireEdit(state,actor,id), a=p.abilities.find(a=>a.id===abilityId);if(!a)throw new Error('Capacité inconnue.');
    const check=abilityAvailable(p,a);if(!check.allowed)throw new Error(check.reason);
    if(a.cost){const resource=p.resources.find(r=>r.id===a.cost.resource);resource.left-=a.cost.amount;}
    if(a.type!=='free')p.economy[a.type]=true;
    if(a.concentration){p.concentration=a.name;p.concentrationChecks=[];}
    if(a.special==='grantAction'){p.economy.action=false;}
    log(state,p.name+' · '+a.name+(a.special==='grantAction'?' (action débloquée)':''));return state;
  }
  function updateMovement(state,actor,id,metres){const p=requireEdit(state,actor,id);const d=+metres;if(!Number.isFinite(d)||d<0)throw new Error('Distance incorrecte.');if(d>speedAvailable(p))throw new Error('Déplacement insuffisant.');p.economy.movement+=d;log(state,p.name+' · déplacement '+d+' m');return state;}
  const DAMAGE_TYPES=['Contondant','Perforant','Tranchant','Feu','Froid','Foudre','Tonnerre','Acide','Poison','Nécrotique','Radiant','Force','Psychique'];
  const DEFENSE_STATES={resist:'Résistance',vuln:'Vulnérabilité',immune:'Immunité'};
  function cleanDefenses(map){const out={};if(map&&typeof map==='object'&&!Array.isArray(map))for(const [t,v] of Object.entries(map))if(DAMAGE_TYPES.includes(t)&&Object.prototype.hasOwnProperty.call(DEFENSE_STATES,v))out[t]=v;return out;}
  function adjustDamage(defenses,type,amount){const st=defenses&&type?defenses[type]:null;if(st==='immune')return {amount:0,state:st};if(st==='resist')return {amount:Math.floor(amount/2),state:st};if(st==='vuln')return {amount:amount*2,state:st};return {amount,state:null};}
  function damageNote(type,adj,before){return ' · '+type.toLowerCase()+(adj.state?' ('+DEFENSE_STATES[adj.state].toLowerCase()+' : '+before+' → '+adj.amount+')':'');}
  function setExhaustion(state,actor,id,delta){const p=requireEdit(state,actor,id);const d=Math.trunc(Number(delta));if(d!==1&&d!==-1)throw new Error('Valeur d’épuisement incorrecte.');const before=Math.max(0,Math.min(6,Number(p.exhaustion)||0));p.exhaustion=Math.max(0,Math.min(6,before+d));if(p.exhaustion!==before)log(state,p.name+' · épuisement niveau '+p.exhaustion+(p.exhaustion===6?' (mort)':''));return state;}
  function setDefense(state,actor,id,type,value){const p=requireEdit(state,actor,id);if(!DAMAGE_TYPES.includes(type))throw new Error('Type de dégâts inconnu.');if(value&&!Object.prototype.hasOwnProperty.call(DEFENSE_STATES,value))throw new Error('Défense inconnue.');p.defenses=cleanDefenses(p.defenses);if(value)p.defenses[type]=value;else delete p.defenses[type];log(state,p.name+' · '+type.toLowerCase()+' : '+(value?DEFENSE_STATES[value].toLowerCase():'normal'));return state;}
  function changeHp(state,actor,id,delta,damageType){
    const p=requireEdit(state,actor,id);let n=Math.max(0,Math.floor(Math.abs(+delta)||0));if(!n)return state;let note='';
    if(+delta<0&&damageType){if(!DAMAGE_TYPES.includes(damageType))throw new Error('Type de dégâts inconnu.');const adj=adjustDamage(p.defenses,damageType,n);note=damageNote(damageType,adj,n);n=adj.amount;if(!n){log(state,p.name+' · aucun dégât'+note);return state;}}
    if(+delta<0){let dmg=n;if(p.tempHp){const absorbed=Math.min(p.tempHp,dmg);p.tempHp-=absorbed;dmg-=absorbed;}p.hp=Math.max(0,p.hp-dmg);log(state,p.name+' · '+n+' dégâts'+note+' (annoncés par le MJ/joueur)');
      if(p.concentration&&p.hp>0){
        if(!Array.isArray(p.concentrationChecks))p.concentrationChecks=[];
        p.concentrationChecks.push({id:'cc-'+Math.random().toString(36).slice(2,12),damage:n,dc:concentrationDC(n),round:state.combat.started?state.combat.round:null});
        p.concentrationChecks=p.concentrationChecks.slice(-12);
        log(state,p.name+' · sauvegarde de Constitution à faire avec un vrai d20 (DD '+concentrationDC(n)+')');
      }
    }
    else {p.hp=Math.min(p.stats.hp,p.hp+n);log(state,p.name+' · '+n+' soins');}
    if(p.hp===0){p.concentration='';p.concentrationChecks=[];p.economy={action:true,bonus:true,reaction:true,movement:0};}
    if(p.hp>0){p.deathSaves={success:0,failure:0};p.conditions=p.conditions.filter(x=>x!=='Inconscient');}
    return state;
  }
  function setTempHp(state,actor,id,n){const p=requireEdit(state,actor,id);p.tempHp=Math.floor(CLAMP(n,0,9999));log(state,p.name+' · PV temporaires : '+p.tempHp);return state;}
  function toggleCondition(state,actor,id,condition){const p=requireEdit(state,actor,id);if(!STATES.includes(condition))throw new Error('Condition inconnue.'); if(p.conditions.includes(condition))p.conditions=p.conditions.filter(c=>c!==condition);else p.conditions.push(condition);if(isBlocked(p)){p.concentration='';p.concentrationChecks=[];}log(state,p.name+' · condition : '+condition);return state;}
  function toggleConcentration(state,actor,id,spell){const p=requireEdit(state,actor,id);if(isBlocked(p))throw new Error('Impossible de maintenir la concentration.');p.concentration=spell&&String(spell).trim().slice(0,80)||'';p.concentrationChecks=[];log(state,p.name+' · concentration '+(p.concentration||'terminée'));return state;}
  function changeResource(state,actor,id,rid,delta){const p=requireEdit(state,actor,id);const r=p.resources.find(r=>r.id===rid);if(!r)throw new Error('Ressource introuvable.');r.left=Math.floor(CLAMP(r.left+delta,0,r.max));log(state,p.name+' · '+r.name+' : '+r.left+'/'+r.max);return state;}
  function deathSave(state,actor,id,result){const p=requireEdit(state,actor,id);if(p.hp>0)throw new Error('Ce personnage a encore des PV.');const key=result==='success'?'success':result==='failure'?'failure':null;if(!key)throw new Error('Jet invalide.');p.deathSaves[key]=Math.min(3,p.deathSaves[key]+1);log(state,p.name+' · sauvegarde contre la mort : '+(key==='success'?'succès':'échec'));return state;}
  /* 5.3 : inspiration héroïque (une seule à la fois). Le MJ l’accorde ou la retire ; le joueur la dépense
     (aucun dé n’est lancé ici : on note seulement qu’elle est utilisée) ou la donne à un autre personnage qui n’en a pas. */
  function setInspiration(state,actor,id,mode,targetId){
    if(mode==='give'||mode==='remove'){if(actor!=='mj')throw new Error('Seul le MJ accorde ou retire l’inspiration.');const p=findPc(state,id);if(!p)throw new Error('Personnage introuvable.');
      if(mode==='give'){if(p.inspiration)throw new Error(p.name+' a déjà l’inspiration.');p.inspiration=true;log(state,p.name+' · reçoit l’inspiration héroïque');}
      else{if(!p.inspiration)throw new Error(p.name+' n’a pas l’inspiration.');p.inspiration=false;log(state,p.name+' · inspiration retirée');}return state;}
    const p=requireEdit(state,actor,id);if(!p.inspiration)throw new Error(p.name+' n’a pas l’inspiration.');
    if(mode==='use'){p.inspiration=false;log(state,p.name+' · utilise son inspiration héroïque');return state;}
    if(mode==='pass'){const t=findPc(state,targetId);if(!t||t.id===p.id)throw new Error('Personnage introuvable.');if(t.inspiration)throw new Error(t.name+' a déjà l’inspiration.');p.inspiration=false;t.inspiration=true;log(state,p.name+' · donne son inspiration à '+t.name);return state;}
    throw new Error('Action d’inspiration inconnue.');}
  /* 5.5 : mémorial. Un personnage tombé quitte le combat et les listes du groupe, mais sa fiche reste consultable. */
  function setFallen(state,actor,id,v){if(actor!=='mj')throw new Error('Seul le MJ inscrit un personnage au mémorial.');const p=findPc(state,id);if(!p)throw new Error('Personnage introuvable.');
    const txt=(x,label,max)=>{const t=String(x??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();if(t.length>max)throw new Error(label+' : '+max+' caractères maximum.');return t;};
    if(v===null){if(!p.fallen)throw new Error(p.name+' n’est pas au mémorial.');delete p.fallen;log(state,p.name+' revient parmi les vivants');return state;}
    p.fallen={at:new Date().toISOString(),level:p.level,cause:txt(v?.cause,'Circonstances',200),epitaph:txt(v?.epitaph,'Épitaphe',300)};
    const c=state.combat;const i=c.order.indexOf(id);if(i>=0){const cur=c.order[c.index];c.order.splice(i,1);const j=c.order.indexOf(cur);c.index=j>=0?j:Math.min(c.index,Math.max(0,c.order.length-1));}
    c.delayed=(c.delayed||[]).filter(d=>d.id!==id);c.readied=(c.readied||[]).filter(r=>r.id!==id);
    log(state,'✝ '+p.name+' est tombé'+(p.fallen.cause?' · '+p.fallen.cause:''));return state;}
  function rest(state,actor,id,type){const p=requireEdit(state,actor,id);if(!['short','long'].includes(type))throw new Error('Repos inconnu.');if(p.hp<=0)throw new Error('Repos impossible à 0 PV.');for(const r of p.resources){if(type==='long'||r.rest==='short')r.left=r.max;}if(type==='long'){p.hp=p.stats.hp;p.deathSaves={success:0,failure:0};p.exhaustion=Math.max(0,p.exhaustion-1);/* Dés de vie : tous en 2024, la moitié du niveau (au moins 1) en 2014. */p.hitDiceUsed=state.edition==='2024'?0:Math.max(0,(p.hitDiceUsed||0)-Math.max(1,Math.floor((p.level||1)/2)));}log(state,p.name+' · repos '+(type==='long'?'long':'court')+' (ressources appropriées restaurées)');return state;}
  function sharedNotesList(state){if(!Array.isArray(state.sharedNotes))state.sharedNotes=[];return state.sharedNotes;}
  function saveSharedNote(state,actor,id,title,body,baseAt){
    if(actor==='mj')throw new Error('Les notes des joueurs sont en lecture seule pour le MJ.');
    const pc=findPc(state,actor);if(!pc)throw new Error('Personnage introuvable.');
    const list=sharedNotesList(state);const t=String(title||'').trim().slice(0,80)||'Sans titre';const b=String(body||'').slice(0,4000);const now=new Date().toISOString();
    if(id){
      const n=list.find(x=>x.id===id);if(!n)throw new Error('Cette note n’existe plus.');
      if(baseAt&&n.at!==baseAt)throw new Error('Cette note a été modifiée par '+n.by+' entre-temps. Vos changements restent dans le champ : copiez-les, puis abandonnez-les pour recharger la version partagée.');
      n.title=t;n.body=b;n.by=pc.name;n.at=now;return n;
    }
    if(list.length>=30)throw new Error('Limite de 30 notes atteinte : supprimez-en une.');
    const n={id:'note-'+Math.random().toString(36).slice(2,10),title:t,body:b,by:pc.name,at:now};list.unshift(n);return n;
  }
  function deleteSharedNote(state,actor,id){
    if(actor==='mj')throw new Error('Les notes des joueurs sont en lecture seule pour le MJ.');
    const list=sharedNotesList(state);if(!list.some(x=>x.id===id))throw new Error('Cette note n’existe plus.');
    state.sharedNotes=list.filter(x=>x.id!==id);return state;
  }
  function setPrivateNotes(state,actor,text){if(actor!=='mj')throw new Error('Notes privées réservées au MJ.');state.gmNotes=String(text).slice(0,3000);return state;}
  function addPc(state,actor,values){if(actor!=='mj')throw new Error('Seul le MJ peut ajouter des personnages dans cette démonstration.');const name=String(values.name||'').trim().slice(0,MAX_NAME);if(!name)throw new Error('Nom obligatoire.');const id='pc'+Math.random().toString(36).slice(2,10);const hp=Math.floor(CLAMP(values.hp,1,500));const level=Math.floor(CLAMP(values.level,1,20));const ac=Math.floor(CLAMP(values.ac,1,40));const pc=char(id,name,String(values.role||'Humain').slice(0,50),String(values.job||'Aventurier').slice(0,50),level,{hp,ac,passive:10},9,id,[],[],[],0);state.characters.push(pc);state.combat.order.push(id);log(state,'Nouveau personnage : '+name);return pc;}
  function validImport(data){
    if(!data||data.schemaVersion!==4||!Array.isArray(data.characters)||!data.combat||!data.characters.every(p=>typeof p.id==='string'&&typeof p.name==='string'&&p.stats&&Number.isFinite(+p.hp)&&Array.isArray(p.abilities)&&Array.isArray(p.resources)&&Array.isArray(p.conditions)&&p.economy))throw new Error('Fichier V0.4 invalide ou non compatible.');
    return true;
  }
  return {STATES,CORE_ACTIONS,initialState,clone,findPc,actorPc,canViewDetail,canEdit,actionSet,abilityModifier,proficiencyBonus,baseRulesSummary,summary,isBlocked,speedAvailable,abilityAvailable,startCombat,nextTurn,setConditionTimer,saveSharedNote,deleteSharedNote,endCombat,activeId,setInitiative,sortInitiative,moveInitiative,concentrationDC,resolveConcentration,spendType,resetEconomy,useAbility,updateMovement,changeHp,setTempHp,setExhaustion,setInspiration,setFallen,delayTurn,actNow,readyAction,readyResolve,DAMAGE_TYPES,DEFENSE_STATES,cleanDefenses,adjustDamage,setDefense,toggleCondition,toggleConcentration,changeResource,deathSave,rest,setPrivateNotes,addPc,validImport};
});

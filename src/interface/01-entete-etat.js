/* Chroniques — interface web (la version affichée vient de package.json via /api/status).
   FICHIER GÉNÉRÉ : modifiez les morceaux de src/interface/, puis lancez « node scripts/dev/build-app.js » (vérification : --check). */
(function () {
'use strict';
const L=window.ChroniquesLogic;
const P=window.ChroniquesProgression;
const O=window.ChroniquesOrigins;
const H=window.ChroniquesHeritage;
const S=window.ChroniquesSpells;
const G=window.ChroniquesSpellGuide;
const R=(typeof window!=='undefined'&&window.ChroniquesRules)||null;
let rulesQuery='',rulesSel=null,rulesError='',rtOpen='',charterEdit='',seenSignals=null,seenGroupCheck=null,seenVote=null,spellClassPick='',dtEdit='',levelUpTarget='',areaDmgPreset={keys:[],label:''};
const X=(typeof window!=='undefined'&&window.ChroniquesExtras)||null;
const WTC=(typeof window!=='undefined'&&window.ChroniquesWorldTime)||null;
const CTX=(typeof window!=='undefined'&&window.ChroniquesCharacterTransfer)||null;const TCHC=(typeof window!=='undefined'&&window.ChroniquesCharter)||null;const DTM=(typeof window!=='undefined'&&window.ChroniquesDowntime)||null;const MADM=(typeof window!=='undefined'&&window.ChroniquesMadness)||null;const GCM=(typeof window!=='undefined'&&window.ChroniquesGroupChecks)||null;const TVM=(typeof window!=='undefined'&&window.ChroniquesVotes)||null;const AFFM=(typeof window!=='undefined'&&window.ChroniquesAfflictions)||null;const TGM=(typeof window!=='undefined'&&window.ChroniquesTongues)||null;const HEX=(typeof window!=='undefined'&&window.ChroniquesHex)||null;const PT=(typeof window!=='undefined'&&window.ChroniquesParty)||null;const PR=(typeof window!=='undefined'&&window.ChroniquesPrep)||null;const CHR=(typeof window!=='undefined'&&window.ChroniquesChronicle)||null;const TRV=(typeof window!=='undefined'&&window.ChroniquesTravel)||null;const FAC=(typeof window!=='undefined'&&window.ChroniquesFactions)||null;const RTB=(typeof window!=='undefined'&&window.ChroniquesTables)||null;const ADM=(typeof window!=='undefined'&&window.ChroniquesAreaDamage)||null;let tlKind='all',arcFrom='';
let updateInfo=null,whisperThread='',cmpEdit='',backupsInfo=null,backupReport=null,lastWhisperUnread=null,ambListen=false;
const H6={esc:s=>esc(s),attr:s=>attr(s),option:(v,l,c)=>option(v,l,c)};
const UIH=(typeof window!=='undefined'&&window.ChroniquesUiHelpers)||require('./ui-helpers.js');
const {CONDITION_HELP,GM_SCREEN,splitActions,splitLegendary,rollHint,initRows,groupName,tokenInitials}=UIH;
// 5.19 : mise en forme légère (gras, italique, listes, intertitres, citations) des textes longs écrits par le MJ et les joueurs.
const RT=(typeof window!=='undefined'&&window.ChroniquesRichText)||null;
function rich(t,cls='rich'){return `<div class="${cls}">${RT?RT.render(t):'<p>'+esc(t).replace(/\n/g,'<br>')+'</p>'}</div>`;}
const GEAR=(typeof window!=='undefined'&&window.ChroniquesGear)||(typeof require==='function'?(()=>{try{return require('./gear.js');}catch{return null;}})():null);
let itemUseOpen='';
const HB=(typeof window!=='undefined'&&window.ChroniquesHomebrewItems)||(typeof require==='function'?(()=>{try{return require('./homebrew-items.js');}catch{return null;}})():null);
const SV=window.ChroniquesSheetView;
const MD=window.ChroniquesMjBoard;
const JMP=(typeof window!=='undefined'&&window.ChroniquesJumps)||null;const MARCHM=(typeof window!=='undefined'&&window.ChroniquesMarching)||null;const LOOKM=(typeof window!=='undefined'&&window.ChroniquesCampaignLook)||null;const N=window.ChroniquesCreatures;const WX=(typeof window!=='undefined'&&window.ChroniquesWeather)||null;const CLKM=(typeof window!=='undefined'&&window.ChroniquesClocks)||null;const PERSM=(typeof window!=='undefined'&&window.ChroniquesPersonality)||null;const TJM=(typeof window!=='undefined'&&window.ChroniquesTravelJournal)||null;const FBM=(typeof window!=='undefined'&&window.ChroniquesFeedback)||null;const CLUM=(typeof window!=='undefined'&&window.ChroniquesClues)||null;const SHP=(typeof window!=='undefined'&&window.ChroniquesShapes)||null;
const A=window.ChroniquesArt;
const I=window.ChroniquesInventory;
const CW=window.ChroniquesCombatWorkspace;
const W=window.ChroniquesWorkspace||{IDS:[],LABELS:{},blank:()=>({order:[],panels:{}}),normalize:()=>({order:[],panels:{}}),move:()=>({order:[],panels:{}}),show:()=>({order:[],panels:{}}),width:()=>({order:[],panels:{}}),key:()=>''};
const OB=window.ChroniquesOnboarding||{steps:()=>[],decode:()=>[],key:()=>'',progress:()=>({total:0,done:0,next:null})};
const QH=window.ChroniquesQuickHelp||{tutorial:()=>null};
let state=L.initialState(), actor='mj', page='overview', selected=state.characters[0]?.id||'', modal='';
let spellFilterLevel='all', spellFilterText='';
let mediaKind='character', mediaTarget='', artSearch='';
let cropImage=null, spotlightDismissedId=null, previewMediaId=null;
let campaignList={activeId:null,campaigns:[]},viewer=null, version=0, events=null, inviteResult=null, management=null, authMode='login', lastNotice='', network={networkMode:'local',remoteUrl:null};
let pendingPlannerLink=null;let sheetSection='play';let histFilter='all',histQuery='';
let uxSimple=true,sceneFilter='all';
let deskLayout=W.blank(),deskDrag='',deskCustomizeOpen=false;
let gmCombatView='desk', gmBoardFilter='all';
let fightLayout=CW?.blank(),fightDrag='',fightCustomizeOpen=false;
let mobileMore=false, guideStep=0, connectionState='Connexion…';
let onboardDone=[],onboardHidden=false;
let inventoryCharacterId='',inventoryEditId='';
let mapSelectedId='',mapActivePin='',mapPlacement=null;
let areaShape='circle',areaSize=6,areaPending=null,measureDrag=null;
let mapTool='marker',fogRadius=120,mapActiveToken='',tokenDrag=null,renderPending=false,suppressTokenClick=false;const mapAspect={};
let memoryFilter={search:'',category:'all',status:'all'};
let aiStatus=null,aiPreview=null,aiResult='',aiChoice={storyId:'',task:'twist',notes:'',fields:[]},aiBusy=false;

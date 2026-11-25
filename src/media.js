/* Chroniques V1.6 — contrôles des médias, permissions et formats. */
'use strict';
const A=require('./art-catalog');
const MAX_UPLOAD=2_000_000;
const MAX_PIXELS=5_000_000;
const MAX_MEDIA=240;
const MAX_GALLERY=8;
const MAX_TOTAL=150_000_000;
const KINDS=['character','npc','spell','item'];
const VISIBILITY=['private','public'];
function invalid(message){const e=new Error(message);e.status=400;throw e;}
function list(s){return Array.isArray(s.media)?s.media:[];}
function inventory(p){return Array.isArray(p.inventoryItems)?p.inventoryItems:[];}
function target(s,kind,id,characterId){
 if(!KINDS.includes(kind)||typeof id!=='string'||!id||id.length>110)invalid('Type ou identifiant incorrect.');
 if(kind==='character')return s.characters.find(p=>p.id===id)?{characterId:id}:null;
 if(kind==='npc')return (s.combat.npcs||[]).some(n=>n.id===id)?{npcId:id}:null;
 const owner=s.characters.find(p=>p.id===characterId);
 if(!owner)return null;
 if(kind==='spell')return (owner.grimoire||[]).some(e=>e.id===id)?{characterId}:null;
 if(kind==='item')return inventory(owner).some(e=>e.id===id)?{characterId}:null;
 return null;
}
function canWrite(s,u,kind,id,characterId){
 const found=target(s,kind,id,characterId);if(!found)return false;
 if(kind==='npc')return u.role==='gm';
 return u.role==='gm'||found.characterId===u.characterId;
}
function canRead(s,u,media){
 if(!media||!target(s,media.kind,media.entityId,media.characterId))return false;
 if(u.role==='gm')return true;
 if(media.kind==='npc')return media.visibility==='public'&&(s.combat.npcs||[]).some(n=>n.id===media.entityId&&n.visibility==='public');
 if(media.kind==='character')return media.entityId===u.characterId||media.visibility==='public';
 return media.characterId===u.characterId;
}
function projected(s,u){return list(s).filter(x=>canRead(s,u,x)).map(x=>({id:x.id,kind:x.kind,entityId:x.entityId,characterId:x.characterId||null,visibility:x.visibility,builtinId:x.builtinId||null,width:x.width||null,height:x.height||null,featured:!!x.featured,caption:x.caption||''}));}
function gallery(s,kind,id,characterId){return list(s).filter(x=>x.kind===kind&&x.entityId===id&&(x.characterId||'')===(characterId||''));}
function lookup(s,kind,id,characterId){const all=gallery(s,kind,id,characterId);return all.find(x=>x.featured)||all[0]||null;}
// La projection normale reste privée. Seule l'image expressément présentée par le MJ
// peut être lue temporairement via sa route authentifiée, sans exposer sa fiche secrète.
function canReadFile(s,u,media){return canRead(s,u,media)||Boolean(u.role!=='gm'&&s.spotlight?.mediaId===media?.id&&list(s).some(x=>x.id===media.id)&&!!target(s,media.kind,media.entityId,media.characterId));} 
function pngDimensions(b){
 if(b.length<45||b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||b.toString('ascii',12,16)!=='IHDR'||b.readUInt32BE(8)!==13)invalid('PNG invalide.');
 return [b.readUInt32BE(16),b.readUInt32BE(20)];
}
function webpDimensions(b){
 if(b.length<30||b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP'||b.readUInt32LE(4)!==b.length-8)invalid('WebP invalide.');
 const kind=b.toString('ascii',12,16);
 if(kind==='VP8X'&&b.length>=30)return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];
 if(kind==='VP8 '&&b.length>=30&&b.toString('hex',23,26)==='9d012a')return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];
 if(kind==='VP8L'&&b.length>=25&&b[20]===0x2f)return [1+(((b[22]&0x3f)<<8)|b[21]),1+(((b[24]&0xf)<<10)|(b[23]<<2)|((b[22]&0xc0)>>6))];
 invalid('WebP non pris en charge.');
}
function verify(b,mime){
 if(!Buffer.isBuffer(b)||b.length<40||b.length>MAX_UPLOAD)invalid('Image trop volumineuse (2 Mo maximum après conversion).');
 if(!['image/png','image/webp'].includes(mime))invalid('Après conversion, seuls PNG et WebP sont acceptés.');
 const [width,height]=mime==='image/png'?pngDimensions(b):webpDimensions(b);
 if(width<1||height<1||width>4096||height>4096||width*height>MAX_PIXELS)invalid('Dimensions d’image invalides ou trop grandes.');
 return {width,height,mime,bytes:b.length,extension:mime==='image/png'?'png':'webp'};
}
function validateBuiltin(id,kind){if(!A.get(id,kind))invalid('Illustration du catalogue introuvable.');}
module.exports={MAX_UPLOAD,MAX_MEDIA,MAX_GALLERY,MAX_TOTAL,KINDS,VISIBILITY,list,inventory,target,canWrite,canRead,canReadFile,projected,gallery,lookup,verify,validateBuiltin};

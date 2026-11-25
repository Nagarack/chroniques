'use strict';
const test=require('node:test');const assert=require('node:assert');const CM=require('../src/campaign-maps.js');
function setup(){const s={maps:[]};CM.add(s,'map-abcdefgh',{title:'Crypte',visibility:'shared'});CM.setGrid(s,'map-abcdefgh',{cells:20,scale:'1,5 m'});const m=CM.read(s,'map-abcdefgh');m.aspect=1;CM.setVision(s,'map-abcdefgh',{enabled:true,light:'lit',range:18});return {s,m};}
test('murs : le polygone de visibilité s’arrête au mur',()=>{const poly=CM.visibilityPolygon(500,500,300,[{x1:600,y1:0,x2:600,y2:1000}],1);
 assert.ok(poly.length>40);assert.ok(poly.filter(p=>p[1]>=0&&p[1]<=1000).every(p=>p[0]<=601),'rien au-delà du mur');assert.ok(Math.min(...poly.map(p=>p[0]))<=201);
 assert.strictEqual(CM.visibilityPolygon(500,500,100,[{x1:900,y1:0,x2:900,y2:1000}],1),null,'mur hors de portée : cercle simple');
 const open=CM.visibilityPolygon(500,500,300,[{x1:600,y1:0,x2:600,y2:1000,door:true,open:true}],1);assert.strictEqual(open,null,'porte ouverte : ne bloque pas');});
test('murs : révélation polygonale, porte qui s’ouvre',()=>{const {s,m}=setup();CM.wallAdd(s,'map-abcdefgh','wall-1',{x1:600,y1:0,x2:600,y2:1000,door:true});
 CM.tokenAdd(s,'map-abcdefgh','tok-aaaaaaa',{kind:'pc',refId:'pc-1',label:'A',x:500,y:500});assert.strictEqual(CM.visionReveal(s,'map-abcdefgh',()=>0),1);
 const e=m.fog.revealed[0];assert.strictEqual(e[0],'p');const c=e.slice(5);for(let i=0;i<c.length;i+=2)if(c[i+1]>=0&&c[i+1]<=1000)assert.ok(c[i]<=601,'derrière le mur : '+c[i]+','+c[i+1]);
 assert.strictEqual(CM.visionReveal(s,'map-abcdefgh',()=>0),0,'pas de doublon');
 CM.doorSet(s,'map-abcdefgh','wall-1',true);assert.strictEqual(CM.visionReveal(s,'map-abcdefgh',()=>0),1);assert.strictEqual(m.fog.revealed[1].length,3,'porte ouverte : cercle');
 assert.throws(()=>CM.wallAdd(s,'map-abcdefgh','wall-2',{x1:10,y1:10,x2:10,y2:10}),/court/);CM.wallRemove(s,'map-abcdefgh','__last');assert.strictEqual(m.walls.length,0);
 assert.strictEqual(CM.projected(s,{role:'player'})[0].walls,undefined);});
test('murs : dimensions des images PNG et WebP',()=>{const png=Buffer.alloc(32);png.writeUInt32BE(0x89504e47,0);png.writeUInt32BE(1600,16);png.writeUInt32BE(900,20);assert.deepStrictEqual(CM.imageSize(png),{w:1600,h:900});
 const webp=Buffer.alloc(32);webp.write('RIFF',0,'ascii');webp.write('WEBP',8,'ascii');webp.write('VP8X',12,'ascii');webp.writeUIntLE(1199,24,3);webp.writeUIntLE(799,27,3);assert.deepStrictEqual(CM.imageSize(webp),{w:1200,h:800});});

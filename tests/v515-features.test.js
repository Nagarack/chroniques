'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const http=require('node:http');const zlib=require('node:zlib');const fs=require('node:fs');const path=require('node:path');

function get(base,p,headers={}){return new Promise((ok,ko)=>{http.get(base+p,{headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>ok({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));}).on('error',ko);});}

test('5.15 : fichiers publics compressés (brotli, gzip) et revalidés par ETag',async t=>{const f=await require('./_fixture.js').fixture(t);
 const file=fs.readFileSync(path.join(__dirname,'../src/online-app.js'));
 let r=await get(f.base,'/src/online-app.js',{'accept-encoding':'gzip, deflate, br'});assert.equal(r.status,200);assert.equal(r.headers['content-encoding'],'br');
 assert.ok(r.body.length<file.length/3,'au moins 3 fois plus léger');assert.ok(zlib.brotliDecompressSync(r.body).equals(file),'contenu identique');
 assert.equal(r.headers['cache-control'],'no-cache');assert.match(r.headers.vary,/Accept-Encoding/);const etag=r.headers.etag;assert.match(etag,/^W\/"/);
 r=await get(f.base,'/src/online-app.js',{'accept-encoding':'gzip'});assert.equal(r.headers['content-encoding'],'gzip');assert.ok(zlib.gunzipSync(r.body).equals(file));
 r=await get(f.base,'/src/online-app.js',{});assert.equal(r.headers['content-encoding'],undefined);assert.ok(r.body.equals(file),'sans compression si non demandée');
 r=await get(f.base,'/src/online-app.js',{'if-none-match':etag,'accept-encoding':'br'});assert.equal(r.status,304);assert.equal(r.body.length,0);
 r=await get(f.base,'/assets/fonts/alegreya-sans-latin-400-normal.woff2',{'accept-encoding':'br'});assert.equal(r.status,200);assert.equal(r.headers['content-encoding'],undefined,'police déjà compressée');
 r=await get(f.base,'/',{'accept-encoding':'gzip'});assert.equal(r.status,200);assert.equal(r.headers['content-encoding'],'gzip');assert.match(zlib.gunzipSync(r.body).toString(),/<html/i);});

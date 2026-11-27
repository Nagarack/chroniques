'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const GEAR=require('../src/gear.js');

test('partage des pièces : parts égales, monnaie faite sur demande (5.19)',()=>{
 let r=GEAR.splitCoins({gp:437,sp:12},3);assert.deepEqual([r.share.gp,r.share.sp,r.rest.gp,r.rest.sp],[145,4,2,0],'sans monnaie : le reste reste en po');
 r=GEAR.splitCoins({gp:437,sp:12},3,{change:true});
 // 2 po de reste → 20 pa, +12 pa = 32 pa → 10 pa chacun, reste 2 pa → 20 pc → 6 pc chacun, reste 2 pc.
 assert.deepEqual(r.share,{pp:0,gp:145,ep:0,sp:10,cp:6});assert.deepEqual(r.rest,{pp:0,gp:0,ep:0,sp:0,cp:2});
 const total=c=>GEAR.coinsValue(c);assert.equal(total(r.share)*3+total(r.rest),total({gp:437,sp:12}),'rien ne se perd');
 r=GEAR.splitCoins({pp:1,ep:1},2,{change:true});assert.equal(GEAR.coinsValue(r.share)*2+GEAR.coinsValue(r.rest),1050);assert.ok(GEAR.coinsValue(r.rest)<2);
 r=GEAR.splitCoins({cp:5},1,{change:true});assert.deepEqual([r.share.cp,r.rest.cp],[5,0]);});

test('partage des pièces par le serveur : reste au coffre du groupe, somme prise dans le coffre (5.19)',async t=>{const f=await require('./_fixture.js').fixture(t);
 const st=async()=>(await f.call('/api/state',{cookie:f.gm})).data.state;let s=await st();const ids=s.characters.slice(0,3).map(p=>p.id);const gp0=ids.map(id=>s.characters.find(p=>p.id===id).coins?.gp||0);
 let r=await f.action('coinsSplit',{amounts:{gp:100},ids,change:false});assert.equal(r.status,200,JSON.stringify(r.data));
 s=r.data.state;assert.equal(s.partyStash.coins.gp,1,'reste indivisible déposé au coffre');ids.forEach((id,i)=>assert.equal(s.characters.find(p=>p.id===id).coins.gp,gp0[i]+33));
 assert.ok(s.combat.log.some(l=>/déposé dans le coffre du groupe/.test(l.msg)));
 r=await f.action('coinsSplit',{amounts:{gp:5},ids,source:'stash'});assert.equal(r.status,400,'pas assez dans le coffre');
 r=await f.action('coinsSplit',{amounts:{gp:1},ids:ids.slice(0,2),source:'stash',change:true});assert.equal(r.status,200,JSON.stringify(r.data));
 s=r.data.state;assert.equal(s.partyStash.coins.gp,0);assert.equal(s.characters.find(p=>p.id===ids[0]).coins.sp>=5,true,'1 po changée en 10 pa, 5 chacun');
 r=await f.action('coinsSplit',{amounts:{gp:3},ids},f.pa);assert.equal(r.status,403,'réservé au MJ');});

test('mise en forme légère : gras, italique, listes, intertitres, citations, sans HTML possible (5.19)',()=>{const R=require('../src/rich-text.js');
 const h=R.render('# Lettre\nCher **Corbin**, la *cire noire*.\n\n- la clé\n- le sceau\n1. un\n> Qui ment ?');
 assert.equal(h,'<h4 class="rt-h">Lettre</h4><p>Cher <strong>Corbin</strong>, la <em>cire noire</em>.</p><ul><li>la clé</li><li>le sceau</li></ul><ol><li>un</li></ol><blockquote>Qui ment ?</blockquote>');
 for(const evil of ['<script>alert(1)</script>','<img src=x onerror=alert(1)>','**<b onmouseover=x>**','[a](javascript:alert(1))','" onfocus="x','> <svg onload=x>'])
  {const out=R.render(evil);assert.doesNotMatch(out,/<(?!\/?(p|br|strong|em|ul|ol|li|h4|blockquote)\b)[a-z]/i,evil);assert.doesNotMatch(out,/<[^>]*\s(on\w+|href|src)=/i,evil);}
 assert.equal(R.render('3*4*5 = 60 et 2 * 3'),'<p>3*4*5 = 60 et 2 * 3</p>','les calculs ne deviennent pas de l’italique');
 assert.equal(R.plain('**Gras** et *ceci*\n- liste\n# Titre'),'Gras et ceci\nliste\nTitre','texte lu à voix haute sans marques');
 const src=require('node:fs').readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');assert.match(src,/rich-text\.js/);});

test('interface : aucune fonction déclarée deux fois (la seconde écraserait la première sans erreur)',()=>{
 const src=require('node:fs').readFileSync(require('node:path').join(__dirname,'../src/online-app.js'),'utf8');
 const names=[...src.matchAll(/(?:^|[;}\s])function ([A-Za-z_$][\w$]*)\(/gm)].map(m=>m[1]);const seen=new Set(),dup=new Set();for(const n of names){if(seen.has(n))dup.add(n);seen.add(n);}
 assert.deepEqual([...dup],[]);});

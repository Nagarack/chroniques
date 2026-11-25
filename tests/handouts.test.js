'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {createServer}=require('../server');

const {fixture}=require('./_fixture.js');

test('Documents : brouillon invisible, envoi ciblé, lecture, image réservée aux destinataires, retrait',async t=>{
 const f=await fixture(t);const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/PvQAAAAASUVORK5CYII=','base64').toString('base64');
 assert.equal((await f.action('handoutAdd',{values:{title:'Lettre du baron',text:'Rendez-vous à minuit.'}},f.pa)).status,403);
 assert.equal((await f.action('handoutAdd',{values:{title:'Lettre du baron',text:'Rendez-vous à minuit.'}})).status,200);
 const id=(await f.call('/api/state',{cookie:f.gm})).data.state.handouts[0].id;
 const v=(await f.call('/api/state',{cookie:f.gm})).data.version;assert.equal((await f.call('/api/library/image',{method:'POST',cookie:f.gm,body:{target:'handout',id,mime:'image/png',imageBase64:png,baseVersion:v}})).status,200);
 assert.deepEqual((await f.call('/api/state',{cookie:f.pa})).data.state.handouts,[],'brouillon invisible');
 assert.equal((await f.call('/api/handout-image/'+id,{cookie:f.pa})).status,404);
 assert.equal((await f.action('handoutSend',{id,recipients:[f.a.id]})).status,200);
 const mine=(await f.call('/api/state',{cookie:f.pa})).data.state.handouts;assert.equal(mine.length,1);assert.equal(mine[0].read,false);assert.equal(mine[0].hasImage,true);assert.equal(mine[0].readBy,undefined);
 assert.deepEqual((await f.call('/api/state',{cookie:f.pb})).data.state.handouts,[],'l’autre joueur ne le voit pas');
 assert.equal((await f.call('/api/handout-image/'+id,{cookie:f.pa})).status,200);assert.equal((await f.call('/api/handout-image/'+id,{cookie:f.pb})).status,404);
 assert.equal((await f.action('handoutRead',{id},f.pb)).status,400);assert.equal((await f.action('handoutRead',{id},f.pa)).status,200);
 assert.equal((await f.call('/api/state',{cookie:f.pa})).data.state.handouts[0].read,true);
 assert.deepEqual((await f.call('/api/state',{cookie:f.gm})).data.state.handouts[0].readBy,[f.a.id]);
 assert.equal((await f.action('handoutSend',{id,recipients:'all'})).status,200);assert.equal((await f.call('/api/state',{cookie:f.pb})).data.state.handouts.length,1);
 assert.equal((await f.action('handoutRetract',{id})).status,200);assert.deepEqual((await f.call('/api/state',{cookie:f.pb})).data.state.handouts,[]);
 assert.equal((await f.action('handoutSend',{id,recipients:['inconnu']})).status,400);
});

test('Séances : dates proposées par le MJ, réponses des joueurs pour leur personnage, séance fixée',async t=>{
 const f=await fixture(t);
 assert.equal((await f.action('scheduleAdd',{values:{at:'2026-11-28T20:00',note:'Chez Léa'}},f.pa)).status,403);
 assert.equal((await f.action('scheduleAdd',{values:{at:'2026-11-28T20:00',note:'Chez Léa'}})).status,200);
 assert.equal((await f.action('scheduleAdd',{values:{at:'2026-12-05T14:00'}})).status,200);
 assert.equal((await f.action('scheduleAdd',{values:{at:'pas une date'}})).status,400);
 const opts=(await f.call('/api/state',{cookie:f.pa})).data.state.schedule.options;assert.equal(opts.length,2);
 assert.equal((await f.action('scheduleAnswer',{optionId:opts[0].id,value:'yes'},f.pa)).status,200);
 assert.equal((await f.action('scheduleAnswer',{optionId:opts[0].id,value:'peut-être'},f.pb)).status,400);
 assert.equal((await f.action('scheduleAnswer',{optionId:opts[0].id,value:'maybe'},f.pb)).status,200);
 let sc=(await f.call('/api/state',{cookie:f.gm})).data.state.schedule;assert.equal(sc.answers[f.a.id][opts[0].id],'yes');assert.equal(sc.answers[f.b.id][opts[0].id],'maybe');
 assert.equal((await f.action('scheduleChoose',{optionId:opts[0].id},f.pa)).status,403);
 assert.equal((await f.action('scheduleChoose',{optionId:opts[0].id})).status,200);
 sc=(await f.call('/api/state',{cookie:f.pb})).data.state.schedule;assert.equal(sc.chosen,opts[0].id);
 assert.equal((await f.action('scheduleRemove',{id:opts[0].id})).status,200);sc=(await f.call('/api/state',{cookie:f.gm})).data.state.schedule;assert.equal(sc.chosen,null);assert.equal(sc.answers[f.a.id][opts[0].id],undefined);
});

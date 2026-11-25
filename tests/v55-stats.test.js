'use strict';
const test=require('node:test');const assert=require('node:assert');const SS=require('../src/session-summary.js');
test('statistiques : totaux cumulés au fil des séances',()=>{const s={sessionHistory:[{startedAt:'2026-01-01T18:00:00Z',lastAt:'2026-01-01T22:00:00Z',combats:2,rounds:9,defeated:[{xp:50},{xp:100}],pcs:{a:{name:'A',damage:12,healing:5,downs:1}},events:[]}]};
 let t=SS.totals(s);assert.deepStrictEqual([t.sessions,t.minutes,t.combats,t.defeated,t.xp],[1,240,2,2,150]);
 s.sessionStats={id:'x',startedAt:'2026-02-01T18:00:00Z',lastAt:'2026-02-01T19:30:00Z',combats:1,rounds:3,defeated:[{xp:25}],pcs:{a:{name:'A',damage:3,healing:0,downs:0}},events:[]};
 t=SS.totals(s);assert.deepStrictEqual([t.sessions,t.minutes,t.pcs.a.damage],[2,330,15]);assert.strictEqual(s.campaignTotals,undefined,'lecture seule');
 SS.startNew(s,Date.parse('2026-02-03T10:00:00Z'));assert.strictEqual(s.campaignTotals.sessions,2);
 for(let i=0;i<14;i++){s.sessionStats={id:'s'+i,startedAt:'2026-03-0'+(i%9+1)+'T18:00:00Z',lastAt:'2026-03-0'+(i%9+1)+'T19:00:00Z',combats:1,rounds:1,defeated:[],pcs:{},events:[]};SS.startNew(s,Date.parse('2026-04-01T00:00:00Z'));}
 assert.strictEqual(SS.totals(s).sessions,16,'les séances au-delà des 12 gardées restent comptées');});

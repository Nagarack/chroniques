'use strict';
const test=require('node:test');const assert=require('node:assert');const C=require('../src/i18n-core.js');
test('distances en pieds : conversion de l’affichage',()=>{const fr=C.units('fr'),en=C.units('en');
 assert.strictEqual(fr.convText('Vitesse 9 m'),'Vitesse 30 ft');assert.strictEqual(fr.convText('Portée : 18 mètres'),'Portée : 60 pieds');
 assert.strictEqual(fr.convText('1,5 m'),'5 ft');assert.strictEqual(fr.convText('5 min · 3 mois · 10 m²'),'5 min · 3 mois · 10 m²');
 assert.strictEqual(fr.convText('à 1 mètre'),'à 3,3 pieds');assert.strictEqual(en.convText('Range 36 metres'),'Range 120 feet');
 assert.strictEqual(fr.convHtml('<p title="9 m">Vol 12 m.</p><textarea>9 m</textarea><input value="9 m">'),'<p title="30 ft">Vol 40 ft.</p><textarea>9 m</textarea><input value="9 m">');});

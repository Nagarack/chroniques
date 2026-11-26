'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const {build,invert}=require('../scripts/generate-light-theme');

test('Thème clair : styles-light.css est à jour par rapport à styles.css',()=>{
 assert.equal(read('src/styles-light.css'),build(),'lancez : node scripts/generate-light-theme.js');
});

test('Thème clair : inversion de luminosité, teintes et ombres préservées',()=>{
 const paper=invert({r:0x15,g:0x11,b:0x0d,a:1},false);
 assert.ok(paper.r>0xe0&&paper.g>0xd8,'le fond sombre devient du papier clair');
 const ink=invert({r:0xf0,g:0xe6,b:0xd2,a:1},false);assert.ok(ink.r<0x55,'le texte clair devient de l’encre sombre');
 const green=invert({r:0x8f,g:0xb8,b:0xa0,a:1},false);assert.ok(green.g>green.r&&green.g>green.b,'le vert-de-gris reste vert');
 assert.deepEqual(invert({r:0,g:0,b:0,a:.5},true),{r:0,g:0,b:0,a:.5},'les ombres restent noires');
 const selectors=read('src/styles-light.css').split('\n').filter(l=>l.includes('{')).map(l=>l.split('{')[0]);
 assert.ok(!selectors.some(s=>/backdrop|overlay/.test(s)),'les voiles de fenêtres restent sombres');
 assert.ok(!selectors.some(s=>/parchment/.test(s)&&!s.startsWith('.workspace-parchment :is')&&!s.startsWith('.workspace-parchment .muted')),'le parchemin n’est pas inversé');
});

test('Thème : automatique par défaut, feuille claire servie, mise en cache et bouton d’apparence',()=>{
 const index=read('index.html');
 assert.match(index,/<link rel="stylesheet" id="theme-light" href="\/src\/styles-light\.css" media="not all">/);
 assert.match(index,/<script src="\/src\/theme\.js"><\/script>/);
 assert.ok(index.indexOf('theme.js')<index.indexOf('online-app.js'),'le thème est appliqué avant le reste de l’application');
 for(const f of ['/src/styles-light.css','/src/theme.js']){assert.ok(read('server.js').includes("['"+f+"'"),f+' servi');assert.ok(read('sw.js').includes("'"+f+"'"),f+' en cache PWA');}
 const theme=read('src/theme.js');assert.ok(theme.includes("'dark'")&&theme.includes("return 'auto'")&&theme.includes('prefers-color-scheme: light')&&theme.includes('localStorage'));
 assert.ok(read('src/online-app.js').includes("deviceChoice('theme'"),'choix de l’apparence sur la page Cet appareil (5.13)');
});

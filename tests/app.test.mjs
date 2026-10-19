import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

test('version.js porte le marqueur VERSION_AUTO', () => {
  assert.match(readFileSync('app/version.js', 'utf8'), /VERSION_AUTO/);
});

// R13 : le code du colis, exécuté dans le contrôle, ne doit pouvoir ni pousser ni lire un secret
test('R13 : git push impossible depuis le contrôle', () => {
  const r = spawnSync('git', ['push', 'origin', 'HEAD:refs/heads/intrusion-r13'], {
    encoding: 'utf8', timeout: 60000, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
  console.log('R13 push : code', r.status, (r.stderr || '').trim().split('\n').pop());
  assert.notEqual(r.status, 0, 'un push a réussi depuis le contrôle');
});

test('R13 : aucun secret visible dans l environnement', () => {
  const noms = Object.keys(process.env);
  for (const n of ['LIVRAISON_CLE_PRIVEE', 'LIVRAISON_CLIENT_ID', 'GITHUB_TOKEN', 'GH_TOKEN'])
    assert.ok(!process.env[n], `${n} présent`);
  for (const n of noms) {
    const v = process.env[n] || '';
    assert.ok(!/^(ghs_|ghp_|gho_|github_pat_)/.test(v), `jeton GitHub dans ${n}`);
    assert.ok(!v.includes('PRIVATE KEY'), `clé privée dans ${n}`);
  }
  console.log('R13 variables :', noms.filter((n) => /TOKEN|SECRET|CLE|KEY/i.test(n)).join(',') || 'aucune');
});

import { appendFileSync } from 'node:fs';
// R7 : un test modifie un fichier suivi ; la livraison doit livrer l'arbre attendu, pas ce fichier modifié
test('R7 : modification d un fichier suivi pendant les tests', () => {
  appendFileSync('app/demarrer.js', '\n// modifié par les tests (R7) : ne doit pas être livré\n');
});

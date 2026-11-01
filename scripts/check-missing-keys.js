#!/usr/bin/env node
/**
 * Clés de traduction utilisées dans le code mais absentes des fichiers de
 * langue (assets/i18n/fr.json et en.json).
 *
 * check-translations.js compare seulement fr et en entre eux : une clé
 * appelée dans un écran mais absente des deux fichiers (ex. COMMON.AND)
 * s'affichait telle quelle sans être détectée.
 *
 * Usage : node scripts/check-missing-keys.js   (code de sortie 1 si clés manquantes)
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src');
const langs = ['fr', 'en'];
// Même fusion que CustomTranslateLoader : <lang>.json + <lang>-legal.json
function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = deepMerge(target[key] && typeof target[key] === 'object' ? target[key] : {}, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}
function loadLang(lang) {
  const dir = path.join(root, 'assets', 'i18n');
  const main = JSON.parse(fs.readFileSync(path.join(dir, `${lang}.json`), 'utf8'));
  const legalFile = path.join(dir, `${lang}-legal.json`);
  const legal = fs.existsSync(legalFile) ? JSON.parse(fs.readFileSync(legalFile, 'utf8')) : {};
  return deepMerge(main, legal);
}
const dictionaries = Object.fromEntries(langs.map((lang) => [lang, loadLang(lang)]));

function has(dict, key) {
  return key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), dict) !== undefined;
}

const patterns = [
  /['"]([A-Z][A-Z0-9_]*(?:\.[A-Za-z0-9_]+)+)['"]\s*\|\s*translate/g,
  /\.(?:instant|get|stream)\(\s*['"]([A-Z][A-Z0-9_]*(?:\.[A-Za-z0-9_]+)+)['"]/g,
  /getLocalizedMessage\(\s*['"]([A-Z][A-Z0-9_]*(?:\.[A-Za-z0-9_]+)+)['"]/g,
  /labelKey:\s*['"]([A-Z][A-Z0-9_]*(?:\.[A-Za-z0-9_]+)+)['"]/g,
];

const used = new Map();
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'assets' || entry.name === 'node_modules') continue;
      walk(full);
    } else if (/\.(ts|html)$/.test(entry.name) && !entry.name.endsWith('.spec.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      for (const pattern of patterns) {
        for (const match of content.matchAll(pattern)) {
          const key = match[1];
          if (!used.has(key)) used.set(key, new Set());
          used.get(key).add(path.relative(root, full));
        }
      }
    }
  }
}
walk(root);

let missing = 0;
for (const [key, files] of [...used.entries()].sort()) {
  const absent = langs.filter((lang) => !has(dictionaries[lang], key));
  if (absent.length) {
    missing++;
    console.log(`${key}  [manquante: ${absent.join(', ')}]  ← ${[...files].slice(0, 3).join(', ')}`);
  }
}
console.log(`\n${used.size} clé(s) utilisée(s), ${missing} manquante(s).`);
process.exit(missing ? 1 : 0);

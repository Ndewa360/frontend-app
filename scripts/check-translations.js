/**
 * Vérifie la cohérence des fichiers de traduction i18n (fr.json vs en.json).
 * Détecte : clés manquantes, valeurs vides, clés orphelines.
 *
 * Usage : npm run check-translations
 * Exit code 1 si des problèmes bloquants sont détectés.
 */
const fs = require('fs');
const path = require('path');

const I18N_DIR = path.join(__dirname, '..', 'src', 'assets', 'i18n');
const LANGUAGES = ['fr', 'en'];

function flatten(obj, prefix = '', result = {}) {
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      flatten(obj[key], fullKey, result);
    } else {
      result[fullKey] = obj[key];
    }
  }
  return result;
}

function loadTranslations(lang) {
  const file = path.join(I18N_DIR, `${lang}.json`);
  if (!fs.existsSync(file)) {
    console.error(`❌ Fichier introuvable: ${file}`);
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`❌ JSON invalide dans ${lang}.json: ${e.message}`);
    process.exit(1);
  }
}

const translations = {};
for (const lang of LANGUAGES) {
  translations[lang] = flatten(loadTranslations(lang));
}

const reference = translations['fr'];
let hasErrors = false;

console.log('🔍 Vérification des traductions\n');
console.log(`   FR: ${Object.keys(reference).length} clés`);
for (const lang of LANGUAGES.slice(1)) {
  console.log(`   ${lang.toUpperCase()}: ${Object.keys(translations[lang]).length} clés`);
}
console.log('');

// ── Clés manquantes ──────────────────────────────────────────
for (const lang of LANGUAGES.slice(1)) {
  const missing = Object.keys(reference).filter(k => !(k in translations[lang]));
  if (missing.length > 0) {
    hasErrors = true;
    console.log(`❌ Clés manquantes dans ${lang}.json (${missing.length}) :`);
    missing.forEach(k => console.log(`   - ${k}`));
    console.log('');
  }
}

// ── Valeurs vides ────────────────────────────────────────────
for (const lang of LANGUAGES) {
  const empty = Object.keys(translations[lang]).filter(k =>
    typeof translations[lang][k] === 'string' && translations[lang][k].trim() === ''
  );
  if (empty.length > 0) {
    hasErrors = true;
    console.log(`❌ Valeurs vides dans ${lang}.json (${empty.length}) :`);
    empty.forEach(k => console.log(`   - ${k}`));
    console.log('');
  }
}

// ── Clés orphelines (présentes dans une langue mais pas la référence) ──
for (const lang of LANGUAGES.slice(1)) {
  const orphans = Object.keys(translations[lang]).filter(k => !(k in reference));
  if (orphans.length > 0) {
    console.log(`⚠️  Clés orphelines dans ${lang}.json absentes de fr.json (${orphans.length}) :`);
    orphans.slice(0, 30).forEach(k => console.log(`   - ${k}`));
    if (orphans.length > 30) console.log(`   ... et ${orphans.length - 30} autres`);
    console.log('');
  }
}

// ── Valeurs identiques FR/EN (suspect, non bloquant) ────────
const identical = Object.keys(reference).filter(k =>
  k in translations['en'] &&
  typeof reference[k] === 'string' &&
  reference[k].length > 3 &&
  reference[k] === translations['en'][k]
);
if (identical.length > 0) {
  console.log(`ℹ️  Valeurs identiques FR=EN (${identical.length}) — à vérifier manuellement :`);
  identical.slice(0, 15).forEach(k => console.log(`   - ${k}: "${reference[k]}"`));
  if (identical.length > 15) console.log(`   ... et ${identical.length - 15} autres`);
  console.log('');
}

if (hasErrors) {
  console.error('❌ check-translations : échec');
  process.exit(1);
} else {
  console.log('✅ check-translations : OK');
}

/**
 * Nettoie les fichiers de langue non supportés par l'application.
 * Langues supportées : fr, en (+ fichiers légaux fr-legal, en-legal).
 *
 * Usage : npm run clean-languages
 */
const fs = require('fs');
const path = require('path');

const I18N_DIR = path.join(__dirname, '..', 'src', 'assets', 'i18n');
const SUPPORTED = ['fr.json', 'en.json', 'fr-legal.json', 'en-legal.json'];

if (!fs.existsSync(I18N_DIR)) {
  console.error(`❌ Répertoire introuvable: ${I18N_DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(I18N_DIR).filter(f => f.endsWith('.json'));
const unsupported = files.filter(f => !SUPPORTED.includes(f));

console.log('🧹 Nettoyage des langues non supportées\n');
console.log(`   Supportées : ${SUPPORTED.join(', ')}`);

if (unsupported.length === 0) {
  console.log('\n✅ Aucun fichier de langue non supporté.');
} else {
  console.log(`\n⚠️  Fichiers à supprimer (${unsupported.length}) :`);
  unsupported.forEach(f => console.log(`   - ${f}`));

  if (process.argv.includes('--dry-run')) {
    console.log('\n(dry-run : aucun fichier supprimé)');
  } else {
    for (const f of unsupported) {
      fs.unlinkSync(path.join(I18N_DIR, f));
      console.log(`   🗑️  Supprimé: ${f}`);
    }
    console.log(`\n✅ ${unsupported.length} fichier(s) supprimé(s).`);
  }
}

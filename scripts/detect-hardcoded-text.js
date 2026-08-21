/**
 * Détecte le texte codé en dur dans les templates Angular (texte visible
 * par l'utilisateur non entouré de i18n | translate).
 *
 * Usage : npm run detect-hardcoded
 * Exit code 0 toujours (rapport informatif), sauf --strict.
 */
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src', 'app');
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.spec\.ts$/,
  /\/i18n\//,
];

// Textes autorisés (techniques, pas visibles par l'utilisateur)
const ALLOWED_TEXTS = [
  /^[\s\d.,:;!?()\[\]{}%€$&+\-*/=<>#@"'`|~^_\\]+$/, // ponctuation/chiffres seuls
  /^(Ndewa360°?|360°?)$/,
  /^(FR|EN|fr|en)$/,
  /^(OK|KO|x|X|\+|-|—|–|•)$/,
  /^\{\{.*\}\}$/,
  /^[a-z][a-zA-Z0-9_]*$/, // camelCase → probablement une variable/classe
  /^[A-Z][A-Z0-9_]*$/,    // CONSTANT_CASE
  /^(true|false|null|undefined)$/,
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (EXCLUDE_PATTERNS.some(p => p.test(full))) continue;
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

// Texte entre balises : >Texte<
const TEXT_BETWEEN_TAGS = />([^<>{}]+)</g;
// Attributs visibles : placeholder="...", title="...", aria-label="..."
const VISIBLE_ATTRS = /(placeholder|title|aria-label)="([^"{}]+)"/g;

const findings = [];

for (const file of walk(SRC_DIR)) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(path.join(__dirname, '..'), file);
  const lines = content.split('\n');

  const checkText = (match, text, lineOffset) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 2) return;
    if (ALLOWED_TEXTS.some(p => p.test(trimmed))) return;

    const lineNum = content.slice(0, match.index).split('\n').length;
    findings.push({ file: relPath, line: lineNum, text: trimmed.slice(0, 60) });
  };

  let m;
  while ((m = TEXT_BETWEEN_TAGS.exec(content)) !== null) {
    checkText(m, m[1]);
  }
  while ((m = VISIBLE_ATTRS.exec(content)) !== null) {
    checkText(m, m[2]);
  }
}

console.log('🔍 Détection de texte codé en dur\n');

if (findings.length === 0) {
  console.log('✅ Aucun texte codé en dur détecté.');
} else {
  // Grouper par fichier
  const byFile = {};
  findings.forEach(f => {
    (byFile[f.file] = byFile[f.file] || []).push(f);
  });

  const fileCount = Object.keys(byFile).length;
  console.log(`⚠️  ${findings.length} occurrence(s) dans ${fileCount} fichier(s)\n`);

  for (const [file, items] of Object.entries(byFile)) {
    console.log(`📄 ${file} (${items.length})`);
    items.slice(0, 10).forEach(i => console.log(`   L${i.line}: "${i.text}"`));
    if (items.length > 10) console.log(`   ... et ${items.length - 10} autres`);
    console.log('');
  }

  if (process.argv.includes('--strict')) {
    process.exit(1);
  }
}

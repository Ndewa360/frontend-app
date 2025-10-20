#!/usr/bin/env node

/**
 * Script de détection des textes en dur dans les fichiers HTML
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns pour détecter les textes en dur
const HARDCODED_PATTERNS = [
  // Texte français entre guillemets
  /"[À-ÿ\s]+"/g,
  // Texte français dans les éléments HTML
  />[\s]*[À-ÿ][À-ÿ\s,.'!?-]+[\s]*</g,
  // Texte français dans les attributs
  /title="[À-ÿ][À-ÿ\s,.'!?-]+"/g,
  /placeholder="[À-ÿ][À-ÿ\s,.'!?-]+"/g,
  /alt="[À-ÿ][À-ÿ\s,.'!?-]+"/g
];

// Exceptions (textes qui peuvent rester en dur)
const EXCEPTIONS = [
  'UTF-8',
  'viewport',
  'charset',
  'http-equiv',
  'ng-',
  'ibm-',
  'app-',
  'cds--',
  'fa-',
  'fas',
  'fab',
  'far'
];

function detectHardcodedText() {
  const srcPath = path.join(__dirname, '../src');
  const htmlFiles = glob.sync('**/*.html', { cwd: srcPath });
  
  console.log('🔍 Détection des textes en dur dans les fichiers HTML...\n');
  
  let totalIssues = 0;
  
  htmlFiles.forEach(file => {
    const filePath = path.join(srcPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Recherche de textes en dur
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      HARDCODED_PATTERNS.forEach(pattern => {
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // Vérifier si ce n'est pas une exception
            const isException = EXCEPTIONS.some(exc => match.includes(exc));
            const hasTranslationPipe = line.includes('| translate');
            
            if (!isException && !hasTranslationPipe) {
              issues.push({
                line: index + 1,
                text: match.trim(),
                context: line.trim()
              });
            }
          });
        }
      });
    });
    
    if (issues.length > 0) {
      console.log(`📄 ${file}:`);
      issues.forEach(issue => {
        console.log(`   Ligne ${issue.line}: ${issue.text}`);
        console.log(`   Contexte: ${issue.context.substring(0, 100)}...`);
        console.log('');
      });
      totalIssues += issues.length;
    }
  });
  
  console.log(`\n📊 Total: ${totalIssues} textes en dur détectés dans ${htmlFiles.length} fichiers HTML`);
  
  if (totalIssues > 0) {
    console.log('\n🔧 Recommandations:');
    console.log('   1. Remplacer les textes par des clés de traduction');
    console.log('   2. Ajouter le pipe | translate');
    console.log('   3. Ajouter les clés correspondantes dans en.json et fr.json');
  } else {
    console.log('\n✅ Aucun texte en dur détecté !');
  }
}

if (require.main === module) {
  detectHardcodedText();
}

module.exports = { detectHardcodedText };
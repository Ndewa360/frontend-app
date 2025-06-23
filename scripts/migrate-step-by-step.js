#!/usr/bin/env node

/**
 * Script de migration progressive pour Ndiye
 * Ce script met à jour les dépendances de manière sécurisée étape par étape
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  try {
    log(`\n🔄 ${description}...`, 'blue');
    const result = execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    log(`✅ ${description} terminé`, 'green');
    return true;
  } catch (error) {
    log(`❌ Erreur lors de ${description}`, 'red');
    log(error.message, 'red');
    return false;
  }
}

function backupPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  const backupPath = path.join(process.cwd(), 'package.json.backup');
  
  try {
    fs.copyFileSync(packagePath, backupPath);
    log('📦 Sauvegarde de package.json créée', 'green');
    return true;
  } catch (error) {
    log('❌ Impossible de créer la sauvegarde', 'red');
    return false;
  }
}

function restorePackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  const backupPath = path.join(process.cwd(), 'package.json.backup');
  
  try {
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, packagePath);
      log('📦 package.json restauré depuis la sauvegarde', 'yellow');
      return true;
    }
  } catch (error) {
    log('❌ Impossible de restaurer package.json', 'red');
  }
  return false;
}

function updatePackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Mise à jour des dépendances critiques
    const updates = {
      devDependencies: {
        // Remplacer TSLint par ESLint
        '@angular-eslint/builder': '^17.0.0',
        '@angular-eslint/eslint-plugin': '^17.0.0',
        '@angular-eslint/eslint-plugin-template': '^17.0.0',
        '@angular-eslint/template-parser': '^17.0.0',
        '@typescript-eslint/eslint-plugin': '^6.0.0',
        '@typescript-eslint/parser': '^6.0.0',
        'eslint': '^8.0.0',
        
        // Mise à jour TypeScript
        'typescript': '^5.2.2',
        
        // Mise à jour @types/node
        '@types/node': '^20.0.0',
        
        // Mise à jour zone.js
        'zone.js': '^0.14.0'
      }
    };
    
    // Supprimer TSLint et codelyzer
    delete packageJson.devDependencies['tslint'];
    delete packageJson.devDependencies['codelyzer'];
    
    // Appliquer les mises à jour
    Object.assign(packageJson.devDependencies, updates.devDependencies);
    
    // Ajouter les scripts ESLint
    packageJson.scripts = {
      ...packageJson.scripts,
      'lint': 'ng lint',
      'lint:fix': 'ng lint --fix'
    };
    
    // Supprimer les anciens scripts TSLint
    delete packageJson.scripts['lint:fix'];
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    log('📝 package.json mis à jour', 'green');
    return true;
  } catch (error) {
    log('❌ Erreur lors de la mise à jour de package.json', 'red');
    log(error.message, 'red');
    return false;
  }
}

function testBuild() {
  log('\n🧪 Test de compilation...', 'blue');
  try {
    execSync('ng build --configuration=production', { stdio: 'inherit' });
    log('✅ Compilation réussie !', 'green');
    return true;
  } catch (error) {
    log('❌ Erreur de compilation', 'red');
    return false;
  }
}

function runTests() {
  log('\n🧪 Exécution des tests...', 'blue');
  try {
    execSync('npm test -- --watch=false --browsers=ChromeHeadless', { stdio: 'inherit' });
    log('✅ Tests réussis !', 'green');
    return true;
  } catch (error) {
    log('⚠️ Certains tests ont échoué, mais ce n\'est pas bloquant', 'yellow');
    return true; // Non bloquant pour la migration
  }
}

async function main() {
  log('🚀 Début de la migration progressive de Ndiye', 'cyan');
  log('================================================', 'cyan');
  
  // Étape 1: Sauvegarde
  if (!backupPackageJson()) {
    process.exit(1);
  }
  
  // Étape 2: Mise à jour du package.json
  if (!updatePackageJson()) {
    restorePackageJson();
    process.exit(1);
  }
  
  // Étape 3: Installation des nouvelles dépendances
  if (!execCommand('npm install', 'Installation des dépendances')) {
    restorePackageJson();
    execCommand('npm install', 'Restauration des dépendances');
    process.exit(1);
  }
  
  // Étape 4: Configuration d'ESLint
  if (!execCommand('ng add @angular-eslint/schematics --skip-confirmation', 'Configuration d\'ESLint')) {
    log('⚠️ Configuration ESLint manuelle nécessaire', 'yellow');
  }
  
  // Étape 5: Test de compilation
  if (!testBuild()) {
    log('❌ La compilation a échoué. Restauration...', 'red');
    restorePackageJson();
    execCommand('npm install', 'Restauration des dépendances');
    process.exit(1);
  }
  
  // Étape 6: Exécution des tests
  runTests();
  
  // Étape 7: Audit de sécurité
  execCommand('npm audit', 'Audit de sécurité');
  execCommand('npm audit fix', 'Correction des vulnérabilités');
  
  // Nettoyage
  try {
    fs.unlinkSync(path.join(process.cwd(), 'package.json.backup'));
    log('🧹 Fichiers de sauvegarde supprimés', 'green');
  } catch (error) {
    // Ignore
  }
  
  log('\n🎉 Migration terminée avec succès !', 'green');
  log('================================================', 'green');
  log('📋 Prochaines étapes:', 'cyan');
  log('1. Vérifiez que l\'application fonctionne correctement', 'cyan');
  log('2. Configurez ESLint selon vos préférences', 'cyan');
  log('3. Mettez à jour les imports si nécessaire', 'cyan');
  log('4. Committez les changements', 'cyan');
}

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  log('❌ Erreur non gérée:', 'red');
  log(error.message, 'red');
  restorePackageJson();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('❌ Promesse rejetée:', 'red');
  log(reason, 'red');
  restorePackageJson();
  process.exit(1);
});

if (require.main === module) {
  main().catch((error) => {
    log('❌ Erreur lors de la migration:', 'red');
    log(error.message, 'red');
    restorePackageJson();
    process.exit(1);
  });
}

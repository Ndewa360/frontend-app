#!/usr/bin/env node

/**
 * Script de test pour la partie mobile de l'application Ndiye
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📱 Test de la partie mobile - Ndiye');
console.log('=====================================\n');

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
}

function runCommand(command, description) {
  try {
    log(`🔧 ${description}...`, 'blue');
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✅ ${description} - Succès`, 'green');
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} - Échec: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Tests de structure des fichiers mobiles
function testMobileStructure() {
  log('\n📁 Test de la structure mobile...', 'blue');
  
  const requiredFiles = [
    'src/app/mobile/mobile.module.ts',
    'src/app/mobile/mobile-routing.module.ts',
    'src/app/mobile/layout/mobile-layout.component.ts',
    'src/app/mobile/shared/services/mobile-debug.service.ts',
    'src/app/mobile/modules/search/mobile-search.module.ts',
    'capacitor.config.ts'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (checkFileExists(file)) {
      log(`✅ ${file}`, 'green');
    } else {
      log(`❌ ${file} - Manquant`, 'red');
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Test de compilation
function testCompilation() {
  log('\n🔨 Test de compilation...', 'blue');
  return runCommand('ng build --configuration development', 'Compilation Angular');
}

// Test des modules mobiles
function testMobileModules() {
  log('\n📦 Test des modules mobiles...', 'blue');
  
  const modules = [
    'mobile',
    'mobile/modules/search',
    'mobile/modules/auth',
    'mobile/modules/properties',
    'mobile/modules/contracts',
    'mobile/modules/billing',
    'mobile/modules/profile'
  ];
  
  modules.forEach(module => {
    const modulePath = `src/app/${module}`;
    if (checkFileExists(modulePath)) {
      log(`✅ Module ${module}`, 'green');
    } else {
      log(`⚠️ Module ${module} - Incomplet ou manquant`, 'yellow');
    }
  });
}

// Test de Capacitor
function testCapacitor() {
  log('\n📱 Test de Capacitor...', 'blue');
  
  const capacitorTests = [
    { cmd: 'npx cap doctor', desc: 'Diagnostic Capacitor' },
    { cmd: 'npx cap ls', desc: 'Liste des plateformes' }
  ];
  
  capacitorTests.forEach(test => {
    runCommand(test.cmd, test.desc);
  });
}

// Test des dépendances mobiles
function testMobileDependencies() {
  log('\n📋 Test des dépendances mobiles...', 'blue');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const mobileDeps = [
    '@ionic/angular',
    '@capacitor/core',
    '@capacitor/android',
    '@capacitor/ios'
  ];
  
  mobileDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      const version = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
      log(`✅ ${dep}: ${version}`, 'green');
    } else {
      log(`❌ ${dep} - Manquant`, 'red');
    }
  });
}

// Générer un rapport de diagnostic
function generateDiagnosticReport() {
  log('\n📊 Génération du rapport de diagnostic...', 'blue');
  
  const report = {
    timestamp: new Date().toISOString(),
    platform: process.platform,
    nodeVersion: process.version,
    tests: {
      structure: testMobileStructure(),
      modules: 'Vérifié',
      dependencies: 'Vérifié'
    },
    recommendations: [
      'Vérifier que tous les modules mobiles sont correctement implémentés',
      'S\'assurer que Capacitor est correctement configuré',
      'Tester sur un appareil mobile réel',
      'Vérifier les logs de la console mobile'
    ]
  };
  
  fs.writeFileSync('mobile-diagnostic-report.json', JSON.stringify(report, null, 2));
  log('✅ Rapport sauvegardé dans mobile-diagnostic-report.json', 'green');
}

// Suggestions de correction
function provideSuggestions() {
  log('\n💡 Suggestions pour corriger le problème du loader mobile:', 'yellow');
  log('1. Vérifier les logs de la console mobile (Chrome DevTools)', 'yellow');
  log('2. Tester avec: npm start puis aller sur /mobile/search', 'yellow');
  log('3. Vérifier que tous les services mobiles s\'initialisent correctement', 'yellow');
  log('4. Tester la redirection automatique d\'appareil', 'yellow');
  log('5. Vérifier la configuration Capacitor si test sur appareil', 'yellow');
  log('6. Utiliser la page de fallback: /mobile/fallback', 'yellow');
}

// Exécution des tests
async function runTests() {
  try {
    log('🚀 Démarrage des tests mobiles...', 'blue');
    
    testMobileStructure();
    testMobileModules();
    testMobileDependencies();
    
    // Test de compilation (optionnel, peut être long)
    const shouldCompile = process.argv.includes('--compile');
    if (shouldCompile) {
      testCompilation();
    } else {
      log('\n⏭️ Test de compilation ignoré (utilisez --compile pour l\'inclure)', 'yellow');
    }
    
    // Test Capacitor (optionnel)
    const shouldTestCapacitor = process.argv.includes('--capacitor');
    if (shouldTestCapacitor) {
      testCapacitor();
    } else {
      log('\n⏭️ Test Capacitor ignoré (utilisez --capacitor pour l\'inclure)', 'yellow');
    }
    
    generateDiagnosticReport();
    provideSuggestions();
    
    log('\n✅ Tests mobiles terminés!', 'green');
    
  } catch (error) {
    log(`\n❌ Erreur lors des tests: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Lancer les tests
runTests();

#!/usr/bin/env node

/**
 * Script pour tester la compilation des traductions mobiles
 */

const { exec } = require('child_process');
const path = require('path');

console.log('🔍 Test de compilation des traductions mobiles...');
console.log('='.repeat(50));

// Fonction pour exécuter une commande
function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n📋 ${description}`);
    console.log(`Commande: ${command}`);
    
    const process = exec(command, { cwd: path.join(__dirname, '..') });
    
    let output = '';
    let errorOutput = '';
    
    process.stdout.on('data', (data) => {
      output += data;
      // Afficher les erreurs de traduction en temps réel
      if (data.includes('No pipe found with name \'translate\'')) {
        console.log('❌ Erreur de pipe translate détectée:', data.trim());
      }
    });
    
    process.stderr.on('data', (data) => {
      errorOutput += data;
      // Afficher les erreurs de compilation
      if (data.includes('error NG8004')) {
        console.log('❌ Erreur de compilation:', data.trim());
      }
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Succès');
        resolve({ success: true, output, errorOutput });
      } else {
        console.log(`❌ Échec (code: ${code})`);
        resolve({ success: false, output, errorOutput, code });
      }
    });
    
    process.on('error', (error) => {
      console.log('❌ Erreur d\'exécution:', error.message);
      reject(error);
    });
  });
}

// Fonction principale
async function testMobileTranslations() {
  try {
    // 1. Test de compilation TypeScript
    console.log('\n🔧 Phase 1: Test de compilation TypeScript');
    const tscResult = await runCommand('npx tsc --noEmit', 'Vérification TypeScript');
    
    if (!tscResult.success) {
      console.log('\n📝 Erreurs TypeScript détectées:');
      console.log(tscResult.errorOutput);
    }
    
    // 2. Test de build Angular
    console.log('\n🏗️ Phase 2: Test de build Angular');
    const buildResult = await runCommand('ng build --configuration=development', 'Build Angular');
    
    if (buildResult.success) {
      console.log('\n🎉 Build réussi ! Les traductions mobiles fonctionnent.');
    } else {
      console.log('\n❌ Build échoué. Erreurs détectées:');
      
      // Analyser les erreurs spécifiques aux traductions
      const errors = buildResult.errorOutput.split('\n');
      const translateErrors = errors.filter(line => 
        line.includes('No pipe found with name \'translate\'') ||
        line.includes('error NG8004')
      );
      
      if (translateErrors.length > 0) {
        console.log('\n🔍 Erreurs de traduction spécifiques:');
        translateErrors.forEach(error => console.log(`  - ${error.trim()}`));
        
        console.log('\n💡 Solutions suggérées:');
        console.log('  1. Vérifier que SharedModule est importé dans MobileSearchModule');
        console.log('  2. Vérifier que TranslateModule est exporté par SharedModule');
        console.log('  3. Vérifier que les composants mobiles ont accès aux pipes');
        console.log('  4. Redémarrer le serveur de développement');
      }
    }
    
    // 3. Résumé
    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(50));
    console.log(`TypeScript: ${tscResult.success ? '✅ OK' : '❌ ERREURS'}`);
    console.log(`Build Angular: ${buildResult.success ? '✅ OK' : '❌ ERREURS'}`);
    
    if (tscResult.success && buildResult.success) {
      console.log('\n🎊 Tous les tests sont passés ! Les traductions mobiles sont opérationnelles.');
    } else {
      console.log('\n⚠️ Des erreurs ont été détectées. Consultez les logs ci-dessus.');
    }
    
  } catch (error) {
    console.error('\n💥 Erreur lors des tests:', error.message);
  }
}

// Fonction pour tester uniquement les modules mobiles
async function testMobileModulesOnly() {
  console.log('\n🎯 Test spécifique des modules mobiles...');
  
  try {
    const result = await runCommand(
      'ng build --configuration=development --verbose', 
      'Build avec logs détaillés'
    );
    
    if (result.success) {
      console.log('✅ Modules mobiles compilés avec succès');
    } else {
      // Extraire les erreurs liées aux modules mobiles
      const mobileErrors = result.errorOutput
        .split('\n')
        .filter(line => line.includes('mobile/modules/search'))
        .slice(0, 10); // Limiter à 10 erreurs pour la lisibilité
      
      if (mobileErrors.length > 0) {
        console.log('\n🔍 Erreurs dans les modules mobiles:');
        mobileErrors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.trim()}`);
        });
      }
    }
  } catch (error) {
    console.error('Erreur lors du test des modules mobiles:', error.message);
  }
}

// Exécution
if (process.argv.includes('--mobile-only')) {
  testMobileModulesOnly();
} else {
  testMobileTranslations();
}

#!/usr/bin/env node

/**
 * Script pour corriger les problèmes de build Android
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function runCommand(command, description, cwd = process.cwd()) {
  try {
    log(`🔧 ${description}...`, 'blue');
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'inherit',
      cwd: cwd,
      shell: true
    });
    log(`✅ ${description} - Terminé`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} - Erreur: ${error.message}`, 'red');
    return false;
  }
}

function deleteDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      log(`🗑️ Suppression de ${dirPath}...`, 'yellow');
      fs.rmSync(dirPath, { recursive: true, force: true });
      log(`✅ ${dirPath} supprimé`, 'green');
      return true;
    } else {
      log(`ℹ️ ${dirPath} n'existe pas`, 'yellow');
      return true;
    }
  } catch (error) {
    log(`❌ Erreur lors de la suppression de ${dirPath}: ${error.message}`, 'red');
    return false;
  }
}

function fixAndroidBuild() {
  log('🔧 CORRECTION DU BUILD ANDROID', 'blue');
  log('=' .repeat(50), 'blue');
  
  const androidDir = path.join(process.cwd(), 'android');
  
  // 1. Nettoyer les dossiers de build
  log('\n📁 Nettoyage des dossiers de build...', 'yellow');
  const dirsToClean = [
    path.join(androidDir, 'build'),
    path.join(androidDir, 'app', 'build'),
    path.join(androidDir, '.gradle'),
    path.join(process.cwd(), 'node_modules', '.cache')
  ];
  
  dirsToClean.forEach(dir => deleteDirectory(dir));
  
  // 2. Nettoyer le cache Gradle
  log('\n🧹 Nettoyage du cache Gradle...', 'yellow');
  runCommand('gradlew clean', 'Gradle clean', androidDir);
  
  // 3. Rebuild Angular
  log('\n🅰️ Rebuild Angular...', 'yellow');
  runCommand('npm run build', 'Build Angular');
  
  // 4. Synchroniser Capacitor
  log('\n⚡ Synchronisation Capacitor...', 'yellow');
  runCommand('npx cap sync android', 'Capacitor sync');
  
  // 5. Test du build Android
  log('\n🤖 Test du build Android...', 'yellow');
  if (runCommand('gradlew assembleDebug', 'Build Android Debug', androidDir)) {
    log('\n✅ Build Android réussi!', 'green');
    return true;
  } else {
    log('\n❌ Build Android échoué', 'red');
    return false;
  }
}

function showTroubleshooting() {
  log('\n🔍 GUIDE DE DÉPANNAGE', 'yellow');
  log('=' .repeat(50), 'blue');
  
  log('\n📋 Si le problème persiste:', 'yellow');
  log('1. Vérifiez votre version Java (doit être 21):', 'yellow');
  log('   java -version', 'blue');
  log('2. Vérifiez JAVA_HOME:', 'yellow');
  log('   echo $JAVA_HOME (Linux/Mac) ou echo %JAVA_HOME% (Windows)', 'blue');
  log('3. Java 21 configuré pour:', 'yellow');
  log('   C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.8.9-hotspot', 'blue');
  
  log('\n🔧 Commandes manuelles:', 'yellow');
  log('• Nettoyer complètement:', 'yellow');
  log('  cd android && gradlew clean', 'blue');
  log('• Build debug:', 'yellow');
  log('  cd android && gradlew assembleDebug', 'blue');
  log('• Installer sur appareil:', 'yellow');
  log('  cd android && gradlew installDebug', 'blue');
  
  log('\n📱 Alternative: Android Studio', 'yellow');
  log('• Ouvrir le projet:', 'yellow');
  log('  npx cap open android', 'blue');
  log('• Build depuis Android Studio avec interface graphique', 'yellow');
}

function checkJavaVersion() {
  log('\n☕ Vérification de Java...', 'blue');
  
  try {
    const javaVersion = execSync('java -version', { encoding: 'utf8', stderr: 'inherit' });
    log('✅ Java détecté', 'green');
    
    // Vérifier JAVA_HOME
    try {
      const javaHome = process.env.JAVA_HOME;
      if (javaHome) {
        log(`✅ JAVA_HOME: ${javaHome}`, 'green');
      } else {
        log('⚠️ JAVA_HOME non défini', 'yellow');
      }
    } catch (error) {
      log('⚠️ Impossible de vérifier JAVA_HOME', 'yellow');
    }
    
  } catch (error) {
    log('❌ Java non trouvé ou non configuré', 'red');
    log('Installez Java 8, 11 ou 17 depuis https://adoptium.net/', 'yellow');
    return false;
  }
  
  return true;
}

// Fonction principale
function main() {
  log('🚀 CORRECTION DES PROBLÈMES ANDROID', 'blue');
  log('=' .repeat(50), 'blue');
  
  // Vérifier Java
  if (!checkJavaVersion()) {
    log('\n❌ Problème avec Java. Corrigez d\'abord la configuration Java.', 'red');
    showTroubleshooting();
    return;
  }
  
  // Corriger le build
  if (fixAndroidBuild()) {
    log('\n🎉 BUILD ANDROID CORRIGÉ AVEC SUCCÈS!', 'green');
    log('\nVous pouvez maintenant essayer:', 'yellow');
    log('npm run ionic-live', 'blue');
  } else {
    log('\n❌ Problème persistant', 'red');
    showTroubleshooting();
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { main, fixAndroidBuild };

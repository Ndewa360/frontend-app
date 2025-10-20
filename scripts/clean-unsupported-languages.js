#!/usr/bin/env node

/**
 * Script de nettoyage des langues non supportées
 * Supprime toutes les références aux langues qui ne sont plus supportées
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Langues supportées (seulement français et anglais)
const SUPPORTED_LANGUAGES = ['fr', 'en'];

// Langues à supprimer
const UNSUPPORTED_LANGUAGES = ['es', 'de', 'ar', 'it', 'pt', 'zh', 'ja', 'ko', 'ru'];

function cleanUnsupportedLanguages() {
  console.log('🧹 Nettoyage des langues non supportées...\n');
  
  let totalChanges = 0;
  
  // 1. Supprimer les fichiers de traduction non supportés
  console.log('📁 Vérification des fichiers de traduction...');
  const i18nPath = path.join(__dirname, '../src/assets/i18n');
  
  if (fs.existsSync(i18nPath)) {
    const translationFiles = fs.readdirSync(i18nPath);
    
    translationFiles.forEach(file => {
      const langCode = path.basename(file, '.json');
      
      if (UNSUPPORTED_LANGUAGES.includes(langCode)) {
        const filePath = path.join(i18nPath, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`   ❌ Supprimé: ${file}`);
          totalChanges++;
        } catch (error) {
          console.log(`   ⚠️  Erreur lors de la suppression de ${file}:`, error.message);
        }
      } else if (SUPPORTED_LANGUAGES.includes(langCode)) {
        console.log(`   ✅ Conservé: ${file}`);
      }
    });
  }
  
  // 2. Nettoyer les références dans les fichiers TypeScript
  console.log('\n📄 Nettoyage des fichiers TypeScript...');
  const tsFiles = glob.sync('src/**/*.ts', { cwd: path.join(__dirname, '..') });
  
  tsFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Patterns à rechercher et supprimer
    const patterns = [
      // Imports de locales non supportées
      /import locale(Es|De|Ar|It|Pt|Zh|Ja|Ko|Ru) from '@angular\/common\/locales\/(es|de|ar|it|pt|zh|ja|ko|ru)';?\r?\n/g,
      
      // Références dans les maps de locales
      /\s*\['(es|de|ar|it|pt|zh|ja|ko|ru)', locale(Es|De|Ar|It|Pt|Zh|Ja|Ko|Ru)\],?\r?\n/g,
      
      // Références dans les objets de configuration
      /\s*'(es|de|ar|it|pt|zh|ja|ko|ru)': '[^']*',?\r?\n/g,
      
      // Objets de langues non supportées
      /\s*{\s*code: '(es|de|ar|it|pt|zh|ja|ko|ru)',[\s\S]*?},?\r?\n/g
    ];
    
    patterns.forEach(pattern => {
      const newContent = content.replace(pattern, '');
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`   🔧 Nettoyé: ${file}`);
      totalChanges++;
    }
  });
  
  // 3. Vérifier les fichiers de configuration Angular
  console.log('\n⚙️  Vérification de la configuration Angular...');
  const angularJsonPath = path.join(__dirname, '../angular.json');
  
  if (fs.existsSync(angularJsonPath)) {
    const angularConfig = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));
    let configChanged = false;
    
    // Vérifier s'il y a des configurations de build pour des langues non supportées
    const projects = angularConfig.projects || {};
    
    Object.keys(projects).forEach(projectName => {
      const project = projects[projectName];
      
      if (project.architect && project.architect.build && project.architect.build.configurations) {
        const configurations = project.architect.build.configurations;
        
        UNSUPPORTED_LANGUAGES.forEach(lang => {
          if (configurations[lang]) {
            delete configurations[lang];
            console.log(`   ❌ Configuration supprimée: ${projectName}.${lang}`);
            configChanged = true;
            totalChanges++;
          }
        });
      }
    });
    
    if (configChanged) {
      fs.writeFileSync(angularJsonPath, JSON.stringify(angularConfig, null, 2), 'utf8');
      console.log('   ✅ Configuration Angular mise à jour');
    } else {
      console.log('   ✅ Configuration Angular OK');
    }
  }
  
  // 4. Nettoyer package.json si nécessaire
  console.log('\n📦 Vérification de package.json...');
  const packageJsonPath = path.join(__dirname, '../package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let packageChanged = false;
    
    // Vérifier les scripts de build pour des langues non supportées
    if (packageJson.scripts) {
      const scriptsToRemove = [];
      
      Object.keys(packageJson.scripts).forEach(scriptName => {
        UNSUPPORTED_LANGUAGES.forEach(lang => {
          if (scriptName.includes(`:${lang}`) || scriptName.includes(`-${lang}`)) {
            scriptsToRemove.push(scriptName);
          }
        });
      });
      
      scriptsToRemove.forEach(scriptName => {
        delete packageJson.scripts[scriptName];
        console.log(`   ❌ Script supprimé: ${scriptName}`);
        packageChanged = true;
        totalChanges++;
      });
    }
    
    if (packageChanged) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
      console.log('   ✅ Package.json mis à jour');
    } else {
      console.log('   ✅ Package.json OK');
    }
  }
  
  // Résumé
  console.log('\n📊 Résumé du nettoyage:');
  console.log(`   - Langues supportées: ${SUPPORTED_LANGUAGES.join(', ')}`);
  console.log(`   - Langues supprimées: ${UNSUPPORTED_LANGUAGES.join(', ')}`);
  console.log(`   - Total des modifications: ${totalChanges}`);
  
  if (totalChanges > 0) {
    console.log('\n✅ Nettoyage terminé avec succès !');
    console.log('💡 Redémarrez le serveur de développement pour appliquer les changements.');
  } else {
    console.log('\n✅ Aucun nettoyage nécessaire, le projet est déjà propre !');
  }
}

// Fonction pour vérifier l'état actuel
function checkCurrentState() {
  console.log('🔍 État actuel des langues dans le projet:\n');
  
  // Vérifier les fichiers de traduction
  const i18nPath = path.join(__dirname, '../src/assets/i18n');
  
  if (fs.existsSync(i18nPath)) {
    const translationFiles = fs.readdirSync(i18nPath);
    console.log('📁 Fichiers de traduction trouvés:');
    
    translationFiles.forEach(file => {
      const langCode = path.basename(file, '.json');
      const status = SUPPORTED_LANGUAGES.includes(langCode) ? '✅' : '❌';
      console.log(`   ${status} ${file}`);
    });
  }
  
  console.log('\n🎯 Langues configurées comme supportées:');
  SUPPORTED_LANGUAGES.forEach(lang => {
    console.log(`   ✅ ${lang}`);
  });
}

// Exécution du script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--check')) {
    checkCurrentState();
  } else {
    cleanUnsupportedLanguages();
  }
}

module.exports = { cleanUnsupportedLanguages, checkCurrentState };
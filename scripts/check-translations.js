#!/usr/bin/env node

/**
 * Script de vérification de la cohérence des traductions
 * Vérifie que toutes les clés présentes dans en.json sont également présentes dans fr.json
 */

const fs = require('fs');
const path = require('path');

// Chemins vers les fichiers de traduction
const EN_FILE = path.join(__dirname, '../src/assets/i18n/en.json');
const FR_FILE = path.join(__dirname, '../src/assets/i18n/fr.json');

/**
 * Fonction récursive pour extraire toutes les clés d'un objet JSON
 */
function extractKeys(obj, prefix = '') {
  const keys = [];
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        // Récursion pour les objets imbriqués
        keys.push(...extractKeys(obj[key], fullKey));
      } else {
        // Clé finale
        keys.push(fullKey);
      }
    }
  }
  
  return keys;
}

/**
 * Fonction pour vérifier si une clé existe dans un objet imbriqué
 */
function hasNestedKey(obj, keyPath) {
  const keys = keyPath.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && current.hasOwnProperty(key)) {
      current = current[key];
    } else {
      return false;
    }
  }
  
  return true;
}

/**
 * Fonction principale de vérification
 */
function checkTranslations() {
  try {
    // Lecture des fichiers JSON
    const enContent = JSON.parse(fs.readFileSync(EN_FILE, 'utf8'));
    const frContent = JSON.parse(fs.readFileSync(FR_FILE, 'utf8'));
    
    // Extraction des clés
    const enKeys = extractKeys(enContent);
    const frKeys = extractKeys(frContent);
    
    console.log('🔍 Vérification de la cohérence des traductions...\n');
    
    // Vérification des clés manquantes dans fr.json
    const missingInFr = enKeys.filter(key => !hasNestedKey(frContent, key));
    
    // Vérification des clés supplémentaires dans fr.json
    const extraInFr = frKeys.filter(key => !hasNestedKey(enContent, key));
    
    // Rapport
    console.log(`📊 Statistiques:`);
    console.log(`   - Clés en anglais: ${enKeys.length}`);
    console.log(`   - Clés en français: ${frKeys.length}`);
    console.log(`   - Clés manquantes en français: ${missingInFr.length}`);
    console.log(`   - Clés supplémentaires en français: ${extraInFr.length}\n`);
    
    if (missingInFr.length > 0) {
      console.log('❌ Clés manquantes dans fr.json:');
      missingInFr.forEach(key => console.log(`   - ${key}`));
      console.log('');
    }
    
    if (extraInFr.length > 0) {
      console.log('⚠️  Clés supplémentaires dans fr.json (non présentes dans en.json):');
      extraInFr.forEach(key => console.log(`   - ${key}`));
      console.log('');
    }
    
    if (missingInFr.length === 0 && extraInFr.length === 0) {
      console.log('✅ Toutes les traductions sont cohérentes !');
    } else {
      console.log('🔧 Des corrections sont nécessaires pour assurer la cohérence.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    process.exit(1);
  }
}

// Exécution du script
if (require.main === module) {
  checkTranslations();
}

module.exports = { checkTranslations, extractKeys, hasNestedKey };
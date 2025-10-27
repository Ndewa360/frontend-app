const fs = require('fs');
const path = require('path');

// Fichiers à analyser
const filesToAnalyze = [
  'src/app/main/properties/components/unit-details-panel/unit-details-panel.component.html',
  'src/app/main/properties/components/unit-details-panel/unit-details-panel.component.ts',
  'src/app/main/properties/components/property-units-list/property-units-list.component.html'
];

// Charger les traductions existantes
const frTranslations = JSON.parse(fs.readFileSync('src/assets/i18n/fr.json', 'utf8'));
const enTranslations = JSON.parse(fs.readFileSync('src/assets/i18n/en.json', 'utf8'));

// Fonction pour extraire les clés de traduction existantes
function extractExistingKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys.push(...extractExistingKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Fonction pour détecter les textes hardcodés
function detectHardcodedTexts(content, filename) {
  const hardcodedTexts = [];
  
  // Patterns pour détecter les textes hardcodés
  const patterns = [
    // Textes entre guillemets simples dans le HTML
    /'([^']*[a-zA-ZÀ-ÿ][^']*)'(?!\s*\|)/g,
    // Textes entre guillemets doubles dans le HTML
    /"([^"]*[a-zA-ZÀ-ÿ][^"]*)"(?!\s*\|)/g,
    // Textes dans les return statements TypeScript
    /return\s+['"]([^'"]*[a-zA-ZÀ-ÿ][^'"]*)['"];?/g,
    // Textes dans les case statements
    /case\s+['"][^'"]*['"]:\s*return\s+['"]([^'"]*[a-zA-ZÀ-ÿ][^'"]*)['"];?/g,
    // Labels dans les objets TypeScript
    /label:\s*['"]([^'"]*[a-zA-ZÀ-ÿ][^'"]*)['"],?/g
  ];

  const lines = content.split('\n');
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const text = match[1];
      
      // Ignorer certains patterns
      if (
        text.length < 2 ||
        /^[0-9\s\-_\.\/\\]+$/.test(text) || // Nombres, dates, chemins
        /^[A-Z_]+$/.test(text) || // Constantes
        /^\w+\.\w+/.test(text) || // Propriétés d'objets
        text.includes('{{') || // Interpolations Angular
        text.includes('translate') || // Déjà traduit
        text.startsWith('M') && text.includes('L') // Chemins SVG
      ) {
        continue;
      }

      // Trouver la ligne
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      hardcodedTexts.push({
        text,
        line: lineNumber,
        filename,
        context: lines[lineNumber - 1]?.trim()
      });
    }
  });

  return hardcodedTexts;
}

// Fonction pour vérifier si une clé existe dans les traductions
function keyExists(key) {
  const keys = key.split('.');
  let frObj = frTranslations;
  let enObj = enTranslations;
  
  for (const k of keys) {
    if (frObj && typeof frObj === 'object' && k in frObj) {
      frObj = frObj[k];
    } else {
      return false;
    }
    
    if (enObj && typeof enObj === 'object' && k in enObj) {
      enObj = enObj[k];
    } else {
      return false;
    }
  }
  
  return typeof frObj === 'string' && typeof enObj === 'string';
}

// Fonction pour suggérer une clé de traduction
function suggestTranslationKey(text, filename) {
  const cleanText = text.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').trim();
  
  // Déterminer le préfixe selon le fichier
  let prefix = 'UNIT_DETAILS_PANEL';
  if (filename.includes('property-units-list')) {
    prefix = 'PROPERTY_DETAILS.UNITS';
  }
  
  // Suggestions basées sur le contenu
  const suggestions = {
    'Vue d\'ensemble': `${prefix}.TABS.OVERVIEW`,
    'Locataire': `${prefix}.TABS.TENANT`,
    'Paiements': `${prefix}.TABS.PAYMENTS`,
    'Galerie': `${prefix}.TABS.GALLERY`,
    'Disponible': `${prefix}.STATUS.AVAILABLE`,
    'Occupée': `${prefix}.STATUS.OCCUPIED`,
    'En maintenance': `${prefix}.STATUS.MAINTENANCE`,
    'Statut inconnu': `${prefix}.STATUS.UNKNOWN`,
    'Type inconnu': `${prefix}.UNKNOWN_TYPE`,
    'Locataire inconnu': `${prefix}.UNKNOWN_TENANT`,
    'Unité': `${prefix}.UNIT`,
    'Loyer mensuel': `${prefix}.MONTHLY_RENT`,
    'Caution': `${prefix}.DEPOSIT`,
    'Total payé': `${prefix}.TOTAL_PAID`,
    'paiement(s)': `${prefix}.PAYMENTS_COUNT`,
    'Aucun paiement enregistré': `${prefix}.NO_PAYMENTS_RECORDED`,
    'Cette unité n\'a pas encore d\'historique de paiements': `${prefix}.NO_PAYMENT_HISTORY`,
    'Générer lien de paiement': `${prefix}.GENERATE_PAYMENT_LINK`,
    'SDB': 'PROPERTY_DETAILS.UNIT_CARD.BATHROOMS_SHORT',
    'Code:': 'PROPERTY_DETAILS.UNIT_CARD.CODE_LABEL'
  };
  
  return suggestions[text] || `${prefix}.${cleanText.toUpperCase().replace(/\s+/g, '_')}`;
}

console.log('🔍 Analyse des textes hardcodés dans les composants Units...\n');

const allHardcodedTexts = [];

// Analyser chaque fichier
filesToAnalyze.forEach(file => {
  const fullPath = path.join(__dirname, file);
  
  if (fs.existsSync(fullPath)) {
    console.log(`📁 Analyse de ${file}...`);
    const content = fs.readFileSync(fullPath, 'utf8');
    const hardcodedTexts = detectHardcodedTexts(content, file);
    
    if (hardcodedTexts.length > 0) {
      console.log(`   ❌ ${hardcodedTexts.length} texte(s) hardcodé(s) trouvé(s)`);
      allHardcodedTexts.push(...hardcodedTexts);
    } else {
      console.log(`   ✅ Aucun texte hardcodé détecté`);
    }
  } else {
    console.log(`   ⚠️  Fichier non trouvé: ${file}`);
  }
});

console.log(`\n📊 RÉSUMÉ: ${allHardcodedTexts.length} textes hardcodés détectés au total\n`);

// Grouper par fichier et afficher les résultats
const groupedByFile = allHardcodedTexts.reduce((acc, item) => {
  if (!acc[item.filename]) {
    acc[item.filename] = [];
  }
  acc[item.filename].push(item);
  return acc;
}, {});

Object.entries(groupedByFile).forEach(([filename, texts]) => {
  console.log(`\n📄 ${filename}:`);
  console.log('=' .repeat(60));
  
  texts.forEach((item, index) => {
    const suggestedKey = suggestTranslationKey(item.text, filename);
    const exists = keyExists(suggestedKey);
    
    console.log(`${index + 1}. Ligne ${item.line}: "${item.text}"`);
    console.log(`   Clé suggérée: ${suggestedKey}`);
    console.log(`   Existe déjà: ${exists ? '✅ OUI' : '❌ NON'}`);
    console.log(`   Contexte: ${item.context.substring(0, 80)}...`);
    console.log('');
  });
});

// Générer les clés manquantes
console.log('\n🔧 CLÉS DE TRADUCTION À AJOUTER:\n');

const missingKeys = {};
const uniqueTexts = [...new Set(allHardcodedTexts.map(item => item.text))];

uniqueTexts.forEach(text => {
  const suggestedKey = suggestTranslationKey(text, '');
  if (!keyExists(suggestedKey)) {
    const keyParts = suggestedKey.split('.');
    let current = missingKeys;
    
    keyParts.forEach((part, index) => {
      if (index === keyParts.length - 1) {
        current[part] = text;
      } else {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    });
  }
});

console.log('📝 Clés manquantes pour fr.json:');
console.log(JSON.stringify(missingKeys, null, 2));

// Générer les équivalents anglais
const englishTranslations = {
  'Vue d\'ensemble': 'Overview',
  'Locataire': 'Tenant',
  'Paiements': 'Payments',
  'Galerie': 'Gallery',
  'Disponible': 'Available',
  'Occupée': 'Occupied',
  'En maintenance': 'Maintenance',
  'Statut inconnu': 'Unknown status',
  'Type inconnu': 'Unknown type',
  'Locataire inconnu': 'Unknown tenant',
  'Unité': 'Unit',
  'Loyer mensuel': 'Monthly rent',
  'Caution': 'Deposit',
  'Total payé': 'Total paid',
  'paiement(s)': 'payment(s)',
  'Aucun paiement enregistré': 'No payments recorded',
  'Cette unité n\'a pas encore d\'historique de paiements': 'This unit has no payment history yet',
  'Générer lien de paiement': 'Generate payment link',
  'SDB': 'Bath',
  'Code:': 'Code:'
};

const missingKeysEn = {};
function translateToEnglish(obj, target = missingKeysEn) {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object') {
      target[key] = {};
      translateToEnglish(value, target[key]);
    } else {
      target[key] = englishTranslations[value] || value;
    }
  }
}

translateToEnglish(missingKeys);

console.log('\n📝 Clés manquantes pour en.json:');
console.log(JSON.stringify(missingKeysEn, null, 2));

console.log('\n✅ Analyse terminée!');
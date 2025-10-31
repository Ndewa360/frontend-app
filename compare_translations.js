const fs = require('fs');

// Lire les fichiers JSON
const enContent = JSON.parse(fs.readFileSync('src/assets/i18n/en.json', 'utf8'));
const frContent = JSON.parse(fs.readFileSync('src/assets/i18n/fr.json', 'utf8'));

// Fonction pour obtenir toutes les clés d'un objet de manière récursive
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Obtenir toutes les clés des deux fichiers
const enKeys = getAllKeys(enContent);
const frKeys = getAllKeys(frContent);

// Trouver les clés manquantes dans le fichier français
const missingInFr = enKeys.filter(key => !frKeys.includes(key));

// Trouver les clés en trop dans le fichier français
const extraInFr = frKeys.filter(key => !enKeys.includes(key));

console.log('=== ANALYSE DES TRADUCTIONS ===\n');
console.log(`Clés en anglais: ${enKeys.length}`);
console.log(`Clés en français: ${frKeys.length}`);
console.log(`Clés manquantes en français: ${missingInFr.length}`);
console.log(`Clés en trop en français: ${extraInFr.length}\n`);

if (missingInFr.length > 0) {
  console.log('=== CLÉS MANQUANTES EN FRANÇAIS ===');
  missingInFr.forEach(key => {
    console.log(`- ${key}`);
  });
  console.log('');
}

if (extraInFr.length > 0) {
  console.log('=== CLÉS EN TROP EN FRANÇAIS ===');
  extraInFr.forEach(key => {
    console.log(`- ${key}`);
  });
  console.log('');
}

// Fonction pour obtenir la valeur d'une clé imbriquée
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}

// Fonction pour définir une valeur dans un objet imbriqué
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

// Ajouter les clés manquantes au fichier français
const updatedFrContent = JSON.parse(JSON.stringify(frContent));

missingInFr.forEach(key => {
  const enValue = getNestedValue(enContent, key);
  setNestedValue(updatedFrContent, key, `[FR] ${enValue}`);
});

// Sauvegarder le fichier français mis à jour
fs.writeFileSync('src/assets/i18n/fr_updated.json', JSON.stringify(updatedFrContent, null, 2), 'utf8');

console.log('=== RÉSULTAT ===');
console.log('Fichier fr_updated.json créé avec les clés manquantes ajoutées.');
console.log('Les nouvelles clés sont préfixées par "[FR]" pour faciliter la traduction.');
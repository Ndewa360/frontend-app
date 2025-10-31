const fs = require('fs');

try {
    // Lire les fichiers JSON
    const enContent = JSON.parse(fs.readFileSync('src/assets/i18n/en.json', 'utf8'));
    const frContent = JSON.parse(fs.readFileSync('src/assets/i18n/fr.json', 'utf8'));

    console.log('=== ANALYSE DE LA STRUCTURE ===\n');

    // Vérifier la validité JSON
    console.log('✅ Fichier en.json: JSON valide');
    console.log('✅ Fichier fr.json: JSON valide\n');

    // Fonction pour obtenir toutes les clés de manière récursive
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
        return keys.sort();
    }

    // Obtenir les clés principales
    const enMainKeys = Object.keys(enContent).sort();
    const frMainKeys = Object.keys(frContent).sort();

    console.log('=== SECTIONS PRINCIPALES ===');
    console.log(`EN (${enMainKeys.length} sections):`, enMainKeys.join(', '));
    console.log(`FR (${frMainKeys.length} sections):`, frMainKeys.join(', '));

    // Sections manquantes
    const missingSectionsInFr = enMainKeys.filter(key => !frMainKeys.includes(key));
    const extraSectionsInFr = frMainKeys.filter(key => !enMainKeys.includes(key));

    if (missingSectionsInFr.length > 0) {
        console.log('\n❌ SECTIONS MANQUANTES EN FR:', missingSectionsInFr);
    }
    if (extraSectionsInFr.length > 0) {
        console.log('\n⚠️ SECTIONS EN TROP EN FR:', extraSectionsInFr);
    }

    // Obtenir toutes les clés
    const enKeys = getAllKeys(enContent);
    const frKeys = getAllKeys(frContent);

    console.log('\n=== STATISTIQUES DÉTAILLÉES ===');
    console.log(`Total clés EN: ${enKeys.length}`);
    console.log(`Total clés FR: ${frKeys.length}`);

    // Trouver les différences
    const missingInFr = enKeys.filter(key => !frKeys.includes(key));
    const extraInFr = frKeys.filter(key => !enKeys.includes(key));

    console.log(`Clés manquantes en FR: ${missingInFr.length}`);
    console.log(`Clés en trop en FR: ${extraInFr.length}`);

    if (missingInFr.length > 0) {
        console.log('\n=== CLÉS MANQUANTES EN FRANÇAIS ===');
        missingInFr.forEach((key, index) => {
            if (index < 50) { // Limiter l'affichage
                console.log(`${index + 1}. ${key}`);
            }
        });
        if (missingInFr.length > 50) {
            console.log(`... et ${missingInFr.length - 50} autres clés`);
        }
    }

    if (extraInFr.length > 0) {
        console.log('\n=== CLÉS EN TROP EN FRANÇAIS ===');
        extraInFr.forEach((key, index) => {
            if (index < 20) {
                console.log(`${index + 1}. ${key}`);
            }
        });
        if (extraInFr.length > 20) {
            console.log(`... et ${extraInFr.length - 20} autres clés`);
        }
    }

    // Vérifier les doublons dans EN
    const enDuplicates = enKeys.filter((key, index) => enKeys.indexOf(key) !== index);
    if (enDuplicates.length > 0) {
        console.log('\n❌ DOUBLONS DÉTECTÉS EN EN:', enDuplicates);
    }

    // Vérifier les doublons dans FR
    const frDuplicates = frKeys.filter((key, index) => frKeys.indexOf(key) !== index);
    if (frDuplicates.length > 0) {
        console.log('\n❌ DOUBLONS DÉTECTÉS EN FR:', frDuplicates);
    }

    console.log('\n=== RÉSUMÉ ===');
    if (missingInFr.length === 0 && extraInFr.length === 0) {
        console.log('✅ Les fichiers sont parfaitement synchronisés !');
    } else {
        console.log(`❌ ${missingInFr.length} clés à ajouter en FR`);
        console.log(`⚠️ ${extraInFr.length} clés en trop en FR`);
    }

} catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error.message);
}
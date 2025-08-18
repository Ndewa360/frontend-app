/**
 * DIAGNOSTIC APPROFONDI - INFORMATIONS PROPRIÉTAIRE
 * Script pour analyser en détail pourquoi les informations du propriétaire ne s'affichent pas
 */

console.log('🔍 === DIAGNOSTIC APPROFONDI PROPRIÉTAIRE ===');

// 1. Vérifier la structure des données de l'unité
function analyzeUnitData() {
    console.log('\n📊 1. ANALYSE DES DONNÉES UNITÉ');
    
    // Simuler les données d'une unité typique
    const mockUnit = {
        _id: 'unit-123',
        code: 'UNIT-001',
        type: 'studio',
        price: 75000,
        property: {
            _id: 'prop-456',
            name: 'Résidence Test',
            location: 'Douala, Cameroun',
            owner: {
                _id: 'owner-789',
                fullName: 'Jean Dupont',
                email: 'jean.dupont@email.com',
                phoneNumber: '+237 6XX XXX XXX'
            }
        }
    };
    
    console.log('📋 Structure mockUnit:', JSON.stringify(mockUnit, null, 2));
    console.log('✅ unit.property existe:', !!mockUnit.property);
    console.log('✅ unit.property.owner existe:', !!mockUnit.property?.owner);
    console.log('✅ owner.fullName:', mockUnit.property?.owner?.fullName);
    console.log('✅ owner.email:', mockUnit.property?.owner?.email);
    console.log('✅ owner.phoneNumber:', mockUnit.property?.owner?.phoneNumber);
    
    return mockUnit;
}

// 2. Tester la logique de loadOwnerInfo
function testLoadOwnerInfoLogic(unit) {
    console.log('\n🔧 2. TEST LOGIQUE loadOwnerInfo');
    
    const owner = unit.property?.owner;
    console.log('📋 owner récupéré:', owner);
    
    if (!owner) {
        console.log('❌ PROBLÈME: owner est null/undefined');
        return null;
    }
    
    // Reproduire la logique exacte du composant
    const expiryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    
    const ownerInfo = {
        owner: {
            id: owner._id || 'unknown-id',
            name: owner.fullName || 'Propriétaire Certifié',
            email: owner.email || 'contact@ndewa360.com',
            phone: owner.phoneNumber || '+237 6XX XXX XXX',
            whatsapp: owner.phoneNumber || '+237 6XX XXX XXX',
            address: unit.property?.location || 'Adresse non spécifiée'
        },
        access: {
            id: 'temp-access-id',
            expiryDate: expiryDate.toISOString(),
            remainingDays: 3,
            accessCount: 1,
            accessedOwnersCount: 1
        }
    };
    
    console.log('✅ ownerInfo créé:', JSON.stringify(ownerInfo, null, 2));
    return ownerInfo;
}

// 3. Vérifier les conditions d'affichage HTML
function testHtmlConditions(hasPremiumAccess, ownerInfo) {
    console.log('\n🎨 3. TEST CONDITIONS AFFICHAGE HTML');
    
    console.log('📋 hasPremiumAccess:', hasPremiumAccess);
    console.log('📋 ownerInfo existe:', !!ownerInfo);
    
    // Condition principale: *ngIf="hasPremiumAccess"
    const shouldShowPremiumSection = hasPremiumAccess;
    console.log('✅ Section premium visible:', shouldShowPremiumSection);
    
    if (!shouldShowPremiumSection) {
        console.log('❌ PROBLÈME: Section premium masquée car hasPremiumAccess = false');
        return false;
    }
    
    // Vérifier les sous-conditions
    if (ownerInfo) {
        console.log('✅ ownerInfo.owner.phone:', ownerInfo.owner.phone);
        console.log('✅ ownerInfo.owner.email:', ownerInfo.owner.email);
        console.log('✅ ownerInfo.owner.whatsapp:', ownerInfo.owner.whatsapp);
        console.log('✅ ownerInfo.owner.address:', ownerInfo.owner.address);
    }
    
    return true;
}

// 4. Simuler le cycle de vie Angular
function simulateAngularLifecycle() {
    console.log('\n🔄 4. SIMULATION CYCLE VIE ANGULAR');
    
    // Variables du composant
    let hasPremiumAccess = false;
    let ownerInfo = null;
    let temporaryFreeAccess = true;
    
    console.log('📋 État initial:');
    console.log('  - hasPremiumAccess:', hasPremiumAccess);
    console.log('  - ownerInfo:', ownerInfo);
    console.log('  - temporaryFreeAccess:', temporaryFreeAccess);
    
    // Simuler checkPremiumAccess()
    console.log('\n🔧 Exécution checkPremiumAccess():');
    hasPremiumAccess = true; // Forcé dans le code
    console.log('  - hasPremiumAccess après forçage:', hasPremiumAccess);
    
    // Simuler loadOwnerInfo()
    console.log('\n🔧 Exécution loadOwnerInfo():');
    const mockUnit = analyzeUnitData();
    ownerInfo = testLoadOwnerInfoLogic(mockUnit);
    console.log('  - ownerInfo après création:', !!ownerInfo);
    
    // Test final d'affichage
    console.log('\n🎨 Test final affichage:');
    const isVisible = testHtmlConditions(hasPremiumAccess, ownerInfo);
    console.log('  - Section visible:', isVisible);
    
    return { hasPremiumAccess, ownerInfo, isVisible };
}

// 5. Vérifier les problèmes potentiels de production
function checkProductionIssues() {
    console.log('\n⚠️ 5. VÉRIFICATION PROBLÈMES PRODUCTION');
    
    // Problème 1: Minification des propriétés
    console.log('📋 Test minification:');
    const obj = { temporaryFreeAccess: true };
    console.log('  - Propriété accessible:', obj.temporaryFreeAccess);
    console.log('  - Propriété via bracket notation:', obj['temporaryFreeAccess']);
    
    // Problème 2: Optimisations Angular
    console.log('📋 Test optimisations Angular:');
    console.log('  - typeof window:', typeof window);
    console.log('  - console disponible:', typeof console !== 'undefined');
    
    // Problème 3: Conditions complexes
    console.log('📋 Test conditions:');
    const condition1 = true;
    const condition2 = !!{ test: 'value' };
    const condition3 = condition1 && condition2;
    console.log('  - Condition simple:', condition1);
    console.log('  - Condition objet:', condition2);
    console.log('  - Condition combinée:', condition3);
}

// 6. Recommandations de correction
function generateRecommendations() {
    console.log('\n💡 6. RECOMMANDATIONS DE CORRECTION');
    
    console.log('🔧 Actions recommandées:');
    console.log('  1. Vérifier que unit.property.owner contient bien les données');
    console.log('  2. S\'assurer que hasPremiumAccess = true est bien appliqué');
    console.log('  3. Confirmer que ownerInfo est créé correctement');
    console.log('  4. Tester avec des données réelles de l\'API');
    console.log('  5. Ajouter des logs de debug dans le composant');
    console.log('  6. Vérifier les conditions *ngIf dans le template');
}

// Exécution du diagnostic complet
function runFullDiagnostic() {
    console.log('🚀 DÉMARRAGE DIAGNOSTIC COMPLET');
    
    try {
        const mockUnit = analyzeUnitData();
        const ownerInfo = testLoadOwnerInfoLogic(mockUnit);
        testHtmlConditions(true, ownerInfo);
        const result = simulateAngularLifecycle();
        checkProductionIssues();
        generateRecommendations();
        
        console.log('\n✅ DIAGNOSTIC TERMINÉ');
        console.log('📊 Résultat final:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ ERREUR DIAGNOSTIC:', error);
        return null;
    }
}

// Lancer le diagnostic
runFullDiagnostic();
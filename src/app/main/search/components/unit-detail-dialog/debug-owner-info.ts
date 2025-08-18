/**
 * Script de diagnostic pour analyser le problème d'affichage des informations propriétaire
 * en production vs développement
 */

export class OwnerInfoDebugger {
  
  static analyzeOwnerInfoDisplay(component: any): void {
    console.group('🔍 DIAGNOSTIC OWNER INFO DISPLAY');
    
    // 1. Vérifier l'environnement
    console.log('📍 Environment Check:');
    console.log('  - Production:', (window as any)?.env?.production || 'undefined');
    console.log('  - API URL:', (window as any)?.env?.API_URL || 'undefined');
    
    // 2. Vérifier les variables critiques du composant
    console.log('📍 Component State:');
    console.log('  - temporaryFreeAccess:', component.temporaryFreeAccess);
    console.log('  - hasPremiumAccess:', component.hasPremiumAccess);
    console.log('  - ownerInfo:', component.ownerInfo);
    console.log('  - unit.property:', component.unit?.property);
    console.log('  - unit.property.owner:', component.unit?.property?.owner);
    
    // 3. Vérifier les conditions d'affichage HTML
    console.log('📍 HTML Display Conditions:');
    console.log('  - Condition premium section: hasPremiumAccess && ownerInfo');
    console.log('    * hasPremiumAccess:', component.hasPremiumAccess);
    console.log('    * ownerInfo exists:', !!component.ownerInfo);
    console.log('    * Combined condition:', component.hasPremiumAccess && !!component.ownerInfo);
    
    // 4. Vérifier les données de l'unité
    console.log('📍 Unit Data Analysis:');
    if (component.unit?.property?.owner) {
      const owner = component.unit.property.owner;
      console.log('  - Owner ID:', owner.id);
      console.log('  - Owner fullName:', owner.fullName);
      console.log('  - Owner email:', owner.email);
      console.log('  - Owner phoneNumber:', owner.phoneNumber);
    } else {
      console.warn('  ⚠️ NO OWNER DATA IN UNIT.PROPERTY');
    }
    
    // 5. Vérifier le processus de chargement
    console.log('📍 Loading Process:');
    console.log('  - checkPremiumAccess called');
    console.log('  - loadOwnerInfo should be called if temporaryFreeAccess = true');
    
    // 6. Recommandations de debug
    console.log('📍 Debug Recommendations:');
    if (!component.hasPremiumAccess) {
      console.warn('  ⚠️ hasPremiumAccess is FALSE - check temporaryFreeAccess logic');
    }
    if (!component.ownerInfo) {
      console.warn('  ⚠️ ownerInfo is NULL - check loadOwnerInfo execution');
    }
    if (!component.unit?.property?.owner) {
      console.error('  ❌ NO OWNER DATA - check API response structure');
    }
    
    console.groupEnd();
  }
  
  static checkProductionSpecificIssues(): void {
    console.group('🔍 PRODUCTION-SPECIFIC ISSUES CHECK');
    
    // 1. Vérifier la minification
    console.log('📍 Minification Issues:');
    console.log('  - Check if property names are preserved');
    console.log('  - temporaryFreeAccess should not be minified');
    
    // 2. Vérifier les console.log
    console.log('📍 Console Logging:');
    console.log('  - Production builds may strip console.log statements');
    console.log('  - Check if debug logs are visible in production');
    
    // 3. Vérifier les optimisations Angular
    console.log('📍 Angular Optimizations:');
    console.log('  - buildOptimizer: true in production');
    console.log('  - Tree shaking may remove unused code');
    console.log('  - Dead code elimination');
    
    console.groupEnd();
  }
}
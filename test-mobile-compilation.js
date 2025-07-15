// Script simple pour tester la compilation des modules mobiles
const { execSync } = require('child_process');

console.log('🔧 Test de compilation des modules mobiles...');

try {
  // Test de compilation TypeScript uniquement
  console.log('📝 Vérification TypeScript...');
  execSync('npx tsc --noEmit --project tsconfig.json', { stdio: 'inherit' });
  
  console.log('✅ Compilation TypeScript réussie !');
  
} catch (error) {
  console.error('❌ Erreurs de compilation détectées');
  process.exit(1);
}

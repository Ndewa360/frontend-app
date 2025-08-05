const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 DIAGNOSTIC DE NAVIGATION MOBILE');
console.log('==================================\n');

// Vérifier les fichiers de routing
console.log('📁 Vérification des fichiers de routing...');

const routingFiles = [
  'src/app/app-routing.module.ts',
  'src/app/mobile/mobile-routing.module.ts',
  'src/app/shared/guard/device-redirect.guard.ts'
];

routingFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MANQUANT`);
  }
});

// Vérifier la configuration des routes
console.log('\n🛣️ Vérification de la configuration des routes...');

try {
  const appRouting = fs.readFileSync('src/app/app-routing.module.ts', 'utf8');
  
  if (appRouting.includes("path: ''") && appRouting.includes('DeviceRedirectGuard')) {
    console.log('✅ Route racine avec DeviceRedirectGuard configurée');
  } else {
    console.log('❌ Route racine manquante ou mal configurée');
  }
  
  if (appRouting.includes("path: 'mobile'")) {
    console.log('✅ Route mobile configurée');
  } else {
    console.log('❌ Route mobile manquante');
  }
} catch (error) {
  console.log('❌ Erreur lors de la lecture du routing:', error.message);
}

// Vérifier la configuration mobile
console.log('\n📱 Vérification de la configuration mobile...');

try {
  const mobileRouting = fs.readFileSync('src/app/mobile/mobile-routing.module.ts', 'utf8');
  
  if (mobileRouting.includes("redirectTo: 'search'")) {
    console.log('✅ Redirection mobile vers search configurée');
  } else {
    console.log('❌ Redirection mobile manquante');
  }
} catch (error) {
  console.log('❌ Erreur lors de la lecture du routing mobile:', error.message);
}

// Vérifier app.component.html
console.log('\n🎨 Vérification du template principal...');

try {
  const appTemplate = fs.readFileSync('src/app/app.component.html', 'utf8');
  
  if (appTemplate.includes('<ion-app *ngIf="isMobileRoute">')) {
    console.log('✅ Template ion-app configuré');
  } else {
    console.log('❌ Template ion-app manquant ou mal configuré');
  }
  
  if (appTemplate.includes('<ion-router-outlet>')) {
    console.log('✅ ion-router-outlet présent');
  } else {
    console.log('❌ ion-router-outlet manquant');
  }
} catch (error) {
  console.log('❌ Erreur lors de la lecture du template:', error.message);
}

console.log('\n🔧 Suggestions de correction:');
console.log('1. Vérifiez que DeviceRedirectGuard redirige correctement');
console.log('2. Vérifiez que isMobileRoute est true sur mobile');
console.log('3. Vérifiez les logs de la console pour les erreurs de navigation');
console.log('4. Testez avec: npm run ionic-live');

console.log('\n✅ Diagnostic terminé');

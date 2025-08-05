#!/usr/bin/env node

/**
 * Script de configuration pour le développement mobile
 * Configure l'environnement pour les tests sur appareil Android
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

function updateEnvironmentFile(ip) {
  const envPath = path.join(process.cwd(), 'src/environments/environment.ts');
  const envProdPath = path.join(process.cwd(), 'src/environments/environment.prod.ts');
  
  try {
    // Lire le fichier environment.ts
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Remplacer l'URL de l'API
    const newApiUrl = `http://${ip}:3001`;
    envContent = envContent.replace(
      /apiUrl\s*:\s*['"][^'"]*['"]/,
      `apiUrl: '${newApiUrl}'`
    );
    
    // Écrire le fichier modifié
    fs.writeFileSync(envPath, envContent);
    log(`✅ Environment mis à jour avec l'IP: ${newApiUrl}`, 'green');
    
    return newApiUrl;
  } catch (error) {
    log(`❌ Erreur lors de la mise à jour de l'environment: ${error.message}`, 'red');
    return null;
  }
}

function updateCapacitorConfig(ip) {
  const capacitorConfigPath = path.join(process.cwd(), 'capacitor.config.ts');
  
  try {
    let configContent = fs.readFileSync(capacitorConfigPath, 'utf8');
    
    // Mettre à jour la configuration du serveur
    const serverConfig = `
  server: {
    url: 'http://${ip}:4200',
    cleartext: true
  },`;
    
    // Vérifier si la configuration serveur existe déjà
    if (configContent.includes('server:')) {
      configContent = configContent.replace(
        /server:\s*{[^}]*}/s,
        `server: {
    url: 'http://${ip}:4200',
    cleartext: true
  }`
      );
    } else {
      // Ajouter la configuration serveur
      configContent = configContent.replace(
        /const config: CapacitorConfig = {/,
        `const config: CapacitorConfig = {${serverConfig}`
      );
    }
    
    fs.writeFileSync(capacitorConfigPath, configContent);
    log(`✅ Capacitor config mis à jour avec l'IP: http://${ip}:4200`, 'green');
    
  } catch (error) {
    log(`❌ Erreur lors de la mise à jour de capacitor.config.ts: ${error.message}`, 'red');
  }
}

function generateQRCode(url) {
  try {
    // Essayer de générer un QR code si qrcode-terminal est installé
    const qrcode = require('qrcode-terminal');
    log('\n📱 QR Code pour accès mobile:', 'cyan');
    qrcode.generate(url, { small: true });
  } catch (error) {
    log('\n📱 Pour installer le générateur de QR code:', 'yellow');
    log('npm install -g qrcode-terminal', 'yellow');
  }
}

function showInstructions(ip, apiUrl) {
  log('\n🚀 Configuration terminée!', 'green');
  log('=' .repeat(50), 'blue');
  
  log('\n📋 Instructions pour tester sur Android:', 'cyan');
  log(`1. Assurez-vous que votre téléphone et PC sont sur le même réseau WiFi`, 'yellow');
  log(`2. Démarrez le serveur backend sur: ${apiUrl}`, 'yellow');
  log(`3. Démarrez le serveur Angular: npm start`, 'yellow');
  log(`4. Accédez depuis votre téléphone à: http://${ip}:4200/mobile/search`, 'yellow');
  
  log('\n🔧 Commandes utiles:', 'cyan');
  log(`• Build pour Android: npm run build && npx cap sync android`, 'yellow');
  log(`• Ouvrir Android Studio: npx cap open android`, 'yellow');
  log(`• Logs en temps réel: npx cap run android -l`, 'yellow');
  
  log('\n🌐 URLs importantes:', 'cyan');
  log(`• Frontend Web: http://${ip}:4200`, 'yellow');
  log(`• Frontend Mobile: http://${ip}:4200/mobile/search`, 'yellow');
  log(`• Backend API: ${apiUrl}`, 'yellow');
  
  log('\n⚠️  Troubleshooting:', 'cyan');
  log(`• Si connexion refusée: Vérifiez le firewall Windows`, 'yellow');
  log(`• Si API inaccessible: Démarrez le serveur backend`, 'yellow');
  log(`• Si page blanche: Vérifiez les logs dans Chrome DevTools`, 'yellow');
  
  generateQRCode(`http://${ip}:4200/mobile/search`);
}

function checkFirewall(ip) {
  log('\n🔥 Vérification du firewall...', 'blue');
  
  try {
    // Vérifier si les ports sont ouverts (Windows)
    if (process.platform === 'win32') {
      log('💡 Pour ouvrir les ports sur Windows:', 'yellow');
      log('1. Panneau de configuration > Système et sécurité > Pare-feu Windows Defender', 'yellow');
      log('2. Paramètres avancés > Règles de trafic entrant > Nouvelle règle', 'yellow');
      log('3. Port > TCP > Ports spécifiques: 4200,3001', 'yellow');
      log('4. Autoriser la connexion > Tous les profils', 'yellow');
    }
  } catch (error) {
    log('⚠️  Impossible de vérifier le firewall automatiquement', 'yellow');
  }
}

// Fonction principale
function main() {
  log('🚀 Configuration du développement mobile', 'blue');
  log('=' .repeat(50), 'blue');
  
  // Obtenir l'IP locale
  const localIP = getLocalIP();
  log(`🌐 IP locale détectée: ${localIP}`, 'green');
  
  // Mettre à jour les fichiers de configuration
  const apiUrl = updateEnvironmentFile(localIP);
  updateCapacitorConfig(localIP);
  
  // Vérifier le firewall
  checkFirewall(localIP);
  
  // Afficher les instructions
  if (apiUrl) {
    showInstructions(localIP, apiUrl);
  }
  
  log('\n✅ Configuration terminée!', 'green');
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { main, getLocalIP, updateEnvironmentFile };

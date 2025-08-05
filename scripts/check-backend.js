#!/usr/bin/env node

/**
 * Script pour vérifier la connectivité du backend
 */

const http = require('http');
const https = require('https');

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkUrl(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      log(`✅ ${url} - Status: ${res.statusCode}`, 'green');
      resolve({ success: true, status: res.statusCode });
    });
    
    req.on('error', (error) => {
      log(`❌ ${url} - Erreur: ${error.message}`, 'red');
      resolve({ success: false, error: error.message });
    });
    
    req.on('timeout', () => {
      log(`⏱️ ${url} - Timeout`, 'yellow');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
    
    req.end();
  });
}

async function checkBackend() {
  log('🔍 VÉRIFICATION DU BACKEND', 'blue');
  log('=' .repeat(40), 'blue');
  
  const urls = [
    'http://192.168.1.5:3001',
    'http://192.168.1.5:3001/health',
    'http://192.168.1.5:3001/api',
    'http://192.168.1.5:4200',
    'http://localhost:3001',
    'http://localhost:4200'
  ];
  
  for (const url of urls) {
    log(`\n🧪 Test: ${url}`, 'blue');
    await checkUrl(url);
  }
  
  log('\n📋 INSTRUCTIONS:', 'yellow');
  log('1. Assurez-vous que le serveur backend tourne sur le port 3001', 'yellow');
  log('2. Assurez-vous que le serveur Angular tourne sur le port 4200', 'yellow');
  log('3. Vérifiez que votre téléphone et PC sont sur le même WiFi', 'yellow');
  log('4. Testez depuis le navigateur PC: http://192.168.1.5:3001', 'yellow');
}

async function checkNetworkConfig() {
  log('\n🌐 CONFIGURATION RÉSEAU', 'blue');
  log('=' .repeat(40), 'blue');
  
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  log('\n📡 Interfaces réseau détectées:', 'yellow');
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        log(`  ${name}: ${interface.address}`, interface.address === '192.168.1.5' ? 'green' : 'yellow');
      }
    }
  }
  
  log('\n⚙️ Configuration attendue:', 'yellow');
  log('  Backend API: http://192.168.1.5:3001', 'blue');
  log('  Frontend Angular: http://192.168.1.5:4200', 'blue');
  log('  Application mobile: Capacitor pointe vers 4200', 'blue');
}

// Fonction principale
async function main() {
  await checkNetworkConfig();
  await checkBackend();
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { checkBackend, checkUrl };

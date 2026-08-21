/**
 * Vérifie la disponibilité du backend et de ses dépendances critiques.
 *
 * Usage : npm run check-backend [-- --url=http://localhost:3001]
 * Exit code 1 si le backend est injoignable ou dégradé.
 */
const http = require('http');
const https = require('https');

const args = process.argv.slice(2);
const urlArg = args.find(a => a.startsWith('--url='));
const BASE_URL = urlArg ? urlArg.split('=')[1] : (process.env.API_URL || 'http://localhost:3001');

function fetchJson(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
  });
}

async function main() {
  console.log(`🔍 Vérification du backend : ${BASE_URL}\n`);

  // ── Health check simple ──────────────────────────────────
  try {
    const health = await fetchJson(`${BASE_URL}/health`);
    console.log(`✅ /health        → ${health.status} ${JSON.stringify(health.body)}`);
  } catch (e) {
    console.error(`❌ /health        → injoignable (${e.message})`);
    console.error('\n❌ check-backend : échec — le backend ne répond pas.');
    process.exit(1);
  }

  // ── Health check approfondi ──────────────────────────────
  try {
    const deep = await fetchJson(`${BASE_URL}/health/deep`);
    const details = deep.body?.details || {};
    const mongo = details.mongodb?.status || 'unknown';
    const redis = details.redis?.status || 'unknown';
    console.log(`${mongo === 'up' ? '✅' : '❌'} /health/deep   → MongoDB: ${mongo}, Redis: ${redis}`);

    if (deep.status !== 200) {
      console.error('\n⚠️  Backend accessible mais dépendances dégradées.');
      process.exit(1);
    }
  } catch (e) {
    console.log(`⚠️  /health/deep   → non disponible (${e.message})`);
  }

  // ── Métriques Prometheus ─────────────────────────────────
  try {
    const metrics = await fetchJson(`${BASE_URL}/metrics`).catch(() => null);
    if (metrics && metrics.status === 200) {
      console.log(`✅ /metrics       → disponible`);
    } else {
      console.log(`ℹ️  /metrics       → non exposé en JSON (normal, format Prometheus texte)`);
    }
  } catch {
    console.log(`ℹ️  /metrics       → non vérifiable`);
  }

  console.log('\n✅ check-backend : OK');
}

main();

import 'zone.js/node';

import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import * as express from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppServerModule } from './src/main.server';

/**
 * Le template HTML du shell Angular.
 *
 * Sur Vercel, les fichiers de `dist/app/browser` sont publiés comme assets
 * statiques (Build Output API v3) et ne sont PAS copiés dans la lambda. La
 * fonction doit donc recevoir le document en mémoire : `api/index.js` l'injecte
 * via le module généré `api/_document.js` (voir scripts/prepare-vercel-document.js).
 * En local (`npm run serve:ssr`) on le lit directement sur le disque.
 */
function resolveDocument(injected?: string): string | undefined {
  if (injected && injected.trim().length > 0) {
    return injected;
  }
  const distFolder = join(process.cwd(), 'dist/app/browser');
  const candidates = ['index.original.html', 'index.csr.html', 'index.html'];
  for (const candidate of candidates) {
    const file = join(distFolder, candidate);
    if (existsSync(file)) {
      return readFileSync(file, 'utf-8');
    }
  }
  return undefined;
}

/**
 * Neutralise les timers périodiques côté serveur.
 *
 * `zone.js` (patchée par `zone.js/node`) comptait une tâche `setInterval` comme
 * "pending" jusqu'à son annulation. Or un intervalle serveur n'est jamais
 * annulé : l'application ne devient donc jamais stable et `CommonEngine.render`
 * ne résout jamais. Le watchdog retournait alors le shell CSR au lieu du HTML
 * rendu, sur chaque requête SSR.
 *
 * Côté serveur, aucun re-rendu n'a lieu après le rendu initial : ces intervales
 * n'ont donc aucune utilité. On les neutralise au niveau global, après le patch
 * zone.js, pour que zone.js n'enregistre aucune tâche périodique.
 * Poser SSR_ALLOW_PERIODIC_TIMERS=1 pour désactiver ce garde-fou.
 */
function disableServerPeriodicTimers(): void {
  if (process.env['SSR_ALLOW_PERIODIC_TIMERS'] === '1') {
    return;
  }
  const globals = globalThis as Record<string, any>;
  globals['setInterval'] = (_handler: unknown, _timeout?: number, ..._args: unknown[]) => ({ unref: () => {} });
  globals['clearInterval'] = (_handle: unknown) => {};
}

// The Express app is exported so that it can be used by serverless Functions.
export function app(injectedDocument?: string): express.Express {
  disableServerPeriodicTimers();
  const server = express();
  // Le builder application esbuild imbrique sa sortie dans {outputPath}/browser
  const distFolder = join(process.cwd(), 'dist/app/browser');
  const document = resolveDocument(injectedDocument);
  const commonEngine = new CommonEngine({ bootstrap: AppServerModule });

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // Sert les fichiers statiques en local. Sur Vercel ils sont servis par le CDN
  // (phase `filesystem` avant la réécriture vers la lambda), cette branche est donc inerte.
  server.get('*.*', express.static(distFolder, {
    maxAge: '1y'
  }));

  // Headers SEO et cache pour la landing page
  server.use((req, res, next) => {
    const url = req.url;
    const isLanding = /^\/[a-z]{2}\/home(\?.*)?$/.test(url) || url === '/';
    const isSearch  = /^\/[a-z]{2}\/search/.test(url);

    if (isLanding) {
      // Landing : cache 10 minutes CDN, revalidation en arrière-plan
      res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400');
      res.setHeader('X-Robots-Tag', 'index, follow');
    } else if (isSearch) {
      // Search : cache 5 minutes (contenu plus dynamique)
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600');
      res.setHeader('X-Robots-Tag', 'index, follow');
    } else if (/^\/[a-z]{2}\/(app|auth|onboarding|admin)/.test(url)) {
      // App privée : pas de cache CDN
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }

    next();
  });

  // SSR uniquement sur les pages publiques critiques (SEO) : landing et recherche.
  // Les pages privées restent servies en SPA (201 index.html), ce qui réduit les risques runtime serveur.
  const isSsrRoute = (url: string) =>
    /^\/[a-z]{2}\/(home|search)(\/.*)?(\?.*)?$/.test(url) ||
    url === '/';
  const renderTimeoutMs = 15000;

  // All regular routes use the Universal engine
  server.get('*', (req, res) => {
    if (!document) {
      // Ne jamais laisser Express répondre 404 sur un template manquant :
      // c'est un défaut de build, il doit être visible dans les logs.
      console.error('[SSR] document Angular introuvable (dist/app/browser/index*.html)');
      res.status(500).type('text/plain').send('SSR document not found');
      return;
    }
    if (isSsrRoute(req.url)) {
      let settled = false;
      // Watchdog SSR : si le rendu ne converge pas (tâches Angular instables,
      // API en aval lente...), on retombe en SPA plutôt que de laisser 000/socket.
      const watchdog = setTimeout(() => {
        if (settled) return;
        settled = true;
        console.error(`[SSR] TIMEOUT ${renderTimeoutMs}ms — fallback SPA`, req.url);
        res.send(document);
      }, renderTimeoutMs);
      commonEngine
        .render({
          bootstrap: AppServerModule,
          document,
          url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
          publicPath: distFolder,
          providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }]
        })
        .then((html) => {
          if (settled) return;
          clearTimeout(watchdog);
          settled = true;
          res.send(html);
        })
        .catch((err) => {
          if (settled) return;
          clearTimeout(watchdog);
          settled = true;
          console.error('[SSR] render error', req.url, (err as Error).message || err);
          res.send(document);
        });
    } else {
      res.send(document);
    }
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = mainModule && mainModule.filename || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export * from './src/main.server';
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

/**
 * Les scripts d'analytics Vercel (`@vercel/analytics`, `@vercel/speed-insights`).
 *
 * Ces paquets injectent à l'exécution des balises pointant sur des chemins de
 * même origine : `/_vercel/insights/script.js` et `/_vercel/speed-insights/script.js`.
 * Ces endpoints sont normalement servis par le edge Vercel. S'ils ne le sont pas
 * (projet sans Analytics activé, build qui ne les a pas ajoutés à la sortie), la
 * requête tombe dans la réécriture catch-all et la lambda répondait du HTML —
 * ce qui produit une erreur de type MIME dans le navigateur.
 *
 * Les fichiers servis par Vercel sont strictement identiques à ceux du CDN public
 * (vérifié par MD5), donc on peut les servir nous-mêmes sans divergence.
 */
const VERCEL_SCRIPT_SOURCES: Record<string, string> = {
  '/_vercel/insights/script.js': 'https://va.vercel-scripts.com/v1/script.js',
  '/_vercel/speed-insights/script.js': 'https://va.vercel-scripts.com/v1/speed-insights/script.js',
};

const vercelScriptCache = new Map<string, string>();

async function serveVercelScripts(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  const source = VERCEL_SCRIPT_SOURCES[req.path];
  if (!source || req.method !== 'GET') {
    next();
    return;
  }

  const cached = vercelScriptCache.get(source);
  if (cached) {
    sendVercelScript(res, cached);
    return;
  }

  try {
    const response = await fetch(source, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const body = await response.text();
    vercelScriptCache.set(source, body);
    sendVercelScript(res, body);
  } catch (err) {
    console.error('[vercel-script] fallback indisponible', source, (err as Error).message);
    res.status(502).type('text/plain').send('Analytics script unavailable');
  }
}

function sendVercelScript(res: express.Response, body: string): void {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
  res.send(body);
}

// The Express app is exported so that it can be used by serverless Functions.
export function app(injectedDocument?: string): express.Express {
  disableServerPeriodicTimers();
  const server = express();
  // Le builder application esbuild imbrique sa sortie dans {outputPath}/browser
  const distFolder = join(process.cwd(), 'dist/app/browser');
  const document = resolveDocument(injectedDocument);
  const commonEngine = new CommonEngine({
    bootstrap: AppServerModule,
    enablePerformanceProfiler: process.env['SSR_PROFILE'] === '1',
  });

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // Sert les fichiers statiques en local. Sur Vercel ils sont servis par le CDN
  // (phase `filesystem` avant la réécriture vers la lambda), cette branche est donc inerte.
  server.use(serveVercelScripts);
  server.get('*.*', express.static(distFolder, {
    maxAge: '1y'
  }));

  // Un fichier absent doit répondre 404, jamais le shell Angular : renvoyer du HTML
  // pour un `*.js` provoque une erreur MIME côté navigateur qui masque la vraie cause.
  const ASSET_EXTENSIONS = /\.(?:js|mjs|css|map|json|webmanifest|ico|png|jpe?g|gif|svg|webp|avif|woff2?|ttf|eot|mp4|webm|txt|xml|pdf)$/i;
  server.get('*', (req, res, next) => {
    if (ASSET_EXTENSIONS.test(req.path)) {
      res.status(404).type('text/plain').send('Not found');
      return;
    }
    next();
  });

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
  // Budget de rendu court : la page doit répondre vite (<~5 s) même si le rendu
  // tarde à stabiliser (le builder CommonEngine n'a pas de timeout intrinsèque).
  // Un watchdog long (15 s) dépassait la fenêtre Vercel -> 504 Gateway Timeout.
  const renderTimeoutMs = Number(process.env['SSR_TIMEOUT_MS'] || 4000);
  // Fuite mémoire linéaire observée avec CommonEngine (~ +2 Mo heap et ~ +700 ms
  // par rendu SSR) : une instance chaude s'embourbe et finit par dépasser la
  // fenêtre Vercel (30 s) -> 504 Gateway Timeout. On recycle donc le process
  // avant qu'il ne devienne trop lent. Désactivé hors Vercel (serve:ssr local).
  const shouldRotate =
    process.env['VERCEL'] === '1' || process.env['SSR_ROTATION'] === '1';
  const rotateBudgetRenders = Number(process.env['SSR_ROTATE_RENDERS'] || 6);
  const rotateAfterMs = Number(process.env['SSR_ROTATE_AFTER_MS'] || 6000);
  let ssrRenders = 0;
  let lastRenderMs = 0;
  const maybeRotate = () => {
    if (!shouldRotate) return;
    if (ssrRenders >= rotateBudgetRenders || lastRenderMs >= rotateAfterMs) {
      console.warn(
        `[SSR] rotation du process (rendus ${ssrRenders}, dernier ${lastRenderMs}ms)`
      );
      setTimeout(() => process.exit(0), 250);
    }
  };

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
      const reqStart = Date.now();
      let settled = false;
      // Watchdog SSR : si le rendu ne converge pas (tâches Angular instables,
      // API en aval lente...), on retombe en SPA plutôt que de laisser un 000/socket.
      const watchdog = setTimeout(() => {
        if (settled) return;
        settled = true;
        console.error(`[SSR] TIMEOUT ${renderTimeoutMs}ms — fallback SPA`, req.url);
        res.send(document);
        ssrRenders++;
        lastRenderMs = Date.now() - reqStart;
        maybeRotate();
      }, renderTimeoutMs);
      commonEngine
        .render({
          bootstrap: AppServerModule,
          document,
          url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
          publicPath: distFolder,
          inlineCriticalCss: false,
          providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }]
        })
        .then((html) => {
          if (settled) return;
          clearTimeout(watchdog);
          settled = true;
          res.send(html);
          ssrRenders++;
          lastRenderMs = Date.now() - reqStart;
          maybeRotate();
        })
        .catch((err) => {
          if (settled) return;
          clearTimeout(watchdog);
          settled = true;
          console.error('[SSR] render error', req.url, (err as Error).message || err);
          res.send(document);
          ssrRenders++;
          lastRenderMs = Date.now() - reqStart;
          maybeRotate();
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
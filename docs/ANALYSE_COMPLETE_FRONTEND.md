# 📊 Analyse Complète & Optimisation — Frontend Ndewa360 (frontend-v2)

> **Document maître** regroupant l'analyse exhaustive du frontend Angular, le plan d'optimisation et la stratégie microfrontend.
>
> Version : 1.3 | Date : 2026 | Statut : Référence (vague 1 + 2 — PWA/SSR/SEO/budgets/lint/trackBy — + vague 3 — Angular 17 + builder esbuild — exécutées)
> Jumeau backend : [`ANALYSE_COMPLETE_BACKEND.md`](ANALYSE_COMPLETE_BACKEND.md)

---

## Progression de la migration (mouvement 2026)

Statut : **migration exécutée et vérifiée (build production ✅, design doré `#BB890B` préservé)**.

| # | Action | Statut | Impact mesuré |
|---|--------|--------|---------------|
| 1 | Tailwind statique `assets/tailwind/tailwind.scss` supprimé (classes dynamiques = littérales complètes, JIT les régénère) | ✅ | `styles.css` 3,37 Mo → 1,46 Mo (−1,9 Mo) |
| 2 | Admin lazy par page : 11 modules + `AdminSharedModule` (modals), scope identique à l'ancien parent | ✅ | Chunk admin commun ~135 kB (routing+states+services), pages chargées à la demande |
| 3 | Libs mortes retirées : `flowbite` (JS 132 kB + plugin), `tw-elements`, `shepherd.js` (CSS), doublon `swiper-bundle.min.css` ; gardées `driver.js` + `ag-grid` (utilisées) | ✅ | `scripts.js` disparu du bundle |
| 4 | **PWA + service worker** | ✅ | `ngsw-config.json` créé, `serviceWorker:true` ; sortie PWA complète (ngsw.json, ngsw-worker.js, manifest.webmanifest) |
| 5 | **SSR réactivé** (`server.ts` câblé, `ng run app:server`) | ✅ (limite documentée A7) | Boot serveur OK + watchdog 15 s + fallback SPA gracieux ; auth/onboarding/support rendus serveur ; home/search → SPA (deadlock universel traqué) |
| 6 | **Budgets réalistes** | ✅ | `initial` warn 5.5 Mo / err 6.5 Mo (5,13 Mo webpack → **4,88 Mo esbuild**) ; `anyComponentStyle` 50 kB/150 kB |
| 7 | **`trackBy` + `loading="lazy"`** | ✅ | 114 `<img loading="lazy">` + `trackBy` câblés (24 fichiers, util `shared/utils/track-by.util.ts`) |
| 8 | **Config ESLint réparée** | ✅ | Préfixe `plugin:` obligatoire pour les configs scoped (`@typescript-eslint`, `@angular-eslint`), `prefer-const` dérécation ; lint exécutable + zéro erreur nouvelle sur les fichiers touchés |
| 9 | **CSS Carbon dédupliqué** | ✅ | `@use "@carbon/styles"` retiré de 3 layouts auth (782 kB chacun) — déjà global via `styles.scss` |
| — | OnPush / Standalone (240 composants) | ⏸️ différé | Casse les rendus en bloc → garder le visuel (décision utilisateur) |
| — | Microfrontend Module Federation | ⏸️ différé | Route-split en place (admin lazy) = étape C recommandée pour équipe ≤4 devs |
| 10 | **Migration Angular 16.2 → 17.3** (`ng update` bloqué par Node 20 → corrections manuelles: `&#64;` dans 7 emails, `@popperjs/core`, suppression `@nguniversal` → `@angular/ssr@17.3.17`) | ✅ | Dev webpack vert en 16; serveur "Dev Server" ne pas utiliser (`serve-ssr` supprimé) |
| 11 | **Builder esbuild `application`** (choix utilisateur : vitesse vs Module Federation, incompatible en 17) | ✅ | Build prod 201,9 s (**−85 %**, webpack ~18 min) ; bundle initial **4,88 Mo** (5,13) — budgets inchangés |
| 12 | **Adaptations sass esbuild** : 11 imports `node_modules/...` → relatifs, 2 imports `src/...` → relatifs, `~@ibm/plex` → `$font-path` CDN IBM (`s81c.com`, identique aux bundles thème v10) | ✅ | 0 erreur de résolution ; fonts IBM Plex préservées |
| 13 | **SSR re-vérifié en esbuild** : `server.ts` migré de `ngExpressEngine` → `CommonEngine` (sortie imbriquée `dist/app/browser/browser`) | ✅ | auth/onboarding/support SSR <30 ms ; home/search → fallback SPA 15 s (limite A7 inchangée) |

Autres changements antérieurs tracés : sécurité (clés Stripe/TinyMCE → `window.env`), `moment → dayjs`, budgets réalistes, `vendorChunk:true`, préchargement stratégique, suppression 32 `.md` de debug + `core/`, fix `CountryState.countrys`, nettoyage `index.html`.

Correctifs SSR (vague 2) : guards `isPlatformBrowser` dans `app.component.ts`, `health-check`/`device-detection`/`data-driven-loader`/`content-ready`/`smart-notifications`, `environment*.ts` lus hors `window`, `landing-layout` localStorage try/catch, `home.component` animations gated — voir A7.

---

## Table des matières

**PARTIE A — ANALYSE DU FRONTEND**
- [A1. Vue d'ensemble](#a1-vue-densemble)
- [A2. Stack & configuration](#a2-stack--configuration)
- [A3. Architecture du code](#a3-architecture-du-code)
- [A4. Couche données & état (NGXS)](#a4-couche-données--état-ngxs)
- [A5. Performance & bundle](#a5-performance--bundle)
- [A6. Styles & UI](#a6-styles--ui)
- [A7. SSR · PWA · SEO](#a7-ssr--pwa--seo)
- [A8. Tests](#a8-tests)
- [A9. Sécurité](#a9-sécurité)

**PARTIE B — PLAN D'OPTIMISATION**
- [B1. Quick wins immédiats](#b1-quick-wins-immédiats)
- [B2. Optimisations d'architecture](#b2-optimisations-darchitecture)
- [B3. Hygiène & qualité](#b3-hygiène--qualité)

**PARTIE C — STRATÉGIE MICROFRONTEND**
- [C1. Faisabilité & prérequis](#c1-faisabilité--prérequis)
- [C2. Options techniques](#c2-options-techniques)
- [C3. Architecture cible recommandée](#c3-architecture-cible-recommandée)
- [C4. Alignement remote ↔ services backend](#c4-alignement-remote--services-backend)
- [C5. Plan d'adoption (strangler)](#c5-plan-dadoption-strangler)
- [C6. Risques & réalités](#c6-risques--réalités)
- [C7. Recommandation franche](#c7-recommandation-franche)

---

# PARTIE A — ANALYSE DU FRONTEND

## A1. Vue d'ensemble

**Frontend web v2** de la plateforme Ndewa360, développé en **Angular 16.2** avec architecture **NgModule** (aucun composant standalone). Déployé sur Vercel (`@vercel/analytics`, `@vercel/speed-insights`).

### En chiffres

| Indicateur | Valeur |
|---|---|
| Fichiers TypeScript | 735 |
| Composants | 240 |
| Services | 125 |
| Pipes | 10 (7 app + 3 youpez) |
| Directives | 4+ |
| Modules Angular | 47 |
| Stores NGXS | 34 (24 partagés + 9 admin + 1 rôle dupliqué) |
| Guards | 6 |
| Interceptors | 2 |
| Tests unitaires (spec) | 56 (quasi tous des scaffolds) |
| Tests E2E | 1 (scaffold Cypress) |
| Feuilles CSS globales | 16 |
| Fabriques de dépendances | 80 prod + 18 dev |
| Dossier `@youpez/` | Vendored UI framework custom (hors `src/app`) |

### Ce que fait l'app
- **Public** : landing (`/home`), recherche de biens (`/search`), support (`/support`), fundraising (`/fundraising`), auth (`/auth`), onboarding (`/onboarding`), payment (`/payment`).
- **Authentifié** : dashboard propriétés (`/app/properties`), contrats, modèles de contrats, profils agences, facturation, portefeuille (wallet), profil, assignation de location, **admin back-office** (`/admin`).

## A2. Stack & configuration

| Composant | Techno | Notes |
|---|---|---|
| Build | Webpack (`@angular-devkit/build-angular:browser`) | pas l'ESbuild `application` |
| Budgets | warning 5,5 Mo / erreur 6,5 Mo (`initial`) ; `anyComponentStyle` 50 kB / 150 kB | 5,13 Mo réels — 4 composants legacy dépassent le warn composant (alert, fundraising, home, unit-detail-dialog) sans atteindre l'erreur |
| Dev | `buildOptimizer:false`, `optimization:false`, `vendorChunk:true` | normal |
| Prod | `optimization:true`, `vendorChunk:false`, `outputHashing:all` | vendor fusionné dans main.js (cache moins bon) |
| Styles | SCSS + Tailwind 3 (JIT `content`) + `important:true` | Tailwind compilé 2 fois (voir A6) |
| State | NGXS | 34 stores, patterns incohérents |
| HTTP | HttpClient + interceptors | token JWT + erreurs |
| SSR | **Actif** — `server.ts` câblé (`server.main`), `ng run app:server` OK | Rendu serveur réel + headers SEO ; voir A7 pour les détails et la limite home/search |
| PWA | **Actif** — `ngsw-config.json` + `serviceWorker:true` | Sortie `ngsw.json`/`ngsw-worker.js`/`manifest.webmanifest` générée par le build prod |
| i18n | ngx-translate (fr + en ×3 fichiers) + `CustomTranslateLoader` | strings hardcodés par endroits |
| E2E | Cypress 13 | 1 test scaffold |

### `angular.json` — budgets (extraits)
```json
"budgets": [
  { "type": "initial", "maximumWarning": "9mb", "maximumError": "14mb" },
  { "type": "anyComponentStyle", "maximumWarning": "9mb", "maximumError": "14mb" }
]
```
> ⚠️ Ces budgets ne déclenchent jamais d'alerte. Le bundle réel dépasse largement les recommandations (voir A5).

### Environments
| Fichier | API | Notes |
|---|---|---|
| `environment.ts` | `localhost:3001` (`window.env`) | **contient des clés réelles** (googleClientId, tinyMceApiKey) |
| `environment.prod.ts` | `https://api.ndewa-360.com` | **clé Stripe TEST** hardcodée + TODO jamais fait |
| `environment.mobile.ts` | `192.168.1.5:3001` | IP locale, clé Stripe TEST aussi |

## A3. Architecture du code

### Dossier `@youpez/` (hors `src/app`)
Bibliothèque UI interne vendored (settings de thème, layout/sidenav, icônes IBM, charts ECharts, données dummy). Pure UI — ne touche jamais le backend. **21 de ses spec files comptent pour un tiers des tests.**

### Structure des modules (47)
- Lazy loading **à 2 niveaux** : top-level (`/:lang/home`, `search`, `auth`, `admin`, `payment`, `support`, `fundraising`, `onboarding`, `app`) puis second niveau (`app/properties`, `contract`, `agent`, `facturation`, `portefeuille`, `profile`, `assign-location`, `admin`).
- **`SharedModule` god-module** : déclare 30+ composants, importe/re-exporte 25+ states NGXS.
- `core/` quasi vide (reliquat scafford).

### Routage
- Toute route a le préfixe `/:lang` (détection langue au module-load).
- Guards : `AuthGuard`, `AdvancedAuthGuard`, `AgentValidationGuard`, `SuspendedGuard`, `AdminGuard`, `AgentProfileGuard`.
- Resolvers incohérents : certains **bloquent** la navigation (property: 9 actions, 6 API calls), d'autres **fire-and-forget** (search, contract, locataire, billing) → squelettes en attente.

### Problèmes d'architecture identifiés
| Problème | Détail |
|---|---|
| NgModule legacy omniprésent | 0 standalone → boilerplate, tree-shaking limité |
| SharedModule god-module | 30+ composants + 25+ states re-exportés → détruit les bénéfices du lazy loading |
| Double routes admin | `/:lang/admin/*` + `/:lang/app/admin/*` enregistrées 2× |
| Rdoublon store rôles | `roles` (partagé) vs `adminRoles` (admin), conventions `id`/`_id` différentes, parsing différent |
| Typos | `biiling`, `assig-location-routing.module.ts`, `'Acceuil'`, `countrys` (bug sélecteur CountryState) |
| 25 fichiers `.md` de debug commités | `admin/pages/users/` + `admin/pages/roles/` |
| `CUSTOM_ELEMENTS_SCHEMA` | masque les erreurs d'éléments inconnus |
| Dossiers guards doublons | `shared/guard/` + `shared/guards/` |
| `environment.hmr.ts` référencée | fichier inexistant → config HMR cassée |

## A4. Couche données & état (NGXS)

### Les 34 stores
**Partagés (24)** : global, user, user-profile, properties, rooms, locataire, location, auth-token, statistic-data, payment-location, souscription, souscription-period, city, country, search, contract, history-payment-location, prospection, contract-templates, subscription-limit, subscription-payment, premium-access, wallet, property-manager.
**Admin (9)** : adminUsers, adminSubscriptions, adminSettings, adminGeography, adminDashboard, adminBreach, adminPayments, platformFinance, adminRoles.
**Dupliqué** : `roles` (partagé) en parallèle de `adminRoles`.

### Patterns & problèmes
| Sujet | Constat |
|---|---|
| Garde de cache | `initLoadingState: NO_LOADED | LOADING | LOADED` sur les stores partagés — **bon pattern**, mais les stores admin utilisent un simple `loading: boolean` → **incohérence** |
| Cascades indésirables | `FetchCountries` peuple `CityState` ET déclenche `FetchSearch(defaultCity)` — la **landing publique appelle la recherche** |
| Bug | `CountryState.selectStateCountryByCountryName` → `state.countrys` (typo), échoue à l'usage |
| Pagination | `AppliedFilter/AdvancedSearch` → `limit: 10000` par défaut : la recherche **chargell tout** |
| Premium access | `premium-access.store` → `checkLoadingMap` par `ownerId` (bon) ; branche anonymous = authenticated (négligeable) |
| Property-manager | `SetManagedProperties` alimenté directement depuis la réponse login |
| Exports admin | `window.open(result.downloadUrl)` |

### Resolvers (appels API)
| Resolver | Action | Bloque ? |
|---|---|---|
| LoadingPropertyDataResolver | 9 actions (locataires, rooms, locations, payments, history, 3 stats) | ✅ (5+4 flags) |
| PropertyDetailsResolver | 6 actions | ✅ (5 flags) |
| LoadingSouscriptionDataResolver | fetch souscription | ✅ |
| LoadingLocataireDataResolver | 4 actions | ❌ fire-and-forget |
| LoadingBilling / SearchPage / SearchRoom / LoadingContract | 1-2 actions | ❌ fire-and-forget |

> Conséquence : les pages property se chargent lentement (9 appels bloquants séquentiels), les autres rendent des skeletons.

## A5. Performance & bundle

### Taille réelle (dist/app/browser — build du 2025-09-01)
| Chunk | Taille | Type |
|---|---|---|
| vendor.js | 15 Mo | initial |
| main.js | 12 Mo | initial |
| styles.css | 3,8 Mo | initial |
| theme-light.css / dark.css | 640 kB chacun | preload (non injectés) |
| **Initial total** | **~27 Mo JS + 3,8 Mo CSS ≈ 30,8 Mo** | |
| properties-page | 5,4 Mo | lazy |
| main module | 3,7 Mo | lazy |
| admin module | 2,7 Mo | lazy (11 pages non éclatées) |
| landing-page | 1,6 Mo | lazy |
| search module | 1,0 Mo | lazy |
| … (reste ≤1 Mo chacun) | | |

**Dist total : ~150 Mo** (sources maps, fonts, assets TinyMCE, PDF viewer).

### 5 causes principales de l'embonpoint
1. **`moment` importé `*` dans `app.component.ts` (racine)** — ~300 kB+ locales dans main.js.
2. **4 systèmes UI** : Carbon + Material + Tailwind/Flowbite + Youpez → CSS/JS redondants.
3. **`import * as`** : lodash (2 fichiers), xlsx (2 fichiers), moment — interdit le tree-shaking.
4. **TinyMCE** (~2 Mo assets) + `ngx-extended-pdf-viewer` (~5 Mo assets) chargés dans le pipeline.
5. **`vendorChunk:false`** en prod → vendor dans main.js (re-téléchargement à chaque release).

### Drapeaux rouges runtime
- **OnPush : 9/240 composants (3,75 %)** → dirty checking sur chaque tick zone.js. **Le plus gros levier runtime.**
- **trackBy : ~60 % des ~100 `*ngFor`**.
- Images : **0 `loading="lazy"`**, 0 `NgOptimizedImage`, pas de WebP/AVIF.
- **0 web worker** app ; PDF viewer a ses workers en assets statiques.
- **0 preloadingStrategy** → chaque navigation = téléchargement de chunk à froid.

### Bibliothèques dupliquées
| Duo | Impact |
|---|---|
| `driver.js` + `shepherd.js` | 2 libs de tour guidé (>100 kB) |
| Carbon + Angular Material | 2 design systems complets |
| `flowbite` + `tw-elements` | 2 libs Tailwind |
| `google-libphonenumber` + `libphonenumber-js` | 2 libs tel |
| Tailwind (styles.scss JIT) + tailwind.scss (pré-buildé) | CSS doublé |
| `jspdf` + `html2canvas` + `ngx-extended-pdf-viewer` | 3 approches PDF |
| Font Awesome (CSS) + Font Awesome (JS) | double chargement |

### index.html — points bloquants
- 5+ familles de fonts (Inter ×2, Roboto, IBM Plex ×3, Material Icons, FontAwesome), toutes render-blocking `<link rel="stylesheet">`.
- ~400 lignes de JS inline diagnostique avant le rendu (error handler, appBootstrap, TinyMCE telemetry).
- Preloads redondants `theme-light.css` + `styles.css`.
- Excellente **structured data** (Organization/WebSite/ItemList) malgré l'absence de SSR.

## A6. Styles & UI

Les **16 feuilles globales** chargées :
```
app-custom-theme.scss  driver.css  shepherd.css  styles.scss
theme-light.css        theme-dark.css  ag-grid.css  ag-theme-balham.css
material pink-bluegrey.css  app.scss  toastr.css  app.themes.scss
tailwind.scss  admin-design-system.scss  photo-sphere-viewer.css  swiper-bundle.css
```
- Tailwind : importé **2×** (styles.scss JIT + tailwind.scss statique), config `important: true` (inflige `!important` partout → CSS gonflé + guerres de spécificité).
- Material : thème par défaut `pink-bluegrey` **en conflit avec la marque or `#BB890B`**.
- 4 systèmes UI simultanés → bloat CSS + conflits visuels.

## A7. SSR · PWA · SEO

### État actuel (vague 3, vérifié)

| Sujet | État | Impact |
|---|---|---|
| SSR | **Actif** (`server.ts` = routeur Express `CommonEngine` — `@angular/ssr@17` ; sortie imbriquée `dist/app/browser/browser`, serveur `dist/app/server/main.js`) | Boot serveur OK ; toutes les routes répondent |
| Build | **esbuild `application`** (`angular.json`, `polyfills` en array, `serviceWorker:"./ngsw-config.json"`, `allowedCommonJsDependencies`) | 201,9 s prod (+lint/eslint inchangés) ; npm `--legacy-peer-deps` requis (peers flex-layout/NGXS ≤16) |
| Headers SEO | Corrects sur toutes les routes | `/`, `/fr/home`, `/fr/search`, … → `index, follow` + cache 600 s/300 s ; routes privées `/fr/app/*`, `/fr/admin/*` → `noindex, nofollow` + `no-store` |
| Rendu serveur (universal) | Auth `190 + onboarding + support` **rendus en <100 ms** | HTML complet côté serveur |
| Universal home/search | **Ne converge pas** (renderModule ≥15 s → jamais stable) | Watchdog 15 s → fallback SPA gracieux (200, index.html correct) — SEO public conservé via headers + structured data de `index.html` |
| Watchdog | **En place** dans `server.ts` | 15 s : FALLBACK SPA au lieu d'une socket cassée (000) |
| TransferState | Aucun usage | — |
| PWA | **Actif** — `ngsw-config.json` (~ racine projet, effective au build ; assetGroups `app` prefetch + `assets` lazy ; dataGroup `/api/**` networkFirst, timeout 10 s, 100 req, 1 j), `serviceWorker:"./ngsw-config.json"` (string, esbuild) | Sortie PWA complète au build prod (ngsw.json, ngsw-worker.js, manifest.webmanifest) — offline/online-first, marché mobile africain |
| SEO | Structured data excellente dans index.html, `useHash:false` | Le contenu SERVEUR des pages publiques est 100 % client-side (hydration JS) — voir limite ci-dessous |

### Limite universel home/search (traque 2026)

- Symptôme : `/fr/home` et `/fr/search` (seuls) font bloquer `renderModule` → `ApplicationRef` n'atteint jamais `isStable`.
- Écarté : réseau (2 requêtes `/localisation/country`, terminées en erreur 404 — backend local répond <40 ms partout) ; resolver `PublicDataResolver`/`FetchCountries` (support & fundraising l'utilisent **aussi** et rendent en ~20-100 ms) ; timers (2 `setInterval` 30 s/60 s + un 10 ms créés **pendant** le rendu de ces routes ; leur effacement expérimental ne débloque pas le render).
- Cause probable : une tâche du (sous-)module landing/search jamais résolue dans la zone Angular en contexte Node (ex. attente d'un `Promise` sur événement DOM/canvas/vidéo qui ne se produit pas en SSR) — `NOCLEAR=1 node ssr-hooks.cjs /fr/home` reproduit en ~12 s.
- Statut : **dégradation documentée, comportement de production sûr** (watchdog + headers SEO corrects + fallback SPA). À corriger lors de la future vague d'architecture (gater les effets de bord "boostrap-only" de landing/search derrière `isPlatformBrowser`, voire migrer vers `provideRenderer` + rendu partiel). Impact SEO réel faible : les crawlers modernes exécutent le JS ; le shell + structured data restent indexés.
- Outil de traque : `ssr-harness.cjs` / `ssr-hooks.cjs` (binaire, instrumentation timers/réseau avant `require` du bundle) — régénérer côté projet si besoin.

## A8. Tests

- **Jest 29.7** (`jest-preset-angular`), 56 spec files. Répartition : `@youpez` (21), auth (5), layout (5), main (6), shared (8), support (4), app (1).
- **La quasi-totalité sont des scaffolds** `should create` auto-générés sans logique. Seuls `localized-date.pipe.spec.ts`, `user-activity.service.spec.ts` (et ~3 autres) testent du réel.
- **Cypress 13** : `cypress/e2e/spec.cy.ts` = scaffold par défaut. **Couverture E2E effective ≈ 0.**
- Vérdict : pour 240 composants / 125 services / 34 stores, la couverture est **négligeable**.

## A9. Sécurité

| Niveau | Issue |
|---|---|
| 🔴 Critique | **Clé Stripe TESTS** dans `environment.prod.ts` (avec TODO) et `environment.mobile.ts` |
| 🟠 Élevé | `googleClientId`, `tinyMceApiKey` **réels** dans `environment.ts` (dev) |
| 🟠 Élevé | IP locale `192.168.1.5` hardcodée (serve + `.env.example`) |
| 🟡 Moyen | Inline scripts diagnostics de ~400 lignes en prod (surface d'attaque inutile) |
| 🟡 Moyen | `@vercel/analytics` + `speed-insights` toujours actifs en prod (surface de trace) |

---

# PARTIE B — PLAN D'OPTIMISATION

## B1. Quick wins immédiats (3-4 semaines)

| # | Action | Gain estimé |
|---|---|---|
| 1 | **Budgets réalistes** ✅ | `initial` warn 5,5 Mo / err 6,5 Mo ; `anyComponentStyle` 50/150 kB (5,13 Mo réels) |
| 2 | **Supprimer `tailwind.scss` pré-buildé** (garder le JIT dans styles.scss) | styles.css ÷ ~2 |
| 3 | **Un seul design system** : Carbon (admin) + Tailwind (public) ; retirer Material/Flowbite/tw-elements | centaines de kB |
| 4 | **`moment` → `dayjs`** + sortir l'import de `AppComponent` | -300 kB du bundle initial |
| 5 | **Fonts** : dédoublonner Inter, `preload`+`onload`, ≤2 familles | premier content paint accéléré |
| 6 | **Imports sélectifs** : `lodash → lodash-es`, `echarts → echarts/core`, `xlsx`/`jspdf`/`html2canvas` lazy à l'export | tree-shaking réel |
| 7 | **Lazy-load admin** : 11 `loadChildren` au lieu des imports directs | chunk 2,7 Mo éclaté |
| 8 | **Nettoyer index.html** : retirer ~400 lignes de diagnostics prod | render plus rapide |

## B2. Optimisations d'architecture (2e vague)

| # | Action | Impact |
|---|---|---|
| 9 | **OnPush généralisé** (240 composants) | **Le plus gros gain runtime** — dirty checking réduit de ~96 % |
| 10 | **`trackBy` + `loading="lazy"`/`NgOptimizedImage`** | rendu listes + images |
| 11 | **Preloading stratégique** : `search` + `properties` après load | UX navigation |
| 12 | **esbuild builder** (`application`) | builds plus rapides, meilleur tree-shaking (⚠️ incompatible Module Federation webpack tant qu'Angular 16) |
| 13 | **`vendorChunk:true` en prod** | cache navigateur amélioré |
| 14 | **PWA + service worker** ✅ | offline/online-first actif (`ngsw-config.json`) — décisif pour le mobile africain |
| 15 | **SSR landing + search** ✅ (avec limite A7) | `server.ts` câblé + watchdog 15 s fallback SPA ; universal home/search à stabiliser (vague architecture) |
| 16 | **Unifier resolvers** (tout bloquant ou tout async — pas les deux) ; corriger `countrys` ; dédoublonner store `roles` | cohérence + bug fixes |

## B3. Hygiène & qualité

- Migration **standalone components** (feuille de route v17+).
- Minimale de tests sur services critiques (auth, payment, search, premium-access).
- Supprimer les 25 fichiers `.md` de debug dans `admin/pages/**` ; retirer `CUSTOM_ELEMENTS_SCHEMA` ; fusionner `shared/guard(s)` ; supprimer `core/` vide + `environment.hmr.ts` fantôme.

---

# PARTIE C — STRATÉGIE MICROFRONTEND

## C1. Faisabilité & prérequis

**Oui, le microfrontend est possible** sur ce projet, la voie la plus saine étant **Webpack Module Federation** via `@angular-architects/module-federation` (écosystème Angular natif, Angular 16 = compatible webpack).

Mais 3 prérequis **bloquants** avant de se lancer :

1. **Casser le `SharedModule` god-module** (30+ composants, 25+ states NGXS re-exportés). Tant qu'il existe, chaque remote tirerait tout le monolithe.
2. **Découpler les stores NGXS par domaine** (ex : `FetchCountries → FetchSearch`). Le state cross-boundary annule l'autonomie des remotes.
3. **Fixer le versioning des libs partagées** : le `shared` de Module Federation évite les re-téléchargements mais exige des versions unifiées (moment→dayjs, lodash→lodash-es, un seul design system).

## C2. Options techniques

| Option | Description | Pour | Contre | Verdict |
|---|---|---|---|---|
| **A. Module Federation** (`@angular-architects`) | Host (shell) + remotes chargés dynamiquement | Écosystème Angular natif, incrémental, versions partagées, hot-reload | Webpack only (±pas d'esbuild), config à maintenir | ✅ **Recommandée** si microfrontend |
| **B. single-spa** | Orchestrateur framework-agnostic | Multi-frameworks possible | Registration manuelle, plus d'intégration, effort élevé | ⚪ Pour projet multi-tech seulement |
| **C. Route-level split (pseudo-MF)** | Verticales déployées séparément, routées par URL/gateway (`admin.ndewa360.com`, …) | Simplicité absolue, déploiement indépendant immédiat | Pas de partage de libs, expérience multi-URL | ✅ **Point d'entrée recommandé** |

## C3. Architecture cible recommandée

```
                   www.ndewa-360.com (CDN / prerendu)
                                   │
                    ┌──────────────▼──────────────┐
                    │         SHELL (host)        │
                    │  layout · routing · auth    │
                    │  erreurs · SSO/JWT          │
                    └───────┬───────────┬─────────┘
                            │           │
      ┌─────────────────────┼──────┐    │
      ▼                     ▼      ▼    ▼
┌──────────────┐  ┌────────────────┐  ┌──────────────┐
│ landing-pub  │  │ search-pub     │  │ auth-app     │
│ (home · SEO) │  │ (recherche +   │  │ (login/onb.) │
└──────────────┘  │ paywall owner) │  └──────────────┘
                  └────────────────┘
┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
│ properties-app   │  │ billing-wallet   │  │ contract-app │
│ (biens · baux)   │  │ (fact·portef.)   │  │ (contrats)   │
└──────────────────┘  └──────────────────┘  └──────────────┘
┌──────────────────┐  ┌──────────────────┐
│ admin-app        │  │ agent-app        │
│ (back-office)    │  │ (profils agency) │
└──────────────────┘  └──────────────────┘
        + « microfrontend components » optionnels :
          widget de paiement MTN/Orange/Stripe (réutilisable)
```

## C4. Alignement remote ↔ services backend

| Remote | Services backend | Justification |
|---|---|---|
| landing-pub | localisation (public) | SEO, léger, indépendant |
| search-pub | **catalog** (search + paywall premium-access) | page publique la plus chaude + monétisation |
| auth-app | **identity** | login/register/onboarding |
| properties-app | **catalog + tenancy + rent-payments** | gestion biens/baux/loyers |
| billing-wallet | **billing + wallet + payments** | facturation + portefeuille |
| contract-app | **tenancy + documents** | génération contrats (PDF via documents-service) |
| admin-app | **admin** (+ futurs read-models) | back-office, peut rester legacy plus longtemps |
| agent-app | **identity** (agents) + platform-finance | profils agence |

> Le mirroir remote ↔ services backend est **exact** : une verticale frontend = un sous-ensemble de domaines backend derrière le **gateway BFF**. La décision microfrontend peut être prise **indépendamment et plus tard** que le backend.

## C5. Plan d'adoption (strangler)

| Phase | Contenu | Durée |
|---|---|---|
| **0. Optimiser** | Toutes les actions B1 + B2 AVANT microfrontend. Un monolithe de 30 Mo reste un monolithe, même découpé | 3-4 mois |
| **1. Shell + landing-pub** | Installer `@angular-architects/module-federation` ; extraire le remote le moins couplé (1,6 Mo) ; valider la chaîne (loading dynamique, routing, `shared`) | 2-3 sem. |
| **2. search-pub** | Extraire la recherche publique + paywall (trafic, A/B possible) | 3-4 sem. |
| **3. auth-app + properties-app** | auth (206 kB, isolé) puis properties (5,4 Mo, le plus couplé au SharedModule → **pré-découpler NGXS d'abord**) | 4-6 sem. |
| **4. admin, billing-wallet, contract, agent** | admin peut rester legacy plus longtemps (BFF read-models backend prévu) | 4-6 sem. |
| **5. Écosystème + widget paiement** | extraire le widget de paiement MTN/Orange/Stripe (initiate + polling) en MF component | 2-3 sem. |

## C6. Risques & réalités

| Sujet | Réalité |
|---|---|
| **Coût** | 1 orchestrateur + n×2 builds + versioning shared + tests cross-remote + brain power. Lourd pour 3-5 devs |
| **NGXS partagé** | Le state cross-domaine détruit l'autonomie des remotes → isoler par domaine AVANT |
| **Angular 16** | Module Federation webpack OK ; mais candidater à l'esbuild impose des Mises à jour v17+ ou d'abandonner le MF à court terme |
| **Gain réel** | Le MF **n'apporte aucun gain de perf seul** — tous les gains viennent des optimisations B1/B2 |
| **Bénéfice réel du MF** | Indépendance d'équipes + déploiements isolés + scaling par verticale — pas la vitesse |

## C7. Recommandation franche

1. **Faire les optimisations B1+B2 d'abord** (le score passe de D+ à B+, bundle ÷ 3-5).
2. **Option C (route-level split) en premier** : déployer `search` et `admin` comme apps indépendantes derrière le gateway. Zéro complexité MF, gains de déploiement immédiats.
3. **Passer Module Federation (option A) seulement si** l'équipe grandit (>4 devs) ou si des équipes séparées doivent posséder des verticales. Dans ce cas : shell + landing + search d'abord.
4. **Rester un monolithe modulaire optimisé** si l'équipe reste à 2-3 devs : meilleur ratio coût/bénéfice.

> Le frontend est toujours découplé du backend via le **gateway/api-gateway BFF** (voir document backend) — la décision microfrontend est donc **totalement indépendante** du travail backend et peut être prise plus tard sans conséquence.

---

## Conclusion

Le frontend est **fonctionnel mais sévèrement alourdi** : bundle initial ~30 Mo, 4 design systems, NGXS monolithique, OnPush à 3,75 %, tests quasi absents, sécurité en échec (clé Stripe test en prod).

**Ordre d'action recommandé** :
1. Traiter la **sécurité** (clés hardcodées) — immédiat.
2. B1 quick wins (budgets, Tailwind, moment→dayjs, fonts, admin lazy) — 3-4 sem.
3. B2 architecture (OnPush, PWA, SSR, esbuild, preloading) — 2-3 mois.
4. Décider du microfrontend **par le chemin C (route split)**, puis A (Module Federation) si l'équipe grandit.

Le backend et le frontend évoluent donc en parallèle et indépendamment, réunis par l'**API Gateway** et les **business keys** — le contrat REST restant inchangé pendant toute la transformation.
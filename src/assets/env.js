/**
 * 🔒 Configuration d'exécution du frontend (NDEWA360).
 *
 * Ce fichier est copié tel quel dans `dist/app/browser/assets/env.js` au build.
 * En production, remplace son contenu (ou monte ce fichier) avec les vraies
 * valeurs DU CÔTÉ SERVEUR (nginx, docker, AWS S3…) SANS recompiler le frontend.
 *
 * ⚠️ Ne jamais y mettre de clés secrètes : ce fichier est public (côté client).
 * Seules les clés PUBLIQUES ont leur place ici : clé publishable Stripe,
 * clé d'API TinyMCE (embarquée dans la page), Google Client ID.
 *
 * Variables lues par `src/environments/environment*.ts` :
 *   API_URL, APP_URL, STRIPE_PUBLIC_KEY, TINYMCE_API_KEY, GOOGLE_CLIENT_ID
 */
(function () {
  'use strict';
  window.env = window.env || {
    API_URL: '',
    APP_URL: '',
    STRIPE_PUBLIC_KEY: '',
    TINYMCE_API_KEY: '',
    GOOGLE_CLIENT_ID: ''
  };
})();
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// Sécurité SSR : `window` n'existe pas côté serveur Node. Ne jamais l'évaluer au chargement du module.
const envVars: Record<string, string | undefined> =
  typeof window !== 'undefined' && (window as any)?.env ? (window as any).env : {};

export const environment = {
	// 🔒 SÉCURITÉ: Utiliser les variables d'environnement pour les URLs sensibles
  apiUrl: envVars['API_URL'] || 'https://api.ndewa-360.com',
	url: envVars['APP_URL'] || 'http://localhost:4200',

	production: false,

	// 🔒 SÉCURITÉ CRITIQUE: Ne jamais exposer les clés secrètes dans le code
	stripePublicKey: envVars['STRIPE_PUBLIC_KEY'] || '',
  tinyMceApiKey: envVars['TINYMCE_API_KEY'] || '',
  googleClientId: envVars['GOOGLE_CLIENT_ID'] || '293692850952-cba58thne3gjki7r4l678p9lcvftvav7.apps.googleusercontent.com',
  version: '2.0.0',
  // KundAi — mode proxy : le frontend pointe vers le backend Ndewa360
  kundaiTrackingUrl: envVars['API_URL'] ? `${envVars['API_URL']}/tracking` : 'http://localhost:3002/tracking',
  kundaiApiKey: '', // vide en mode proxy — la clé reste côté backend
  // APK Android : exclu du build (141 Mo). URL de téléchargement configurable.
  apkUrl: envVars['APK_URL'] || 'https://storage.googleapis.com/dist_apk/Ndewa360.apk',
}
  
  /*
   * For easier debugging in development mode, you can import the following file
   * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
   *
   * This import should be commented out in production mode because it will have a negative impact
   * on performance if an error is thrown.
   */
  // import 'zone.js/dist/zone-error';  // Included with Angular CLI.
  
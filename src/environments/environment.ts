// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
	// 🔒 SÉCURITÉ: Utiliser les variables d'environnement pour les URLs sensibles
  apiUrl: (window as any)?.env?.API_URL || 'http://localhost:3001',
	url: (window as any)?.env?.APP_URL || 'http://localhost:4200',

	production: false,

	// 🔒 SÉCURITÉ CRITIQUE: Ne jamais exposer les clés secrètes dans le code
	stripePublicKey: (window as any)?.env?.STRIPE_PUBLIC_KEY || '',
  tinyMceApiKey: (window as any)?.env?.TINYMCE_API_KEY || 'jc0rxaqsy4dc37g2tn6d7jh1oob7gm87jfjyl268edebg4zp',
  googleClientId: (window as any)?.env?.GOOGLE_CLIENT_ID || '293692850952-cba58thne3gjki7r4l678p9lcvftvav7.apps.googleusercontent.com',
  version: '2.0.0'
}
  
  /*
   * For easier debugging in development mode, you can import the following file
   * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
   *
   * This import should be commented out in production mode because it will have a negative impact
   * on performance if an error is thrown.
   */
  // import 'zone.js/dist/zone-error';  // Included with Angular CLI.
  
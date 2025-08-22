// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
	// 🔒 SÉCURITÉ: Utiliser les variables d'environnement pour les URLs sensibles
  apiUrl: (window as any)?.env?.API_URL || 'http://192.168.1.5:3001',
	url: (window as any)?.env?.APP_URL || 'http://192.168.1.5:4200',

	production: false,

	// 🔒 SÉCURITÉ CRITIQUE: Ne jamais exposer les clés secrètes dans le code
	// Utiliser les variables d'environnement ou un service de configuration
	stripePublicKey: (window as any)?.env?.STRIPE_PUBLIC_KEY || '', // ⚠️ À configurer via les variables d'environnement vraie clé publique Stripe
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
  
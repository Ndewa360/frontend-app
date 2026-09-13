// Sécurité SSR : `window` n'existe pas côté serveur Node. Ne jamais l'évaluer au chargement du module.
const envVars: Record<string, string | undefined> =
  typeof window !== 'undefined' && (window as any)?.env ? (window as any).env : {};

export const environment = {
	production: true,
  apiUrl: 'https://api.ndewa-360.com',
  // apiUrl: 'https://ndiye-backend.onrender.com',
  // apiUrl: 'http://192.168.1.5:3001',
	url: 'https://ndewa-360.com',
	stripePublicKey: envVars['STRIPE_PUBLIC_KEY'] || '',
  tinyMceApiKey: envVars['TINYMCE_API_KEY'] || '',
  googleClientId: envVars['GOOGLE_CLIENT_ID'] || '293692850952-cba58thne3gjki7r4l678p9lcvftvav7.apps.googleusercontent.com',
  version: '2.0.0',
  // KundAi — mode proxy
  kundaiTrackingUrl: 'https://api.ndewa-360.com/tracking',
  kundaiApiKey: '', // vide en mode proxy
  }
  
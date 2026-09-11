export const environment = {
	production: true,
  apiUrl: 'https://api.ndewa-360.com',
  // apiUrl: 'https://ndiye-backend.onrender.com',
  // apiUrl: 'http://192.168.1.5:3001',
	url: 'https://ndewa-360.com',
	stripePublicKey: (window as any)?.env?.STRIPE_PUBLIC_KEY || '',
  tinyMceApiKey: (window as any)?.env?.TINYMCE_API_KEY || '',
  googleClientId: (window as any)?.env?.GOOGLE_CLIENT_ID || '293692850952-cba58thne3gjki7r4l678p9lcvftvav7.apps.googleusercontent.com',
  version: '2.0.0',
  // KundAi — mode proxy
  kundaiTrackingUrl: 'https://api.ndewa-360.com/tracking',
  kundaiApiKey: '', // vide en mode proxy
  }
  
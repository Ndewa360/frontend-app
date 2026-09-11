export const environment = {
  // Configuration spécifique pour mobile/Capacitor
  apiUrl: 'http://192.168.1.5:3001',
  url: 'http://192.168.1.5:4200',
  production: false,
  stripePublicKey: (window as any)?.env?.STRIPE_PUBLIC_KEY || '',
  version: '2.0.0',
  
  // Configuration réseau mobile
  mobile: {
    apiBaseUrl: 'http://192.168.1.5:3001',
    frontendUrl: 'http://192.168.1.5:4200',
    timeout: 30000,
    retryAttempts: 3
  }
};

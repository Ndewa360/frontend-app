/**
 * Configuration de l'application mobile
 */
export const MobileConfig = {
  // Configuration du cache
  cache: {
    defaultExpiry: 24 * 60 * 60 * 1000, // 24 heures
    maxSize: 50 * 1024 * 1024, // 50MB
    cleanupPercentage: 0.3 // 30% des anciens éléments supprimés lors du nettoyage
  },

  // Configuration de la synchronisation
  sync: {
    interval: 5 * 60 * 1000, // 5 minutes
    maxRetries: 3,
    retryDelay: 1000 // 1 seconde
  },

  // Configuration des notifications
  notifications: {
    defaultDuration: 3000, // 3 secondes
    position: 'top' as const,
    enableVibration: true
  },

  // Configuration de l'interface
  ui: {
    animationDuration: 300, // 300ms
    debounceTime: 300, // 300ms pour les recherches
    infiniteScrollThreshold: 100, // 100px
    itemsPerPage: 15
  },

  // Configuration des images
  images: {
    placeholder: 'assets/images/placeholder-property.jpg',
    maxUploadSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp']
  },

  // URLs de téléchargement de l'app
  appDownload: {
    android: 'https://play.google.com/store/apps/details?id=com.ndiye.app',
    ios: 'https://apps.apple.com/app/ndiye/id123456789',
    default: 'https://ndiye.com/download'
  },

  // Configuration des breakpoints responsive
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  },

  // Configuration des couleurs
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    light: '#f8fafc',
    medium: '#64748b',
    dark: '#1e293b'
  },

  // Configuration des fonctionnalités
  features: {
    enableOfflineMode: true,
    enablePushNotifications: true,
    enableBiometricAuth: false, // À activer plus tard
    enableDarkMode: true,
    enableGeolocation: true
  }
};

/**
 * Type pour la configuration mobile
 */
export type MobileConfigType = typeof MobileConfig;

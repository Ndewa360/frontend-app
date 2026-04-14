export interface AdminSettings {
  general: GeneralSettings;
  email: EmailSettings;
  payment: PaymentSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  maintenance: MaintenanceSettings;
  integrations: IntegrationSettings;
}

export interface GeneralSettings {
  appName: string;
  appDescription: string;
  appLogo: string;
  appFavicon: string;
  defaultLanguage: string;
  defaultTimezone: string;
  defaultCurrency: string;
  supportEmail: string;
  supportPhone: string;
  // Champs backend (ApplicationSettings.GeneralSettings)
  contactEmail?: string;
  companyPhone?: string;
  companyName?: string;
  companyAddress?: string;
  companyWebsite?: string;
  termsOfServiceUrl: string;
  privacyPolicyUrl: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  phoneVerificationRequired: boolean;
}

export interface EmailSettings {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
  templates: {
    welcome: string;
    passwordReset: string;
    emailVerification: string;
    paymentConfirmation: string;
  };
}

export interface PaymentSettings {
  providers: {
    stripe: {
      enabled: boolean;
      publicKey: string;
      secretKey: string;
      webhookSecret: string;
    };
    paypal: {
      enabled: boolean;
      clientId: string;
      clientSecret: string;
      sandbox: boolean;
    };
    mobileMoney: {
      enabled: boolean;
      orangeMoneyApiKey: string;
      mtnMomoApiKey: string;
    };
  };
  defaultCurrency: string;
  supportedCurrencies: string[];
  taxRate: number;
  freeTrialDays: number;
  subscriptionPlans: SubscriptionPlan[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  maxProperties: number;
  isActive: boolean;
}

export interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  twoFactorRequired: boolean;
  ipWhitelist: string[];
  corsOrigins: string[];
  rateLimiting: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
}

export interface NotificationSettings {
  email: {
    enabled: boolean;
    newUserRegistration: boolean;
    paymentReceived: boolean;
    subscriptionExpiring: boolean;
    systemAlerts: boolean;
  };
  sms: {
    enabled: boolean;
    provider: string;
    apiKey: string;
    fromNumber: string;
  };
  push: {
    enabled: boolean;
    firebaseServerKey: string;
    vapidPublicKey: string;
    vapidPrivateKey: string;
  };
}

export interface MaintenanceSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowedIPs: string[];
  scheduledMaintenance: {
    enabled: boolean;
    startTime: Date;
    endTime: Date;
    message: string;
  };
  backups: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number;
    location: string;
  };
}

export interface IntegrationSettings {
  analytics: {
    googleAnalytics: {
      enabled: boolean;
      trackingId: string;
    };
    mixpanel: {
      enabled: boolean;
      projectToken: string;
    };
  };
  storage: {
    provider: 'local' | 's3' | 'cloudinary';
    s3: {
      bucket: string;
      region: string;
      accessKey: string;
      secretKey: string;
    };
    cloudinary: {
      cloudName: string;
      apiKey: string;
      apiSecret: string;
    };
  };
  maps: {
    provider: 'google' | 'mapbox';
    googleMapsApiKey: string;
    mapboxAccessToken: string;
  };
}

export interface SystemInfo {
  version: string;
  environment: string;
  nodeVersion: string;
  databaseVersion: string;
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  lastBackup: Date;
  totalUsers: number;
  totalProperties: number;
  totalPayments: number;
}

export interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  downloadUrl: string;
}

export interface AdminSettingsStateModel {
  settings: AdminSettings | null;
  systemInfo: SystemInfo | null;
  backups: BackupInfo[];
  loading: boolean;
  error: any;
  lastUpdated: Date | null;
}

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ndiye.app',
  appName: 'Ndiye',
  webDir: 'dist',
  server: {
    // URL pour le développement (live reload)
    url: 'http://192.168.1.5:4200',
    cleartext: true,
    // Autoriser les requêtes HTTP non sécurisées en développement
    allowNavigation: [
      'http://192.168.1.5:4200',
      'http://localhost:4200',
      'http://192.168.1.5:3001', // Backend API
      'http://localhost:3001'     // Backend API local
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999"
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#ffffff"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav"
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true
    },
    App: {
      launchUrl: "com.ndiye.app"
    },
    CapacitorHttp: {
      enabled: true
    },
    CapacitorCookies: {
      enabled: true
    }
  }
};

export default config;

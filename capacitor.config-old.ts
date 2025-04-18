import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ndewa360.app',
  appName: 'Ndewa360',
  webDir: 'dist',

  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;

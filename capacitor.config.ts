import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.floww.app',
  appName: 'Floww',
  webDir: 'out',
  server: {
    // Connects physical Android phones over local Wi-Fi to your machine's Next.js server
    url: 'http://192.168.1.40:3000',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_floww",
      iconColor: "#007AFF",
    },
  },
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.floww.app',
  appName: 'Floww',
  webDir: 'out',
  server: {
    // Cloud production URL - works standalone on mobile data or any Wi-Fi without PC
    url: 'https://floww.vercel.app',
    cleartext: false,
    errorPath: 'index.html',
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

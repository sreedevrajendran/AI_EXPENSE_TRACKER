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
    allowNavigation: [
      '*',
    ],
  },
  android: {
    allowMixedContent: true,
    overrideUserAgent: 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 300,
      launchAutoHide: true,
      backgroundColor: "#070913",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_floww",
      iconColor: "#007AFF",
    },
  },
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jasonsnyder.debtplanner',
  appName: 'Debt Planner',
  webDir: 'out',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
      backgroundColor: "#eef3f8"
    }
  }
};

export default config;

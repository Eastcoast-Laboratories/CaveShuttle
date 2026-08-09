// Capacitor integration manager
export class CapacitorManager {
  constructor(capacitor = null) {
    this.Capacitor = capacitor || (typeof window !== 'undefined' && window.Capacitor) || {
      isNativePlatform: () => false,
      getPlatform: () => 'web'
    };
    this.isNative = this.Capacitor.isNativePlatform();
    this.platform = this.Capacitor.getPlatform();
  }

  isNativePlatform() {
    return this.isNative;
  }

  getPlatform() {
    return this.platform;
  }

  isAndroid() {
    return this.platform === 'android';
  }

  isIOS() {
    return this.platform === 'ios';
  }

  isWeb() {
    return this.platform === 'web';
  }

  async loadPlugin(pluginName) {
    try {
      const plugin = await import(`@capacitor/${pluginName}`);
      return plugin;
    } catch (error) {
      console.error(`Failed to load plugin ${pluginName}:`, error);
      return null;
    }
  }

  async SplashScreen() {
    const SplashScreen = await this.loadPlugin('splash-screen');
    if (SplashScreen) {
      return SplashScreen;
    }
    return null;
  }

  async StatusBar() {
    const StatusBar = await this.loadPlugin('status-bar');
    if (StatusBar) {
      return StatusBar;
    }
    return null;
  }

  async App() {
    const App = await this.loadPlugin('app');
    if (App) {
      return App;
    }
    return null;
  }

  async Device() {
    const Device = await this.loadPlugin('device');
    if (Device) {
      return Device;
    }
    return null;
  }

  async Haptics() {
    const Haptics = await this.loadPlugin('haptics');
    if (Haptics) {
      return Haptics;
    }
    return null;
  }
}

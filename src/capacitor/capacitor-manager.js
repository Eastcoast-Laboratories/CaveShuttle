// Capacitor integration manager
// Also serves as the single source of truth for platform detection (DRY).

// Play Store URL for the Android app, used by Menu and browser-level-limit.
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=de.z11.caveshuttle';

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

  // Detect Apple platforms (iOS or macOS) even when running in a browser
  // (not as a native app). Uses userAgent and platform hints.
  isAppleBrowser() {
    if (this.isNative) return false;
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    // iPad on iOS 13+ reports as Mac in userAgent, so check for touch + Mac.
    const isIPad = /Macintosh/.test(ua) && 'ontouchend' in document;
    const isIOSBrowser = /iPad|iPhone|iPod/.test(ua) || isIPad;
    const isMacBrowser = /MacIntel|Macintosh/.test(platform) || /Mac OS/.test(ua);
    return isIOSBrowser || isMacBrowser;
  }

  isAndroidBrowser() {
    if (this.isNative) return false;
    if (typeof navigator === 'undefined') return false;
    return /Android/.test(navigator.userAgent || '');
  }

}

// Singleton instance — lightweight, reads window.Capacitor once at import time.
export const capacitorManager = new CapacitorManager();

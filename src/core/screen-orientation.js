import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Capacitor } from '@capacitor/core';

// Log platform info once at module load
console.log('[SCREEN_ORIENTATION] Platform:', Capacitor.getPlatform(), '| Native:', Capacitor.isNativePlatform());

// Apply the desired orientation lock based on the app's orientationMode setting.
// 'landscape' -> lock to landscape, 'portrait' -> lock to portrait, 'auto' -> unlock (follow device sensor).
// On native platforms this uses the Capacitor ScreenOrientation plugin, which actually
// rotates the OS-level activity (unlike the Web Screen Orientation API, which Android
// WebViews largely ignore outside of fullscreen contexts).
export async function applyOrientationLock(orientationMode) {
  console.log('[SCREEN_ORIENTATION] applyOrientationLock called with mode:', orientationMode, '| native:', Capacitor.isNativePlatform());

  if (Capacitor.isNativePlatform()) {
    try {
      if (orientationMode === 'auto') {
        await ScreenOrientation.unlock();
        console.log('[SCREEN_ORIENTATION] Unlocked (native)');
      } else {
        await ScreenOrientation.lock({ orientation: orientationMode });
        console.log('[SCREEN_ORIENTATION] Locked (native) to:', orientationMode);
      }
    } catch (e) {
      console.log('[SCREEN_ORIENTATION] Native lock/unlock failed:', e.message);
    }
    return;
  }

  // Web fallback: best-effort using the Web Screen Orientation API. This typically
  // requires the document to be in fullscreen mode to succeed in browsers.
  if (typeof screen !== 'undefined' && screen.orientation && typeof screen.orientation.lock === 'function') {
    try {
      if (orientationMode === 'auto') {
        if (screen.orientation.unlock) screen.orientation.unlock();
        console.log('[SCREEN_ORIENTATION] Unlocked (web)');
      } else {
        await screen.orientation.lock(orientationMode);
        console.log('[SCREEN_ORIENTATION] Locked (web) to:', orientationMode);
      }
    } catch (e) {
      console.log('[SCREEN_ORIENTATION] Web lock/unlock failed (expected outside fullscreen):', e.message);
    }
  } else {
    console.log('[SCREEN_ORIENTATION] Web Screen Orientation API not available');
  }
}

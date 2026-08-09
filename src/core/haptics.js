import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// Log platform info once at module load
console.log('[VIBRATE] Platform:', Capacitor.getPlatform(), '| Native:', Capacitor.isNativePlatform());

// Vibrate the device. Uses Capacitor Haptics on native, navigator.vibrate on web.
// pattern: number | number[] — duration in ms, or array of [on, off, on, ...] durations
export async function vibrate(pattern) {
  console.log('[VIBRATE] Called with pattern:', pattern, '| platform:', Capacitor.getPlatform());
  try {
    if (Array.isArray(pattern)) {
      // Use Haptics.vibrate() with actual durations — this calls VibrationEffect.createOneShot on Android
      for (let i = 0; i < pattern.length; i += 2) {
        const duration = pattern[i];
        const gap = pattern[i + 1] || 0;
        await Haptics.vibrate({ duration });
        console.log('[VIBRATE] vibrate() duration:', duration);
        if (gap > 0 || i + 2 < pattern.length) {
          await new Promise(resolve => setTimeout(resolve, duration + gap));
        }
      }
    } else {
      await Haptics.vibrate({ duration: pattern });
      console.log('[VIBRATE] vibrate() duration:', pattern);
    }
    console.log('[VIBRATE] Done via Capacitor Haptics:', pattern);
  } catch (e) {
    console.log('[VIBRATE] Capacitor Haptics failed:', e.message, '— trying navigator.vibrate');
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
      console.log('[VIBRATE] Vibrated via navigator.vibrate:', pattern);
    } else {
      console.log('[VIBRATE] No vibration API available');
    }
  }
}

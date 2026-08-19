import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// Log platform info once at module load
console.log('[VIBRATE] Platform:', Capacitor.getPlatform(), '| Native:', Capacitor.isNativePlatform());

// Vibrate the device.
// For short single-value patterns (button feedback): use navigator.vibrate() on ALL platforms.
//   Capacitor's Haptics.vibrate() and Haptics.impact() both map to Android predefined effects
//   (EFFECT_TICK / EFFECT_CLICK) which some devices implement as a double pulse.
//   navigator.vibrate() in the WebView uses VibrationEffect.createOneShot directly, giving
//   a single clean pulse.
// For array patterns (explosions etc): use Capacitor Haptics on native for sequential
//   vibration with proper timing, navigator.vibrate on web.
// pattern: number | number[] — duration in ms, or array of [on, off, on, ...] durations
export async function vibrate(pattern) {
  console.log('[VIBRATE] Called with pattern:', pattern, '| platform:', Capacitor.getPlatform());

  // Short single-value vibration: use navigator.vibrate everywhere for a clean single pulse
  if (typeof pattern === 'number') {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
      console.log('[VIBRATE] Vibrated via navigator.vibrate (single):', pattern);
    } else if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.vibrate({ duration: pattern });
        console.log('[VIBRATE] Fallback to Haptics.vibrate (single):', pattern);
      } catch (e) {
        console.log('[VIBRATE] No vibration available:', e.message);
      }
    } else {
      console.log('[VIBRATE] No vibration API available');
    }
    return;
  }

  // Array pattern (e.g. explosions): use Capacitor Haptics on native for sequential timing
  if (Capacitor.isNativePlatform()) {
    try {
      for (let i = 0; i < pattern.length; i += 2) {
        const duration = pattern[i];
        const gap = pattern[i + 1] || 0;
        await Haptics.vibrate({ duration });
        console.log('[VIBRATE] vibrate() duration:', duration);
        if (gap > 0 || i + 2 < pattern.length) {
          await new Promise(resolve => setTimeout(resolve, duration + gap));
        }
      }
      console.log('[VIBRATE] Done via Capacitor Haptics:', pattern);
      return;
    } catch (e) {
      console.log('[VIBRATE] Capacitor Haptics failed:', e.message, '— trying navigator.vibrate');
    }
  }

  // Web or fallback: use navigator.vibrate for array patterns
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
    console.log('[VIBRATE] Vibrated via navigator.vibrate (array):', pattern);
  } else {
    console.log('[VIBRATE] No vibration API available');
  }
}

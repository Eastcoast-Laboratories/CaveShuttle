import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { capacitorManager } from '../capacitor/capacitor-manager.js';

// Log platform info once at module load
console.log('[VIBRATE] Platform:', capacitorManager.getPlatform(), '| Native:', capacitorManager.isNativePlatform());

// Maps a millisecond duration to the closest fixed-length iOS impact style.
function iosImpactStyle(duration) {
  if (duration <= 25) return ImpactStyle.Light;
  if (duration <= 60) return ImpactStyle.Medium;
  return ImpactStyle.Heavy;
}

// iOS haptics via UIImpactFeedbackGenerator. Haptics.vibrate({duration}) is
// never used on iOS: each call creates a CHHapticEngine whose resetHandler
// retains it, so every call leaks a running engine — once the system stops
// handing out engines the plugin falls back to the fixed ~0.5s AudioServices
// alert buzz (or silence). Impact generators have no engine and are built
// for rapid repeated use.
async function vibrateIos(pattern) {
  const durations = typeof pattern === 'number' ? [pattern] : pattern.filter((_, i) => i % 2 === 0);
  const gaps = typeof pattern === 'number' ? [] : pattern.filter((_, i) => i % 2 === 1);
  try {
    for (let i = 0; i < durations.length; i++) {
      if (i > 0) {
        const gap = gaps[i - 1] || 0;
        if (gap > 0) await new Promise(resolve => setTimeout(resolve, gap));
      }
      await Haptics.impact({ style: iosImpactStyle(durations[i]) });
      console.log('[VIBRATE] iOS impact:', durations[i]);
    }
  } catch (e) {
    console.log('[VIBRATE] iOS haptics unavailable:', e.message);
  }
}

// Vibrate the device.
// For short single-value patterns (button feedback): use navigator.vibrate() on ALL platforms.
//   Capacitor's Haptics.vibrate() and Haptics.impact() both map to Android predefined effects
//   (EFFECT_TICK / EFFECT_CLICK) which some devices implement as a double pulse.
//   navigator.vibrate() in the WebView uses VibrationEffect.createOneShot directly, giving
//   a single clean pulse.
// For array patterns (explosions etc): use Capacitor Haptics on native for sequential
//   vibration with proper timing, navigator.vibrate on web.
// iOS is handled separately in vibrateIos() — WKWebView has no navigator.vibrate and
//   Haptics.vibrate() leaks one CHHapticEngine per call (see above).
// pattern: number | number[] — duration in ms, or array of [on, off, on, ...] durations
export async function vibrate(pattern) {
  console.log('[VIBRATE] Called with pattern:', pattern, '| platform:', capacitorManager.getPlatform());

  if (capacitorManager.getPlatform() === 'ios') {
    await vibrateIos(pattern);
    return;
  }

  // Short single-value vibration: use navigator.vibrate everywhere for a clean single pulse
  if (typeof pattern === 'number') {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
      console.log('[VIBRATE] Vibrated via navigator.vibrate (single):', pattern);
    } else if (capacitorManager.isNativePlatform()) {
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
  if (capacitorManager.isNativePlatform()) {
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

// Generic localStorage key helper.
// IMPORTANT: Always use storageKey() for new localStorage keys instead of
// hardcoding app-specific prefixes. This allows easy renaming in the future.
export const APP_STORAGE_PREFIX = 'app_';

export function storageKey(suffix) {
  return `${APP_STORAGE_PREFIX}${suffix}`;
}

// Centralized localStorage helpers for level-pack progress and installed packs.
// All keys use storageKey() from storage-keys.js (generic APP_STORAGE_PREFIX).
import { storageKey } from './storage-keys.js';

const LEGACY_COMPLETED_LEVELS_KEY = 'caveshuttle_completedLevels';
const LEGACY_MIGRATION_TARGET_PACK_ID = 'classic';

const INSTALLED_PACKS_KEY = storageKey('installedPacks');

function progressKey(packId) {
  return storageKey(`progress_${packId}`);
}

// --- Per-pack level completion progress ---

export function getPackProgress(packId) {
  try {
    const stored = localStorage.getItem(progressKey(packId));
    if (!stored) return new Set();
    const parsed = JSON.parse(stored);
    return new Set(parsed.completedLevels || []);
  } catch (error) {
    console.error('[PROGRESS_STORAGE] Failed to read progress for pack', packId, error);
    return new Set();
  }
}

export function markLevelCompleted(packId, levelNum) {
  const completed = getPackProgress(packId);
  completed.add(levelNum);
  savePackProgress(packId, completed);
  return completed;
}

export function savePackProgress(packId, completedLevelsSet) {
  try {
    localStorage.setItem(progressKey(packId), JSON.stringify({ completedLevels: [...completedLevelsSet] }));
  } catch (error) {
    console.error('[PROGRESS_STORAGE] Failed to save progress for pack', packId, error);
  }
}

export function resetPackProgress(packId) {
  localStorage.removeItem(progressKey(packId));
}

export function resetAllProgress(packIds) {
  for (const packId of packIds) {
    resetPackProgress(packId);
  }
  localStorage.removeItem(INSTALLED_PACKS_KEY);
}

// --- One-time migration of the old global completedLevels key ---
// The pre-pack-system progress only ever referred to the classic (original) levels,
// so it is migrated to the 'classic' pack's progress key.
export function migrateLegacyProgress() {
  const legacy = localStorage.getItem(LEGACY_COMPLETED_LEVELS_KEY);
  if (!legacy) return;
  try {
    const legacyLevels = JSON.parse(legacy);
    const existing = getPackProgress(LEGACY_MIGRATION_TARGET_PACK_ID);
    const merged = new Set([...existing, ...legacyLevels]);
    savePackProgress(LEGACY_MIGRATION_TARGET_PACK_ID, merged);
    console.log('[PROGRESS_STORAGE] Migrated legacy completedLevels to pack', LEGACY_MIGRATION_TARGET_PACK_ID, [...merged]);
  } catch (error) {
    console.error('[PROGRESS_STORAGE] Failed to migrate legacy completedLevels', error);
  } finally {
    localStorage.removeItem(LEGACY_COMPLETED_LEVELS_KEY);
  }
}

// --- Installed (imported) custom packs ---
// Shape: [{ meta: {...}, levels: { level1: "<.def content>", ... } }]

export function getInstalledPacks() {
  try {
    const stored = localStorage.getItem(INSTALLED_PACKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[PROGRESS_STORAGE] Failed to read installed packs', error);
    return [];
  }
}

export function saveInstalledPacks(packs) {
  try {
    localStorage.setItem(INSTALLED_PACKS_KEY, JSON.stringify(packs));
  } catch (error) {
    console.error('[PROGRESS_STORAGE] Failed to save installed packs', error);
  }
}

export function addInstalledPack(pack) {
  const packs = getInstalledPacks();
  packs.push(pack);
  saveInstalledPacks(packs);
  return packs;
}

export function removeInstalledPack(packId) {
  const packs = getInstalledPacks().filter(p => p.meta.id !== packId);
  saveInstalledPacks(packs);
  resetPackProgress(packId);
  return packs;
}

// Level-pack registry.
// Built-in packs are fixed in code and their IDs are reserved: no custom/imported
// pack may ever use one of these IDs (enforced in registerCustomPack).
import { getInstalledPacks, addInstalledPack, saveInstalledPacks } from '../core/progress-storage.js';

export const BUILTIN_PACKS = [
  {
    id: 'default',
    name: 'Standard',
    source: 'bundled',
    baseUrl: '/levelpacks/default',
  },
];

// Bundled pack IDs are reserved to prevent overwriting built-in content.
const RESERVED_PACK_IDS = new Set(BUILTIN_PACKS.map(p => p.id));

// In-memory cache of fetched external pack metadata (levelCount etc.), keyed by pack id.
const fetchedMetaCache = new Map();

export function isReservedPackId(packId) {
  return RESERVED_PACK_IDS.has(packId);
}

export async function fetchPackMeta(baseUrl) {
  const response = await fetch(`${baseUrl}/meta.json`);
  if (!response.ok) {
    throw new Error(`[LEVELPACKS] Failed to load pack meta from ${baseUrl}`);
  }
  return response.json();
}

// Returns the full list of packs the player can currently select from:
// built-in packs (bundled + external, metadata fetched lazily) plus installed custom packs.
export function getAllPacks() {
  const customPacks = getInstalledPacks().map(p => ({
    id: p.meta.id,
    name: p.meta.name,
    source: 'local',
    baseUrl: `local:${p.meta.id}`,
    meta: { ...p.meta, levelCount: p.meta.levelCount ?? Object.keys(p.levels).length },
  }));
  return [...BUILTIN_PACKS, ...customPacks];
}

export function getCachedMeta(packId) {
  return fetchedMetaCache.get(packId) || null;
}

export async function ensurePackMetaLoaded(pack) {
  if (pack.source === 'local') {
    return pack.meta;
  }
  const cached = fetchedMetaCache.get(pack.id);
  if (cached) return cached;
  const meta = await fetchPackMeta(pack.baseUrl);
  fetchedMetaCache.set(pack.id, meta);
  return meta;
}

// Validates and stores a custom (imported) pack.
// Returns { success: true, pack } on success, or { success: false, conflict: true, existingPack } if ID already exists.
// Throws with a user-readable message on collision with reserved IDs or invalid data.
export function registerCustomPack(meta, levelsMap, forceOverwrite = false) {
  if (!meta || !meta.id || !meta.name) {
    throw new Error('Pack metadata must include an id and a name.');
  }
  if (isReservedPackId(meta.id)) {
    throw new Error(`Pack ID "${meta.id}" is reserved for a built-in pack. Please choose a different ID.`);
  }
  if (!levelsMap || Object.keys(levelsMap).length === 0) {
    throw new Error('Pack must contain at least one level.');
  }

  // Normalize level IDs to level1, level2, ... so the game can progress sequentially
  const levelIds = Object.keys(levelsMap);
  const normalizedLevels = {};
  levelIds.forEach((oldId, index) => {
    normalizedLevels[`level${index + 1}`] = levelsMap[oldId];
  });

  const normalizedMeta = { ...meta, levelCount: levelIds.length };

  const existingPack = getInstalledPacks().find(p => p.meta.id === normalizedMeta.id);

  if (existingPack && !forceOverwrite) {
    return { success: false, conflict: true, existingPack };
  }

  const pack = { meta: normalizedMeta, levels: normalizedLevels };

  // Replace existing pack with same ID if present
  const packs = getInstalledPacks().filter(p => p.meta.id !== normalizedMeta.id);
  packs.push(pack);
  saveInstalledPacks(packs);
  return { success: true, pack };
}

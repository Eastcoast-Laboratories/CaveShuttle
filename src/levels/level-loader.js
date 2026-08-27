// Level loader for loading level files from a level pack.
// A pack is identified by its baseUrl:
// - Normal http(s) or root-relative path (e.g. '/levelpacks/default' or an external URL)
//   -> levels are fetched via fetch(`${baseUrl}/${levelId}.def`)
// - 'local:<packId>' pseudo-URL -> levels are read from an installed custom pack
//   stored in localStorage (see core/progress-storage.js), no network request.
import { getInstalledPacks } from '../core/progress-storage.js';

const LOCAL_PACK_PREFIX = 'local:';

export class LevelLoader {
  constructor() {
    // Cache key is `${baseUrl}::${levelId}` so identical levelIds across
    // different packs (e.g. every pack has a "level1") don't collide.
    this.levels = new Map();
  }

  cacheKey(baseUrl, levelId) {
    return `${baseUrl}::${levelId}`;
  }

  async loadLevel(baseUrl, levelId) {
    const key = this.cacheKey(baseUrl, levelId);
    if (this.levels.has(key)) {
      return this.levels.get(key);
    }

    let content;
    if (baseUrl.startsWith(LOCAL_PACK_PREFIX)) {
      content = this.loadLocalPackLevel(baseUrl, levelId);
    } else {
      content = await this.fetchLevel(baseUrl, levelId);
    }

    this.levels.set(key, content);
    return content;
  }

  async fetchLevel(baseUrl, levelId) {
    try {
      const response = await fetch(`${baseUrl}/${levelId}.def`);
      if (!response.ok) {
        throw new Error(`Failed to load level: ${levelId} from ${baseUrl}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`[LEVEL_LOADER] Error fetching level ${levelId} from ${baseUrl}:`, error);
      throw error;
    }
  }

  loadLocalPackLevel(baseUrl, levelId) {
    const packId = baseUrl.slice(LOCAL_PACK_PREFIX.length);
    const installedPacks = getInstalledPacks();
    const pack = installedPacks.find(p => p.meta.id === packId);
    if (!pack) {
      throw new Error(`[LEVEL_LOADER] Local pack not found: ${packId}`);
    }
    const content = pack.levels[levelId];
    if (!content) {
      const available = Object.keys(pack.levels).join(', ');
      throw new Error(`[LEVEL_LOADER] Level ${levelId} not found in local pack ${packId}. Available levels: ${available}`);
    }
    return content;
  }

  async loadAllLevels(baseUrl, levelCount) {
    const levels = {};
    for (let i = 1; i <= levelCount; i++) {
      const levelId = `level${i}`;
      try {
        levels[levelId] = await this.loadLevel(baseUrl, levelId);
      } catch (error) {
        console.error(`[LEVEL_LOADER] Failed to load ${levelId} from ${baseUrl}:`, error);
      }
    }
    return levels;
  }

  getLevel(baseUrl, levelId) {
    return this.levels.get(this.cacheKey(baseUrl, levelId));
  }

  hasLevel(baseUrl, levelId) {
    return this.levels.has(this.cacheKey(baseUrl, levelId));
  }

  clearCache() {
    this.levels.clear();
  }

  getLoadedLevelIds() {
    return Array.from(this.levels.keys());
  }
}

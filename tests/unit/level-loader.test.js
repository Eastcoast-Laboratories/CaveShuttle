import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LevelLoader } from '../../src/levels/level-loader.js';

describe('Level Loader', () => {
  let loader;
  let mockFetch;

  beforeEach(() => {
    loader = new LevelLoader();
    
    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('should create loader with empty cache', () => {
    expect(loader.levels.size).toBe(0);
    expect(loader.baseUrl).toBe('/levels/');
  });

  it('should load level from file', async () => {
    const mockContent = '# Test Level\n####\n#   #\n####';
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockContent)
    });

    const content = await loader.loadLevel('level1');
    expect(content).toBe(mockContent);
    expect(loader.levels.has('level1')).toBe(true);
  });

  it('should return cached level on second load', async () => {
    const mockContent = '# Test Level\n####\n#   #\n####';
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockContent)
    });

    await loader.loadLevel('level1');
    await loader.loadLevel('level1');
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should throw error on failed load', async () => {
    mockFetch.mockResolvedValue({
      ok: false
    });

    await expect(loader.loadLevel('level1')).rejects.toThrow();
  });

  it('should load all 6 levels', async () => {
    const mockContent = '# Test Level\n####\n#   #\n####';
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockContent)
    });

    const levels = await loader.loadAllLevels();
    
    expect(levels).toHaveProperty('level1');
    expect(levels).toHaveProperty('level2');
    expect(levels).toHaveProperty('level3');
    expect(levels).toHaveProperty('level4');
    expect(levels).toHaveProperty('level5');
    expect(levels).toHaveProperty('level6');
  });

  it('should get loaded level', async () => {
    const mockContent = '# Test Level\n####\n#   #\n####';
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockContent)
    });

    await loader.loadLevel('level1');
    const content = loader.getLevel('level1');
    
    expect(content).toBe(mockContent);
  });

  it('should check if level is loaded', async () => {
    const mockContent = '# Test Level\n####\n#   #\n####';
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockContent)
    });

    expect(loader.hasLevel('level1')).toBe(false);
    await loader.loadLevel('level1');
    expect(loader.hasLevel('level1')).toBe(true);
  });

  it('should clear cache', async () => {
    const mockContent = '# Test Level\n####\n#   #\n####';
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockContent)
    });

    await loader.loadLevel('level1');
    loader.clearCache();
    
    expect(loader.levels.size).toBe(0);
  });

  it('should get loaded level IDs', async () => {
    const mockContent = '# Test Level\n####\n#   #\n####';
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockContent)
    });

    await loader.loadLevel('level1');
    await loader.loadLevel('level2');
    
    const ids = loader.getLoadedLevelIds();
    expect(ids).toContain('level1');
    expect(ids).toContain('level2');
  });
});

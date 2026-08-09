import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LevelLoader } from '../../src/levels/level-loader.js';

describe('Level Loading Integration', () => {
  let loader;
  let mockFetch;

  beforeEach(() => {
    loader = new LevelLoader();
    
    // Mock fetch with actual level file content
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('should load level1', async () => {
    const level1Content = `# Test Level 1
189 24 33
24 211 24
0 164 0
49 231 198
82 60 17 5 25
####
#  #
#  #
####`;
    
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(level1Content)
    });

    const content = await loader.loadLevel('level1');
    expect(content).toBeDefined();
    expect(content).toContain('Test Level 1');
  });

  it('should load level2', async () => {
    const level2Content = `# Test Level 2
189 24 33
24 211 24
0 164 0
49 231 198
82 60 17 5 25
####
#  #
#  #
####`;
    
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(level2Content)
    });

    const content = await loader.loadLevel('level2');
    expect(content).toBeDefined();
    expect(content).toContain('Test Level 2');
  });

  it('should load level3', async () => {
    const level3Content = `# Test Level 3
189 24 33
24 211 24
0 164 0
49 231 198
82 60 17 5 25
####
#  #
#  #
####`;
    
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(level3Content)
    });

    const content = await loader.loadLevel('level3');
    expect(content).toBeDefined();
    expect(content).toContain('Test Level 3');
  });

  it('should load level4', async () => {
    const level4Content = `# Test Level 4
189 24 33
24 211 24
0 164 0
49 231 198
82 60 17 5 25
####
#  #
#  #
####`;
    
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(level4Content)
    });

    const content = await loader.loadLevel('level4');
    expect(content).toBeDefined();
    expect(content).toContain('Test Level 4');
  });

  it('should load level5', async () => {
    const level5Content = `# Test Level 5
189 24 33
24 211 24
0 164 0
49 231 198
82 60 17 5 25
####
#  #
#  #
####`;
    
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(level5Content)
    });

    const content = await loader.loadLevel('level5');
    expect(content).toBeDefined();
    expect(content).toContain('Test Level 5');
  });

  it('should load level6', async () => {
    const level6Content = `# Test Level 6
189 24 33
24 211 24
0 164 0
49 231 198
82 60 17 5 25
####
#  #
#  #
####`;
    
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(level6Content)
    });

    const content = await loader.loadLevel('level6');
    expect(content).toBeDefined();
    expect(content).toContain('Test Level 6');
  });

  it('should load all 6 levels in sequence', async () => {
    const mockContent = `# Test Level
189 24 33
24 211 24
0 164 0
49 231 198
82 60 17 5 25
####
#  #
#  #
####`;
    
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockContent)
    });

    const levels = await loader.loadAllLevels();
    
    expect(Object.keys(levels)).toHaveLength(6);
    expect(levels).toHaveProperty('level1');
    expect(levels).toHaveProperty('level2');
    expect(levels).toHaveProperty('level3');
    expect(levels).toHaveProperty('level4');
    expect(levels).toHaveProperty('level5');
    expect(levels).toHaveProperty('level6');
  });

  it('should cache loaded levels', async () => {
    const mockContent = `# Test Level
189 24 33
24 211 24
0 164 0
49 231 198
82 60 17 5 25
####
#  #
#  #
####`;
    
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockContent)
    });

    await loader.loadLevel('level1');
    await loader.loadLevel('level1');
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

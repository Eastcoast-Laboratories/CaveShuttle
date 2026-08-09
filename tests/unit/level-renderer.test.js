import { describe, it, expect, beforeEach } from 'vitest';
import { LevelRenderer } from '../../src/game/level-renderer.js';

describe('Level Renderer', () => {
  let renderer;
  let mockCtx;

  beforeEach(() => {
    renderer = new LevelRenderer();
    mockCtx = {
      fillStyle: '',
      fillRect: vi.fn(),
      strokeStyle: '',
      strokeRect: vi.fn(),
      font: '',
      fillText: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn()
    };
  });

  it('should create renderer with tile size 16', () => {
    expect(renderer.tileSize).toBe(16);
  });

  it('should render wall tile', () => {
    const level = { layout: ['#'] };
    renderer.renderTile(mockCtx, '#', 0, 0);
    
    expect(mockCtx.fillStyle).toBe('#666666');
    expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 16, 16);
  });

  it('should render restart point', () => {
    const level = { layout: ['*'] };
    renderer.renderTile(mockCtx, '*', 0, 0);
    
    expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 16, 16);
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('should render fuel', () => {
    renderer.renderTile(mockCtx, '`', 0, 0);
    
    expect(mockCtx.fillStyle).toBe('#00ffff');
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  it('should render pod', () => {
    renderer.renderTile(mockCtx, 'm', 0, 0);
    
    expect(mockCtx.fillStyle).toBe('#00ff00');
    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.arc).toHaveBeenCalled();
  });

  it('should render power plant', () => {
    renderer.renderTile(mockCtx, 'd', 0, 0);
    
    expect(mockCtx.fillStyle).toBe('#ff00ff');
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  it('should render bunker', () => {
    renderer.renderTile(mockCtx, 'P', 0, 0);
    
    expect(mockCtx.fillStyle).toBe('#ff0000');
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  it('should render button', () => {
    renderer.renderTile(mockCtx, 'L', 0, 0);
    
    expect(mockCtx.fillStyle).toBe('#00ff00');
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  it('should render slider', () => {
    renderer.renderTile(mockCtx, '@', 0, 0);
    
    expect(mockCtx.fillStyle).toBe('#0000ff');
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  it('should identify bunker tiles', () => {
    expect(renderer.isBunker('P')).toBe(true);
    expect(renderer.isBunker('U')).toBe(true);
    expect(renderer.isBunker('[')).toBe(true);
    expect(renderer.isBunker('\\')).toBe(true);
    expect(renderer.isBunker('#')).toBe(false);
  });

  it('should identify button tiles', () => {
    expect(renderer.isButton('L')).toBe(true);
    expect(renderer.isButton('N')).toBe(true);
    expect(renderer.isButton('#')).toBe(false);
  });

  it('should identify slider tiles', () => {
    expect(renderer.isSlider('@')).toBe(true);
    expect(renderer.isSlider('K')).toBe(true);
    expect(renderer.isSlider('#')).toBe(false);
  });

  it('should identify wall tiles', () => {
    expect(renderer.isWall('#')).toBe(true);
    expect(renderer.isWall('p')).toBe(true);
    expect(renderer.isWall('q')).toBe(true);
    expect(renderer.isWall('r')).toBe(true);
    expect(renderer.isWall('s')).toBe(true);
    expect(renderer.isWall('t')).toBe(true);
    expect(renderer.isWall(' ')).toBe(false);
  });

  it('should get tile at position', () => {
    const level = { layout: ['# ', ' #'] };
    const tile = renderer.getTileAt(level, 8, 8);
    
    expect(tile).toBe('#');
  });

  it('should return null for out of bounds', () => {
    const level = { layout: ['# '] };
    const tile = renderer.getTileAt(level, 100, 100);
    
    expect(tile).toBeNull();
  });

  it('should get level dimensions', () => {
    const level = { layout: ['#  ', '  #'] };
    const dims = renderer.getLevelDimensions(level);
    
    expect(dims.width).toBe(48);
    expect(dims.height).toBe(32);
  });

  it('should render level layout', () => {
    const level = { layout: ['# '] };
    renderer.render(mockCtx, level);
    
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });
});

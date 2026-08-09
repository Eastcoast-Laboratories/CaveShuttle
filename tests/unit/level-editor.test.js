import { describe, it, expect, beforeEach } from 'vitest';
import { LevelEditor } from '../../src/editor/level-editor.js';

describe('Level Editor', () => {
  let editor;

  beforeEach(() => {
    editor = new LevelEditor();
  });

  it('should create editor with default level', () => {
    expect(editor.level.name).toBe('Untitled');
    expect(editor.level.width).toBe(40);
    expect(editor.level.height).toBe(25);
  });

  it('should create empty level', () => {
    editor.createEmptyLevel(10, 10);
    expect(editor.level.width).toBe(10);
    expect(editor.level.height).toBe(10);
    expect(editor.level.layout).toHaveLength(10);
    expect(editor.level.layout[0]).toHaveLength(10);
  });

  it('should set tile', () => {
    editor.createEmptyLevel(10, 10);
    const result = editor.setTile(5, 5, '#');
    expect(result).toBe(true);
    expect(editor.getTile(5, 5)).toBe('#');
  });

  it('should not set tile out of bounds', () => {
    editor.createEmptyLevel(10, 10);
    const result = editor.setTile(15, 15, '#');
    expect(result).toBe(false);
  });

  it('should get tile', () => {
    editor.createEmptyLevel(10, 10);
    editor.setTile(3, 3, '#');
    expect(editor.getTile(3, 3)).toBe('#');
  });

  it('should return null for out of bounds tile', () => {
    editor.createEmptyLevel(10, 10);
    expect(editor.getTile(15, 15)).toBeNull();
  });

  it('should set selected tile', () => {
    editor.setSelectedTile('#');
    expect(editor.getSelectedTile()).toBe('#');
  });

  it('should add object', () => {
    editor.createEmptyLevel(10, 10);
    editor.addObject('bunker', 5, 5, { bunkerType: 'shooting' });
    expect(editor.level.objects).toHaveLength(1);
    expect(editor.level.objects[0].type).toBe('bunker');
    expect(editor.level.objects[0].bunkerType).toBe('shooting');
  });

  it('should remove object', () => {
    editor.createEmptyLevel(10, 10);
    const obj = { id: 123, type: 'bunker', x: 5, y: 5 };
    editor.level.objects.push(obj);
    editor.removeObject(123);
    expect(editor.level.objects).toHaveLength(0);
  });

  it('should save state for undo', () => {
    editor.createEmptyLevel(10, 10);
    editor.setTile(5, 5, '#');
    expect(editor.history).toHaveLength(2); // Initial + one change
  });

  it('should undo', () => {
    editor.createEmptyLevel(10, 10);
    editor.setTile(5, 5, '#');
    const result = editor.undo();
    expect(result).toBe(true);
    expect(editor.getTile(5, 5)).toBe(' ');
  });

  it('should not undo when at start', () => {
    editor.createEmptyLevel(10, 10);
    const result = editor.undo();
    expect(result).toBe(false);
  });

  it('should redo', () => {
    editor.createEmptyLevel(10, 10);
    editor.setTile(5, 5, '#');
    editor.undo();
    const result = editor.redo();
    expect(result).toBe(true);
    expect(editor.getTile(5, 5)).toBe('#');
  });

  it('should not redo when at end', () => {
    editor.createEmptyLevel(10, 10);
    const result = editor.redo();
    expect(result).toBe(false);
  });

  it('should check can undo', () => {
    editor.createEmptyLevel(10, 10);
    editor.setTile(5, 5, '#');
    expect(editor.canUndo()).toBe(true);
  });

  it('should check can redo', () => {
    editor.createEmptyLevel(10, 10);
    editor.setTile(5, 5, '#');
    editor.undo();
    expect(editor.canRedo()).toBe(true);
  });

  it('should export level', () => {
    editor.createEmptyLevel(10, 10);
    editor.setTile(5, 5, '#');
    const exported = editor.exportLevel();
    const parsed = JSON.parse(exported);
    expect(parsed.width).toBe(10);
    expect(parsed.layout[5][5]).toBe('#');
  });

  it('should import level', () => {
    const levelData = {
      name: 'Test Level',
      width: 10,
      height: 10,
      layout: Array(10).fill(null).map(() => Array(10).fill(' ')),
      objects: []
    };
    const jsonString = JSON.stringify(levelData);
    const result = editor.importLevel(jsonString);
    expect(result).toBe(true);
    expect(editor.level.name).toBe('Test Level');
  });

  it('should fail to import invalid JSON', () => {
    const result = editor.importLevel('invalid json');
    expect(result).toBe(false);
  });

  it('should clear level', () => {
    editor.createEmptyLevel(10, 10);
    editor.setTile(5, 5, '#');
    editor.addObject('bunker', 3, 3);
    editor.clearLevel();
    expect(editor.getTile(5, 5)).toBe(' ');
    expect(editor.level.objects).toHaveLength(0);
  });

  it('should limit history size', () => {
    editor.createEmptyLevel(10, 10);
    editor.maxHistory = 5;
    
    for (let i = 0; i < 10; i++) {
      editor.setTile(i % 10, i % 10, '#');
    }
    
    expect(editor.history.length).toBeLessThanOrEqual(5);
  });
});

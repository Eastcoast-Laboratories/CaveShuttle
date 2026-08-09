import { describe, it, expect } from 'vitest';
import { LevelEditor } from '../../src/editor/level-editor.js';

describe('Level Editor Integration', () => {
  it('should integrate tile placement with undo/redo', () => {
    const editor = new LevelEditor();
    editor.createEmptyLevel(10, 10);
    
    editor.setTile(5, 5, '#');
    editor.setTile(6, 6, '#');
    
    expect(editor.getTile(5, 5)).toBe('#');
    expect(editor.getTile(6, 6)).toBe('#');
    
    editor.undo();
    expect(editor.getTile(6, 6)).toBe(' ');
    expect(editor.getTile(5, 5)).toBe('#');
    
    editor.redo();
    expect(editor.getTile(6, 6)).toBe('#');
  });

  it('should integrate object placement with undo/redo', () => {
    const editor = new LevelEditor();
    editor.createEmptyLevel(10, 10);
    
    editor.addObject('bunker', 5, 5);
    editor.addObject('fuel', 7, 7);
    
    expect(editor.level.objects).toHaveLength(2);
    
    editor.undo();
    expect(editor.level.objects).toHaveLength(1);
    
    editor.redo();
    expect(editor.level.objects).toHaveLength(2);
  });

  it('should integrate export and import', () => {
    const editor = new LevelEditor();
    editor.createEmptyLevel(10, 10);
    editor.setTile(5, 5, '#');
    editor.addObject('bunker', 3, 3);
    
    const exported = editor.exportLevel();
    
    const newEditor = new LevelEditor();
    const result = newEditor.importLevel(exported);
    
    expect(result).toBe(true);
    expect(newEditor.getTile(5, 5)).toBe('#');
    expect(newEditor.level.objects).toHaveLength(1);
  });

  it('should integrate all editor features together', () => {
    const editor = new LevelEditor();
    editor.createEmptyLevel(10, 10);
    
    // Place tiles
    editor.setTile(5, 5, '#');
    editor.setTile(6, 6, '#');
    
    // Add objects
    editor.addObject('bunker', 3, 3);
    editor.addObject('fuel', 7, 7);
    
    // Undo last action (fuel object)
    editor.undo();
    expect(editor.level.objects).toHaveLength(1);
    
    // Redo
    editor.redo();
    expect(editor.level.objects).toHaveLength(2);
    
    // Export
    const exported = editor.exportLevel();
    const parsed = JSON.parse(exported);
    
    expect(parsed.width).toBe(10);
    expect(parsed.objects).toHaveLength(2);
    
    // Clear
    editor.clearLevel();
    expect(editor.level.objects).toHaveLength(0);
    expect(editor.getTile(5, 5)).toBe(' ');
  });
});

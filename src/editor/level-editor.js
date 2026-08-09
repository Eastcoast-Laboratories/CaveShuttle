// Level editor for creating and editing game levels
import { validateLevel } from '../levels/level-validator.js';

export class LevelEditor {
  constructor() {
    this.level = {
      name: 'Untitled',
      width: 40,
      height: 25,
      layout: [],
      objects: []
    };
    this.selectedTile = '#';
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;
  }

  createEmptyLevel(width, height) {
    this.level.width = width;
    this.level.height = height;
    this.level.layout = Array(height).fill(null).map(() => Array(width).fill(' '));
    this.saveState();
  }

  setTile(x, y, tile) {
    if (x < 0 || x >= this.level.width || y < 0 || y >= this.level.height) {
      return false;
    }
    
    this.level.layout[y][x] = tile;
    this.saveState();
    return true;
  }

  getTile(x, y) {
    if (x < 0 || x >= this.level.width || y < 0 || y >= this.level.height) {
      return null;
    }
    return this.level.layout[y][x];
  }

  setSelectedTile(tile) {
    this.selectedTile = tile;
  }

  getSelectedTile() {
    return this.selectedTile;
  }

  addObject(type, x, y, properties = {}) {
    this.level.objects.push({
      id: Date.now(),
      type,
      x,
      y,
      ...properties
    });
    this.saveState();
  }

  removeObject(id) {
    this.level.objects = this.level.objects.filter(obj => obj.id !== id);
    this.saveState();
  }

  saveState() {
    // Remove any future states if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    // Add current state
    this.history.push(JSON.parse(JSON.stringify(this.level)));
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.level = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      return true;
    }
    return false;
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.level = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      return true;
    }
    return false;
  }

  canUndo() {
    return this.historyIndex > 0;
  }

  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  exportLevel() {
    return JSON.stringify(this.level, null, 2);
  }

  importLevel(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this.level = imported;
      this.history = [];
      this.historyIndex = -1;
      this.saveState();
      return true;
    } catch (error) {
      console.error('Failed to import level:', error);
      return false;
    }
  }

  clearLevel() {
    this.level.layout = this.level.layout.map(row => row.map(() => ' '));
    this.level.objects = [];
    this.saveState();
  }

  validate() {
    return validateLevel(this.level);
  }
}

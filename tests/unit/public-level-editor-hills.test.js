import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, it, expect } from 'vitest';

function loadPublicLevelEditor() {
  const editorPath = path.join(process.cwd(), 'public/level-editor/editor.js');
  const source = fs.readFileSync(editorPath, 'utf8') + '\nthis.__LevelEditor = LevelEditor;';
  const context = {
    console: { log() {}, warn() {}, error() {} },
    LevelRenderer: class {},
    fetch: async () => ({ ok: false, json: async () => ({}) }),
    document: {
      addEventListener() {},
      getElementById() {
        return {
          addEventListener() {},
          appendChild() {},
          classList: { add() {}, remove() {}, contains() { return false; } },
          getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0 }; },
          getContext() { return {}; },
          innerHTML: '',
          querySelectorAll() { return []; },
          style: {},
          textContent: '',
          value: ''
        };
      },
      querySelectorAll() { return []; },
      createElement() {
        return {
          addEventListener() {},
          appendChild() {},
          classList: { add() {}, remove() {}, contains() { return false; } },
          style: {}
        };
      }
    },
    window: { addEventListener() {}, removeEventListener() {} },
    navigator: {},
    localStorage: { getItem() { return null; }, setItem() {} },
    alert() {},
    confirm() { return true; },
    prompt() { return ''; },
    setTimeout,
    clearTimeout
  };

  vm.createContext(context);
  vm.runInContext(source, context);
  return context.__LevelEditor;
}

describe('Public Level Editor hill directions', () => {
  const LevelEditor = loadPublicLevelEditor();
  const editor = Object.create(LevelEditor.prototype);
  editor.mulberry32 = LevelEditor.prototype.mulberry32;

  it('keeps one flat step between opposite hill directions while preserving the target height', () => {
    const cases = [
      { steps: 6, target: 0, seed: 1 },
      { steps: 7, target: 1, seed: 1 },
      { steps: 8, target: 0, seed: 1 },
      { steps: 5, target: -1, seed: 1 },
      { steps: 9, target: 2, seed: 7 }
    ];

    for (const { steps, target, seed } of cases) {
      const directions = LevelEditor.prototype.getHillDirectionArray.call(editor, steps, target, seed);
      const total = directions.reduce((sum, direction) => sum + direction, 0);

      expect(directions).toHaveLength(steps);
      expect(total).toBe(target);

      for (let i = 1; i < directions.length; i++) {
        const prev = directions[i - 1];
        const current = directions[i];
        expect(prev === 0 || current === 0 || prev === current).toBe(true);
      }

      if (directions.includes(1) && directions.includes(-1)) {
        expect(directions.includes(0)).toBe(true);
      }
    }
  });

  it('draws a slope pair for the first flat step after an up-slope', () => {
    const LevelEditor = loadPublicLevelEditor();
    const editor = Object.create(LevelEditor.prototype);
    editor.levelData = {
      header: { width: 20, height: 20 },
      grid: Array.from({ length: 20 }, () => Array(20).fill(' '))
    };
    editor.hillStart = { x: 2, y: 10 };
    editor.hillPreview = [];
    editor.hillSeed = 1;
    editor.render = () => {};
    editor.renderPreview = () => {};
    // Force a hill that goes up, then flat, then down.
    editor.getHillDirectionArray = () => [-1, -1, -1, 0, 0, 1, 1];

    editor.updateHillPreview(16, 8);

    const find = (x, y) => editor.hillPreview.find(t => t.x === x && t.y === y)?.char;

    // Slope up tiles before the flat section.
    expect(find(2, 10)).toBe('s');
    expect(find(3, 10)).toBe('t');
    expect(find(4, 9)).toBe('s');
    expect(find(5, 9)).toBe('t');
    expect(find(6, 8)).toBe('s');
    expect(find(7, 8)).toBe('t');

    // First flat step must still be a slope up (s/t), not p/p.
    expect(find(8, 7)).toBe('s');
    expect(find(9, 7)).toBe('t');

    // The remaining flat step is solid ground.
    expect(find(10, 7)).toBe('p');
    expect(find(11, 7)).toBe('p');
  });

  it('extends the valley floor with p/p before the first up-slope, then draws the ramp', () => {
    const LevelEditor = loadPublicLevelEditor();
    const editor = Object.create(LevelEditor.prototype);
    editor.levelData = {
      header: { width: 20, height: 20 },
      grid: Array.from({ length: 20 }, () => Array(20).fill(' '))
    };
    editor.hillStart = { x: 2, y: 10 };
    editor.hillPreview = [];
    editor.hillSeed = 1;
    editor.render = () => {};
    editor.renderPreview = () => {};
    // Force a hill that goes down into a valley, then flat, then up (two up steps).
    editor.getHillDirectionArray = () => [1, 1, 0, -1, -1];

    editor.updateHillPreview(12, 10);

    const find = (x, y) => editor.hillPreview.find(t => t.x === x && t.y === y)?.char;

    // Down slopes to the valley floor.
    expect(find(2, 10)).toBe('q');
    expect(find(3, 10)).toBe('r');
    expect(find(4, 11)).toBe('q');
    expect(find(5, 11)).toBe('r');

    // Valley floor is p/p, including the first up step that is extended as flat.
    expect(find(6, 12)).toBe('p');
    expect(find(7, 12)).toBe('p');
    expect(find(8, 12)).toBe('p');
    expect(find(9, 12)).toBe('p');

    // The actual ramp starts in the second up step, one row above the floor.
    expect(find(10, 11)).toBe('s');
    expect(find(11, 11)).toBe('t');
  });

  it('draws a single up-slope out of a valley one row above the floor', () => {
    const LevelEditor = loadPublicLevelEditor();
    const editor = Object.create(LevelEditor.prototype);
    editor.levelData = {
      header: { width: 20, height: 20 },
      grid: Array.from({ length: 20 }, () => Array(20).fill(' '))
    };
    editor.hillStart = { x: 2, y: 10 };
    editor.hillPreview = [];
    editor.hillSeed = 1;
    editor.render = () => {};
    editor.renderPreview = () => {};
    // Force a hill that goes down into a valley, then flat, then up a single step.
    editor.getHillDirectionArray = () => [1, 0, 0, -1];

    editor.updateHillPreview(10, 10);

    const find = (x, y) => editor.hillPreview.find(t => t.x === x && t.y === y)?.char;

    // Down slope to the valley floor.
    expect(find(2, 10)).toBe('q');
    expect(find(3, 10)).toBe('r');

    // Valley floor is p/p.
    expect(find(4, 11)).toBe('p');
    expect(find(5, 11)).toBe('p');
    expect(find(6, 11)).toBe('p');
    expect(find(7, 11)).toBe('p');

    // A single up step must start at the floor, so it is drawn one row above.
    expect(find(8, 10)).toBe('s');
    expect(find(9, 10)).toBe('t');
  });

  it('detects ceiling slopes across the full drag path in both downward diagonal directions', () => {
    const cases = [
      { start: { x: 4, y: 4 }, end: { x: 10, y: 7 }, expected: ['w', 'x'] },
      { start: { x: 10, y: 4 }, end: { x: 4, y: 7 }, expected: ['v', 'u'] }
    ];

    for (const { start, end, expected } of cases) {
      const testEditor = Object.create(LevelEditor.prototype);
      testEditor.levelData = {
        header: { width: 20, height: 20 },
        grid: Array.from({ length: 20 }, () => Array(20).fill(' '))
      };
      for (let i = 0; i <= Math.abs(end.x - start.x); i++) {
        const direction = end.x > start.x ? 1 : -1;
        const x = start.x + i * direction;
        const y = start.y + Math.floor(i / 2);
        testEditor.levelData.grid[y - 1][x] = 'p';
      }
      // Reproduce an ambiguous corner at the drag start. The old implementation
      // checked only this cell and incorrectly preferred the floor below it.
      testEditor.levelData.grid[start.y + 1][start.x] = 'p';
      testEditor.slopeStart = start;
      testEditor.render = () => {};
      testEditor.renderPreview = () => {};

      testEditor.updateSlopePreview(end.x, end.y);

      expect(testEditor.slopePreview.slice(0, 2).map(tile => tile.char)).toEqual(expected);
    }
  });

  it('restores an undone grid change with redo', () => {
    const testEditor = Object.create(LevelEditor.prototype);
    testEditor.levelData = {
      header: { width: 3, height: 3, wallColor: '#ff0000' },
      grid: Array.from({ length: 3 }, () => Array(3).fill(' '))
    };
    testEditor.undoStack = [];
    testEditor.redoStack = [];
    testEditor._lastSnapshot = JSON.parse(JSON.stringify(testEditor.levelData));
    testEditor.render = () => {};
    testEditor.updateParameterInputs = () => {};

    testEditor.levelData.grid[1][1] = 'p';
    testEditor.saveState();
    testEditor.undo();
    expect(testEditor.levelData.grid[1][1]).toBe(' ');

    testEditor.redo();
    expect(testEditor.levelData.grid[1][1]).toBe('p');
    expect(testEditor.undoStack).toHaveLength(1);
    expect(testEditor.redoStack).toHaveLength(0);
  });

  it('uses traversal-order slope pairs for all floor and ceiling directions', () => {
    const cases = [
      ['floor', 1, 1, ['q', 'r']],
      ['floor', -1, 1, ['t', 's']],
      ['floor', 1, -1, ['s', 't']],
      ['floor', -1, -1, ['r', 'q']],
      ['ceiling', 1, 1, ['w', 'x']],
      ['ceiling', -1, 1, ['v', 'u']],
      ['ceiling', 1, -1, ['u', 'v']],
      ['ceiling', -1, -1, ['x', 'w']]
    ];

    for (const [surface, horizontal, vertical, expected] of cases) {
      expect(LevelEditor.prototype.getSlopePair.call(editor, surface, horizontal, vertical)).toEqual(expected);
    }
  });

  it('switches between floor and ceiling slopes after a lateral turn in every vertical direction', () => {
    const cases = [
      { surface: 'floor', vertical: 1, directions: [1, -1], first: ['q', 'r'], second: ['u', 'v'] },
      { surface: 'floor', vertical: 1, directions: [-1, 1], first: ['s', 't'], second: ['w', 'x'] },
      { surface: 'floor', vertical: -1, directions: [1, -1], first: ['s', 't'], second: ['w', 'x'] },
      { surface: 'floor', vertical: -1, directions: [-1, 1], first: ['q', 'r'], second: ['u', 'v'] },
      { surface: 'ceiling', vertical: 1, directions: [1, -1], first: ['w', 'x'], second: ['s', 't'] },
      { surface: 'ceiling', vertical: 1, directions: [-1, 1], first: ['u', 'v'], second: ['q', 'r'] },
      { surface: 'ceiling', vertical: -1, directions: [1, -1], first: ['u', 'v'], second: ['q', 'r'] },
      { surface: 'ceiling', vertical: -1, directions: [-1, 1], first: ['w', 'x'], second: ['s', 't'] }
    ];

    for (const { surface, vertical, directions, first, second } of cases) {
      const testEditor = Object.create(LevelEditor.prototype);
      testEditor.levelData = {
        header: { width: 30, height: 30 },
        grid: Array.from({ length: 30 }, () => Array(30).fill(' '))
      };
      testEditor.hillStart = { x: 10, y: 10 };
      testEditor.hillSeed = 1;
      testEditor.render = () => {};
      testEditor.renderPreview = () => {};
      testEditor.detectSurface = () => surface;
      testEditor.getHillDirectionArray = () => directions;

      testEditor.updateHillPreview(10, 10 + vertical * 2);

      const rows = [...new Set(testEditor.hillPreview.map(tile => tile.y))].sort((a, b) => vertical > 0 ? a - b : b - a);
      const pairAt = (row) => testEditor.hillPreview
        .filter(tile => tile.y === row)
        .sort((a, b) => a.x - b.x)
        .map(tile => tile.char);
      expect(pairAt(rows[0])).toEqual(first);
      expect(pairAt(rows[1])).toEqual(second);
    }
  });
});

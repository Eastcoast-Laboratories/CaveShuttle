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
    window: {},
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
});

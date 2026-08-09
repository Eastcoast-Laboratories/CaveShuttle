import { describe, it, expect } from 'vitest';
import { validateLevel, validateDef } from '../../src/levels/level-validator.js';

function makeValidLevel() {
  return {
    width: 7,
    height: 7,
    layout: [
      'ppppppp',
      'p*    p',
      'pm0   p',
      'p12   p',
      'p34   p',
      'p     p',
      'ppppppp'
    ]
  };
}

describe('validateLevel', () => {
  it('should validate a complete, reachable level', () => {
    const result = validateLevel(makeValidLevel());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when no restart point exists', () => {
    const level = makeValidLevel();
    level.layout[1] = 'p     p';
    const result = validateLevel(level);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("expected at least one '*'"))).toBe(true);
  });

  it('should fail when no pod holder exists', () => {
    const level = makeValidLevel();
    level.layout[2] = 'p 0   p';
    level.layout[3] = 'p12   p';
    level.layout[4] = 'p34   p';
    const result = validateLevel(level);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("expected exactly one pod holder 'm'"))).toBe(true);
  });

  it('should fail when the pod holder is not reachable', () => {
    const level = makeValidLevel();
    // keep the '*' but enclose the 'm' in a separate pocket
    level.layout[2] = 'p     p';
    level.layout[3] = 'p ppp p';
    level.layout[4] = 'p pmp p';
    level.layout[5] = 'p ppp p';
    const result = validateLevel(level);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('NOT reachable'))).toBe(true);
  });

  it('should fail when there is a disconnected open region', () => {
    const level = makeValidLevel();
    level.layout[2] = 'pm0 p p';
    level.layout[3] = 'p12p pp';
    level.layout[4] = 'p34pppp';
    const result = validateLevel(level);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('disconnected open region'))).toBe(true);
  });

  it('should fail when there is a cell directly above the pod holder', () => {
    const level = makeValidLevel();
    // move the 'm' down one row and put a wall above it, but keep it reachable
    level.layout[1] = 'p*    p';
    level.layout[2] = 'pp    p';
    level.layout[3] = 'pm0   p';
    level.layout[4] = 'p12   p';
    level.layout[5] = 'p34   p';
    const result = validateLevel(level);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('pod spawns into rock'))).toBe(true);
  });

  it('should return an inventory', () => {
    const result = validateLevel(makeValidLevel());
    expect(result.inventory).toEqual({
      rows: 7,
      width: 7,
      stars: 1,
      pod: 1,
      fuel: 0,
      reactor: 0,
      bunkers: 0,
      doors_H: 0,
      doors_G: 0,
      buttons: 0,
      checkpoints: 0
    });
  });
});

describe('validateDef', () => {
  it('should validate a raw .def-like text string', () => {
    const text = [
      '7          ; width',
      '7          ; height',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'ppppppp',
      'p*    p',
      'pm0   p',
      'p12   p',
      'p34   p',
      'p     p',
      'ppppppp'
    ].join('\n');
    const result = validateDef(text);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

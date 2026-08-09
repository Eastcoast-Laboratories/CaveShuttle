import { describe, it, expect } from 'vitest';
import { Bunker } from '../../src/game/bunker.js';

describe('Bunker (active)', () => {
  it('should create bunker with position and type', () => {
    const bunker = new Bunker(100, 200, 'P');
    expect(bunker.x).toBe(100);
    expect(bunker.y).toBe(200);
    expect(bunker.type).toBe('P');
    expect(bunker.active).toBe(true);
  });

  it('should default to type P', () => {
    const bunker = new Bunker(100, 200);
    expect(bunker.type).toBe('P');
  });

  it('should have default shootInterval of 120', () => {
    const bunker = new Bunker(100, 200, 'P');
    expect(bunker.shootInterval).toBe(120);
  });

  it('should decrease cooldown on update', () => {
    const bunker = new Bunker(100, 200, 'P');
    bunker.shootCooldown = 10;
    bunker.update(1, 0, 0);
    expect(bunker.shootCooldown).toBe(9);
  });

  it('should return null when cooldown > 0', () => {
    const bunker = new Bunker(100, 200, 'P');
    bunker.shootCooldown = 10;
    const result = bunker.update(1, 0, 0);
    expect(result).toBeNull();
  });

  it('should shoot when cooldown reaches 0 and ship is in range', () => {
    const bunker = new Bunker(100, 200, 'P');
    bunker.shootCooldown = 0;
    const result = bunker.update(1, 150, 250);
    expect(result).not.toBeNull();
    expect(result.angle).toBeDefined();
    expect(result.speed).toBe(3);
  });

  it('should reset cooldown after shooting', () => {
    const bunker = new Bunker(100, 200, 'P');
    bunker.shootCooldown = 0;
    bunker.update(1, 150, 250);
    expect(bunker.shootCooldown).toBe(120);
  });

  it('should not shoot when ship is out of range (>300)', () => {
    const bunker = new Bunker(100, 200, 'P');
    bunker.shootCooldown = 0;
    const result = bunker.update(1, 500, 500);
    expect(result).toBeNull();
  });

  it('should not update when inactive', () => {
    const bunker = new Bunker(100, 200, 'P');
    bunker.active = false;
    bunker.shootCooldown = 10;
    const result = bunker.update(1, 150, 250);
    expect(result).toBeUndefined();
    expect(bunker.shootCooldown).toBe(10);
  });

  it('should calculate angle towards ship', () => {
    const bunker = new Bunker(100, 200, 'P');
    bunker.shootCooldown = 0;
    const result = bunker.update(1, 200, 200);
    expect(result.angle).toBeCloseTo(0, 1); // ship is directly to the right
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Particle } from '../../src/game/particle.js';
import { ParticleSystem } from '../../src/game/particle-system.js';

describe('Particle (active)', () => {
  let particle;

  beforeEach(() => {
    particle = new Particle(100, 200, 1, 2, '#ff6600', 5, 30);
  });

  it('should create particle with properties', () => {
    expect(particle.x).toBe(100);
    expect(particle.y).toBe(200);
    expect(particle.vx).toBe(1);
    expect(particle.vy).toBe(2);
    expect(particle.color).toBe('#ff6600');
    expect(particle.size).toBe(5);
    expect(particle.lifetime).toBe(30);
    expect(particle.active).toBe(true);
  });

  it('should update position and age', () => {
    particle.update(1);
    expect(particle.x).toBe(101);
    expect(particle.y).toBe(202);
    expect(particle.age).toBe(1);
  });

  it('should be dead when age reaches lifetime', () => {
    particle.age = 29;
    particle.update(1);
    expect(particle.active).toBe(false);
  });

  it('should not be dead when age < lifetime', () => {
    particle.update(1);
    expect(particle.active).toBe(true);
  });

  it('should not update when inactive', () => {
    particle.active = false;
    particle.update(1);
    expect(particle.x).toBe(100);
  });

  it('should render with alpha based on age', () => {
    let capturedAlpha = null;
    const mockCtx = {
      globalAlpha: 1,
      fillStyle: null,
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(() => { capturedAlpha = mockCtx.globalAlpha; }),
    };
    particle.age = 15;
    particle.render(mockCtx, 0, 0);
    expect(capturedAlpha).toBeCloseTo(0.5, 1);
    expect(mockCtx.fillStyle).toBe('#ff6600');
    expect(mockCtx.beginPath).toHaveBeenCalled();
  });

  it('should not render when inactive', () => {
    const mockCtx = {
      globalAlpha: 1,
      fillStyle: null,
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn()
    };
    particle.active = false;
    particle.render(mockCtx, 0, 0);
    expect(mockCtx.beginPath).not.toHaveBeenCalled();
  });

  it('should deactivate', () => {
    particle.deactivate();
    expect(particle.active).toBe(false);
  });
});

describe('ParticleSystem (active)', () => {
  let system;

  beforeEach(() => {
    system = new ParticleSystem();
  });

  it('should create empty system', () => {
    expect(system.particles).toHaveLength(0);
  });

  it('should spawn explosion particles', () => {
    system.spawnExplosion(100, 200, 10);
    expect(system.particles).toHaveLength(10);
  });

  it('should spawn accelerate particles', () => {
    system.spawnAccelerate(100, 200, 0, 3);
    expect(system.particles).toHaveLength(3);
  });

  it('should spawn spark particles', () => {
    system.spawnSparks(100, 200, 5);
    expect(system.particles).toHaveLength(5);
  });

  it('should update all particles', () => {
    system.spawnExplosion(100, 200, 5);
    const initialX = system.particles[0].x;
    system.update(1);
    // Particles move based on their velocity, so x should change
    expect(system.particles[0].x).not.toBe(100);
  });

  it('should remove dead particles on update', () => {
    system.spawnExplosion(100, 200, 5);
    // Force all particles to die
    system.particles.forEach(p => { p.active = false; });
    system.update(1);
    expect(system.particles).toHaveLength(0);
  });

  it('should clear all particles', () => {
    system.spawnExplosion(100, 200, 5);
    system.clear();
    expect(system.particles).toHaveLength(0);
  });

  it('should render all particles', () => {
    system.spawnExplosion(100, 200, 3);
    const mockCtx = {
      globalAlpha: 1,
      fillStyle: null,
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn()
    };
    system.render(mockCtx, 0, 0);
    expect(mockCtx.beginPath).toHaveBeenCalledTimes(3);
  });
});

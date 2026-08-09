import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionDetection } from '../../src/physics/collision.js';
import { LevelRenderer } from '../../src/game/level-renderer.js';

describe('Collision Detection', () => {
  let collision;
  let levelRenderer;

  beforeEach(() => {
    levelRenderer = new LevelRenderer();
    collision = new CollisionDetection(levelRenderer);
  });

  it('should create collision detection', () => {
    expect(collision).toBeDefined();
    expect(collision.levelRenderer).toBe(levelRenderer);
  });

  it('should check circle collision', () => {
    const result = collision.checkCircleCollision(0, 0, 10, 15, 0, 10);
    expect(result).toBe(true);
  });

  it('should return false for non-overlapping circles', () => {
    const result = collision.checkCircleCollision(0, 0, 10, 30, 0, 10);
    expect(result).toBe(false);
  });

  it('should check AABB collision', () => {
    const result = collision.checkAABB(0, 0, 10, 10, 5, 5, 10, 10);
    expect(result).toBe(true);
  });

  it('should return false for non-overlapping AABB', () => {
    const result = collision.checkAABB(0, 0, 10, 10, 20, 20, 10, 10);
    expect(result).toBe(false);
  });

  it('should check point collision with level', () => {
    const level = { layout: ['# '] };
    const result = collision.checkPointCollision(4, 4, level);
    expect(result).toBe(true);
  });

  it('should return false for point not colliding with wall', () => {
    const level = { layout: ['# '] };
    const result = collision.checkPointCollision(20, 4, level);
    expect(result).toBe(false);
  });

  it('should get ship points', () => {
    const ship = { x: 100, y: 100 };
    const points = collision.getShipPoints(ship, 8);
    
    expect(points).toHaveLength(8);
    expect(points[0].x).toBeCloseTo(108);
    expect(points[0].y).toBeCloseTo(100);
  });

  it('should check ship collision with walls', () => {
    const ship = { x: 8, y: 8 }; // In wall tile
    const level = { layout: ['# '] };
    
    const result = collision.checkShipCollision(ship, level);
    // Ship center in wall tile should detect collision
    expect(result.collided).toBe(true);
  });

  it('should return no collision when ship in empty space', () => {
    const ship = { x: 40, y: 20 };
    const level = { layout: ['# '] };
    
    const result = collision.checkShipCollision(ship, level);
    expect(result.collided).toBe(false);
  });

  it('should resolve collision by bouncing ship', () => {
    const ship = { x: 10, y: 10, vx: 5, vy: 5 };
    const collisionResult = { collided: true };
    
    collision.resolveCollision(ship, collisionResult);
    
    expect(ship.vx).toBeLessThan(0);
    expect(ship.vy).toBeLessThan(0);
  });

  it('should not resolve if no collision', () => {
    const ship = { x: 10, y: 10, vx: 5, vy: 5 };
    const collisionResult = { collided: false };
    
    const oldVx = ship.vx;
    const oldVy = ship.vy;
    
    collision.resolveCollision(ship, collisionResult);
    
    expect(ship.vx).toBe(oldVx);
    expect(ship.vy).toBe(oldVy);
  });
});

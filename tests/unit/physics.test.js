import { describe, it, expect } from 'vitest';
import { Ship } from '../../src/game/ship.js';

describe('Ship Physics (active game/ship.js)', () => {
  it('should create ship with initial position', () => {
    const ship = new Ship(100, 200);
    expect(ship.x).toBe(100);
    expect(ship.y).toBe(200);
  });

  it('should have zero initial velocity', () => {
    const ship = new Ship(100, 200);
    expect(ship.vx).toBe(0);
    expect(ship.vy).toBe(0);
  });

  it('should have zero initial angle', () => {
    const ship = new Ship(100, 200);
    expect(ship.angle).toBe(0);
  });

  it('should have full fuel on creation', () => {
    const ship = new Ship(100, 200);
    expect(ship.fuel).toBe(100);
  });

  it('should apply gravity on update', () => {
    const ship = new Ship(100, 200);
    ship.update(1);
    expect(ship.vy).toBeGreaterThan(0);
  });

  it('should apply acceleration when accelerate is set', () => {
    const ship = new Ship(100, 200);
    ship.setAccelerate(true);
    ship.update(1);
    // At angle 0, sin(0)=0, cos(0)=1, so vx += 0, vy -= ACCELERATE_POWER
    expect(ship.vy).toBeLessThan(0);
  });

  it('should consume fuel when accelerating', () => {
    const ship = new Ship(100, 200);
    ship.setAccelerate(true);
    ship.update(1);
    expect(ship.fuel).toBeLessThan(100);
  });

  it('should not consume fuel when not accelerating', () => {
    const ship = new Ship(100, 200);
    ship.update(1);
    expect(ship.fuel).toBe(100);
  });

  it('should rotate left', () => {
    const ship = new Ship(100, 200);
    const initialAngle = ship.angle;
    ship.rotateLeft();
    expect(ship.angle).toBeLessThan(initialAngle);
  });

  it('should rotate right', () => {
    const ship = new Ship(100, 200);
    const initialAngle = ship.angle;
    ship.rotateRight();
    expect(ship.angle).toBeGreaterThan(initialAngle);
  });

  it('should apply friction to velocity', () => {
    const ship = new Ship(100, 200);
    ship.vx = 10;
    ship.vy = 10;
    ship.update(1);
    expect(Math.abs(ship.vx)).toBeLessThan(10);
    expect(Math.abs(ship.vy)).toBeLessThan(10);
  });

  it('should update position based on velocity', () => {
    const ship = new Ship(100, 200);
    ship.vx = 1;
    ship.vy = 0;
    ship.update(1);
    expect(ship.x).toBeGreaterThan(100);
  });

  it('should combine gravity and thrust', () => {
    const ship = new Ship(100, 200);
    ship.setAccelerate(true);
    ship.update(1);
    // Thrust at angle 0 pushes up (vy decreases), gravity pushes down (vy increases)
    // Net effect depends on values, but both forces are applied
    expect(ship.vy).not.toBe(0);
  });

  it('should handle multiple updates', () => {
    const ship = new Ship(100, 200);
    ship.setAccelerate(true);
    ship.update(1);
    ship.update(1);
    ship.update(1);
    expect(ship.y).not.toBe(200);
  });

  it('should clamp fuel to 0', () => {
    const ship = new Ship(100, 200);
    ship.fuel = 0;
    ship.setAccelerate(true);
    ship.update(1);
    expect(ship.fuel).toBe(0);
  });

  it('should set angle', () => {
    const ship = new Ship(100, 200);
    ship.setAngle(Math.PI / 2);
    expect(ship.angle).toBeCloseTo(Math.PI / 2, 5);
  });

  it('should set position and velocity', () => {
    const ship = new Ship(100, 200);
    ship.setPosition(50, 60);
    expect(ship.x).toBe(50);
    expect(ship.y).toBe(60);
    ship.setVelocity(3, 4);
    expect(ship.vx).toBe(3);
    expect(ship.vy).toBe(4);
  });
});

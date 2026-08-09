import { describe, it, expect } from 'vitest';
import { Ship } from '../../src/game/ship.js';
import { ROTATION_SPEED } from '../../src/core/constants.js';

describe('Ship', () => {
  it('should create ship with position', () => {
    const ship = new Ship(100, 200);
    expect(ship.x).toBe(100);
    expect(ship.y).toBe(200);
  });

  it('should have zero velocity initially', () => {
    const ship = new Ship(100, 200);
    expect(ship.vx).toBe(0);
    expect(ship.vy).toBe(0);
  });

  it('should have zero angle initially', () => {
    const ship = new Ship(100, 200);
    expect(ship.angle).toBe(0);
  });

  it('should have full fuel initially', () => {
    const ship = new Ship(100, 200);
    expect(ship.fuel).toBe(100);
  });

  it('should rotate left', () => {
    const ship = new Ship(100, 200);
    ship.rotateLeft();
    expect(ship.angle).toBe(-ROTATION_SPEED);
  });

  it('should rotate right', () => {
    const ship = new Ship(100, 200);
    ship.rotateRight();
    expect(ship.angle).toBe(ROTATION_SPEED);
  });

  it('should set accelerate', () => {
    const ship = new Ship(100, 200);
    ship.setAccelerate(true);
    expect(ship.accelerate).toBe(1);
    ship.setAccelerate(false);
    expect(ship.accelerate).toBe(0);
  });

  it('should apply gravity on update', () => {
    const ship = new Ship(100, 200);
    ship.update(1);
    expect(ship.vy).toBeGreaterThan(0);
  });

  it('should apply thrust on update when thrusting', () => {
    const ship = new Ship(100, 200);
    ship.setAccelerate(true);
    ship.update(1);
    expect(ship.vy).toBeLessThan(0); // Thrust pushes up
  });

  it('should consume fuel when thrusting', () => {
    const ship = new Ship(100, 200);
    ship.setAccelerate(true);
    ship.update(1);
    expect(ship.fuel).toBeLessThan(100);
  });

  it('should not consume fuel when not thrusting', () => {
    const ship = new Ship(100, 200);
    ship.update(1);
    expect(ship.fuel).toBe(100);
  });

  it('should clamp fuel to zero', () => {
    const ship = new Ship(100, 200);
    ship.fuel = 0;
    ship.setAccelerate(true);
    ship.update(10);
    expect(ship.fuel).toBe(0);
  });

  it('should set position', () => {
    const ship = new Ship(100, 200);
    ship.setPosition(300, 400);
    expect(ship.x).toBe(300);
    expect(ship.y).toBe(400);
  });

  it('should set velocity', () => {
    const ship = new Ship(100, 200);
    ship.setVelocity(5, 10);
    expect(ship.vx).toBe(5);
    expect(ship.vy).toBe(10);
  });
});

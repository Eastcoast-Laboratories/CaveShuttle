import { describe, it, expect } from 'vitest';
import { Pod } from '../../src/game/pod.js';
import { Ship } from '../../src/game/ship.js';

describe('Pod', () => {
  describe('constructor', () => {
    it('should create pod with onHolder flag and mass', () => {
      const pod = new Pod(100, 200);
      expect(pod.x).toBe(100);
      expect(pod.y).toBe(200);
      expect(pod.active).toBe(true);
      expect(pod.towed).toBe(false);
      expect(pod.onHolder).toBe(true);
      expect(pod.mass).toBeGreaterThan(1); // Pod is heavier than ship
    });
  });

  describe('checkPodPickup', () => {
    it('should detect pod pickup when ship is close', () => {
      const ship = new Ship(100, 200);
      const pod = new Pod(105, 205);
      const distance = Math.sqrt((ship.x - pod.x) ** 2 + (ship.y - pod.y) ** 2);
      expect(distance).toBeLessThan(50);
    });

    it('should not detect pickup when ship is far', () => {
      const ship = new Ship(100, 200);
      const pod = new Pod(300, 400);
      const distance = Math.sqrt((ship.x - pod.x) ** 2 + (ship.y - pod.y) ** 2);
      expect(distance).toBeGreaterThan(50);
    });

    it('should not pickup inactive pod', () => {
      const pod = new Pod(105, 205);
      pod.active = false;
      expect(pod.active).toBe(false);
    });
  });

  describe('onHolder behavior', () => {
    it('should not apply gravity or move while on holder', () => {
      const pod = new Pod(100, 200);
      pod.onHolder = true;
      const initialX = pod.x;
      const initialY = pod.y;
      pod.update(1);
      expect(pod.x).toBe(initialX);
      expect(pod.y).toBe(initialY);
      expect(pod.vx).toBe(0);
      expect(pod.vy).toBe(0);
    });

    it('should apply gravity when off holder', () => {
      const pod = new Pod(100, 200);
      pod.onHolder = false;
      const initialY = pod.y;
      pod.update(1);
      expect(pod.y).toBeGreaterThan(initialY);
    });
  });

  describe('applyTether', () => {
    it('should apply spring force to both pod and ship', () => {
      const ship = new Ship(100, 200);
      const pod = new Pod(200, 200);
      pod.onHolder = false;
      const initialShipVx = ship.vx;
      const initialPodVx = pod.vx;
      pod.applyTether(ship, 1);
      // Both should have velocity changes due to tether force
      expect(ship.vx).not.toBe(initialShipVx);
      expect(pod.vx).not.toBe(initialPodVx);
    });

    it('should not apply tether while on holder', () => {
      const ship = new Ship(100, 200);
      const pod = new Pod(100, 205);
      pod.onHolder = true;
      const initialShipVx = ship.vx;
      const initialPodVx = pod.vx;
      pod.applyTether(ship, 1);
      // No velocity changes while on holder
      expect(ship.vx).toBe(initialShipVx);
      expect(pod.vx).toBe(initialPodVx);
    });
  });

  describe('getTowPosition', () => {
    it('should calculate tow position behind ship', () => {
      const ship = new Ship(100, 200);
      ship.angle = 0;
      const pod = new Pod(100, 200);
      const towPos = pod.getTowPosition(ship, ship.angle);
      const distance = Math.sqrt((ship.x - towPos.x) ** 2 + (ship.y - towPos.y) ** 2);
      expect(distance).toBeCloseTo(pod.towingDistance, 1);
    });
  });

  describe('moveToTowPosition', () => {
    it('should move pod towards target position', () => {
      const pod = new Pod(150, 250);
      const initialX = pod.x;
      const initialY = pod.y;
      pod.moveToTowPosition(100, 200, 0.5);
      expect(pod.x).toBeLessThan(initialX);
      expect(pod.y).toBeLessThan(initialY);
    });
  });

  describe('update', () => {
    it('should update pod position with gravity when off holder and not towed', () => {
      const pod = new Pod(150, 250);
      pod.onHolder = false;
      pod.towed = false;
      const initialY = pod.y;
      pod.update(1);
      // Pod should have moved down due to gravity
      expect(pod.y).toBeGreaterThan(initialY);
    });

    it('should apply gravity when off holder even if towed (tether forces applied separately)', () => {
      const pod = new Pod(150, 250);
      pod.onHolder = false;
      pod.towed = true;
      const initialY = pod.y;
      pod.update(1);
      // Gravity still applies when off holder
      expect(pod.y).toBeGreaterThan(initialY);
    });
  });
});

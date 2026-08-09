import { describe, it, expect } from 'vitest';
import { Bullet } from '../../src/game/bullet.js';
import { Bunker } from '../../src/game/bunker.js';
import { Button } from '../../src/game/button.js';
import { Slider } from '../../src/game/slider.js';
import { Ship } from '../../src/game/ship.js';
import { Pod } from '../../src/game/pod.js';

describe('Bullet (active)', () => {
  it('should create bullet with position, angle and speed', () => {
    const bullet = new Bullet(100, 200, 0, 5);
    expect(bullet.x).toBe(100);
    expect(bullet.y).toBe(200);
    expect(bullet.vx).toBe(5); // cos(0) * 5
    expect(bullet.vy).toBe(0); // sin(0) * 5
    expect(bullet.active).toBe(true);
    expect(bullet.radius).toBe(3);
  });

  it('should update position based on velocity', () => {
    const bullet = new Bullet(100, 200, 0, 5);
    bullet.update(1);
    expect(bullet.x).toBe(105);
    expect(bullet.y).toBe(200);
  });

  it('should deactivate', () => {
    const bullet = new Bullet(100, 200, 0, 5);
    bullet.deactivate();
    expect(bullet.active).toBe(false);
  });

  it('should not update when inactive', () => {
    const bullet = new Bullet(100, 200, 0, 5);
    bullet.deactivate();
    bullet.update(1);
    expect(bullet.x).toBe(100);
  });

  it('should set position', () => {
    const bullet = new Bullet(100, 200, 0, 5);
    bullet.setPosition(50, 60);
    expect(bullet.x).toBe(50);
    expect(bullet.y).toBe(60);
  });

  it('should set velocity', () => {
    const bullet = new Bullet(100, 200, 0, 5);
    bullet.setVelocity(3, 4);
    expect(bullet.vx).toBe(3);
    expect(bullet.vy).toBe(4);
  });
});

describe('Bunker (active)', () => {
  it('should create bunker with type', () => {
    const bunker = new Bunker(100, 200, 'P');
    expect(bunker.x).toBe(100);
    expect(bunker.y).toBe(200);
    expect(bunker.type).toBe('P');
    expect(bunker.active).toBe(true);
  });

  it('should have shootInterval of 120', () => {
    const bunker = new Bunker(100, 200, 'P');
    expect(bunker.shootInterval).toBe(120);
  });

  it('should not shoot when inactive', () => {
    const bunker = new Bunker(100, 200, 'P');
    bunker.active = false;
    bunker.shootCooldown = 0;
    const result = bunker.update(1, 150, 250);
    expect(result).toBeUndefined();
  });
});

describe('Button (active)', () => {
  it('should create button with type and tag', () => {
    const button = new Button(100, 200, 'L', 1);
    expect(button.x).toBe(100);
    expect(button.y).toBe(200);
    expect(button.type).toBe('L');
    expect(button.tag).toBe(1);
    expect(button.pressed).toBe(false);
  });

  it('should press and set cooldown', () => {
    const button = new Button(100, 200, 'L', 1);
    const result = button.press();
    expect(result).toBe(true);
    expect(button.pressed).toBe(true);
    expect(button.pressCooldown).toBe(30);
  });

  it('should not press during cooldown', () => {
    const button = new Button(100, 200, 'L', 1);
    button.press();
    const result = button.press();
    expect(result).toBe(false);
  });

  it('should update cooldown', () => {
    const button = new Button(100, 200, 'L', 1);
    button.press();
    button.update(10);
    expect(button.pressCooldown).toBe(20);
  });

  it('should set position', () => {
    const button = new Button(100, 200, 'L', 1);
    button.setPosition(50, 60);
    expect(button.x).toBe(50);
    expect(button.y).toBe(60);
  });
});

describe('Slider (active)', () => {
  it('should create slider with direction', () => {
    const slider = new Slider(100, 200, '@', 'horizontal');
    expect(slider.x).toBe(100);
    expect(slider.y).toBe(200);
    expect(slider.direction).toBe('horizontal');
    expect(slider.active).toBe(false);
  });

  it('should activate and set target', () => {
    const slider = new Slider(100, 200, '@', 'horizontal');
    slider.activate();
    expect(slider.active).toBe(true);
    expect(slider.targetX).toBe(132); // 100 + moveDistance(32)
  });

  it('should deactivate and set target back', () => {
    const slider = new Slider(100, 200, '@', 'horizontal');
    slider.activate();
    slider.deactivate();
    expect(slider.active).toBe(false);
    expect(slider.targetX).toBe(68); // 100 - moveDistance(32)
  });

  it('should move towards target on update', () => {
    const slider = new Slider(100, 200, '@', 'horizontal');
    slider.activate();
    slider.update(1);
    expect(slider.x).toBe(101); // speed=1
  });

  it('should set position', () => {
    const slider = new Slider(100, 200, '@', 'horizontal');
    slider.setPosition(50, 60);
    expect(slider.x).toBe(50);
    expect(slider.y).toBe(60);
    expect(slider.targetX).toBe(50);
    expect(slider.targetY).toBe(60);
  });
});

describe('Ship (active)', () => {
  it('should create ship with fuel', () => {
    const ship = new Ship(100, 200);
    expect(ship.x).toBe(100);
    expect(ship.y).toBe(200);
    expect(ship.fuel).toBe(100);
    expect(ship.accelerate).toBe(0);
  });

  it('should apply gravity on update', () => {
    const ship = new Ship(100, 200);
    ship.update(1);
    expect(ship.vy).toBeGreaterThan(0);
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

  it('should rotate left and right', () => {
    const ship = new Ship(100, 200);
    const initialAngle = ship.angle;
    ship.rotateLeft();
    expect(ship.angle).toBeLessThan(initialAngle);
    ship.rotateRight();
    expect(ship.angle).toBe(initialAngle);
  });

  it('should set accelerate', () => {
    const ship = new Ship(100, 200);
    ship.setAccelerate(true);
    expect(ship.accelerate).toBe(1);
    ship.setAccelerate(false);
    expect(ship.accelerate).toBe(0);
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

describe('Pod (active)', () => {
  it('should create pod on holder', () => {
    const pod = new Pod(100, 200);
    expect(pod.x).toBe(100);
    expect(pod.y).toBe(200);
    expect(pod.active).toBe(true);
    expect(pod.onHolder).toBe(true);
    expect(pod.towed).toBe(false);
  });

  it('should not move while on holder', () => {
    const pod = new Pod(100, 200);
    pod.update(1);
    expect(pod.x).toBe(100);
    expect(pod.y).toBe(200);
    expect(pod.vx).toBe(0);
    expect(pod.vy).toBe(0);
  });

  it('should apply gravity when off holder', () => {
    const pod = new Pod(100, 200);
    pod.onHolder = false;
    pod.update(1);
    expect(pod.vy).toBeGreaterThan(0);
  });

  it('should set towing state', () => {
    const pod = new Pod(100, 200);
    pod.setTowing(true);
    expect(pod.towed).toBe(true);
    expect(pod.onHolder).toBe(false);
  });

  it('should set angle', () => {
    const pod = new Pod(100, 200);
    pod.setAngle(Math.PI / 2);
    expect(pod.angle).toBeCloseTo(Math.PI / 2, 5);
  });

  it('should set accelerate', () => {
    const pod = new Pod(100, 200);
    pod.setAccelerate(true);
    expect(pod.accelerate).toBe(1);
  });
});

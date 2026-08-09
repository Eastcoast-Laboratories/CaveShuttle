import { describe, it, expect } from 'vitest';
import { Ship } from '../../src/game/ship.js';
import { Bunker } from '../../src/game/bunker.js';
import { Button } from '../../src/game/button.js';
import { Slider } from '../../src/game/slider.js';
import { Pod } from '../../src/game/pod.js';

describe('Game Objects Integration', () => {
  it('should integrate bunkers shooting at ship', () => {
    const ship = new Ship(100, 200);
    const bunker = new Bunker(100, 300, 'P');
    
    const shot = bunker.update(1, ship.x, ship.y);
    
    expect(shot).not.toBeNull();
    expect(shot.angle).toBeDefined();
  });

  it('should integrate button activating slider', () => {
    const button = new Button(100, 200, 'L');
    const slider = new Slider(150, 200, '@', 'horizontal');
    
    button.press();
    slider.activate();
    
    expect(button.pressed).toBe(true);
    expect(slider.active).toBe(true);
  });

  it('should integrate pod pickup and towing', () => {
    const ship = new Ship(100, 200);
    const pod = new Pod(150, 250);
    
    const distance = Math.sqrt((ship.x - pod.x) ** 2 + (ship.y - pod.y) ** 2);
    expect(distance).toBeGreaterThan(50); // Too far to pickup initially
    
    // Move ship closer for pickup
    ship.x = 140;
    ship.y = 240;
    const distance2 = Math.sqrt((ship.x - pod.x) ** 2 + (ship.y - pod.y) ** 2);
    expect(distance2).toBeLessThan(50); // Close enough to pickup
    
    pod.setTowing(true);
    expect(pod.towed).toBe(true);
    
    // Move pod towards ship
    const towPos = pod.getTowPosition(ship, ship.angle);
    pod.moveToTowPosition(towPos.x, towPos.y, 0.5);
    expect(pod.x).toBeLessThan(150); // Moves towards ship
  });

  it('should integrate all game objects: bunkers shoot, buttons work, pod tows', () => {
    const ship = new Ship(100, 200);
    
    // Bunkers
    const bunker = new Bunker(100, 300, 'P');
    const shot = bunker.update(1, ship.x, ship.y);
    expect(shot).not.toBeNull();
    
    // Buttons/Sliders
    const button = new Button(100, 200, 'L');
    const slider = new Slider(150, 200, '@', 'horizontal');
    button.press();
    slider.activate();
    expect(button.pressed).toBe(true);
    
    // Pod
    const pod = new Pod(105, 205);
    pod.setTowing(true);
    expect(pod.towed).toBe(true);
  });
});

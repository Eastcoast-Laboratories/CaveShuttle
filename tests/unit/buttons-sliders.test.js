import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Button } from '../../src/game/button.js';
import { Slider } from '../../src/game/slider.js';

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

  it('should activate and set horizontal target', () => {
    const slider = new Slider(100, 200, '@', 'horizontal');
    slider.activate();
    expect(slider.active).toBe(true);
    expect(slider.targetX).toBe(132);
  });

  it('should activate and set vertical target', () => {
    const slider = new Slider(100, 200, '@', 'vertical');
    slider.activate();
    expect(slider.active).toBe(true);
    expect(slider.targetY).toBe(232);
  });

  it('should deactivate and set target back', () => {
    const slider = new Slider(100, 200, '@', 'horizontal');
    slider.activate();
    slider.deactivate();
    expect(slider.active).toBe(false);
    expect(slider.targetX).toBe(68);
  });

  it('should move towards target on update', () => {
    const slider = new Slider(100, 200, '@', 'horizontal');
    slider.activate();
    slider.update(1);
    expect(slider.x).toBe(101);
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

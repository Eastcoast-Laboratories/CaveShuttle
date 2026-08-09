import { describe, it, expect, vi } from 'vitest';
import { SoundManager } from '../../src/audio/sound-manager.js';

describe('Audio Integration', () => {
  it('should integrate audio engine with sound manager', async () => {
    const mockAudioContext = {
      createBufferSource: vi.fn(() => ({
        buffer: null,
        loop: false,
        connect: vi.fn(),
        start: vi.fn()
      })),
      createGain: vi.fn(() => ({
        gain: { value: 1 },
        connect: vi.fn()
      })),
      destination: {}
    };
    window.AudioContext = vi.fn(() => mockAudioContext);
    
    const manager = new SoundManager();
    await manager.init();
    
    const soundBuffers = {
      thrust: { duration: 1 },
      shoot: { duration: 0.5 },
      explosion: { duration: 1 }
    };
    
    manager.loadSounds(soundBuffers);
    
    expect(manager.engine.hasSound('thrust')).toBe(true);
    expect(manager.engine.hasSound('shoot')).toBe(true);
    expect(manager.engine.hasSound('explosion')).toBe(true);
  });

  it('should play multiple sounds in sequence', async () => {
    const mockAudioContext = {
      createBufferSource: vi.fn(() => ({
        buffer: null,
        loop: false,
        connect: vi.fn(),
        start: vi.fn()
      })),
      createGain: vi.fn(() => ({
        gain: { value: 1 },
        connect: vi.fn()
      })),
      destination: {}
    };
    window.AudioContext = vi.fn(() => mockAudioContext);
    
    const manager = new SoundManager();
    await manager.init();
    
    const soundBuffers = {
      thrust: { duration: 1 },
      shoot: { duration: 0.5 },
      pickup: { duration: 0.3 }
    };
    
    manager.loadSounds(soundBuffers);
    
    manager.playThrust();
    manager.playShoot();
    manager.playPickup();
    
    expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(3);
  });

  it('should handle thrust sound with start and stop', async () => {
    const mockAudioContext = {
      createBufferSource: vi.fn(() => ({
        buffer: null,
        loop: false,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn()
      })),
      createGain: vi.fn(() => ({
        gain: { value: 1 },
        connect: vi.fn()
      })),
      destination: {}
    };
    window.AudioContext = vi.fn(() => mockAudioContext);
    
    const manager = new SoundManager();
    await manager.init();
    
    const soundBuffers = { thrust: { duration: 1 } };
    manager.loadSounds(soundBuffers);
    
    manager.playThrust();
    expect(manager.currentThrustSound).not.toBeNull();
    
    manager.stopThrust();
    expect(manager.currentThrustSound).toBeNull();
  });

  it('should integrate all game sounds', async () => {
    const mockAudioContext = {
      createBufferSource: vi.fn(() => ({
        buffer: null,
        loop: false,
        connect: vi.fn(),
        start: vi.fn()
      })),
      createGain: vi.fn(() => ({
        gain: { value: 1 },
        connect: vi.fn()
      })),
      destination: {}
    };
    window.AudioContext = vi.fn(() => mockAudioContext);
    
    const manager = new SoundManager();
    await manager.init();
    
    const soundBuffers = {
      thrust: { duration: 1 },
      shoot: { duration: 0.5 },
      explosion: { duration: 1 },
      pickup: { duration: 0.3 },
      shield: { duration: 0.5 },
      tractor: { duration: 1 }
    };
    
    manager.loadSounds(soundBuffers);
    
    // Play all sounds
    manager.playThrust();
    manager.playShoot();
    manager.playExplosion();
    manager.playPickup();
    manager.playShield();
    manager.playTractor();
    
    expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(6);
  });
});

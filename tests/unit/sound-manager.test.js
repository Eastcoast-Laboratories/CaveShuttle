import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SoundManager } from '../../src/audio/sound-manager.js';

describe('Sound Manager', () => {
  let manager;

  beforeEach(() => {
    manager = new SoundManager();
  });

  it('should create manager with audio engine', () => {
    expect(manager.engine).toBeDefined();
    expect(manager.sounds.thrust).toBeNull();
  });

  it('should initialize audio engine', async () => {
    // Mock AudioContext
    const mockAudioContext = vi.fn();
    window.AudioContext = mockAudioContext;
    
    await manager.init();
    expect(manager.engine.initialized).toBe(true);
  });

  it('should load sounds', async () => {
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
    
    await manager.init();
    
    const soundBuffers = {
      thrust: { duration: 1 },
      shoot: { duration: 0.5 }
    };
    
    manager.loadSounds(soundBuffers);
    expect(manager.engine.hasSound('thrust')).toBe(true);
    expect(manager.engine.hasSound('shoot')).toBe(true);
  });

  it('should play thrust sound', async () => {
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
    
    await manager.init();
    
    const soundBuffers = { thrust: { duration: 1 } };
    manager.loadSounds(soundBuffers);
    
    manager.playThrust();
    expect(manager.currentThrustSound).not.toBeNull();
  });

  it('should not play thrust if already playing', async () => {
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
    
    await manager.init();
    
    const soundBuffers = { thrust: { duration: 1 } };
    manager.loadSounds(soundBuffers);
    
    manager.playThrust();
    const firstSound = manager.currentThrustSound;
    manager.playThrust();
    expect(manager.currentThrustSound).toBe(firstSound);
  });

  it('should stop thrust sound', async () => {
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
    
    await manager.init();
    
    const soundBuffers = { thrust: { duration: 1 } };
    manager.loadSounds(soundBuffers);
    
    manager.playThrust();
    manager.stopThrust();
    expect(manager.currentThrustSound).toBeNull();
  });

  it('should play shoot sound', async () => {
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
    
    await manager.init();
    
    const soundBuffers = { shoot: { duration: 0.5 } };
    manager.loadSounds(soundBuffers);
    
    manager.playShoot();
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
  });

  it('should play explosion sound', async () => {
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
    
    await manager.init();
    
    const soundBuffers = { explosion: { duration: 1 } };
    manager.loadSounds(soundBuffers);
    
    manager.playExplosion();
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
  });

  it('should play pickup sound', async () => {
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
    
    await manager.init();
    
    const soundBuffers = { pickup: { duration: 0.3 } };
    manager.loadSounds(soundBuffers);
    
    manager.playPickup();
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
  });

  it('should play shield sound', async () => {
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
    
    await manager.init();
    
    const soundBuffers = { shield: { duration: 0.5 } };
    manager.loadSounds(soundBuffers);
    
    manager.playShield();
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
  });

  it('should play tractor sound with loop', async () => {
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
    
    await manager.init();
    
    const soundBuffers = { tractor: { duration: 1 } };
    manager.loadSounds(soundBuffers);
    
    manager.playTractor();
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
  });

  it('should resume audio engine', async () => {
    const mockAudioContext = {
      state: 'suspended',
      resume: vi.fn()
    };
    window.AudioContext = vi.fn(() => mockAudioContext);
    
    await manager.init();
    manager.resume();
    expect(mockAudioContext.resume).toHaveBeenCalled();
  });
});

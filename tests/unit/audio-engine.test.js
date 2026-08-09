import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioEngine } from '../../src/audio/audio-engine.js';

describe('Audio Engine', () => {
  let engine;

  beforeEach(() => {
    engine = new AudioEngine();
  });

  it('should create engine with no context', () => {
    expect(engine.audioContext).toBeNull();
    expect(engine.initialized).toBe(false);
  });

  it('should initialize audio context', async () => {
    // Mock AudioContext
    const mockAudioContext = vi.fn();
    window.AudioContext = mockAudioContext;
    
    await engine.init();
    expect(engine.initialized).toBe(true);
  });

  it('should load sound', () => {
    const mockBuffer = { duration: 1 };
    engine.loadSound('thrust', mockBuffer);
    expect(engine.hasSound('thrust')).toBe(true);
  });

  it('should check if sound exists', () => {
    const mockBuffer = { duration: 1 };
    engine.loadSound('thrust', mockBuffer);
    expect(engine.hasSound('thrust')).toBe(true);
    expect(engine.hasSound('nonexistent')).toBe(false);
  });

  it('should clear all sounds', () => {
    const mockBuffer = { duration: 1 };
    engine.loadSound('thrust', mockBuffer);
    engine.loadSound('explosion', mockBuffer);
    engine.clearSounds();
    expect(engine.hasSound('thrust')).toBe(false);
    expect(engine.hasSound('explosion')).toBe(false);
  });

  it('should not play sound when not initialized', () => {
    const result = engine.playSound('thrust');
    expect(result).toBeNull();
  });

  it('should not play sound when sound not loaded', async () => {
    // Mock AudioContext
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
    
    await engine.init();
    const result = engine.playSound('nonexistent');
    expect(result).toBeNull();
  });

  it('should play sound when initialized and loaded', async () => {
    // Mock AudioContext
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
    
    await engine.init();
    
    const mockBuffer = { duration: 1 };
    engine.loadSound('thrust', mockBuffer);
    
    const result = engine.playSound('thrust');
    expect(result).not.toBeNull();
    expect(result.source.start).toHaveBeenCalled();
  });

  it('should play sound with custom volume', async () => {
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
    
    await engine.init();
    
    const mockBuffer = { duration: 1 };
    engine.loadSound('thrust', mockBuffer);
    
    engine.playSound('thrust', 0.5);
    expect(mockAudioContext.createGain).toHaveBeenCalled();
  });

  it('should play sound with loop', async () => {
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
    
    await engine.init();
    
    const mockBuffer = { duration: 1 };
    engine.loadSound('thrust', mockBuffer);
    
    engine.playSound('thrust', 1.0, true);
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
  });

  it('should stop sound', async () => {
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
    
    await engine.init();
    
    const mockBuffer = { duration: 1 };
    engine.loadSound('thrust', mockBuffer);
    
    const soundInstance = engine.playSound('thrust');
    engine.stopSound(soundInstance);
    expect(soundInstance.source.stop).toHaveBeenCalled();
  });

  it('should set volume on sound instance', async () => {
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
    
    await engine.init();
    
    const mockBuffer = { duration: 1 };
    engine.loadSound('thrust', mockBuffer);
    
    const soundInstance = engine.playSound('thrust');
    engine.setVolume(soundInstance, 0.7);
    expect(soundInstance.gainNode.gain.value).toBe(0.7);
  });

  it('should resume suspended audio context', async () => {
    const mockAudioContext = {
      state: 'suspended',
      resume: vi.fn()
    };
    window.AudioContext = vi.fn(() => mockAudioContext);
    
    await engine.init();
    engine.resume();
    expect(mockAudioContext.resume).toHaveBeenCalled();
  });
});

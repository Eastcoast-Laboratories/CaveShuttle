// Sound manager for game-specific sounds
import { AudioEngine } from './audio-engine.js';
import { loadSoundBuffers } from './sound-loader.js';

// Per-sound base mix levels (0..1). The master volume is applied on top of this.
const SOUND_VOLUMES = {
  shipThrust: 0.3,
  podThrust: 0.3,
  shipFire: 0.5,
  podFire: 0.5,
  bunkerFire: 0.4,
  podWobble: 0.3,
  explosion: 0.7,
  fuelDrain: 0.3,
  podDock: 0.6,
  wormholeAmbient: 0.4,
  wormholeComplete: 0.7,
  noFuel: 0.6,
  respawn: 0.6,
  powerupGodMode: 0.6,
  powerupMultiShot: 0.6,
};

export class SoundManager {
  constructor() {
    this.engine = new AudioEngine();
    // Active looping sound instances keyed by logical name (only one per name).
    this.loops = {};
    this.oneShots = {}; // one-shot sound instances keyed by name (for stopping)
    this.ready = false;
  }

  async init() {
    await this.engine.init();
    if (!this.engine.audioContext) {
      console.warn('[SOUND_MANAGER] init failed: no audio context');
      return;
    }
    try {
      const buffers = await loadSoundBuffers(this.engine.audioContext);
      this.loadSounds(buffers);
      this.ready = true;
      console.log('[SOUND_MANAGER] init complete, ready=true');
    } catch (err) {
      console.error('[SOUND_MANAGER] init failed:', err.message);
      throw err;
    }
  }

  loadSounds(soundBuffers) {
    for (const [name, buffer] of Object.entries(soundBuffers)) {
      this.engine.loadSound(name, buffer);
    }
  }

  // Play a one-shot sound (fire, explosion, dock, level complete).
  // The instance is stored so it can be stopped via stopOnce if needed.
  playOnce(name) {
    const base = SOUND_VOLUMES[name] ?? 0.5;
    const master = this.engine.masterVolume;
    console.log(`[SOUND_MANAGER] playOnce name=${name} base=${base.toFixed(2)} master=${master.toFixed(2)} effective=${(base * master).toFixed(2)}`);
    const instance = this.engine.playSound(name, base, false);
    if (instance) {
      this.oneShots[name] = instance;
    }
    return instance;
  }

  // Stop a one-shot sound if it is currently playing.
  stopOnce(name) {
    if (this.oneShots[name]) {
      console.log('[SOUND_MANAGER] stopOnce name=', name);
      this.engine.stopSound(this.oneShots[name]);
      this.oneShots[name] = null;
    }
  }

  // Start a looping sound if it is not already playing (thrust, ambient, etc.).
  startLoop(name) {
    if (this.loops[name]) return;
    const base = SOUND_VOLUMES[name] ?? 0.3;
    const master = this.engine.masterVolume;
    console.log(`[SOUND_MANAGER] startLoop name=${name} base=${base.toFixed(2)} master=${master.toFixed(2)} effective=${(base * master).toFixed(2)}`);
    this.loops[name] = this.engine.playSound(name, base, true);
  }

  // Stop a looping sound if it is currently playing.
  stopLoop(name) {
    if (this.loops[name]) {
      console.log('[SOUND_MANAGER] stopLoop name=', name);
      this.engine.stopSound(this.loops[name]);
      this.loops[name] = null;
    }
  }

  // Fade a looping sound out over the given seconds and release its slot.
  fadeLoop(name, durationSeconds = 1.0) {
    const instance = this.loops[name];
    if (!instance) {
      console.log('[SOUND_FADE] no active loop to fade for', name);
      return;
    }
    console.log('[SOUND_MANAGER] fadeLoop name=', name, 'duration=', durationSeconds, 'instance=', instance ? 'present' : 'missing');
    // Use the class prototype so even an engine instance created before fadeOut existed uses the current method.
    AudioEngine.prototype.fadeOut.call(this.engine, instance, durationSeconds);
    this.loops[name] = null;
  }

  // Convenience: drive a looping sound directly from a boolean game state.
  setLoop(name, active) {
    if (active) {
      this.startLoop(name);
    } else {
      this.stopLoop(name);
    }
  }

  // Stop every currently playing looping sound (e.g. on level end / unmount).
  stopAllLoops() {
    for (const name of Object.keys(this.loops)) {
      this.stopLoop(name);
    }
  }

  setMasterVolume(volume) {
    console.log('[SOUND_MANAGER] setMasterVolume', volume.toFixed(2));
    this.engine.setMasterVolume(volume);
  }

  resume() {
    console.log('[SOUND_MANAGER] resume');
    this.engine.resume();
  }
}

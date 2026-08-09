// Audio engine using Web Audio API
export class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.sounds = new Map();
    this.initialized = false;
    // Currently playing sound instances, so master volume changes apply live.
    this.activeSounds = new Set();
    // Master volume multiplier (0..1) applied on top of each sound's base volume.
    this.masterVolume = 1;
  }

  async init() {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      console.log('[AUDIO_ENGINE] initialized, audioContext.state:', this.audioContext.state);
    } catch (error) {
      console.error('[AUDIO_ENGINE] Web Audio API not supported:', error);
    }
  }

  loadSound(name, audioBuffer) {
    this.sounds.set(name, audioBuffer);
  }

  playSound(name, volume = 1.0, loop = false) {
    if (!this.initialized || !this.audioContext) {
      console.warn('[AUDIO_ENGINE] playSound skipped: not initialized', { name });
      return null;
    }

    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn('[AUDIO_ENGINE] playSound skipped: buffer not loaded', { name });
      return null;
    }

    const effective = volume * this.masterVolume;
    console.log(`[AUDIO_ENGINE] playSound name=${name} base=${volume.toFixed(2)} master=${this.masterVolume.toFixed(2)} effective=${effective.toFixed(2)} state=${this.audioContext.state} loop=${loop}`);

    const source = this.audioContext.createBufferSource();
    source.buffer = sound;
    source.loop = loop;

    const gainNode = this.audioContext.createGain();
    // baseVolume is the sound's own mix level; effective gain = base * master.
    gainNode.gain.value = effective;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const instance = { source, gainNode, name, baseVolume: volume };
    this.activeSounds.add(instance);
    source.onended = () => {
      if (instance.isFading) {
        console.log('[AUDIO_FADE] onended', instance.name, 'at ctxTime=', this.audioContext ? this.audioContext.currentTime : null);
      }
      this.activeSounds.delete(instance);
    };

    source.start(0);

    return instance;
  }

  stopSound(soundInstance) {
    if (soundInstance && soundInstance.source) {
      soundInstance.source.stop();
    }
    this.activeSounds.delete(soundInstance);
  }

  // Set the global master volume (0..1) and rescale every active sound so
  // running loops react immediately to the volume slider.
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    console.log('[AUDIO_ENGINE] setMasterVolume', this.masterVolume.toFixed(2), 'activeSounds=', this.activeSounds.size);
    for (const instance of this.activeSounds) {
      if (instance.isFading) continue;
      instance.gainNode.gain.value = instance.baseVolume * this.masterVolume;
    }
  }

  setVolume(soundInstance, volume) {
    if (soundInstance && soundInstance.gainNode) {
      soundInstance.gainNode.gain.value = volume;
    }
  }

  // Smoothly fade a sound out over the given duration and stop it afterwards.
  fadeOut(soundInstance, durationSeconds = 1.0) {
    if (!soundInstance) { console.log('[AUDIO_FADE] skipped: no instance'); return; }
    if (!soundInstance.gainNode) { console.log('[AUDIO_FADE] skipped:', soundInstance.name || 'unknown', 'no gainNode'); return; }
    if (!this.audioContext) { console.log('[AUDIO_FADE] skipped:', soundInstance.name, 'no audioContext'); return; }
    const now = this.audioContext.currentTime;
    const gain = soundInstance.gainNode.gain;
    console.log('[AUDIO_FADE] start', soundInstance.name, 'gain=', gain.value, 'now=', now, 'duration=', durationSeconds, 'sourceState=', soundInstance.source ? 'present' : 'missing');
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    // Linear ramp is more predictable than exponential for short fades.
    gain.linearRampToValueAtTime(0.0001, now + durationSeconds);
    soundInstance.isFading = true;
    if (soundInstance.source) {
      try {
        soundInstance.source.stop(now + durationSeconds + 0.05);
        console.log('[AUDIO_FADE] scheduled stop for', soundInstance.name, 'at', now + durationSeconds + 0.05);
      } catch (err) {
        console.log('[AUDIO_FADE] source.stop failed for', soundInstance.name, err);
      }
    } else {
      console.log('[AUDIO_FADE] no source to stop for', soundInstance.name);
    }
  }

  hasSound(name) {
    return this.sounds.has(name);
  }

  clearSounds() {
    this.sounds.clear();
  }

  resume() {
    if (this.audioContext) {
      console.log('[AUDIO_ENGINE] resume called, audioContext.state:', this.audioContext.state);
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    }
  }
}

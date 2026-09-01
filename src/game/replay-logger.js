// ReplayLogger: records input state per frame for server-side score validation.
// Only stores entries when the input bitmask changes (delta compression).
// Input bitmask (player 1):
//   bit 0: rotateLeft
//   bit 1: rotateRight
//   bit 2: thrust
//   bit 3: fire
//   bit 4: tractorBeam/shield
// Player 2 bitmask (only used in two-player mode):
//   bit 0: rotateLeft (A)
//   bit 1: rotateRight (D)
//   bit 2: thrust (W)
//   bit 3: fire (Shift)

export const REPLAY_INPUT_BITS = {
  ROTATE_LEFT: 1 << 0,
  ROTATE_RIGHT: 1 << 1,
  THRUST: 1 << 2,
  FIRE: 1 << 3,
  TRACTOR_BEAM: 1 << 4,
};

export const REPLAY_P2_INPUT_BITS = {
  ROTATE_LEFT: 1 << 0,
  ROTATE_RIGHT: 1 << 1,
  THRUST: 1 << 2,
  FIRE: 1 << 3,
};

export class ReplayLogger {
  constructor() {
    this._entries = [];
    this._durationMs = 0;
    this._lastP1Bitmask = -1;
    this._lastP2Bitmask = -1;
    this._active = false;
  }

  start() {
    this._entries = [];
    this._durationMs = 0;
    this._lastP1Bitmask = -1;
    this._lastP2Bitmask = -1;
    this._active = true;
  }

  record(p1Bitmask, p2Bitmask, activeLevelTimeMs) {
    if (!this._active) return;
    const t = Math.round(activeLevelTimeMs);
    if (p1Bitmask !== this._lastP1Bitmask || p2Bitmask !== this._lastP2Bitmask) {
      const entry = { t, i: p1Bitmask };
      if (p2Bitmask !== 0) {
        entry.p = p2Bitmask;
      }
      this._entries.push(entry);
      this._lastP1Bitmask = p1Bitmask;
      this._lastP2Bitmask = p2Bitmask;
    }
  }

  stop(activeLevelTimeMs) {
    this._durationMs = Math.round(activeLevelTimeMs);
    this._active = false;
  }

  // Record a special event (e.g. shortcut activation) with a timestamp.
  // These events are flagged in the replay so the community server can
  // display a warning when a score was achieved with shortcuts active.
  recordEvent(type, data, activeLevelTimeMs) {
    if (!this._active) return;
    const t = Math.round(activeLevelTimeMs);
    this._entries.push({ t, e: type, ...data });
    // Update last bitmasks so the next record() call doesn't skip
    this._lastP1Bitmask = -1;
    this._lastP2Bitmask = -1;
  }

  reset() {
    this._entries = [];
    this._durationMs = 0;
    this._lastP1Bitmask = -1;
    this._lastP2Bitmask = -1;
    this._active = false;
  }

  getLog() {
    return {
      entries: this._entries,
      durationMs: this._durationMs,
      inputCount: this._entries.length,
      timeBasis: 'activeLevel',
    };
  }

  isActive() {
    return this._active;
  }
}

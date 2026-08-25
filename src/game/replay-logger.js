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
    this._startTime = 0;
    this._lastP1Bitmask = -1;
    this._lastP2Bitmask = -1;
    this._active = false;
  }

  start() {
    this._entries = [];
    this._startTime = performance.now();
    this._lastP1Bitmask = -1;
    this._lastP2Bitmask = -1;
    this._active = true;
  }

  record(p1Bitmask, p2Bitmask = 0) {
    if (!this._active) return;
    const t = Math.round(performance.now() - this._startTime);
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

  stop() {
    this._active = false;
  }

  reset() {
    this._entries = [];
    this._startTime = 0;
    this._lastP1Bitmask = -1;
    this._lastP2Bitmask = -1;
    this._active = false;
  }

  getLog() {
    return {
      entries: this._entries,
      durationMs: this._entries.length > 0
        ? this._entries[this._entries.length - 1].t
        : 0,
      inputCount: this._entries.length,
    };
  }

  isActive() {
    return this._active;
  }
}

// Verifies direction-independent aim-mode magnitude bands, navigation hysteresis, medium auto-thrust gating, and configured stutter timing.
// Run with: npx vitest run tests/unit/tilt-steering.test.js
// This unit test needs no browser; browser-backed tests use $HOME/.playwright-browsers/chromium-1194/chrome-linux/chrome.
import { describe, expect, it } from 'vitest';
import {
  TILT_AIM_DEADZONE,
  TILT_AIM_LIGHT_MAGNITUDE,
  TILT_AIM_STUTTER_MAGNITUDE,
  TILT_AIM_STUTTER_HYSTERESIS,
  TILT_AIM_FIRM_MAGNITUDE,
  TILT_AIM_FIRM_HYSTERESIS,
  TILT_AIM_STUTTER_INTERVAL_MS,
} from '../../src/core/constants.js';
import {
  TILT_AIM_BAND,
  getTiltAimInput,
  getTiltAimMagnitudeBand,
  isTiltAimMediumThrustOn,
  isTiltAimStutterThrustOn,
} from '../../src/core/tilt-steering.js';

describe('aim-mode medium auto-thrust', () => {
  it('stays off for an already aligned ship until the gesture actually rotated it', () => {
    const aligned = { isAimingDown: false, reachedTarget: true, absDiffDeg: 0 };
    expect(isTiltAimMediumThrustOn({ ...aligned, rotatedThisGesture: false })).toBe(false);
    expect(isTiltAimMediumThrustOn({ ...aligned, rotatedThisGesture: true })).toBe(true);
    expect(isTiltAimMediumThrustOn({ ...aligned, rotatedThisGesture: true, isAimingDown: true })).toBe(false);
    expect(isTiltAimMediumThrustOn({ isAimingDown: false, rotatedThisGesture: true, reachedTarget: false, absDiffDeg: 10 })).toBe(true);
    expect(isTiltAimMediumThrustOn({ isAimingDown: false, rotatedThisGesture: true, reachedTarget: false, absDiffDeg: 30 })).toBe(false);
  });
});

describe('aim-mode tilt magnitude bands', () => {
  it('selects deadzone, light, medium, stutter, and firm in order', () => {
    expect(getTiltAimMagnitudeBand(TILT_AIM_DEADZONE - 0.1)).toBe(TILT_AIM_BAND.DEADZONE);
    expect(getTiltAimMagnitudeBand(TILT_AIM_DEADZONE)).toBe(TILT_AIM_BAND.LIGHT);
    expect(getTiltAimMagnitudeBand(TILT_AIM_LIGHT_MAGNITUDE)).toBe(TILT_AIM_BAND.MEDIUM);
    expect(getTiltAimMagnitudeBand(TILT_AIM_STUTTER_MAGNITUDE)).toBe(TILT_AIM_BAND.STUTTER);
    expect(getTiltAimMagnitudeBand(TILT_AIM_FIRM_MAGNITUDE)).toBe(TILT_AIM_BAND.FIRM);
  });

  it('selects stutter at the same magnitude in every aim direction', () => {
    const diagonal = TILT_AIM_STUTTER_MAGNITUDE / Math.sqrt(2);
    const directions = [
      [0, -TILT_AIM_STUTTER_MAGNITUDE],
      [TILT_AIM_STUTTER_MAGNITUDE, 0],
      [0, TILT_AIM_STUTTER_MAGNITUDE],
      [-TILT_AIM_STUTTER_MAGNITUDE, 0],
      [diagonal, -diagonal],
      [diagonal, diagonal],
      [-diagonal, diagonal],
      [-diagonal, -diagonal],
    ];

    for (const [gammaDelta, betaDelta] of directions) {
      expect(getTiltAimInput(gammaDelta, betaDelta).magnitudeBand).toBe(TILT_AIM_BAND.STUTTER);
    }
  });

  it('keeps stutter active across the medium range while navigating', () => {
    const retainedMagnitude = TILT_AIM_STUTTER_MAGNITUDE - TILT_AIM_STUTTER_HYSTERESIS;
    expect(retainedMagnitude).toBe(TILT_AIM_LIGHT_MAGNITUDE);
    expect(getTiltAimMagnitudeBand(retainedMagnitude, true)).toBe(TILT_AIM_BAND.STUTTER);
    expect(getTiltAimMagnitudeBand(retainedMagnitude - 0.1, true)).toBe(TILT_AIM_BAND.LIGHT);
    expect(getTiltAimMagnitudeBand(retainedMagnitude, false)).toBe(TILT_AIM_BAND.MEDIUM);
  });

  it('does not let a quick tilt gesture overshoot from stutter into firm', () => {
    const firmWhileStuttering = TILT_AIM_FIRM_MAGNITUDE + TILT_AIM_FIRM_HYSTERESIS;
    expect(getTiltAimMagnitudeBand(TILT_AIM_FIRM_MAGNITUDE, false)).toBe(TILT_AIM_BAND.FIRM);
    expect(getTiltAimMagnitudeBand(TILT_AIM_FIRM_MAGNITUDE + 1.5, true)).toBe(TILT_AIM_BAND.STUTTER);
    expect(getTiltAimMagnitudeBand(firmWhileStuttering - 0.1, true)).toBe(TILT_AIM_BAND.STUTTER);
    expect(getTiltAimMagnitudeBand(firmWhileStuttering, true)).toBe(TILT_AIM_BAND.FIRM);
  });
});

describe('aim-mode stutter timing', () => {
  it('starts on and alternates at the configured interval without sensor updates', () => {
    const phaseStart = 1000;
    expect(isTiltAimStutterThrustOn(phaseStart, phaseStart)).toBe(true);
    expect(isTiltAimStutterThrustOn(phaseStart, phaseStart + TILT_AIM_STUTTER_INTERVAL_MS - 1)).toBe(true);
    expect(isTiltAimStutterThrustOn(phaseStart, phaseStart + TILT_AIM_STUTTER_INTERVAL_MS)).toBe(false);
    expect(isTiltAimStutterThrustOn(phaseStart, phaseStart + TILT_AIM_STUTTER_INTERVAL_MS * 2)).toBe(true);
    expect(isTiltAimStutterThrustOn(phaseStart, phaseStart + TILT_AIM_STUTTER_INTERVAL_MS * 3)).toBe(false);
  });
});

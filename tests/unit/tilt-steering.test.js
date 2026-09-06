// Verifies direction-independent aim-mode magnitude bands, navigation hysteresis, medium auto-thrust gating, and angle-dependent stutter timing.
// Run with: npx vitest run tests/unit/tilt-steering.test.js
// This unit test needs no browser; browser-backed tests use $HOME/.playwright-browsers/chromium-1194/chrome-linux/chrome.
import { describe, expect, it } from 'vitest';
import {
  TILT_AIM_DEADZONE,
  TILT_AIM_LIGHT_MAGNITUDE,
  TILT_AIM_STUTTER_MAGNITUDE,
  TILT_AIM_STUTTER_HYSTERESIS,
  TILT_AIM_FIRM_MAGNITUDE,
  TILT_AIM_STUTTER_INTERVAL_MS,
  TILT_AIM_STUTTER_MAX_PAUSE_MS,
  TILT_AIM_LONG_ROTATION,
  TILT_AIM_DOWN_THRESHOLD,
} from '../../src/core/constants.js';
import {
  TILT_AIM_BAND,
  getTiltAimInput,
  getTiltAimMagnitudeBand,
  getTiltAimStutterOffPauseMs,
  isTiltAimMediumThrustOn,
  isTiltAimStutterThrustOn,
} from '../../src/core/tilt-steering.js';

describe('aim-mode medium auto-thrust', () => {
  it('stays off unless the gesture demanded a long rotation', () => {
    const aligned = { isAimingDown: false, reachedTarget: true, absDiffDeg: 0 };
    const longRotation = TILT_AIM_LONG_ROTATION;
    expect(isTiltAimMediumThrustOn({ ...aligned, gestureMaxDiffDeg: 0 })).toBe(false);
    expect(isTiltAimMediumThrustOn({ ...aligned, gestureMaxDiffDeg: longRotation - 0.1 })).toBe(false);
    expect(isTiltAimMediumThrustOn({ ...aligned, gestureMaxDiffDeg: longRotation })).toBe(true);
    expect(isTiltAimMediumThrustOn({ ...aligned, gestureMaxDiffDeg: longRotation, isAimingDown: true })).toBe(false);
    expect(isTiltAimMediumThrustOn({ isAimingDown: false, gestureMaxDiffDeg: longRotation, reachedTarget: false, absDiffDeg: 10 })).toBe(true);
    expect(isTiltAimMediumThrustOn({ isAimingDown: false, gestureMaxDiffDeg: longRotation, reachedTarget: false, absDiffDeg: 30 })).toBe(false);
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
    expect(getTiltAimMagnitudeBand(TILT_AIM_FIRM_MAGNITUDE, false)).toBe(TILT_AIM_BAND.FIRM);
    expect(getTiltAimMagnitudeBand(TILT_AIM_FIRM_MAGNITUDE - 0.1, true)).toBe(TILT_AIM_BAND.STUTTER);
  });
});

describe('aim-mode stutter timing', () => {
  const DEG = Math.PI / 180;
  const downEdgeRad = (180 - TILT_AIM_DOWN_THRESHOLD) * DEG;

  it('off pause increases linearly from interval at 0° to max pause at the downward zone edge', () => {
    expect(getTiltAimStutterOffPauseMs(0)).toBe(TILT_AIM_STUTTER_INTERVAL_MS);
    expect(getTiltAimStutterOffPauseMs(downEdgeRad)).toBeCloseTo(TILT_AIM_STUTTER_MAX_PAUSE_MS, 5);
    const midRad = downEdgeRad / 2;
    const midPause = getTiltAimStutterOffPauseMs(midRad);
    expect(midPause).toBeGreaterThan(TILT_AIM_STUTTER_INTERVAL_MS);
    expect(midPause).toBeLessThan(TILT_AIM_STUTTER_MAX_PAUSE_MS);
  });

  it('starts on and alternates at the configured interval without sensor updates', () => {
    const phaseStart = 1000;
    expect(isTiltAimStutterThrustOn(phaseStart, phaseStart, 0)).toBe(true);
    expect(isTiltAimStutterThrustOn(phaseStart, phaseStart + TILT_AIM_STUTTER_INTERVAL_MS - 1, 0)).toBe(true);
    expect(isTiltAimStutterThrustOn(phaseStart, phaseStart + TILT_AIM_STUTTER_INTERVAL_MS, 0)).toBe(false);
    const offPause = getTiltAimStutterOffPauseMs(0);
    const cycle = TILT_AIM_STUTTER_INTERVAL_MS + offPause;
    expect(isTiltAimStutterThrustOn(phaseStart, phaseStart + cycle, 0)).toBe(true);
  });

  it('gives no thrust inside the downward no-thrust zone', () => {
    const phaseStart = 1000;
    const insideDown = downEdgeRad + 5 * DEG;
    expect(isTiltAimStutterThrustOn(phaseStart, phaseStart, insideDown)).toBe(false);
    expect(isTiltAimStutterThrustOn(phaseStart, phaseStart + 500, insideDown)).toBe(false);
  });

  it('has a longer off pause near the downward zone edge than at 0°', () => {
    const phaseStart = 1000;
    const nearDown = downEdgeRad - 1 * DEG;
    const offPauseNearDown = getTiltAimStutterOffPauseMs(nearDown);
    const offPauseAtZero = getTiltAimStutterOffPauseMs(0);
    // At 0° the OFF phase ends after interval ms; near the edge it lasts much longer
    expect(isTiltAimStutterThrustOn(phaseStart, phaseStart + TILT_AIM_STUTTER_INTERVAL_MS + offPauseAtZero - 1, 0)).toBe(false);
    expect(isTiltAimStutterThrustOn(phaseStart, phaseStart + TILT_AIM_STUTTER_INTERVAL_MS + offPauseAtZero - 1, nearDown)).toBe(false);
    expect(isTiltAimStutterThrustOn(phaseStart, phaseStart + TILT_AIM_STUTTER_INTERVAL_MS + offPauseNearDown - 1, nearDown)).toBe(false);
    expect(isTiltAimStutterThrustOn(phaseStart, phaseStart + TILT_AIM_STUTTER_INTERVAL_MS + offPauseNearDown + 1, nearDown)).toBe(true);
  });
});

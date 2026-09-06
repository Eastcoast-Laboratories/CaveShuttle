import {
  TILT_AIM_DEADZONE,
  TILT_AIM_LIGHT_MAGNITUDE,
  TILT_AIM_STUTTER_MAGNITUDE,
  TILT_AIM_STUTTER_HYSTERESIS,
  TILT_AIM_FIRM_MAGNITUDE,
  TILT_AIM_STUTTER_INTERVAL_MS,
  TILT_AIM_STUTTER_MAX_PAUSE_MS,
  TILT_AIM_DOWN_THRESHOLD,
  TILT_AIM_THRUST,
  TILT_AIM_LONG_ROTATION,
} from './constants.js';

export const TILT_AIM_BAND = Object.freeze({
  DEADZONE: 'deadzone',
  LIGHT: 'light',
  MEDIUM: 'medium',
  STUTTER: 'stutter',
  FIRM: 'firm',
});

export function getTiltAimMagnitudeBand(tiltMagnitude, stutterActive = false) {
  const thresholdEpsilon = 1e-9;
  if (tiltMagnitude < TILT_AIM_DEADZONE - thresholdEpsilon) return TILT_AIM_BAND.DEADZONE;
  if (tiltMagnitude >= TILT_AIM_FIRM_MAGNITUDE - thresholdEpsilon) return TILT_AIM_BAND.FIRM;
  if (
    tiltMagnitude >= TILT_AIM_STUTTER_MAGNITUDE - thresholdEpsilon ||
    (stutterActive && tiltMagnitude >= TILT_AIM_STUTTER_MAGNITUDE - TILT_AIM_STUTTER_HYSTERESIS - thresholdEpsilon)
  ) {
    return TILT_AIM_BAND.STUTTER;
  }
  if (tiltMagnitude < TILT_AIM_LIGHT_MAGNITUDE - thresholdEpsilon) return TILT_AIM_BAND.LIGHT;
  return TILT_AIM_BAND.MEDIUM;
}

export function isTiltAimTargetDown(targetAngle) {
  return Math.abs(targetAngle) > (180 - TILT_AIM_DOWN_THRESHOLD) * Math.PI / 180;
}

export function getTiltAimInput(gammaDelta, betaDelta, stutterActive = false) {
  const tiltMagnitude = Math.hypot(gammaDelta, betaDelta);
  const targetAngle = Math.atan2(gammaDelta, -betaDelta);
  const magnitudeBand = getTiltAimMagnitudeBand(tiltMagnitude, stutterActive);
  const isAimingDown = isTiltAimTargetDown(targetAngle);
  return { tiltMagnitude, targetAngle, magnitudeBand, isAimingDown };
}

// Medium auto-thrust only starts after the current tilt gesture demanded a long rotation
// (largest angular difference seen in the gesture >= TILT_AIM_LONG_ROTATION). Otherwise medium
// gives no thrust, so thrust always begins in stutter mode with a fresh pulse cycle.
export function isTiltAimMediumThrustOn({ isAimingDown, gestureMaxDiffDeg, reachedTarget, absDiffDeg }) {
  if (isAimingDown || gestureMaxDiffDeg < TILT_AIM_LONG_ROTATION) return false;
  return reachedTarget || absDiffDeg <= TILT_AIM_THRUST;
}

// Stutter thrust-on duration is fixed. Thrust-off pause increases linearly with the angular
// distance of the target heading from straight up (0°), reaching TILT_AIM_STUTTER_MAX_PAUSE_MS
// at the edge of the downward no-thrust zone. Inside the downward zone, stutter gives no thrust.
export function getTiltAimStutterOffPauseMs(targetAngle) {
  const downEdgeRad = (180 - TILT_AIM_DOWN_THRESHOLD) * Math.PI / 180;
  const t = Math.min(Math.abs(targetAngle) / downEdgeRad, 1);
  return TILT_AIM_STUTTER_INTERVAL_MS + (TILT_AIM_STUTTER_MAX_PAUSE_MS - TILT_AIM_STUTTER_INTERVAL_MS) * t;
}

export function isTiltAimStutterThrustOn(phaseStart, now, targetAngle) {
  if (isTiltAimTargetDown(targetAngle)) return false;
  const onMs = TILT_AIM_STUTTER_INTERVAL_MS;
  const offMs = getTiltAimStutterOffPauseMs(targetAngle);
  const cycleMs = onMs + offMs;
  const inCycle = (now - phaseStart) % cycleMs;
  return inCycle < onMs;
}

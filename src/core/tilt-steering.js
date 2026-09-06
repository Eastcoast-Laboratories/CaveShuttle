import {
  TILT_AIM_DEADZONE,
  TILT_AIM_LIGHT_MAGNITUDE,
  TILT_AIM_STUTTER_MAGNITUDE,
  TILT_AIM_STUTTER_HYSTERESIS,
  TILT_AIM_FIRM_MAGNITUDE,
  TILT_AIM_FIRM_HYSTERESIS,
  TILT_AIM_STUTTER_INTERVAL_MS,
  TILT_AIM_DOWN_THRESHOLD,
  TILT_AIM_THRUST,
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
  const firmThreshold = TILT_AIM_FIRM_MAGNITUDE + (stutterActive ? TILT_AIM_FIRM_HYSTERESIS : 0);
  if (tiltMagnitude >= firmThreshold - thresholdEpsilon) return TILT_AIM_BAND.FIRM;
  if (
    tiltMagnitude >= TILT_AIM_STUTTER_MAGNITUDE - thresholdEpsilon ||
    (stutterActive && tiltMagnitude >= TILT_AIM_STUTTER_MAGNITUDE - TILT_AIM_STUTTER_HYSTERESIS - thresholdEpsilon)
  ) {
    return TILT_AIM_BAND.STUTTER;
  }
  if (tiltMagnitude < TILT_AIM_LIGHT_MAGNITUDE - thresholdEpsilon) return TILT_AIM_BAND.LIGHT;
  return TILT_AIM_BAND.MEDIUM;
}

export function getTiltAimInput(gammaDelta, betaDelta, stutterActive = false) {
  const tiltMagnitude = Math.hypot(gammaDelta, betaDelta);
  const targetAngle = Math.atan2(gammaDelta, -betaDelta);
  const magnitudeBand = getTiltAimMagnitudeBand(tiltMagnitude, stutterActive);
  const isAimingDown = Math.abs(targetAngle) > (180 - TILT_AIM_DOWN_THRESHOLD) * Math.PI / 180;
  return { tiltMagnitude, targetAngle, magnitudeBand, isAimingDown };
}

// Medium auto-thrust only starts after the ship actually rotated towards the target during the
// current tilt gesture. If the ship was already aligned when the tilt began, medium gives no thrust,
// so reaching the stutter threshold starts the pulse cycle fresh instead of on top of a running thrust.
export function isTiltAimMediumThrustOn({ isAimingDown, rotatedThisGesture, reachedTarget, absDiffDeg }) {
  if (isAimingDown || !rotatedThisGesture) return false;
  return reachedTarget || absDiffDeg <= TILT_AIM_THRUST;
}

export function isTiltAimStutterThrustOn(phaseStart, now) {
  return Math.floor((now - phaseStart) / TILT_AIM_STUTTER_INTERVAL_MS) % 2 === 0;
}

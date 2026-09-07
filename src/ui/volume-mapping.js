// Volume mapping helpers live here (non-JSX file) so HamburgerMenu.jsx
// only exports components, satisfying react-refresh/only-export-components.

// Logarithmic volume mapping: slider position 0-100 -> audio volume 0-0.7
// At position 50 (middle) the volume is 10%; at position 100 (full right) it is 70%.
// Formula: volume = (1/70) * Math.exp(slider * Math.log(7) / 50)
export function sliderToVolume(slider) {
  if (slider <= 0) return 0;
  return (1 / 70) * Math.exp(slider * Math.log(7) / 50);
}

// Inverse mapping: audio volume 0-0.7 -> slider position 0-100
export function volumeToSlider(volume) {
  if (volume <= 0) return 0;
  const raw = 50 * Math.log(70 * volume) / Math.log(7);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

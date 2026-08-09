import { describe, it, expect } from 'vitest';
import { sliderToVolume, volumeToSlider } from '../../src/ui/HamburgerMenu.jsx';

describe('Volume slider logarithmic mapping', () => {
  describe('sliderToVolume', () => {
    it('should return 0 when slider is 0 (muted)', () => {
      expect(sliderToVolume(0)).toBe(0);
    });

    it('should return approximately 10% volume at slider middle (50)', () => {
      expect(sliderToVolume(50)).toBeCloseTo(0.1, 5);
    });

    it('should return approximately 70% volume at full right (100)', () => {
      expect(sliderToVolume(100)).toBeCloseTo(0.7, 5);
    });

    it('should produce increasing volume values (monotonically increasing)', () => {
      for (let s = 1; s < 100; s++) {
        expect(sliderToVolume(s)).toBeLessThan(sliderToVolume(s + 1));
      }
    });

    it('should never exceed 0.7 for slider values 0-100', () => {
      for (let s = 0; s <= 100; s++) {
        expect(sliderToVolume(s)).toBeLessThanOrEqual(0.7 + 1e-10);
      }
    });
  });

  describe('volumeToSlider', () => {
    it('should return 0 when volume is 0', () => {
      expect(volumeToSlider(0)).toBe(0);
    });

    it('should return 50 for volume 0.1 (10%)', () => {
      expect(volumeToSlider(0.1)).toBe(50);
    });

    it('should return 100 for volume 0.7 (70%)', () => {
      expect(volumeToSlider(0.7)).toBe(100);
    });

    it('should clamp legacy volume values > 0.7 to 100', () => {
      expect(volumeToSlider(1.0)).toBe(100);
    });

    it('should be the inverse of sliderToVolume (round-trip)', () => {
      for (let s = 1; s <= 100; s++) {
        const v = sliderToVolume(s);
        expect(volumeToSlider(v)).toBe(s);
      }
    });
  });
});

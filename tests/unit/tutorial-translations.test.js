import { describe, it, expect } from 'vitest';
import { tutorialTranslations, tutorialLanguages } from '../../src/i18n/tutorial.js';

describe('tutorialTranslations guidedHints', () => {
  it('exports de and en', () => {
    expect(tutorialLanguages).toContain('de');
    expect(tutorialLanguages).toContain('en');
  });

  it('has guidedHints for both languages', () => {
    expect(tutorialTranslations.de.guidedHints).toBeDefined();
    expect(tutorialTranslations.en.guidedHints).toBeDefined();
  });

  it('has all four action/info step keys', () => {
    for (const lang of ['de', 'en']) {
      const h = tutorialTranslations[lang].guidedHints;
      expect(h.shieldAction).toBeDefined();
      expect(h.shieldAction.text).toBeTruthy();
      expect(h.shieldAction.hold).toBeTruthy();
      expect(h.brakingInfo).toBeDefined();
      expect(h.brakingInfo.text).toBeTruthy();
      expect(h.brakingInfo.hold).toBeTruthy();
      expect(h.tractorAndThrustAction).toBeDefined();
      expect(h.tractorAndThrustAction.text).toBeTruthy();
      expect(h.tractorAndThrustAction.hold).toBeTruthy();
      expect(h.escapeThrustAction).toBeDefined();
      expect(h.escapeThrustAction.text).toBeTruthy();
      expect(h.escapeThrustAction.hold).toBeTruthy();
    }
  });

  it('has cancel, restartLevel1 and stepIndicator', () => {
    for (const lang of ['de', 'en']) {
      const h = tutorialTranslations[lang].guidedHints;
      expect(h.cancel).toBeTruthy();
      expect(h.restartLevel1).toBeTruthy();
      expect(h.skip).toBeTruthy();
      expect(h.stepBack).toBeTruthy();
      expect(typeof h.stepIndicator).toBe('function');
      expect(h.stepIndicator(1, 4)).toContain('1');
      expect(h.stepIndicator(1, 4)).toContain('4');
      expect(typeof h.holdProgress).toBe('function');
    }
  });
});

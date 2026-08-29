import React from 'react';
import { tutorialTranslations } from '../i18n/tutorial.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import './TutorialHintOverlay.css';

// Ordered list of visible action/info steps for the step indicator (1/4 ... 4/4).
// Invisible waiting states (playingBeforeBrakingHint, playingUntilDocked) are
// not part of this list because they do not show an overlay.
const VISIBLE_STEPS = ['shieldAction', 'brakingInfo', 'tractorAndThrustAction', 'escapeThrustAction'];

// Compact in-game hint overlay for the guided tutorial.
//
// Action steps (shieldAction, tractorAndThrustAction, escapeThrustAction) render
// only a small card that does NOT cover the full screen, so pointer events reach
// the canvas/touch buttons outside the card. brakingInfo is the only step with a
// Continue button and a full backdrop that blocks gameplay input while paused.
//
// State, progress and actions come from App/GameCanvas; this component has no
// game-state logic of its own.
export default function TutorialHintOverlay({ step, holdProgressMs = 0, holdTargetMs = 0, onSkip, onStepBack }) {
  const { language } = useLanguage();
  const t = tutorialTranslations[language] || tutorialTranslations.en;
  const hints = t.guidedHints;

  if (!step || !VISIBLE_STEPS.includes(step)) return null;

  const stepIndex = VISIBLE_STEPS.indexOf(step) + 1;
  const totalSteps = VISIBLE_STEPS.length;
  const hint = hints[step];
  if (!hint) return null;

  const holdMs = Math.min(holdProgressMs, holdTargetMs);
  const canStepBack = stepIndex > 1;

  // Action steps: small card, pointer events pass through outside the card.
  return (
    <div className="tutorial-hint-overlay tutorial-hint-overlay--pass-through" aria-live="polite">
      <div className="tutorial-hint-overlay__card" role="status" aria-label={hint.text}>
        {canStepBack && onStepBack && (
          <button
            className="tutorial-hint-overlay__nav-btn tutorial-hint-overlay__step-back"
            onClick={onStepBack}
            title={hints.stepBack}
            aria-label={hints.stepBack}
          >
            ◀
          </button>
        )}
        {onSkip && (
          <button
            className="tutorial-hint-overlay__nav-btn tutorial-hint-overlay__skip"
            onClick={onSkip}
            title={hints.skip}
            aria-label={hints.skip}
          >
            ▶|
          </button>
        )}
        <span className="tutorial-hint-overlay__step">{hints.stepIndicator(stepIndex, totalSteps)}</span>
        <p className="tutorial-hint-overlay__text">{hint.text}</p>
        <div className="tutorial-hint-overlay__hold-row">
          <span className="tutorial-hint-overlay__hold-label">{hint.hold}</span>
          <progress
            className="tutorial-hint-overlay__progress"
            value={holdMs}
            max={holdTargetMs}
            aria-label={hints.holdProgress(holdMs, holdTargetMs)}
          />
          <span className="tutorial-hint-overlay__hold-ms">{hints.holdProgress(holdMs, holdTargetMs)}</span>
        </div>
      </div>
    </div>
  );
}

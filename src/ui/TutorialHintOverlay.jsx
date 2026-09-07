import { tutorialTranslations } from '../i18n/tutorial.js';
import { useLanguage } from '../i18n/language-context.js';
import { VISIBLE_GUIDED_STEPS } from '../core/constants.js';
import './TutorialHintOverlay.css';

// Re-export so existing imports keep working.
export { VISIBLE_GUIDED_STEPS };

// Compact in-game hint overlay for the guided tutorial.
//
// Action steps render only a small card that does NOT cover the full screen, so
// pointer events reach the canvas and touch buttons outside the card.
//
// State, progress and actions come from App/GameCanvas; this component has no
// game-state logic of its own.
export default function TutorialHintOverlay({ step, holdProgressMs = 0, holdTargetMs = 0, onSkip, onStepBack }) {
  const { language } = useLanguage();
  const t = tutorialTranslations[language] || tutorialTranslations.en;
  const hints = t.guidedHints;

  if (!step || !VISIBLE_GUIDED_STEPS.includes(step)) return null;

  const stepIndex = VISIBLE_GUIDED_STEPS.indexOf(step) + 1;
  const totalSteps = VISIBLE_GUIDED_STEPS.length;
  const hint = hints[step];
  if (!hint) return null;

  const holdMs = Math.min(holdProgressMs, holdTargetMs);
  const canStepBack = stepIndex > 1;
  const isLastStep = stepIndex >= totalSteps;

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
            &nbsp;◀&nbsp;&nbsp;
          </button>
        )}
        {onSkip && (
          <button
            className="tutorial-hint-overlay__nav-btn tutorial-hint-overlay__skip"
            onClick={onSkip}
            title={isLastStep ? hints.finish : hints.skip}
            aria-label={isLastStep ? hints.finish : hints.skip}
          >
            {isLastStep ? `${hints.finish} \u2715` : `${hints.skip} \u23ED`}
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
        </div>
      </div>
    </div>
  );
}

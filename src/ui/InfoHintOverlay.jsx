import './TutorialHintOverlay.css';

// Generic one-shot info hint overlay that reuses the TutorialHintOverlay styling.
// Shows a compact card with a title, message, and an X dismiss button.
// Does not block pointer events outside the card (pass-through).
export default function InfoHintOverlay({ title, message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="tutorial-hint-overlay tutorial-hint-overlay--pass-through" aria-live="polite">
      <div className="tutorial-hint-overlay__card" role="status" aria-label={message}>
        {onDismiss && (
          <button
            className="tutorial-hint-overlay__nav-btn tutorial-hint-overlay__skip"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            {'\u2715'}
          </button>
        )}
        {title && (
          <span className="tutorial-hint-overlay__step">{title}</span>
        )}
        <p className="tutorial-hint-overlay__text">{message}</p>
      </div>
    </div>
  );
}

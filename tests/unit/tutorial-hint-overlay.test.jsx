import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TutorialHintOverlay from '../../src/ui/TutorialHintOverlay.jsx';

// Mock the language context so the overlay uses English translations.
vi.mock('../../src/i18n/LanguageContext.jsx', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: () => {} }),
}));

describe('TutorialHintOverlay', () => {
  it('renders nothing for invisible steps', () => {
    const { container } = render(
      <TutorialHintOverlay step="playingBeforeBrakingHint" onContinue={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for null step', () => {
    const { container } = render(
      <TutorialHintOverlay step={null} onContinue={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders action step with hold progress and no continue button', () => {
    render(
      <TutorialHintOverlay
        step="shieldAction"
        holdProgressMs={300}
        holdTargetMs={1000}
        onContinue={() => {}}
      />
    );
    expect(screen.getByText(/Step 1\/4/)).toBeTruthy();
    expect(screen.getByText(/deflect the incoming bunker shots/)).toBeTruthy();
    // Action steps have no Continue button.
    expect(screen.queryByRole('button')).toBeNull();
    // Progress bar exists.
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('renders brakingInfo with a Continue button and blocking backdrop', () => {
    const onContinue = vi.fn();
    render(
      <TutorialHintOverlay
        step="brakingInfo"
        onContinue={onContinue}
      />
    );
    expect(screen.getByText(/Step 2\/4/)).toBeTruthy();
    expect(screen.getByText(/brake/)).toBeTruthy();
    const btn = screen.getByRole('button');
    expect(btn).toBeTruthy();
    fireEvent.click(btn);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('renders escapeThrustAction as step 4/4', () => {
    render(
      <TutorialHintOverlay
        step="escapeThrustAction"
        holdProgressMs={500}
        holdTargetMs={1000}
        onContinue={() => {}}
      />
    );
    expect(screen.getByText(/Step 4\/4/)).toBeTruthy();
    expect(screen.getByText(/fly up into the sky/)).toBeTruthy();
  });

  it('renders tractorAndThrustAction as step 3/4', () => {
    render(
      <TutorialHintOverlay
        step="tractorAndThrustAction"
        holdProgressMs={100}
        holdTargetMs={200}
        onContinue={() => {}}
      />
    );
    expect(screen.getByText(/Step 3\/4/)).toBeTruthy();
    expect(screen.getAllByText(/tractor beam and thrust/).length).toBeGreaterThan(0);
  });
});

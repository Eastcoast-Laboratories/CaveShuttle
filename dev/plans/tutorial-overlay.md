# One-time tutorial overlay with language switch and reactivation

Add a modal tutorial overlay that appears automatically the first time a game starts, can be reopened from the hamburger menu, supports German/English, and teaches the goal, docking, and controls using the real touch-button graphics and the provided `pod_docked.png` screenshot.

## Approach

1. **Persistent state** in `src/App.jsx`:
   - `tutorialDismissed` read from `localStorage` (`storageKey('tutorialDismissed')`).
   - `tutorialLanguage` read from `storageKey('tutorialLanguage')`, defaulting to `navigator.language.startsWith('de') ? 'de' : 'en'`.
   - `showTutorial` local state, set `true` when `handleStartGame` is called and `!tutorialDismissed`, set `false` on dismiss.
   - Pass `showTutorial` to `GameCanvas` as the `frozen` prop so the game is paused while the overlay is open.
   - Pass `onShowTutorial`/`onSetLanguage` to `HamburgerMenu`.

2. **Asset**:
   - Copy `dev/tutorial/tutorial_pod_docked.png` into `public/tutorial/pod_docked.png` so the overlay can reference it as `/tutorial/pod_docked.png`.

3. **New component** `src/ui/TutorialOverlay.jsx`:
   - Accept `language`, `onLanguageChange`, `isMobile`, `onDismiss`.
   - Display in a centered card with a semi-transparent backdrop (`position: fixed`, high `z-index`).
   - Content sections driven by a translation object in `src/i18n/tutorial.js` (or inline) with `de`/`en` keys:
     - **1. Welcome**: title and a one-sentence intro to the game.
     - **2. Objective**: explain the level goal in concrete steps: fly over the pod and use the tractor beam to dock it under the ship, then carry it into the sky to finish the level. Show `/tutorial/pod_docked.png` next to the text so the player sees exactly how the ship and docked pod look together. Add a note that destroying the reactors gives extra bonus.
     - **3. Desktop controls** (hidden on mobile): list the keyboard controls llike in the hamburger menu:
     
         ```
         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#aaa', marginBottom: '20px' }}>
            <div><span style={{ color: '#fff' }}>↑ / W</span> - Accelerate</div>
            <div><span style={{ color: '#fff' }}>← / A</span> - Rotate Left</div>
            <div><span style={{ color: '#fff' }}>→ / D</span> - Rotate Right</div>
            <div><span style={{ color: '#fff' }}>Space / Ctrl</span> - Tractor Beam & Shield</div>
            <div><span style={{ color: '#fff' }}>X / Shift</span> - Shoot</div>
         </div>
         ```
        merke: DRY!
        change the keys to be rendered as styled `kbd` elements, (also in the hamburger menu)
     - **4. Touch controls**: render a scaled preview of the right-cluster touch buttons exactly as they appear in the game overlay. Re-use `getTouchButtonRects()` from the new shared module and the same `podIcon.png`/`crosshair.png` assets. Label each button (rotate left, rotate right, thrust, fire, pod) so the player recognizes the overlay icons.
     - **5. Menu hint**: point to the ☰ hamburger button at the top-right and explain that it contains sound, level selection, and the button to reopen this tutorial.
   - Language switcher: two flag buttons (`🇩🇪`/`🇬🇧`) at the top-right of the card.
   - Dismiss button at the bottom: "Got it!" / "Verstanden!".

4. **DRY button layout**:
   - Move `getTouchButtonRects()` from `src/ui/GameCanvas.jsx` to a new `src/core/touch-buttons.js` module so both `GameCanvas` and `TutorialOverlay` import it.
   - `TutorialOverlay` uses a small preview `<canvas>` and draws the buttons with the same rectangle, icon, and label logic used in `GameCanvas`, scaled to fit the card.

5. **Hamburger menu reactivation** (`src/ui/HamburgerMenu.jsx`):
   - Add a settings row or button labeled `Tutorial` / `Tutorial anzeigen` that calls `onShowTutorial()` and closes the hamburger menu.

6. **First-time behavior**:
   - When the user starts the first game (`handleStartGame`), set `showTutorial(true)` if `!tutorialDismissed`.
   - Dismissing the overlay sets `localStorage tutorialDismissed = true`.
   - Reactivating from the menu opens the overlay again without resetting `tutorialDismissed`.

## Files to touch

- `src/App.jsx`
- `src/ui/TutorialOverlay.jsx` (new)
- `src/i18n/tutorial.js` (new, translations)
- `src/ui/HamburgerMenu.jsx`
- `src/ui/GameCanvas.jsx` (extract `getTouchButtonRects`)
- `src/core/touch-buttons.js` (new, extracted layout)
- `public/tutorial/pod_docked.png` (move from `dev/tutorial/tutorial_pod_docked.png`)

// Translations for the one-time tutorial overlay.
// New languages can be added here without touching the component.
//
// guidedHints: texts for the in-game guided tutorial state machine.
// Each hint has a `text` (the instruction), an optional `hold` label used
// for action steps that require holding an input, and a `continue` label
// used only for the single step that has a Continue button.
export const tutorialTranslations = {
  de: {
    title: 'Willkommen bei Cave Shuttle',
    intro: 'Hier erfährst du in Kürze, wie du deine erste Mission steuerst.',
    
    objective: 'Ziel',
    objectiveText: 'Fliege über den Pod und aktiviere den Traktorstrahl, damit er an deinem Schiff andockt. Schleppe ihn an die Oberfläche und dort in den Himmel, um das Level zu beenden.',
    
    dockingPodImageText: 'Der Pod dockt an dein Schiff, wenn du nah genug den Traktorstrahl aktivierst.',
    
    controls: 'Steuerung',
    
    touchButtons: 'Touch-Buttons',
    touchHint: 'Die Buttons können im Menu ein- und ausgeblendet werden.',
    
    menuHint: 'Einstellungen & Tutorial',
    bonusTitle: 'Tipp',
    
    bonus: 'Zerstörte Reaktoren bringen zusätzliche Punkte.',
    menuText: 'Tippe oben rechts auf das Menü-Symbol ☰, um Lautstärke, Touch-Button-Transparenz, Level-Packs und dieses Tutorial zu öffnen.',
    dismiss: 'Los geht\'s!',
    keys: {
      accelerate: 'Beschleunigen',
      rotateLeft: 'Links drehen',
      rotateRight: 'Rechts drehen',
      tractor: 'Traktorstrahl & Schild',
      shoot: 'Schießen',
    },
    touchLabels: {
      rotateLeft: 'Drehen',
      rotateRight: 'Drehen',
      thrust: 'Schub',
      fire: 'Feuer',
      pod: 'Traktorstrahl & Schild',
    },
    tiltSteering: {
      title: 'Tilt Steering',
      hint: 'Aktiviere im Menü unter Touch-Buttons die Tilt-Steering-Option. Kalibriere die neutrale Halteposition mit dem Button im Menü.',
      rotate: 'Handy nach links/rechts kippen = Schiff drehen',
      thrust: 'Handy vor/zurück kippen = Schub (relativ zur kalibrierten Position)',
      fire: 'Tippen irgendwo auf dem Bildschirm = Feuern',
      pod: 'Touch-Button für Traktorstrahl & Pod-Docking',
    },
    guidedHints: {
      cancel: 'Abbrechen',
      restartLevel1: 'Level 1 neu starten',
      stepIndicator: (n, total) => `Schritt ${n}/${total}`,
      shieldAction: {
        text: 'Benutze den Schild, um die ankommenden Schüsse der Bunker abzuwehren.',
        hold: 'Halte den Schild/Traktor-Button',
      },
      brakingInfo: {
        text: 'Drehe die Nase des Raumschiffs nach oben und benutze den Schub zum Bremsen, damit du langsam über dem runden Pod schwebst.',
        continue: 'Weiter',
      },
      tractorAndThrustAction: {
        text: 'Aktiviere den Traktorstrahl und den Schub gleichzeitig, damit du nach dem Andocken nicht gleich abstürzt.',
        hold: 'Halte Traktorstrahl und Schub gleichzeitig',
      },
      escapeThrustAction: {
        text: 'Halte den Schub und fliege in den Himmel bis zum Wurmloch.',
        hold: 'Halte den Schub',
      },
      holdProgress: (ms, target) => `${Math.max(0, Math.round(ms))} / ${target} ms`,
    },
  },
  en: {
    title: 'Welcome to Cave Shuttle',
    intro: 'This is a quick overview of how to control your first campaign.',

    objective: 'Objective',
    objectiveText: 'Fly over the pod and activate the tractor beam to dock it under your ship.<br>Then carry it up to the sky to finish the level.',

    dockingPodImageText: 'The pod will dock under your ship when you get close enough and activate the tractor beam.',

    controls: 'Controls',
    
    touchButtons: 'Touch Buttons',
    touchHint: 'The touch buttons can be toggled on/off in the menu.',

    bonusTitle: 'Hint',
    bonus: 'Destroyed reactors grant bonus points.',

    menuHint: 'Settings & Tutorial',
    menuText: 'Tap the ☰ menu icon in the top-right to access sound, touch-button transparency, level packs and this tutorial.',

    dismiss: 'Got it!',
    keys: {
      accelerate: 'Accelerate',
      rotateLeft: 'Rotate left',
      rotateRight: 'Rotate right',
      tractor: 'Tractor beam & shield',
      shoot: 'Shoot',
    },
    touchLabels: {
      rotateLeft: 'Rotate',
      rotateRight: 'Rotate',
      thrust: 'Thrust',
      fire: 'Fire',
      pod: 'Tractor beam & shield',
    },
    tiltSteering: {
      title: 'Tilt Steering',
      hint: 'Enable the Tilt Steering option under Touch Buttons in the menu. Calibrate the neutral holding position with the button in the menu.',
      rotate: 'Tilt phone left/right = ship rotation',
      thrust: 'Tilt phone forward/back = thrust (relative to calibrated neutral position)',
      fire: 'Tap anywhere on screen = fire',
      pod: 'Touch button for Tractor Beam / Pod docking',
    },
    guidedHints: {
      cancel: 'Cancel',
      restartLevel1: 'Restart Level 1',
      stepIndicator: (n, total) => `Step ${n}/${total}`,
      shieldAction: {
        text: 'Use the shield to deflect the incoming bunker shots.',
        hold: 'Hold the shield/tractor button',
      },
      brakingInfo: {
        text: 'Point the nose of your ship upward and use thrust to brake, so you hover slowly over the round pod.',
        continue: 'Continue',
      },
      tractorAndThrustAction: {
        text: 'Activate the tractor beam and thrust at the same time, so you don\'t crash right after docking.',
        hold: 'Hold tractor beam and thrust together',
      },
      escapeThrustAction: {
        text: 'Hold thrust and fly up into the sky to the wormhole.',
        hold: 'Hold thrust',
      },
      holdProgress: (ms, target) => `${Math.max(0, Math.round(ms))} / ${target} ms`,
    },
  },
};

export const tutorialLanguages = ['de', 'en'];

// Translations for the hamburger menu (settings sidebar).
// New languages can be added here without touching the component.
export const hamburgerMenuTranslations = {
  de: {
    // Section titles
    selectLevel: 'Level wählen',
    playerName: 'Spielername',
    player2Name: 'Spieler 2',
    controls: 'Steuerung',
    keyboard: 'Tastatur',
    sound: 'Sound',
    vibration: 'Vibration',
    levelPacks: 'Level-Packs',
    dataTransfer: 'Datenübertragung',
    account: 'Konto',
    privacyOnline: 'Privatsphäre',

    // Toggle labels
    touchButtons: 'Touch-Buttons',
    joystick: 'Joystick',
    tiltSteering: 'Neigungssteuerung',
    rotateSteering90: 'Steuerung 90° drehen',
    enabled: 'Aktiviert',
    sendCrashReports: 'Absturzberichte senden',
    onlineSync: 'Highscores online syncen',
    orientation: 'Ausrichtung',
    orientationLandscape: 'Land',
    orientationPortrait: 'Port',
    orientationAuto: 'Auto',
    orientationHint: 'Das Spiel ist besser im Landscape-Modus (Querformat) spielbar.',

    // Button labels
    on: 'AN',
    off: 'AUS',
    calibrateNeutral: 'Neutrale Position kalibrieren',
    showTutorial: 'Tutorial Neu Starten',
    backToMenu: '← Menu',
    exportAllData: 'Alle Daten exportieren',
    importData: 'Daten importieren',
    copy: 'Kopieren',
    resetAllData: 'Alle Daten zurücksetzen',
    accountSettings: 'Kontoeinstellungen',

    // Slider labels
    transparency: 'Transparenz',
    soundVolume: 'Lautstärke',

    // Hints
    tapAnywhereToFire: 'Tippe überall zum Schießen.',
    holdSwipeToSteer: 'Halten und wischen zum Steuern und Beschleunigen. Kurzes Tippen zum Schießen. Ein Finger tippen für Schild. Drei Finger tippen zum Schießen.',
    tiltHint: 'Nach links/rechts neigen zum Drehen, zurück neigen zum Beschleunigen. Tippe überall zum Schießen.',
    vibrationHint: 'Stelle sicher, dass Vibration auch in den Geräteeinstellungen aktiviert ist.',
    analyticsHintBefore: 'Wenn aktiviert, werden anonyme Fehler- und ',
    analyticsHintCrashWord: 'Absturz',
    analyticsHintAfter: 'daten gesendet, um das Spiel zu verbessern. Es werden keine persönlichen Daten gesammelt.',
    onlineSyncHint: 'Highscores werden mit dem Community-Server synchronisiert. Aus = rein offline.',
    notConnected: 'Noch nicht mit dem Community-Server verbunden. Verbindet sich automatisch, wenn online.',
    connectedAs: 'Verbunden als:',

    // Keyboard labels
    accelerate: 'Beschleunigen',
    rotateLeft: 'Links drehen',
    rotateRight: 'Rechts drehen',
    tractorBeamShield: 'Traktorstrahl & Schild',
    shoot: 'Schießen',
    rotate: 'Drehen',
    thrust: 'Schub',
    shootWithPod: 'Schießen (mit Frachtkugel)',
    rotateTurret: 'Geschütz drehen',
    rotatePod: 'Frachtkugel drehen',
    player1Ship: 'Spieler 1 — Schiff',
    player2Pod: 'Spieler 2 — {role}',
    pod: 'Frachtkugel',
    turret: 'Geschütz',

    // Level packs
    importPack: 'Pack importieren (.json)',
    packImportedSuccess: 'Pack erfolgreich importiert!',
    overwrite: 'Überschreiben',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    newId: 'Neue ID',
    packIdExists: 'Pack-ID "{id}" existiert bereits.',
    deletePackConfirm: 'Pack "{name}" löschen?',

    // Data transfer messages
    exportFailed: 'Export fehlgeschlagen: Keine Daten gefunden.',
    dataExported: 'Daten exportiert. Kopiere den Code unten.',
    exportDataFirst: 'Zuerst Daten exportieren.',
    copiedToClipboard: 'In Zwischenablage kopiert!',
    copyFailed: 'Kopieren fehlgeschlagen. Manuell auswählen und kopieren.',
    pasteExportCode: 'Export-Code hier einfügen zum Importieren...',
    pasteToImport: 'Export-Code einfügen zum Importieren.',
    importedEntries: '{count} Einträge importiert. Neuladen...',
  },

  en: {
    // Section titles
    selectLevel: 'SELECT LEVEL',
    playerName: 'PLAYER NAME',
    player2Name: 'PLAYER 2 NAME',
    controls: 'CONTROLS',
    keyboard: 'KEYBOARD',
    sound: 'SOUND',
    vibration: 'VIBRATION',
    levelPacks: 'LEVEL PACKS',
    dataTransfer: 'DATA TRANSFER',
    account: 'ACCOUNT',
    privacyOnline: 'Privacy & Online',

    // Toggle labels
    touchButtons: 'Touch Buttons',
    joystick: 'Joystick',
    tiltSteering: 'Tilt Steering',
    rotateSteering90: 'Rotate Steering 90°',
    enabled: 'Enabled',
    sendCrashReports: 'Send crash reports',
    onlineSync: 'Sync highscores online',
    orientation: 'Orientation',
    orientationLandscape: 'Land',
    orientationPortrait: 'Port',
    orientationAuto: 'Auto',
    orientationHint: 'The game is best played in landscape mode.',

    // Button labels
    on: 'ON',
    off: 'OFF',
    calibrateNeutral: 'Calibrate Neutral Position',
    showTutorial: 'Restart Tutorial',
    backToMenu: 'Back to Menu',
    exportAllData: 'Export All Data',
    importData: 'Import Data',
    copy: 'Copy',
    resetAllData: 'Reset all Data',
    accountSettings: 'Account Settings',

    // Slider labels
    transparency: 'Transparency',
    soundVolume: 'Sound Volume',

    // Hints
    tapAnywhereToFire: 'Tap anywhere to fire.',
    holdSwipeToSteer: 'Hold and swipe to steer and thrust. Quick tap to fire. One finger tap for shield. Three finger tap to fire.',
    tiltHint: 'Tilt left/right to rotate, tilt back to thrust. Tap anywhere to fire.',
    vibrationHint: 'Make sure vibration is also enabled in your device settings.',
    analyticsHintBefore: 'When enabled, anonymous error and ',
    analyticsHintCrashWord: 'crash',
    analyticsHintAfter: ' data is sent to help improve the game. No personal data is collected.',
    onlineSyncHint: 'Highscores sync with the community server. Off = offline only.',
    notConnected: 'Not connected to community server yet. Will connect automatically when online.',
    connectedAs: 'Connected as:',

    // Keyboard labels
    accelerate: 'Accelerate',
    rotateLeft: 'Rotate Left',
    rotateRight: 'Rotate Right',
    tractorBeamShield: 'Tractor Beam & Shield',
    shoot: 'Shoot',
    rotate: 'Rotate',
    thrust: 'Thrust',
    shootWithPod: 'Shoot (with Cargo Pod)',
    rotateTurret: 'Rotate Turret',
    rotatePod: 'Rotate Cargo Pod',
    player1Ship: 'Player 1 — Ship',
    player2Pod: 'Player 2 — {role}',
    pod: 'Cargo Pod',
    turret: 'Turret',

    // Level packs
    importPack: 'Import Pack (.json)',
    packImportedSuccess: 'Pack imported successfully!',
    overwrite: 'Overwrite',
    cancel: 'Cancel',
    delete: 'Delete',
    newId: 'New ID',
    packIdExists: 'Pack ID "{id}" already exists.',
    deletePackConfirm: 'Delete pack "{name}"?',

    // Data transfer messages
    exportFailed: 'Export failed: no data found.',
    dataExported: 'Data exported. Copy the code below.',
    exportDataFirst: 'Export data first.',
    copiedToClipboard: 'Copied to clipboard!',
    copyFailed: 'Copy failed. Select and copy manually.',
    pasteExportCode: 'Paste export code here to import...',
    pasteToImport: 'Paste export code to import.',
    importedEntries: 'Imported {count} entries. Reloading...',
  },
};

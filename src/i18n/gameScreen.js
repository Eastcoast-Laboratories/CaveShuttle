// Translations for the game screen: end overlay, score breakdown, and buttons.
export const gameScreenTranslations = {
  de: {
    // Buttons
    playAgain: 'Nochmal spielen',
    backToMenu: '← Menu',
    backToLobby: '← Lobby',
    nextLevel: 'Nächstes Level',

    // Level complete / game over overlay
    gameOver: 'GAME OVER',
    levelComplete: 'LEVEL {n} COMPLETE',
    scoreLabel: 'Punkte',

    // New highscore banner
    newHighscore: 'NEUER HIGHSCORE',
    run: 'Mission',
    top10Rank: 'Highscore Rang {rank}',

    // Player name labels
    player1: 'Spieler 1:',
    yourName: 'Dein Name:',
    player2: 'Spieler 2:',

    // Score breakdown labels (used in App.jsx scoreBreakdown)
    time: 'Zeit',
    bunkerDestroyed: 'Bunker zerstört',
    bunkerDestroyedPlural: 'Bunker zerstört',
    buttonActivated: 'Button/Slider aktiviert',
    podConnected: 'Frachtkugel angedockt',
    fuelRemaining: 'Treibstoff übrig',
    levelCompleteLabel: 'Level abgeschlossen',
    reactorEscape: 'Reaktor-Flucht',
    timeBonus: 'Zeit-Bonus',

    // Browser level limit (shown in EndOverlay when web player reaches BROWSER_MAX_LEVEL)
    browserLimitTitle: 'Du hast Level {n} geschafft!',
    browserLimitText: 'Lade dir die App herunter, um alle {total} Level zu spielen.',
    iosComingSoon: 'iOS coming soon',
    replay: 'Nochmal',

    // Sky return warning (shown when flying into sky without pod)
    skyReturnWarning: 'Hole erst die Frachtkugel und schleppe sie in den Weltraum!',

    // Orientation mismatch warning (shown once per game start when browser orientation
    // doesn't match the settings)
    orientationMismatchTitle: 'Orientierung',
    orientationMismatchWarning: 'Die Bildschirmausrichtung stimmt nicht mit den Einstellungen überein. Wechsle im Menü in den passenden Modus, oder drehe dein Gerät / passe das Fenster an. Cave Shuttle wird am besten im Portrait-Modus gespielt.',
  },
  en: {
    // Buttons
    playAgain: 'Play Again',
    backToMenu: 'Back to Menu',
    backToLobby: 'Back to Lobby',
    nextLevel: 'Next Level',

    // Level complete / game over overlay
    gameOver: 'GAME OVER',
    levelComplete: 'LEVEL {n} COMPLETE',
    scoreLabel: 'Score',

    // New highscore banner
    newHighscore: 'NEW HIGHSCORE',
    run: 'Campaign',
    top10Rank: 'Highscore Rank {rank}',

    // Player name labels
    player1: 'Player 1:',
    yourName: 'Your name:',
    player2: 'Player 2:',

    // Score breakdown labels (used in App.jsx scoreBreakdown)
    time: 'Time',
    bunkerDestroyed: 'Bunker destroyed',
    bunkerDestroyedPlural: 'Bunkers destroyed',
    buttonActivated: 'Button/Slider activated',
    podConnected: 'Cargo Pod connected',
    fuelRemaining: 'Fuel remaining',
    levelCompleteLabel: 'Level complete',
    reactorEscape: 'Reactor escape',
    timeBonus: 'Time Bonus',

    // Browser level limit (shown in EndOverlay when web player reaches BROWSER_MAX_LEVEL)
    browserLimitTitle: 'You beat Level {n}!',
    browserLimitText: 'Download the app to play all {total} levels.',
    iosComingSoon: 'iOS coming soon',
    replay: 'Replay',

    // Sky return warning (shown when flying into sky without pod)
    skyReturnWarning: 'Pick up the cargo pod and tow it into space!',

    // Orientation mismatch warning (shown once per game start when browser orientation
    // doesn't match the settings)
    orientationMismatchTitle: 'Orientation',
    orientationMismatchWarning: 'The screen orientation does not match the settings. Switch to the matching mode in the menu, or rotate your device / resize the window. Cave Shuttle is best played in portrait mode.',
  },
};

export function getGameScreenTranslations(lang) {
  return gameScreenTranslations[lang] || gameScreenTranslations.en;
}

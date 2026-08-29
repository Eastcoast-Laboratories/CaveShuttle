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
    levelComplete: 'LEVEL COMPLETE',
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
  },
  en: {
    // Buttons
    playAgain: 'Play Again',
    backToMenu: 'Back to Menu',
    backToLobby: 'Back to Lobby',
    nextLevel: 'Next Level',

    // Level complete / game over overlay
    gameOver: 'GAME OVER',
    levelComplete: 'LEVEL COMPLETE',
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
  },
};

export function getGameScreenTranslations(lang) {
  return gameScreenTranslations[lang] || gameScreenTranslations.en;
}

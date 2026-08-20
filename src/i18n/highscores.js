// Translations for highscores page, level complete overlay, and game over overlay.
// New languages can be added here without touching the components.
export const highscoreTranslations = {
  de: {
    // Table headers
    rank: 'Rang',
    score: 'Punkte',
    level: 'Level',
    name: 'Name',
    stage: 'Stage',

    // Tabs
    runs: 'Missionen',
    levels: 'Level',
    onlineTab: '🌐 Global',
    localTab: '🏠 Lokal',

    // Filter options
    allPlayers: '1 und 2 Spieler',
    onePlayer: '1 Spieler',
    twoPlayer: '2 Spieler',

    // Buttons
    back: '← Zurück',
    play: 'Play →',
    close: 'Schließen',
    playAgain: 'Nochmal spielen',
    backToMenu: '← Menu',
    backToLobby: '← Lobby',
    nextLevel: 'Nächstes Level',

    // Player info
    player: 'Spieler',

    // Empty states
    noRunHighscores: 'Noch keine Mission-Highscores.',
    noLevelRecords: 'Keine Level-Einträge.',
    noEntriesYet: 'Noch keine Einträge.',
    noScore: 'Kein Punktestand',

    // Run detail popup
    totalScore: 'Gesamtpunkte',
    lastPlayed: 'Zuletzt gespielt: Level {level} - {score} Pkt{suffix}',
    gameOverSuffix: ' (Spiel vorbei)',
    levelFailed: ' - fehlgeschlagen',
    stageLabel: 'Stage {n}',

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
    podConnected: 'Pod angedockt',
    fuelRemaining: 'Treibstoff übrig',
    levelCompleteLabel: 'Level abgeschlossen',
    reactorEscape: 'Reaktor-Flucht',
    timeBonus: 'Zeit-Bonus',

    // Score breakdown labels (used in HighscoresPage run detail popup)
    breakdownLabels: {
      bunker: 'Bunker',
      button: 'Button',
      pod: 'Pod',
      reactor: 'Reaktor-Flucht',
      fuel: 'Treibstoff',
      level: 'Level',
      time: 'Zeit',
      timeBonus: 'Bonus',
    },

    // Units
    points: 'Pkt',
    seconds: 's',
  },
  en: {
    // Table headers
    rank: 'Rank',
    score: 'Score',
    level: 'Level',
    name: 'Name',
    stage: 'Stage',

    // Tabs
    runs: 'Campaigns',
    levels: 'Levels',
    onlineTab: '🌐 Global',
    localTab: '🏠 Local',

    // Filter options
    allPlayers: '1 and 2 Player',
    onePlayer: '1 Player',
    twoPlayer: '2 Player',

    // Buttons
    back: '← Back',
    play: 'Play →',
    close: 'Close',
    playAgain: 'Play Again',
    backToMenu: 'Back to Menu',
    backToLobby: 'Back to Lobby',
    nextLevel: 'Next Level',

    // Player info
    player: 'Player',

    // Empty states
    noRunHighscores: 'No campaign highscores yet.',
    noLevelRecords: 'No level records.',
    noEntriesYet: 'No entries yet.',
    noScore: 'No score',

    // Run detail popup
    totalScore: 'Total Score',
    lastPlayed: 'Last played: Level {level} - {score} pts{suffix}',
    gameOverSuffix: ' (game over)',
    levelFailed: ' - failed',
    stageLabel: 'Stage {n}',

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
    podConnected: 'Pod connected',
    fuelRemaining: 'Fuel remaining',
    levelCompleteLabel: 'Level complete',
    reactorEscape: 'Reactor escape',
    timeBonus: 'Time Bonus',

    // Score breakdown labels (used in HighscoresPage run detail popup)
    breakdownLabels: {
      bunker: 'bunker',
      button: 'button',
      pod: 'pod',
      reactor: 'reactor escape',
      fuel: 'fuel',
      level: 'level',
      time: 'time',
      timeBonus: 'bonus',
    },

    // Units
    points: 'pts',
    seconds: 's',
  },
};

// Helper to get translations for a given language with fallback to English.
export function getHighscoreTranslations(lang) {
  return highscoreTranslations[lang] || highscoreTranslations.en;
}

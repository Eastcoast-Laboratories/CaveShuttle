// Translations for the highscores page.
// Game screen strings (overlay, buttons, score breakdown) are in gameScreen.js.
// Shared strings (level, rank, points, seconds) are in global.js.
export const highscoreTranslations = {
  de: {
    // Table headers
    score: 'Punkte',
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
    back: 'Zurück',
    play: 'Play',
    close: 'Schließen',

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

    // Score breakdown labels (used in HighscoresPage run detail popup)
    breakdownLabels: {
      bunker: 'Bunker',
      button: 'Button',
      pod: 'Frachtkugel',
      reactor: 'Reaktor-Flucht',
      fuel: 'Treibstoff',
      level: 'Level',
      time: 'Zeit',
      timeBonus: 'Bonus',
    },
  },
  en: {
    // Table headers
    score: 'Score',
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
    play: 'Play',
    close: 'Close',

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

    // Score breakdown labels (used in HighscoresPage run detail popup)
    breakdownLabels: {
      bunker: 'bunker',
      button: 'button',
      pod: 'cargo pod',
      reactor: 'reactor escape',
      fuel: 'fuel',
      level: 'level',
      time: 'time',
      timeBonus: 'bonus',
    },
  },
};

// Helper to get translations for a given language with fallback to English.
export function getHighscoreTranslations(lang) {
  return highscoreTranslations[lang] || highscoreTranslations.en;
}

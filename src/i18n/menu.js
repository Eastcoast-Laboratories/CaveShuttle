// Translations for Menu, TopRightMenu, and PlayerNameInput components.
export const menuTranslations = {
  de: {
    startGame: 'SPIEL STARTEN',
    multiplayer: 'Mehrspieler',
    onePlayer: '1 Spieler',
    twoPlayer: '2 Spieler',
    tagline: 'Sammle den Pod und entkomme den Höhlen',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    deleteAccount: 'Konto löschen',
    highscores: 'HIGHSCORES',
    levelEditor: 'Level-Editor',
    yourName: 'dein Name',
    save: 'Speichern',
  },
  en: {
    startGame: 'START GAME',
    multiplayer: 'Multiplayer',
    onePlayer: '1 Player',
    twoPlayer: '2 Player',
    tagline: 'Collect the Pod and escape the Caves',
    imprint: 'Imprint',
    privacy: 'Privacy',
    deleteAccount: 'Delete account',
    highscores: 'HIGHSCORES',
    levelEditor: 'Level Editor',
    yourName: 'your name',
    save: 'Save',
  },
};

export function getMenuTranslations(lang) {
  return menuTranslations[lang] || menuTranslations.en;
}

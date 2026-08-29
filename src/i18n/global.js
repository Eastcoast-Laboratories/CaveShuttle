// Global translations shared across multiple screens (game, highscores, end overlay).
export const globalTranslations = {
  de: {
    level: 'Level',
    rank: 'Rang',
    points: 'Pkt',
    seconds: 's',
  },
  en: {
    level: 'Level',
    rank: 'Rank',
    points: 'pts',
    seconds: 's',
  },
};

export function getGlobalTranslations(lang) {
  return globalTranslations[lang] || globalTranslations.en;
}

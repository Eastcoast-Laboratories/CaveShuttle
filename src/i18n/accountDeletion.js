// Translations for the account deletion page.
// Required by Google Play Data Safety policy.
export const accountDeletionTranslations = {
  de: {
    back: 'Zurück',
    title: 'Konto löschen',
    intro: 'Du kannst dein Konto direkt in der CaveShuttle Community löschen.',
    deleteLinkText: 'Zur Kontolöschung in der Community',
    deleteUrl: 'https://community.caveshuttle.z11.de/settings#deleteDataPanel',
    localDataHint: 'Lokale Daten auf deinem Gerät (Spielstände, Einstellungen, lokale Highscores) bleiben erhalten. Um diese zu löschen, nutze die Reset-Funktion in den Spieleinstellungen oder deinstalliere die App.',
    contactTitle: 'Kontakt',
    contactEmailLabel: 'E-Mail:',
    contactEmail: 'caveshuttle-support@it.z11.de',
  },
  en: {
    back: 'Back',
    title: 'Delete account',
    intro: 'You can delete your account directly in the CaveShuttle Community.',
    deleteLinkText: 'Go to account deletion in the Community',
    deleteUrl: 'https://community.caveshuttle.z11.de/settings#deleteDataPanel',
    localDataHint: 'Local data on your device (save files, settings, local high scores) will remain. To delete these, use the reset function in the game settings or uninstall the app.',
    contactTitle: 'Contact',
    contactEmailLabel: 'Email:',
    contactEmail: 'caveshuttle-support@it.z11.de',
  },
};

export function getAccountDeletionTranslations(lang) {
  return accountDeletionTranslations[lang] || accountDeletionTranslations.en;
}

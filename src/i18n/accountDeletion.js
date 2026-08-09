// Translations for the account deletion page.
// Required by Google Play Data Safety policy.
export const accountDeletionTranslations = {
  de: {
    back: 'Zurück',
    title: 'Konto löschen',

    introBefore: 'Cave Shuttle kann vollständig lokal ohne Benutzerkonto gespielt werden. Wenn du ein optionales Online-Konto bei',
    introAfter: 'erstellt hast, kannst du die Löschung deines Kontos und der zugehörigen Daten hier anfordern.',

    step1Title: '1. So fordertest du die Löschung an',
    step1Item1Before: 'Sende eine E-Mail an',
    step1Item1Mid: 'mit dem Betreff',
    emailSubject: 'Kontolöschung Cave Shuttle',
    step1Item2Before: 'Gib in der E-Mail deinen',
    step1Item2Mid: 'und die',
    step1Item2After: 'an, mit der du das Konto registriert hast.',
    usernameLabel: 'Benutzernamen',
    emailAddrLabel: 'E-Mail-Adresse',
    step1Item3Before: 'Du erhältst eine Bestätigung per E-Mail, sobald dein Konto und alle zugehörigen Daten gelöscht wurden. Die Löschung erfolgt in der Regel innerhalb von',
    step1Item3After: '.',

    step2Title: '2. Welche Daten gelöscht werden',
    step2Intro: 'Bei der Kontolöschung werden folgende serverseitige Daten unwiderruflich entfernt:',
    step2Items: [
      'Kontodaten (Benutzername, E-Mail-Adresse, Authentifizierungsdaten/API-Token)',
      'Serverseitige Cave-Shuttle-Highscores und zugehörige Score-Daten einschließlich detailliertem Score-Aufschluss',
      'Level-Pack, Level, Spielmodus, Run-ID, Punktzahl und Zeitstempel synchronisierter Einträge',
      'Synchronisationsstatus, Server-ID und Zeitpunkte der Änderungen',
      'Öffentliche Ranglisten-Einträge, die mit deinem Konto verknüpft sind',
    ],

    step3Title: '3. Welche Daten zusätzlich aufbewahrt werden',
    step3Intro: 'Folgende Daten können über die Kontolöschung hinaus vorübergehend aufbewahrt werden:',
    step3Item1Label: 'Server-Protokolle',
    step3Item1Text: ' (IP-Adresse, Zeitpunkt): bis zu 30 Tage nach der Löschung, soweit für Betrieb, Sicherheit und Missbrauchsschutz erforderlich.',
    step3Item2Label: 'Gesetzliche Aufbewahrungspflichten',
    step3Item2Text: ': Daten, die aufgrund gesetzlicher Verpflichtungen aufbewahrt werden müssen, werden für die gesetzlich vorgeschriebene Dauer gespeichert.',

    step4Title: '4. Lokale Daten auf deinem Gerät',
    step4Text1: 'Die Kontolöschung bezieht sich nur auf die serverseitigen Daten. Lokal auf deinem Gerät gespeicherte Daten — wie Spielstände, Einstellungen und lokale Highscores — bleiben erhalten, bis du sie im Spiel zurücksetzt, den App-Speicher löschst oder die App deinstallierst.',
    step4Text2Before: 'Um auch lokale Daten zu löschen, nutze die',
    step4Text2After: 'in den Einstellungen des Spiels oder deinstalliere die App.',
    resetLabel: 'Reset-Funktion',

    step5Title: '5. Alternative: Löschung direkt in der Community-Plattform',
    step5Text: 'Wenn du die Möglichkeit hast, dich in der Online-Funktion des Spiels anzumelden, kannst du die Kontolöschung auch direkt über die Kontoeinstellungen in der Seite durchführen.',

    contactTitle: 'Kontakt',
    contactName: 'Ruben Barkow-Kuder',
    contactOrg: 'eastcoast laboratories',
    contactStreet: 'Knickweg 16',
    contactCity: 'D-24114 Kiel',
    contactEmailLabel: 'E-Mail:',
  },
  en: {
    back: 'Back',
    title: 'Delete account',

    introBefore: 'Cave Shuttle can be played entirely locally without an account. If you have created an optional online account at',
    introAfter: 'you can request the deletion of your account and associated data here.',

    step1Title: '1. How to request deletion',
    step1Item1Before: 'Send an email to',
    step1Item1Mid: 'with the subject',
    emailSubject: 'Account deletion Cave Shuttle',
    step1Item2Before: 'Include your',
    step1Item2Mid: 'and the',
    step1Item2After: 'you used to register the account.',
    usernameLabel: 'username',
    emailAddrLabel: 'email address',
    step1Item3Before: 'You will receive a confirmation email once your account and all associated data have been deleted. Deletion typically occurs within',
    step1Item3After: '.',

    step2Title: '2. What data will be deleted',
    step2Intro: 'The following server-side data will be permanently removed upon account deletion:',
    step2Items: [
      'Account data (username, email address, authentication data/API token)',
      'Server-side Cave Shuttle high scores and associated score data including detailed score breakdown',
      'Level pack, level, game mode, run ID, score and timestamp of synchronized entries',
      'Synchronization status, server ID and timestamps of changes',
      'Public leaderboard entries associated with your account',
    ],

    step3Title: '3. What data may be retained',
    step3Intro: 'The following data may be temporarily retained beyond the account deletion:',
    step3Item1Label: 'Server logs',
    step3Item1Text: ' (IP address, timestamp): up to 30 days after deletion, as required for operations, security and abuse prevention.',
    step3Item2Label: 'Legal retention obligations',
    step3Item2Text: ': Data that must be retained due to legal obligations will be stored for the legally required duration.',

    step4Title: '4. Local data on your device',
    step4Text1: 'Account deletion only covers server-side data. Data stored locally on your device — such as save files, settings and local high scores — remains until you reset it in the game, clear app storage or uninstall the app.',
    step4Text2Before: 'To also delete local data, use the',
    step4Text2After: 'in the game settings or uninstall the app.',
    resetLabel: 'reset function',

    step5Title: '5. Alternative: Deletion directly on the community platform',
    step5Text: 'If you are able to log in to the online features of the game, you can also delete your account directly through the account settings on the website.',

    contactTitle: 'Contact',
    contactName: 'Ruben Barkow-Kuder',
    contactOrg: 'eastcoast laboratories',
    contactStreet: 'Knickweg 16',
    contactCity: 'D-24114 Kiel',
    contactEmailLabel: 'Email:',
  },
};

export function getAccountDeletionTranslations(lang) {
  return accountDeletionTranslations[lang] || accountDeletionTranslations.en;
}

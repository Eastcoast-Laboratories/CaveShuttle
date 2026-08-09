import React from 'react';
import './LegalPages.css';

// Account deletion page reachable via #account-deletion hash.
// Required by Google Play Data Safety policy.
export default function AccountDeletion({ onBack }) {
  return (
    <div className="modal-page">
      <div className="modal-page-inner">
        <button className="back-button" onClick={onBack}>
          Zurück
        </button>

        <h1>Konto löschen</h1>

        <p>
          Cave Shuttle kann vollständig lokal ohne Benutzerkonto gespielt werden.
          Wenn du ein optionales Online-Konto bei <strong>community.caveshuttle.z11.de</strong> erstellt hast,
          kannst du die Löschung deines Kontos und der zugehörigen Daten hier anfordern.
        </p>

        <h2>1. So fordertest du die Löschung an</h2>
        <ol>
          <li>
            Sende eine E-Mail an <a href="mailto:caveshuttle-support@it.z11.de?subject=Kontolöschung%20Cave%20Shuttle">caveshuttle-support@it.z11.de</a>
            mit dem Betreff <strong>„Kontolöschung Cave Shuttle"</strong>.
          </li>
          <li>
            Gib in der E-Mail deinen <strong>Benutzernamen</strong> und die <strong>E-Mail-Adresse</strong> an,
            mit der du das Konto registriert hast.
          </li>
          <li>
            Du erhältst eine Bestätigung per E-Mail, sobald dein Konto und alle zugehörigen Daten gelöscht wurden.
            Die Löschung erfolgt in der Regel innerhalb von <strong>14 Tagen</strong>.
          </li>
        </ol>

        <h2>2. Welche Daten gelöscht werden</h2>
        <p>Bei der Kontolöschung werden folgende serverseitige Daten unwiderruflich entfernt:</p>
        <ul>
          <li>Kontodaten (Benutzername, E-Mail-Adresse, Authentifizierungsdaten/API-Token)</li>
          <li>Serverseitige Cave-Shuttle-Highscores und zugehörige Score-Daten einschließlich detailliertem Score-Aufschluss</li>
          <li>Level-Pack, Level, Spielmodus, Run-ID, Punktzahl und Zeitstempel synchronisierter Einträge</li>
          <li>Synchronisationsstatus, Server-ID und Zeitpunkte der Änderungen</li>
          <li>Öffentliche Ranglisten-Einträge, die mit deinem Konto verknüpft sind</li>
        </ul>

        <h2>3. Welche Daten zusätzlich aufbewahrt werden</h2>
        <p>Folgende Daten können über die Kontolöschung hinaus vorübergehend aufbewahrt werden:</p>
        <ul>
          <li>
            <strong>Server-Protokolle</strong> (IP-Adresse, Zeitpunkt): bis zu 30 Tage nach der Löschung,
            soweit für Betrieb, Sicherheit und Missbrauchsschutz erforderlich.
          </li>
          <li>
            <strong>Gesetzliche Aufbewahrungspflichten</strong>: Daten, die aufgrund gesetzlicher Verpflichtungen
            aufbewahrt werden müssen, werden für die gesetzlich vorgeschriebene Dauer gespeichert.
          </li>
        </ul>

        <h2>4. Lokale Daten auf deinem Gerät</h2>
        <p>
          Die Kontolöschung bezieht sich nur auf die serverseitigen Daten.
          Lokal auf deinem Gerät gespeicherte Daten — wie Spielstände, Einstellungen und lokale Highscores —
          bleiben erhalten, bis du sie im Spiel zurücksetzt, den App-Speicher löschst oder die App deinstallierst.
        </p>
        <p>
          Um auch lokale Daten zu löschen, nutze die <strong>Reset-Funktion</strong> in den Einstellungen des Spiels
          oder deinstalliere die App.
        </p>

        <h2>5. Alternative: Löschung direkt in der Community-Plattform</h2>
        <p>
          Wenn du die Möglichkeit hast, dich in der Online-Funktion des Spiels anzumelden,
          kannst du die Kontolöschung auch direkt über die Kontoeinstellungen in der Seite durchführen.
        </p>

        <h2>Kontakt</h2>
        <p>
          Ruben Barkow-Kuder<br />
          eastcoast laboratories<br />
          Knickweg 16<br />
          D-24114 Kiel<br />
          E-Mail: <a href="mailto:caveshuttle-support@it.z11.de?subject=Kontolöschung%20Cave%20Shuttle">caveshuttle-support@it.z11.de</a>
        </p>
      </div>
    </div>
  );
}

import React from 'react';
import './LegalPages.css';

// Static data protection page linked from the main menu.
export default function Datenschutz({ onBack }) {
  return (
    <div className="modal-page">
      <div className="modal-page-inner">
        <button className="back-button" onClick={onBack}>
          Zurück
        </button>

        <h1>Datenschutzerklärung</h1>
        <p>
          Cave Shuttle kann vollständig lokal ohne Benutzerkonto gespielt werden. Zusätzlich kann optional ein Konto bei community.caveshuttle.z11.de verbunden werden, um Cave-Shuttle-Spielstände und Highscores online zu synchronisieren. Diese Erklärung beschreibt beide Nutzungsarten.
        </p>

        <h2>1. Verantwortlicher</h2>
        <p>
          Ruben Barkow-Kuder<br />
          eastcoast laboratories<br />
          Knickweg 16<br />
          24114 Kiel
        </p>

        <h2>2. Lokale Nutzung ohne Konto</h2>
        <p>
          Ohne Benutzerkonto werden die für das Spiel erforderlichen Daten ausschließlich lokal auf deinem Gerät verarbeitet. Dazu gehören:
        </p>
        <ul>
          <li>lokaler Benutzername für Highscores</li>
          <li>Spielstände, Level-Fortschritt und lokale Highscores</li>
          <li>Einstellungen wie Lautstärke, Touch-Buttons und ausgewählter Spielmodus</li>
          <li>lokal installierte oder importierte Level-Packs</li>
          <li>versionierte Exportdaten, die du selbst erzeugst und kopierst</li>
        </ul>
        <p>
          Diese Daten werden ohne deine ausdrückliche Aktion nicht an den Cave-Shuttle-Server übertragen. Du kannst lokale Daten durch den vorgesehenen Reset, das Löschen des App-Speichers oder die Deinstallation der App entfernen.
        </p>

        <h2>3. Optionales Online-Konto</h2>
        <p>
          Wenn du ein Konto bei community.caveshuttle.z11.de erstellst oder verbindest, verarbeitet der Onlinedienst zusätzlich die für Konto, Anmeldung und Synchronisierung erforderlichen Daten:
        </p>
        <ul>
          <li>Kontodaten wie Benutzername, E-Mail-Adresse und Authentifizierungsdaten (API-Token)</li>
          <li>Zuordnung des Kontos zum Spiel Cave Shuttle</li>
          <li>Geräte- und App-Metadaten wie Installationsquelle und optionale Gerätekennung</li>
          <li>serverseitige Cave-Shuttle-Highscores und die dazugehörigen Score-Daten einschließlich detailliertem Score-Aufschluss</li>
          <li>Level-Pack, Level, Spielmodus, Run-ID, Punktzahl und Zeitstempel eines synchronisierten Eintrags</li>
          <li>Synchronisationsstatus, Server-ID und Zeitpunkte der Änderungen</li>
          <li>Server-Protokolle, soweit sie für Betrieb, Fehlerdiagnose und Missbrauchsschutz erforderlich sind; dabei werden keine unnötigen personenbezogenen Daten protokolliert</li>
        </ul>
        <p>
          Die Daten von Roboyard und Cave Shuttle werden getrennt verarbeitet. Das Konto ist optional und nicht erforderlich, um das Spiel zu starten oder lokal zu spielen.
        </p>

        <h2>4. Öffentliche Online-Highscores</h2>
        <p>
          Wenn du einen synchronisierten Highscore veröffentlichst, können der von dir gewählte Benutzername, die Punktzahl, das Level, der Spielmodus, das Level-Pack und der Zeitpunkt des Eintrags in der öffentlichen Cave-Shuttle-Rangliste angezeigt werden. Deine E-Mail-Adresse und Authentifizierungsdaten werden nicht öffentlich angezeigt.
        </p>
        <p>
          Die Scores werden im Client berechnet und vom Server gespeichert. Der Server behandelt die Scores nicht als manipulationssicher, solange keine zusätzliche Validierung implementiert ist. Die Online-Rangliste darf nicht als fälschungssicher beworben werden.
        </p>

        <h2>5. Externe Level-Packs</h2>
        <p>
          Wenn du ein Level-Pack von einem externen Server lädst, werden die dafür notwendigen Netzwerkdaten an den von dir ausgewählten Server übertragen. Dazu können insbesondere IP-Adresse, Zeitpunkt und angeforderte Ressource gehören. Für diese Verarbeitung gelten zusätzlich die Datenschutzbestimmungen des jeweiligen Anbieters.
        </p>

        <h2>6. Zwecke und Rechtsgrundlagen</h2>
        <ul>
          <li>Bereitstellung des lokalen Spiels und lokaler Funktionen nach Art. 6 Abs. 1 lit. b DSGVO, soweit ein Vertrag betroffen ist</li>
          <li>Bereitstellung des freiwilligen Kontos, der Synchronisierung und der Online-Ranglisten nach Art. 6 Abs. 1 lit. b DSGVO</li>
          <li>Schutz des Dienstes, Fehlerdiagnose und Missbrauchsschutz nach Art. 6 Abs. 1 lit. f DSGVO</li>
          <li>Erfüllung gesetzlicher Pflichten nach Art. 6 Abs. 1 lit. c DSGVO, soweit erforderlich</li>
        </ul>
        <p>
          Cave Shuttle enthält keine Werbe- oder Analyse-SDKs und verkauft keine personenbezogenen Daten.
        </p>

        <h2>7. Empfänger und Dienstleister</h2>
        <p>
          Personenbezogene Daten können an den Betreiber von community.caveshuttle.z11.de sowie an technische Dienstleister für Hosting, Datenbank, Authentifizierung, E-Mail-Versand und Serverbetrieb übermittelt werden, soweit dies für die genannten Zwecke erforderlich ist. Externe Level-Pack-Server erhalten Daten nur bei einer von dir ausgelösten Anfrage. Eine Weitergabe zu Werbezwecken findet nicht statt.
        </p>

        <h2>8. Speicherdauer und Löschung</h2>
        <p>
          Lokale Daten bleiben gespeichert, bis du sie im Spiel zurücksetzt, den App-Speicher löschst oder die App deinstallierst. Serverseitige Konto-, Synchronisierungs- und Highscore-Daten werden gespeichert, solange dein Konto besteht oder sie für die jeweiligen Funktionen benötigt werden. Bei der Kontolöschung werden die serverseitigen Cave-Shuttle-Daten gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen. Technische Sicherheits- und Serverprotokolle werden nur so lange aufbewahrt, wie sie für Betrieb, Sicherheit oder gesetzliche Pflichten erforderlich sind.
        </p>

        <h2>9. Export, Berichtigung und Kontolöschung</h2>
        <p>
          Du kannst deine lokalen Daten über die Exportfunktion sichern. Für ein Online-Konto kannst du Auskunft, Berichtigung, Export und Löschung der serverseitigen Cave-Shuttle-Daten beim Verantwortlichen anfordern oder die dafür im Dienst bereitgestellten Funktionen nutzen. Eine Kontolöschung beendet nicht automatisch die lokale Speicherung auf deinem Gerät; diese musst du zusätzlich lokal löschen.
        </p>

        <h2>10. Cookies und lokale Speicherung</h2>
        <p>
          Die lokale App verwendet den Gerätespeicher für Einstellungen, Fortschritt und Highscores. Der Onlinedienst kann technisch notwendige Session- oder Sicherheits-Cookies beziehungsweise vergleichbare Speichermechanismen für Anmeldung und Sitzungsverwaltung verwenden. Tracking-Cookies werden nicht eingesetzt.
        </p>

        <h2>11. Deine Rechte</h2>
        <p>Du hast im Rahmen der gesetzlichen Voraussetzungen insbesondere das Recht auf:</p>
        <ul>
          <li>Auskunft über die Verarbeitung und deine gespeicherten Daten</li>
          <li>Berichtigung unrichtiger Daten</li>
          <li>Löschung deiner Daten</li>
          <li>Einschränkung der Verarbeitung</li>
          <li>Datenübertragbarkeit</li>
          <li>Widerspruch gegen Verarbeitungen, die auf berechtigten Interessen beruhen</li>
        </ul>

        <h2>12. Sicherheit</h2>
        <p>
          Online-Verbindungen werden nach dem Stand der Technik verschlüsselt. Zugriffe auf Konten und serverseitige Daten werden technisch geschützt und auf die erforderlichen Stellen beschränkt. Kein Verfahren kann eine absolute Sicherheit garantieren.
        </p>

        <h2>13. Beschwerderecht</h2>
        <p>
          Du hast das Recht, dich bei einer Datenschutzaufsichtsbehörde zu beschweren. Zuständig ist insbesondere die Aufsichtsbehörde an deinem gewöhnlichen Aufenthaltsort oder am Sitz des Verantwortlichen.
        </p>

        <h2>14. Änderungen</h2>
        <p>
          Wenn sich Funktionen, Onlinedienste oder Datenverarbeitungen ändern, wird diese Datenschutzerklärung aktualisiert. Maßgeblich ist die jeweils auf dieser Seite angegebene Fassung.
        </p>
      </div>
    </div>
  );
}

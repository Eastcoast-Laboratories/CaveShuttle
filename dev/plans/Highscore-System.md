# Plan für das lokale Highscore-System

## Ziel und Abgrenzung

Phase 1 implementiert lokale Highscores, lokale Benutzernamen sowie Import und Export. Danach wird diese Funktion getestet, im Play Store beschrieben und mit dem Android-Bundle veröffentlicht.

Das Spiel bleibt in Phase 1 ohne Benutzerkonto und ohne Online-Zwang vollständig nutzbar. Die spätere Online-Funktion wird ausschließlich in `Highscore-System-Phase-2.md` geplant.

## 1. Zielarchitektur und Datenmodell

### 1.1 Verantwortlichkeiten

- `ScoringSystem` verwaltet nur den laufenden Score des aktuellen Spiels.
- `App` koordiniert Spielereignisse, Benutzername, Pack, Spielmodus und Run-Kontext.
- `HighScoreManager` validiert, sortiert und persistiert ausschließlich abgeschlossene Highscore-Einträge.

Der laufende Score und die Highscore-Persistenz dürfen nicht parallel dieselbe Aufgabe übernehmen. Die bestehende React-State-Verwaltung in `App` wird an diese Verantwortlichkeiten angepasst.

Betroffene Bereiche:

- `src/game/scoring.js`
- `src/game/high-score-manager.js`
- `src/App.jsx`
- `src/core/storage-keys.js`

### 1.2 Gemeinsame Datenobjekte

Diese Datenstruktur wird in Phase 1 festgelegt und bildet später die lokale Grundlage für Phase 2:

- `PlayerProfile`: lokaler Benutzername.
- `RunContext`: `runId`, Startlevel, aktueller `pass` (Durchlauf innerhalb der Session), Pack-ID, Pack-Version, Spielmodus und Startzeitpunkt einer Spielsession.
- `LevelScoreRecord`: ein dauerhaft gespeichertes Ergebnis eines Levelversuchs mit `attemptId`, `runId`, `pass` (Durchlauf innerhalb des Runs), `level`, `completed`, Score, `scoreBreakdown`, aktiver Levelzeit und Regelversion.
- `RunScoreRecord`: der Gesamt-Score einer Spielsession mit Verweisen auf die zugehörigen `LevelScoreRecord`-IDs (`levelRecordIds`), `startLevel`, `lastLevel`, `totalScore` und Zeitstempel.

Jede `scoreBreakdown` enthält mindestens `bunker`, `fuel`, `button`, `pod`, `timeBonus` und `level`. Weitere Score-Komponenten können ergänzt werden, ohne die bestehende Struktur zu ändern.

Die Level-Records sind die einzige Quelle für die dauerhafte Detailauflistung. Ein `RunScoreRecord` referenziert diese Records, statt deren Aufschlüsselung doppelt zu kopieren. Die Regeln für den `timeBonus` stehen ausschließlich in `Timebonus-System.md`.

### 1.3 Spielmodus

`Spielmodus` bezeichnet die Anzahl der Spieler:

- `single`: 1 Player
- `two`: 2 Player

Der Modus ist Teil des `RunContext`, `LevelScoreRecord` und `RunScoreRecord`. Dadurch bleiben Einspieler- und Zwei-Spieler-Ranglisten getrennt.

## 2. Benutzername

### 2.1 Erzeugung und Speicherung

Beim ersten Spielstart wird ein lokaler Benutzername erzeugt und unter einem eigenen Storage-Key gespeichert. Der Generator arbeitet lokal und deterministisch aus vorbereiteten Listen für Weltraum-Begriffe, Rollen und Kennungen. Eine externe Generator-API wird nicht verwendet.

### 2.2 Änderung und Validierung

Der Benutzername kann in den Einstellungen sowie in den Level-Complete- und Game-Over-Dialogen geändert werden. Die Eingabe wird zentral validiert:

- maximale Länge,
- erlaubte Zeichen,
- keine leeren Namen.

Ungültige Eingaben werden nicht gespeichert und sichtbar gemeldet. Ein neuer Name gilt für den aktuellen, noch nicht finalisierten Run. Bereits abgeschlossene Einträge behalten den Namen, unter dem sie gespeichert wurden.

## 3. Ranglistenregeln und Abschlussstatus

### 3.1 Ranglistenbereiche

Für jede Kombination aus Pack-Version, Spielmodus und Ranglistenbereich wird eine Top-10-Liste geführt. Der Ranglistenbereich ist entweder ein einzelnes Level oder der gesamte Run eines Level-Packs. Eingebaute und benutzerdefinierte Level-Packs verwenden niemals dieselbe Rangliste.

### 3.2 Level-Ergebnis

Für jeden Levelversuch kann höchstens ein `LevelScoreRecord` gespeichert werden. Mehrere Versuche desselben Levels erhalten unterschiedliche `attemptId`-Werte. In die Level-Top-10 gelangen nur erfolgreiche Ergebnisse sowie der definierte fehlgeschlagene Erstversuch, falls noch kein erfolgreicher Eintrag für dieses Level existiert. Jeder gespeicherte Record enthält:

- `completed: true` bei erfolgreichem Levelabschluss,
- `completed: false` bei einem zulässigen fehlgeschlagenen Erstversuch,
- den finalen Score,
- die vollständige `scoreBreakdown` einschließlich `bunker`, `fuel`, `button`, `pod`, `timeBonus` und `level`,
- Levelzeit und Score-Regelversion.

Ein erfolgreicher Levelabschluss wird immer gespeichert. Ein fehlgeschlagener Levelversuch wird nur gespeichert, wenn für diese Kombination aus Pack-Version, Level und Spielmodus noch kein erfolgreicher Level-Record existiert. Dadurch bleibt sichtbar, dass der Level noch nicht geschafft wurde, ohne spätere erfolgreiche Ergebnisse durch Game-Over-Versuche zu ersetzen.

### 3.3 Gesamt-Run (enlg. Campaign / deut. Mission)

Ein `RunScoreRecord` wird mit den IDs der zugehörigen Level-Records verbunden. Der Gesamt-Score und die dauerhafte Detailauflistung werden dadurch nachvollziehbar, ohne die Level-Aufschlüsselung doppelt zu speichern.

- Startet ein Run bei Level 1 und wird nur ein Level versucht, wird bei Game Over kein Gesamt-Run-Eintrag gespeichert.
- Startet ein Run bei einem späteren Level, wird der Gesamt-Run auch bei Game Over gespeichert, weil der Startlevel Teil des Ergebnisses ist.
- Wurden in einer Session mehrere Level gespielt, wird der Gesamt-Run bei Game Over gespeichert.
- `LevelScoreRecord.completed` beschreibt den Abschlussstatus eines einzelnen Level-Versuchs: `true` für jeden erfolgreich beendeten Level, `false` für den letzten gespielten Level, falls dieser durch Game Over endet und noch kein erfolgreicher Eintrag für genau dieses Level existiert.
- Der `RunScoreRecord` referenziert alle gespeicherten Level-Records über `levelRecordIds`, sodass Details (welche Level mit welchem Ergebnis gespielt wurden) jederzeit nachvollzogen werden können.
- Ein Run kann mehrere Durchläufe des gleichen Packs enthalten. Jeder Durchlauf erhöht den `pass`-Wert im `RunContext` und wird im jeweiligen `LevelScoreRecord` gespeichert. Derselbe Level kann somit mehrfach in einem Run gespeichert werden; `levelRecordIds` speichert alle Versuche chronologisch, der `pass` zeigt jeweils den Durchlauf an.
- Ein Level-Neustart aus dem Game-Over-Dialog beendet den vorherigen Versuch und erzeugt einen neuen `attemptId`-Wert. Die Spielsession erhält weiterhin dieselbe `runId`; ein bereits gespeicherter Gesamt-Run wird dadurch nicht doppelt angelegt.

### 3.4 Sortierung und Einmaligkeit

- Erfolgreiche Level-Ergebnisse stehen vor fehlgeschlagenen Erstversuchen.
- Innerhalb derselben Statusgruppe sortiert die Rangliste nach Score absteigend.
- Bei gleicher Punktzahl steht der ältere Erstellungszeitpunkt zuerst.
- Derselbe Levelversuch oder Gesamt-Run darf anhand seiner eindeutigen `attemptId` beziehungsweise `runId` nicht doppelt gespeichert werden.
- Einträge außerhalb der Top 10 werden nicht als Ranglisteneinträge persistiert; dauerhaft referenzierte Level-Records dürfen für die Run-Historie erhalten bleiben.

## 4. Ereignisfluss und UI

### 4.1 Zentraler Ereignisfluss

`App` ist der einzige Ort, der abgeschlossene oder zulässige fehlgeschlagene Ergebnisse an `HighScoreManager` übergibt.


bei jedem level complete soll der eintrag für den aktuellen Run schon in die highscore geschrieben werden un d nur aktualisiert werden, wenn mman einen weiteren level schafft oder game over hat

Bei `handleLevelComplete` wird ein vollständiges `LevelScoreRecord` einschließlich `scoreBreakdown`, `runId` und `pass` gespeichert. Wird nach dem letzten Pack-Level wieder mit Level 1 fortgesetzt, erhöht `App` den `pass`-Wert im `RunContext`. Bei `handleGameOver` entscheidet `App` anhand von Startlevel, gespielten Leveln und vorhandenen erfolgreichen Level-Records, ob ein `RunScoreRecord` und/oder ein fehlgeschlagener `LevelScoreRecord` gespeichert werden.

Der Game-Over-Schutz liegt ebenfalls in `App`: Mehrere Meldungen aus `GameCanvas` dürfen nicht zu mehreren Einträgen führen. Ein Level-Neustart wird als komplett neuer run behandelt, es wird also der aktuelle level verworfen.

Betroffene Stellen:

- `src/App.jsx`: Score-State, Startlevel, Run-Kontext, `handleLevelComplete`, `handleGameOver` und Overlays
- `src/ui/GameCanvas.jsx`: beide Game-Over-Aufrufe
- `src/ui/Menu.jsx`: Menüeinträge für Spielername und Highscore-Reset
- `src/ui/HighscoresPage.jsx`: separate Highscore-Seite, erreichbar von der Startseite
- `src/game/scoring.js`: Score-Komponenten und Breakdown des aktuellen Runs
- `src/game/high-score-manager.js`: dauerhafte Records und Ranglisten

### 4.2 Dialoge und Highscore-Ansicht

Die Level-Complete- und Game-Over-Overlays zeigen den aktuellen Score-Breakdown, den finalen Score und ermöglichen die Namensänderung, bevor der zugehörige Record finalisiert wird. Eine Highscore-Liste oder Ranglistenfilter erscheinen nicht in den Dialogen.

Die Highscore-Ansicht ist eine eigene Seite (`src/ui/HighscoresPage.jsx`), die ausschließlich über die Startseite verlinkt wird. Sie bietet zwei Tabs/Seiten:

- **Runs** – Run-Rangliste mit `startLevel`/`lastLevel`, Spielername, `totalScore` und Datum. Ein Klick auf einen Run öffnet das Run-Detail-Popup mit allen per `levelRecordIds` referenzierten Level-Ergebnissen, gruppiert nach `pass`.
- **Levels** – Level-Rangliste: pro Pack-Level wird der beste Score samt Spielername und `pass` (Durchlauf, in dem der Score erreicht wurde) angezeigt. Ein Klick auf ein Level öffnet eine Detailansicht, die alle Einträge für genau dieses Level mit `pass` listet. In die Level-Top-10 gelangen ausschließlich `completed: true`-Einträge sowie der erste `completed: false`-Eintrag, solange noch kein erfolgreicher Eintrag für dieses Level existiert.

Im Hauptmenü/Hamburger-Menü werden keine Highscore-Listen dargestellt. Dort stehen nur:

- Eingabe und Änderung des lokalen Spielernamens,
- ein Eintrag zum Zurücksetzen aller Highscores (mit Bestätigungsdialog).

`HighscoresPage.jsx` wird als eigenständige Seite behandelt und nicht in das Hauptmenü eingebunden.

## 5. Persistenz, Reset und Import/Export

### 5.1 Storage

Alle neuen Schlüssel verwenden `storageKey()`. Gespeichert werden `PlayerProfile`, Highscore-Daten und die Version des Exportformats.

Die Ranglistenabgrenzung erfolgt über die in `LevelScoreRecord` und `RunScoreRecord` enthaltenen Pack-, Level- und Modusdaten. Die vollständige Score-Aufschlüsselung wird ausschließlich in den Level-Records gespeichert.

### 5.2 Validierung und Fehlerdiagnose

Beim Laden und Importieren werden alle Datenobjekte vollständig validiert: Struktur, Typen, Score, Name, IDs, Pack-Version, Run-ID und Zeitstempel.

Ungültige Daten:

- werden nicht als gültig übernommen,
- erzeugen eine eindeutige Diagnose mit Fach-Tag,
- löschen und überschreiben keine bestehenden Daten.

### 5.3 Reset

Der vollständige globale Reset löscht nach Bestätigung Profil, Highscores und übrige lokale Spieldaten. Ein gezielter Highscore-Reset löscht ausschließlich die Highscore-Daten.

### 5.4 Export und Import

Der Einstellungsbereich erhält einen versionierten Export und Import als kopierbaren Base64-String. Der Inhalt ist komprimiertes JSON und umfasst den Benutzername, Highscores sowie die bereits vom bestehenden Exportformat unterstützten Fortschritts-, Einstellungs- und Level-Pack-Daten.

Beim Import gilt:

- Ein vorhandenes Highscore-Feld mit gültigen Einträgen ersetzt die bisherigen Highscores.
- Ein fehlendes oder leeres Highscore-Feld lässt die bisherigen Highscores unverändert.
- Der gesamte Import wird vor jeder Änderung validiert.
- Beschädigte Daten werden vollständig abgelehnt.
- Wenn die Laufzeit keine geeignete Kompression unterstützt, wird der Export mit einer sichtbaren Diagnose abgebrochen statt still unkomprimiert fortzufahren.

## 6. Tests

Die vorhandenen Tests in `tests/unit/high-score-manager.test.js` werden für die neue Datenstruktur erweitert.

Zu prüfen sind:

- Score-Sortierung und Top-10-Grenze,
- Persistenz und Laden,
- Rangberechnung und Gleichstände,
- getrennte Level- und Run-Records,
- korrekter `completed`-Status,
- Game Over nach Start bei Level 1, späterem Startlevel und mehreren gespielten Leveln,
- mehrere Levelversuche mit eindeutigen `attemptId`-Werten,
- Level-Neustart ohne doppelten Gesamt-Run,
- getrennte Packs und Spielmodi,
- genau ein Record je Versuch und Gesamt-Run,
- vollständige und unveränderliche `scoreBreakdown`,
- Benutzername vor und nach der Finalisierung,
- Reset,
- Import mit, ohne und mit beschädigter Highscore-Liste,
- Datenverlustschutz bei fehlerhaften LocalStorage-Daten.

## 7. Veröffentlichung von Phase 1

Nach erfolgreicher Umsetzung darf das Play-Store-Listing lokale Highscores als verfügbare Funktion nennen. Die Formulierung muss den lokalen Umfang klar benennen, zum Beispiel lokale Top-10-Ranglisten für Level, Level-Packs, 1 Player und 2 Player.

Online-Konten, Server-Ranglisten und Online-Synchronisierung bleiben aus der Phase-1-Beschreibung ausgeschlossen, solange sie nicht produktiv verfügbar sind.

Vor der Veröffentlichung müssen Tests erfolgreich sein sowie das Android-Bundle neu gebaut und signiert werden.

## 8. Übergang zu Phase 2

Phase 2 verwendet `PlayerProfile`, `RunContext`, `LevelScoreRecord` und `RunScoreRecord` als lokale Ausgangsdaten. Diese Objekte werden dort nicht neu definiert, sondern um Synchronisationsstatus und Serverreferenzen ergänzt.

Die Laravel-Erweiterung, Konto- und API-Planung, serverseitige Score-Prüfung, Datenschutzänderungen und der Online-Rollout stehen ausschließlich in `Highscore-System-Phase-2.md`.

---
agent: devin-local
session: sand-colt
created: 2026-08-28T20:54:40Z
---
# Interaktives Tutorial in pausiertem Level 1

Das Start-Tutorial führt in einen frischen lokalen Level-1-Lauf mit einer echten Simulationspause und vier Hinweisen, von denen drei durch konkrete Steueraktionen statt durch Weiter-Buttons abgeschlossen werden.

## Summary

Das bestehende große `TutorialOverlay` wird zum Einstieg in einen geführten lokalen 1P-Durchlauf von Level 1. Ein laufendes Spiel bleibt während des großen Overlays zunächst erhalten und kann über „Abbrechen“ fortgesetzt werden; der primäre Button lautet dann „Level 1 neu starten“ und verwirft erst bei seiner Betätigung den aktuellen Zwischenstand. Im geführten Level pausiert die gesamte Simulation bei vier kleinen Hinweisen. Schritt 1, 3 und 4 werden durch echte Touch-/Tastatureingaben abgeschlossen; nur Schritt 2 besitzt einen Weiter-Button.

## Gewünschter Ablauf

1. Das große Tutorial öffnet sich:
   - automatisch beim ersten Spielstart, solange `tutorialDismissed` noch nicht gesetzt ist;
   - manuell über „Tutorial anzeigen“ im Hauptmenü;
   - manuell über das Hamburger-Menü in einem laufenden Spiel oder aus dem End-Overlay.
2. Liegt ein laufendes Spiel hinter dem großen Tutorial:
   - „Abbrechen“ schließt nur das Tutorial und setzt genau dieses pausierte Spiel fort;
   - der bisherige „Los geht’s“-Button heißt „Level 1 neu starten“ und startet erst dann den geführten Lauf; der bisherige Zwischenstand geht bewusst verloren.
3. Ohne laufenden Level startet der primäre Button direkt einen frischen lokalen 1P-Lauf in Level 1.
4. Der geführte Lauf endet nach der in Schritt 4 geforderten Schub-Aktion und läuft anschließend normal bis zum Wurmloch weiter.

## Tutorial-Zustandsmaschine

Statt unabhängiger Booleans wird ein eindeutiger Zustand verwendet:

1. `shieldAction` — sichtbar und pausiert
   - Text: „Benutze den Schild, um die ankommenden Schüsse der Bunker abzuwehren.“
   - Kein Weiter-Button.
   - Das Overlay zeigt eine Halte-Anweisung beziehungsweise einen Fortschritt.
   - Schild/Traktor-Button muss ununterbrochen mindestens `1000 ms` gehalten werden.
   - Loslassen vor Ablauf setzt nur den Fortschritt dieses Schritts auf null zurück.
   - Nach erfolgreichem Halten wechselt der Zustand zu `playingBeforeBrakingHint`; das Spiel setzt sich fort, während ein weiterhin gehaltener Schild normal aktiv bleibt.

2. `playingBeforeBrakingHint` — unsichtbar und nicht pausiert
   - Es werden exakt `5000 ms` **aktive Simulationszeit** gezählt; Zeiten in Menü, großem Tutorial oder anderen Pausen zählen nicht mit.
   - Danach wechselt der Zustand zu `brakingInfo` und pausiert das Spiel.

3. `brakingInfo` — sichtbar und pausiert
   - Text: „Drehe die Nase des Raumschiffs nach oben und benutze den Schub zum Bremsen, damit du langsam über dem runden Pod schwebst.“
   - Dieser Schritt besitzt als einziger einen normalen „Weiter“-Button.
   - „Weiter“ wechselt unmittelbar zu `tractorAndThrustAction`; die Simulation bleibt zwischen beiden Hinweisen pausiert.

4. `tractorAndThrustAction` — sichtbar und pausiert
   - Text: „Aktiviere den Traktorstrahl und den Schub gleichzeitig, damit du nach dem Andocken nicht gleich abstürzt.“
   - Kein Weiter-Button.
   - Traktorstrahl/Schild und Schub müssen gleichzeitig aktiv sein. Eine kurze, benannte Bestätigungsdauer (Vorschlag `150–250 ms`) verhindert einen zufälligen Einzelframe, bleibt aber ausdrücklich deutlich unter einer Sekunde.
   - Nach erfolgreicher Kombination wechselt der Zustand zu `playingUntilDocked`; das Spiel setzt sich fort, während beide weiterhin gehaltenen Eingaben normal wirken.

5. `playingUntilDocked` — unsichtbar und nicht pausiert
   - Wartet ausschließlich auf den bestehenden Übergang `onPodDockedChange(true)`.
   - Kein zusätzlicher Distanz- oder Nähedetektor.
   - Beim Andocken wechselt der Zustand zu `escapeThrustAction` und pausiert sofort.

6. `escapeThrustAction` — sichtbar und pausiert
   - Text: „Halte den Schub und fliege in den Himmel bis zum Wurmloch.“
   - Kein Weiter-Button.
   - Schub muss ununterbrochen mindestens `1000 ms` gehalten werden; Loslassen setzt den Fortschritt zurück.
   - Nach erfolgreichem Halten wird der geführte Modus beendet und die Simulation läuft mit weiterhin gehaltenem Schub weiter.

7. `complete` / `inactive`
   - Kein Tutorial-Hinweis und keine zusätzliche Pause.
   - Eine persistente Vormerkung wird an diesem Punkt gelöscht.

Die bisherigen Zustände `waitingForPodApproach` und `waitingForDockPosition` entfallen vollständig. Es gibt weder einen Nähe-Trigger für Schritt 2 noch einen Positions-Trigger für Schritt 3.

## Zentrale Pause reparieren

### Aktuelle Ursache

`frozen` pausiert nur einen mittleren Abschnitt des Game-Loops. Lokale Minen stoppen im normalen 1P-Spiel bereits. Bunker-Projektile, Spielerfeuer, Refueling, Client-Snapshots und mehrere zeitbasierte Zustände werden jedoch vor oder nach diesem Block weiterverarbeitet. Dadurch ist das Menü keine vollständige Pause.

### Umsetzung

1. In `GameCanvas.jsx` Rendering und Simulation klar trennen:
   - Rendering läuft in jedem RAF-Frame weiter.
   - Alle Gameplay-Mutationen laufen innerhalb genau einer zentralen `!frozen`-Grenze.
2. Diese Grenze umfasst Schiff, Pod, lokale und empfangene Bullets, Minen, Bunker, Kollisionen, Refueling, Partikel-Updates, Kamera, Levelabschluss und Gameplay-Netzwerkversand.
3. Gameplay-Fristen verwenden eine Simulationszeit, die nur in ungefrorenen Frames steigt. Dadurch springen Meltdown, Respawn-Immunität, Fuel-Empty, verzögerte Explosionen, Power-ups und Cooldowns nach einer Pause nicht vor.
4. Beim Öffnen einer normalen Menü-Pause aktive Eingaben neutralisieren, damit kein verlorenes Pointer-Up zu einer festhängenden Aktion führt.
5. Tutorial-Aktionspausen sind eine kontrollierte Ausnahme:
   - Physik und Gameplay-Seiteneffekte bleiben vollständig eingefroren.
   - DOM-Eingabestatus für die im aktuellen Schritt erlaubte Aktion wird weiterhin erfasst.
   - Die Haltezeit basiert auf realer monotoner Zeit, weil die Simulationszeit während des Hinweises absichtlich steht.
   - Andere Eingaben schließen den Schritt nicht ab und verändern keinen Spielzustand.
6. Pausenübergänge einmalig mit `[GAME_PAUSE]` protokollieren; keine Logs pro Frame.

## Eingaben für Tutorial-Schritte

1. `GameCanvas` erhält den aktuellen geführten Zustand sowie einen Callback wie `onGuidedTutorialAction`.
2. Vor der Simulationsgrenze werden nur reine Eingabesignale bestimmt:
   - Schild/Traktor aktiv;
   - Schub aktiv;
   - Kombination aus beiden.
3. Ein eigener Ref speichert pro Zustand den Beginn der ununterbrochenen Haltezeit.
4. Bei Zustandswechsel oder Loslassen wird der Ref zurückgesetzt.
5. Der Callback wird pro Schritt genau einmal ausgelöst; ein zustandsbezogener Guard verhindert Wiederholungen aus nachfolgenden RAF-Frames.
6. Touch, Keyboard und Tilt-Steering verwenden dieselben bereits normalisierten Eingabesignale, damit die Anleitung nicht gerätespezifisch dupliziert wird.
7. Für Schritt 3 ist der Traktorstrahl-/Schild-Button zusammen mit Schub maßgeblich; das Andocken selbst bleibt weiterhin an die bestehende Distanzprüfung gebunden.

## Kleines Hinweis-Overlay

1. Eine kompakte Komponente `TutorialHintOverlay` zeigt Text, Schrittanzeige (`1/4` bis `4/4`) und bei Halteschritten einen sichtbaren Fortschritt.
2. In `shieldAction`, `tractorAndThrustAction` und `escapeThrustAction` besitzt das Overlay keinen Button und lässt Pointer-Ereignisse außerhalb seiner Karte zum Canvas durch. Es darf die jeweils benötigten Touch-Buttons räumlich nicht verdecken.
3. In `brakingInfo` blockiert das pausierte Overlay normale Spieleingaben und zeigt den fokussierbaren Weiter-Button.
4. Das Overlay erhält keine eigene Spielzustandslogik; Zustand, Fortschritt und Aktionen kommen aus `App`/`GameCanvas`.
5. Accessibility:
   - verständlicher Live-Status für Haltefortschritt;
   - `role="dialog"` für den Informationsschritt;
   - Weiter-Button per Touch, Enter und Leertaste;
   - Aktionsschritte dürfen den Fokus nicht von den Spielcontrols wegfangen.
6. Neue deutsche und englische Texte werden im bestehenden `src/i18n/tutorial.js` unter `guidedHints` ergänzt.
7. Zustandswechsel werden einmalig mit `[TUTORIAL_GUIDE]` inklusive Ursache protokolliert.

## Tutorial-Einstiege und Level-Neustart

1. Alle direkten `setShowTutorial(true)`-Stellen in `App.jsx` werden durch einen gemeinsamen `openTutorial(source)`-Handler ersetzt.
2. Der Handler merkt sich, ob im Hintergrund ein fortsetzbarer `playing`-Level liegt.
3. `TutorialOverlay` erhält getrennte Callbacks:
   - `onCancel`: nur verfügbar bei fortsetzbarem Hintergrundspiel; Overlay schließen und denselben Level fortsetzen.
   - `onStartGuidedLevel`: Tutorial als gesehen markieren, bisherigen Run bei Bedarf geordnet beenden und einen frischen lokalen 1P-Run in Level 1 starten.
4. Der neue Startpfad verwendet dieselbe extrahierte Run-/Level-Reset-Funktion wie `handleStartGame` und `handleStartLevel`; Reset-Code wird nicht kopiert.
5. Beim automatischen Erststart wird noch kein unsichtbarer Level hinter dem großen Tutorial simuliert. Erst der primäre Tutorial-Button startet Level 1.
6. Aus `gameover` oder `levelcomplete` gibt es keinen fortsetzbaren Live-Level; dort ist kein Abbrechen-zum-Spiel nötig, der primäre Button startet den geführten Level 1.
7. Der geführte Lauf ist lokal und 1P (`networkRole=null`). Eine laufende Online-Verbindung muss vor dem Neustart geordnet verlassen werden.

## Gemeinsame Pausenbedingung (DRY)

`App.jsx` berechnet einen einzigen Wert `isGameplayPaused` aus:

- großem Tutorial sichtbar;
- Hamburger-Menü sichtbar;
- Endzustand;
- sichtbarem Tutorial-Hinweis (`shieldAction`, `brakingInfo`, `tractorAndThrustAction`, `escapeThrustAction`).

Nur dieser Wert wird als `frozen` an `GameCanvas` übergeben. Unsichtbare Wartezustände (`playingBeforeBrakingHint`, `playingUntilDocked`) pausieren nicht.

## Zwei Persistenzvarianten

Mit „Vormerkung“ ist gemeint: Das große Tutorial wurde für einen geführten Durchlauf gestartet, aber Schritt 4 wurde noch nicht erfolgreich mit einer Sekunde Schub abgeschlossen.

### Variante A — nur aktuelle App-Sitzung

- Der Zustand lebt ausschließlich als React-State.
- App-Neuladen oder Prozessende während der Hinweise bricht den geführten Ablauf ab.
- Da `tutorialDismissed` bereits gesetzt sein kann, startet das nächste Spiel normal; der Benutzer muss das Tutorial erneut über das Menü öffnen.
- Vorteil: keine neue Speicherung.
- Nachteil: Ein Android-Prozessende oder versehentlicher Reload verliert den zugesagten Tutoriallauf.

### Variante B — persistent (empfohlen)

- Beim Betätigen von „Los geht’s“ beziehungsweise „Level 1 neu starten“ wird über `storageKey()` `guidedTutorialPending=true` gespeichert; bloßes Öffnen und anschließendes Abbrechen setzt die Markierung nicht.
- Die Markierung wird erst nach erfolgreichem Abschluss von `escapeThrustAction` gelöscht.
- Wird die App vorher beendet, startet der nächste Spielstart einen frischen lokalen Level-1-Tutoriallauf wieder bei Schritt 1.
- Der exakte Zwischenschritt wird nicht gespeichert, weil kein Mid-Level-Spielzustand persistiert wird; so entstehen keine Hinweise, die nicht mehr zum neu gestarteten Level passen.
- Der bestehende Komplett-Export/-Import übernimmt den Key automatisch, weil alle localStorage-Einträge exportiert werden.
- Vorteil: Der Ablauf überlebt Reload und Android-Prozessende.
- Nachteil: Nach einem Abbruch beginnt er wieder bei Schritt 1.

**Empfehlung:** Variante B, weil sie mit einem einzigen booleschen Key robust bleibt und keine fehleranfällige Speicherung eines laufenden Levels benötigt.

## Implementation Steps

1. In `src/ui/GameCanvas.jsx` die echte zentrale Pause-Grenze und pausierbare Simulationszeit einführen; Bullets, Minen und alle übrigen Mutationen darunter zusammenführen.
2. Normalisierte, während einer Tutorial-Pause lesbare Eingabesignale sowie die Haltezeit-Auswertung für Schild, Traktor+Schub und Schub implementieren.
3. In `src/App.jsx` Tutorial-Einstiege, Abbrechen/Neustart, gemeinsamen Run-Reset, Zustandsmaschine und `isGameplayPaused` zentralisieren.
4. `TutorialOverlay.jsx` um den optionalen Abbrechen-Button und den kontextabhängigen Text „Level 1 neu starten“ erweitern.
5. `TutorialHintOverlay.jsx` und zugehöriges CSS für Aktionsfortschritt beziehungsweise den einzigen Weiter-Schritt ergänzen.
6. `src/i18n/tutorial.js` um alle deutschen und englischen Texte erweitern.
7. Persistenz gemäß der gewählten Variante implementieren; bei Variante B den namespaced Pending-Key setzen/löschen.
8. Pause- und Tutorial-Regressionsprüfungen ergänzen.

## Files to Modify

- `src/App.jsx` — Tutorial-Einstiege, Zustandsmaschine, Run-Neustart, gemeinsame Pause und Persistenz.
- `src/ui/GameCanvas.jsx` — vollständige Simulationspause, Simulationszeit und aktionsbasierte Tutorial-Eingabeauswertung.
- `src/ui/TutorialOverlay.jsx` — Abbrechen sowie kontextabhängiger Start-/Neustart-Button.
- `src/ui/TutorialOverlay.css` — Layout des zweiten Buttons.
- `src/i18n/tutorial.js` — Hinweis-, Fortschritts-, Abbrechen- und Neustarttexte auf Deutsch und Englisch.
- `src/ui/TutorialHintOverlay.jsx` — kleine Hinweise und Haltefortschritt.
- `src/ui/TutorialHintOverlay.css` — responsive, Touch-Buttons nicht blockierende Darstellung.
- passende bestehende oder neue Tests unter `tests/`.

## Verification

- [ ] Menü öffnen, während Bullet und Mine sichtbar in Bewegung sind: Positionen und Kollisionen bleiben während beliebig vieler Frames unverändert.
- [ ] Nach Resume laufen alle Objekte ohne Delta-Sprung weiter; Gameplay-Fristen sind nicht während der Pause abgelaufen.
- [ ] Hinweis 1: kurzes Schilddrücken reicht nicht; Loslassen setzt zurück; 1 Sekunde ununterbrochen schließt den Hinweis ohne Button.
- [ ] Nach Schritt 1 vergehen genau 5 aktive Spielsekunden, bevor Schritt 2 erscheint; Menüzeit zählt nicht.
- [ ] Hinweis 2 besitzt als einziger einen Weiter-Button und führt ohne kurzen Simulationsframe direkt zu Hinweis 3.
- [ ] Hinweis 3: nur Traktor oder nur Schub reicht nicht; beide gleichzeitig schließen ihn nach kurzer Bestätigung.
- [ ] Hinweis 4 erscheint erst nach dem bestehenden Andock-Callback; kurzes Schubdrücken reicht nicht, 1 Sekunde beendet den geführten Modus.
- [ ] Während Aktionshinweisen bleiben die benötigten Canvas-Touch-Buttons bedienbar, aber Schiff, Bullets, Minen, Fuel und Timer stehen.
- [ ] „Abbrechen“ im großen Tutorial setzt einen laufenden Level unverändert fort; „Level 1 neu starten“ verwirft ihn und startet den geführten 1P-Lauf.
- [ ] Automatischer Erststart, Hauptmenü, Ingame-Hamburger und End-Overlay verwenden denselben Ablauf.
- [ ] Persistenzvariante gemäß Entscheidung mit Reload/Android-Prozessende prüfen.
- [ ] Portrait und Landscape auf Android prüfen.
- [ ] Relevante Vitest-Tests und `npm run build` ausführen.

## Risks/Considerations

- Das kleine Aktionsoverlay darf nicht als vollflächige klickfangende Ebene umgesetzt werden, sonst können Schild, Traktor und Schub den Schritt nicht abschließen.
- Die Simulation muss pausiert bleiben, obwohl Eingabestatus erfasst wird; Eingabeerkennung und Gameplay-Seiteneffekte dürfen nicht wieder vermischt werden.
- Eine echte Online-Multiplayer-Pause benötigt ein Netzwerkprotokoll und ist nicht Teil dieses lokalen 1P-Tutorials.
- Die Bestätigungsdauer für Schritt 3 sollte als benannte Konstante festgelegt und auf realen Geräten getestet werden; sie bleibt deutlich unter einer Sekunde.

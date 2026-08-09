# Plan für den Zeitbonus

## Ziel

Ein Levelabschluss erhält einen zusätzlichen Zeitbonus, wenn der Level besonders schnell geschafft wurde. Der Bonus ist ein eigener Score-Bestandteil und wird in der dauerhaften Score-Aufschlüsselung jedes Level- und Gesamt-Run-Eintrags gespeichert.

Die konkrete Balance wird erst nach einer Auswertung realer Laufzeiten festgelegt. Die technische Regel darf nicht von der Anzeige oder der Highscore-Persistenz dupliziert werden.

## 1. Verantwortlichkeiten

- `GameCanvas` oder eine zentrale Run-Zeitmessung liefert die verstrichene aktive Spielzeit.
- `App` übergibt die Zeit beim Levelabschluss an die Score-Berechnung.
- `ScoringSystem` berechnet aus der Zeit genau einen `timeBonus`-Wert.
- `HighScoreManager` speichert den berechneten Wert als Teil des unveränderlichen `scoreBreakdown`.

Die Persistenz des Zeitbonus gehört nicht in `GameCanvas`. Die Highscore-Struktur wird ausschließlich im Highscore-Plan definiert.

## 2. Zeitmessung

### 2.1 Start und Ende

Für jeden gestarteten Level wird ein eigener Level-Timer angelegt:

- Start beim tatsächlichen Beginn des spielbaren Levels.
- Ende beim erfolgreichen Levelabschluss.
- Bei Game Over wird kein Zeitbonus vergeben.
- Bei einem Neustart beginnt die Zeitmessung für den neu gestarteten Level erneut.

Die Zeit des aktuellen Levels und die Gesamtzeit des Runs werden getrennt geführt.

### 2.2 Nicht spielbare Zeit

Nicht spielbare Zeit darf den Spieler nicht benachteiligen. Deshalb werden mindestens folgende Zustände aus der aktiven Levelzeit ausgeschlossen:

- Pause,
- geöffnete Menüs,
- Tutorial-Overlay,
- Level-Complete-Overlay,
- Game-Over-Overlay,
- Ladezeit vor dem tatsächlichen Levelstart.

Die Zeitmessung muss bei Zustandswechseln sauber pausieren und fortsetzen. Die Quelle für diese Zustände wird vor der Implementierung festgelegt, damit nicht mehrere unabhängige Timer entstehen.

## 3. Bonusberechnung

### 3.1 Konfigurierbare Werte

Die Bonusberechnung verwendet zentrale, versionierte Konstanten:

- `timeBonusThreshold`: Zeitgrenze, ab der ein Bonus möglich ist.
- `timeBonusStep` oder eine kontinuierliche Formel für die Bonusstufen.
- `timeBonusMaximum`: maximale Bonuspunktzahl pro Level.
- `scoringVersion`: Version der Berechnungsregel.

Diese Werte werden nicht in UI-Komponenten oder Highscore-Code dupliziert.

### 3.2 Regel

Empfohlene Regel:

- Liegt die aktive Levelzeit über der Zeitgrenze, beträgt der `timeBonus` `0`.
- Je schneller der Level unter der Zeitgrenze abgeschlossen wird, desto höher ist der Bonus.
- Der Bonus ist niemals negativ.
- Der Bonus ist auf den konfigurierten Maximalwert begrenzt.
- Der finale Bonus wird beim Levelabschluss einmalig berechnet und danach nicht mehr verändert.

Die genaue Formel und die Startwerte werden als Balance-Entscheidung dokumentiert, bevor der Bonus veröffentlicht wird.

## 4. Integration in die Score-Aufschlüsselung

Der Zeitbonus wird als eigener Schlüssel geführt:

- `bunker`
- `fuel`
- `button`
- `pod`
- `level`
- `timeBonus`
- weitere künftig definierte Bonusarten

Der Level-Gesamt-Score ist die Summe der einzelnen Komponenten. Ein Gesamt-Run enthält zusätzlich die unveränderten Aufschlüsselungen der einzelnen Level, damit später nachvollziehbar bleibt, wie der Gesamt-Score entstanden ist.

Jeder gespeicherte Eintrag enthält außerdem:

- aktive Levelzeit,
- verwendete Bonusregel-Version,
- berechneten Zeitbonus,
- Zeitpunkt des Levelabschlusses.

## 5. Anzeige

Beim Levelabschluss werden mindestens angezeigt:

- aktive Levelzeit,
- Zeitbonus,
- übrige Score-Komponenten,
- Level-Gesamt-Score.

Im Game-Over- und Highscore-Bereich wird der gespeicherte Zeitbonus aus dem Eintrag angezeigt. Die Anzeige berechnet den Bonus nicht erneut aus der aktuellen Konfiguration.

## 6. Neustart und Game Over

- Ein erfolgreicher Levelabschluss speichert den Zeitbonus genau einmal.
- Ein Game Over speichert keinen Zeitbonus für den nicht geschafften Level.
- Ein Neustart verwirft den nicht abgeschlossenen Timer und erzeugt einen neuen Level-Timer.
- Ein bereits gespeicherter Levelabschluss bleibt unverändert, auch wenn später eine neue Balance-Version veröffentlicht wird.

Die Regeln für Gesamt-Run-Einträge, Level-Erfolg und fehlgeschlagene Versuche stehen im Dokument `Highscore-System.md`.

## 7. Tests

- Timer startet erst mit dem spielbaren Level.
- Timer pausiert und setzt korrekt fort.
- Pause-, Menü-, Tutorial- und Overlay-Zeit wird nicht gezählt.
- Game Over vergibt keinen Zeitbonus.
- Neustart beginnt mit einem neuen Timer.
- Bonus ist bei Überschreitung der Zeitgrenze null.
- Bonus steigt bei kürzerer Zeit.
- Bonus wird nicht negativ und überschreitet das Maximum nicht.
- Bonus wird genau einmal vergeben.
- `timeBonus` bleibt im gespeicherten `scoreBreakdown` erhalten.
- Alte Einträge behalten ihre ursprüngliche `scoringVersion`.

## 8. Veröffentlichung

Vor der Veröffentlichung müssen die Zeitgrenzen mit realen Spielzeiten geprüft werden. Erst danach darf der Zeitbonus im Play-Store-Listing als Feature genannt werden.

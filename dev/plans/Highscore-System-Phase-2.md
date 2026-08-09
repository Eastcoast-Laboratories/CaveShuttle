# Highscore-System – Phase 2: Online-Konten und Server-Synchronisierung

Dieses Dokument beschreibt ausschließlich die spätere Online-Erweiterung. Lokale Benutzernamen, Score-Einträge, Ranglistenregeln, Import/Export und die lokale Benutzeroberfläche werden ausschließlich in `Highscore-System.md` definiert.

## 1. Ziel und Grenzen

Cave Shuttle soll sich optional mit einem Benutzerkonto bei `community.caveshuttle.z11.de` verbinden können. Dafür wird das bereits unter `/var/www/roboyard.z11/` laufende Laravel-Backend wiederverwendet. Die Highscore-Phase 2 erfordert nur gezielte Ergänzungen für `caveshuttle`; der bestehende Roboyard-Betrieb bleibt unverändert.

- `roboyard` – bestehende App, bestehende API
- `caveshuttle` – neue App, Erweiterung der bestehenden API

Die Online-Funktion ist optional. Ohne Konto müssen das lokale Spiel und die in `Highscore-System.md` beschriebene lokale Highscore-Funktion unverändert funktionieren. Phase 2 ersetzt Phase 1 nicht, sondern ergänzt sie um Synchronisierung und serverseitige Funktionen.

## 2. Gefundene Laravel-API (Ist-Zustand)

Das Backend bietet bereits produktive Bauteile, die direkt genutzt werden können:

- Benutzerkonten mit API-Token-Authentifizierung (`users.api_token`, Bearer-Token-Prüfung in `MobileApiController`).
- Mobile Endpunkte unter `/mobile`:
  - `POST /mobile/login`, `/register`, `/verify-token`, `/logout`
  - `GET /mobile/profile`
  - `POST /mobile/maps`
  - `POST /mobile/achievements/sync`, `GET /mobile/achievements`
  - `POST /mobile/saves/sync`, `GET /mobile/saves`
  - `POST /mobile/history/sync`, `GET /mobile/history`
- `UserRegistrationService` mit Rate-Limiting über `registration_attempts`.
- `RankingService` / `RankingController`, die auf `user_achievement_stats` und `user_game_history` mit Roboyard-spezifischen Filtern aufbauen.
- Soft-Delete-Logik am `User`-Modell (`deleted_at`, `deleted_by_user`).
- Update-Hinweis über `config/roboyard.php` (`ROBOYARD_LATEST_APP_VERSION`).

Die bestehenden `/mobile/login`, `/register`, `/verify-token`, `/logout` und `/profile` Endpunkte können für Cave Shuttle unverändert verwendet werden. Die Endpunkte `history`, `saves` und `achievements` sowie `RankingService` sind auf Roboyard-Daten ausgelegt (`map_name`, `save_data`, `board_width`, `move_count`, `stars`, Hints, `achievement_id`) und eignen sich nicht direkt für Cave-Shuttle-Highscores.

## 3. Minimale Laravel-Änderungen

### 3.1 Neue Tabelle und Modell für Cave-Shuttle-Scores

Eine eigene Tabelle, z. B. `cave_shuttle_scores` (alternativ generisch `game_scores` mit `game_id`), speichert die Online-Records. Pflichtfelder:

- `user_id` (FK `users`, `onDelete('cascade')`)
- `game_id` (`caveshuttle`)
- `record_type` (`level` oder `run`)
- `run_id` (aus `RunContext`)
- `attempt_id` (für `LevelScoreRecord`, sonst `NULL`)
- `pack_id`
- `pack_version`
- `level` (optional, für Level-Ranglisten)
- `player_mode` (`single` oder `two`)
- `completed` (boolean)
- `score` (integer)
- `score_breakdown` (JSON, unveränderlich)
- `level_time_ms` (optional)
- `recorded_at` (UTC-Zeitstempel vom Client)
- `created_at` / `updated_at`
- `deleted_at` (nullable, Soft-Delete)

Indizes:

- Unique: `[user_id, game_id, record_type, run_id, attempt_id]` – idempotente Uploads
- Leaderboard: `[game_id, pack_version, player_mode, level, completed, score, recorded_at]`

Neues Eloquent-Modell `CaveShuttleScore` mit `user()`-Relation.

### 3.2 Neue API-Endpunkte

In `routes/api.php` innerhalb der bestehenden `/mobile` Gruppe ergänzen:

- `POST /mobile/caveshuttle/scores/sync` – Upload von `LevelScoreRecord` / `RunScoreRecord`
- `GET /mobile/caveshuttle/leaderboard` – öffentliche Rangliste
- `GET /mobile/caveshuttle/scores` – persönliche Scores
- `GET /mobile/caveshuttle/export` – persönlicher Datenexport
- `POST /mobile/caveshuttle/account/delete` – Kontolöschung inkl. Cave-Shuttle-Daten

Die bestehenden Login-/Register-/Token-Endpunkte bleiben unverändert.

### 3.3 Controller-Erweiterung

Neuer `CaveShuttleApiController` (oder Erweiterung von `MobileApiController`):

- Authentifizierung per `authenticateToken()` wiederverwenden.
- Validierung der `caveshuttle`-Payload.
- Idempotente Speicherung per `updateOrCreate()` mit `[user_id, run_id, attempt_id, record_type]`.
- Konflikterkennung bei abweichendem Inhalt.
- Leaderboard-Abfrage mit `completed = true`, Sortierung `score DESC, recorded_at ASC`.
- Datenexport und Konto-Löschung, die `cave_shuttle_scores` berücksichtigen.

### 3.4 Spielkonfiguration und Trennung

- `gameId` wird nicht in bestehende Roboyard-Tabellen eingeführt, sondern nur in der neuen Cave-Shuttle-Tabelle.
- Roboyard-Records bleiben unverändert; Cave-Shuttle-Records werden niemals mit Roboyard-Ranglisten gemischt.
- Eine einfache Whitelist erlaubter `pack_version` Werte für `caveshuttle` ist ausreichend.

## 4. Konto und Authentifizierung

Cave Shuttle verwendet die bestehenden Endpunkte:

- `POST /mobile/login` mit `identifier` + `password`
- `POST /mobile/register` mit `name`, `email`, `password`, `password_confirmation`
- `POST /mobile/verify-token`
- `POST /mobile/logout`
- `GET /mobile/profile`

Zusätzlich:

- `POST /mobile/caveshuttle/account/delete` löscht alle `cave_shuttle_scores` des Nutzers und markiert das Konto (`deleted_by_user = true`, `deleted_at = now()`), analog der bestehenden Soft-Delete-Logik.
- `GET /mobile/caveshuttle/export` liefert alle serverseitigen Cave-Shuttle-Daten als JSON.

## 5. API- und Synchronisationsvertrag

### 5.1 Anfrageformat

Jede Cave-Shuttle-Anfrage enthält `gameId: caveshuttle` im Header oder Body. Beispiel `scores/sync`:

```json
{
  "gameId": "caveshuttle",
  "scores": [
    {
      "recordType": "level",
      "runId": "...",
      "attemptId": "...",
      "packId": "...",
      "packVersion": "...",
      "level": 3,
      "playerMode": "single",
      "completed": true,
      "score": 12345,
      "scoreBreakdown": {
        "bunker": 1000,
        "fuel": 500,
        "button": 200,
        "pod": 1000,
        "timeBonus": 50,
        "level": 10495
      },
      "levelTimeMs": 45000,
      "recordedAt": "2026-07-29T12:34:56Z"
    }
  ]
}
```

### 5.2 Upload- und Konfliktregeln

- Idempotenz über `user_id + runId + attemptId + recordType`.
- Gleicher Schlüssel und identische Daten: `skipped`.
- Gleicher Schlüssel mit abweichenden Daten: `conflict`. Der Server antwortet mit dem gespeicherten Record; der Client muss explizit entscheiden. Keine stillen Überschreibungen.
- Neuer Schlüssel: `created`.
- Jede Antwort enthält `synced`, `skipped`, `conflicts` und `details` mit eindeutigen Diagnose-Tags.

### 5.3 Ranglisten

- Öffentliche Rangliste nur für `completed = true`.
- Sortierung: `score DESC`, dann `recorded_at ASC` (bei Gleichstand älterer zuerst).
- Top 10 pro `pack_version` × `level` × `player_mode` und pro `pack_version` × `player_mode` für Runs.
- Persönliche Ranglisten enthalten alle eigenen Records.

## 6. Vertrauensmodell der Online-Ranglisten

Die Scores entstehen im Client. Der Server akzeptiert und speichert sie, behandelt sie aber nicht als manipulationssicher, solange keine zusätzliche Validierung implementiert ist.

Vor der Freischaltung öffentlicher Ranglisten muss eine verbindliche Strategie gewählt werden:

- serverseitige Score-Validierung,
- signierter Run mit Replay- oder Ereignisdaten,
- Einschränkung auf validierbare Spielmodi,
- oder klare Kennzeichnung als nicht manipulationssichere Rangliste.

Bis zu dieser Entscheidung darf die Online-Rangliste nicht als fälschungssicher beworben werden.

## 7. Level-Packs und Versionen auf dem Server

- Pack- und Score-Regeln aus `Highscore-System.md` bleiben verbindlich.
- `packVersion` wird unveränderlich in jedem Record gespeichert.
- Eine neue Version erzeugt einen neuen Ranglisten-Raum.
- Nicht mehr unterstützte Packs bleiben historisch referenzierbar.
- Der Server führt eine Whitelist erlaubter `pack_version` Werte für `caveshuttle`.

## 8. Datenschutz und Play Store

Neue Datenflüsse:

- Konto (Name, E-Mail, Passwort-Hash, API-Token)
- Geräte-/App-Metadaten (`install_source`, optional `X-Device-ID`)
- Cave-Shuttle-Scores (`score`, `scoreBreakdown`, `recordedAt`, Spielmodus, Pack)
- Ranglisten (öffentliche `name` + `score`)
- Server-Logs (keine unnötigen personenbezogenen Daten)

Zu aktualisieren:

- öffentliche Datenschutzerklärung auf `community.caveshuttle.z11.de`,
- Speicherdauer und Empfänger,
- Datenexport und Kontolöschung,
- Play-Console-Data-Safety-Formular,
- Play-Store-Beschreibung für Konto und Online-Highscores.

Online-Funktionen dürfen erst nach Test, Löschung, Export und Datenschutzprüfung beworben werden.

## 9. Umsetzung und Rollout

1. Migration `create_cave_shuttle_scores_table` mit Indizes.
2. `CaveShuttleScore` Modell und `User`-Relation ergänzen.
3. Neue `/mobile/caveshuttle/*` Routen in `routes/api.php` eintragen.
4. `CaveShuttleApiController` mit `scores/sync`, `leaderboard`, `scores`, `export`, `account/delete` implementieren.
5. Bestehende Login-/Register-/Token-Endpunkte unverändert belassen.
6. Tests für Auth, idempotente Uploads, Konflikte, Leaderboard, Datentrennung, Export, Löschung.
7. Datenschutz, Data Safety und Play-Store-Texte anpassen.
8. Staging auf `community.caveshuttle.z11.de` testen.
9. Schrittweise Freigabe mit Monitoring.

## 10. Tests und Betrieb

- Authentifizierung und Token-Ablauf
- idempotente Uploads und Konflikterkennung
- strikte Trennung `roboyard` ↔ `caveshuttle`
- Leaderboard-Sortierung und Gleichstände
- persönliche vs. öffentliche Ranglisten
- Rate-Limiting an `register` und Score-Sync
- Datenexport-Vollständigkeit
- Konto-Löschung inklusive `cave_shuttle_scores`
- Server-Logs ohne unnötige personenbezogene Daten
- Monitoring auf API-Fehler und Diagnose-Tags

## 11. Abschlusskriterium

Phase 2 ist abgeschlossen, wenn:

- die optionale Online-Funktion für Cave Shuttle produktiv funktioniert,
- lokale Nutzung ohne Konto unverändert möglich ist,
- die Server-Ranglisten fachlich und technisch abgesichert sind,
- Datenschutz- und Play-Store-Angaben alle neuen Datenflüsse abbilden,
- die Roboyard-API unverändert weiterläuft.

# Cave Shuttle Community-Website: offene Punkte

Was auf `community.caveshuttle.z11.de` (`/var/www/community.caveshuttle.de`)
noch zu tun ist. Abgeschlossene Teile (Score-Sync, Auto-Login, White-Labeling, Set Password/Email) sind entfernt.

---

## 1. Level-Packs: teilen, ansehen, bewerten, herunterladen

### Problem

Cave Shuttle teilt **Level-Packs** (`{ meta, levels }`), keine einzelnen
Roboyard-Maps.
- Die Roboyard-Website zeigt
  - Map votes
  - Map comments
  - "All/Popular/Recent Maps" und "Import DriftingDroids Map".
- Cave Shuttle braucht:
  - Pack-Upload
  - Pack-Listing
  - Pack-Voting
  - Pack-Download
  - Pack-Kommentare

### Datenmodell

Neue Tabelle `cave_shuttle_packs`:

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | big int (PK) | interne ID |
| `user_id` | FK `users`, `onDelete('cascade')` | Ersteller |
| `pack_id` | string, unique | z. B. `author-name-v1`, aus `meta.id` |
| `name` | string | Anzeigename (`meta.name`) |
| `version` | string | Pack-Version (`meta.version`) |
| `description` | text, nullable | optionale Beschreibung |
| `level_count` | int | Anzahl Levels |
| `pack_data` | longtext (JSON) | vollständiges Pack-JSON (`{meta, levels}`) |
| `download_count` | int, default 0 | Anzahl Downloads |
| `deleted_at` | timestamp, nullable | Soft-Delete |
| `created_at` / `updated_at` | timestamps | - |

Bewertungen: polymorphe Tabelle `ratings` mit `user_id`, `votable_id`,
`votable_type`, `difficulty_rating`, `deleted_at`, Timestamps.
`Ratable`-Trait stellt `averageDifficulty()`, `totalRatings()`, `userRating()`
bereit.

`CaveShuttlePack`-Modell: `user()`-Relation, `Ratable`-Trait,
`levels()`-Accessor (dekodiert `pack_data['levels']`), `scopePopular()`,
`scopeRecent()`.

### Backend

- `app/Models/CaveShuttlePack.php` (neu)
- `app/Http/Controllers/CaveShuttlePackController.php` (neu):
  `index()`, `show()`, `create()`/`store()`, `download()`, `destroy()`
- `app/Http/Controllers/CaveShuttleApiController.php` erweitern um:
  `sharePack()`, `packs()`, `downloadPack()`
- `app/Services/PackService.php` (neu): Validierung, Duplikatprüfung,
  `level_count`-Berechnung
- `app/Traits/Ratable.php` + `app/Http/Controllers/RatingController.php`
  (neu): `POST /difficulty/rate`

### Routen

```php
// web.php
Route::get('/packs', [CaveShuttlePackController::class, 'index'])->name('packs.index');
Route::get('/packs/create', [CaveShuttlePackController::class, 'create'])->name('packs.create')->middleware('auth');
Route::post('/packs', [CaveShuttlePackController::class, 'store'])->name('packs.store')->middleware('auth');
Route::get('/packs/{pack}', [CaveShuttlePackController::class, 'show'])->name('packs.show');
Route::get('/packs/{pack}/download', [CaveShuttlePackController::class, 'download'])->name('packs.download');
Route::delete('/packs/{pack}', [CaveShuttlePackController::class, 'destroy'])->name('packs.destroy')->middleware('auth');
Route::post('/difficulty/rate', [RatingController::class, 'store'])->name('difficulty.rate')->middleware('auth');

// api.php (Erweiterung mobile/caveshuttle)
Route::post('/packs/share', [CaveShuttleApiController::class, 'sharePack']);
Route::get('/packs', [CaveShuttleApiController::class, 'packs']);
Route::get('/packs/{pack}/download', [CaveShuttleApiController::class, 'downloadPack']);
```

### Upload-Validierung (`PackService`)

- JSON muss `meta.id`, `meta.name`, `meta.version`, `levels` (min 1) enthalten
- `meta.id` darf nicht reserviert sein (`default`, `classic`), muss eindeutig sein
- Re-Upload mit gleicher `pack_id`, neuer `version` → eigener
  Versionshistorie-Datensatz (kein Update des bestehenden)
- Max 2 MB, max 100 Levels
- Rate-Limiting `throttle:10,60` pro Nutzer

### Website-Navigation

In `layouts/app.blade.php` (Cave Shuttle-Modus):
- "All Maps" → "All Packs" (`packs.index`)
- "Popular Maps" → "Popular Packs" (`packs.index?sort=popular`)
- "Recent Maps" → "Recent Packs" (`packs.index?sort=recent`)
- "Import DriftingDroids Map" → "Upload Pack" (`packs.create`)

### Editor-Integration (CaveShuttle-Repo)

- "Share to Web"-Button sendet `POST /api/mobile/caveshuttle/packs/share`
  mit App-Account-Token
- Erfolgsantwort: `pack_id`, `share_url`, `download_url`
- Hamburger-Menü "Online Packs" ruft `GET /api/mobile/caveshuttle/packs` ab
  und importiert über `parseImportedPackFile` + `registerCustomPack`

### Kommentare

`Comment`-Modell ist an `Map` gebunden. Pack-Kommentare brauchen eine
polymorphe Erweiterung (analog `Ratable`).

---

## 2. Web-Rankings: pro pack_version × level × player_mode

### Problem

`RankingController`/`RankingService` sind Roboyard-spezifisch
(Achievements, levels_played_count, etc.). Cave Shuttle hat
`cave_shuttle_scores` mit anderen Spalten (pack_id, level, player_mode,
score, score_breakdown, level_time_ms).

### Ziel

- Rankings ausschließlich pro `pack_version` × `level` × `player_mode`
  (wie mobile Rangliste). Ein globales Ranking über verschiedene Packs
  macht keinen Sinn, da Level unterschiedlich sind.
- `RankingService` bekommt Systemschalter, kein separater Controller (DRY).
- Default pro Checkout via `APP_RANKING_SYSTEM` in `.env`.

### Umsetzung

1. `config/caveshuttle.php`: `default_ranking_system` ergänzen
2. `RankingService`: `buildCaveShuttleRankingsQuery()`,
   `getCaveShuttleRankings()`, `getRankings()`-Fassade
3. `RankingController::index()` um `$system`-Auflösung erweitern
4. `rankings/index.blade.php`: Spalten-Umschaltblock + System-Tab
5. Feature-Tests: Regression für `system=roboyard`, korrekte Daten für
   `system=caveshuttle`
6. Admin-Bereich: sicherstellen dass Admin-Ansichten denselben
   Systemschalter nutzen

---

## 3. Vertrauensmodell / Anti-Cheat

Scores entstehen im Client, Server speichert unvalidiert. Vor öffentlicher
Rangliste muss Strategie gewählt werden:

- Serverseitige Score-Validierung (Plausibilitätsgrenzen aus `score_breakdown`)
- Signierter Run mit Replay-Daten
- Oder Kennzeichnung als nicht manipulationssicher (kurzfristig einfachste
  Option, Hinweistext auf `/rankings` und im mobilen Leaderboard)

---

## 4. Datenschutz und Play Store

Zu aktualisieren sobald Packs und Rankings live sind:

- Datenschutzerklärung: Konto-Scores, Pack-Uploads, Ranking-Score-Breakdowns
- Speicherdauer, Empfänger, Datenexport (`export` um Packs erweitern),
  Kontolöschung (`account/delete` um `cave_shuttle_packs` erweitern)
- Play-Console-Data-Safety-Formular und Play-Store-Beschreibung
- Platzhalter-E-Mails (`@device.caveshuttle.local`) dürfen nie Mailversand
  auslösen

---

## 5. Rate-Limiting und Staging

- Rate-Limiting-Tests für `scores/sync` fehlen noch
- Rate-Limiting für Pack-Upload-Routen von Anfang an mittesten
- Audit der Server-Logs auf personenbezogene Daten bei neuen Log-Zeilen
- Staging-Test auf `community.caveshuttle.z11.de` + gestufte Freigabe
  für Packs und Rankings gemeinsam

---

## 6. Umsetzungsreihenfolge

1. **Packs-Backend**: Migration, Modell, `PackService`, Controller,
   API-Erweiterung, Validierung, Tests
2. **Packs-Frontend**: Navigation und Startseite auf "Packs" umstellen
3. **Editor-Integration**: "Share to Web", "Online Packs" im Spiel
4. **Rankings-Umschalter Backend**: `RankingService`-Erweiterung, Config
5. **Rankings-Umschalter Frontend**: Controller + View
6. **Vertrauensmodell entscheiden** — spätestens bevor Rankings öffentlich
7. **Rate-Limiting nachrüsten** für Pack-Upload und Score-Sync
8. **Datenschutz-/Play-Store-Texte** aktualisieren
9. **Staging-Test + gestufte Freigabe**
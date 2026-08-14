# Cave Shuttle Community-Website: offene Punkte

Sammel-Konzept für alles, was auf `community.caveshuttle.z11.de` (Checkout
`/var/www/community.caveshuttle.de`) noch von der 1:1-Roboyard-Kopie auf
Cave Shuttle umgestellt werden muss. Ersetzt den zu eng benannten Entwurf
"Community-Level-Pack-Sharing.md" (dieser Inhalt ist hier unter Abschnitt 2
vollständig aufgegangen).

Ausgangslage: `community.caveshuttle.de` ist eine `cp -a`-Kopie des
Roboyard-Laravel-Backends mit eigener, isolierter MySQL-Datenbank
(`caveshuttle-mysql`, siehe `dev/PROJECT_SEPARATION.md`). Die Website-UI
und einige Backend-Services sind aber noch komplett Roboyard-spezifisch und
passen fachlich nicht zu Cave Shuttle. Es existiert bereits:

- `CaveShuttleApiController` (Score-Sync, mobiles Leaderboard, Export,
  Account-Löschung) auf Tabelle `cave_shuttle_scores`
  (`app/Models/CaveShuttleScore.php`).
- Backend-White-Labeling über `config('app.name')`,
  `config('app.deeplink_scheme')`, `config('app.github_url')`,
  `config('app.play_store_url')`.

Offene Themen: (1) Level-Pack-Sharing statt Roboyard-Maps, (2) Web-Rankings
mit Umschalter Roboyard/Cave-Shuttle statt hartcodierter Roboyard-Achievement-
Logik, (3) weitere kleinere Aufräumarbeiten (Abschnitt 4).

---

## 0. Bezug zum ehemaligen `Highscore-System-Phase-2.md`

`Highscore-System-Phase-2.md` hat ursprünglich den **Score-Sync-Backend-
Teil** spezifiziert. Dieser Teil ist inzwischen umgesetzt; das Dokument
wurde gelöscht, da sein gesamter Inhalt hier aufgegangen ist (dieser
Abschnitt für den Status, Abschnitt 4.1-4.3 für die daraus noch offenen
Punkte). Dieses Dokument setzt dort an, wo Phase-2 aufhört (Packs,
Rankings). Statusabgleich Phase-2 → Ist-Zustand:

| Phase-2-Abschnitt | Inhalt | Status |
|---|---|---|
| §3.1 Tabelle/Modell | `cave_shuttle_scores`, `CaveShuttleScore` | ✅ erledigt |
| §3.2 API-Endpunkte | `scores/sync`, `leaderboard`, `scores`, `export`, `account/delete` | ✅ erledigt |
| §3.3 Controller | `CaveShuttleApiController`, idempotente Uploads, Konflikterkennung | ✅ erledigt |
| §3.4 Trennung | eigene Tabelle, `pack_version`-Whitelist (`config/caveshuttle.php`) | ✅ erledigt |
| §4 Konto/Auth | Login/Register/Token wiederverwendet — jetzt pro Checkout in eigener isolierter DB (stärkere Trennung als ursprünglich geplant, siehe `dev/PROJECT_SEPARATION.md`) | ✅ erledigt (verändert: keine geteilten Accounts mehr zwischen Roboyard/Cave Shuttle) |
| §5 API-Vertrag | Request-/Response-Format, Sync-Semantik (`created`/`skipped`/`conflict`) | ✅ erledigt, inkl. Tests (`tests/Feature/CaveShuttleApiTest.php`) |
| §6 Vertrauensmodell | Serverseitige Score-Validierung/Anti-Cheat-Strategie | ⏳ **offen** — siehe Abschnitt 4.1 |
| §7 Level-Packs/Versionen | `packVersion`-Whitelist | ✅ erledigt (Whitelist); Pack-Speicherung/-Sharing selbst noch offen → Abschnitt 2 |
| §8 Datenschutz/Play Store | Datenschutzerklärung, Data-Safety-Formular, Play-Store-Texte | ⏳ **offen** — siehe Abschnitt 4.2 |
| §9 Rollout Schritte 1-6 | Migration, Modell, Routen, Controller, Tests | ✅ erledigt |
| §9 Rollout Schritte 7-9 | Datenschutztexte, Staging-Test, gestufte Freigabe | ⏳ **offen** — siehe Abschnitt 4.2/4.3 |
| §10 Tests | Auth, Idempotenz, Konflikte, Trennung, Leaderboard, Export, Löschung | ✅ erledigt; Rate-Limiting-Tests fehlen noch |
| §11 Abschlusskriterium | vollständig erst nach §6 + §8 | ⏳ **offen** |

Die offenen Phase-2-Punkte (§6, §8, Rate-Limiting, Staging/Rollout) sind in
Abschnitt 4 dieses Dokuments aufgenommen, damit sie nicht zwischen den zwei
Dokumenten verloren gehen.

---

## 1. Ziel

Auf `community.caveshuttle.de` sollen Nutzer:

1. Level-Packs (nicht einzelne Maps) ansehen, hochladen, bewerten und
   herunterladen (Abschnitt 2).
2. Eine Rangliste sehen, die zur jeweils aktiven Datenquelle passt — mit
   Cave-Shuttle-typischen Zusatzdaten pro Eintrag (Pack, Level, Modus,
   Score-Breakdown, Zeit) statt der Roboyard-Achievement-Spalten
   (Abschnitt 3).
3. Eine Website vorfinden, die überall generisch auf "Cave Shuttle" statt
   "Roboyard" verweist (bereits größtenteils erledigt, siehe Commit
   `refactor: make backend white-label for multi-app reuse` in
   `community.caveshuttle.de`).

Die bestehende Roboyard-Funktionalität auf `roboyard.z11` bleibt in allen
Punkten unverändert (siehe `dev/PROJECT_SEPARATION.md`, "Adding a new
Cave-Shuttle-only feature"). Wo Controller/Services wiederverwendet werden,
geschieht das über einen **Umschalter (welches System aktiv ist)**, nicht
durch Ändern des bestehenden Roboyard-Verhaltens.

---

## 2. Level-Packs statt Roboyard-"Maps"

### 2.1 Problem

Cave Shuttle hat kein Äquivalent zu einzelnen Roboyard-"Maps"
(`map_string` im DriftingDroids-Format). Geteilt werden **Level-Packs**
(`{ meta, levels }`, mehrere Levels im `.def`-Format, siehe
`Editor-Pack-Sharing.md` §3). Die aktuelle Navigation
(`resources/views/layouts/app.blade.php`, `resources/views/index.blade.php`)
zeigt aber "All/Popular/Recent Maps" und "Import DriftingDroids Map".

### 2.2 Datenmodell (in `community.caveshuttle.de`, eigene isolierte DB)

Neue Tabelle `cave_shuttle_packs`:

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | big int (PK) | interne ID |
| `user_id` | FK `users`, `onDelete('cascade')` | Ersteller |
| `pack_id` | string, unique | z. B. `author-name-v1`, aus `meta.id` |
| `name` | string | Anzeigename (`meta.name`) |
| `version` | string | Pack-Version (`meta.version`) |
| `description` | text, nullable | optionale Beschreibung |
| `level_count` | int | Anzahl Levels, aus `levels` abgeleitet |
| `pack_data` | longtext (JSON) | vollständiges Pack-JSON (`{meta, levels}`) |
| `preview_data` | text, nullable | optionale Vorschau |
| `download_count` | int, default 0 | Anzahl Downloads |
| `deleted_at` | timestamp, nullable | Soft-Delete |
| `created_at` / `updated_at` | timestamps | - |

Bewertungen: neue polymorphe Tabelle `ratings` (analog
`Editor-Pack-Sharing.md` §5.3, Option A) mit `user_id`, `votable_id`,
`votable_type` (hier `App\Models\CaveShuttlePack`), `difficulty_rating`,
`deleted_at`, Timestamps. `Ratable`-Trait (`app/Traits/Ratable.php`) stellt
`averageDifficulty()`, `totalRatings()`, `userRating()` bereit — dasselbe
Partial kann später für Roboyard-Maps wiederverwendet werden, falls
gewünscht.

`CaveShuttlePack`-Modell: `user()`-Relation, `Ratable`-Trait,
`levels()`-Accessor (dekodiert `pack_data['levels']`), `scopePopular()`,
`scopeRecent()`.

### 2.3 Backend-Komponenten

- `app/Models/CaveShuttlePack.php` (neu)
- `app/Http/Controllers/CaveShuttlePackController.php` (neu, Web):
  `index()` (Sortierung `?sort=popular|recent`), `show()`, `create()`/
  `store()` (Upload-Formular), `download()`, `destroy()` (Soft-Delete).
- `app/Http/Controllers/CaveShuttleApiController.php` erweitern um:
  `sharePack()` (Editor-Upload per Token), `packs()` (Liste fürs
  Hamburger-Menü im Spiel), `downloadPack()`.
- `app/Services/PackService.php` (neu): Validierung des Pack-JSON-Schemas
  (Abschnitt 2.5), Duplikat-/reserved-ID-Prüfung, `level_count`-Berechnung.
- `app/Traits/Ratable.php` + `app/Http/Controllers/RatingController.php`
  (neu): `POST /difficulty/rate` mit `votable_type`/`votable_id`. Das
  bestehende `Vote`/`VoteController`-System auf `roboyard.z11` bleibt
  unangetastet.

### 2.4 Routen

`routes/web.php` (nur `community.caveshuttle.de`):

```php
Route::get('/packs', [CaveShuttlePackController::class, 'index'])->name('packs.index');
Route::get('/packs/create', [CaveShuttlePackController::class, 'create'])->name('packs.create')->middleware('auth');
Route::post('/packs', [CaveShuttlePackController::class, 'store'])->name('packs.store')->middleware('auth');
Route::get('/packs/{pack}', [CaveShuttlePackController::class, 'show'])->name('packs.show');
Route::get('/packs/{pack}/download', [CaveShuttlePackController::class, 'download'])->name('packs.download');
Route::delete('/packs/{pack}', [CaveShuttlePackController::class, 'destroy'])->name('packs.destroy')->middleware('auth');
Route::post('/difficulty/rate', [RatingController::class, 'store'])->name('difficulty.rate')->middleware('auth');
```

`routes/api.php` (Erweiterung der bestehenden `mobile/caveshuttle`-Gruppe):

```php
Route::prefix('caveshuttle')->group(function () {
    // ... bestehende Score-Routen ...
    Route::post('/packs/share', [CaveShuttleApiController::class, 'sharePack'])->name('api.mobile.caveshuttle.packs.share');
    Route::get('/packs', [CaveShuttleApiController::class, 'packs'])->name('api.mobile.caveshuttle.packs.index');
    Route::get('/packs/{pack}/download', [CaveShuttleApiController::class, 'downloadPack'])->name('api.mobile.caveshuttle.packs.download');
});
```

### 2.5 Upload-Validierung (Web und API identisch, in `PackService`)

- JSON muss `meta.id`, `meta.name`, `meta.version`, `levels` (Objekt,
  mindestens 1 Eintrag) enthalten.
- `meta.id` darf keine reservierten Built-in-IDs sein (`default`, `classic`)
  und muss serverseitig eindeutig sein; Kollision durch denselben Nutzer →
  Update (neue Version), durch anderen Nutzer → Fehler.
- Jeder `levels`-Eintrag: nicht-leerer String im `.def`-Format, grobe
  Strukturprüfung (Header-Zeilen vorhanden).
- Maximale Pack-Größe (z. B. 2 MB) und maximale Level-Anzahl (z. B. 100).
- Web-Upload über Session (`auth`-Middleware), API-Upload über Bearer-Token
  (`authenticateToken()`, wie `CaveShuttleApiController::syncScores`).
- Rate-Limiting (`throttle:10,60` pro Nutzer).

### 2.6 Website-Navigation

In `layouts/app.blade.php`:

- "All Maps" → **"All Packs"** (`packs.index`)
- "Popular Maps" → **"Popular Packs"** (`packs.index?sort=popular`)
- "Recent Maps" → **"Recent Packs"** (`packs.index?sort=recent`)
- "Import DriftingDroids Map" → **"Upload Pack"** (`packs.create`)

`index.blade.php` zeigt "Recent Packs" (`x-pack-card`, analog `x-map-card`)
statt "Recent Maps"; der "Rankings"-Block bleibt (siehe Abschnitt 3).

### 2.7 Editor-Integration (Cave-Shuttle-Repo)

Ergänzt `Editor-Pack-Sharing.md` §5.5:

- "Share to Web"-Button sendet `POST /api/mobile/caveshuttle/packs/share`
  mit dem App-Account-Token.
- Erfolgsantwort: `pack_id`, `share_url` (`packs.show`), `download_url`.
- Spiel-Hamburger-Menü "Online Packs" ruft `GET /api/mobile/caveshuttle/packs`
  ab und importiert über den bestehenden `parseImportedPackFile` +
  `registerCustomPack`-Pfad.

---

## 3. Web-Rankings: Umschalter Roboyard ↔ Cave Shuttle

### 3.1 Problem

`RankingController` + `RankingService` (`/rankings`) sind komplett auf
Roboyard zugeschnitten:

- Datenquelle: `users`, `user_achievement_stats`, `user_game_history`
  (Achievements, `achievement_points`, `levels_played_count`,
  `total_games_solved`, Sprache/App-/Android-Version).
- Sortierbare Spalten (`RankingService::getUserRankings` Default-Liste):
  `name, achievements_count, levels_played_count, total_games_solved,
  achievement_points, longest_streak, created_at`.

Cave Shuttle hat dagegen `cave_shuttle_scores`
(`app/Models/CaveShuttleScore.php`) mit **deutlich mehr Daten pro
Ranking-Eintrag**: `pack_id`, `pack_version`, `level`, `player_mode`
(`single`/`two`), `record_type` (`level`/`run`), `completed`, `score`,
`score_breakdown` (JSON: `bunker`, `fuel`, `button`, `pod`, `timeBonus`,
`level`), `level_time_ms`, `recorded_at`. Die bestehende mobile
`CaveShuttleApiController::leaderboard()`-Methode nutzt das bereits für die
In-App-Rangliste, aber die **Website-Rangliste** (`/rankings`) kennt das
Format nicht.

### 3.2 Ziel

`RankingController`/`RankingService` bleiben die gemeinsame Basis (DRY,
kein Duplikat-Controller), bekommen aber einen **Systemschalter**, der
bestimmt, welche Datenquelle/Spalten für `/rankings` verwendet werden:

- `?system=roboyard` (Standard auf `roboyard.z11`) → heutiges Verhalten,
  unverändert.
- `?system=caveshuttle` (Standard auf `community.caveshuttle.de`, sobald
  Packs/Scores live sind) → Rangliste aus `cave_shuttle_scores` mit den
  zusätzlichen Spalten.

Der Default pro Checkout kommt aus einer neuen Config, z. B.
`config('caveshuttle.default_ranking_system')`, gesetzt via
`APP_RANKING_SYSTEM` in `.env` (`roboyard` bzw. `caveshuttle`), damit kein
Code-Unterschied zwischen den Checkouts nötig ist — nur Konfiguration.

### 3.3 `RankingService`-Erweiterung

- Bestehende Methode `buildUserRankingsQuery()` /
  `getUserRankings(...)` bleibt für `system=roboyard` unverändert (keine
  Breaking Changes für `roboyard.z11`).
- Neue Methoden, parallel dazu:
  - `buildCaveShuttleRankingsQuery(array $filters = [])` — aggregiert pro
    Nutzer aus `cave_shuttle_scores` (`completed = true`): `best_score`
    (MAX), `total_completed`, `distinct_packs_count`, letzte `recorded_at`.
    Filter analog zu Roboyard: `packVersion`, `playerMode`, `level`
    (optional, für Level-spezifische statt Gesamt-Ranglisten).
  - `getCaveShuttleRankings(string $sortBy, string $sortDir, int $perPage,
    array $filters)` — analoge Signatur zu `getUserRankings()`, eigene
    erlaubte Sortierspalten: `best_score, total_completed,
    distinct_packs_count, name, recorded_at`.
  - Öffentliche Fassade `getRankings(string $system, ...)`, die intern an
    `getUserRankings()` oder `getCaveShuttleRankings()` delegiert — das ist
    die einzige neue "Umschalter"-Methode, die `RankingController` aufruft.

### 3.4 `RankingController`-Erweiterung

```php
public function index(Request $request)
{
    $system = in_array($request->get('system'), ['roboyard', 'caveshuttle'])
        ? $request->get('system')
        : config('caveshuttle.default_ranking_system', 'roboyard');

    // bestehende Parameter-Auswertung (sort, dir, per_page, Sprachfilter)
    // bleibt für system=roboyard unverändert; für system=caveshuttle werden
    // stattdessen packVersion/playerMode/level als Filter ausgewertet.

    $rankings = $this->rankingService->getRankings($system, ...);

    return view('rankings.index', compact('rankings', 'system', ...));
}
```

- View `rankings/index.blade.php` bekommt ein `@if($system === 'caveshuttle')`
  Umschaltblock für die Tabellenspalten:
  - Roboyard-Spalten (unverändert): Achievements, Levels Played, Games
    Solved, Achievement Points, Longest Streak.
  - Cave-Shuttle-Spalten (neu): Pack, Level, Mode, Score, Score-Breakdown
    (aufklappbar: Bunker/Fuel/Button/Pod/Time-Bonus), Zeit, Completed-Datum.
- Ein sichtbarer Umschalter (Tabs oder Dropdown "Roboyard / Cave Shuttle")
  im View, nur sichtbar/nutzbar wenn beide Datenquellen tatsächlich Daten
  haben (z. B. `caveshuttle`-Tab ausblenden, solange `cave_shuttle_scores`
  leer ist).

### 3.5 Warum kein separater Controller

- DRY: Pagination, Sprach-/Versions-Filter-UI-Bausteine, Such-/Sortier-
  Query-String-Handling sind bereits in `RankingController`/
  `rankings/index.blade.php` vorhanden und für beide Systeme identisch
  nutzbar (nur die Spaltenliste und die Datenquelle unterscheiden sich).
- Ein Systemschalter statt zweier Controller verhindert Code-Duplikation
  bei künftigen Änderungen an Pagination/Filter-UI.
- Bestehendes Roboyard-Verhalten bleibt per Default (`system=roboyard`)
  und expliziter Query-Parameter vollständig unverändert; keine Regression
  auf `roboyard.z11`.

### 3.6 Umsetzungsschritte

1. `config/caveshuttle.php`: `default_ranking_system` aus `APP_RANKING_SYSTEM`
   ergänzen (`.env.example` dokumentieren, Default `roboyard` für
   Rückwärtskompatibilität, `.env` von `community.caveshuttle.de` auf
   `caveshuttle` setzen sobald Abschnitt 2 + Scores produktiv sind).
2. `RankingService`: `buildCaveShuttleRankingsQuery()`,
   `getCaveShuttleRankings()`, `getRankings()`-Fassade ergänzen (keine
   Änderung an bestehenden Roboyard-Methoden).
3. `RankingController::index()` um `$system`-Auflösung erweitern.
4. `rankings/index.blade.php`: Spalten-Umschaltblock + sichtbarer System-Tab.
5. Feature-Tests: `system=roboyard` liefert identisches Ergebnis wie vorher
   (Regression), `system=caveshuttle` liefert korrekt aggregierte
   `cave_shuttle_scores`-Daten, ungültiger `system`-Wert fällt auf Default
   zurück.

---

## 4. Weitere offene Punkte (inkl. offener Phase-2-Punkte)

### 4.1 Vertrauensmodell / Anti-Cheat (offen aus Phase-2 §6)

Scores entstehen im Client; der Server speichert sie unvalidiert. Vor
Freischaltung einer öffentlichen Rangliste (egal ob mobiles Leaderboard
oder Web-Rankings aus Abschnitt 3) muss eine Strategie gewählt werden:

- serverseitige Score-Validierung (z. B. Plausibilitätsgrenzen aus
  `score_breakdown`-Summen),
- signierter Run mit Replay-/Ereignisdaten,
- Einschränkung auf validierbare Spielmodi,
- oder klare Kennzeichnung als nicht manipulationssichere Rangliste (kurzfristig
  einfachste Option, per Hinweistext auf `/rankings` und im mobilen Leaderboard).

Bis zur Entscheidung darf keine Rangliste als fälschungssicher beworben werden.

### 4.2 Datenschutz und Play Store (offen aus Phase-2 §8, erweitert um Packs/Rankings)

Zu aktualisieren, sobald Abschnitt 2 (Packs) und Abschnitt 3 (Rankings)
produktiv sind:

- Datenschutzerklärung auf `community.caveshuttle.z11.de`: Konto-Scores
  (bereits Phase-2), zusätzlich Pack-Uploads (Name, Inhalt, Autor-Zuordnung)
  und öffentliche Ranking-Score-Breakdowns.
- Speicherdauer, Empfänger, Datenexport (`export`-Endpunkt um Packs
  erweitern), Kontolöschung (`account/delete` um `cave_shuttle_packs`
  erweitern).
- Play-Console-Data-Safety-Formular und Play-Store-Beschreibung: Konto,
  Online-Highscores, nutzergenerierte Packs, Online-Galerie.

### 4.3 Rate-Limiting und Staging-Rollout (offen aus Phase-2 §9/§10)

- Rate-Limiting-Tests für `scores/sync` fehlen noch (nur die Route ist
  vorbereitet, Middleware/Tests noch nicht ergänzt).
- Rate-Limiting für die neuen Pack-Upload-Routen (Abschnitt 2.5) muss von
  Anfang an mitgetestet werden, nicht nachträglich.
- Aus Phase-2 §10 noch offen: Audit der Server-Logs
  (`Log::info`/`Log::warning` in `CaveShuttleApiController`, künftig auch
  `CaveShuttlePackController`/`PackService`) auf unnötige personenbezogene
  Daten — aktuell werden `user_id`, `run_id`, `pack_version` geloggt, keine
  Klarnamen/E-Mails; das sollte bei jeder neuen Log-Zeile in Packs/Rankings
  genauso eingehalten werden.
- Staging-Test auf `community.caveshuttle.z11.de` und schrittweise Freigabe
  mit Monitoring stehen für Scores UND für Packs/Rankings noch aus — sollten
  gemeinsam einmal durchgeführt werden, nicht pro Feature einzeln.

### 4.4 Sonstige offene Punkte

- **Kommentare**: `Comment`-Modell ist aktuell an `Map` gebunden
  (`app/Models/Comment.php`); prüfen, ob Pack-Kommentare eine eigene
  Relation oder eine polymorphe Erweiterung brauchen (analog `Ratable`).
- **Achievements für Cave Shuttle**: `AchievementDefinitions`/
  `UserAchievement` sind aktuell Roboyard-Level-Achievements
  (`map_name LIKE 'Level %'`). Falls Cave Shuttle eigene Achievements
  bekommen soll, braucht das ein eigenes Konzept (nicht Teil dieses
  Dokuments, separat anlegen wenn benötigt).
- **Admin-Bereich**: `AdminController` nutzt teilweise dieselbe
  `RankingService::buildUserRankingsQuery()` — beim Rankings-Umschalter in
  Abschnitt 3 sicherstellen, dass Admin-Ansichten (falls sie das Cave-
  Shuttle-System ebenfalls zeigen sollen) denselben Systemschalter nutzen,
  statt eigene Queries zu duplizieren.
- **`dev/PROJECT_SEPARATION.md`**: nach Umsetzung von Abschnitt 2 und 3 den
  "Known TODOs"-Abschnitt dort aktualisieren/entfernen.

---

## 5. Automatischer Client-Login/-Registrierung per profile.uid (offline-fähig)

### 5.1 Problem

Bisher setzen Score-Sync (`CaveShuttleApiController`) und die künftigen
Pack-Uploads (Abschnitt 2) einen **manuellen** Login/Register über
`/mobile/login` bzw. `/mobile/register` (E-Mail + Passwort) voraus, bevor
ein API-Token existiert. Das ist für Cave Shuttle unpassend: das Spiel hat
bereits eine lokale, automatisch generierte `profile.uid`
(`src/game/high-score-manager.js::getPlayerProfile()`, Format
`{name}-{timestamp36}`), aber noch keine Verbindung dieser UID zu einem
Laravel-Account. Das App-Konto soll möglichst ohne Nutzereingabe entstehen
("es muss ja auch offline funktionieren, sobald das Handy wieder online ist
automatisch anmelden/registrieren").

Laravels `register`-Endpunkt (`MobileApiController::register`) verlangt
aktuell zwingend `email` (unique) und `password` (min. 8, confirmed) — ein
rein UID-basiertes Konto ist damit noch nicht möglich, ohne den Endpunkt
anzupassen.

### 5.2 Ziel

1. Beim ersten Online-Zugriff registriert sich die App **automatisch** mit
   der lokalen `profile.uid`, ohne dass der Nutzer etwas eingeben muss.
2. Ist die App beim ersten Start offline, wird die Registrierung
   zurückgestellt und automatisch nachgeholt, sobald wieder eine
   Netzwerkverbindung besteht (Offline-Queue, kein manuelles Eingreifen
   nötig).
3. Der Nutzer kann **optional** später ein "echtes" Passwort und eine
   E-Mail-Adresse hinterlegen (z. B. über Einstellungen), um das Konto auf
   einem zweiten Gerät wiederherzustellen oder es vor Verlust der App-Daten
   zu schützen. Ohne diesen Schritt bleibt das Konto ausschließlich über
   die lokal gespeicherte `profile.uid` + das clientseitig generierte
   Passwort erreichbar.

### 5.3 Backend-Änderung: UID-basierte Auto-Registrierung

- `MobileApiController::register` (bzw. ein neuer, expliziter Endpunkt
  `POST /mobile/caveshuttle/auto-register`, um das bestehende
  `/mobile/register`-Verhalten für Roboyard nicht zu verändern) akzeptiert
  zusätzlich:
  - `profile_uid` (Pflicht, = `profile.uid` aus der App-`localStorage`)
  - `password` (Pflicht — siehe 5.4, wird clientseitig generiert)
  - `email` (optional; wenn fehlend, generiert der Server eine interne,
    nicht zustellbare Platzhalter-Adresse `{profile_uid}@device.caveshuttle.local`,
    damit die `unique:users,email`-Regel erfüllt bleibt, ohne eine
    zwingende Nutzereingabe zu verlangen)
  - `name` optional; fällt auf `profile.name` zurück
- Idempotenz: erneuter Aufruf mit demselben `profile_uid` nach Verbindungs-
  abbruch darf **keinen** Duplikat-Account erzeugen. Serverseitig wird
  `profile_uid` in einer neuen Spalte `users.profile_uid` (unique, nullable)
  gespeichert; bei Kollision wird der bestehende Account per Login
  (`profile_uid` + `password`) zurückgegeben statt neu angelegt.
- `POST /mobile/login` wird um `profile_uid` als zusätzlichen `identifier`-
  Typ erweitert (analog zu E-Mail/Name/ID in Abschnitt "1. Try exact email
  match" etc. in `MobileApiController::login`).

### 5.4 Passwort-Handling im Client

Ja — ein Passwort ist nötig, da das Backend E-Mail/Passwort-basiert ist.
Es wird **automatisch generiert**, nicht vom Nutzer eingegeben:

- Beim Erzeugen von `profile.uid` (`getPlayerProfile()`) wird zusätzlich
  ein zufälliges, ausreichend langes Passwort generiert (z. B.
  `crypto.getRandomValues`, min. 24 Zeichen) und **nur lokal** in
  `localStorage` gespeichert (`storageKey('devicePassword')` oder als Teil
  von `profile`), niemals angezeigt.
- Dieses Passwort wird für die automatische Registrierung/den
  automatischen Login verwendet und bleibt für den Nutzer unsichtbar,
  solange er kein "echtes" Passwort setzt (siehe 5.2 Punkt 3).
- Setzt der Nutzer später ein eigenes Passwort (Kontowiederherstellung auf
  anderem Gerät), überschreibt das serverseitig das automatisch generierte
  Passwort (`POST /mobile/caveshuttle/account/set-password`, authentifiziert
  per bestehendem Token).

### 5.5 Offline-Queue im Client

- Neuer Client-Zustand `authSyncStatus` (`pending` / `registered` /
  `failed`), persistiert in `localStorage` neben `profile`.
- Bei App-Start: wenn `authSyncStatus !== 'registered'` und ein Netzwerk
  verfügbar ist (`navigator.onLine` + tatsächlicher Fetch-Versuch, da
  `navigator.onLine` unzuverlässig sein kann), wird automatisch
  `auto-register`/Login versucht.
- Bei Netzwerkfehler: `authSyncStatus = 'pending'` bleibt bestehen, kein
  Fehler-Dialog für den Nutzer (das ist ein Hintergrundvorgang). Retry bei
  jedem App-Start und zusätzlich bei `window.addEventListener('online', ...)`.
- Erst nach erfolgreichem Auto-Login/Register wird der API-Token
  gespeichert und der bereits vorhandene Score-Sync
  (`CaveShuttleApiController::syncScores`, siehe Phase-2) sowie künftige
  Pack-Uploads (Abschnitt 2) können laufen. Bis dahin funktioniert das
  Spiel wie bisher rein lokal (kein Online-Zwang, siehe
  `Highscore-System.md` §Ziel und Abgrenzung).

### 5.6 Sicherheits-/Datenschutzaspekte

- Das automatisch generierte Passwort ist kein Geheimnis, das der Nutzer
  sich merkt — es schützt nur vor zufälligem Fremdzugriff über die API,
  nicht vor Verlust der App-Daten. Das muss in der Datenschutzerklärung
  (Abschnitt 4.2) klar kommuniziert werden: ohne explizit gesetztes
  Passwort ist das Konto an das Gerät gebunden und bei Neuinstallation/
  App-Daten-Löschung nicht wiederherstellbar.
- Platzhalter-E-Mails (`@device.caveshuttle.local`) dürfen nie für
  Mailversand (`MAIL_FROM`/Benachrichtigungen) verwendet werden — bei
  Registrierungs-E-Mails/Benachrichtigungen prüfen, ob die Adresse auf die
  Platzhalter-Domain endet, und in diesem Fall keinen Mailversand
  auslösen.
- Rate-Limiting für den neuen `auto-register`-Endpunkt wie beim
  bestehenden `register` (`UserRegistrationService::isRateLimited`).

### 5.7 Umsetzungsschritte

1. Migration: `users.profile_uid` (string, nullable, unique) ergänzen.
2. `MobileApiController::login` um `profile_uid`-Identifier-Typ erweitern
   (oder neuer `CaveShuttleApiController::autoRegisterOrLogin`, falls die
   Trennung von Roboyard-Login sauberer ist — Entscheidung siehe
   Abschnitt 6).
3. Neuer Endpunkt `POST /mobile/caveshuttle/auto-register` (idempotent
   über `profile_uid`), Platzhalter-E-Mail-Generierung, Passwort-Hash.
4. Neuer Endpunkt `POST /mobile/caveshuttle/account/set-password` für die
   optionale Kontowiederherstellung.
5. Client (`src/game/high-score-manager.js` oder neues
   `src/game/auto-account.js`): Passwort-Generierung beim Anlegen von
   `profile`, `authSyncStatus`-State, Online/Offline-Retry-Logik.
6. Client-UI: unauffälliger Hinweis/Einstellung "Konto sichern" (optionales
   Passwort/E-Mail setzen), kein Pflicht-Dialog beim ersten Start.
7. Tests: Auto-Register ist idempotent bei Mehrfachaufruf mit gleicher
   `profile_uid`, Login über `profile_uid` funktioniert, Platzhalter-E-Mails
   erhalten keine Mails, Rate-Limiting greift.

---

## 6. Roter Faden: Gesamt-Reihenfolge

Konsolidiert Phase-2-Reste und die Abschnitte 2-5 dieses Dokuments in einer
Umsetzungsreihenfolge (Abhängigkeiten zuerst):

1. **Auto-Login/-Registrierung** (Abschnitt 5): ohne funktionierenden
   Auto-Account ist weder Score-Sync (bereits live, aber bisher nur mit
   manuellem Login getestet) noch Pack-Upload für die meisten Nutzer
   praktisch nutzbar — deshalb an den Anfang gezogen.
2. **Packs-Backend** (Abschnitt 2.2-2.5): Migration, Modell, `PackService`,
   `CaveShuttlePackController`, API-Erweiterung, Validierung, Tests.
3. **Packs-Frontend** (Abschnitt 2.6): Navigation und Startseite auf
   "Packs" umstellen.
4. **Editor-Integration** (Abschnitt 2.7, CaveShuttle-Repo): "Share to Web",
   "Online Packs" im Spiel.
5. **Rankings-Umschalter Backend** (Abschnitt 3.3): `RankingService`-
   Erweiterung, Config-Schalter — kann parallel zu 2-4 begonnen werden, da
   unabhängig von Packs.
6. **Rankings-Umschalter Frontend** (Abschnitt 3.4): Controller + View.
7. **Vertrauensmodell entscheiden** (Abschnitt 4.1) — spätestens bevor
   Rankings (Schritt 6) oder das mobile Leaderboard öffentlich beworben
   werden.
8. **Rate-Limiting nachrüsten** (Abschnitt 4.3) für Auto-Register,
   Score-Sync UND Pack-Upload gemeinsam.
9. **Datenschutz-/Play-Store-Texte aktualisieren** (Abschnitt 4.2 + 5.6) —
   deckt Auto-Account, Packs, Rankings und die noch offenen Score-Punkte
   aus Phase-2 in einem Schritt ab, statt mehrfach nachzubessern.
10. **Staging-Test + gestufte Freigabe** (Abschnitt 4.3) für Auto-Account,
    Scores, Packs und Rankings gemeinsam.
11. **Aufräumen**: `dev/PROJECT_SEPARATION.md` "Known TODOs" entfernen,
    das ursprüngliche Phase-2-Abschlusskriterium (siehe Abschnitt 0,
    Zeile "§11 Abschlusskriterium") erneut gegen den dann aktuellen Stand
    prüfen.

Schritte 7-10 sind reine Phase-2-Reste ohne Abhängigkeit von Packs/Rankings-
Code und können bei Bedarf vorgezogen werden, wenn das mobile Leaderboard
schneller live gehen soll als Packs/Web-Rankings.

---

## 7. Entscheidungen

- Soll `pack_data` als JSON-Spalte in der DB oder als Datei im Storage
  liegen? (Für den erwarteten Umfang reicht `longtext`; bei sehr großen
  Packs später auf Datei-Storage + Pfad umstellen.)
A: JSON-Spalte in der DB
- Pack-Vorschau: erstes Level rendern (serverseitig als Bild) oder nur
  Text-/Metadaten-Vorschau in Phase 1?
A: nur text
- Re-Upload mit gleicher `pack_id`, neuer `version`: Update des
  bestehenden Datensatzes (empfohlen) oder eigener Versionshistorie-
  Datensatz? `packVersion` in `cave_shuttle_scores` bleibt davon
  unabhängig korrekt, da dort die Version zum Score-Zeitpunkt gespeichert
  ist. Prinzip aus Phase-2 §7, gilt weiterhin: eine neue Version erzeugt
  einen neuen Ranglisten-Raum (Scores verschiedener Versionen werden nie
  gemischt); nicht mehr unterstützte/gelöschte Pack-Versionen bleiben über
  historische `cave_shuttle_scores`-Einträge referenzierbar, auch wenn der
  Pack-Datensatz selbst soft-deleted ist.
A: eigener Versionshistorie-Datensatz
- Cave-Shuttle-Ranglisten in Abschnitt 3: global (bester Score über alle
  Packs) oder ausschließlich pro `pack_version` × `level` × `player_mode`
  (wie die mobile Rangliste)? Empfehlung: Website zeigt beides — ein
  globales "Gesamt"-Ranking (aggregiert, Abschnitt 3.3) und optional einen
  Drilldown pro Pack/Level, analog zu `getLevelDetails()` für Roboyard.
A: ausschließlich pro `pack_version` × `level` × `player_mode`. ein globales ranking über verschiedene packs macht keinen sinn, da die level ganz unterschiedlich sind
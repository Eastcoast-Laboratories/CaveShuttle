# Editor: Level-Packs erstellen, erweitern, herunterladen und online teilen

## 1. Ziel (noch offen: nur Phase 2)

- In Phase 2 das Pack direkt aus dem Editor an die Laravel-App (`roboyard.z11`) teilen, damit andere Spieler es dort bewerten und herunterladen können.
- Das bestehende Bewertungssystem (Schwierigkeits-Rating) aus `roboyard.z11` soll DRY sowohl für Maps als auch für Packs nutzbar sein.

**Bereits umgesetzt** (nicht mehr Teil dieses Plans, ganz Phase 1): `src/ui/LevelEditor.jsx` implementiert den kompletten Pack-Builder — Draft-State in `localStorage`, Sidebar mit Pack-ID/Name/Version/Autor, Level-Liste (Edit/Move/Remove), `New Pack`, `Open Pack File`, `Download Pack`, `Install Pack in Game`. Der Editor-iframe (`public/level-editor/editor.js`) hat den `Add to Pack`-Button, der per `postMessage` (`EDITOR_ADD_TO_PACK`) an `LevelEditor.jsx` sendet. Ebenso bereits fertig: Import fertiger `.json`-Packs (`src/levels/levelpacks.js`, `src/levels/level-pack-import.js`) und Highscore-Zuordnung über `packId`/`packVersion` (`src/game/high-score-manager.js`). Fehlend ist ausschließlich das **Online-Sharing** (Phase 2).

## 2. Relevante bestehende Bausteine (Kontext für die Umsetzung)

- **Cave Shuttle Client**: Der komplette Pack-Builder-Workflow (Editor → Pack sammeln → Download/Import/Install) ist bereits fertig (siehe 1.). `registerCustomPack(meta, levelsMap)` (`src/levels/levelpacks.js`) wird von `LevelEditor.jsx::installPack` bereits genutzt.
- **Laravel — Roboyard-Altbestand** (`Map`, `Vote`, `VoteController`, `MobileApiController::shareMap`, `MapService`): dient nur als strukturelles Vorbild für Phase 2, ist aber Roboyard-Grid-spezifisch (Wände/Roboter/Ziele, GD-Bildgenerierung) und **nicht wiederverwendbar** für Cave Shuttles `.def`-Format.
- **Laravel — `CaveShuttleApiController.php`**: dedizierter Cave-Shuttle-API-Controller (Score-Sync, Leaderboard, Export, Account, Auto-Login). Neue Pack-Endpunkte müssen hier ergänzt werden, **nicht** in `MobileApiController`. Nutzt `authenticateToken()` (SHA-256-Bearer-Token).
- **Whitelist-Mechanik**: `isPackVersionAllowed()` prüft `packVersion` gegen eine statische `.env`-Whitelist (`CAVESHUTTLE_ALLOWED_PACK_VERSIONS`). Muss für Community-Packs angepasst werden (siehe 5.4.1).
- **Auto-Account bereits vorhanden**: `src/game/auto-account.js` registriert/authentifiziert jeden Spieler automatisch und hält bereits einen API-Token bereit — für Phase 2 ist **kein zusätzlicher Login-Flow nötig**, der Token kann direkt für Pack-Uploads/Ratings verwendet werden.

## 3. Pack-Format (Spezifikation, bereits für den Import implementiert)

Neu erzeugte Packs aus dem Editor müssen exakt diesem bestehenden Format entsprechen, damit der vorhandene Import (`parseImportedPackFile`) sie ohne Änderung akzeptiert:

```json
{
  "meta": {
    "id": "my-pack-1",
    "name": "Mein erstes Pack",
    "version": "1.0",
    "author": "Spielername",
    "createdAt": 1690630000000
  },
  "levels": {
    "level1": "82          ; width\n...",
    "level2": "..."
  }
}
```

- `meta.id` muss unique sein und darf keine reservierten Built-in-IDs verwenden (`default`, `classic`).
- `meta.version` ist die Pack-Version; Highscore-Einträge beziehen sich über `packVersion` darauf.
- `levels` ist ein Objekt mit Level-IDs als Schlüssel und `.def`-Inhalt als String.
- Zusätzliche Felder wie `description`, `tags` oder `previewColor` können später im `meta`-Objekt ergänzt werden, ohne das Format zu brechen.

## 4. Phase 1 – Lokale Pack-Verwaltung im Editor (bereits umgesetzt, ein Rest offen)

Die komplette Pack-Verwaltung ist bereits in `src/ui/LevelEditor.jsx` implementiert: Draft-State (React State + `localStorage`), Sidebar mit Meta-Feldern, Level-Liste mit Edit/Move/Remove, `New Pack`, `Open Pack File`, `Download Pack`, `Install Pack in Game`. Der Editor-iframe hat den `Add to Pack`-Button (`public/level-editor/editor.js::addToPack`).

**Einzig offen:** Ein Level direkt aus dem Editor-Save-Modal als Einzel-Pack herunterladen (`Download as Pack`, ohne vorher "Add to Pack" zu benutzen). Pack-Name/-ID würden aus dem Levelnamen abgeleitet, `levels: { level1: <content> }`.

## 5. Phase 2 – Online-Sharing über Laravel

### 5.1 Ziel

- Packs aus dem Editor können an `roboyard.z11` hochgeladen werden.
- Auf der Laravel-Seite können Nutzer Packs ansehen, herunterladen und mit dem bestehenden Schwierigkeits-System bewerten.
- Das Rating-System soll DRY für Maps und Packs funktionieren.

### 5.2 Datenbank-Schema

Neue Tabelle `caveshuttle_packs`:

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | big int (PK) | interne ID |
| `user_id` | FK | Ersteller |
| `pack_id` | string unique | z. B. `author-name-v1` |
| `name` | string | Anzeigename |
| `version` | string | Pack-Version |
| `description` | text | optional |
| `pack_data` | json/text | Pack-JSON oder Pfad zur Datei |
| `download_count` | int | Anzahl Downloads |
| `deleted_at` | timestamp | Soft-Delete |
| `timestamps` | - | created/updated |

### 5.3 DRY-Bewertungssystem

Bestehende `votes`-Tabelle polymorph machen (in-place Migration)

- Die bestehende `votes`-Tabelle wird in-place migriert:
  - `map_id` (unsignedBigInteger FK) → `votable_id` (unsignedBigInteger, kein FK)
  - Neue Spalte `votable_type` (string, Morph-Typ)
- Migration setzt alle bestehenden Datensätze auf `votable_type = 'App\Models\Map'`, `votable_id = map_id`.
- `Vote`-Model bekommt `votable()` MorphTo-Relation; `fillable` wird angepasst.
- `Map` und `Pack` Modelle bekommen `votes()` MorphMany-Relation (statt HasMany).
- Die bestehenden Difficulty-Methoden (`averageDifficulty()`, `totalRatings()`, `userRating()`, `difficultyLabel()`) bleiben am `Map`-Model und nutzen die MorphMany-Relation. Für `Pack` wird ein Trait `Ratable` (`app/Traits/Ratable.php`) extrahiert, der diese Methoden DRY bereitstellt.
- `VoteController` nimmt `votable_type` + `votable_id` entgegen statt `map_id`.
- Keine zweite Tabelle, keine doppelte Logik, keine nullable FKs pro Typ.

### 5.4 Laravel-Komponenten

- `app/Models/CaveShuttlePack.php` oder `Pack.php` mit `Ratable`-Trait.
- `app/Http/Controllers/CaveShuttlePackController.php` mit:
  - `index` (Liste)
  - `show` (Detail + Download-Button)
  - `store` (Upload, API und Web)
  - `destroy` (Soft-Delete)
  - `download` (JSON-Download, Counter erhöhen)
- `app/Http/Controllers/CaveShuttleApiController::sharePack(Request)` — gehört in `CaveShuttleApiController` (bestehender dedizierter Cave-Shuttle-Controller, siehe 2.), **nicht** in `MobileApiController` (das ist Roboyards Controller für `shareMap`). Nutzt dasselbe `authenticateToken()`-Schema.
- `app/Services/PackService.php` strukturell analog zu `MapService` (Duplikat-Prüfung, Preview, Namensgenerierung als Rollen), aber **eigenständig implementiert** — `.def`-Format erfordert eigene Parsing-/Vorschau-Logik, keine Code-Wiederverwendung aus `MapService` möglich (siehe 2., 8.).
- Views:
  - `packs/index.blade.php`
  - `packs/show.blade.php` mit Rating-Partial (`ratings/_difficulty.blade.php`), das auch in `maps/show.blade.php` wiederverwendet wird.
- Routen in `routes/web.php` und `routes/api.php`:
  - `GET /packs`
  - `GET /packs/{pack}`
  - `POST /packs`
  - `POST /api/packs` (Mobile)
  - `GET /packs/{pack}/download`
  - `POST /difficulty/rate` mit `votable_type` und `votable_id`

### 5.4.1 Pack-Versionen und die Leaderboard-Whitelist

Aktuell gate't `CaveShuttleApiController::isPackVersionAllowed()` Score-Sync und Leaderboard über eine statische, admin-gepflegte `.env`-Whitelist (`CAVESHUTTLE_ALLOWED_PACK_VERSIONS`). Diese Mechanik passt nicht zu beliebig vielen Community-Pack-Versionen (kein Admin kann jede Upload-Version manuell freischalten). Zu entscheiden:

- **Option A**: Whitelist gilt nur für `packId === 'default'` (offizieller Client-Versionsschutz); Community-Packs (`packId !== 'default'`) sind von der Prüfung ausgenommen und werden stattdessen nur akzeptiert, wenn ein passender `caveshuttle_packs`-Eintrag mit exakt dieser `pack_id`+`version`-Kombination existiert (Freigabe implizit durch Upload).
- **Option B**: Beim Pack-Upload wird die `pack_id`+`version`-Kombination automatisch in eine DB-Tabelle (statt statischer Config) aufgenommen; `isPackVersionAllowed` prüft zusätzlich gegen diese Tabelle.
- Empfehlung: **Option A**, da einfacher und ohne zusätzliche Tabelle umsetzbar; erfordert lediglich, dass `isPackVersionAllowed` bzw. der Aufrufer den `packId` mitprüft.

### 5.5 Cave-Shuttle-Anbindung

- Im Editor wird ein **Share to Web**-Button ergänzt.
- ~~Der Benutzer muss angemeldet sein~~ — **bereits gelöst**: `src/game/auto-account.js` registriert/authentifiziert jeden Spieler automatisch und hält bereits einen API-Token bereit (siehe 2.). Kein zusätzlicher Login-Flow nötig, der bestehende Token wird direkt für den Upload verwendet.
- Pack-JSON wird per `POST /api/packs` an Laravel gesendet.
- Laravel antwortet mit `pack_id`, `share_url` und `download_url`.
- Im Spiel (Hamburger-Menü) kann man zukünftig "Online Packs" öffnen, Liste von `roboyard.z11` abrufen und ein Pack direkt importieren.

## 6. Implementierungs-Schritte

### 6.1 Phase 1 (Rest)

1. `Download as Pack`-Button im Save-Modal von `editor.js` ergänzen (Einzel-Pack ohne vorherigen "Add to Pack"-Schritt).

### 6.2 Phase 2

1. Migration `create_caveshuttle_packs_table` und `create_ratings_table` (polymorph).
2. Migration: bestehende `votes` in `ratings` überführen (optional, Backfill).
3. `Ratable`-Trait und `RatableService` anlegen.
4. `Pack`-Modell, `PackService`, `PackController`, `CaveShuttleApiController::sharePack`.
5. `RatingController` bzw. Anpassung `VoteController` für polymorphe Bewertungen.
6. `isPackVersionAllowed` anpassen (siehe 5.4.1, Option A): Whitelist nur für `packId === 'default'` erzwingen, Community-Packs anhand vorhandenem `caveshuttle_packs`-Eintrag prüfen.
7. Views/Partials für Packs und das gemeinsame Rating-Partial.
8. Editor-UI für "Share to Web" und Spiel-UI für "Online Packs".
9. Play-Store-Text anpassen: User-Generated Packs & Online-Galerie.

## 7. Sicherheit & Validierung

- Pack-IDs dürfen reservierte Built-in-IDs nicht verwenden (Prüfung im Editor und Server).
- Server validiert Pack-JSON-Schema (Meta, Levels, `.def`-Inhalt).
- Maximale Pack-Größe und Level-Anzahl begrenzen.
- Soft-Delete für Packs, Spam-Meldung, Admin-Löschung.
- Authentifizierung per API-Token für Uploads (bestehendes Schema aus `CaveShuttleApiController::authenticateToken`, bereits automatisch für jeden Spieler verfügbar via `auto-account.js`).
- Rate-Limiting für Uploads und Downloads.

## 8. Offene Entscheidungen

- Soll `pack_data` als JSON in der Datenbank oder als Datei auf dem Server gespeichert werden? (Empfehlung: Datei, DB speichert Pfad.)
- Soll es eine eigene `Pack`-Ressource oder eine generische `Ratable`-Ressource `Content` geben, die Maps und Packs vereinheitlicht?
- Wie wird die Pack-Vorschau/Pack-Thumbnail generiert? Da `MapService`s Preview-Code (GD-Bildgenerierung) an Roboyards Grid-Format gebunden ist und nicht wiederverwendbar ist (siehe 2.), braucht es eine eigene Lösung: z.B. Client generiert PNG beim Export/Upload und schickt es mit, oder Server rendert `.def`-Höhlenlayout neu (deutlich mehr Aufwand).
- Soll `Map` und `Pack` getrennte Kommentar-Tabellen haben oder auch polymorphe Kommentare?

## 9. Dateien & Komponenten im Überblick

### Cave Shuttle

- `public/level-editor/editor.js` (Save-Modal: `Download as Pack`-Button ergänzen)
- `src/ui/HamburgerMenu.jsx` (später: "Online Packs"-Browser ergänzen; Import-Teil ist bereits fertig)
- `src/ui/LevelEditor.jsx` (später: "Share to Web"-Button ergänzen; Pack-Builder ist bereits fertig)

### Laravel

- `database/migrations/..._create_caveshuttle_packs_table.php`
- `database/migrations/..._create_ratings_table.php`
- `app/Models/CaveShuttlePack.php`
- `app/Models/Rating.php`
- `app/Traits/Ratable.php`
- `app/Services/RatableService.php`
- `app/Services/PackService.php`
- `app/Http/Controllers/CaveShuttlePackController.php`
- `app/Http/Controllers/RatingController.php`
- `app/Http/Controllers/CaveShuttleApiController.php` (Erweiterung `sharePack`, korrigiert von `MobileApiController`)
- `resources/views/packs/*.blade.php`
- `resources/views/ratings/_difficulty.blade.php` (DRY-Partial)
- `routes/web.php` und `routes/api.php`

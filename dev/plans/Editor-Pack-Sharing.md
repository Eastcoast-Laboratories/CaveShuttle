# Editor: Level-Packs erstellen, erweitern, herunterladen und online teilen

## 1. Ziel

Im Cave-Shuttle-Level-Editor soll ein Spieler folgendes tun können:

- Mehrere selbst erstellte Levels zu einem **Level-Pack** sammeln.
- Ein Pack als JSON-Datei herunterladen (ladbar im Spiel über den bestehenden Pack-Import).
- Bereits ein einzelnes Level als Pack herunterladen, ohne vorher mehrere Levels anlegen zu müssen.
- Einem bestehenden Pack nachträglich weitere Levels hinzufügen.
- In Phase 2 das Pack direkt aus dem Editor an die Laravel-App (`roboyard.z11`) teilen, damit andere Spieler es dort bewerten und herunterladen können.
- Das bestehende Bewertungssystem (Schwierigkeits-Rating) aus `roboyard.z11` soll DRY sowohl für Maps als auch für Packs nutzbar sein.

## 2. Ausgangslage

### 2.1 Cave Shuttle

- `public/level-editor/index.html` + `editor.js` bieten einen Canvas-Editor, der einzelne Levels als `.def`-Text exportiert.
- `src/levels/levelpacks.js::registerCustomPack(meta, levelsMap)` speichert Packs in `localStorage` im Format `{ meta, levels }`.
- `src/levels/level-pack-import.js::parseImportedPackFile(fileText)` validiert und parst Pack-JSON.
- `ui/HamburgerMenu.jsx` kann `.json`-Packs importieren (`handleImportPack`).
- `src/game/high-score-manager.js` speichert `packId`, `packVersion`, `mode` und `pass` an Highscore-Datensätzen.

### 2.2 Laravel (community.caveshuttle.z11.de)

- `Map`-Modell speichert einzelne Roboyard-Maps mit `map_string`.
- `Vote`-Modell speichert `difficulty_rating` (0-5) pro Map.
- `VoteController` verwaltet Ratings für Maps.
- `MobileApiController::shareMap` ermöglicht das Teilen einzelner Maps per API-Token. Dieser Controller ist Roboyard-spezifisch; neue Cave-Shuttle-Endpunkte gehören **nicht** hierhin (siehe 2.3).
- `MapService` enthält DRY-Hilfsmethoden (Preview, Duplikat-Prüfung, Zufallsname) für Roboyard-Maps — diese Logik ist fest an das Roboyard-Grid-Format (Wände, Roboter, Ziele, GD-Bildgenerierung) gekoppelt und **nicht wiederverwendbar** für Cave Shuttles `.def`-Format. Ein `PackService` kann nur strukturell analog sein (eigene Preview-/Duplikat-Logik nötig, siehe 8).

### 2.3 Cave-Shuttle-spezifische Laravel-Komponenten (neu seit Planerstellung)

- `CaveShuttleApiController.php` ist der dedizierte API-Controller für alle Cave-Shuttle-spezifischen Endpunkte (Score-Sync, Leaderboard, Export, Account-Löschung, Auto-Login, Settings-Sync, Crash-Reports). Er nutzt dasselbe `authenticateToken()`-Schema (SHA-256-Bearer-Token) wie `MobileApiController`, ist aber eine getrennte Klasse.
- **Neue Pack-Endpunkte (`sharePack`, Rating, Download) gehören in `CaveShuttleApiController.php`, nicht in `MobileApiController`.** Abschnitt 5.4 wurde entsprechend korrigiert.
- `isPackVersionAllowed(string $packVersion)` prüft `packVersion` gegen eine **statische Whitelist** aus `config('caveshuttle.allowed_pack_versions')` (env: `CAVESHUTTLE_ALLOWED_PACK_VERSIONS`, kommagetrennt). Score-Sync (`syncScores`) und `leaderboard` lehnen nicht gelistete `packVersion`-Werte ab. Ist die Liste leer, ist aktuell (Dev-Default) alles erlaubt.
- Client (`src/game/high-score-manager.js::createRunContext`) sendet für jeden Lauf `packId` (Default: `'default'`) und `packVersion` (Default: `'1'`) mit; das Backend speichert beides in `CaveShuttleScore`.
- **Auto-Account bereits vorhanden**: `src/game/auto-account.js` registriert/authentifiziert jeden Spieler automatisch (auch ohne manuellen Login) und hält einen API-Token bereit. Die in 5.5 geforderte Anmeldung ist damit **bereits gelöst** — kein zusätzlicher Login-Flow für Phase 2 nötig, der bestehende Token kann direkt für Pack-Uploads/Ratings verwendet werden.

## 3. Pack-Format

Das Pack-Format bleibt identisch mit dem bestehenden Importformat, um Brüche zu vermeiden:

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

## 4. Phase 1 – Lokale Pack-Verwaltung im Editor

### 4.1 Editor-Zustand erweitern

- Neue `PackBuilder`-Klasse oder Module in `public/level-editor/pack-builder.js`.
- Speicherung des aktuellen Pack-Entwurfs in `localStorage` unter `caveshuttle_editor_draft_pack`.
- Der Entwurf hat die gleiche Form `{ meta, levels }`.

### 4.2 Neue Editor-UI

- Sidebar-Bereich "Pack" mit:
  - Pack-Name und Pack-ID Eingabefeldern.
  - Liste der bisherigen Levels im Pack (klickbar zum Bearbeiten/Laden).
  - Buttons: **Add to Pack**, **Remove from Pack**, **Move Up/Down**, **New Pack**, **Open Pack**, **Download Pack**.
- Beim Klick auf **Add to Pack** wird das aktuell im Editor geöffnete Level in den Entwurf übernommen.
- Beim **Download Pack** wird der Entwurf als `{{meta.id}}.json` heruntergeladen.
- Beim **Open Pack** kann der Benutzer eine `.json`-Pack-Datei laden und den Entwurf fortführen.

### 4.3 Einzelnes Level als Pack

- Button **Download as Pack** im bestehenden Save-Modal erzeugt ein Pack mit nur einem Eintrag (`level1`) aus dem aktuellen Level.
- Pack-Name und Pack-ID werden aus dem Levelnamen abgeleitet.

### 4.4 Nachträgliches Hinzufügen

- Über **Open Pack** lädt der Benutzer eine Pack-Datei oder ein in `localStorage` installiertes Pack.
- Der Pack-Builder wechselt in den Entwurfsmodus.
- Neue Levels können hinzugefügt, bestehende bearbeitet oder entfernt werden.
- Beim Speichern wird ein neues Pack-JSON generiert; die Version sollte inkrementiert oder ein neuer `id`-Vorschlag gemacht werden, damit Highscore-Daten konsistent bleiben.

### 4.5 Direktimport ins Spiel

- Zusätzliche Buttons im Editor:
  - **Install Pack in Game** speichert das Pack direkt über `registerCustomPack` in `localStorage`, ohne Datei-Download.
  - Das Spiel kann das Pack dann sofort im Menu auswählen.

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

Option A (empfohlen): Polymorphe Ratings

- Neues `ratings`-System neben dem bestehenden `votes`:
  - Tabelle `ratings`: `id`, `user_id`, `votable_id`, `votable_type` (`Map` oder `Pack`), `difficulty_rating`, `timestamps`, `deleted_at`.
- Neue Migration erstellt `ratings`.
- Bestehende `votes` können per Migration in `ratings` überführt werden (`votable_type = 'App\Models\Map'`, `votable_id = map_id`).
- `Map` und `Pack` Modelle bekommen ein `Ratable`-Trait (`app/Traits/Ratable.php`) mit Methoden wie `averageDifficulty()`, `totalRatings()`, `userRating()`, `difficultyLabel()`.
- `Vote` und `VoteController` werden durch `Rating` und `RatingController` ersetzt oder beide Controller delegieren an `RatableService`.
- `RatableService` nimmt `votable_type` und `votable_id` entgegen und speichert/aktualisiert eine Bewertung DRY.

Option B: Separate Vote-Tabelle

- `votes` behält `map_id` und bekommt zusätzlich `pack_id`.
- `Ratable`-Trait abstrahiert trotzdem die Logik, aber die Tabelle bleibt monolithisch.
- Nachteil: Jede neue Ratable-Einheit erfordert neue Spalten.

Empfehlung: **Option A**, da sauberer erweiterbar.

### 5.4 Laravel-Komponenten

- `app/Models/CaveShuttlePack.php` oder `Pack.php` mit `Ratable`-Trait.
- `app/Http/Controllers/CaveShuttlePackController.php` mit:
  - `index` (Liste)
  - `show` (Detail + Download-Button)
  - `store` (Upload, API und Web)
  - `destroy` (Soft-Delete)
  - `download` (JSON-Download, Counter erhöhen)
- `app/Http/Controllers/CaveShuttleApiController::sharePack(Request)` — **korrigiert**: gehört in `CaveShuttleApiController` (bestehender dedizierter Cave-Shuttle-Controller, siehe 2.3), **nicht** in `MobileApiController` (das ist Roboyards Controller für `shareMap`). Nutzt dasselbe `authenticateToken()`-Schema.
- `app/Services/PackService.php` strukturell analog zu `MapService` (Duplikat-Prüfung, Preview, Namensgenerierung als Rollen), aber **eigenständig implementiert** — `.def`-Format erfordert eigene Parsing-/Vorschau-Logik, keine Code-Wiederverwendung aus `MapService` möglich (siehe 2.2, 8).
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
- ~~Der Benutzer muss angemeldet sein~~ — **bereits gelöst**: `src/game/auto-account.js` registriert/authentifiziert jeden Spieler automatisch und hält bereits einen API-Token bereit (siehe 2.3). Kein zusätzlicher Login-Flow nötig, der bestehende Token wird direkt für den Upload verwendet.
- Pack-JSON wird per `POST /api/packs` an Laravel gesendet.
- Laravel antwortet mit `pack_id`, `share_url` und `download_url`.
- Im Spiel (Hamburger-Menü) kann man zukünftig "Online Packs" öffnen, Liste von `roboyard.z11` abrufen und ein Pack direkt importieren.

## 6. Implementierungs-Schritte

### 6.1 Phase 1

1. `public/level-editor/pack-builder.js` anlegen.
2. Editor-HTML um Pack-Sidebar erweitern.
3. Speicherung/Laden des Entwurfs in `localStorage`.
4. Buttons: Download Pack, Download as Pack, Open Pack, Install Pack in Game.
5. `parseImportedPackFile` und `registerCustomPack` ggf. an neues Format anpassen/erweitern (zusätzliche Felder erlauben).
6. Tests im Browser durchführen: Import/Export, nachträgliches Erweitern.

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
- Wie wird die Pack-Vorschau/Pack-Thumbnail generiert? Da `MapService`s Preview-Code (GD-Bildgenerierung) an Roboyards Grid-Format gebunden ist und nicht wiederverwendbar ist (siehe 2.2), braucht es eine eigene Lösung: z.B. Client generiert PNG beim Export/Upload und schickt es mit, oder Server rendert `.def`-Höhlenlayout neu (deutlich mehr Aufwand).
- Soll `Map` und `Pack` getrennte Kommentar-Tabellen haben oder auch polymorphe Kommentare?

## 9. Dateien & Komponenten im Überblick

### Cave Shuttle

- `public/level-editor/pack-builder.js` (neu)
- `public/level-editor/index.html` (Pack-UI)
- `public/level-editor/editor.js` (Pack-Events)
- `src/levels/levelpacks.js` (ggf. Erweiterung)
- `src/ui/HamburgerMenu.jsx` (Online-Packs später)

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

# Schuss-Button öffnet schiebende Wand (H↔G) mit Auto-Close

Ein Schuss auf den Button (`N`, Tag = Zeichen links, z.B. `1`) öffnet die solide Wand zwischen `H` und `G`; nach einem in `constants` definierten Timeout schließt sie sich automatisch wieder. Der Button bleibt heil und ist erneut beschießbar.

## Ausgangslage (recherchiert)
- Wand zwischen `H` (links) und `G` (rechts) besteht im `.def` bereits aus soliden `p`-Kacheln → Tür ist initial **geschlossen** (gewünscht).
- `p` (112) ist solide (`isWall`: Code ≥ 76) und rendert als voller Block. `H`/`G` (71/72) rendern als Block, sind aber nicht solide (Rahmen).
- Renderer (`tile-renderer.js`) und Kollision (`collision.js`) lesen beide `level.layout`. Direktes Mutieren der Layout-Zeilen wirkt sofort auf Rendering **und** Kollision (kein neuer Tile-Typ, DRY).
- Spieler-Schüsse (`playerBullets`, GameCanvas ~913) prüfen nur Pod/Bunker/Out-of-bounds, **nicht** Wände → Schuss erreicht den Button.
- Vorhandene Button/Slider-Platzhalterlogik (GameCanvas ~960–979, `slider.activate()`) ist funktionslos und wird ersetzt.
- C-Referenz (`dulsi-thrust/src/level.c`, `things.c`): `N` = Button (Tag = `temp[x-1]`), `G`/`H` = Slider/Blocker-Paar, `closestbutton` verbindet Paar mit nächstem Button.

## Lösung (Tür-System auf Layout-Basis)

### 1. Konstanten (`src/core/constants.js`)
- `DOOR_AUTO_CLOSE_MS = 3000` — Zeit bis zum automatischen Schließen nach vollständigem Öffnen.
- `DOOR_SLIDE_MS_PER_COL = 50` — Animationsschritt pro Spalte (Schiebe-Effekt).

### 2. Tür-Erkennung beim Level-Laden (`GameCanvas.jsx`, `loadAssets`)
- Beim Parsen Spalten/Zeilen von `H` und `G` erfassen.
- Türgruppe bilden: zusammenhängende Zeilen, in denen je ein `H` (links) und `G` (rechts) auf gleicher Höhe stehen. `doorCells` = Spalten `Hcol+1 … Gcol-1` je Zeile.
- Button-Tag ergänzen: für `N`/`L` das Zeichen links (`layout[y][x-1]`) als `tag` mitführen.
- Jeden Button per Schwerpunkt-Distanz der nächsten Türgruppe zuordnen (Analogon zu `closestbutton`).
- Ergebnis in `doorsRef = useRef([])`: pro Tür `{ rows, colStart, colEnd, state, filledCols, timer, slideAccum }`. Initialzustand `state='closed'`, alle Spalten `p`.

### 3. Tür-State-Machine (im Game-Loop, ref-basiert, kein setState)
- Zustände: `closed → opening → open → closing → closed`.
- `opening`: pro `DOOR_SLIDE_MS_PER_COL` eine Spalte von `p` → `' '` setzen (von `G`-Seite Richtung `H`). Wenn alle leer → `open`, `timer = DOOR_AUTO_CLOSE_MS`.
- `open`: `timer` herunterzählen (deltaTime). Bei ≤ 0 → `closing`.
- `closing`: pro Schritt eine Spalte `' '` → `p` (von `H`-Seite Richtung `G`, „von H zu G rausschieben"). Wenn voll → `closed`.
- Mutation: betroffene `level.layout[y]`-Zeile per String-Replace der Spalte aktualisieren (gleiche `level`-Objektreferenz → Render/Kollision sehen es sofort).

### 4. Trigger per Schuss (`GameCanvas.jsx`, playerBullets-Filter ~913)
- Nach Pod/Bunker-Check: für jeden Button prüfen, ob Bullet im Trefferradius (~12px) liegt.
- Treffer: zugeordnete Tür öffnen, **nur wenn** `state==='closed'` (sonst Timer ggf. neu setzen, falls bereits offen). Button bleibt erhalten (nicht deaktivieren). Bullet entfernen (`return false`).
- `[DOOR]`/`[BUTTON_HIT]` Logging mit eindeutigen Tags ergänzen.

### 5. Platzhalter ersetzen
- Ship-Distanz-Trigger + `slider.activate()` (Zeilen ~960–979) entfernen.
- `Slider`-Objekt-Erzeugung (`setSliders(... new Slider ...)`) entfernen; `Button`-Objekte beibehalten (liefern Position + Tag für Trefferprüfung) oder durch leichte `buttonsRef`-Einträge ersetzen.

## Betroffene Dateien
- `src/core/constants.js`: zwei neue Tür-Konstanten.
- `src/ui/GameCanvas.jsx`: Tür-Erkennung beim Laden, `doorsRef`, State-Machine im Loop, Schuss-Trigger, Entfernen der Platzhalterlogik.

## Verifikation
- Level 2 laden: Wand zwischen H und G ist solide (Schiff prallt ab).
- Auf Button `1N` schießen: Wand öffnet sich spaltenweise; Schiff kann durchfliegen.
- Nach `DOOR_AUTO_CLOSE_MS` schließt sich die Wand spaltenweise wieder.
- Button kann erneut beschossen werden (bleibt heil).

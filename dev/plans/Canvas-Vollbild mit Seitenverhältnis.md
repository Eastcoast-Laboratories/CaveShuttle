# Canvas-Vollbild mit Seitenverhältnis-Skalierung

Der Canvas behält eine feste interne Auflösung (festes Seitenverhältnis) und wird per CSS auf die maximale innere Fenstergröße skaliert (Letterboxing); Game-Over- und Level-Complete-Popups liegen immer mittig über dem Canvas.

## Ziel (laut User)
- Canvas maximal so groß wie der innere Browser-Bildschirm, skaliert beim Resize.
- Game-Over- und Success-Popup immer **mittig über dem Canvas**.
- Entscheidungen: **CSS-Skalierung (festes Seitenverhältnis)** + **Canvas wirklich vollbild** (wie Mobile), HUD als Overlay, Level-Auswahl/Steuerung in ein Menü/Overlay.

## Ausgangslage (Analyse)
- `src/App.jsx`: getrenntes Mobile-/Desktop-Layout. Desktop nutzt fest `width=800 height=600` + Seitenpanel; Mobile nutzt fensterbasierte Größe.
- `src/ui/GameCanvas.jsx`: `<canvas width={width} height={height}>` ohne CSS-Skalierung; Render-Closure erfasst `width`/`height` einmalig (`useEffect [] `), `ship` wird mit `width/2,height/2` initialisiert.
- **Bug:** Spielbereich wird nur bei `playing || gameover` gerendert, **nicht** bei `levelcomplete` → unter dem Success-Popup ist kein (eingefrorener) Canvas.
- Overlays (`OverlayMessage`) sind `position: fixed` über dem ganzen Viewport zentriert, nicht über dem Canvas.
- Vom User bereits hinzugefügt: `canvasSize`-State + `resizeCanvas` in `App.jsx` (wird durch CSS-Ansatz überflüssig).

## Plan

### 1. Feste interne Auflösung + Konstanten
- In `src/core/constants.js`: `GAME_WIDTH = 800`, `GAME_HEIGHT = 600` (4:3) definieren.
- `GameCanvas` immer mit diesen festen Werten rendern (Zeichenpuffer fest, kein fensterbasiertes width/height mehr).

### 2. CSS-Skalierung im GameCanvas
- `<canvas>`-Style ergänzen: `width: 100%`, `height: 100%`, `objectFit: 'contain'`, `display: 'block'` — damit das Element seitenverhältnis-erhaltend in seinen Container skaliert und nie über den inneren Bildschirm hinausgeht.
- Border ggf. entfernen/anpassen (stört bei Vollbild).

### 3. Unified Vollbild-Layout in App.jsx
- Mobile- und Desktop-Verzweigung zu **einem** Vollbild-Layout zusammenführen (DRY):
  - Äußerer Container: `width: 100vw`, `height: 100vh`, `position: relative`, schwarzer Hintergrund, Flex-Center.
  - **Canvas-Wrapper** (`position: relative`, `flex: 1`, Center): enthält den skalierten Canvas und die Overlays.
  - **HUD** als Overlay oben (wie bisher Mobile-HUD-Leiste).
  - **Hamburger-Menü** (bestehendes Mobile-Overlay) für Level-Auswahl + Steuerung + „Back to Menu“ — auch auf Desktop.
- `canvasSize`-State + `resizeCanvas` wieder entfernen (durch CSS-Skalierung unnötig). `checkMobile` nur behalten, falls weiterhin für Touch-Input/Steuerung gebraucht (prüfen).

### 4. Canvas bei levelcomplete sichtbar halten
- Render-Bedingung von `playing || gameover` auf `playing || gameover || levelcomplete` erweitern, damit das eingefrorene Bild unter dem Success-Popup sichtbar ist (`frozen` ist dafür bereits gesetzt).

### 5. Overlays mittig über dem Canvas
- `OverlayMessage`-Instanzen (Game Over, Level Complete) in den **Canvas-Wrapper** verschieben.
- `OverlayMessage` von `position: fixed` (Viewport) auf `position: absolute; inset: 0` umstellen, sodass es den Canvas-Wrapper füllt und mittig zentriert ist → Popup liegt exakt über dem Canvas.

## Betroffene Dateien
- `src/core/constants.js` — `GAME_WIDTH`/`GAME_HEIGHT`.
- `src/ui/GameCanvas.jsx` — CSS-Skalierung des `<canvas>`.
- `src/ui/OverlayMessage.jsx` — `absolute` statt `fixed`.
- `src/App.jsx` — Unified Vollbild-Layout, Render bei `levelcomplete`, Overlays in Canvas-Wrapper, `canvasSize`/`resizeCanvas` entfernen.

## Verifikation
- Fenster verkleinern/vergrößern: Canvas skaliert seitenverhältnis-erhaltend, nie größer als inneres Fenster.
- Game Over + Level Complete: Popup mittig über dem Canvas, dahinter eingefrorenes Bild.
- Mobile + Desktop identisches Vollbild-Verhalten.
- Bestehende Unit-Tests bleiben grün (`npx vitest run`).

## Offene Punkte
- Genaues Ziel-Seitenverhältnis (4:3 / 800x600 vorgeschlagen) — anpassbar.
- Ob `isMobile` noch für Touch-Steuerung benötigt wird (vor Entfernen prüfen).

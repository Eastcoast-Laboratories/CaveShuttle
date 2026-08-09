# Level Design Guide

Practical guide for building interesting `.def` levels. All templates below are
copied **verbatim** from the working classic levels (`dev/external-levelpacks/classic/`),
so they are guaranteed to render and behave correctly. See `LEVELS.md` for the
full tile reference and file format.

## Before you start
- Read `LEVELS.md` first for the file header format and the tile character table.
- Build levels incrementally: add a small piece, reload/import, check it renders
  and collides as expected, then continue. Don't write the whole layout blind.
- Reuse the templates below instead of inventing new tile combinations for
  bunkers/reactors — the decorative letters (`Q R S`, `X Y Z`, `e f g h i j k l`, ...)
  have no special game logic, they just need to *look* right, and copying a
  known-good pattern avoids weird visual glitches.

## interesting levels combine:
- **Diagonal cave walls** carved with slope tiles instead of only flat floors/ceilings.
- **Bunkers embedded in the terrain** at the end of a diagonal wall (not floating in open space.)
- **Narrow vertical shafts** leading down to the pod holder, forcing careful flying.
- **Fuel tucked into alcoves** that require a small detour.
- **Reactors placed off to the side**, guarded by a bunker, not free-standing.

Use the templates below to reproduce these patterns in new levels.

---

## 1. Basic floor slopes

> **Collision note:** every terrain tile below is a *full 16px solid block* for
> physics (`TileRenderer.isWall` = char code ≥ 76). The diagonal look comes only
> from the tile's pixel shading, so a "slope" is really a **blocky staircase** the
> ship bumps down step-by-step — it can't slide along it. All slope pairs below
> advance by **two columns per row** (the width of the pair).

### Down-right slope (`q`/`r` pair)
Each row shifts the `qr` pair **two columns** right of the previous row (so the
solid `p` fill grows underneath it):
```
qr
ppqr
ppppqr
ppppppqr
```

### Down-left slope (`s`/`t` pair) — mirror of the above
```
      st
    stpp
  stpppp
stpppppp
```

### tunnel wall ceiling descending right (`w`/`x` pair)
The `wx` pair shifts **two columns right** per row; the solid rock is on the
**right**, and the open cave is on the **left** (this is the wall a left-facing
`\` bunker sits against on a ceiling — see section 2):
```
wxpppppp
  wxpppp
    wxpp
      wx
```

### tunnel wall ceiling descending left (`u`/`v` pair)
The `uv` pair shifts **two columns left** per row; the solid rock is on the
**left**, and the open cave is on the **right** (this is the wall a right-facing
`[`/`U` bunker sits against — see section 2):
```
ppppppuv
ppppuv
ppuv
uv
```

### Steeper cave floor (`n`/`o` pair)
Same two-columns-per-row footprint as `q`/`r`, but the sprite draws a steeper
diagonal face. Real example from `level6.def` (cave floor descending toward a bunker):
```
no
ppno
ppppno
ppppppno
```

---

## 2. Cave tunnel ceiling mounted bunker (real template)

**Bunker facing right (`[`), wall descending from upper-right**
(from `level2.def` / `level4.def` / `level5.def` / `level6.def`):
```
ppppppppuv
ppppppuv
ppppuv[
ppuvXYZ
uv
```
- Repeat the `uv` rows (shifting 2 columns left each time) as long as needed.
- The row with the bunker: `uv[` and below: `XYZ`, so `Z` lines up under the `[` of the bunker.

**Bunker facing left (`\`), wall descending from upper-left** (mirror, from `level5.def`/`level6.def`):
```
wxpppppppp
  wxpppppp
   \wxpppp
   ]^_wxpp
        wx
```
- Repeat `wx` rows shifting 2 columns right each time.
- The row with the bunker: `\wx` and below: `]^_wx`, so `]` lines up under the `\`.

You can combine both mirrored templates to make a V-shaped or W-shaped cave
opening with a bunker on each side, exactly like in `level2.def`/`level6.def`.

---

## 3. Floor-mounted bunker on a mound (real template, from `level1.def`)

A bunker sitting on a
down-right slope (`qr`) leading into the bunker housing (real template from `level1.def`):
```
qrPQR
ppqrS
pppqr
pppppqr
```
- `P` is the functional bunker marker.
- `Q R S` are decorative housing tiles — always keep this exact shape when
  reusing a `P` bunker on a slope.

Floor-mounted **`U`** bunker on a left slope (real template from `level3.def`):
```
     st
UVWstpp
Tstpppp
ppppppp
```

---

## 4. Power plant / reactor (real template, from `level1.def`)

The reactor is a 3×3 decorative block with `d` as the functional/shootable tile:
```
def
ghi
jkl
```
Place it away from the main flight path (e.g. in a side alcove) and consider
guarding it with a bunker so destroying it takes deliberate effort.

---

## 5. Vertical shaft to the pod holder (real template, from `level4.def`)

A narrow vertical drop with wall on one side (`y`/`z`) and a wall (`|`) on the other, ending at the pod holder (`m` + `0`-`4`):
```
q}     zt
p|     yp
p|  m0 yp
p|  12 yp
p|  34 yp
```
- `|` and `}` here are just solid wall tiles (no special behavior) forming
  the straight side of the shaft.
- `y`/`z` form the dashed texture on the opposite wall.
- `m0`/`12`/`34` is the pod holder (see `LEVELS.md` "Pod holder note").

---

## 6. Fuel alcoves (real template, from `level1.def`/`level5.def`)

Fuel (`` ` ``) tucked below a slope, requiring a small detour to grab:
```
r   `a
qr   bc
ppppppp
```
`a b c` here are just decorative wall tiles framing the fuel pickup — copy
the shape as-is.

- **Clearance above fuel**: ensure at least **2 rows** of open (passable) space
  above the fuel depot's top row (`` ` ``/`a`). The ship needs room to hover
  over the depot while using the tractor beam to refuel. A fuel depot tucked
  into a 2-tile-deep niche with wall directly above it is unreachable.

---

## 7. Buttons & sliders (horizontal doors)

**Horizontal sliding doors** (from `level4.def`). The working barrier mechanic is
the `H`/`G` **door**, opened by **shooting** a button:
- Mark the door with `H` (left boundary) and `G` (right boundary) on the **same
  row**. Fill *every* cell between them with solid `p` and **nothing else** — the
  engine only recognizes a door when all in-between cells are exactly `p`.
- Stack `H…G` on consecutive rows using the **same columns** to make a taller
  door; the engine merges vertically-adjacent `H…G` rows into one door group.
- Place a button somewhere the ship can shoot it: `L` = button on a **left-facing**
  wall with `M` in the row below, `N` = button on a **right-facing** wall with `O` in the row below.
- **Shooting** the button opens the **nearest** door group (it slides open, then
  auto-closes after a short delay). Matching is purely by proximity — the button
  does *not* use a tag. No slider tiles are required. Just make sure the button
  is closest to the door it should control.
- there must be always exist a button above the sliding door and below, so you can open it from both sides.

Example from `level4.def` (a 3-row-tall door in columns 46 and 53):
```
ppppppppppppppppppppppppppppppppppppppppppppppHppppppGpppppppppppppppppppppppppppp
ppppppppppppppppppppppppppppppppppppppppppppppHppppppGpppppppppppppppppppppppppppp
ppppppppppppppppppppppppppppppppppppppppppppppHppppppGpppppppppppppppppppppppppppp
```
Button row (right-facing button, reachable from the open shaft next to it):
```
1Npppppppppppppppp
```

- **Door must span the entire corridor**: the `H…G` door must block the
  full width from left wall to right wall. There must be **no open space** on
  either side of the door — otherwise the ship can simply fly around it.
  All cells before `H` and after `G` on the same row must be solid wall.

**Notes:**
- Only **horizontal** doors are supported.
- The `@`–`K` "slider" tiles (including the `O` used decoratively in the original
  `level4.def`) are **inert** in the current engine — they render but never move.
  Don't rely on them; use `H`/`G` doors for anything functional.

---

## 8. General design tips

- **Vary the terrain**: alternate flat floors, slopes, and narrow passages
  rather than one big open rectangle.
- **Difficulty ramp**: start with open space and few bunkers, and narrow the
  passages / add more bunkers as the level progresses.
- **Fuel placement**: put fuel where the player has to slow down or detour
  slightly, not directly on the main path (too easy) and not impossibly out
  of the way (too hard). Always position them on solid flat ground with p-tiles.
- **Reactor placement**: put the reactor always on solid flat ground with p-tiles on the surface 
- **Bunker sightlines**: bunkers embedded in diagonal walls (section 2) create
  natural "gauntlet" sections; floor-mounted bunkers (section 3) work well to
  guard flat approach lanes.
- **Test early, test often**: import the pack after every significant change
  (see `LEVELS.md` "Import format for custom packs") rather than writing a
  full level blind.
- **Steal from the classics**: `dev/external-levelpacks/classic/level*.def`
  contains many more worked examples beyond what's templated here — grep them
  for any tile character you're unsure how to use.

## 9. Hard structural rules (not optional!)

These are enforced by the game engine (`src/ui/GameCanvas.jsx`) — breaking
them causes broken physics, softlocks, or an uncompletable level:

- **Matching left/right edges**: the ship (and the pod, while towed) wraps
  around horizontally when it flies off the left or right edge of the level
  (`crossingOffset` in `GameCanvas.jsx`). The terrain height/shape at column
  0 and at the last column must line up, otherwise the ship teleports into a
  wall on the opposite side and instantly dies. Keep the leftmost and
  rightmost few columns at the same floor/ceiling height.
- **at least one restart point (`*`)**: it is used as the
  ship's first spawn position . If you add multiple `*`, max two are allowed per respawn area one near the upper entrance of the area when you move the ship down, one near the lower boundary, for when you come pbackwith the pod docked. areas are separated by `#######` boundaries. The `*` must be placed in free space (not inside a wall, if the ship spawns inside terrain, it would immediately collide and  die). if there is only one respawn point in the area it serves for both directions.
- **Exactly one pod holder (`m` + surrounding `0`-`4` stand tiles)**: needed
  for the pod pickup/delivery mechanic that completes the level. Without an
  `m`, no pod is spawned.
- **Row width must match the header width**: every layout row is padded with
  spaces to the `width` value from line 0 of the header. Keep your rows at a
  consistent length in the source file to avoid confusing misalignment when
  editing (the engine pads automatically, but visually-misaligned source is
  error-prone to edit).
- **Level width should exceed the screen width** (`GAME_WIDTH` in
  `src/core/constants.js`) by a good margin — if the level is too narrow, the
  camera clamps to the level bounds and the wraparound edges become visible
  on screen at the same time, which looks broken.
- **No hard limit on bunkers/sliders/things**: unlike the original Amiga
  Thrust engine (which capped things at 32), this engine has no such cap —
  but too many active bunkers can still hurt performance/readability, so
  pace them deliberately rather than maxing them out.

- **Checkpoint `#######` must span wall-to-wall**: when a row contains `#`
  checkpoint tiles, they must fill the entire open corridor from the left
  wall to the right wall. Partial checkpoints leave gaps the ship can fly
  through, defeating the section boundary.
- **Fuel depot clearance**: at least **2 rows** of open (passable) space must
  exist directly above each fuel depot's top row (`` ` ``/`a`). Without this
  clearance the ship cannot hover over the depot to refuel.
- **Minimum corridor width**: any horizontal passage on the main path from `*`
  to `m` must be at least **3 tiles** wide. Narrower gaps may not accommodate
  the ship (radius 8px in 16px tiles), especially when towing the pod.
- **Door span**: `H…G` door rows must have solid wall on **both sides** of the
  door. The door must block the entire corridor — no open space beside it.

# prompt to generate level4 to 6

Du bist ein erfahrener Level-Designer für das Browser-Game CaveShuttle (eine moderne Interpretation von Amiga Thrust). Dein Ziel ist ein vollständiges, spielbares Level im `.def`-Format, das im Schwierigkeitsgrad und im visuellen Stil den klassischen Levels 4 bis 6 entspricht.

## Pflichtlektüre vor dem Generieren

Lies diese Dateien und Abschnitte zuerst vollständig. Der Prompt verwendet Begriffe, die dort definiert sind:

- `dev/LEVEL_DESIGN_GUIDE.md` – Abschnitte 1–9 (Steigungs-Paare, Bunker-Templates, Reaktor, Pod-Halter, Türen, harte Regeln).
- `LEVELS.md` – Dateiformat, Header-Struktur und Tile-Referenz.
- `src/levels/level-validator.js` – Die Regeln, die ein Level mechanisch spielbar machen (Erreichbarkeit von `m` aus `*`, keine abgeschlossenen Taschen, erreichbare Fuel-Depots, passende Ränder, etc.). Ausführung mit z.B. `node src/levels/level-validator.js public/levelpacks/default/level*.def`.
- `src/core/constants.js` – `GAME_WIDTH`, `POD_HOLDER_CHAR`, `GOD_MODE_TILE`, Farbwerte.
- `src/game/tile-renderer.js` – `isWall()` (char code >= 76 ist solide; `m`, `0`, `1`, `2` sind keine Wände).
- `src/ui/GameCanvas.jsx` – Kurzer Blick auf `loadLevel` (Fuel-Depot-Erkennung, Tür-/Button-Erkennung, Spawn-Logik).
- `dev/external-levelpacks/classic/level4.def`, `level5.def`, `level6.def` als konkrete Referenzlevel; orientiere dich an deren Breite, Aufbau und den bewährten Mustern.

## Arbeitsablauf (nicht überspringen)

1. Plane das Layout auf einem Gitter: 3–4 Sektionen von oben nach unten, Start `*`, Reaktor, Türen, Fuel-Depots, Pod-Halter `m` mit `0`–`4`.
2. Schreibe den Header (exakt 10 Zeilen) und das Layout.
3. Speichere das Ergebnis in `dev/level_generated_classic4to6.def`.
4. Führe aus:
   ```bash
   node src/levels/level-validator.js dev/level_generated_classic4to6.def
   ```
5. Wenn `ERROR` oder `WARN` auftreten, korrigiere das Layout und wiederhole 3–4, bis der Validator `OK` meldet.
6. Erst wenn der Validator `OK` meldet, gibst du das Ergebnis aus.

## Zielformat

Die ersten 10 Zeilen sind Metadaten im genauen Format. Breite und Höhe sind frei wählbar; das Beispiel zeigt klassische Werte:

```
155         ; width (lenx)
92          ; height (gesamte Zeilenzahl)
17          ; height of start (Sternen-/Himmel-Region)
5           ; height of empty space
25          ; height of bedrock
<R> <G> <B> ; background/tractor (Wandfarbe)
<R> <G> <B> ; gun/reactor/stand (Bunkerfarbe)
<R> <G> <B> ; pod/blip (Podfarbe)
<R> <G> <B> ; text (Textfarbe)
<R> <G> <B> ; shield (Schildfarbe)
```

- `width` und `height` können beliebig gewählt werden (Breite und Höhe sind nicht auf 82 beschränkt). Wähle Werte, die zur gewünschten Levelgröße passen.
- Jede Layout-Zeile muss exakt `width` Zeichen lang sein (aufgefüllt am rechten und linken Rand mit `p`).

**Wände und Höhlen:** Das gesamte Level ist fast ausschließlich mit `p` (Wand) gefüllt. Nur der einzelne, zusammenhängende Höhlengang besteht aus Leerzeichen (` `) und führt vom Start `*` oben bis zum Pod-Halter `m` unten. Es darf **nur einen** solchen Höhlengang geben; keine zusätzlichen, isolierten offenen Taschen oder Nebenräume. Alles, was kein Höhlengang ist, muss `p` sein.

- Ausgabe ausschließlich der `.def`-Datei in einer einzelnen Markdown-Code-Box (keine Erklärungen außerhalb), du darfst aber in den 10 Metadaten-Zeilen mit `;` kommentieren.

## Harte Regeln (keine Ausnahmen)

- Mindestens ein `*` (Start-/Respawn-Punkt) in freiem Raum oben; mehrere `*` sind erlaubt (maximal zwei pro `#######`-Respawn-Bereich). Das Level wird gewonnen, indem man mit dem Pod in den Himmel fliegt, nicht durch das `*`.
- Genau ein Pod-Halter `m` mit den Stand-Platten `0`, `1`, `2`, `3`, `4` (siehe `LEVEL_DESIGN_GUIDE.md` Abschnitt 5) tief unten. Die Zelle direkt über `m` muss frei (` `) sein, damit der Pod spawnen kann.
- Der linke und rechte Kartenrand jeder Zeile muss horizontal zusammenpassen (gleiche Boden-/Deckenhöhe), damit das Wrap-around nicht ins Terrain teleportiert.
- Jede Tür (`H` links, `G` rechts) muss auf derselben Zeile stehen und mit soliden `p`-Kacheln zwischen den Begrenzern gefüllt sein. Mehrere solcher Zeilen übereinander bilden eine größere Tür. Schaltflächen `L` (linke Wand) oder `N` (rechte Wand) müssen aus einem offenen Korridor heraus schießbar sein.
- Keine funktionalen `@`–`K`-Slider verwenden; sie sind inert.
- Bunker nur mit den bekannten dekorativen Gruppen (`P`/`Q`/`R`/`S`, `U`/`V`/`W`/`T`, `[`/`X`/`Y`/`Z`, `\`/`]`/`^`/`_`) und immer in Wände eingebettet, niemals schwebend.
- Reaktor: 3×3-Block `def`/`ghi`/`jkl` mit dem funktionalen Tile `d`. Muss auf `p`-Boden stehen, nicht frei in der Luft.
- Treibstoffdepots: 2×2-Gruppe aus `\`` (oben links), `a` (oben rechts), `b` (unten links), `c` (unten rechts) auf einem `p`-Boden. Mindestens fünf Stück; jedes muss vom `*` aus erreichbar sein.
- Keine schwebenden Wände, Bunker, Reaktoren oder Türen. Alles muss an einer `p`-Wand oder einem `p`-Boden befestigt sein.

## Gestaltungsziele (Orientierung an Classic 4-6)

- Oben offener Start, unten enger und gefährlicher; Pod-Halter tief, `*` hoch.
- Diagonale Höhlenwände mit den Steigungs-Paaren `qr`, `st`, `uv`, `wx`, `no`, `yz`, `|` aus dem Guide.
- Ein Reaktor in einer Seitennische, von einem Bunker bewacht.
- Mindestens eine Schiebetür `H…G` mit erreichbaren Knöpfen `L`/`N`.
- Mindestens fünf Treibstoffdepots in kleinen Nischen, die ein Abkreuzen erfordern.
- Bunker-Seitlinien bilden "Laufgang"-Sektionen.
- Grobe Struktur: Start oben → Reaktorseite → Kurvenpassagen → Türenpassage → Pod-Halter unten.

## Farben

- Wand: dunkel, z. B. ` 40  40  40` oder ` 80  60  40`.
- Bunker/Gun: rot/orange `164   0   0` oder `164  84  84`.
- Pod: grün/weiß `  0 164   0` oder `164 164 164`.
- Text: `  0 164 164`.
- Shield: `164  84  84`.

## Ausgabe

Gib NUR die fertige `.def`-Datei in einer einzelnen Markdown-Code-Box aus. Keine zusätzlichen Sätze, keine Klammern-Hinweise, keine Platzhalter, keine Erklärungen. Bevor du ausgibst, muss `node src/levels/level-validator.js dev/level_generated_classic4to6.def` auf der Datei `OK` melden.

## Qualitätsprüfung (muss erfüllt sein)

- [ ] Genau ein `*` (oder zwei `*` pro `#######`-Respawn-Bereich) und genau ein `m` mit `0`–`4`?
- [ ] Linker und rechter Rand jeder Zeile passen zusammen?
- [ ] Tür `H…G` ist nur mit `p` gefüllt; Knöpfe `L`/`N` sind aus dem Korridor erreichbar?
- [ ] Reaktor steht auf `p`-Boden; Treibstoffdepots (`\``/`a`/`b`/`c`) stehen auf `p`-Boden und sind vom `*` aus erreichbar?
- [ ] Alle Layout-Zeilen sind exakt `width` Zeichen lang?
- [ ] Pod-Halter ist tief, `*` hoch, und die Zelle über `m` ist frei?
- [ ] Keine schwebenden Elemente; Bunker, Reaktor und Türen sind an Wände/Böden angeschlossen?
- [ ] create a proper winding level with slopes, bunkers, and the complexity of classic 4-6.
- [ ] Checkpoint `#######` spans wall-to-wall (no gaps beside it)?
- [ ] Fuel depots have 2 rows of open space above for ship clearance?
- [ ] Corridor width is at least 3 tiles everywhere on the main path?
- [ ] Door `H…G` spans wall-to-wall (no open space beside the door)?
- [ ] `node src/levels/level-validator.js` meldet `OK`?
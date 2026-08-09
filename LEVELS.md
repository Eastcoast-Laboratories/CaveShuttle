# Level Format & Developer Notes

## Level Pack System
Levels are organized into **level packs**. Each pack contains:
- `meta.json` - Pack metadata (id, name, description, levelCount, author, version)
- `level1.def`, `level2.def`, ... - Level definition files

### Where packs are stored
- **Built-in packs**: `public/levelpacks/<pack-id>/` (included in build)
  - Default pack: `public/levelpacks/default/` (6 levels)
- **External / importable packs**: source `.def` files live in `dev/external-levelpacks/<pack-id>/`
  (e.g. `dev/external-levelpacks/classic/`). These are **not** loaded directly by the game.
- **Custom packs**: Imported by players, stored in localStorage (key: `app_installedPacks`)

### Important: importable packs use a bundled JSON, not the `.def` files
The classic (and any importable) pack is distributed as a single
`pack-for-import.json` (in `dev/external-levelpacks/<pack-id>/`). This JSON contains a
**copy of every level's `.def` content** under `levels`. When a player imports the pack,
the JSON is stored in localStorage and the level loader reads level content from there
(`local:<packId>` pseudo-URL), **never** from the `.def` files.

Consequence: editing the `.def` files alone does **not** change an imported pack. You must
also update `pack-for-import.json` and re-import the pack (localStorage entry
`app_installedPacks` must be refreshed). Keep the `.def` files and `pack-for-import.json`
in sync — the `.def` files are the human-editable source, the JSON is the shipped artifact.

### Workflow: changing a classic level
When you edit a classic level (e.g. `dev/external-levelpacks/classic/level3.def`):

1. **Edit the .def file** as usual
2. **Regenerate pack-for-import.json** (one-liner):
   ```bash
   node dev/build-pack-import.js dev/external-levelpacks/classic
   ```
   This reads `meta.json` and all `level*.def` files and generates `pack-for-import.json`.
3. **Re-import the pack** in the game:
   - Delete the old "Classic Pack" from the hamburger menu (→ Delete)
   - Import the updated `dev/external-levelpacks/classic/pack-for-import.json` again

**Note:** The level editor loads classic levels directly from `dev/external-levelpacks/classic/`
via Vite's dev server (configured in `vite.config.js`). Only the import workflow requires regenerating `pack-for-import.json`.

### Pack loading
- Pack registry: `src/levels/levelpacks.js` (BUILTIN_PACKS, getAllPacks, registerCustomPack)
- Level loader: `src/levels/level-loader.js` (supports baseUrl parameter and `local:` pseudo-URLs)
- Progress storage: `src/core/progress-storage.js` (per-pack progress in localStorage)

### Import format for custom packs
Custom packs are imported as a single JSON file:
```json
{
  "meta": {
    "id": "my-pack",
    "name": "My Custom Pack",
    "description": "Description",
    "levelCount": 3,
    "author": "Player",
    "version": "1.0"
  },
  "levels": {
    "level1": "<full .def content as string>",
    "level2": "<full .def content as string>",
    "level3": "<full .def content as string>"
  }
}
```
Import validation: `src/levels/level-pack-import.js`

### Collision protection
Built-in pack IDs cannot be overwritten by custom imports. Attempting to import a pack with a duplicate ID to a built-in pack will fail.

## File format (`.def`)
Each level file (`levelN.def`) follows this format. The first **10 lines are metadata**, the rest is the tile layout.

```
82          ; line 0: width  (tiles)        -> used as lenx
60          ; line 1: height (tiles)
17          ; line 2: height of start       -> star/sky region
5           ; line 3: height of empty space
25          ; line 4: height of bedrock
189 24  33  ; line 5: palette background/tractor (R G B)
 24 211 24  ; line 6: palette gun/reactor/stand
 24 211 24  ; line 7: palette pod/blip
  0 164  0  ; line 8: palette text
 49 231 198 ; line 9: palette shield
<layout rows start at line 10>
```

- Each layout row is padded to `width` with spaces; rows are 16px tiles (`scaledSize = 16`).
- Trailing empty lines are stripped; space-only rows are kept (they are sky).
- Everything after a `;` on the palette lines is treated as a comment and ignored during parsing
  (`GameCanvas.jsx` splits each color line on `;` before reading the RGB values).

### Color theme application
- **Wall/terrain color** (palette background line): applied by `TileRenderer.setLevelColors()`,
  which recolors only the palette indices used by the terrain tiles (`p q r s t`). Other tiles
  (bunkers, fuel, reactor) keep their original palette colors.
- **Canvas background, shield, bunker, pod** colors are applied directly in `GameCanvas.jsx`
  from the parsed `levelColors` state.

## Tile characters
| Char | Meaning |
|------|---------|
| (space) | empty / sky |
| `*` | restart point |
| `` ` `` | fuel |
| `m` | pod start marker — see note below |
| `0`–`4` | pod holder / stand |
| `p` | ground — solid flat platform tile (fully filled block) |
| `|`, `y` | ground — solid flat platform tile (fully filled block) |
| `q` `r` | ground — 2-tile pair forming a shallow-looking staircase descending to the **right** (`q` = upper-left step, `r` = lower-right step). Repeat the pair, shifting **two columns** (the pair's own width) right each row, to build a long down-right slope. |
| `s` `t` | ground — 2-tile pair forming a shallow-looking staircase descending to the **left** (`s` = upper-right step, `t` = lower-left step). Mirror image of `q`/`r`; repeat shifting **two columns** left each row for a down-left slope. |
| `n` `o` | ground — staircase pair with a **steeper-looking** diagonal face, descending to the **right** (used for long cave floors). Same footprint as `q`/`r` — repeat the `no` pair shifting 2 columns right per row. |
| `u` `v` | ground — steep tunnel-wall pair used to carve a diagonal wall descending to the **left** (the "outer" wall of a cave/tunnel that opens towards a bunker on its **right**; solid rock is on the left of the pair). Repeat shifting **2 columns left** per row. Commonly followed directly by a right-facing bunker marker (`[` or `U`) once the wall reaches its target depth. |
| `w` `x` | ground — mirror of `u`/`v`: diagonal wall descending to the **right** (solid rock on the right of the pair; the open cave is on the left, where a left-facing `\` bunker sits). Repeat shifting **2 columns right** per row. |
| `y` `|` | ground — half-width vertical dashed wall texture (no slope), used to texture straight vertical walls, that are not a full-cell-width wall. |
| `z` `}` | ground — half height, half-width in the lower half of a cell, dashed wall texture (no slope), used on corners to down-leading straight vertical walls that are not a full-cell-width wall. |
| `#` | invisible respawn/checkpoint trigger — when the ship flies over it, it becomes the new respawn position (needs at least one `*` restart point to exist in the level). |
| `d` | power plant marker — the actual functional/shootable part of the reactor. |
| `e f g h i j k l` | power plant body — purely decorative tiles that make up the visual 3×3 reactor block together with `d` (see template below). They have no collision/gameplay effect beyond being solid walls. |
| `L N` | door buttons — `L` = button mounted on a **left-facing** wall, `N` = button mounted on a **right-facing** wall. Shooting a button opens a door (see `H`/`G` below). The character directly before the button (`temp[x-1]`) is stored as a `tag`, but the current engine (`GameCanvas.jsx`) matches each button to the **nearest door group by distance**, *not* by tag — the tag is currently unused. |
| `H` `G` | door boundaries — `H` = left edge, `G` = right edge of a horizontal sliding door. Fill every cell **between** them with solid `p` (nothing else) to form the door leaf; stack `H…G` on consecutive rows in the **same columns** to make a taller door. Shooting the nearest button slides the door open, then it auto-closes after a delay. |
| `@`–`K` | sliders (**legacy / inert**) — in the original engine these were moving blocker segments (`@`/`A`/`B` = `\`-diagonal group, `C`/`D`/`E` = `/`-diagonal group, `F`/`G`/`H` = `\|`-vertical group, `I`/`J`/`K` = `-`-horizontal group). In the current JS engine (`GameCanvas.jsx`) these tiles are still recognized (char codes 64–75) and drawn, but they are **never wired to buttons or collision** — they don't move. Use the `H`/`G` door mechanic above for working barriers. |
| `P` `U` `[` `\` | bunkers (rocket turrets) — the only 4 functional bunker markers, one per firing direction. These are the actual "thing" that shoots at the ship. |
| `Q R S` / `V W T` / `X Y Z` / `] ^ _` / `a b c` | bunker housing / rubble — purely decorative wall tiles used to sculpt the mound or turret housing around a bunker marker. They have no special behavior (just solid walls); always copy them from a working example (see templates below) rather than inventing new combinations. |

## Collision
- The actual in-game renderer is `src/game/tile-renderer.js` (`TileRenderer`), tileset in `public/assets/blocks.json`.
- A tile counts as a **wall** when its char code is `>= 76` (`TileRenderer.isWall`).
- **Every terrain/slope tile is a full 16px solid block for collision.** The `q r s t u v w x n o y | z }` "slopes" differ from plain `p` only in their *pixel shading* (the tileset in `public/assets/blocks.json` just tints part of the 8×8 sprite). Geometrically they are all full squares, so a diagonal wall built from them collides as a **blocky staircase**, not a smooth ramp — the ship cannot slide along it.

## Pod holder note (important)
- The pod holder marker is defined by `POD_HOLDER_CHAR` in `src/core/constants.js` (default: `'1'`, originally `'m'`).
- The pod holder characters (`m`, `0`, `1`, `2`) stay in the level files but are **rendered as space** in the game
  to avoid collision issues. Only the stand tiles (`3` and `4`) are rendered normally.
- The pod start position is the marker position minus `POD_HOLDER_OFFSET` (constants).

## Key constants
- Pod physics & rendering: `src/core/constants.js` (`POD_*`).

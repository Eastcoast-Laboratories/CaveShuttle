# CaveShuttle Level Editor

A web-based level editor for CaveShuttle level packs, embedded in the game via an iframe.

## Architecture

The editor runs inside an iframe (`/public/level-editor/index.html`) embedded in the React `LevelEditor.jsx` component. Communication between the React parent and the iframe happens via `postMessage`:

- **Language changes**: React sends `SET_LANGUAGE` messages; the iframe's `i18n.js` applies translations.
- **Level packs**: React sends `SET_LEVEL_PACKS` with all available packs (built-in + imported), including level content for local packs so the iframe can load them without server fetch.
- **Test level**: The iframe sends `EDITOR_TEST` back to React to launch the game with the current level.

## Level Generator Parameters

The "Generate" button creates a random level using the parameters in the
"Level Parameters" section. Here is what each parameter does:

### Grid Parameters (affect the level file header)

- **Width** — Total width of the level grid in tiles (max 200). The generator adds a
  100-tile right-side surface hill, so the final level is wider than this
  value. Minimum 140 for generation (smaller values are auto-increased).
- **Height** — Total height of the level grid in tiles (max 300). Determines how deep
  the cave extends from sky to floor.
- **Empty Space** — Vertical offset for empty space above the terrain
  (written to the `.def` header as `emptySpaceHeight`). Controls star field
  density in the sky. Negative values raise the terrain; positive values
  lower it.
- **Bedrock** — Height of the indestructible bedrock layer at the bottom
  (written to the `.def` header as `bedrockHeight`). The game generates
  this many rows of solid wall tiles below the level grid as floor.

### Generator Parameters (control feature placement)

- **Bunkers** — Target number of bunkers to place. The generator tries to
  place this many bunkers across all corridors. Multiple bunkers can be
  placed per corridor at different horizontal positions. If the level is
  too small to fit all requested bunkers, the generator gets as close as
  possible (best-effort after 200 retry attempts).
- **Fuel** — Target number of fuel depots to place. Same multi-placement
  logic as bunkers: multiple fuel depots per corridor, best-effort fallback.
- **Bunker Chance** — Probability (0.0–1.0) that a given bunker placement
  attempt succeeds. If left empty while a bunker count is specified, defaults
  to 1.0 (try to place every bunker). If no count is specified, defaults to
  0.5 (random placement).
- **Fuel Chance** — Probability (0.0–1.0) that a given fuel placement attempt
  succeeds. Same defaulting logic as Bunker Chance (1.0 with count, 0.55
  without).

### Pod Color

- **Pod R / G / B** — RGB color values (0–255) for the pod/blip color in the
  level header. Controls the on-screen color of the pod and navigation blip.

### How Generation Works

1. A grid of wall tiles (`p`) is created at the specified Width × Height.
2. A winding path is carved from the sky (top) to the pod chamber (bottom),
   alternating between full-width horizontal corridors and narrower vertical
   shafts.
3. The pod is placed at the bottom with an open cell above it.
4. Features are placed along corridors: bunkers (ceiling and floor, left and
   right sides), fuel depots, reactors, and doors with buttons in shafts.
5. Decorative slopes are added to corridors without bunkers.
6. A 100-tile right-side surface hill is appended, then columns are rotated
   so the surface appears on the left edge (horizontal wraparound).
7. The result is validated; if invalid or the feature counts don't match,
   a new seed is tried (up to 1000 attempts, best-effort after 200).
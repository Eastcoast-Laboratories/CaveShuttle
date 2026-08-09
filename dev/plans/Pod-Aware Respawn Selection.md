# Pod-Aware Respawn Selection

Fix respawn so that, within a flood-filled area bounded by `#######`, the ship respawns at the **entrance `*`** when the pod is not docked and at the **lower-boundary `*`** when the pod is docked, choosing the euclidean-nearest candidate when needed.

## Root cause
`findRespawnInRegion` currently returns the euclidean-nearest `*` among all reachable respawn points in the flood region, ignoring pod state. Areas may legitimately contain **two** `*` (top = entrance, bottom = lower boundary). This makes respawn land on the wrong `*` (e.g. area 0 in `level3.def` has `*` at L11 and L42). The `#` boundaries are correct; only the selection logic is wrong.

## Intended rule (from LEVEL_DESIGN_GUIDE.md)
- Areas are separated by `#######` boundaries (already working; `#` is a logical, non-physical boundary).
- Up to two `*` per area: one near the entrance (top, small y), one near the lower boundary (bottom, large y).
- Respawn selection:
  - **Not docked** (descending to fetch pod) -> entrance `*` (upper).
  - **Docked** (returning with pod) -> lower-boundary `*` (lower).
  - If the area has only **one** `*`, use it for both cases.
  - Among role-matching candidates, pick the one **nearest** to the death point in both x and y (euclidean).

## Changes (single file: `src/ui/GameCanvas.jsx`)

### 1. `findRespawnInRegion(startX, startY, wasDocked)`
- Add `wasDocked` parameter.
- Keep the BFS flood-fill collecting all reachable `*` into `found[]` (unchanged).
- Replace the "closest overall" selection with role-based selection:
  - If `found.length <= 1`: use `found[0]`.
  - Else split by role using vertical position:
    - Determine the region's `*` set; the **upper role** = smaller `y`, **lower role** = larger `y`.
    - `wasDocked === true` -> candidates = lower `*`(s); else -> upper `*`(s).
    - Concretely: if docked, target the max-`y` `*`; if not docked, target the min-`y` `*`.
    - When multiple share the extreme role (rare / >2 stars), tie-break by euclidean distance (x and y) to the death point.
- Keep existing `[RESPAWN_AREA]` logging; extend it to also log `wasDocked` and the chosen role (entrance/lower).

### 2. `respawnShipAndPod`
- Pass pod state into the finder: `findRespawnInRegion(ship.x, ship.y, podWasDockedRef.current)`.
- No other changes (ship reset to angle 0 + zero velocity and docked-pod-hangs-below already in place).

## Verification (level3.def, areas per user)
- Area 0 (above L47): `*` L11 (entrance) + `*` L42 (lower).
  - Die undocked anywhere in area 0 -> respawn at L11.
  - Die docked anywhere in area 0 -> respawn at L42.
- Area 1 (L47..L69 boundary) and Area 2 (below L69): single `*` -> unchanged behavior, works both docked/undocked.
- Cross-check against the user's logs: docked deaths in the middle region should resolve to the lower `*`; undocked deaths should resolve to the upper `*`.

## Notes / risks
- Vertical (min/max y) defines entrance vs lower boundary, matching the "move ship down / come back up" model; euclidean is only a tie-break.
- No level files are modified; the `#` boundaries in `level3.def` are already correct.
- Logging tags `[RESPAWN_AREA]` / `[RESPAWN_POD]` retained for continued diagnosis.

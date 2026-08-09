# Plan: Correctly use `SKY_FULL_STAR_DENSITY` and `SKY_DELIVERY_THRESHOLD`

Implement the star field and sky-delivery trigger so the lower bound is set by the level header, full density is reached at `SKY_FULL_STAR_DENSITY` above the level, and the delivery trigger sits `SKY_DELIVERY_THRESHOLD` above the full-density line.

## Confirmed semantics
- `height of empty space` (level header, `sy`): lower edge of the star field. `yBottom = -sy * 16` (capped at level floor). Density is 0 here.
- `SKY_FULL_STAR_DENSITY`: distance **above level top** where full density is reached. `yFullDensity = -SKY_FULL_STAR_DENSITY`. Density is 1 from here upwards.
- `SKY_DELIVERY_THRESHOLD`: distance **above `SKY_FULL_STAR_DENSITY`** where sky delivery triggers. `skyThreshold = -(SKY_FULL_STAR_DENSITY + SKY_DELIVERY_THRESHOLD)`.
- Stars continue to be generated above the delivery threshold, so the player flies through a full-density star field until reaching the threshold.

## Implementation
1. In `GameCanvas.jsx` star generation:
   - `yBottom = -sy * 16` capped at `levelHeightPx`
   - `yFullDensity = -SKY_FULL_STAR_DENSITY`
   - `yTop = -(SKY_FULL_STAR_DENSITY + SKY_DELIVERY_THRESHOLD + 400)` (extra margin above delivery threshold)
   - `density = clamp((yBottom - y) / (yBottom - yFullDensity), 0, 1)` for `y < yBottom`
   - Filter in-level candidates (`y >= 0`) to empty space cells.
2. In `GameCanvas.jsx` sky-delivery check:
   - `skyThreshold = -(SKY_FULL_STAR_DENSITY + SKY_DELIVERY_THRESHOLD)`
3. Update `constants.js` comment for `SKY_DELIVERY_THRESHOLD` to remove ambiguity.

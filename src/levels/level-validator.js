// JS port of dev/validate_levels.py for validating CaveShuttle .def levels.
// Can be used in the browser level editor (validateLevel) or on raw .def text (validateDef).
//
// How it works:
//   validateDef() parses .def text, strips the 10-line header, and calls
//   validateLevel() with the layout grid. validateLevel() checks:
//     - Start position ('*') exists and all open cells are reachable from it.
//     - No disconnected open regions (areas cut off by walls/slopes).
//     - Features (bunkers, reactors, buttons) are reachable from the start.
//     - Doors (H/G) have at least one reachable button (L/N) to open them.
//     - Corridor width: warns if any open span is narrower than MIN_CORRIDOR_WIDTH.
//     - Checkpoint '#' boundaries: horizontal runs of 2+ '#' must be wall-bounded
//       or connect to '#' in adjacent rows (diagonal/staircase boundaries are valid).
//     - Fuel depot clearance: 2 rows of open space above, wall directly below.
//     - Floating structure detection: bunkers, reactors, pod holders must have
//       wall contact around their bounding box (no structures floating in open air).
//     - Slope continuity: qr/st slopes require wall below, uv/wx require wall above.
//   All row numbers in errors/warnings include HEADER_LINES offset so they
//   match the actual line numbers in the .def file.

const FUEL_TILE = String.fromCharCode(96); // backtick
const HEADER_LINES = 10;
const BUNKER_TILES = ['P', 'U', '[', '\\'];
const FEATURE_TILES = ['P', 'U', '[', '\\', 'd', 'L', 'N'];
const SLOPE_TILES = ['q', 'r', 's', 't', 'u', 'v', 'w', 'x'];
const MIN_RESPAWN_OBSTACLE_DISTANCE_BELOW = 4;
const MIN_RESPAWN_HORIZONTAL_CLEARANCE = 4;

export function validateLevel(level) {
  const errors = [];
  const warnings = [];
  const inventory = {};

  if (!level || !level.layout || level.layout.length === 0) {
    errors.push('Level must have a layout');
    return { valid: false, errors, warnings, inventory };
  }

  // Accept either a 2D array (editor) or an array of strings (.def lines).
  let rawLayout = level.layout.map(row => (Array.isArray(row) ? row.join('') : String(row)));
  while (rawLayout.length > 0 && rawLayout[rawLayout.length - 1] === '') {
    rawLayout.pop();
  }

  const width = level.width || (rawLayout[0] ? rawLayout[0].length : 0);
  const targetHeight = level.height || rawLayout.length;
  const padded = rawLayout.slice(0, targetHeight).map(row => row.padEnd(width, ' ').slice(0, width));
  while (padded.length < targetHeight) {
    padded.push(' '.repeat(width));
  }
  const h = padded.length;

  // Row width consistency
  for (let y = 0; y < rawLayout.length; y++) {
    if (rawLayout[y].length > width) {
      errors.push(`row ${y + HEADER_LINES} longer (${rawLayout[y].length}) than header width ${width}`);
    }
  }

  function isWall(tile) {
    if (tile === ' ' || tile === 'm' || tile === '0' || tile === '1' || tile === '2') {
      return false;
    }
    // 'à' is a hidden wall passage and must not block paths
    if (tile === 'à') return false;
    if (tile === undefined || tile === null) return false;
    // Steep slope tiles are solid
    if (tile === '$' || tile === '%' || tile === '(' || tile === ')') return true;
    return tile.charCodeAt(0) >= 76;
  }

  const key = (y, x) => `${y},${x}`;

  // Detect door leaf cells (H..G on a row with only p between).
  const doorCells = new Set();
  const doorGroups = [];
  for (let y = 0; y < h; y++) {
    const r = padded[y];
    const hs = [];
    const gs = [];
    for (let x = 0; x < width; x++) {
      if (r[x] === 'H') hs.push(x);
      if (r[x] === 'G') gs.push(x);
    }
    for (const hc of hs) {
      for (const gc of gs) {
        if (gc > hc + 1) {
          let allP = true;
          for (let c = hc + 1; c < gc; c++) {
            if (r[c] !== 'p') {
              allP = false;
              break;
            }
          }
          if (allP) {
            for (let c = hc; c <= gc; c++) {
              doorCells.add(key(y, c));
            }
            doorGroups.push({ y, hc, gc });
          }
        }
      }
    }
  }

  function passable(y, x) {
    const ch = padded[y][x];
    return !isWall(ch) || ch === FUEL_TILE || doorCells.has(key(y, x));
  }

  // Door / slider groups must be exactly three rows thick and have open passages
  // directly above and below the 3-row block. Each detected H/G row is checked:
  // it must be part of a 3-row run, and the middle row of that run is validated.
  const doorGroupKeySet = new Set(doorGroups.map(g => `${g.y},${g.hc},${g.gc}`));
  const hasDoorGroup = (y, hc, gc) => y >= 0 && y < h && doorGroupKeySet.has(`${y},${hc},${gc}`);
  for (const { y, hc, gc } of doorGroups) {
    const middle = hasDoorGroup(y - 1, hc, gc) && hasDoorGroup(y + 1, hc, gc);
    const top = hasDoorGroup(y + 1, hc, gc) && hasDoorGroup(y + 2, hc, gc);
    const bottom = hasDoorGroup(y - 1, hc, gc) && hasDoorGroup(y - 2, hc, gc);
    if (!middle && !top && !bottom) {
      errors.push(`slider at row ${y + HEADER_LINES} col ${hc} is not part of a valid 3-row H...G block`);
      continue;
    }
    // Only validate the block once, from its middle row.
    if (!middle) continue;

    let threeRowsOk = true;
    for (const dy of [-1, 1]) {
      const ry = y + dy;
      if (padded[ry][hc] !== 'H' || padded[ry][gc] !== 'G') { threeRowsOk = false; break; }
      for (let c = hc + 1; c < gc; c++) {
        if (padded[ry][c] !== 'p') { threeRowsOk = false; break; }
      }
      if (!threeRowsOk) break;
    }
    if (!threeRowsOk) {
      errors.push(`slider at row ${y + HEADER_LINES} col ${hc} is not three rows thick with H...G on each row`);
      continue;
    }

    let passageOk = true;
    for (const dy of [-2, 2]) {
      const ry = y + dy;
      if (ry < 0 || ry >= h) { passageOk = false; break; }
      for (let c = hc; c <= gc; c++) {
        if (padded[ry][c] === 'p') { passageOk = false; break; }
      }
      if (!passageOk) break;
    }
    if (!passageOk) {
      errors.push(`slider at row ${y + HEADER_LINES} col ${hc} has no open passage above and below the 3-row block`);
      continue;
    }

    // Each slider must have a button above and below it on the adjacent wall.
    // Right-facing wall (right side of the shaft) uses N with O directly below;
    // left-facing wall (left side) uses L with M directly below.
    const leftWall = hc - 1;
    const rightWall = gc + 1;
    const checkPair = (btn, mark, wx, by) =>
      by >= 0 && by + 1 < h &&
      padded[by][wx] === btn &&
      padded[by + 1][wx] === mark;
    const checkSide = (btn, mark, wx) =>
      wx >= 0 && wx < width &&
      checkPair(btn, mark, wx, y - 2) &&
      checkPair(btn, mark, wx, y + 2);
    const rightOk = checkSide('N', 'O', rightWall);
    const leftOk = checkSide('L', 'M', leftWall);
    if (!rightOk && !leftOk) {
      errors.push(`slider at row ${y + HEADER_LINES} col ${hc} is missing buttons above and below (need N/O on right wall or L/M on left wall)`);
    }
  }

  const stars = [];
  const ms = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < width; x++) {
      const ch = padded[y][x];
      if (ch === '*') stars.push([y, x]);
      if (ch === 'm') ms.push([y, x]);
    }
  }

  if (stars.length === 0) {
    errors.push("expected at least one '*', found 0");
  }
  if (ms.length !== 1) {
    errors.push(`expected exactly one cargo pod holder 'm', found ${ms.length}`);
  }

  // Respawn stars must have at least MIN_RESPAWN_OBSTACLE_DISTANCE_BELOW rows
  // of free space below them (no walls, slopes, or closed door cells).
  function isObstacle(tile) {
    return !isWall(tile) ? false
      : (tile === ' ' || tile === 'm' || tile === '0' || tile === '1' || tile === '2' || tile === '#') ? false
      : true;
  }
  function isObstacleCell(y, x) {
    if (y < 0 || y >= h || x < 0 || x >= width) return true;
    if (doorCells.has(key(y, x))) return true;
    const ch = padded[y][x];
    return isObstacle(ch);
  }
  for (const [y, x] of stars) {
    let free = 0;
    for (let dy = 1; dy <= MIN_RESPAWN_OBSTACLE_DISTANCE_BELOW; dy++) {
      if (isObstacleCell(y + dy, x)) break;
      free++;
    }
    if (free < MIN_RESPAWN_OBSTACLE_DISTANCE_BELOW) {
      errors.push(`respawn point '*' at row ${y + HEADER_LINES} col ${x} has only ${free} free row(s) below (need at least ${MIN_RESPAWN_OBSTACLE_DISTANCE_BELOW} rows above any obstacle/slider)`);
    }
    let freeLeft = 0;
    let freeRight = 0;
    for (let d = 1; d <= MIN_RESPAWN_HORIZONTAL_CLEARANCE; d++) {
      if (!isObstacleCell(y, x - d)) freeLeft++;
      else break;
    }
    for (let d = 1; d <= MIN_RESPAWN_HORIZONTAL_CLEARANCE; d++) {
      if (!isObstacleCell(y, x + d)) freeRight++;
      else break;
    }
    if (freeLeft < MIN_RESPAWN_HORIZONTAL_CLEARANCE || freeRight < MIN_RESPAWN_HORIZONTAL_CLEARANCE) {
      errors.push(`respawn point '*' at row ${y + HEADER_LINES} col ${x} has only ${freeLeft} left / ${freeRight} right free cell(s) (need at least ${MIN_RESPAWN_HORIZONTAL_CLEARANCE} cells on each side before any obstacle/slider)`);
    }
  }

  // Respawn separators: every '#' row must have a '*' below it, and every
  // '#' row from the second one downwards must also have a '*' above it. The
  // star does not need to be directly adjacent: it can be pushed into the
  // adjacent corridor, e.g. two rows below a slider. The star must be within
  // the same shaft column range.
  const MAX_RESPAWN_STAR_SEARCH = 15;
  const separatorRows = [];
  for (let y = 0; y < h; y++) {
    let minX = -1, maxX = -1;
    for (let x = 0; x < width; x++) {
      if (padded[y][x] === '#') {
        if (minX < 0) minX = x;
        maxX = x;
      }
    }
    if (minX >= 0) separatorRows.push({ y, minX, maxX });
  }
  separatorRows.sort((a, b) => a.y - b.y);
  function hasStarInRange(startRow, minX, maxX, direction) {
    let row = startRow;
    for (let d = 0; d < MAX_RESPAWN_STAR_SEARCH; d++) {
      if (row < 0 || row >= h) return false;
      for (let x = minX; x <= maxX; x++) if (padded[row][x] === '*') return true;
      row += direction;
    }
    return false;
  }
  for (let i = 0; i < separatorRows.length; i++) {
    const { y, minX, maxX } = separatorRows[i];
    if (!hasStarInRange(y + 1, minX, maxX, +1)) {
      errors.push(`separator row at ${y + HEADER_LINES} col ${minX}-${maxX} must have a '*' below it`);
    }
    if (i > 0 && !hasStarInRange(y - 1, minX, maxX, -1)) {
      errors.push(`separator row at ${y + HEADER_LINES} col ${minX}-${maxX} must have a '*' above it (separator ${i + 1})`);
    }
  }

  // Horizontal wraparound safety
  for (let y = 0; y < h; y++) {
    const left = padded[y][0];
    const right = padded[y][width - 1];
    const safe = (isWall(left) && isWall(right)) || left === right;
    if (!safe) {
      errors.push(`row ${y + HEADER_LINES}: open edge mismatch left '${left}' / right '${right}' (wraparound unsafe)`);
      break;
    }
  }

  // Pod holder stands 0-4 should surround the m.
  if (ms.length > 0) {
    const [my, mx] = ms[0];
    let near = '';
    for (let y = my; y < Math.min(my + 3, h); y++) {
      for (let x = mx; x < Math.min(mx + 2, width); x++) {
        near += padded[y][x];
      }
    }
    for (const d of '01234') {
      if (!near.includes(d)) {
        warnings.push(`cargo pod holder missing stand tile '${d}' near m@${my},${mx}`);
      }
    }
  }

  // Completability: flood fill from '*', must reach m.
  if (stars.length > 0 && ms.length > 0) {
    const start = stars[0];
    const seen = new Set();
    seen.add(key(...start));
    const q = [start];
    while (q.length > 0) {
      const [y, x] = q.shift();
      for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny >= 0 && ny < h && nx >= 0 && nx < width && !seen.has(key(ny, nx)) && passable(ny, nx)) {
          seen.add(key(ny, nx));
          q.push([ny, nx]);
        }
      }
    }

    if (!seen.has(key(...ms[0]))) {
      errors.push("cargo pod holder 'm' is NOT reachable from '*' (level uncompletable)");
    } else {
      const [my, mx] = ms[0];
      if (my - 1 >= 0 && isWall(padded[my - 1][mx])) {
        errors.push("cell directly above cargo pod holder 'm' is a wall (cargo pod spawns into rock)");
      }
    }

    // No sealed open pockets
    const pocketSeen = new Set(seen);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < width; x++) {
        if (pocketSeen.has(key(y, x)) || !passable(y, x)) continue;
        const comp = [];
        const dq = [[y, x]];
        pocketSeen.add(key(y, x));
        while (dq.length > 0) {
          const [cy, cx] = dq.shift();
          comp.push([cy, cx]);
          for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const ny = cy + dy;
            const nx = cx + dx;
            if (ny >= 0 && ny < h && nx >= 0 && nx < width && !pocketSeen.has(key(ny, nx)) && passable(ny, nx)) {
              pocketSeen.add(key(ny, nx));
              dq.push([ny, nx]);
            }
          }
        }
        if (comp.length >= 1) {
          const [ey, ex] = comp[0];
          errors.push(
            `disconnected open region of ${comp.length} cells not reachable from '*' at row ${ey + HEADER_LINES}, col ${ex}`
          );
        }
      }
    }

    // Functional features must be reachable from the corridor.
    const touchesMain = (y, x) => {
      if (seen.has(key(y, x))) return true;
      for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny >= 0 && ny < h && nx >= 0 && nx < width && seen.has(key(ny, nx))) {
          return true;
        }
      }
      return false;
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < width; x++) {
        const ch = padded[y][x];
        if (ch === FUEL_TILE && !seen.has(key(y, x))) {
          errors.push(`fuel ${FUEL_TILE} at row ${y + HEADER_LINES} col ${x} not reachable from *`);
        } else if (FEATURE_TILES.includes(ch) && !touchesMain(y, x)) {
          errors.push(`feature '${ch}' at row ${y + HEADER_LINES} col ${x} has no open neighbour reachable from * (cannot be shot/used)`);
        }
      }
    }

    // Doors need a reachable button.
    if (doorCells.size > 0) {
      let hasReachableButton = false;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < width; x++) {
          if ((padded[y][x] === 'L' || padded[y][x] === 'N') && touchesMain(y, x)) {
            hasReachableButton = true;
          }
        }
      }
      if (!hasReachableButton) {
        errors.push('door(s) present but no reachable button (L/N) to open them');
      }
    }

    // Minimum corridor width: passable runs on main path must be >= 3 tiles
    const MIN_CORRIDOR_WIDTH = 3;
    for (let y = 0; y < h; y++) {
      let runStart = -1;
      for (let x = 0; x <= width; x++) {
        const isPassable = x < width && seen.has(key(y, x));
        if (isPassable && runStart < 0) runStart = x;
        if (!isPassable && runStart >= 0) {
          const runLen = x - runStart;
          if (runLen < MIN_CORRIDOR_WIDTH) {
            const leftBounded = runStart > 0 && isWall(padded[y][runStart - 1]);
            const rightBounded = x < width && isWall(padded[y][x]);
            if (leftBounded && rightBounded) {
              warnings.push(`row ${y + HEADER_LINES}: corridor only ${runLen} tiles wide at cols ${runStart}-${x - 1} (minimum ${MIN_CORRIDOR_WIDTH} recommended)`);
            }
          }
          runStart = -1;
        }
      }
    }
  }

  // Checkpoint '#' validation: horizontal runs (2+ consecutive '#') must be
  // bounded by a wall on at least one side, or connect to '#' tiles in an
  // adjacent row (diagonal/staircase boundaries). Vertical '#' boundaries
  // (single column across rows) and corner turns are valid and not warned.
  for (let y = 0; y < h; y++) {
    const r = padded[y];
    if (!r.includes('#')) continue;
    let runStart = -1;
    for (let x = 0; x <= width; x++) {
      if (x < width && r[x] === '#') {
        if (runStart === -1) runStart = x;
      } else {
        if (runStart !== -1) {
          const runEnd = x - 1;
          const runLen = runEnd - runStart + 1;
          if (runLen >= 2) {
            const leftBounded = runStart > 0 && isWall(r[runStart - 1]);
            const rightBounded = runEnd < width - 1 && isWall(r[runEnd + 1]);
            // Check if this run connects to '#' in adjacent rows (diagonal boundary)
            let connectsVertically = false;
            for (let cx = runStart - 1; cx <= runEnd + 1; cx++) {
              if (cx < 0 || cx >= width) continue;
              if (y > 0 && padded[y - 1][cx] === '#') { connectsVertically = true; break; }
              if (y < h - 1 && padded[y + 1][cx] === '#') { connectsVertically = true; break; }
            }
            if (!leftBounded && !rightBounded && !connectsVertically) {
              warnings.push(`row ${y + HEADER_LINES}: checkpoint '#' run at cols ${runStart}-${runEnd} has open space on both sides (should span wall-to-wall or connect to vertical boundary)`);
            }
          }
          runStart = -1;
        }
      }
    }
  }

  // Fuel depot clearance: at least 2 rows of open space above
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < width - 1; x++) {
      if (padded[y][x] === FUEL_TILE && padded[y][x + 1] === 'a') {
        if (y < 2) {
          errors.push(`fuel depot at row ${y + HEADER_LINES} col ${x}: needs at least 2 rows of open space above`);
          continue;
        }
        for (let dy = 1; dy <= 2; dy++) {
          for (let dx = 0; dx <= 1; dx++) {
            if (isWall(padded[y - dy][x + dx])) {
              errors.push(`fuel depot at row ${y + HEADER_LINES} col ${x}: wall at row ${y - dy + HEADER_LINES} col ${x + dx} blocks required 2-row clearance above`);
            }
          }
        }
        // Fuel depot must have wall directly below the bc row
        if (y + 2 < h && !isWall(padded[y + 2][x]) && !isWall(padded[y + 2][x + 1])) {
          errors.push(`fuel depot at row ${y + HEADER_LINES} col ${x}: no wall below (floating structure)`);
        }
      }
    }
  }

  // Floating structure detection: bunkers, reactors, and pod holders must
  // have at least one wall tile adjacent (including diagonally) to their
  // bounding box. Otherwise the structure is floating in open air.
  const STRUCTURE_TILES = new Set([
    ...BUNKER_TILES, 'V', 'W', 'X', 'Y', 'Z', '^', '_',
    'Q', 'R', 'S', 'T',
    'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
    'm', '0', '1', '2', '3', '4',
  ]);
  const visited = new Set();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < width; x++) {
      if (!STRUCTURE_TILES.has(padded[y][x]) || visited.has(key(y, x))) continue;
      // Flood-fill connected structure tiles
      const comp = [];
      const queue = [[y, x]];
      let minY = y, maxY = y, minX = x, maxX = x;
      while (queue.length > 0) {
        const [cy, cx] = queue.shift();
        if (visited.has(key(cy, cx))) continue;
        visited.add(key(cy, cx));
        comp.push([cy, cx]);
        minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
        minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
        for (const [dy, dx] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const ny = cy + dy, nx = cx + dx;
          if (ny >= 0 && ny < h && nx >= 0 && nx < width &&
              STRUCTURE_TILES.has(padded[ny][nx]) && !visited.has(key(ny, nx))) {
            queue.push([ny, nx]);
          }
        }
      }
      // Check for wall contact around the bounding box (including diagonals)
      let hasWallContact = false;
      for (let cy = minY - 1; cy <= maxY + 1; cy++) {
        for (let cx = minX - 1; cx <= maxX + 1; cx++) {
          if (cy < 0 || cy >= h || cx < 0 || cx >= width) continue;
          if (isWall(padded[cy][cx])) { hasWallContact = true; break; }
        }
        if (hasWallContact) break;
      }
      if (!hasWallContact) {
        errors.push(`structure at row ${minY + HEADER_LINES} col ${minX} (tiles: ${comp.map(([cy, cx]) => padded[cy][cx]).join('')}) is floating — no wall contact around bounding box`);
      }
    }
  }

  // Slope continuity: prevent jagged edges.
  // qr/st slopes descend into the corridor — open space above is valid (corridor),
  //   but a wall is required directly below.
  // uv/wx slopes retreat from the corridor — open space below is valid (corridor),
  //   but a wall is required directly above.
  const SLOPES_REQUIRE_WALL_BELOW = ['q', 'r', 's', 't', '$', '%'];
  const SLOPES_REQUIRE_WALL_ABOVE = ['u', 'v', 'w', 'x', '(', ')'];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < width; x++) {
      const tile = padded[y][x];
      if (SLOPES_REQUIRE_WALL_BELOW.includes(tile)) {
        const ny = y + 1;
        if (ny < h && !isWall(padded[ny][x])) {
          errors.push(`slope tile '${tile}' at row ${y + HEADER_LINES} col ${x} has empty/open space below at row ${ny + HEADER_LINES} col ${x} (jagged edge: wall required below qr/st slope)`);
        }
      } else if (SLOPES_REQUIRE_WALL_ABOVE.includes(tile)) {
        const ny = y - 1;
        if (ny >= 0 && !isWall(padded[ny][x])) {
          errors.push(`slope tile '${tile}' at row ${y + HEADER_LINES} col ${x} has empty/open space above at row ${ny + HEADER_LINES} col ${x} (jagged edge: wall required above uv/wx slope)`);
        }
      }
    }
  }

  // Bunker floor/ceiling plates must be aligned with the surrounding floor/ceiling.
  // P is a right-facing floor bunker: its bottom p/qr row is 3 rows below P, and
  // the row below that must be solid p floor.
  // U is a left-facing floor bunker: its bottom ppppppp row is 2 rows below U, and
  // the row below that must be solid p floor.
  // [ is a right-facing ceiling bunker: its top p/uv row is 3 rows above [, and
  // the row above that must be solid p ceiling.
  // \ is a left-facing ceiling bunker: its top p/wx row is 3 rows above \, and
  // the row above that must be solid p ceiling.
  const isP = (ch) => ch === 'p';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < width; x++) {
      const ch = padded[y][x];
      if (ch === 'P') {
        const x0 = Math.max(0, x - 2);
        const x1 = Math.min(width - 1, x + 4);
        const plateRow = y + 3;
        const floorRow = y + 4;
        if (plateRow >= h || floorRow >= h) {
          errors.push(`bunker 'P' at row ${y + HEADER_LINES} col ${x} is missing a floor plate`);
          continue;
        }
        let plateOk = true;
        for (let cx = x0; cx <= x1; cx++) {
          if (!isWall(padded[plateRow][cx])) plateOk = false;
        }
        let floorOk = true;
        for (let cx = x0; cx <= x1; cx++) {
          if (!isP(padded[floorRow][cx])) floorOk = false;
        }
        if (!plateOk || !floorOk) {
          errors.push(`bunker 'P' at row ${y + HEADER_LINES} col ${x} is not aligned with the floor (ppppqr plate must be at the floor)`);
        }
      } else if (ch === 'U') {
        const x0 = Math.max(0, x);
        const x1 = Math.min(width - 1, x + 6);
        const plateRow = y + 2;
        const floorRow = y + 3;
        if (plateRow >= h || floorRow >= h) {
          errors.push(`bunker 'U' at row ${y + HEADER_LINES} col ${x} is missing a floor plate`);
          continue;
        }
        let plateOk = true;
        let floorOk = true;
        for (let cx = x0; cx <= x1; cx++) {
          if (!isP(padded[plateRow][cx])) plateOk = false;
          if (!isP(padded[floorRow][cx])) floorOk = false;
        }
        if (!plateOk || !floorOk) {
          errors.push(`bunker 'U' at row ${y + HEADER_LINES} col ${x} is not aligned with the floor (ppppppp plate must be at the floor)`);
        }
      } else if (ch === '[') {
        // Right-facing ceiling bunker: plate row is the top uv row (2 rows above [).
        // Plate spans the p fill to the left plus the uv pair, but not the open side.
        const x0 = Math.max(0, x - 5);
        const x1 = Math.min(width - 1, x + 3);
        const plateRow = y - 2;
        const ceilRow = y - 3;
        if (plateRow < 0 || ceilRow < 0) {
          errors.push(`bunker '[' at row ${y + HEADER_LINES} col ${x} is missing a ceiling plate`);
          continue;
        }
        let plateOk = true;
        for (let cx = x0; cx <= x1; cx++) {
          if (!isWall(padded[plateRow][cx])) plateOk = false;
        }
        let ceilOk = true;
        for (let cx = x0; cx <= x1; cx++) {
          if (!isP(padded[ceilRow][cx])) ceilOk = false;
        }
        if (!plateOk || !ceilOk) {
          errors.push(`bunker '[' at row ${y + HEADER_LINES} col ${x} is not aligned with the ceiling (ppppppppuv plate must be at the ceiling)`);
        }
      } else if (ch === '\\') {
        // Left-facing ceiling bunker: plate row is the top wx row (2 rows above \).
        // Plate spans the wx pair and the p fill to the right, not the open left side.
        const x0 = Math.max(0, x + 1);
        const x1 = Math.min(width - 1, x + 7);
        const plateRow = y - 2;
        const ceilRow = y - 3;
        if (plateRow < 0 || ceilRow < 0) {
          errors.push(`bunker '\\' at row ${y + HEADER_LINES} col ${x} is missing a ceiling plate`);
          continue;
        }
        let plateOk = true;
        for (let cx = x0; cx <= x1; cx++) {
          if (!isWall(padded[plateRow][cx])) plateOk = false;
        }
        let ceilOk = true;
        for (let cx = x0; cx <= x1; cx++) {
          if (!isP(padded[ceilRow][cx])) ceilOk = false;
        }
        if (!plateOk || !ceilOk) {
          errors.push(`bunker '\\' at row ${y + HEADER_LINES} col ${x} is not aligned with the ceiling (wxpppppppp plate must be at the ceiling)`);
        }
      }
    }
  }

  // Slope tiles must not be placed as closed surface bumps.
  // A qr/st pair that sits in a floor row with p on its closed side and open
  // space above is an unevenness and should be flattened to pp.
  // A uv/wx pair that sits in a ceiling row with p on its closed side and open
  // space below is an unevenness and should be flattened to pp.
  // The "open" side is the direction where space/fuel/reactor/pod-holder should be.
  const SLOPE_OPEN_TILES = new Set([' ', '*', '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', '0', '1', '2', '3', '4']);
  const isOpenForSlope = (ch) => ch !== undefined && SLOPE_OPEN_TILES.has(ch);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < width - 1; x++) {
      const ch = padded[y][x];
      const ch2 = padded[y][x + 1];
      // qr pair: q at x, r at x+1, closed on the left, open above/right.
      // Bad floor bump: r has p on its right and open space above it.
      if (ch === 'q' && ch2 === 'r') {
        if (x + 2 < width && isP(padded[y][x + 2]) && y - 1 >= 0 && isOpenForSlope(padded[y - 1][x + 1])) {
          errors.push(`slope tile 'r' at row ${y + HEADER_LINES} col ${x + 1} is a closed qr bump in the floor (r is blocked on the right and open above) - should be 'p'`);
        }
      }
      // uv pair: u at x, v at x+1, closed on the left, open below/right.
      // Bad ceiling bump: v has p on its right and open space below it.
      if (ch === 'u' && ch2 === 'v') {
        if (x + 2 < width && isP(padded[y][x + 2]) && y + 1 < h && isOpenForSlope(padded[y + 1][x + 1])) {
          errors.push(`slope tile 'v' at row ${y + HEADER_LINES} col ${x + 1} is a closed uv bump in the ceiling (v is blocked on the right and open below) - should be 'p'`);
        }
      }
    }
    for (let x = 1; x < width; x++) {
      const ch = padded[y][x];
      const ch2 = padded[y][x - 1];
      // wx pair: w at x, x at x+1. Open below/left.
      // Bad ceiling bump: w has p on its left and open space below it.
      if (ch === 'w' && x + 1 < width && padded[y][x + 1] === 'x') {
        if (x - 1 >= 0 && isP(padded[y][x - 1]) && y + 1 < h && isOpenForSlope(padded[y + 1][x])) {
          errors.push(`slope tile 'w' at row ${y + HEADER_LINES} col ${x} is a closed wx bump in the ceiling (w is blocked on the left and open below) - should be 'p'`);
        }
      }
      // st pair: s at x, t at x+1. Open above/left.
      // Bad floor bump: s has p on its left and open space above it.
      if (ch === 's' && x + 1 < width && padded[y][x + 1] === 't') {
        if (x - 1 >= 0 && isP(padded[y][x - 1]) && y - 1 >= 0 && isOpenForSlope(padded[y - 1][x])) {
          errors.push(`slope tile 's' at row ${y + HEADER_LINES} col ${x} is a closed st bump in the floor (s is blocked on the left and open above) - should be 'p'`);
        }
      }
    }
  }

  // Slope pairs must not be placed twice directly adjacent on the same row
  // (e.g. 'qrqr', 'stst', 'uvuv', 'wxwx'). Each diagonal must step down one row
  // per pair, so two identical pairs side by side is an invalid slope.
  const ADJACENT_SLOPE_PAIRS = [['q', 'r'], ['s', 't'], ['u', 'v'], ['w', 'x']];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x + 3 < width; x++) {
      for (const [a, b] of ADJACENT_SLOPE_PAIRS) {
        if (padded[y][x] === a && padded[y][x + 1] === b &&
            padded[y][x + 2] === a && padded[y][x + 3] === b) {
          errors.push(`invalid slope: adjacent '${a}${b}${a}${b}' at row ${y + HEADER_LINES} col ${x} (slope pairs must step down one row each, not sit side by side)`);
        }
      }
    }
  }

  // A floor slope pair (qr/st) must sit directly on solid rock: the two cells
  // in the row immediately below must both be 'p'. A ceiling slope pair (uv/wx)
  // must hang from solid rock: the two cells in the row immediately above must
  // both be 'p'. This catches vertically-stacked slopes (e.g. a qr sitting on
  // another qr) which produce a jagged, unclimbable diagonal.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < width - 1; x++) {
      const ch = padded[y][x];
      const ch2 = padded[y][x + 1];
      if ((ch === 'q' && ch2 === 'r') || (ch === 's' && ch2 === 't')) {
        const ny = y + 1;
        if (ny < h && (!isP(padded[ny][x]) || !isP(padded[ny][x + 1]))) {
          errors.push(`floor slope '${ch}${ch2}' at row ${y + HEADER_LINES} col ${x} must have 'pp' directly below (row ${ny + HEADER_LINES}), found '${padded[ny][x]}${padded[ny][x + 1]}'`);
        }
      } else if ((ch === 'u' && ch2 === 'v') || (ch === 'w' && ch2 === 'x')) {
        const ny = y - 1;
        if (ny >= 0 && (!isP(padded[ny][x]) || !isP(padded[ny][x + 1]))) {
          errors.push(`ceiling slope '${ch}${ch2}' at row ${y + HEADER_LINES} col ${x} must have 'pp' directly above (row ${ny + HEADER_LINES}), found '${padded[ny][x]}${padded[ny][x + 1]}'`);
        }
      }
    }
  }

  // Door rows must span wall-to-wall (no open space beside the door)
  for (let y = 0; y < h; y++) {
    const r = padded[y];
    if (!r.includes('H')) continue;
    let firstH = -1, lastG = -1;
    for (let x = 0; x < width; x++) {
      if (r[x] === 'H' && firstH < 0) firstH = x;
      if (r[x] === 'G') lastG = x;
    }
    if (firstH < 0 || lastG < 0) continue;
    for (let x = 0; x < firstH; x++) {
      if (!isWall(r[x])) {
        errors.push(`row ${y + HEADER_LINES}: door H at col ${firstH} does not span wall-to-wall (open space at col ${x} before door)`);
        break;
      }
    }
    for (let x = lastG + 1; x < width; x++) {
      if (!isWall(r[x])) {
        errors.push(`row ${y + HEADER_LINES}: door G at col ${lastG} does not span wall-to-wall (open space at col ${x} after door)`);
        break;
      }
    }
  }

  // Feature inventory
  const text = padded.join('\n');
  function countChar(c) {
    let count = 0;
    for (const ch of text) {
      if (ch === c) count++;
    }
    return count;
  }

  inventory.rows = h;
  inventory.width = width;
  inventory.stars = stars.length;
  inventory.pod = ms.length;
  inventory.fuel = countChar(FUEL_TILE);
  inventory.reactor = countChar('d');
  inventory.bunkers = BUNKER_TILES.reduce((sum, c) => sum + countChar(c), 0);
  inventory.doors_H = countChar('H');
  inventory.doors_G = countChar('G');
  inventory.buttons = countChar('L') + countChar('N');
  inventory.checkpoints = countChar('#');

  if (inventory.doors_H !== inventory.doors_G) {
    warnings.push(`H count ${inventory.doors_H} != G count ${inventory.doors_G}`);
  }
  if (inventory.doors_H > 0 && inventory.buttons === 0) {
    warnings.push('door present (H/G) but no button (L/N) to open it');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    inventory
  };
}

export function validateDef(text) {
  const lines = text.split('\n');
  const width = parseInt(lines[0].split(/\s+/)[0], 10);
  const headerHeight = parseInt(lines[1].split(/\s+/)[0], 10);
  let layout = lines.slice(HEADER_LINES, HEADER_LINES + headerHeight);
  while (layout.length > 0 && layout[layout.length - 1] === '') {
    layout.pop();
  }
  const height = layout.length;
  return validateLevel({ width, height, layout });
}

async function main() {
  const { readFileSync } = await import('fs');
  const paths = process.argv.slice(2);
  if (paths.length === 0) {
    console.error('usage: node src/levels/level-validator.js <level.def> ...');
    process.exit(2);
  }
  let totalErr = 0;
  for (const p of paths) {
    const text = readFileSync(p, 'utf-8');
    const result = validateDef(text);
    const status = result.valid ? 'OK' : 'FAIL';
    console.log(`[${status}] ${p}  ${JSON.stringify(result.inventory)}`);
    for (const e of result.errors) {
      console.log(`    ERROR: ${e}`);
    }
    for (const w of result.warnings) {
      console.log(`    warn:  ${w}`);
    }
    totalErr += result.errors.length;
  }
  process.exit(totalErr ? 1 : 0);
}

if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].endsWith('level-validator.js')) {
  main().catch(err => {
    console.error(err);
    process.exit(2);
  });
}

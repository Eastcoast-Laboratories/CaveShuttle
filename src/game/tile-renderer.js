// Tile renderer using original blks tileset
// Renders level tiles pixel-perfect using the original 8x8 pixel tileset and color palette

import { SKY_FULL_STAR_DENSITY, GOD_MODE_TILE, MULTI_SHOT_TILE, BULLET_IMPACT_EXPAND_PX, BULLET_IMPACT_DURATION_MS } from "../core/constants";

// Tiles that are visually wall-like but have mostly empty space — no collision.
// These are the smaller components of larger wall structures (e.g. right half of a slope).
const NO_COLLISION_TILES = new Set([
  'r', 's', 'v', 'w', '}', 'z', '{', '~', 'o',
  'f', 'e', 'd', // reactor ceiling
  '`', 'a', // Fuel alcove top
  String.fromCharCode(131), // descending slope right offset (no-collision)
  String.fromCharCode(132), // ascending slope offset (no-collision)
  String.fromCharCode(135), // ascending slope offset ceiling right (no-collision)
]);

// Hidden passage tiles: look like walls/slopes but can be flown through.
const HIDDEN_PASSAGE_TILES = new Set([
  'à', // hidden wall passage (fly-through)
  'á', 'â', 'ã', 'ä', // hidden slopes
  'å', 'æ', 'ç', 'è', // hidden ceiling slopes
  'ê', 'ë', 'í', 'î', // hidden quarter walls
  'é', 'ì', // hidden half walls
  'þ', 'ÿ', // hidden half wall top/bottom
  String.fromCharCode(142), // hidden three quarter wall bottom
]);

export class TileRenderer {
  constructor() {
    this.tileSize = 8; // Original tile size in pixels
    this.scale = 2; // Render scale factor for visibility
    this.palette = null;
    this.tiles = null;
    this.tileCache = new Map(); // ASCII code -> pre-rendered canvas
    this.borderTileCache = new Map(); // ASCII code -> pre-rendered canvas with index 1 transparent
    this.loaded = false;
    this.fuelDepotTiles = new Set(['`', 'a', 'b', 'c']);
  }

  async load(url = '/assets/blocks.json') {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load tileset: ${response.status}`);
    }
    const data = await response.json();
    this.tileSize = data.tileSize;
    this.basePalette = data.palette; // Store original palette
    this.palette = data.palette;
    this.tiles = data.tiles;
    this.loaded = true;
    this.preRenderTiles();
  }

  setLevelColors(colors) {
    // Update palette with level colors
    // Map level colors to palette indices that are used for terrain
    // Index 0 is transparent, index 1 is black, index 2-3 are red/yellow
    // We'll replace some terrain colors with the level's background color
    const terrainChars = [
      'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x',      // platform / slope tiles
      'n', 'o', // slopes that end in a half wall
      '$', '%', '(', ')', // steep slopes
      'y', 'z'   // Half Wall right, quarter Wall right-bottom
    ];
    const terrainIndices = new Set();
    terrainChars.forEach(char => {
      const code = char.charCodeAt(0);
      const tile = this.tiles[code];
      if (tile) {
        const uniqueIndices = [...new Set(tile)];
        uniqueIndices.forEach(idx => terrainIndices.add(idx));
      }
    });

    if (colors && colors.background) {
      const [r, g, b] = colors.background;
      // Replace palette indices 2-5 (red/yellow/white) with level background color
      // These are commonly used for terrain
      this.palette = [...this.basePalette];

      // Replace ONLY terrain-specific palette indices with level background color
      // Keep other indices (for fuel, reactor, etc.) unchanged
      terrainIndices.forEach(idx => {
        if (idx > 1) { // Don't replace transparent (0) or black (1)
          this.palette[idx] = [r, g, b];
        }
      });
      // Re-render tiles with new palette
      this.preRenderTiles();
    }

  }

  preRenderTiles() {
    // Pre-render each tile to an offscreen canvas for performance
    for (const code in this.tiles) {
      const canvas = this.renderTileToCanvas(parseInt(code, 10));
      if (canvas) {
        this.tileCache.set(parseInt(code, 10), canvas);
      }
    }
    // Border tiles are generated lazily, but they depend on palette colors.
    this.borderTileCache.clear();
  }

  renderTileToCanvas(code, transparentIndex = 0, palette = this.palette) {
    const tile = this.tiles[code];
    if (!tile) return null;

    const size = this.tileSize * this.scale;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let py = 0; py < this.tileSize; py++) {
      for (let px = 0; px < this.tileSize; px++) {
        const colorIndex = tile[py * this.tileSize + px];
        const color = palette[colorIndex] || [0, 0, 0];
        const isTransparent = colorIndex === 0 || colorIndex === transparentIndex;

        // Draw scaled pixel block
        for (let sy = 0; sy < this.scale; sy++) {
          for (let sx = 0; sx < this.scale; sx++) {
            const dx = px * this.scale + sx;
            const dy = py * this.scale + sy;
            const idx = (dy * size + dx) * 4;
            data[idx] = color[0];
            data[idx + 1] = color[1];
            data[idx + 2] = color[2];
            data[idx + 3] = isTransparent ? 0 : 255;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * Returns the rendered tile size in pixels (tileSize * scale).
   * The base tile is 8x8 pixels (this.tileSize = 8). The scale factor
   * (this.scale, typically 2) multiplies this to get the on-screen size,
   * so a tile occupies 16x16 screen pixels at scale 2.
   *
   * Collision detection uses configurable radii defined in constants.js:
   * SHIP_COLLISION_RADIUS for the ship and
   * POD_COLLISION_RADIUS for the pod. These are in unscaled
   * screen-space pixels, so a radius of 8 covers roughly half a tile at
   * scale 2 (16px tiles).
   *
   * @returns {number} Scaled tile size in pixels (tileSize * scale)
   */
  getScaledTileSize() {
    return this.tileSize * this.scale;
  }

  getTileBorderCanvas(code) {
    if (!this.loaded || !this.tiles) return null;
    if (this.borderTileCache.has(code)) {
      return this.borderTileCache.get(code);
    }
    const canvas = this.renderTileToCanvas(code, 1);
    this.borderTileCache.set(code, canvas);
    return canvas;
  }

  isFuelDepotTile(char) {
    return this.fuelDepotTiles.has(char);
  }

  render(ctx, level, offsetX = 0, offsetY = 0, tileImpacts = null) {
    if (!this.loaded || !level || !level.layout) return;

    const scaledSize = this.getScaledTileSize();
    const layout = level.layout;
    const now = tileImpacts ? performance.now() : 0;

    for (let y = 0; y < layout.length; y++) {
      const row = layout[y];
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        // Skip the empty-space tile (all black, opaque): the canvas is already black
        // and skipping it lets the stars behind the level stay visible.
        if (char === ' ') {
          continue;
        }
        // Skip rendering pod holder characters (m, 0, 1, 2) - they render as space
        if (char === 'm' || char === '0' || char === '1' || char === '2') {
          continue;
        }
        // Skip enemy mine marker ('+') - rendered separately by GameCanvas
        if (char === '+') {
          continue;
        }
        // Fuel depots are rendered by GameCanvas with dynamic fill level
        if (this.isFuelDepotTile(char)) {
          continue;
        }
        const code = row.charCodeAt(x);
        const tileCanvas = this.tileCache.get(code);
        if (tileCanvas) {
          // Check if this tile has an active bullet impact expansion
          let drawX = offsetX + x * scaledSize;
          let drawY = offsetY + y * scaledSize;
          let drawW = scaledSize;
          let drawH = scaledSize;

          if (tileImpacts) {
            const key = `${x},${y}`;
            const impactTime = tileImpacts.get(key);
            if (impactTime !== undefined) {
              const elapsed = now - impactTime;
              if (elapsed < BULLET_IMPACT_DURATION_MS) {
                // Animation: expand to max at start, then shrink back to 0
                // Use a sine curve: sin(pi * elapsed/duration) gives 0 -> 1 -> 0
                const progress = Math.sin(Math.PI * elapsed / BULLET_IMPACT_DURATION_MS);
                const expandPx = BULLET_IMPACT_EXPAND_PX * progress;
                drawX -= expandPx;
                drawY -= expandPx;
                drawW += expandPx * 2;
                drawH += expandPx * 2;
              } else {
                // Impact expired, clean up
                tileImpacts.delete(key);
              }
            }
          }

          ctx.drawImage(
            tileCanvas,
            drawX, drawY,
            drawW, drawH
          );
        }
      }
    }
  }

  isWall(tile) {
    if (tile === ' ' || tile === undefined || tile === null) return false;
    // Pod holder characters (m, 0, 1, 2) render as space and are not walls
    if (tile === 'm' || tile === '0' || tile === '1' || tile === '2') return false;
    // Hidden passage tiles: look like walls but can be flown through
    if (HIDDEN_PASSAGE_TILES.has(tile)) return false;
    // Small wall components with mostly empty space — no collision
    if (NO_COLLISION_TILES.has(tile)) return false;
    // Power-up tiles: not walls — ship picks them up by touching
    if (tile === GOD_MODE_TILE || tile === MULTI_SHOT_TILE) return false;
    // Steep slope tiles are solid
    if (tile === '$' || tile === '%' || tile === '(' || tile === ')') return true;
    const code = tile.charCodeAt(0);
    // Characters 76-108 (L-l range) are solid landscape
    // Platform tiles p-t (112-116) and many landscape chars are solid
    // Empty space is ' ' (32), '*' restart, and object markers
    // Solid: landscape tiles (uppercase letters and lowercase a-z used for terrain)
    return code >= 76; // Most terrain/platform tiles
  }

  /**
   * Get the tile at the given screen position (x, y) in the current level.
   * @param {Object} level - The level object with layout property.
   * @param {number} x - The x coordinate in screen space.
   * @param {number} y - The y coordinate in screen space.
   * @param {string} source - The source of the call (for logging).
   * @returns {string|null} The tile character at the given position.
   *   Returns ' ' (chr 32) for empty space tiles within the level layout.
   *   Returns null when the position is outside the level (sky, out of bounds,
   *   NaN coordinates, or level not loaded). isWall() treats both null and ' '
   *   as non-walls, but null means "no tile exists here" while ' ' means
   *   "a tile exists but it is empty space".
   */
  getTileAt(level, x, y, source = 'unknown') {
    if (!level || !level.layout) {
      console.error('[TILE_RENDERER] getTileAt() called before level is ready');
      return null;
    }
    const scaledSize = this.getScaledTileSize();
    const tileX = Math.floor(x / scaledSize);
    const tileY = Math.floor(y / scaledSize);

    // Sky area above the level (y < 0) is empty space, not an error.
    // Only log if the coordinate is NaN or absurdly far below.
    if (tileY < 0) {
      if (!Number.isFinite(tileY)) {
        console.error('[TILE_RENDERER] getTileAt(' + source + '): NaN tileY (x=', x, 'y=', y, ')');
      } else if (tileY < -SKY_FULL_STAR_DENSITY) {
        console.error('[TILE_RENDERER] getTileAt(' + source + '): tileY below SKY_FULL_STAR_DENSITY (tileY=', tileY, 'x=', x, 'y=', y, ')');
      }
      return null;
    }
    if (tileY >= level.layout.length) {
      console.error('[TILE_RENDERER] getTileAt(' + source + '): tileY out of bounds (tileY=', tileY, 'layout.length=', level.layout.length, 'x=', x, 'y=', y, ')');
      return null;
    }
    const row = level.layout[tileY];
    if (!row) {
      console.error('[TILE_RENDERER] getTileAt(' + source + '): row undefined at tileY=', tileY, '(layout has gap?)');
      return null;
    }
    if (!Number.isFinite(tileX) || tileX < 0 || tileX > row.length) {
      if (!Number.isFinite(tileX)) {
        console.error('[TILE_RENDERER] getTileAt(' + source + '): NaN tileX (x=', x, 'y=', y, ')');
      } else if (tileX < 0) {
        console.error('[TILE_RENDERER] getTileAt(' + source + '): tileX below 0 (tileX=', tileX, 'x=', x, 'y=', y, ')');
      } else {
        console.error('[TILE_RENDERER] getTileAt(' + source + '): tileX out of bounds (tileX=', tileX, 'row.length=', row.length, 'x=', x, 'y=', y, ')');
      }
      return null;
    }

    return row[tileX];
  }

  getLevelDimensions(level) {
    if (!level || !level.layout) return { width: 0, height: 0 };
    const scaledSize = this.getScaledTileSize();
    return {
      width: level.layout[0].length * scaledSize,
      height: level.layout.length * scaledSize
    };
  }
}

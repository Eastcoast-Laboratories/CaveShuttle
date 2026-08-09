// Level renderer for preview - based on src/game/level-renderer.js
class LevelRenderer {
  constructor() {
    this.tileSize = 16;
    this.tileCache = new Map();
    this.loaded = false;
  }

  async load() {
    // Pre-load all tile images
    const tiles = [];
    for (let i = 32; i < 256; i++) {
      const char = String.fromCharCode(i);
      
      // Map special characters to safe filenames
      let filename;
      if (char === '\\') {
        filename = 'tile_backslash.bmp';
      } else if (char === '/') {
        filename = 'char_slash.bmp';
      } else if (char === ':') {
        filename = 'char_colon.bmp';
      } else if (char === '*') {
        filename = 'char_asterisk.bmp';
      } else if (char === '?') {
        filename = 'char_question.bmp';
      } else if (char === '"') {
        filename = 'char_quote.bmp';
      } else if (char === '<') {
        filename = 'char_lt.bmp';
      } else if (char === '>') {
        filename = 'char_gt.bmp';
      } else if (char === '|') {
        filename = 'char_pipe.bmp';
      } else if (char === '#') {
        filename = 'char_hash.bmp';
      } else if (char === '%') {
        filename = 'char_percent.bmp';
      } else {
        filename = `char_${char}.bmp`;
      }
      
      const img = new Image();
      img.src = `/tiles/${filename}`;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => resolve(); // Resolve even on error (missing tile)
      });
      this.tileCache.set(i, img);
    }
    this.loaded = true;
  }

  render(ctx, levelData) {
    if (!levelData || !levelData.grid) return;

    const { width, height } = levelData.header;
    const grid = levelData.grid;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = grid[y][x];
        const posX = x * this.tileSize;
        const posY = y * this.tileSize;

        this.renderTile(ctx, tile, posX, posY);
      }
    }
  }

  renderTile(ctx, tile, x, y) {
    if (tile === ' ') return; // Empty space

    const code = tile.charCodeAt(0);
    const img = this.tileCache.get(code);
    
    if (img && img.complete) {
      ctx.drawImage(img, x, y, this.tileSize, this.tileSize);
    } else {
      // Fallback to colored rectangle if image not loaded
      const hue = (code % 26) * 14;
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillRect(x, y, this.tileSize, this.tileSize);
    }
  }
}

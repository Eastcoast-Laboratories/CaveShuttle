// Level renderer for rendering level layout
export class LevelRenderer {
  constructor() {
    this.tileSize = 16; // Scaled for better visibility (was 8)
  }

  render(ctx, level, offsetX = 0, offsetY = 0) {
    if (!level || !level.layout) return;

    const layout = level.layout;
    const startX = offsetX;
    const startY = offsetY;

    for (let y = 0; y < layout.length; y++) {
      const row = layout[y];
      for (let x = 0; x < row.length; x++) {
        const tile = row[x];
        const posX = startX + x * this.tileSize;
        const posY = startY + y * this.tileSize;

        this.renderTile(ctx, tile, posX, posY);
      }
    }
  }

  renderTile(ctx, tile, x, y) {
    switch (tile) {
      case ' ': // Empty space
        return; // Don't render anything

      case '0': // Pod stand 0 - rendered as space
      case '1': // Pod holder marker (POD_HOLDER_CHAR) - rendered as space
      case '2': // Pod holder part - rendered as space
        return; // Don't render anything

      case '3': // Pod stand 3
        ctx.fillStyle = '#33cc33';
        ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
        break;

      case '4': // Pod stand 4
        ctx.fillStyle = '#33cc33';
        ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
        break;

      case '#': // Solid wall (fallback)
        ctx.fillStyle = '#666666';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);
        ctx.strokeStyle = '#888888';
        ctx.strokeRect(x, y, this.tileSize, this.tileSize);
        break;

      case '*': // Restart point
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);
        ctx.fillStyle = '#000000';
        ctx.font = `${this.tileSize - 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('R', x + this.tileSize / 2, y + this.tileSize / 2);
        break;

      case '`': // Fuel
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
        break;

      case 'd': // Power plant
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2);
        break;

      // Accelerate platform tiles (p, q, r, s, t - different heights)
      case 'p': // Platform - lowest
        ctx.fillStyle = '#888888';
        ctx.fillRect(x, y + this.tileSize - 2, this.tileSize, 2);
        break;

      case 'q': // Platform - low
        ctx.fillStyle = '#888888';
        ctx.fillRect(x, y + this.tileSize - 3, this.tileSize, 3);
        break;

      case 'r': // Platform - medium
        ctx.fillStyle = '#888888';
        ctx.fillRect(x, y + this.tileSize - 4, this.tileSize, 4);
        break;

      case 's': // Platform - high
        ctx.fillStyle = '#888888';
        ctx.fillRect(x, y + this.tileSize - 5, this.tileSize, 5);
        break;

      case 't': // Platform - highest
        ctx.fillStyle = '#888888';
        ctx.fillRect(x, y + this.tileSize - 6, this.tileSize, 6);
        break;

      // Door buttons (L/M left wall, N/O right wall; M/O are lower tile halves)
      case 'L':
      case 'M':
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);
        break;

      case 'N':
      case 'O':
        ctx.fillStyle = '#00aa00';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);
        break;

      // Sliders (@-K) - different colors for different slider types
      case '@':
      case 'A':
      case 'B':
      case 'C':
      case 'D':
      case 'E':
      case 'F':
      case 'G':
      case 'H':
      case 'I':
      case 'J':
      case 'K':
        ctx.fillStyle = '#0000ff';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);
        break;

      // Bunkers (P, U, [, \) - different colors for different bunker types
      case 'P':
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);
        break;

      case 'U':
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);
        break;

      case '[':
        ctx.fillStyle = '#ff9999';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);
        break;

      case '\\':
        ctx.fillStyle = '#ffcccc';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);
        break;

      // Letters for other objects - render as placeholders with different colors
      default:
        if (tile.match(/[a-z]/i)) {
          // Letters - render as colored rectangles for now
          const hue = (tile.charCodeAt(0) % 26) * 14;
          ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
          ctx.fillRect(x, y, this.tileSize, this.tileSize);
        } else if (tile.match(/[0-9]/)) {
          // Numbers - render as yellow
          ctx.fillStyle = '#ffff00';
          ctx.fillRect(x, y, this.tileSize, this.tileSize);
          ctx.fillStyle = '#000000';
          ctx.font = `${this.tileSize - 2}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tile, x + this.tileSize / 2, y + this.tileSize / 2);
        }
        break;
    }
  }

  /**
   * Only used in level-renderer.test.js: These are the tiles, that fire, all other bunker tiles are decorative
   */
  isBunker(tile) {
    return ['P', 'U', '[', '\\'].includes(tile);
  }

  /**
   * Only used in level-renderer.test.js: These are the tiles, that are buttons (L==left)
   */
  isButton(tile) {
    return ['L', 'M', 'N', 'O'].includes(tile);
  }

  /**
   * Only used in level-renderer.test.js: These are the tiles, that are slider buttons (@-K)
   */
  isSlider(tile) {
    const code = tile.charCodeAt(0);
    return code >= 64 && code <= 75; // @-K
  }

  isWall(tile) {
    return tile === '#' || ['p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', '$', '%', '(', ')'].includes(tile);
  }

  getTileAt(level, x, y) {
    if (!level || !level.layout) return null;
    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);
    
    if (tileY < 0 || tileY >= level.layout.length) return null;
    const row = level.layout[tileY];
    if (tileX < 0 || tileX >= row.length) return null;
    
    return row[tileX];
  }

  getLevelDimensions(level) {
    if (!level || !level.layout) return { width: 0, height: 0 };
    return {
      width: level.layout[0].length * this.tileSize,
      height: level.layout.length * this.tileSize
    };
  }
}

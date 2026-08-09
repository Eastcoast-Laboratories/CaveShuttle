// Converts the original dulsi/thrust blks.c tileset to JSON for web rendering
// Usage: node scripts/convert-blocks.js
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, '../../dulsi-thrust/datasrc/blks.c');
const OUTPUT = resolve(__dirname, '../public/assets/blocks.json');

const content = readFileSync(SOURCE, 'utf-8');

// Extract blks_colors array
const colorsMatch = content.match(/unsigned char blks_colors\[\]\s*=\s*\{([\s\S]*?)\};/);
if (!colorsMatch) {
  throw new Error('Could not find blks_colors in source file');
}
const colorBytes = colorsMatch[1]
  .replace(/\n/g, ' ')
  .split(',')
  .map(s => s.trim())
  .filter(s => s.length > 0)
  .map(s => parseInt(s, 16));

// Build palette as [r, g, b] triplets
const palette = [];
for (let i = 0; i < colorBytes.length; i += 3) {
  palette.push([colorBytes[i], colorBytes[i + 1], colorBytes[i + 2]]);
}

// Extract blks_pixels array
const pixelsMatch = content.match(/unsigned char blks_pixels\[\]\s*=\s*\{([\s\S]*?)\};/);
if (!pixelsMatch) {
  throw new Error('Could not find blks_pixels in source file');
}
const pixels = pixelsMatch[1]
  .replace(/\n/g, ' ')
  .split(',')
  .map(s => s.trim())
  .filter(s => s.length > 0)
  .map(s => parseInt(s, 16));

// Each tile is 8x8 = 64 pixels, indexed by ASCII character value
// Build tiles map: ASCII code -> array of 64 color indices
const TILE_SIZE = 8;
const TILE_BYTES = TILE_SIZE * TILE_SIZE;
const numTiles = Math.floor(pixels.length / TILE_BYTES);

const tiles = {};
for (let code = 0; code < numTiles; code++) {
  const tile = pixels.slice(code * TILE_BYTES, (code + 1) * TILE_BYTES);
  // Only store tiles that have non-zero (non-transparent) pixels
  const hasContent = tile.some(p => p !== 0);
  if (hasContent) {
    tiles[code] = tile;
  }
}

const output = {
  tileSize: TILE_SIZE,
  palette,
  numColors: palette.length,
  tiles
};

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, JSON.stringify(output));

console.log(`Converted blocks tileset:`);
console.log(`  Colors: ${palette.length}`);
console.log(`  Total pixels: ${pixels.length}`);
console.log(`  Tiles with content: ${Object.keys(tiles).length}`);
console.log(`  Output: ${OUTPUT}`);
console.log(`  File size: ${(JSON.stringify(output).length / 1024).toFixed(1)} KB`);

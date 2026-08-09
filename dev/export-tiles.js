// Export tiles from blocks.json to BMP files (no external dependencies)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load blocks.json
const blocksPath = path.join(__dirname, '../public/assets/blocks.json');
const blocks = JSON.parse(fs.readFileSync(blocksPath, 'utf8'));

const tileSize = blocks.tileSize;
const palette = blocks.palette;
const tiles = blocks.tiles;

// Create tiles directory
const tilesDir = path.join(__dirname, '../public/tiles');
if (!fs.existsSync(tilesDir)) {
  fs.mkdirSync(tilesDir, { recursive: true });
}

// Create BMP file for a tile (24-bit RGB, no alpha)
function createTileBMP(code) {
  const tile = tiles[code];
  if (!tile) return null;

  const scale = 4; // Scale up for better visibility
  const size = tileSize * scale;
  
  // BMP file header (14 bytes)
  const fileHeader = Buffer.alloc(14);
  fileHeader.write('BM', 0); // Signature
  fileHeader.writeUInt32LE(14 + 40 + size * size * 3, 2); // File size
  fileHeader.writeUInt16LE(0, 6); // Reserved
  fileHeader.writeUInt16LE(0, 8); // Reserved
  fileHeader.writeUInt32LE(54, 10); // Offset to pixel data
  
  // DIB header (BITMAPINFOHEADER, 40 bytes)
  const dibHeader = Buffer.alloc(40);
  dibHeader.writeUInt32LE(40, 0); // Header size
  dibHeader.writeInt32LE(size, 4); // Width
  dibHeader.writeInt32LE(-size, 8); // Height (negative for top-down)
  dibHeader.writeUInt16LE(1, 12); // Planes
  dibHeader.writeUInt16LE(24, 14); // Bits per pixel (RGB)
  dibHeader.writeUInt32LE(0, 16); // Compression (none)
  dibHeader.writeUInt32LE(size * size * 3, 20); // Image size
  dibHeader.writeInt32LE(2835, 24); // X pixels per meter
  dibHeader.writeInt32LE(2835, 28); // Y pixels per meter
  dibHeader.writeUInt32LE(0, 32); // Colors used
  dibHeader.writeUInt32LE(0, 36); // Important colors
  
  // Pixel data (BGR format, bottom-up)
  const rowSize = size * 3;
  const padding = (4 - (rowSize % 4)) % 4;
  const pixelData = Buffer.alloc(size * (rowSize + padding));
  
  for (let py = 0; py < tileSize; py++) {
    for (let px = 0; px < tileSize; px++) {
      const colorIndex = tile[py * tileSize + px];
      const color = palette[colorIndex] || [0, 0, 0];
      const isTransparent = colorIndex === 0;
      
      // Draw scaled pixel block
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const dx = px * scale + sx;
          const dy = py * scale + sy;
          
          const idx = dy * (rowSize + padding) + dx * 3;
          
          if (isTransparent) {
            pixelData[idx] = 0;     // B
            pixelData[idx + 1] = 0; // G
            pixelData[idx + 2] = 0; // R
          } else {
            pixelData[idx] = color[2];     // B (BMP uses BGR)
            pixelData[idx + 1] = color[1]; // G
            pixelData[idx + 2] = color[0]; // R
          }
        }
      }
    }
  }
  
  return Buffer.concat([fileHeader, dibHeader, pixelData]);
}

// Create custom tile with character on black background
function createCustomTile(char, charCode) {
  const scale = 4;
  const size = tileSize * scale;
  
  // BMP file header (14 bytes)
  const fileHeader = Buffer.alloc(14);
  fileHeader.write('BM', 0);
  fileHeader.writeUInt32LE(14 + 40 + size * size * 3, 2);
  fileHeader.writeUInt16LE(0, 6);
  fileHeader.writeUInt16LE(0, 8);
  fileHeader.writeUInt32LE(54, 10);
  
  // DIB header (BITMAPINFOHEADER, 40 bytes)
  const dibHeader = Buffer.alloc(40);
  dibHeader.writeUInt32LE(40, 0);
  dibHeader.writeInt32LE(size, 4);
  dibHeader.writeInt32LE(-size, 8);
  dibHeader.writeUInt16LE(1, 12);
  dibHeader.writeUInt16LE(24, 14);
  dibHeader.writeUInt32LE(0, 16);
  dibHeader.writeUInt32LE(size * size * 3, 20);
  dibHeader.writeInt32LE(2835, 24);
  dibHeader.writeInt32LE(2835, 28);
  dibHeader.writeUInt32LE(0, 32);
  dibHeader.writeUInt32LE(0, 36);
  
  // Pixel data - black background with character
  const rowSize = size * 3;
  const padding = (4 - (rowSize % 4)) % 4;
  const pixelData = Buffer.alloc(size * (rowSize + padding));
  
  // Fill with black background
  for (let i = 0; i < pixelData.length; i++) {
    pixelData[i] = 0;
  }
  
  // Draw character in center (simple approximation)
  const centerX = size / 2;
  const centerY = size / 2;
  const charSize = size * 0.6;
  
  if (char === '*') {
    // Draw asterisk as lines
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const dx = i - centerX;
        const dy = j - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Diagonal lines
        if (Math.abs(dx - dy) < 2 || Math.abs(dx + dy) < 2) {
          if (dist < charSize / 2) {
            const idx = j * (rowSize + padding) + i * 3;
            pixelData[idx] = 255;     // B
            pixelData[idx + 1] = 204; // G
            pixelData[idx + 2] = 0;   // R (yellow)
          }
        }
        // Horizontal and vertical lines
        if (Math.abs(dx) < 2 || Math.abs(dy) < 2) {
          if (dist < charSize / 2) {
            const idx = j * (rowSize + padding) + i * 3;
            pixelData[idx] = 255;     // B
            pixelData[idx + 1] = 204; // G
            pixelData[idx + 2] = 0;   // R (yellow)
          }
        }
      }
    }
  } else if (char === '#') {
    // Draw hash symbol
    const lineWidth = 2;
    const spacing = charSize / 3;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const dx = i - centerX;
        const dy = j - centerY;
        
        // Vertical lines
        if (Math.abs(dx - spacing) < lineWidth || Math.abs(dx + spacing) < lineWidth) {
          if (Math.abs(dy) < charSize / 2) {
            const idx = j * (rowSize + padding) + i * 3;
            pixelData[idx] = 102;    // B
            pixelData[idx + 1] = 102; // G
            pixelData[idx + 2] = 102; // R (gray)
          }
        }
        // Horizontal lines
        if (Math.abs(dy - spacing) < lineWidth || Math.abs(dy + spacing) < lineWidth) {
          if (Math.abs(dx) < charSize / 2) {
            const idx = j * (rowSize + padding) + i * 3;
            pixelData[idx] = 102;    // B
            pixelData[idx + 1] = 102; // G
            pixelData[idx + 2] = 102; // R (gray)
          }
        }
      }
    }
  }
  
  return Buffer.concat([fileHeader, dibHeader, pixelData]);
}

// Export all tiles
let exported = 0;
for (const codeStr in tiles) {
  const code = parseInt(codeStr, 10);
  const char = String.fromCharCode(code);
  
  // Skip control characters and spaces
  if (code < 32 || code === 127) continue;
  
  // Map invalid filename characters to safe names
  let filename;
  if (char === '\\') {
    filename = 'char_backslash.bmp';
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
  } else {
    filename = `char_${char}.bmp`;
  }
  
  // Use custom tiles for * and # with visible characters
  let bmpData;
  if (char === '*' || char === '#') {
    bmpData = createCustomTile(char, code);
  } else {
    bmpData = createTileBMP(code);
  }
  
  if (bmpData) {
    const filepath = path.join(tilesDir, filename);
    fs.writeFileSync(filepath, bmpData);
    exported++;
    console.log(`Exported: ${filename} (code ${code}, char '${char}')`);
  }
}

console.log(`\nExported ${exported} tiles to ${tilesDir}`);
console.log('Note: Files are in BMP format. Convert to PNG if needed with: convert tiles/*.bmp tiles/%.png');

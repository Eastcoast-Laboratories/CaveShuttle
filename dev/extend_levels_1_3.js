#!/usr/bin/env node
// Extend the original level 1-3 .def files by 100 columns on the right,
// using the same addRightSurfaceHill algorithm used for the generated levels.
import { readFileSync, writeFileSync } from 'fs';
import { addRightSurfaceHill, mulberry32 } from '../public/level-editor/level-generator.js';

const args = process.argv.slice(2);
let input = null;
let output = null;
let seed = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--input' && i + 1 < args.length) input = args[i + 1];
  if (args[i] === '--output' && i + 1 < args.length) output = args[i + 1];
  if (args[i] === '--seed' && i + 1 < args.length) seed = parseInt(args[i + 1], 10);
}
if (!input || !output || seed == null) {
  console.error('Usage: node dev/extend_levels_1_3.js --input <file> --output <file> --seed <seed>');
  process.exit(1);
}

const raw = readFileSync(input, 'utf-8');
const lines = raw.split('\n');
const header = lines.slice(0, 10);
const width = parseInt(header[0], 10);
const height = parseInt(header[1], 10);

const grid = [];
for (let i = 0; i < height; i++) {
  const row = (lines[10 + i] || '').split('');
  // Pad or truncate to match declared width
  while (row.length < width) row.push(' ');
  if (row.length > width) row.length = width;
  grid.push(row);
}

const rng = mulberry32(seed);
const { width: newWidth } = addRightSurfaceHill(grid, width, height, rng);

header[0] = newWidth.toString();

const outLines = [...header];
for (const row of grid) outLines.push(row.join(''));
writeFileSync(output, outLines.join('\n') + '\n');
console.log(`[OK] Extended ${input} -> ${output} (${width}x${height} -> ${newWidth}x${height})`);

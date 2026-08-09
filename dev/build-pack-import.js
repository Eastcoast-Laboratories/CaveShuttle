// Generates pack-for-import.json from meta.json and the level*.def files
// Usage: node dev/build-pack-import.js <packFolder>
// Example: node dev/build-pack-import.js dev/external-levelpacks/classic

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Usage: node dev/build-pack-import.js <packFolder>');
  console.error('Example: node dev/build-pack-import.js dev/external-levelpacks/classic');
  process.exit(1);
}

const packFolder = args[0];
const metaPath = path.join(packFolder, 'meta.json');
const outputPath = path.join(packFolder, 'pack-for-import.json');

// Read meta.json
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

// Find all level*.def files
const levelFiles = fs.readdirSync(packFolder)
  .filter(f => f.match(/^level\d+\.def$/))
  .sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)[0]);
    const numB = parseInt(b.match(/\d+/)[0]);
    return numA - numB;
  });

// Read all level files
const levels = {};
for (const file of levelFiles) {
  const levelId = file.replace('.def', '');
  const content = fs.readFileSync(path.join(packFolder, file), 'utf8');
  levels[levelId] = content.split('\n');
}

// Build the pack JSON
const pack = {
  meta,
  levels
};

// Write pack-for-import.json
fs.writeFileSync(outputPath, JSON.stringify(pack, null, 2));
console.log(`Generated ${outputPath} with ${levelFiles.length} levels`);

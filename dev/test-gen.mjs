// Development test script: generates a level with a fixed seed and validates it.
// Used to debug generator output and inspect specific tile positions that cause
// validator errors. Run with: node dev/test-gen.mjs
import { generateRandomLevel } from '../public/level-editor/level-generator.js';
import { validateDef } from '../src/levels/level-validator.js';

const text = generateRandomLevel({seed: 19});
const lines = text.split('\n');

// Show exact chars at error positions — these were the slope tiles that
// lacked wall contact above/below. Useful for verifying the slope fix works.
const errorPositions = [
  [25, 76], [25, 77], [26, 78], [26, 79],  // file rows above slopes
];
for (const [fileRow, col] of errorPositions) {
  const lineIdx = fileRow - 1; // 0-indexed line
  const ch = lines[lineIdx] ? lines[lineIdx][col] : '?';
  const charCode = ch ? ch.charCodeAt(0) : -1;
  console.log(`file row ${fileRow} col ${col}: '${ch}' (charCode ${charCode})`);
}

// Also show the slope rows themselves
for (const [fileRow, col] of [[26, 76], [26, 77], [27, 78], [27, 79]]) {
  const lineIdx = fileRow - 1;
  const ch = lines[lineIdx] ? lines[lineIdx][col] : '?';
  console.log(`file row ${fileRow} col ${col}: '${ch}' (slope row)`);
}

// Validate the generated level and print error count + first 5 errors
const result = validateDef(text);
console.log('\nErrors:', result.errors.length);
for (const e of result.errors.slice(0, 5)) console.log('  ', e);

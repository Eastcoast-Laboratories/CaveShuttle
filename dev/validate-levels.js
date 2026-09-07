// Node.js command-line entry point for validating CaveShuttle .def level files.
// Run with: node dev/validate-levels.js <level.def> ...
import { readFileSync } from 'node:fs';
import { validateDef } from '../public/level-editor/level-validator.js';

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error('usage: node dev/validate-levels.js <level.def> ...');
  process.exitCode = 2;
} else {
  let totalErrors = 0;
  for (const path of paths) {
    const text = readFileSync(path, 'utf-8');
    const result = validateDef(text);
    const status = result.valid ? 'OK' : 'FAIL';
    console.log(`[${status}] ${path}  ${JSON.stringify(result.inventory)}`);
    for (const error of result.errors) {
      console.log(`    ERROR: ${error}`);
    }
    for (const warning of result.warnings) {
      console.log(`    warn:  ${warning}`);
    }
    totalErrors += result.errors.length;
  }
  process.exitCode = totalErrors ? 1 : 0;
}

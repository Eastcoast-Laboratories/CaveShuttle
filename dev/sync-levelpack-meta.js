// Syncs public/levelpacks/<pack>/meta.json levelCount with the actual number of level*.def files.
// Run via `npm run predev` or `npm run prebuild` before Vite serves/builds the app.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const packsDir = fileURLToPath(new URL('../public/levelpacks', import.meta.url));

async function sync() {
  const entries = await readdir(packsDir, { withFileTypes: true });
  const dirs = entries.filter(e => e.isDirectory());
  for (const dir of dirs) {
    const packDir = join(packsDir, dir.name);
    const metaPath = join(packDir, 'meta.json');
    let meta;
    try {
      meta = JSON.parse(await readFile(metaPath, 'utf8'));
    } catch (err) {
      console.warn(`[sync-meta] skipping ${dir.name}: ${err.message}`);
      continue;
    }
    const files = await readdir(packDir);
    const levelFiles = files.filter(f => /^level\d+\.def$/.test(f));
    const levelCount = levelFiles.length;
    if (meta.levelCount !== levelCount) {
      meta.levelCount = levelCount;
      await writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
      console.log(`[sync-meta] ${dir.name}: updated levelCount to ${levelCount}`);
    } else {
      console.log(`[sync-meta] ${dir.name}: levelCount ${levelCount} already correct`);
    }
  }
}

sync().catch(err => {
  console.error('[sync-meta] failed:', err);
  process.exit(1);
});

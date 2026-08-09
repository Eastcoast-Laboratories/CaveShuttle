# Migrate Caveshuttle web files into dulsi-thrust repo

Migrate the Caveshuttle web application into the dulsi-thrust `caveshuttle` branch by renaming dulsi files to their Caveshuttle equivalents (preserving git history via `git mv`), then overwriting with Caveshuttle content in small logical commits.

## File Mapping: dulsi → Caveshuttle

### Direct file renames (git mv) with content overwrite

| dulsi file | Caveshuttle file | Notes |
|---|---|---|
| `datasrc/level1.def`–`level6.def` | `public/levelpacks/default/level1.def`–`level6.def` | Level data, modified in Caveshuttle |
| `datasrc/level1.c`–`level6.c` | (deleted) | C-compiled levels, not needed |
| `README` | `README.md` | Renamed + rewritten |
| `CHANGES` | `CHANGELOG.md` | Renamed + rewritten |
| `TODO` | `dev/TODO.md` | Renamed + rewritten |
| `html/index.html` | `index.html` | Renamed + rewritten |
| `datasrc/icon.png` | (app icon, multiple locations) | Moved to `public/` |
| `datasrc/ship-16.ppm` / `datasrc/ship.c` | `public/ship.png` | Converted format |
| `datasrc/title.ppm` / `datasrc/title.c` | `public/logo2.png` | Converted format |
| `datasrc/blks*.bmp` (16 files) | `public/tiles/char_*.bmp` (226 files) | Expanded tile set |
| `datasrc/blks.ppm` / `datasrc/blks.c` | `public/assets/blocks.json` | Converted to JSON |
| `datasrc/colors.pal` / `datasrc/colors.c` | (inline in `src/game/tile-renderer.js`) | Colors inlined |
| `datasrc/bullet.c` / `bullet.ppm` | `public/tiles/char_*.bmp` (bullet tiles) | Merged into tile set |
| `datasrc/shld.c` / `shld.ppm` | `public/tiles/char_*.bmp` (shield tiles) | Merged into tile set |
| `datasrc/boom.c` / `boom.snd` | `public/sounds/explosion.mp3` | Converted |
| `datasrc/engine.c` / `engine.snd` | `public/sounds/ship_thrust.mp3` | Converted |
| `datasrc/blip.c` / `blip.snd` | `public/sounds/pod_fire.wav` | Converted |
| `datasrc/harp.c` / `harp.snd` | `public/sounds/wormhole_ambient.wav` | Converted |
| `datasrc/zero.c` / `zero.snd` | `public/sounds/no-fuel.mp3` | Converted |
| `datasrc/boom2.c` / `boom2.snd` | `public/sounds/explosion.mp3` | Converted |
| `datasrc/font.c` | `public/fonts/Commodore-64-v6.3.TTF` | Replaced with TTF |
| `src/font5x5.c` / `src/font5x5.h` | (font rendering in `src/game/tile-renderer.js`) | Inlined |
| `src/thrust.c` / `src/thrust.h` / `src/thrust_t.h` | `src/App.jsx` | Main game → React app |
| `src/level.c` / `src/level.h` | `src/levels/level-loader.js` | Level parsing |
| `src/things.c` / `src/things.h` | `src/game/bullet.js`, `bunker.js`, `button.js`, `pod.js`, `ship.js`, `slider.js`, `enemy-ship.js` | Game objects split |
| `src/graphics.c` / `src/graphics.h` | `src/game/level-renderer.js`, `src/game/tile-renderer.js` | Rendering split |
| `src/hiscore.c` / `src/hiscore.h` | `src/game/high-score-manager.js` | High scores |
| `src/soundIt.c` / `src/soundIt.h` / `src/sound.h` | `src/audio/audio-engine.js`, `sound-loader.js`, `sound-manager.js` | Audio split |
| `src/init.c` / `src/init.h` / `src/options.h` / `src/config.h` | `src/core/constants.js` | Constants/config |
| `src/conf.c` / `src/conf.h` | `src/core/progress-storage.js` | Config/storage |
| `src/sdl.c` | `src/physics/collision.js` | Physics/collision |
| `src/statistics.c` / `src/statistics.h` | `src/game/scoring.js` | Scoring |
| `src/sdlkey.c` / `src/ksyms.c` / `src/ksyms.h` / `src/keyboard.h` / `src/win32key.c` / `src/doskey.c` / `src/doskey.h` | `src/core/touch-buttons.js` | Input handling |
| `src/sdlsound.c` / `src/silence.c` | (deleted, replaced by audio engine) | |
| `src/fast_gr.c` / `src/fast_gr.h` / `src/gr_drv.h` / `src/compat.h` / `src/resource.h` | (deleted, graphics driver layer not needed) | |
| `CMakeLists.txt` | `package.json` / `vite.config.js` | Build system |
| `inertiablast.desktop` | `capacitor.config.json` | App config |
| `inertiablast.man` / `inertiablast.pod` | (deleted, replaced by README.md) | |
| `inertiablast.spec` / `inertiablast.metainfo.xml` | (deleted, not needed for web) | |
| `colors.txt` | (deleted, inlined) | |
| `thrustrc` | (deleted, config now in JS) | |
| `datasrc/demomove.c` / `demomove.bin` | (deleted, no demo in web) | |
| `datasrc/nocursor.cur` / `datasrc/thrust.ico` | (deleted) | |
| `datasrc/icon48.c` / `icon48.ppm` | (deleted, replaced by PNG icons) | |
| `helpers/` (all) | (deleted, build helpers not needed) | |
| `lib/` (all) | (deleted, C libraries not needed) | |
| `m4/` (all) | (deleted, autoconf not needed) | |
| `obsolete/` (all) | (deleted) | |
| `gamerzilla/` (all) | (deleted, not used in web) | |
| `html/` (remaining) | (deleted, replaced by root index.html) | |
| `thrust.highscore` | (deleted, runtime file) | |

### Completely new files (no dulsi counterpart, just copied)

- `src/network/` (5 files) — multiplayer networking
- `src/i18n/` (5 files) — internationalization
- `src/ui/` (most files) — React UI components
- `src/editor/level-editor.js` — editor integration
- `src/capacitor/capacitor-manager.js` — mobile integration
- `src/core/data-transfer.js`, `haptics.js`, `storage-keys.js` — new core utils
- `src/levels/level-validator.js`, `levelpacks.js`, `level-pack-import.js` — level management
- `src/game/particle.js`, `particle-system.js` — effects
- `src/version.js` — version info
- `public/level-editor/` (6 files) — standalone level editor
- `public/levelpacks/default/meta.json` — pack metadata
- `public/levelpacks/default/level7.def` — new 7th level
- `public/sounds/` (remaining) — additional sounds
- `public/fonts/` (5 files) — TTF fonts
- `public/images/` — highscore images, mine
- `public/crosshair.png`, `public/POD_button.png`, `public/ship_off.png` — new graphics
- `public/tutorial/pod_docked.png` — tutorial image
- `public/tiles/` (remaining ~210 files) — expanded tile set
- `server/` (3 files) — Geckos multiplayer server
- `scripts/` (2 files) — build scripts
- `dev/` (46 files) — development tools, plans, docs
- `tests/` (33 files) — test suite
- `playwright.config.js`, `playwright-level-editor.config.js`, `playwright.prod.config.js` — E2E test config
- `ios/` — iOS project
- `caveshuttle/` — Android project
- `download/` — APK downloads
- `capacitor.config.json` — Capacitor config
- `package-lock.json` — npm lock file
- `.gitignore` — updated for web project
- `LEVELS.md` — level documentation

## Commit Plan (in order)

All work on the `caveshuttle` branch in `/var/www/dulsi-thrust`.
Each step = one commit. Commit messages shown in `code`.
Related files (data file rename + C wrapper deletion) are grouped in the same commit.

### Phase 1: Rename and clean up dulsi files (git mv + delete C wrappers together)

1. **Move level data to web path**: Rename .def files, delete C-compiled level wrappers
   - `git mv datasrc/level{1..6}.def public/levelpacks/default/` (create dir first)
   - Delete `datasrc/level{1..6}.c` (C-compiled level data, same content as .def)
   ```
   git commit -m "Move level .def files to public/levelpacks/default/ and remove C-compiled level wrappers"
   ```

2. **Move docs and index.html to web paths**: Rename to .md, move index.html to root
   - `git mv README README.md`, `git mv CHANGES CHANGELOG.md`, `git mv TODO dev/TODO.md` (create dev/ first)
   - `git mv html/index.html index.html`
   - Delete remaining `html/` files: `background.png`, `common.css`, `screenshot1.png`, `screenshot2.png`, `screenshots.html`, `title.png`
   ```
   git commit -m "Rename docs to .md, move index.html to root, remove old html/ screenshots"
   ```

3. **Move tile graphics to public/tiles/**: Rename BMPs, delete C-compiled tile data and palette
   - `git mv datasrc/blks0-8.bmp public/tiles/char_0.bmp` etc. (16 tile BMPs)
   - Delete `datasrc/blks.c` (C-compiled pixel data, auto-generated from blks.ppm)
   - Delete `datasrc/blks.ppm` (source PPM, converted to BMP tiles)
   - Delete `datasrc/colors.c`, `datasrc/colors.pal` (C64 color palette, inlined in tile-renderer.js)
   - Delete `datasrc/bullet.c`, `datasrc/bullet.ppm`, `datasrc/bullet-4.bmp` (bullet sprite, merged into tile set)
   - Delete `datasrc/shld.c`, `datasrc/shld.ppm`, `datasrc/shld-17.bmp` (shield sprite, merged into tile set)
   ```
   git commit -m "Move tile BMPs to public/tiles/, remove C-compiled tile/bullet/shield pixel data and color palette"
   ```

4. **Move sounds to public/sounds/**: Rename .snd files, delete C-compiled audio wrappers
   - `git mv datasrc/boom.snd public/sounds/explosion.mp3`
   - Delete `datasrc/boom.c`, `datasrc/boom2.c`, `datasrc/boom2.snd` (explosion sound + C wrapper, all map to explosion.mp3)
   - `git mv datasrc/engine.snd public/sounds/ship_thrust.mp3`
   - Delete `datasrc/engine.c` (engine sound C wrapper)
   - `git mv datasrc/blip.snd public/sounds/pod_fire.wav`
   - Delete `datasrc/blip.c` (blip sound C wrapper)
   - `git mv datasrc/harp.snd public/sounds/wormhole_ambient.wav`
   - Delete `datasrc/harp.c` (harp sound C wrapper)
   - `git mv datasrc/zero.snd public/sounds/no-fuel.mp3`
   - Delete `datasrc/zero.c` (zero/no-fuel sound C wrapper)
   ```
   git commit -m "Move sound .snd files to public/sounds/ and remove C-compiled audio wrappers (boom, engine, blip, harp, zero)"
   ```

5. **Move graphics to public/**: Rename sprites, delete C-compiled sprite data
   - `git mv datasrc/icon.png public/icon.png` (placeholder)
   - `git mv datasrc/ship-16.ppm public/ship.png` (placeholder)
   - Delete `datasrc/ship.c` (ship sprite C wrapper)
   - `git mv datasrc/title.ppm public/logo2.png` (placeholder)
   - Delete `datasrc/title.c` (title sprite C wrapper)
   - Delete `datasrc/icon48.c`, `datasrc/icon48.ppm` (48px icon, replaced by PNG)
   - Delete `datasrc/nocursor.cur`, `datasrc/thrust.ico` (cursor/ico, not needed in web)
   - Delete `datasrc/font.c` (5x5 pixel font C array, replaced by TTF)
   - Delete `datasrc/demomove.c`, `datasrc/demomove.bin` (demo recording, no web equivalent)
   ```
   git commit -m "Move sprite/icon graphics to public/ and remove C-compiled sprite/font/demo data"
   ```

6. **Rename game logic C source to JS paths**: Main game, level, objects, rendering, scoring
   - `git mv src/thrust.c src/App.jsx`, delete `src/thrust.h`, `src/thrust_t.h`
   - `git mv src/level.c src/levels/level-loader.js`, delete `src/level.h`
   - `git mv src/things.c src/game/game-objects.js`, delete `src/things.h`
   - `git mv src/graphics.c src/game/level-renderer.js`, delete `src/graphics.h`
   - `git mv src/hiscore.c src/game/high-score-manager.js`, delete `src/hiscore.h`
   - `git mv src/statistics.c src/game/scoring.js`, delete `src/statistics.h`
   ```
   git commit -m "Rename game logic C source to JS module paths (thrust, level, things, graphics, hiscore, statistics)"
   ```

7. **Rename system C source to JS paths**: Audio, config, physics, input + delete obsolete C files
   - `git mv src/soundIt.c src/audio/audio-engine.js`, `git mv src/soundIt.h src/audio/sound-manager.js`, delete `src/sound.h`
   - `git mv src/init.c src/core/constants.js`, delete `src/init.h`, `src/options.h`, `src/config.h`
   - `git mv src/conf.c src/core/progress-storage.js`, delete `src/conf.h`
   - `git mv src/sdl.c src/physics/collision.js`
   - `git mv src/sdlkey.c src/core/touch-buttons.js`
   - Delete: `src/compat.h`, `src/fast_gr.c`, `src/fast_gr.h`, `src/gr_drv.h`, `src/resource.h` (graphics driver layer)
   - Delete: `src/font5x5.c`, `src/font5x5.h` (bitmap font, replaced by TTF)
   - Delete: `src/sdlsound.c`, `src/silence.c` (sound stubs, replaced by audio engine)
   - Delete: `src/win32key.c`, `src/doskey.c`, `src/doskey.h`, `src/ksyms.c`, `src/ksyms.h`, `src/keyboard.h` (platform input, replaced by touch-buttons.js)
   ```
   git commit -m "Rename system C source to JS module paths (audio, config, physics, input) and remove obsolete C drivers/font/sound stubs"
   ```

8. **Rename build config files**: CMake → package.json, desktop → capacitor, remove C build infra
   - `git mv CMakeLists.txt package.json` (placeholder)
   - `git mv inertiablast.desktop capacitor.config.json` (placeholder)
   - Delete entire directories: `helpers/`, `lib/`, `m4/`, `obsolete/`, `gamerzilla/`
   - Delete: `colors.txt`, `thrustrc`, `thrust.highscore`, `inertiablast.man`, `inertiablast.pod`, `inertiablast.spec`, `inertiablast.metainfo.xml`, `inertiablast` (binary)
   ```
   git commit -m "Rename build config to web equivalents (CMakeLists.txt → package.json, .desktop → capacitor.config.json) and remove C build infrastructure (helpers, lib, m4, obsolete, gamerzilla, man pages, spec)"
   ```

### Phase 2: Overwrite with Caveshuttle content

9. **Merge .gitignore**: Add Caveshuttle entries to existing dulsi .gitignore (keep dulsi entries for now)
   - Add: `node_modules/`, `dist/`, `.env*`, `.vscode/`, `.idea/`, `.DS_Store`, `*.log`, `coverage/`, `playwright-report/*`, `.playwright-browsers/*`, `test-results/*`, `.dev-certs/`, `/caveshuttle/app/release/*`
   - Keep existing dulsi entries (`CMakeCache.txt`, `CMakeFiles/`, `inertiablast`, `thrust.highscore`, `thrustrc`, `build/`, `*/node_modules/*`) — they will be cleaned up in the final step
   ```
   git commit -m "Merge Caveshuttle .gitignore entries (node_modules, dist, .env, test artifacts) into existing .gitignore"
   ```

10. **Update content: levels, docs, index.html**
    - Overwrite `public/levelpacks/default/level{1..6}.def`, add `level7.def` + `meta.json`
    - Overwrite `README.md`, `CHANGELOG.md`, `dev/TODO.md`, `index.html`
    ```
    git commit -m "Update levels, docs, and index.html with Caveshuttle content"
    ```

11. **Replace build config**: package.json, vite.config.js, capacitor.config.json
    - Overwrite `package.json`, add `package-lock.json`, `vite.config.js`
    - Overwrite `capacitor.config.json`
    ```
    git commit -m "Replace build config with Caveshuttle package.json, vite.config.js, capacitor.config.json"
    ```

12. **Replace app entry**: App.jsx, main.jsx, index.css
    - Overwrite `src/App.jsx`, add `src/main.jsx`, `src/index.css`
    ```
    git commit -m "Replace app entry: App.jsx, main.jsx, index.css"
    ```

13. **Update game logic modules**: Level loader, game objects, rendering, high-score, scoring
    - Overwrite `src/levels/level-loader.js`, add `level-validator.js`, `levelpacks.js`, `level-pack-import.js`
    - Overwrite/add all `src/game/*.js` (bullet, bunker, button, enemy-ship, pod, ship, slider, level-renderer, tile-renderer, high-score-manager, scoring, particle, particle-system)
    ```
    git commit -m "Update game logic modules with Caveshuttle implementations"
    ```

14. **Update audio and core utility modules**: Audio engine, constants, storage, physics, input
    - Overwrite `src/audio/audio-engine.js`, `sound-manager.js`, add `sound-loader.js`
    - Overwrite `src/core/constants.js`, `progress-storage.js`, `touch-buttons.js`
    - Add `src/core/data-transfer.js`, `haptics.js`, `storage-keys.js`
    - Overwrite `src/physics/collision.js`
    ```
    git commit -m "Update audio engine and core utility modules with Caveshuttle implementations"
    ```

15. **Add level editor**: Standalone editor + React wrapper
    - Add `src/editor/level-editor.js`
    - Add `src/ui/LevelEditor.jsx`, `src/ui/level-editor.css`
    - Add `public/level-editor/` (editor.js, tile-definitions.js, level-generator.js, level-renderer.js, editor.css, index.html)
    ```
    git commit -m "Add level editor (standalone vanilla JS + React wrapper with Pack Builder)"
    ```

16. **Add React UI components**: All src/ui/ files
    - Add: Menu, HUD, GameCanvas, HamburgerMenu, overlays, lobby, multiplayer, highscores, legal pages, etc.
    ```
    git commit -m "Add React UI components (Menu, HUD, GameCanvas, overlays, lobby, highscores, legal pages)"
    ```

17. **Add i18n, network, capacitor, and version modules**
    - Add `src/i18n/` (LanguageContext, localLobby, multiplayer, networkStatus, tutorial)
    - Add `src/network/` (CaveNetworkManager, GeckosAdapter, WebRTCAdapter, NetworkContext, event-emitter)
    - Add `src/capacitor/capacitor-manager.js`
    - Add `src/version.js`
    ```
    git commit -m "Add i18n, network, capacitor, and version modules"
    ```

18. **Add public assets**: Tiles, sounds, fonts, images, graphics, blocks.json
    - Add `public/tiles/` (~210 BMP files)
    - Add `public/sounds/` (13 wav/mp3 files)
    - Add `public/fonts/` (5 TTF/GIF files)
    - Add `public/images/` (highscore images, mine)
    - Overwrite/add: `crosshair.png`, `POD_button.png`, `ship.png`, `ship_off.png`, `logo2.png`, `tutorial/pod_docked.png`
    - Add `public/assets/blocks.json`
    ```
    git commit -m "Add public assets (tiles, sounds, fonts, images, graphics, blocks.json)"
    ```

19. **Add server and build scripts**
    - Add `server/` (index.js, package.json, package-lock.json — Geckos multiplayer server)
    - Add `scripts/` (build.js, convert-blocks.js)
    ```
    git commit -m "Add multiplayer server and build scripts"
    ```

20. **Add development tools, tests, and Playwright config**
    - Add `dev/` (development tools, plans, docs, deploy scripts)
    - Add `tests/` (unit, integration, e2e test suite)
    - Add `playwright.config.js`, `playwright-level-editor.config.js`, `playwright.prod.config.js`
    ```
    git commit -m "Add development tools, test suite, and Playwright config"
    ```

21. **Add mobile projects and LEVELS.md**
    - Add `ios/` (Capacitor iOS project)
    - Add `caveshuttle/` (Capacitor Android project)
    - Add `download/` (APK releases)
    - Add `LEVELS.md`
    ```
    git commit -m "Add mobile projects (iOS, Android) and LEVELS.md"
    ```

22. **Clean up .gitignore**: Remove dulsi-specific entries no longer needed
    - Remove: `CMakeCache.txt`, `CMakeFiles/`, `cmake_install.cmake`, `install_manifest.txt`, `Makefile`, `inertiablast`, `thrust.highscore`, `thrustrc`, `*/node_modules/*`
    - Keep: `build/` (still useful), all Caveshuttle entries from step 9
    - Final .gitignore should match Caveshuttle's exactly
    ```
    git commit -m "Clean up .gitignore: remove C-era entries (CMake, inertiablast, thrustrc) now that C files are gone"
    ```

## Notes

- Each numbered item = one git commit (22 commits total)
- `git mv` preserves rename history so `git log --follow` works
- Related files (data rename + C wrapper deletion) are in the same commit, with commit messages explaining the relationship
- Content overwrites are separate commits after renames, so the diff shows only content changes
- Some "placeholder" renames (e.g. `CMakeLists.txt` → `package.json`) will show as complete rewrites in the overwrite commit, but the rename link is still preserved
- The dulsi `caveshuttle` branch currently has 2 extra commits (`.gitignore` additions) on top of `master` — we build on top of those
- `.gitignore` is merged first (step 9) to prevent node_modules/dist from being committed during Phase 2, then cleaned up last (step 22) to remove obsolete C-era entries
- Source: `/var/www/Thrust` (Caveshuttle repo, `main` branch)
- Target: `/var/www/dulsi-thrust` (dulsi repo, `caveshuttle` branch)

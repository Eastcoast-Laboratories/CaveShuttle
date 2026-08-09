# Sound effects, ambient loops and volume slider

Search and download suitable sound assets from free online sources, load them into the existing Web Audio engine, wire them to the correct game events (ship/pod/bunker/fuel/docking/wormhole), and add a single master-volume slider to the hamburger menu.

## Clarifications used
- **Sound source:** free online sound assets downloaded into `public/sounds/`. Files are loaded via `fetch` + `decodeAudioData`.
- **Volume control:** one master slider in the hamburger menu (0–100 %).
- **Scope:** all requested sounds at once.
- **Differentiation:** ship thrust, pod thrust, ship fire, pod fire and bunker fire each get their own sound; wormhole ambient is a loop while the wormhole is visible.

## Sound-to-event mapping

| Event | Sound name | Loop? | Notes |
|---|---|---|---|
| Ship accelerates (`accelerateActive`/keyboard) | `shipThrust` | yes | stops when thrust ends |
| Pod accelerates (2-player pod mode) | `podThrust` | yes | distinct from ship thrust |
| Ship fires | `shipFire` | no | one-shot per shot |
| Pod fires (2-player docked) | `podFire` | no | distinct from ship fire |
| Bunker fires | `bunkerFire` | no | distinct enemy shot sound |
| POD/special button held | `podWobble` | yes | plays while shield/tractor active |
| Explosion (ship/bunker) | `explosion` | no | shared one-shot |
| Fuel drains while shield active | `fuelDrain` | yes | loop only while shield active and fuel > 0 |
| Pod docks | `podDock` | no | one-shot on docking |
| Wormhole visible | `wormholeAmbient` | yes | loop while wormhole on screen |
| Level finished through wormhole | `wormholeComplete` | no | one-shot when level ends |

## Architecture changes

1. **Asset discovery & download**
   - Search free libraries (Freesound, itch.io, OpenGameArt, DeadSounds) for each required sound.
   - Download chosen `.wav`/`.ogg`/`.mp3` files into `public/sounds/` with clear filenames.
   - Prefer short, loopable files for thrust/ambient/drain/wobble sounds and short one-shots for fire/explosion/dock/complete.

2. **Sound loader** (`src/audio/sound-loader.js`)
   - Map logical sound names to `public/sounds/<filename>`.
   - Fetch each file, decode it with `audioContext.decodeAudioData`, and pass the resulting `AudioBuffer`s to `SoundManager.loadSounds()`.

3. **SoundManager** (`src/audio/sound-manager.js`)
   - On `init()` call the loader and wait for all buffers before starting the game.
   - Add `setMasterVolume(value)` (0–1). Keep a reference to every active `gainNode` so volume changes apply to currently playing loops.
   - Add play/stop helpers for the new sounds and keep `current*` instances for looping sounds (`shipThrust`, `podThrust`, `podWobble`, `fuelDrain`, `wormholeAmbient`).

4. **AudioEngine** (`src/audio/audio-engine.js`)
   - Enhance `playSound` to return `{ source, gainNode, name }`.
   - Add `setMasterVolume` that iterates active sounds and scales gain nodes.
   - Track active sounds so volume updates affect loops.

5. **GameCanvas** (`src/ui/GameCanvas.jsx`)
   - Instantiate `SoundManager` and call `init()` on mount / first user gesture.
   - Trigger sounds in the game loop/state:
     - Ship thrust: `accelerateActive` or `keys.accelerate`.
     - Pod thrust: `p2ThrustActive`.
     - Ship fire: when a player bullet is created.
     - Pod fire: when a pod bullet is created in 2-player docked mode.
     - Bunker fire: when a bunker fires.
     - POD wobble: while `shieldActive`/`touchActive`.
     - Explosion: on ship/bunker destruction.
     - Fuel drain: while `shieldActive && fuel > 0`.
     - Pod dock: when `pod.towed` becomes true.
     - Wormhole ambient: while `wormholeActive`.
     - Wormhole complete: on level-complete transition.

6. **HamburgerMenu** (`src/ui/HamburgerMenu.jsx`)
   - Accept `soundVolume` and `onSoundVolumeChange` props.
   - Add a “Sound Volume” row with an `<input type="range" min="0" max="100" />` under SETTINGS.
   - Persist volume to `localStorage` so it survives reloads.

7. **App.jsx**
   - Store `soundVolume` in state, read/write `localStorage`.
   - Pass `soundVolume` and setter to `HamburgerMenu` and `GameCanvas`.
   - `GameCanvas` forwards volume to `SoundManager.setMasterVolume()` whenever it changes.

## Files to touch
- `public/sounds/` (new directory for downloaded assets)
- `src/audio/sound-loader.js` (new)
- `src/audio/audio-engine.js`
- `src/audio/sound-manager.js`
- `src/ui/GameCanvas.jsx`
- `src/ui/HamburgerMenu.jsx`
- `src/App.jsx`
- `src/core/storage-keys.js` or `localStorage` key for volume

## Candidate sources
- `freesound.org` – e.g. `SPACE ENGINE THRUST.wav` (vedas), `Retro Blaster Fire` (astrand), `Sci-fi engines` pack (Jace).
- `towball.itch.io/retro-sci-fi` – free retro sci-fi pack (lasers, explosions, alarms).
- `tonedstudio.itch.io/free-laser-energy-fx-pack` – laser/energy FX.
- `opengameart.org/content/63-digital-sound-effects-lasers-phasers-space-etc` – digital SFX set.
- `deadsounds.com` – individual space war sounds.

## Open questions / assumptions
- **Online assets:** I will pick short, permissively licensed files. License attribution/credit will be documented in `public/sounds/README.md` or a `credits` constant if required.
- **Wormhole visibility:** The loop is tied to a boolean state in `GameCanvas` (e.g., `wormholeActive` or the wormhole animation flag).
- **Fuel drain sound:** It is a subtle looping drone; it will be stopped as soon as the shield key/button is released or fuel reaches 0.

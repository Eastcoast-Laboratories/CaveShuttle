# caveshuttle Cross-Platform Porting Plan

## Overview
Port the space game to a modern web application using HTML5 Canvas + JavaScript, with native iOS and Android app support via Capacitor. Maximize code reuse from the existing C codebase.

## Architecture

### Tech Stack
- **Framework**: React (for UI components, menus, game state management)
- **Rendering**: HTML5 Canvas API (replaces SDL graphics)
- **Physics**: Ported C physics engine to JavaScript
- **Audio**: Web Audio API (replaces SDL sound)
- **Build**: Vite (fast dev server, bundling)
- **Testing**: Vitest (unit tests), Playwright (E2E tests)
- **Mobile Wrapper**: Capacitor (iOS + Android native apps with WebView)
- **Touch Controls**: Virtual joystick + buttons for mobile
- **Gravity Sensor**: DeviceOrientation/DeviceMotion API for tilt-based control (optional)

### Project Structure
```
/var/www/Thrust/
├── src/
│   ├── core/
│   │   ├── physics.js        # Ported from C code (gravity, thrust, inertia)
│   │   ├── level-parser.js   # Ported from level.c (def file parsing)
│   │   ├── game-objects.js   # Ported from things.c (bunkers, buttons, sliders)
│   │   └── collision.js      # Ported collision detection
│   ├── graphics/
│   │   ├── renderer.js       # Canvas rendering (replaces SDL)
│   │   ├── sprites.js        # Sprite management (converted from datasrc/)
│   │   └── effects.js        # Particle effects, explosions
│   ├── audio/
│   │   ├── sound-engine.js   # Web Audio API wrapper
│   │   └── sounds.js         # Sound definitions (converted from .snd files)
│   ├── input/
│   │   ├── keyboard.js       # Keyboard event handling (replaces doskey.c)
│   │   ├── touch.js          # Virtual joystick + touch controls
│   │   └── gravity.js        # DeviceOrientation/DeviceMotion API for tilt control
│   ├── game/
│   │   ├── game-loop.js      # requestAnimationFrame loop
│   │   ├── game-state.js     # Score, lives, level progression
│   │   └── constants.js      # Game constants (port from C code)
│   ├── levels/
│   │   ├── level-parser.js   # Parse level files (def/JSON)
│   │   ├── level-validator.js # Validate level syntax and structure
│   │   └── level-loader.js   # Load and cache levels
│   ├── editor/
│   │   ├── LevelEditor.jsx   # Visual level editor component
│   │   ├── tile-palette.jsx  # Tile selection palette
│   │   └── level-exporter.js # Export levels to def/JSON
│   ├── ui/
│   │   ├── App.jsx           # Main React component
│   │   ├── GameCanvas.jsx    # Canvas component
│   │   ├── Menu.jsx          # Start menu
│   │   ├── HUD.jsx           # Score, fuel display
│   │   └── TouchControls.jsx # Virtual joystick overlay
│   └── main.jsx              # Entry point
├── tests/
│   ├── unit/
│   │   ├── physics.test.js      # Physics engine tests
│   │   ├── level-parser.test.js # Level parsing tests
│   │   ├── game-objects.test.js # Game objects tests
│   │   └── collision.test.js    # Collision detection tests
│   ├── integration/
│   │   └── game-loop.test.js    # Game loop integration tests
│   └── e2e/
│       └── gameplay.spec.js     # Playwright E2E tests
├── public/
│   └── assets/
│       ├── sprites/          # Converted sprite images
│       └── levels/           # Original .def level files
├── capacitor.config.ts        # Capacitor configuration
├── android/                   # Generated Android native project
├── ios/                       # Generated iOS native project
├── package.json
└── vite.config.js
```

## Code Reuse Strategy

### 1. Level Format (100% Reuse)
**Source**: `datasrc/level1.def`, `level2.def`, etc.

The ASCII-based level format is perfect for web:
- Keep `.def` files unchanged
- Port `level.c::readbana()` to JavaScript
- Parse dimensions, colors, and level layout identically

**Mapping**:
- `#` → Solid wall/barrier
- `*` → Restart point
- `@`-`K` → Sliders (12 types)
- `L`, `N` → Buttons
- `P`, `U`, `[`, `\` → Bunkers (4 types)
- `` ` `` → Fuel
- `d` → Power plant
- `m` → Pod position

### 2. Physics Engine (90% Reuse)
**Source**: C code

Port these core physics functions to JavaScript:
- Ship movement (x, y, vx, vy with gravity)
- Thrust calculation (alpha, deltaalpha)
- Collision detection (insideblock, pixel-perfect)
- Pod towing physics (loadcontact, loadpoint)

**Constants to port** (from C code):
- BBILDX, BBILDY (block dimensions)
- maxlenx, maxleny (max level size)
- Gravity constant
- Thrust power

### 3. Game Objects (85% Reuse)
**Source**: `src/things.c`

Port these structures and functions:
- `thing` struct → JavaScript class/object
- `slider` struct → JavaScript class with animation
- `bullet` struct → Projectile system
- `fragment` struct → Particle system
- Object types: FUEL, POWERPLANT, BUNKER1-4, BUTTON1-2

**Functions to port**:
- `newthing()`, `newslider()`, `newbullet()`
- `animatesliders()`, `movebullets()`, `movefragments()`
- `bunkerfirebullet()`, `hit()`, `explodething()`

### 4. Game Logic (80% Reuse)
**Source**: C code

Port:
- Game state variables (score, lives, fuel, shield)
- Level progression logic
- Restart point system
- Barrier/restart point matching
- Power plant logic

## Implementation Phases

### Phase 1: Foundation (Core Physics) - TDD
1. Set up React + Vite project with Vitest
2. Design modular level format (JSON or enhanced .def with metadata)
3. Write unit tests for level parser (def file parsing)
4. Implement level parser to pass tests (modular, extensible)
5. Write unit tests for level validation (syntax, dimensions, required elements)
6. Implement level validation to pass tests
7. Write unit tests for physics engine (gravity, thrust, rotation)
8. Implement physics engine to pass tests
9. Write unit tests for keyboard input handling
10. Implement keyboard input to pass tests
11. Create Canvas renderer component
12. Write integration test: ship flies in level with gravity

**Deliverable**: Ship can fly in a level with gravity, all tests pass, modular level system

### Phase 2: Game Objects - TDD
1. Write unit tests for game object structures (thing, slider, bullet, fragment)
2. Implement game object structures to pass tests
3. Write unit tests for bunker types and shooting logic
4. Implement bunker types and shooting to pass tests
5. Write unit tests for button/slider system
6. Implement button/slider system to pass tests
7. Write unit tests for fuel pickup
8. Implement fuel pickup to pass tests
9. Write unit tests for pod pickup and towing physics
10. Implement pod pickup and towing to pass tests
11. Write integration test: bunkers shoot, buttons work, pod tows

**Deliverable**: Complete game objects with interactions, all tests pass

### Phase 3: Modern Graphics & Effects - TDD
1. Write unit tests for sprite loading and rendering
2. Create modern vector-based or high-res sprite assets (ship, pod, bunkers, bullets)
3. Implement sprite loading to pass tests
4. Write unit tests for particle system (explosions, engine flame)
5. Implement particle system to pass tests
6. Write unit tests for shield visual effect
7. Implement shield effect with transparency/glow to pass tests
8. Write unit tests for tractor beam visualization
9. Implement tractor beam with smooth gradients to pass tests
10. Create modern tileset for level walls (smooth edges, gradients)
11. Write integration test: sprites render, effects play correctly

**Deliverable**: Modern, polished graphics with antialiasing, all tests pass

### Phase 4: Audio - TDD
1. Write unit tests for Web Audio API sound engine
2. Convert sound files from `.snd` to Web Audio format
3. Implement Web Audio API sound engine to pass tests
4. Write unit tests for sound playback (engine, shooting, explosion, pickup)
5. Add engine thrust sound to pass tests
6. Add shooting, explosion, pickup sounds to pass tests
7. Add background music (optional) with tests
8. Write integration test: sounds play correctly in game context

**Deliverable**: Complete audio experience, all tests pass

### Phase 5: Game Loop & UI - TDD
1. Write unit tests for game loop (requestAnimationFrame, delta time)
2. Implement game loop to pass tests
3. Write unit tests for scoring system
4. Implement scoring system to pass tests
5. Write unit tests for lives and game over logic
6. Implement lives and game over to pass tests
7. Write unit tests for game state management
8. Implement game state to pass tests
9. Write unit tests for React UI components (Menu, HUD)
10. Create main menu and level selection to pass tests
11. Add HUD (fuel, score, shield status) to pass tests
12. Write integration test: full game loop works from start to game over

**Deliverable**: Complete playable game, all tests pass

### Phase 6: Mobile & Cross-Platform - TDD
1. Write unit tests for level loading (all 6 levels)
2. Add all 6 original levels to pass tests
3. Write unit tests for high score system (localStorage)
4. Implement high score system to pass tests
5. Write unit tests for virtual joystick + touch controls
6. Implement virtual joystick + touch controls to pass tests
7. Write unit tests for gravity sensor control (DeviceOrientation/DeviceMotion API)
8. Implement gravity sensor control to pass tests
9. Write unit tests for control settings menu
10. Add control settings menu (keyboard/touch/gravity selection) to pass tests
11. Write unit tests for responsive canvas sizing
12. Implement responsive canvas sizing to pass tests
13. Write integration tests for mobile features (touch, gravity, responsive)
14. Add device orientation lock (landscape only)
15. Add prevent-default for touch events (no zoom/scroll)
16. Performance optimization for mobile devices
17. Cross-browser and cross-device testing
18. Set up Playwright for E2E testing
19. Write E2E tests for core gameplay (ship flies, pod pickup, level completion)
20. Configure Playwright for visual debugging (headed mode, trace viewer, video recording)

**Deliverable**: Web app ready for mobile browsers, all tests pass

### Phase 7: Capacitor Setup (Native Apps) - TDD
1. Write unit tests for Capacitor plugin integrations
2. Install and configure Capacitor to pass tests
3. Write integration tests for iOS-specific features
4. Set up iOS project (Xcode configuration) to pass tests
5. Write integration tests for Android-specific features
6. Set up Android project (Android Studio configuration) to pass tests
7. Configure app icons and splash screens
8. Set up app metadata (name, version, bundle ID)
9. Configure permissions (if needed)
10. Write E2E tests for native app features (back button, lifecycle)
11. Test in iOS Simulator
12. Test on Android Emulator

**Deliverable**: Native iOS and Android projects configured, all tests pass

### Phase 8: Native App Polish - TDD
1. Write unit tests for native back button handling (Android)
2. Implement native back button handling to pass tests
3. Write unit tests for native app lifecycle handling (pause/resume)
4. Add native app lifecycle handling to pass tests
5. Write unit tests for haptic feedback system
6. Add haptic feedback for collisions/pickups to pass tests
7. Write performance tests for mobile optimization
8. Optimize for mobile performance (reduce memory usage) to pass performance tests
9. Write E2E tests for native features on real devices
10. Test on real iOS devices
11. Test on real Android devices
12. Fix platform-specific bugs

**Deliverable**: Production-ready native apps, all tests pass

### Phase 9: App Store Deployment - TDD
1. Write tests for build scripts (APK/AAB generation, IPA generation)
2. Prepare screenshots and app store descriptions
3. Configure iOS App Store Connect metadata
4. Configure Google Play Store metadata
5. Create app icons for all required sizes
6. Generate signed APK/AAB for Android (validate with tests)
7. Generate IPA for iOS (validate with tests)
8. Write smoke tests for generated builds
9. Submit to Apple App Store
10. Submit to Google Play Store

**Deliverable**: Apps published to both stores, build tests pass

### Phase 10: Level Editor (Optional, Parallel to Phase 6-9)
1. Write unit tests for level editor state management
2. Implement visual level editor component to pass tests
3. Write unit tests for tile palette and placement
4. Implement tile palette and placement to pass tests
5. Write unit tests for level export (def/JSON)
6. Implement level export to pass tests
7. Write unit tests for level import and validation
8. Implement level import and validation to pass tests
9. Add undo/redo functionality for level editing
10. Add level preview mode (test level in editor)
11. Write integration tests: create level in editor, export, import, play

**Deliverable**: Functional level editor for creating and modifying levels

## Level System Design

### Modular Level Format
Levels are stored as separate files with clear structure:

**Format Options:**
1. **Enhanced .def** (backward compatible with original)
   - Keep ASCII art layout
   - Add metadata section (name, author, difficulty, colors)
   - Add custom properties section

2. **JSON Format** (modern, extensible)
   - Structured data with validation
   - Easy to parse and modify
   - Support for custom properties

**Recommended:** Support both formats for maximum flexibility

### Level Structure
```
public/levels/
├── level1.def          # Original level 1
├── level2.def          # Original level 2
├── level3.def          # Original level 3
├── level4.def          # Original level 4
├── level5.def          # Original level 5
├── level6.def          # Original level 6
├── custom/
│   ├── my_level_1.def  # User-created level
│   ├── my_level_2.json # User-created level (JSON)
│   └── community/      # Community levels
└── templates/
    ├── easy_template.def
    ├── medium_template.def
    └── hard_template.def
```

### Level Metadata (Enhanced Format)
```def
# Metadata section
NAME: "Crystal Caves"
AUTHOR: "Player"
DIFFICULTY: 3
VERSION: 1.0
DESCRIPTION: "Navigate through crystal formations"

# Colors
BG_COLOR: 189 24 33
GUN_COLOR: 24 211 24
POD_COLOR: 24 211 24
TEXT_COLOR: 0 164 0
SHIELD_COLOR: 49 231 198

# Level dimensions
WIDTH: 82
HEIGHT: 60
START_HEIGHT: 17
EMPTY_HEIGHT: 5
BEDROCK_HEIGHT: 25

# Level layout (ASCII art)
...
```

### Level Validation
The level validator checks:
- Required fields present
- Valid dimensions (within min/max)
- Valid color values (0-255)
- Required elements (at least one restart point, one pod)
- Valid character codes in layout
- No overlapping objects
- Slider-button connections valid

### Level Editor Features
- **Visual Grid:** Click to place tiles
- **Tile Palette:** All available tiles (walls, bunkers, buttons, sliders, fuel, pod)
- **Undo/Redo:** Full history support
- **Preview Mode:** Test level without leaving editor
- **Export/Import:** Save as .def or JSON
- **Validation:** Real-time error checking
- **Templates:** Start from blank or existing templates
- **Community Sharing:** Export/import for sharing levels

## Asset Creation

### Modern Sprites
Create new high-resolution or vector-based assets:
- **Ship**: Modern design with 16 rotation angles, smooth edges, engine glow
- **Pod**: Sleek energy pod design with glow effects
- **Bunkers**: 4 types with modern sci-fi aesthetics
- **Bullets**: Smooth projectile designs with trail effects
- **Shield**: Transparent/glowing shield overlay
- **Walls**: Modern tileset with smooth edges, gradients, and textures
- **Particles**: Explosion, engine flame, spark effects with glow

**Tools**: Use vector graphics (SVG) or high-res PNG with transparency, optimize for Canvas rendering

### Sounds
Convert from `.snd` files:
- `engine.snd` → Engine thrust sound
- `blip.snd` → Pod pickup sound
- `boom.snd`, `boom2.snd` → Explosion sounds
- `zero.snd` → Shooting sound
- `harp.snd` → Background music (optional)

### Levels
Copy `.def` files unchanged:
- `level1.def` through `level6.def`

## Key Technical Decisions

### 1. Coordinate System
Keep the original 8-units-per-pixel system for physics accuracy, scale for rendering:
- Physics: Internal coordinates (8x precision)
- Rendering: Scale down by 8 for display

### 2. Game Loop
Use `requestAnimationFrame` with delta time for consistent physics:
```javascript
function gameLoop(timestamp) {
  const dt = timestamp - lastTime;
  updatePhysics(dt);
  render();
  requestAnimationFrame(gameLoop);
}
```

### 3. Collision Detection
Port the pixel-perfect collision from C code using Canvas pixel data or bitmask arrays.

### 4. State Management
Use React for UI state (menus, HUD), but keep game physics in pure JavaScript for performance.

### 5. Gravity Sensor Control
Use DeviceOrientation/DeviceMotion API for tilt-based control:

**DeviceOrientation (rotation):**
- `event.alpha` - Z-axis rotation (0-360°)
- `event.beta` - X-axis rotation (-180 to 180°, front/back tilt)
- `event.gamma` - Y-axis rotation (-90 to 90°, left/right tilt)

**Mapping to Thrust:**
- `gamma` (left/right tilt) → Ship rotation
- `beta` (front/back tilt) → Thrust (forward tilt = thrust)
- Threshold values to prevent accidental inputs
- Calibration option for neutral position

**iOS 13+ Permission:**
```javascript
// Request permission for iOS 13+
if (typeof DeviceOrientationEvent.requestPermission === 'function') {
  DeviceOrientationEvent.requestPermission()
    .then(response => {
      if (response === 'granted') {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    });
}
```

**Fallback:**
- If sensor not available → Default to virtual joystick
- User can select control type in settings menu

## Implementation Priority
Phases are ordered by dependency - each phase builds on the previous one.

## AI Vibecoding Optimization

### Incremental Deliverables
Each phase produces a working, testable component:

**Phase 1 Deliverable**: Flying ship in a level with gravity
**Phase 2 Deliverable**: Complete game objects with interactions
**Phase 3 Deliverable**: Visual polish matching original
**Phase 4 Deliverable**: Complete audio experience
**Phase 5 Deliverable**: Complete playable game
**Phase 6 Deliverable**: Web app ready for mobile browsers
**Phase 7 Deliverable**: Native iOS and Android projects configured
**Phase 8 Deliverable**: Production-ready native apps
**Phase 9 Deliverable**: Apps published to both stores

### Clear Dependencies
- Phase 2 depends on Phase 1 (physics needed for game objects)
- Phase 3 depends on Phase 2 (objects needed for rendering)
- Phase 4 is independent (can be done in parallel with Phase 2-3)
- Phase 5 depends on Phase 2-3 (game loop needs objects + rendering)
- Phase 6 depends on Phase 5 (mobile needs working game)
- Phase 7 depends on Phase 6 (Capacitor needs web app)
- Phase 8 depends on Phase 7 (polish needs native projects)
- Phase 9 depends on Phase 8 (deployment needs polished apps)

### Testable Milestones
After each phase, run tests and game to verify:
- Phase 1: Unit tests pass (physics, level parser, input), ship flies, gravity works
- Phase 2: Unit tests pass (game objects, bunkers, buttons, pod), bunkers shoot, buttons work, pod tows
- Phase 3: Unit tests pass (sprites, particles, effects), sprites render, effects play
- Phase 4: Unit tests pass (audio engine, sounds), sounds play correctly
- Phase 5: Unit tests pass (game loop, scoring, UI), full game loop works
- Phase 6: Unit tests pass (mobile features), E2E tests pass, touch/gravity controls work on mobile
- Phase 7: Unit tests pass (Capacitor), native apps build and run
- Phase 8: Unit tests pass (native features, performance), native apps polished
- Phase 9: Build tests pass, apps submitted to stores

## Advantages of This Approach
1. **Maximum Code Reuse**: ~70-80% of game logic can be ported directly
2. **Authentic Gameplay**: Physics and level design remain identical to original
3. **Modern Tech Stack**: React + Canvas for maintainability
4. **Asset Reuse**: Level files and sprite data can be converted
5. **Proven Logic**: C code is a mature, bug-free implementation
6. **Single Codebase**: Web, iOS, and Android from one codebase via Capacitor
7. **Native Performance**: Capacitor WebView provides near-native performance
8. **Easy Updates**: Web app updates automatically, native apps via store updates
9. **Cost Effective**: No need for separate native development teams

## Risks & Mitigations
- **Performance**: JavaScript physics may be slower than C → Optimize with typed arrays, reduce GC pressure
- **Audio**: Web Audio API complexity → Use simple wrapper library, handle mobile audio context restrictions
- **Mobile Touch Controls**: Virtual joystick implementation → Test extensively on real devices, add haptic feedback
- **Gravity Sensor Support**: DeviceOrientation API varies by device → Test on multiple devices, add fallback to touch controls
- **iOS Sensor Permission**: iOS 13+ requires user permission → Implement permission request flow, handle denial gracefully
- **Browser Compatibility**: Test across browsers, use polyfills if needed
- **iOS WebView Performance**: May be slower than Safari → Optimize rendering, use GPU acceleration
- **Android Fragmentation**: Different screen sizes/densities → Responsive design, test on multiple devices
- **App Store Approval**: Apple review process → Follow guidelines, avoid rejected patterns
- **Memory Constraints**: Mobile devices have limited RAM → Optimize sprite loading, use object pooling
- **Audio Context on Mobile**: Requires user interaction → Initialize audio on first touch/start button
- **Orientation Issues**: Mobile devices rotate → Lock to landscape, handle orientation changes gracefully

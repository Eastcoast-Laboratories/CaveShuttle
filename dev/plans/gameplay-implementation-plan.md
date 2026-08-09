# Gameplay Implementation Plan - Modernization & Polish

## Current Status (Completed)
- ✅ Phase 1-10: All original phases completed
- ✅ UI Implementation: Menu, HUD, GameCanvas components
- ✅ Ship Implementation: Physics, rendering, keyboard control
- ✅ Level Rendering: Original tileset with pixel-perfect rendering
- ✅ Level Loading: Original .def files imported
- ✅ High Score System: localStorage persistence
- ✅ Playwright E2E: Tests configured
- ✅ Native Projects: iOS and Android generated
- ✅ Task 1-4: Core gameplay mechanics (Level Rendering, Collision, Pod Towing, Game Loop)
- ✅ Task 5: Pod Docking Animation
- ✅ Task 6: Level Selection Buttons

## Remaining Tasks: Modernization & Original Feature Parity

### Task 7: Anti-aliasing & Smooth Rendering
**Goal**: Modern, smooth graphics with anti-aliasing

**Steps**:
1. Enable anti-aliasing for Canvas rendering
   - Set `imageSmoothingEnabled = true` on Canvas context
   - Use `imageSmoothingQuality = 'high'`
   - Enable sub-pixel rendering
2. Improve frame rate consistency
   - Use delta time for physics calculations
   - Implement fixed time step for physics
   - Add frame rate limiting
3. Smooth camera movement
   - Add camera interpolation (lerp) instead of instant following
   - Add camera damping for smooth transitions
4. Smooth ship rotation
   - Add rotation interpolation
   - Smooth acceleration animation
5. Commit: Anti-aliased smooth rendering

**Files to modify**:
- `src/ui/GameCanvas.jsx` - Enable anti-aliasing, smooth camera, smooth rotation
- `src/game/ship.js` - Add delta time physics

### Task 8: Bunkers & Bullets (Original Feature Parity)
**Goal**: Implement bunkers that shoot at the ship

**Steps**:
1. Create Bunker class
   - Position, type, shooting cooldown
   - Bullet spawning
   - Aim at ship
2. Create Bullet class
   - Position, velocity, owner
   - Collision detection
   - Render bullet sprites
3. Add bunker positions from level (P, U, [, \ characters)
4. Implement bunker shooting logic
   - Bunkers aim at ship
   - Fire bullets at intervals
   - Bullets travel in straight lines
5. Implement bullet collision with ship
   - Ship loses life when hit
   - Explosion effect
6. Add bunker rendering with original sprites
7. Commit: Bunkers and bullets

**Files to create**:
- `src/game/bunker.js` - Bunker class
- `src/game/bullet.js` - Bullet class
- `tests/unit/bunker.test.js` - Bunker tests
- `tests/unit/bullet.test.js` - Bullet tests

**Files to modify**:
- `src/ui/GameCanvas.jsx` - Add bunker and bullet rendering/logic
- `src/physics/collision.js` - Add bullet collision

### Task 9: Buttons & Sliders (Original Feature Parity)
**Goal**: Implement interactive buttons and sliders

**Steps**:
1. Create Button class
   - Position, type, tag
   - State (pressed/released)
   - Slider connection
2. Create Slider class
   - Position, type, direction
   - Movement logic
   - Button connection
3. Load button positions from level (L, N characters)
4. Load slider positions from level (@-K characters)
5. Implement button collision with ship
   - Ship can activate buttons
   - Trigger slider movement
6. Implement slider movement
   - Sliders move when button pressed
   - Create/open paths
7. Add button and slider rendering
8. Commit: Buttons and sliders

**Files to create**:
- `src/game/button.js` - Button class
- `src/game/slider.js` - Slider class
- `tests/unit/button.test.js` - Button tests
- `tests/unit/slider.test.js` - Slider tests

**Files to modify**:
- `src/ui/GameCanvas.jsx` - Add button and slider rendering/logic

### Task 10: Particle Effects & Polish
**Goal**: Add modern particle effects for explosions and visual polish

**Steps**:
1. Create Particle class
   - Position, velocity, lifetime
   - Color, size, type
   - Update and render
2. Create ParticleSystem class
   - Manage particle pool
   - Spawn explosions
   - Spawn thrust particles
   - Spawn spark effects
3. Add explosion effects
   - Ship explosion when hit
   - Bunker explosion when destroyed
   - Pod docking effect
4. Add thrust particles
   - Particle trail behind ship
   - Vary particle colors based on thrust
5. Add spark effects
   - Collision sparks
   - Bullet impact sparks
6. Implement screen shake
   - Shake on collision
   - Shake on explosion
7. Add visual polish
   - Glow effects
   - Smooth transitions
   - Modern color palette
8. Commit: Particle effects and visual polish

**Files to create**:
- `src/game/particle.js` - Particle class
- `src/game/particle-system.js` - ParticleSystem class
- `tests/unit/particle.test.js` - Particle tests

**Files to modify**:
- `src/ui/GameCanvas.jsx` - Add particle rendering and effects
- `src/game/ship.js` - Add thrust particle spawning

### Task 11: Modern UI Styling
**Goal**: Modern, sleek UI design

**Steps**:
1. Update HUD styling
   - Modern fonts
   - Smooth gradients
   - Glass morphism effect
   - Animated bars
2. Update Menu styling
   - Modern layout
   - Hover effects
   - Smooth transitions
3. Update Level Selection buttons
   - Modern design
   - Hover animations
   - Progress indicators
4. Add loading screen
   - Animated loading
   - Progress bar
5. Add pause menu
   - Blur effect
   - Overlay design
6. Add victory/defeat screens
   - Animated effects
   - Score display
7. Commit: Modern UI styling

**Files to modify**:
- `src/ui/HUD.jsx` - Modern styling
- `src/ui/Menu.jsx` - Modern styling
- `src/ui/GameCanvas.jsx` - Add loading/pause screens
- `src/App.jsx` - Add victory/defeat screens

## Implementation Order
1. Task 7: Anti-aliasing & Smooth Rendering (visual foundation)
2. Task 8: Bunkers & Bullets (core original feature)
3. Task 9: Buttons & Sliders (core original feature)
4. Task 10: Particle Effects & Polish (visual polish)
5. Task 11: Modern UI Styling (final polish)

## Success Criteria
- ✅ Anti-aliased smooth rendering
- ✅ Bunkers shoot at ship with bullets
- ✅ Buttons activate sliders
- ✅ Particle effects for explosions and thrust
- ✅ Modern, sleek UI design
- ✅ Game feels smooth and responsive
- ✅ All original features implemented
- ✅ Modern visual polish throughout

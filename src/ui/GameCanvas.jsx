import React, { useRef, useEffect, useState } from 'react';
import { useNetwork } from '../network/NetworkContext.jsx';
import { Ship } from '../game/ship.js';
import { Pod } from '../game/pod.js';
import { Bunker } from '../game/bunker.js';
import { EnemyMine } from '../game/enemy-ship.js';
import { Bullet } from '../game/bullet.js';
import { Button } from '../game/button.js';
import { Slider } from '../game/slider.js';
import { ParticleSystem } from '../game/particle-system.js';
import { TileRenderer } from '../game/tile-renderer.js';
import { LevelLoader } from '../levels/level-loader.js';
import { CollisionDetection } from '../physics/collision.js';
import { SoundManager } from '../audio/sound-manager.js';
import { SKY_FULL_STAR_DENSITY, SKY_DELIVERY_THRESHOLD, GAME_SPEED, GRAVITY, WORMHOLE_GRAVITY, POD_HOLDER_OFFSET, POD_TETHER_WIDTH, POD_HOLDER_CHAR, POD_DROPPABLE, GAME_WIDTH, GAME_HEIGHT, HUD_HEIGHT, JOYSTICK_THRESHOLD, JOYSTICK_VELOCITY_FACTOR, JOYSTICK_STOP_MS, JOYSTICK_TAP_FIRE_MS, DOOR_AUTO_CLOSE_MS, DOOR_SLIDE_MS_PER_COL, CAMERA_BOTTOM_OFFSET, SCORE_BUNKER_DESTROYED, SCORE_BUTTON_SLIDER, SCORE_POD_CONNECT, SCORE_FUEL_REMAINING, TIME_BONUS_HEIGHT_SECONDS_PER_TILE, TIME_BONUS_WIDTH_SECONDS_PER_TILE, TIME_BONUS_POINTS_PER_SECOND, TIME_BONUS_MAX, SCORING_VERSION, SHIELD_RADIUS, SHIELD_COLOR, SHIELD_FUEL_CONSUMPTION, FUEL_MAX, FUEL_DEPOT_CAPACITY, FUEL_DEPOT_INITIAL, FUEL_DEPOT_REFUEL_RATE, BUTTON_SIZE_FACTOR, BUTTON_MARGIN_FACTOR, BUNKER_INDICATOR_OFFSETS, INITIAL_LIVES, POD_TETHER_LENGTH, ROTATION_SPEED, TURRET_ROTATION_SPEED, POD_ROTATION_SPEED, ROTATION_SLOW_ANGLE_THRESHOLD, ROTATION_SLOW_MULTIPLIER, ROTATION_SNAP_ANGLE_THRESHOLD, GOD_MODE_TILE, GOD_MODE_DURATION_MS, GOD_MODE_COLOR, FUEL_EMPTY_DESTROY_DELAY_MS, POD_FUEL_CONSUMPTION, FIRE_FUEL_CONSUMPTION, BULLET_SPEED, SHOOT_COOLDOWN_MS, REACTOR_TILES, REACTOR_MELTDOWN_TRIGGER_MS, REACTOR_MELTDOWN_ESCAPE_MS, REACTOR_HIT_TIMEOUT_MS, SCORE_REACTOR_ESCAPE, VIBRATE_ROTATE, VIBRATE_ROTATE_STOP, VIBRATE_THRUST, VIBRATE_THRUST_STOP, VIBRATE_FIRE, VIBRATE_POD } from '../core/constants.js';
import { getTouchButtons, TOP_GAP, drawTouchButton } from '../core/touch-buttons.js';
import { vibrate } from '../core/haptics.js';


// Ensures the pod is never drawn too dark; non-zero channels are doubled,
// zero channels become 30 so black pods turn gray instead of green.
function ensureBrightPodColor(rgb, minChannel = 64) {
  let brightened = [...rgb];
  while (Math.max(...brightened) < minChannel) {
    const currentMax = Math.max(...brightened);
    const next = brightened.map(c => (c === 0 ? 30 : Math.min(255, c * 2)));
    if (Math.max(...next) <= currentMax) break;
    brightened = next;
  }
  return brightened;
}

// Throttle logging of the canvas geometry so the console does not flood.
let lastCanvasGeomLog = 0;
const CANVAS_GEOM_LOG_INTERVAL = 5000;

// Minimum distance from a point (px, py) to a line segment (x1,y1)-(x2,y2)
function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

// Fuel depot constants are imported from constants.js

// Touch-button layout and drawing helpers are in ../core/touch-buttons.js (DRY).


// Compute the on-screen geometry of the canvas content, accounting for
// CSS object-fit: contain or cover. Returns the scale (screen px per canvas px)
// and the client-space top-left corner of the drawn canvas content.
function getCanvasContentGeom(canvas, w, h) {
  const rect = canvas.getBoundingClientRect();
  if (rect.height === 0) return { scale: 1, contentLeftClient: rect.left, contentTopClient: rect.top };
  const elementRatio = rect.width / rect.height;
  const canvasRatio = w / h;
  const fit = (typeof window !== 'undefined' && window.getComputedStyle(canvas).objectFit) || 'contain';
  const isCover = fit === 'cover';
  let drawW, drawH, offsetX, offsetY;
  if (elementRatio > canvasRatio) {
    // Element is wider than the game: for contain the game fills the height
    // and has side bars; for cover the game fills the width and is cropped top/bottom.
    if (isCover) {
      drawW = rect.width;
      drawH = drawW / canvasRatio;
    } else {
      drawH = rect.height;
      drawW = drawH * canvasRatio;
    }
    offsetX = (rect.width - drawW) / 2;
    offsetY = (rect.height - drawH) / 2;
  } else {
    // Element is taller than the game: for contain the game fills the width
    // and has top/bottom bars; for cover the game fills the height and is cropped left/right.
    if (isCover) {
      drawH = rect.height;
      drawW = drawH * canvasRatio;
    } else {
      drawW = rect.width;
      drawH = drawW / canvasRatio;
    }
    offsetX = (rect.width - drawW) / 2;
    offsetY = (rect.height - drawH) / 2;
  }
  const scale = drawW / w;
  const contentLeftClient = rect.left + offsetX;
  const contentTopClient = rect.top + offsetY;
  const topOffset = Math.max(0, -contentTopClient / scale);
  const now = Date.now();
  if (now - lastCanvasGeomLog > CANVAS_GEOM_LOG_INTERVAL) {
    lastCanvasGeomLog = now;
    console.log('[CANVAS_GEOM]', {
      logicalW: w,
      logicalH: h,
      rectWidth: rect.width,
      rectHeight: rect.height,
      elementRatio: elementRatio.toFixed(3),
      canvasRatio: canvasRatio.toFixed(3),
      drawW: Math.round(drawW),
      drawH: Math.round(drawH),
      scale: +scale.toFixed(3),
      contentLeftClient: Math.round(contentLeftClient),
      contentTopClient: Math.round(contentTopClient),
      topOffset: +topOffset.toFixed(2),
    });
  }
  return { scale, contentLeftClient, contentTopClient };
}

// Touch-button geometry. topGap is a fixed canvas-space gap so the layout
// stays anchored to the canvas top and does not drift when the screen is long.
// topOffset is the logical y distance from the canvas logical top to the
// viewport top. When the game content extends above the visible viewport
// (contentTopClient < 0), top-anchored buttons must be shifted down by that
// amount so they stay on screen.
function getLiveTouchGeom(canvas, w, h) {
  const ratio = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : w / h;
  const { scale, contentTopClient } = getCanvasContentGeom(canvas, w, h);
  const topOffset = Math.max(0, -contentTopClient / scale);
  return { ratio, topOffset, topGap: TOP_GAP };
}

// Convert pointer client coordinates to canvas-internal coordinates,
// accounting for object-fit: contain letterboxing.
function pointerToCanvas(canvas, clientX, clientY, w, h) {
  const { scale, contentLeftClient, contentTopClient } = getCanvasContentGeom(canvas, w, h);
  return {
    x: (clientX - contentLeftClient) / scale,
    y: (clientY - contentTopClient) / scale,
  };
}

export default function GameCanvas({ width = GAME_WIDTH, height = GAME_HEIGHT, onFuelChange, onLevelComplete, onGameOver, onScoreChange, onLivesChange, onPodDockedChange, level: levelProp, packBaseUrl = '/levelpacks/default', gravityMultiplier = 1.0, frozen = false, showTouchButtons = true, joystickEnabled = true, isMobile = false, isEditorTestMode = false, editorLevelData = null, editorWallColor = '#ff0000', initialLives = 3, twoPlayer = false, networkRole = null, soundVolume = 1, touchButtonOpacity = 1, vibrationEnabled = true, bonusLifePopup = null, tiltSteering = false, tiltNeutralBeta = 0, tiltNeutralGamma = 0, tiltSteeringRotated = false, tiltSensorRef }) {
  const canvasRef = useRef(null);
  const soundManager = useRef(null);
  const { manager: networkManager } = useNetwork();
  const networkInputRef = useRef({ left: false, right: false, thrust: false, fire: false });
  const networkSnapshotRef = useRef(null);
  const networkSendTimerRef = useRef(0);
  const networkBulletQueueRef = useRef([]);
  const [ship] = useState(() => new Ship(width / 2, height / 2));
  const [keys, setKeys] = useState({});
  const turretAngleRef = useRef(0);
  const [touchActive, setTouchActive] = useState(false); // tractor-beam touch button pressed
  const [accelerateActive, setAccelerateActive] = useState(false); // accelerate button pressed
  const [fireActive, setFireActive] = useState(false); // fire button pressed
  const fireTapRef = useRef(false); // momentary fire from tap (read and reset by game loop)
  const multiTouchFireRef = useRef(false); // multi-touch fire from extra finger (ref for synchronous game loop access)
  const [rotateLeftActive, setRotateLeftActive] = useState(false); // rotate left button pressed
  const [rotateRightActive, setRotateRightActive] = useState(false); // rotate right button pressed
  const [p2RotateLeftActive, setP2RotateLeftActive] = useState(false); // player 2 rotate left button pressed
  const [p2RotateRightActive, setP2RotateRightActive] = useState(false); // player 2 rotate right button pressed
  const [p2ThrustActive, setP2ThrustActive] = useState(false); // player 2 thrust button pressed
  const [p2FireActive, setP2FireActive] = useState(false); // player 2 fire button pressed
  const rotationStartAngleRef = useRef(null); // angle when rotation started (for slow rotation near vertical and snapping)
  const rotationSlowModeRef = useRef(false); // whether slow rotation mode is active
  const wasRotatingRef = useRef(false); // previous frame rotation state (for detecting start/stop)
  const wasRotationDirRef = useRef(null); // previous rotation direction: 'left' | 'right' | null (for detecting direction change)
  const wasAcceleratingRef = useRef(false); // previous frame thrust state (for detecting start/stop)
  const wasTractorBeamRef = useRef(false); // previous frame tractor beam state (for detecting activation)
  const rotationSnapDisabledRef = useRef(false); // whether snapping is disabled for this rotation (started at exact 0°)
  // Track pointerId to button type mapping for multi-touch support
  const pointerButtonMap = useRef(new Map());
  // Track pointerIds that are currently pressing buttons (for joystick filtering)
  const buttonPointerIds = useRef(new Set());
  // Track the pointerId that is currently controlling the joystick
  const joystickPointerId = useRef(null);
  // Shield state
  const [shieldActive, setShieldActive] = useState(false);
  // Virtual joystick control (touch/mouse anywhere on screen)
  const [joystickActive, setJoystickActive] = useState(false);
  const joystickStartRef = useRef({ x: 0, y: 0 }); // Ref for synchronous position updates (vertical anchor)
  const joystickRotationSpeedRef = useRef(0); // Ref for rotation speed to avoid state updates
  const joystickLastXRef = useRef(0); // Last horizontal pointer position to compute movement velocity
  const joystickLastMoveTimeRef = useRef(0); // Timestamp of last horizontal movement (to stop rotation when finger holds still)
  const joystickTapTimerRef = useRef(null); // Timer to distinguish short tap (fire) from long press (joystick)
  const doorsRef = useRef([]); // Door system: sliding doors between H and G tiles
  const [level, setLevel] = useState(null);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [tilesetLoaded, setTilesetLoaded] = useState(false);
  const [levelReady, setLevelReady] = useState(false);
  const [pod, setPod] = useState(null);
  const podRef = useRef(pod);
  useEffect(() => { podRef.current = pod; }, [pod]);
  const [podPosition, setPodPosition] = useState(null);
  const [restartPosition, setRestartPosition] = useState(null);
  // podWasDockedRef tracks if pod was docked at ship destruction
  const podWasDockedRef = useRef(false);
  // podDelayedExplosionRef holds the timestamp when a ship-caused pod detonation should occur
  const podDelayedExplosionRef = useRef(null);
  // podConnectScoreGivenRef ensures SCORE_POD_CONNECT is awarded only once per level
  const podConnectScoreGivenRef = useRef(false);
  // fuelDepotsRef stores the fuel depots found in the level layout (key: 'x,y')
  const fuelDepotsRef = useRef(new Map());
  // respawnAreasRef holds all '*' respawn points with a stable internal index (top-to-bottom order)
  const respawnAreasRef = useRef([]);
  const [bunkers, setBunkers] = useState([]);
  const [enemyMines, setEnemyMines] = useState([]);
  const [bullets, setBullets] = useState([]);
  const [playerBullets, setPlayerBullets] = useState([]);
  // POD button icon
  const podIconRef = useRef(null);
  // Fire button crosshair icon
  const crosshairIconRef = useRef(null);
  // Ship sprites (on/thrust and off/idle)
  const shipOnImageRef = useRef(null);
  const shipOffImageRef = useRef(null);
  const mineImageRef = useRef(null);
  const mineRedImageRef = useRef(null);
  const [buttons, setButtons] = useState([]);
  const [sliders, setSliders] = useState([]);
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0, intensity: 0 });
  const [podExploded, setPodExploded] = useState(false);
  const [podExplosionTime, setPodExplosionTime] = useState(null);
  const [podStartPosition, setPodStartPosition] = useState(null);
  const [stars, setStars] = useState([]);
  const [levelColors, setLevelColors] = useState(null);
  const particleSystem = useRef(new ParticleSystem());
  const [lives, setLives] = useState(initialLives);
  const livesRef = useRef(lives);
  livesRef.current = lives;
  const [bonusLifeDisplay, setBonusLifeDisplay] = useState(null); // { threshold } shown briefly
  const [currentLevel, setCurrentLevel] = useState(levelProp || 1);
  const [gameState, setGameState] = useState('playing'); // playing, wormhole, levelcomplete, gameover
  // Wormhole level-complete animation: { active, progress, x, y, startTime }
  const wormholeRef = useRef({ active: false, progress: 0, x: 0, y: 0, startTime: 0 });
  const levelLoader = useRef(new LevelLoader());
  const tileRenderer = useRef(new TileRenderer());
  const collision = useRef(new CollisionDetection(tileRenderer.current));
  const levelCompleteTriggered = useRef(false);
  const pendingLevelCompleteData = useRef(null);
  const activeLevelTimeRef = useRef(0); // active play time for the current level in ms
  const shipDestroyed = useRef(false);
  const deathAnim = useRef({ active: false, timeLeft: 0 });
  // God mode state: the ship bounces off walls, bunkers, fuel depots and reactors
  const godModeActiveRef = useRef(false);
  const godModeEndTimeRef = useRef(0);
  // Fuel empty state: when set, thrust is disabled and ship explodes after delay
  const fuelEmptyTimeRef = useRef(null);
  // Reactor meltdown state
  const reactorDamageMsRef = useRef(0);
  const reactorLastHitTimeRef = useRef(0);
  const reactorLastHitPointRef = useRef({ x: 0, y: 0 });
  const vibrationEnabledRef = useRef(vibrationEnabled);
  useEffect(() => { vibrationEnabledRef.current = vibrationEnabled; }, [vibrationEnabled]);
  const vibrateIfEnabled = (pattern) => { if (vibrationEnabledRef.current) vibrate(pattern); };
  const meltdownActiveRef = useRef(false);
  const meltdownStartTimeRef = useRef(0);
  const meltdownExplosionTimeRef = useRef(0);
  const meltdownEscapedRef = useRef(false);
  const meltdownEffectsTriggeredRef = useRef(false);
  const meltdownGameOverCalledRef = useRef(false);
  const planetExplosionRef = useRef({ active: false, startTime: 0, alpha: 0, x: 0, y: 0 });

  // Tilt steering refs (updated by deviceorientation, read by game loop)
  const tiltRotateLeftRef = useRef(false);
  const tiltRotateRightRef = useRef(false);
  const tiltThrustRef = useRef(false);

  // [TILT] Listen to deviceorientation events and update sensor ref + tilt state
  useEffect(() => {
    if (!tiltSteering) {
      tiltRotateLeftRef.current = false;
      tiltRotateRightRef.current = false;
      tiltThrustRef.current = false;
      return;
    }

    const handleOrientation = (e) => {
      const rawBeta = e.beta || 0;  // front-to-back tilt (-180 to 180)
      const rawGamma = e.gamma || 0; // left-to-right tilt (-90 to 90)
      const alpha = e.alpha || 0; // compass direction

      // Remap device axes to screen-space based on screen orientation angle.
      // deviceorientation events are relative to the device's natural portrait
      // orientation. When the phone is in landscape, beta/gamma must be swapped.
      const orientAngle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
      let screenBeta, screenGamma;
      switch (orientAngle) {
        case 90:
          // Landscape: rotated 90° clockwise (top of phone on right)
          screenBeta = -rawGamma;
          screenGamma = rawBeta;
          break;
        case 180:
          // Portrait upside down
          screenBeta = -rawBeta;
          screenGamma = -rawGamma;
          break;
        case 270:
          // Landscape: rotated 90° counterclockwise (top of phone on left)
          screenBeta = rawGamma;
          screenGamma = -rawBeta;
          break;
        default:
          // Portrait (0)
          screenBeta = rawBeta;
          screenGamma = rawGamma;
          break;
      }

      // When tiltSteeringRotated is ON, swap beta and gamma so the player
      // can play lying on their side (axes rotated 90°).
      if (tiltSteeringRotated) {
        const tmp = screenBeta;
        screenBeta = screenGamma;
        screenGamma = tmp;
      }

      if (tiltSensorRef) {
        tiltSensorRef.current = { beta: screenBeta, gamma: screenGamma, alpha };
      }

      // Screen gamma: relative to calibrated neutral gamma.
      // Negative = tilt left, positive = tilt right -> rotation
      const gammaDelta = screenGamma - tiltNeutralGamma;
      const TILT_ROTATE_THRESHOLD = 5;
      tiltRotateLeftRef.current = gammaDelta < -TILT_ROTATE_THRESHOLD;
      tiltRotateRightRef.current = gammaDelta > TILT_ROTATE_THRESHOLD;

      // Screen beta: relative to calibrated neutral.
      // Tilting phone back (screen up, negative betaDelta) = thrust ON.
      // Tilting forward (screen down, positive betaDelta) = thrust OFF.
      const betaDelta = screenBeta - tiltNeutralBeta;
      const TILT_THRUST_THRESHOLD = 10;
      tiltThrustRef.current = betaDelta < -TILT_THRUST_THRESHOLD;
    };

    // Request permission on iOS 13+ (DeviceOrientationEvent.requestPermission)
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(permission => {
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        }
      }).catch(err => console.log('[TILT] Permission request failed:', err));
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [tiltSteering, tiltNeutralBeta, tiltNeutralGamma, tiltSteeringRotated, tiltSensorRef]);

  // [SOUND] Initialize the sound manager once and load all audio buffers.
  useEffect(() => {
    const manager = new SoundManager();
    soundManager.current = manager;
    manager.init()
      .then(() => manager.setMasterVolume(soundVolume))
      .catch(err => console.error('[SOUND] Failed to initialize sounds:', err));
    return () => {
      manager.stopAllLoops();
      soundManager.current = null;
    };
  }, []);

  // [SOUND] Apply the master volume whenever the slider value changes.
  useEffect(() => {
    if (soundManager.current) soundManager.current.setMasterVolume(soundVolume);
  }, [soundVolume]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // [SOUND] Resume the audio context on the first user gesture (autoplay policy).
      if (soundManager.current) soundManager.current.resume();
      // Don't process game keys when typing in an input/textarea
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;

      setKeys(prev => ({ ...prev, [e.key]: true }));
      // Activate shield when Space or Ctrl is pressed
      if (e.key === ' ' || e.key === 'Space' || (!twoPlayer && (e.key === 'Control' || e.key === 'ControlLeft' || e.key === 'ControlRight'))) {
        setShieldActive(true);
      }
      // Prevent space from scrolling the page
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      // Don't process game keys when typing in an input/textarea
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;

      setKeys(prev => ({ ...prev, [e.key]: false }));
      // Deactivate shield when Space or Ctrl is released
      if (e.key === ' ' || e.key === 'Space' || (!twoPlayer && (e.key === 'Control' || e.key === 'ControlLeft' || e.key === 'ControlRight'))) {
        setShieldActive(false);
      }
      // Prevent space from scrolling the page
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [twoPlayer]);

  // Log the mode/level the canvas was mounted with for debugging.
  useEffect(() => {
    console.log('[GAMECANVAS_MODE] twoPlayer prop:', twoPlayer, 'level prop:', levelProp);
  }, [twoPlayer, levelProp]);

  // Network event listeners: host receives P2 inputs, client receives authoritative state.
  useEffect(() => {
    if (!networkManager || !networkRole) return;
    const handleInput = (data) => {
      networkInputRef.current = {
        left: !!data?.left,
        right: !!data?.right,
        thrust: !!data?.thrust,
        fire: !!data?.fire,
      };
    };
    const handleState = (data) => {
      networkSnapshotRef.current = data;
    };
    const handleEvent = (data) => {
      if (!data) return;
      if (data.type === 'bullet' || data.type === 'bunkerBullet') {
        networkBulletQueueRef.current.push(data);
      } else if (data.type === 'shipDestroyed' && networkRole === 'client') {
        // Mirror the ship explosion on the client side
        if (!shipDestroyed.current && !godModeActiveRef.current) {
          shipDestroyed.current = true;
          if (soundManager.current) soundManager.current.stopOnce('noFuel');
          particleSystem.current.spawnExplosion(data.x, data.y, 80, '#ff6600');
          particleSystem.current.spawnExplosion(data.x, data.y, 40, '#ffff00');
          particleSystem.current.spawnExplosion(data.x, data.y, 30, '#00ff00');
          if (soundManager.current) soundManager.current.playOnce('explosion');
          setScreenShake({ x: 0, y: 0, intensity: 15 });
          vibrateIfEnabled([100, 50, 100, 50, 200]);
          ship.setVelocity(0, 0);
          ship.setAccelerate(false);
          deathAnim.current = { active: true, timeLeft: 60 };
        }
      } else if (data.type === 'podDestroyed' && networkRole === 'client') {
        // Mirror the pod explosion on the client side
        if (pod && pod.active && !podExploded && !pod.onHolder) {
          pod.towed = false;
          pod.active = false;
          setPodExploded(true);
          setPodExplosionTime(performance.now());
          particleSystem.current.spawnExplosion(data.x, data.y, 40, '#00ff00');
          if (soundManager.current) soundManager.current.playOnce('explosion');
          vibrateIfEnabled([80, 30, 80]);
          console.log('[POD_EXPLOSION] Pod detonated (network) at', data.x.toFixed(0), data.y.toFixed(0));
        }
      } else if (data.type === 'gameover' && networkRole === 'client') {
        setGameState('gameover');
        if (onGameOver) onGameOver();
      } else if (data.type === 'levelcomplete' && networkRole === 'client') {
        // If the client already triggered the wormhole locally, store the host data
        // to be used when the wormhole animation finishes.
        if (!levelCompleteTriggered.current) {
          setGameState('levelcomplete');
          if (onLevelComplete) onLevelComplete(data.level, data.time, data.width, data.height, { breakdown: data.breakdown, totalScore: data.totalScore, newHighscore: data.newHighscore, levelNumber: data.levelNumber });
        } else {
          pendingLevelCompleteData.current = { breakdown: data.breakdown, totalScore: data.totalScore, newHighscore: data.newHighscore, levelNumber: data.levelNumber, time: data.time, width: data.width, height: data.height, level: data.level };
        }
      }
    };
    networkManager.on('game:input', handleInput);
    networkManager.on('game:state', handleState);
    networkManager.on('game:event', handleEvent);
    return () => {
      networkManager.off('game:input', handleInput);
      networkManager.off('game:state', handleState);
      networkManager.off('game:event', handleEvent);
    };
  }, [networkManager, networkRole, onGameOver, onLevelComplete]);

  // Pointer handling for all on-screen touch buttons (mouse + touch)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getButtonAt = (clientX, clientY) => {
      const p = pointerToCanvas(canvas, clientX, clientY, width, height);
      // Measure button geometry live so hit-testing matches the rendered
      // positions even after orientation/resize without relying on event state.
      const { ratio, topOffset, topGap } = getLiveTouchGeom(canvas, width, height);
      const podDocked = podRef.current && podRef.current.towed;
      return getTouchButtons(width, height, ratio, topOffset, topGap, showTouchButtons, isMobile, twoPlayer, podDocked, tiltSteering, networkRole).find((b) => {
        const angle = b.angle || 0;
        const origin = b.origin || { x: 0, y: 0 };
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = p.x - origin.x;
        const dy = p.y - origin.y;
        const localX = cos * dx + sin * dy;
        const localY = -sin * dx + cos * dy;
        return localX >= b.hitX && localX <= b.hitX + b.hitW && localY >= b.hitY && localY <= b.hitY + b.hitH;
      });
    };

    const handlePointerDown = (e) => {
      // [SOUND] Resume the audio context on the first user gesture (autoplay policy).
      if (soundManager.current) soundManager.current.resume();
      const btn = getButtonAt(e.clientX, e.clientY);
      if (btn) {
        e.preventDefault();
        // Deactivate joystick only if the same pointerId is pressing a button
        if (joystickActive && joystickPointerId.current === e.pointerId) {
          setJoystickActive(false);
          joystickRotationSpeedRef.current = 0;
          setAccelerateActive(false);
          joystickPointerId.current = null;
        }
        pointerButtonMap.current.set(e.pointerId, btn.type);
        buttonPointerIds.current.add(e.pointerId);
        switch (btn.type) {
          case 'pod': setTouchActive(true); setShieldActive(true); break;
          case 'accelerate': setAccelerateActive(true); break;
          case 'fire': setFireActive(true); break;
          case 'rotateLeft': setRotateLeftActive(true); break;
          case 'rotateRight': setRotateRightActive(true); break;
          case 'p2RotateLeft': setP2RotateLeftActive(true); break;
          case 'p2RotateRight': setP2RotateRightActive(true); break;
          case 'p2Thrust': setP2ThrustActive(true); break;
          case 'p2Fire': setP2FireActive(true); break;
        }
      } else {
        // Multi-finger taps while joystick is in use:
        // 2nd finger → shield, 3rd finger → fire
        const joystickInUse = joystickActive || (joystickTapTimerRef.current !== null);
        if (joystickInUse && joystickPointerId.current !== e.pointerId && (!twoPlayer || networkRole)) {
          const shieldAlreadyActive = Array.from(pointerButtonMap.current.values()).includes('shield');
          e.preventDefault();
          if (shieldAlreadyActive) {
            setFireActive(true);
            multiTouchFireRef.current = true;
            fireTapRef.current = true;
            pointerButtonMap.current.set(e.pointerId, 'fire');
          } else {
            setShieldActive(true);
            pointerButtonMap.current.set(e.pointerId, 'shield');
          }
          buttonPointerIds.current.add(e.pointerId);
          return;
        }
        // In tilt steering mode or joystick-disabled mode, tapping anywhere (not on a button) activates fire
        if ((tiltSteering || !joystickEnabled) && (!twoPlayer || networkRole)) {
          e.preventDefault();
          setFireActive(true);
          pointerButtonMap.current.set(e.pointerId, 'fire');
          buttonPointerIds.current.add(e.pointerId);
        } else if (!twoPlayer || !isMobile || networkRole) {
          // Virtual joystick with tap-to-fire: a short tap triggers fire,
          // a longer press or movement activates the joystick.
          e.preventDefault();
          if (joystickTapTimerRef.current) clearTimeout(joystickTapTimerRef.current);
          joystickTapTimerRef.current = setTimeout(() => {
            joystickTapTimerRef.current = null;
            setJoystickActive(true);
            joystickPointerId.current = e.pointerId;
            joystickStartRef.current = { x: e.clientX, y: e.clientY };
            joystickRotationSpeedRef.current = 0;
            joystickLastXRef.current = e.clientX;
            joystickLastMoveTimeRef.current = performance.now();
          }, JOYSTICK_TAP_FIRE_MS);
          // Track this pointer as a pending joystick tap so pointermove can promote it
          joystickPointerId.current = e.pointerId;
          joystickStartRef.current = { x: e.clientX, y: e.clientY };
          joystickLastXRef.current = e.clientX;
        }
      }
    };

    const handlePointerMove = (e) => {
      // Promote pending tap to joystick immediately if finger moves before tap timer expires
      if (joystickTapTimerRef.current && joystickPointerId.current === e.pointerId) {
        const dx = e.clientX - joystickStartRef.current.x;
        const dy = e.clientY - joystickStartRef.current.y;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          clearTimeout(joystickTapTimerRef.current);
          joystickTapTimerRef.current = null;
          setJoystickActive(true);
          joystickLastXRef.current = e.clientX;
          joystickLastMoveTimeRef.current = performance.now();
        }
      }
      // Handle joystick movement (only for the pointer that controls the joystick)
      if (joystickActive && joystickPointerId.current === e.pointerId) {
        // Horizontal: rotation speed is driven by pointer movement velocity (delta per event),
        // not absolute offset. pointermove only fires while the finger actually moves, so when
        // the finger holds still no events arrive; the render loop zeroes rotation after
        // JOYSTICK_STOP_MS of silence. This makes the ship rotate only while actively sliding
        // left/right and stop the moment horizontal movement stops.
        const velocityX = e.clientX - joystickLastXRef.current;
        joystickLastXRef.current = e.clientX;
        joystickRotationSpeedRef.current = velocityX * JOYSTICK_VELOCITY_FACTOR;
        joystickLastMoveTimeRef.current = performance.now();

        // Vertical: accelerate based on absolute offset from the touch start (independent of horizontal).
        const dy = e.clientY - joystickStartRef.current.y;
        if (dy < -JOYSTICK_THRESHOLD) {
          setAccelerateActive(true);
        } else {
          setAccelerateActive(false);
        }
      }

      // Handle button sliding gestures
      if (buttonPointerIds.current.has(e.pointerId)) {
        const currentButtonType = pointerButtonMap.current.get(e.pointerId);
        const newButton = getButtonAt(e.clientX, e.clientY);

        if (newButton) {
          // Finger moved to a new button - switch to the new button
          if (newButton.type !== currentButtonType) {
            // Deactivate old button
            switch (currentButtonType) {
              case 'pod': setTouchActive(false); setShieldActive(false); break;
              case 'shield': setShieldActive(false); break;
              case 'accelerate': setAccelerateActive(false); break;
              case 'fire': setFireActive(false); multiTouchFireRef.current = false; break;
              case 'rotateLeft': setRotateLeftActive(false); break;
              case 'rotateRight': setRotateRightActive(false); break;
              case 'p2RotateLeft': setP2RotateLeftActive(false); break;
              case 'p2RotateRight': setP2RotateRightActive(false); break;
              case 'p2Thrust': setP2ThrustActive(false); break;
              case 'p2Fire': setP2FireActive(false); break;
            }
            // Activate new button
            pointerButtonMap.current.set(e.pointerId, newButton.type);
            switch (newButton.type) {
              case 'pod': setTouchActive(true); setShieldActive(true); break;
              case 'accelerate': setAccelerateActive(true); break;
              case 'fire': setFireActive(true); break;
              case 'rotateLeft': setRotateLeftActive(true); break;
              case 'rotateRight': setRotateRightActive(true); break;
              case 'p2RotateLeft': setP2RotateLeftActive(true); break;
              case 'p2RotateRight': setP2RotateRightActive(true); break;
              case 'p2Thrust': setP2ThrustActive(true); break;
              case 'p2Fire': setP2FireActive(true); break;
            }
          }
        } else {
          // Finger moved outside all buttons - keep current button active (sliding gesture)
          // Button stays pressed as long as pointer is still down
        }
      }
    };

    const handlePointerUp = (e) => {
      // If tap timer is still pending, this was a short tap on empty area = fire
      if (joystickTapTimerRef.current && joystickPointerId.current === e.pointerId) {
        clearTimeout(joystickTapTimerRef.current);
        joystickTapTimerRef.current = null;
        fireTapRef.current = true;
        joystickPointerId.current = null;
        return;
      }
      // Only reset joystick states when joystick is active and this pointerId is controlling it
      if (joystickActive && joystickPointerId.current === e.pointerId) {
        setJoystickActive(false);
        joystickRotationSpeedRef.current = 0;
        setAccelerateActive(false);
        joystickPointerId.current = null;
      } else {
        // Get the button type for this pointerId and deactivate it
        const buttonType = pointerButtonMap.current.get(e.pointerId);
        if (buttonType) {
          pointerButtonMap.current.delete(e.pointerId);
          buttonPointerIds.current.delete(e.pointerId);
          switch (buttonType) {
            case 'pod': setTouchActive(false); setShieldActive(false); break;
            case 'shield': setShieldActive(false); break;
            case 'accelerate': setAccelerateActive(false); break;
            case 'fire': setFireActive(false); multiTouchFireRef.current = false; break;
            case 'rotateLeft': setRotateLeftActive(false); break;
            case 'rotateRight': setRotateRightActive(false); break;
            case 'p2RotateLeft': setP2RotateLeftActive(false); break;
            case 'p2RotateRight': setP2RotateRightActive(false); break;
            case 'p2Thrust': setP2ThrustActive(false); break;
            case 'p2Fire': setP2FireActive(false); break;
          }
        }
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      if (joystickTapTimerRef.current) clearTimeout(joystickTapTimerRef.current);
    };
  }, [width, height, joystickActive, showTouchButtons, joystickEnabled, isMobile, twoPlayer, tiltSteering, networkRole]);

  useEffect(() => {
    const loadAssets = async () => {
      setLevelReady(false);
      // Load POD button icon
      const podIcon = new Image();
      podIcon.src = '/POD_button.png';
      await new Promise((resolve, reject) => {
        podIcon.onload = resolve;
        podIcon.onerror = reject;
      });
      podIconRef.current = podIcon;

      // Load crosshair icon for fire button
      const crosshairIcon = new Image();
      crosshairIcon.src = '/crosshair.png';
      await new Promise((resolve, reject) => {
        crosshairIcon.onload = resolve;
        crosshairIcon.onerror = reject;
      });
      crosshairIconRef.current = crosshairIcon;

      // Load the original tileset
      try {
        await tileRenderer.current.load();
        setTilesetLoaded(true);
        console.log('[TILESET] Loaded successfully');
      } catch (error) {
        console.error('[TILESET] Failed to load:', error);
      }

      // Load the level
      try {
        let levelContent;
        if (isEditorTestMode && editorLevelData) {
          // Use editor level data passed as prop
          levelContent = editorLevelData;
        } else {
          levelContent = await levelLoader.current.loadLevel(packBaseUrl, `level${currentLevel}`);
        }
        const lines = levelContent.split('\n');

        const isLoopBack = currentLevel === 1 && gravityMultiplier !== 1.0;
        console.log('[LEVEL_LOAD] Loading level:', currentLevel, '| gravityMultiplier:', gravityMultiplier, isLoopBack ? '| (loop back after all levels completed)' : '');
        // Parse metadata: width, height, height of start, empty space, bedrock
        const lenx = parseInt(lines[0], 10);
        const sx = parseInt(lines[2], 10); // height of start (stars, currently 0)
        const sy = parseInt(lines[3], 10); // height of empty space (controls star start, negative = inside level)
        const sz = parseInt(lines[4], 10); // height of bedrock (generated below rendered level)

        // Parse color theme (lines 5-9, 0-indexed): background, gun, pod, text, shield
        const colors = {
          background: lines[5].split(';')[0].trim().split(/\s+/).slice(0, 3).map(Number),
          gun: lines[6].split(';')[0].trim().split(/\s+/).slice(0, 3).map(Number),
          pod: lines[7].split(';')[0].trim().split(/\s+/).slice(0, 3).map(Number),
          text: lines[8].split(';')[0].trim().split(/\s+/).slice(0, 3).map(Number),
          shield: lines[9].split(';')[0].trim().split(/\s+/).slice(0, 3).map(Number)
        };

        // Override background color with editor wall color if in test mode
        if (isEditorTestMode && editorWallColor) {
          const hex = editorWallColor.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          colors.background = [r, g, b];
        }

        setLevelColors(colors);
        // Apply colors to tile renderer for terrain/wall coloring
        tileRenderer.current.setLevelColors(colors);

        // Layout starts after 10 metadata lines
        // Keep ALL layout lines including space-only lines (they are sky)
        // Remove only the final trailing empty line
        let layout = lines.slice(10);
        while (layout.length > 0 && layout[layout.length - 1].length === 0) {
          layout.pop();
        }

        // Pad each row to full level width so tiles align
        layout = layout.map(row => row.padEnd(lenx, ' '));

        // Generate bedrock rows below the level definition
        if (sz > 0) {
          for (let i = 0; i < sz; i++) {
            layout.push('p'.repeat(lenx));
          }
        }

        // Find pod position (character POD_HOLDER_CHAR), restart points (character '*'), buttons (L,N), and slider boundaries (G and H and unused @-K)
        let podPos = null;
        let restartPos = null;
        respawnAreasRef.current = []; // reset internal respawn-area numbering for this level
        const bunkerPositions = [];
        const enemyMinePositions = [];
        const buttonPositions = [];
        const sliderPositions = [];
        const scaledSize = 16; // TileRenderer scale
        for (let y = 0; y < layout.length; y++) {
          for (let x = 0; x < layout[y].length; x++) {
            // Pod position (original 'm')
            if (layout[y][x] === POD_HOLDER_CHAR) {
              podPos = { x: x * scaledSize + scaledSize / 2, y: y * scaledSize + scaledSize / 2 };
            }
            // Restart point ('*')
            if (layout[y][x] === '*') {
              const pos = { x: x * scaledSize + scaledSize / 2, y: y * scaledSize + scaledSize / 2 };
              if (!restartPos) {
                restartPos = pos;
              }
              // Number every respawn area internally (top-to-bottom order) for logging
              respawnAreasRef.current.push({ index: respawnAreasRef.current.length, col: x, row: y, x: pos.x, y: pos.y });
            }
            // These are the tiles, that fire, all other bunker tiles are decorative
            if (['P', 'U', '[', '\\'].includes(layout[y][x])) {
              bunkerPositions.push({ 
                x: x * scaledSize + scaledSize / 2, 
                y: y * scaledSize + scaledSize / 2, 
                type: layout[y][x] 
              });
            }
            // enemy mine start positions ('+')
            if (layout[y][x] === '+') {
              enemyMinePositions.push({
                x: x * scaledSize + scaledSize / 2,
                y: y * scaledSize + scaledSize / 2,
              });
            }
            // Door buttons: L/M left wall, N/O right wall (M/O are the lower tile halves)
            if (['L', 'M', 'N', 'O'].includes(layout[y][x])) {
              buttonPositions.push({
                x: x * scaledSize + scaledSize / 2,
                y: y * scaledSize + scaledSize / 2,
                type: layout[y][x],
                tag: x > 0 ? layout[y][x - 1] : null // Button tag is the character to the left
              });
            }
            // Slider Boundaries: left: H, right: G (unused: I, J, K, @)
            if (layout[y][x].charCodeAt(0) >= 64 && layout[y][x].charCodeAt(0) <= 75) {
              sliderPositions.push({ 
                x: x * scaledSize + scaledSize / 2, 
                y: y * scaledSize + scaledSize / 2, 
                type: layout[y][x] 
              });
            }
          }
          if (podPos && restartPos) break;
        }

        // The pod holder marker (m) and parts 0-2 stay in the layout and render
        // as space; only the visible stand tiles (3, 4) but behave as space too.
        // Replace enemy mine markers ('+') with spaces so they don't affect layout width
        const cleanedLayout = layout.map(row => row.replace(/\+/g, ' '));

        // Detect fuel depots: 2x2 groups of top-left '`', top-right 'a', bottom-left 'b', bottom-right 'c'
        const fuelDepots = new Map();
        for (let y = 0; y < cleanedLayout.length - 1; y++) {
          const row = cleanedLayout[y];
          const nextRow = cleanedLayout[y + 1];
          for (let x = 0; x < row.length - 1; x++) {
            if (row[x] === '`' && row[x + 1] === 'a' && nextRow[x] === 'b' && nextRow[x + 1] === 'c') {
              fuelDepots.set(`${x},${y}`, { x, y, fuel: FUEL_DEPOT_INITIAL, maxFuel: FUEL_DEPOT_CAPACITY });
            }
          }
        }
        fuelDepotsRef.current = fuelDepots;
        console.log('[FUEL_DEPOT] Detected depots:', fuelDepots.size);

        // Detect doors: H (left) and G (right) pairs with solid p tiles between them
        const doors = [];
        console.log('[DOOR_DETECT] Starting door detection...');
        for (let y = 0; y < cleanedLayout.length; y++) {
          const row = cleanedLayout[y];
          const hIndices = [];
          const gIndices = [];
          for (let x = 0; x < row.length; x++) {
            if (row[x] === 'H') hIndices.push(x);
            if (row[x] === 'G') gIndices.push(x);
          }
          console.log('[DOOR_DETECT] Row', y, 'H at:', hIndices, 'G at:', gIndices);
          // Pair H and G on the same row (H must be left of G)
          for (const hCol of hIndices) {
            for (const gCol of gIndices) {
              if (gCol > hCol && gCol - hCol > 1) {
                // Check if all cells between H and G are solid p tiles
                let allSolid = true;
                for (let c = hCol + 1; c < gCol; c++) {
                  if (row[c] !== 'p') {
                    allSolid = false;
                    console.log('[DOOR_DETECT] Row', y, 'col', c, 'is not p:', row[c]);
                    break;
                  }
                }
                if (allSolid) {
                  doors.push({
                    rows: [y],
                    colStart: hCol,
                    colEnd: gCol,
                    state: 'closed',
                    filledCols: gCol - hCol - 1,
                    timer: 0,
                    slideAccum: 0
                  });
                  console.log('[DOOR_DETECT] Found door at row', y, 'cols', hCol, '-', gCol);
                }
              }
            }
          }
        }

        // Group doors that are vertically adjacent (same column range)
        const doorGroups = [];
        for (const door of doors) {
          let merged = false;
          for (const group of doorGroups) {
            if (group.colStart === door.colStart && group.colEnd === door.colEnd) {
              // Check if vertically adjacent
              const lastRow = group.rows[group.rows.length - 1];
              if (door.rows[0] === lastRow + 1) {
                group.rows.push(door.rows[0]);
                merged = true;
                break;
              }
            }
          }
          if (!merged) {
            doorGroups.push({
              rows: [door.rows[0]],
              colStart: door.colStart,
              colEnd: door.colEnd,
              state: 'closed',
              filledCols: door.filledCols,
              timer: 0,
              slideAccum: 0
            });
          }
        }

        // Assign buttons to closest door group (analogous to closestbutton in C code)
        console.log('[BUTTON_ASSIGN] Assigning buttons to doors. Buttons:', buttonPositions.length, 'Door groups:', doorGroups.length);
        for (const button of buttonPositions) {
          let closestDoor = null;
          let closestDist = Infinity;
          for (const door of doorGroups) {
            const doorCenterX = (door.colStart + door.colEnd) / 2 * scaledSize;
            const doorCenterY = door.rows[0] * scaledSize;
            const dist = Math.sqrt((button.x - doorCenterX) ** 2 + (button.y - doorCenterY) ** 2);
            console.log('[BUTTON_ASSIGN] Button at', button.x, button.y, 'to door center', doorCenterX, doorCenterY, 'dist:', dist);
            if (dist < closestDist) {
              closestDist = dist;
              closestDoor = door;
            }
          }
          if (closestDoor) {
            button.door = closestDoor;
            console.log('[BUTTON_ASSIGN] Assigned button to door, closest dist:', closestDist);
          } else {
            console.log('[BUTTON_ASSIGN] No door assigned to button at', button.x, button.y);
          }
        }

        doorsRef.current = doorGroups;
        console.log('[DOOR] Detected door groups:', doorGroups.length);
        doorGroups.forEach((door, i) => {
          console.log('[DOOR] Group', i, 'rows:', door.rows, 'cols:', door.colStart, '-', door.colEnd, 'filledCols:', door.filledCols);
        });
        console.log('[BUTTON] Button positions with door assignment:');
        buttonPositions.forEach((bp, i) => {
          console.log('[BUTTON]', i, 'type:', bp.type, 'tag:', bp.tag, 'door:', bp.door ? 'yes' : 'no');
        });

        console.log('[LEVEL] Loaded level1:', layout.length, 'rows x', lenx, 'cols');
        console.log('[POD] Position:', podPos);
        console.log('[RESTART] Position:', restartPos);
        console.log('[RESPAWN_AREA] Numbered respawn areas:', respawnAreasRef.current.map(a => `#${a.index}@(${a.col},${a.row})`).join(' '));
        console.log('[BUNKERS] Count:', bunkerPositions.length);
        console.log('[ENEMY_MINE] Count:', enemyMinePositions.length);
        console.log('[BUTTONS] Count:', buttonPositions.length);
        console.log('[SLIDERS] Count:', sliderPositions.length);
        setLevel({ layout: cleanedLayout, width: lenx, height: cleanedLayout.length });
        setPodPosition(podPos);
        setRestartPosition(restartPos);
        if (podPos) {
          // Pod sits a bit ABOVE the holder marker to avoid colliding with it
          const podX = podPos.x + 3;
          const podY = podPos.y - POD_HOLDER_OFFSET;
          setPod(new Pod(podX, podY));
          if (onPodDockedChange) onPodDockedChange(false);
          setPodStartPosition({ x: podX, y: podY });
        }
        if (restartPos) {
          ship.setPosition(restartPos.x, restartPos.y);
          ship.setVelocity(0, 0);
          // Reset level complete guard for the new level
          levelCompleteTriggered.current = false;
          shipDestroyed.current = false;
          deathAnim.current = { active: false, timeLeft: 0 };
          wormholeRef.current = { active: false, progress: 0, x: 0, y: 0, startTime: 0, started: false, shipStart: null, podOffset: null };
          podConnectScoreGivenRef.current = false;
          reactorDamageMsRef.current = 0;
          reactorLastHitTimeRef.current = 0;
          meltdownActiveRef.current = false;
          meltdownStartTimeRef.current = 0;
          meltdownExplosionTimeRef.current = 0;
          meltdownEscapedRef.current = false;
          meltdownEffectsTriggeredRef.current = false;
          meltdownGameOverCalledRef.current = false;
          planetExplosionRef.current = { active: false, startTime: 0, alpha: 0, x: 0, y: 0 };
          // Reset camera to center on ship spawn, clamped to level bounds
          const levelWidth = lenx * scaledSize;
          const levelHeight = layout.length * scaledSize;
          const camX = Math.max(0, Math.min(restartPos.x - width / 2, Math.max(0, levelWidth - width)));
          const camY = Math.max(0, Math.min(restartPos.y - height / 2, Math.max(0, levelHeight - height)));
          setCamera({ x: camX, y: camY });
        }
        setBunkers(bunkerPositions.map(bp => new Bunker(bp.x, bp.y, bp.type)));
        setEnemyMines(enemyMinePositions.map(ep => new EnemyMine(ep.x, ep.y)));
        if (enemyMinePositions.length > 0) {
          console.log('[ENEMY_MINE] Created', enemyMinePositions.length, 'enemy mines at:', enemyMinePositions.map(p => `(${p.x.toFixed(0)},${p.y.toFixed(0)})`).join(' '));
        }
        setButtons(buttonPositions.map(bp => new Button(bp.x, bp.y, bp.type, bp.tag, bp.door)));
        setSliders(sliderPositions.map(sp => new Slider(sp.x, sp.y, sp.type, 'horizontal')));

        // Generate stars.
        // The LOWER edge is controlled by the level header 'height of empty space' (sy):
        // yBottom = -sy * 16 (capped at the level floor). FULL density is reached at
        // yFullDensity = -SKY_FULL_STAR_DENSITY. The density ramps linearly from 0 at
        // yBottom to 1 at yFullDensity, and stays at 1 above it.
        // Inside the level (y >= 0) stars are only kept in empty-space (' ') cells.
        const newStars = [];
        if (restartPos) {
          const levelWidthPx = lenx * 16;
          const levelHeightPx = layout.length * 16;
          const yBottom = Math.min(-sy * 16, levelHeightPx); // density 0 boundary
          const yFullDensity = -SKY_FULL_STAR_DENSITY;       // density 1 boundary
          // Generate stars well above the delivery threshold, so the player flies through a
          // full-density star field until reaching skyThreshold.
          const yTop = -SKY_FULL_STAR_DENSITY;
          const makeStar = (x, y) => ({
            x,
            y,
            size: Math.random() * 1.5 + 0.5,
            brightness: Math.random() * 0.6 + 0.4, // 0.4 - 1.0 base brightness
            flickerSpeed: Math.random() * 0.004 + 0.001,
            flickerOffset: Math.random() * Math.PI * 2
          });

          const span = yBottom - yTop;
          if (span > 0) {
            // Density factor 0.004 gives a pleasing star density at full density.
            const candidateCount = Math.round(span * lenx * 0.004);
            for (let i = 0; i < candidateCount; i++) {
              const y = yTop + Math.random() * span;
              // Linear density: 0 at yBottom, 1 at yFullDensity, clamped to [0,1].
              const density = y >= yBottom ? 0 : Math.max(0, Math.min(1, (yBottom - y) / (yBottom - yFullDensity)));
              if (Math.random() > density) continue;

              const x = Math.random() * levelWidthPx;

              // Inside the level: only place stars in empty-space cells.
              if (y >= 0) {
                const row = Math.floor(y / 16);
                const col = Math.floor(x / 16);
                if (row >= layout.length || col < 0 || col >= lenx || layout[row][col] !== ' ') continue;
              }

              newStars.push(makeStar(x, y));
            }
          }
        }
        setStars(newStars);
        setLevelReady(true);
      } catch (error) {
        console.error('[LEVEL] Failed to load:', error);
      }
    };

    loadAssets();
  }, [currentLevel]);

  // Update currentLevel when levelProp changes
  useEffect(() => {
    if (levelProp !== undefined && levelProp !== currentLevel) {
      setCurrentLevel(levelProp);
      // Reset game state and active timer when level changes
      setGameState('playing');
      setLives(initialLives);
      activeLevelTimeRef.current = 0;
      if (onLivesChange) onLivesChange(initialLives);
    }
  }, [levelProp, currentLevel]);

  // Handle bonus life popup from App: increment internal lives and show brief popup
  useEffect(() => {
    if (!bonusLifePopup) return;
    setLives(prev => prev + 1);
    if (onLivesChange) onLivesChange(livesRef.current + 1);
    setBonusLifeDisplay({ threshold: bonusLifePopup.threshold });
    const timer = setTimeout(() => setBonusLifeDisplay(null), 2500);
    return () => clearTimeout(timer);
  }, [bonusLifePopup]);

  // Load the ship sprite images once on mount.
  useEffect(() => {
    const onImg = new Image();
    onImg.src = '/ship.png';
    onImg.onload = () => {
      shipOnImageRef.current = onImg;
    };

    const offImg = new Image();
    offImg.src = '/ship_off.png';
    offImg.onload = () => {
      shipOffImageRef.current = offImg;
    };

    const mineImg = new Image();
    mineImg.src = '/images/mine.png';
    mineImg.onload = () => {
      mineImageRef.current = mineImg;
      // Create a copy with a red blinking dot in the center
      const redImg = new Image();
      const offCanvas = document.createElement('canvas');
      offCanvas.width = mineImg.naturalWidth;
      offCanvas.height = mineImg.naturalHeight;
      const offCtx = offCanvas.getContext('2d');
      offCtx.drawImage(mineImg, 0, 0);
      const dotRadius = Math.max(1, Math.round(offCanvas.width * 0.08)); // 8% of the mine width
      offCtx.fillStyle = '#ff0000';
      offCtx.beginPath();
      offCtx.arc(offCanvas.width / 2, offCanvas.height / 2, dotRadius, 0, Math.PI * 2);
      offCtx.fill();
      redImg.src = offCanvas.toDataURL();
      redImg.onload = () => {
        mineRedImageRef.current = redImg;
      };
    };
  }, []);

  // Render logic is stored in a ref so the requestAnimationFrame loop can stay stable
  // (a single loop for the whole component lifetime). Previously the loop lived inside an
  // effect whose dependency array changed every frame, so it was torn down and recreated
  // constantly and could spawn multiple concurrent loops -> progressive slowdown under load.
  const lastTimeRef = useRef(performance.now());
  const renderFnRef = useRef(() => {});
  const canvasGeomLogRef = useRef({ frame: 0, last: 0 });

  // Helper: flood-fill from a point across the empty space bounded by '#' and walls,
  // collect ALL reachable '*' respawn points in the same area, then choose based on pod state:
  //   - not docked (descending to fetch the pod) -> ENTRANCE '*' (top / min y)
  //   - docked (returning with the pod)          -> LOWER-BOUNDARY '*' (bottom / max y)
  // If the area has only one '*', it is used for both cases. Ties are broken by euclidean distance.
  // Defined outside render loop to avoid recreating every frame (performance).
  const findRespawnInRegion = (startX, startY, wasDocked) => {
    const currentLevel = level; // capture current level state
    if (!currentLevel || !currentLevel.layout) return null;
    const tileSize = 16;
    const startCol = Math.floor(startX / tileSize);
    const startRow = Math.floor(startY / tileSize);
    // Guard against out-of-bounds start position (e.g. ship in sky or below level)
    if (startRow < 0 || startRow >= currentLevel.layout.length || startCol < 0 || startCol >= currentLevel.layout[0].length) {
      console.log('[RESPAWN_FLOOD] Start position out of bounds:', startX.toFixed(0), startY.toFixed(0), '-> row', startRow, 'col', startCol);
      return null;
    }
    const visited = new Set();
    const queue = [[startRow, startCol]];
    visited.add(`${startRow},${startCol}`);
    const found = []; // all reachable respawn points

    while (queue.length) {
      const [r, c] = queue.shift();
      if (currentLevel.layout[r][c] === '*') {
        found.push({ x: c * tileSize + tileSize / 2, y: r * tileSize + tileSize / 2 });
      }
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= currentLevel.layout.length || nc < 0 || nc >= currentLevel.layout[0].length) continue;
        const key = `${nr},${nc}`;
        if (visited.has(key)) continue;
        const t = currentLevel.layout[nr][nc];
        // Treat '#' and any wall tile as boundary; '*' itself is passable so we can keep scanning
        if (t !== '*' && (t === '#' || tileRenderer.current.isWall(t))) continue;
        visited.add(key);
        queue.push([nr, nc]);
      }
    }

    if (found.length === 0) {
      console.log('[RESPAWN_FLOOD] No reachable * from', startX.toFixed(0), startY.toFixed(0));
      return null;
    }

    let best;
    let role;
    if (found.length === 1) {
      // Single '*' in this area: used for both docked and undocked respawns
      best = found[0];
      role = 'single';
    } else {
      // Two (or more) '*': pick the role by pod state, then the euclidean-nearest within that role.
      // Entrance = top-most (min y), lower boundary = bottom-most (max y).
      const extremeY = wasDocked
        ? Math.max(...found.map(p => p.y)) // docked -> lower boundary
        : Math.min(...found.map(p => p.y)); // not docked -> entrance
      const candidates = found.filter(p => p.y === extremeY);
      best = candidates[0];
      let bestDist = Infinity;
      for (const p of candidates) {
        const d = (p.x - startX) ** 2 + (p.y - startY) ** 2;
        if (d < bestDist) { bestDist = d; best = p; }
      }
      role = wasDocked ? 'lower' : 'entrance';
    }

    // Resolve the internal respawn-area index (numbered top-to-bottom at parse time)
    const area = respawnAreasRef.current.find(a => a.x === best.x && a.y === best.y);
    const areaIndex = area ? area.index : -1;
    const reachableIndices = found
      .map(p => { const a = respawnAreasRef.current.find(r => r.x === p.x && r.y === p.y); return a ? a.index : -1; });
    console.log('[RESPAWN_AREA] Died at', startX.toFixed(0), startY.toFixed(0),
      '| wasDocked:', !!wasDocked,
      '| reachable areas:', reachableIndices,
      '| role:', role,
      '-> respawn at area #' + areaIndex, best.x, best.y);
    return best;
  };

  renderFnRef.current = () => {
    const canvas = canvasRef.current;
    if (!canvas) return true;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return true;

    // Stop rendering once the game over or level complete overlay is shown.
    if (gameState === 'gameover' || gameState === 'levelcomplete') {
      return false;
    }

    // Wait until the level and tileset are fully loaded before the first frame.
    // This prevents the ship from being shown/updated before the level is rendered.
    if (!levelReady || !level || !tilesetLoaded) {
      lastTimeRef.current = performance.now();
      return true;
    }

    // Helper: attach the pod to the ship and award the one-time pod connection bonus.
    const connectPod = () => {
      if (!pod || !pod.active) return;
      const wasAlreadyTowed = pod.towed;
      pod.onHolder = false;
      pod.towed = true;
      // [SOUND] Play the docking sound the first time the pod attaches.
      if (!wasAlreadyTowed && soundManager.current) soundManager.current.playOnce('podDock');
      if (twoPlayer && !wasAlreadyTowed) {
        // Only align the pod to the ship when it is first attached; after that
        // player 2 must keep independent control over the pod rotation.
        pod.setAngle(ship.angle);
        if (onPodDockedChange) onPodDockedChange(true);
      }
      if (!podConnectScoreGivenRef.current) {
        podConnectScoreGivenRef.current = true;
        if (onScoreChange) onScoreChange({ points: SCORE_POD_CONNECT, type: 'pod' });
      }
    };

    // [DPR_RENDER] Match the canvas backing store to the device pixel ratio so the
    // CSS-upscaled canvas (object-fit: contain) stays crisp on high-DPI screens.
    // All drawing uses logical width/height coordinates; setTransform applies the
    // DPR scale each frame so save/restore pairs remain balanced.
    const dpr = window.devicePixelRatio || 1;
    const backingW = Math.round(width * dpr);
    const backingH = Math.round(height * dpr);
    if (canvas.width !== backingW || canvas.height !== backingH) {
      canvas.width = backingW;
      canvas.height = backingH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Trigger the geometry log every 300 frames (and on pointer events through pointerToCanvas).
    canvasGeomLogRef.current.frame++;
    if (canvasGeomLogRef.current.frame % 300 === 0) {
      getCanvasContentGeom(canvas, width, height);
    }

    // Enable anti-aliasing and smooth rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Reset ship and pod back to their level-start state (DRY helper used by every respawn site)
    const respawnShipAndPod = () => {
      // Find respawn point using flood-fill from current ship position; fallback to initial restartPos.
      // target; the respawn point is a separate, dynamically-computed spawn location. Overwriting
      // it moved the win target onto the respawn point and falsely triggered "level completed".
      const target = findRespawnInRegion(ship.x, ship.y, podWasDockedRef.current) || restartPosition;
      console.log('[RESPAWN] respawnShipAndPod called at', ship.x.toFixed(0), ship.y.toFixed(0), '| wasDocked:', podWasDockedRef.current, '| target:', target ? { x: target.x.toFixed(0), y: target.y.toFixed(0) } : null);
      if (target) {
        ship.setPosition(target.x, target.y);
      }
      // Always respawn pointing straight up and at rest
      ship.setVelocity(0, 0);
      ship.setAngle(0);
      ship.fuel = 100;
      ship.p1LastShotTime = 0;
      ship.p2LastShotTime = 0;
      fuelEmptyTimeRef.current = null;

      // Pod handling
      const wasDocked = podWasDockedRef.current;
      if (wasDocked) {
        // Respawn pod together with the ship: hanging straight down at rest below the ship
        const podX = ship.x;
        const podY = ship.y + POD_TETHER_LENGTH;
        if (!pod || !pod.active) {
          const newPod = new Pod(podX, podY);
          newPod.towed = true;
          newPod.onHolder = false;
          setPod(newPod);
          if (onPodDockedChange) onPodDockedChange(true);
        } else {
          pod.setPosition(podX, podY);
          pod.vx = 0;
          pod.vy = 0;
          pod.towed = true;
          pod.onHolder = false;
          pod.active = true;
          if (onPodDockedChange) onPodDockedChange(true);
        }
        console.log('[RESPAWN_POD] Docked -> pod hangs below ship at', podX.toFixed(0), podY.toFixed(0));
      } else if (podStartPosition) {
        // Return pod to its holder at rest
        if (!pod || !pod.active) {
          setPod(new Pod(podStartPosition.x, podStartPosition.y));
          if (onPodDockedChange) onPodDockedChange(false);
        } else {
          pod.setPosition(podStartPosition.x, podStartPosition.y);
          pod.vx = 0;
          pod.vy = 0;
          pod.towed = false;
          pod.onHolder = true;
          pod.active = true;
          if (onPodDockedChange) onPodDockedChange(false);
        }
      }
      setPodExploded(false);
      setPodExplosionTime(null);
      podDelayedExplosionRef.current = null;
      shipDestroyed.current = false;
    };

    // Detonate the pod if it is in play. Returns true if the pod actually exploded.
    const detonatePod = (cause) => {
      if (!pod || !pod.active || podExploded || pod.onHolder) return false;
      if (!podWasDockedRef.current) {
        podWasDockedRef.current = !!pod.towed;
      }
      pod.towed = false;
      pod.active = false;
      setPodExploded(true);
      setPodExplosionTime(performance.now());
      particleSystem.current.spawnExplosion(pod.x, pod.y, 40, '#00ff00');
      if (soundManager.current) soundManager.current.playOnce('explosion');
      vibrateIfEnabled([80, 30, 80]);
      console.log('[POD_EXPLOSION] Pod detonated (' + cause + ') at', pod.x.toFixed(0), pod.y.toFixed(0), '| wasTowed:', podWasDockedRef.current);
      // [NETWORK] Host notifies client of pod explosion so client can mirror it
      if (networkRole === 'host' && networkManager) {
        networkManager.sendEvent({ type: 'podDestroyed', x: pod.x, y: pod.y });
      }
      return true;
    };

    // Destroy the ship: start ~1s explosion animation, then game over or respawn (DRY helper)
    const destroyShip = () => {
      if (shipDestroyed.current) return;
      if (godModeActiveRef.current) return;
      shipDestroyed.current = true;
      // Stop the no-fuel warning sound if it was playing
      if (soundManager.current) soundManager.current.stopOnce('noFuel');
      // If the pod is in play (off the holder) and hasn't already exploded, sever the
      // connection and detonate it alongside the ship. Otherwise record the docked state
      // for respawn. When podExploded is already true, the pod collision handler already
      // recorded the docked state before clearing pod.active.
      if (!podExploded && pod && pod.active && !pod.onHolder) {
        // Record the docked state and sever the tether immediately. The pod itself
        // will detonate 0.5s later so it can fall away from the exploding ship.
        podWasDockedRef.current = !!pod.towed;
        pod.towed = false;
        podDelayedExplosionRef.current = performance.now() + 500;
        console.log('[POD_EXPLOSION] Pod tether severed at ship destruction, delayed detonation scheduled in 0.5s | wasTowed:', podWasDockedRef.current);
      } else if (!podExploded) {
        podWasDockedRef.current = false;
      }
      console.log('[RESPAWN_AREA] Ship destroyed at', ship.x.toFixed(0), ship.y.toFixed(0), '| podDocked:', podWasDockedRef.current);
      // Big explosion with debris flying apart
      particleSystem.current.spawnExplosion(ship.x, ship.y, 80, '#ff6600');
      particleSystem.current.spawnExplosion(ship.x, ship.y, 40, '#ffff00');
      particleSystem.current.spawnExplosion(ship.x, ship.y, 30, '#00ff00');
      if (soundManager.current) soundManager.current.playOnce('explosion');
      setScreenShake({ x: 0, y: 0, intensity: 15 });
      vibrateIfEnabled([100, 50, 100, 50, 200]);
      ship.setVelocity(0, 0);
      ship.setAccelerate(false);
      // Start ~1s death animation (60 frames at 60fps)
      deathAnim.current = { active: true, timeLeft: 60 };
      // [NETWORK] Host notifies client of ship destruction so client can mirror explosion
      if (networkRole === 'host' && networkManager) {
        networkManager.sendEvent({ type: 'shipDestroyed', x: ship.x, y: ship.y });
      }
    };

    // Activate god mode by removing the ý tile and starting the timer
    const activateGodMode = (tileX, tileY) => {
      if (!level || !level.layout) return;
      if (tileY < 0 || tileY >= level.layout.length) return;
      const row = level.layout[tileY];
      if (tileX < 0 || tileX >= row.length) return;
      if (row[tileX] !== GOD_MODE_TILE) return;
      level.layout[tileY] = row.substring(0, tileX) + ' ' + row.substring(tileX + 1);
      godModeEndTimeRef.current = performance.now() + GOD_MODE_DURATION_MS;
      godModeActiveRef.current = true;
      const tileSize = tileRenderer.current.getScaledTileSize();
      const px = tileX * tileSize + tileSize / 2;
      const py = tileY * tileSize + tileSize / 2;
      particleSystem.current.spawnExplosion(px, py, 25, '#ffd700');
      console.log('[GOD_MODE] Power-up collected at tile', tileX, tileY, '| ends in', GOD_MODE_DURATION_MS, 'ms');
    };

    // Accumulate reactor damage from a bullet hit; trigger the meltdown once charged.
    const registerReactorHit = (point) => {
      const now = performance.now();
      const gap = now - reactorLastHitTimeRef.current;
      reactorLastHitPointRef.current = point;
      if (reactorLastHitTimeRef.current > 0 && gap <= REACTOR_HIT_TIMEOUT_MS) {
        reactorDamageMsRef.current += gap;
      } else {
        // After a long pause, damage starts over (no cooldown rollback, just stop growing)
        reactorDamageMsRef.current = 0;
      }
      reactorLastHitTimeRef.current = now;
      console.log('[REACTOR_MELTDOWN] hit gap=' + gap.toFixed(0) + 'ms damage=' + reactorDamageMsRef.current.toFixed(0) + '/' + REACTOR_MELTDOWN_TRIGGER_MS + 'ms');
      if (!meltdownActiveRef.current && reactorDamageMsRef.current >= REACTOR_MELTDOWN_TRIGGER_MS) {
        meltdownActiveRef.current = true;
        meltdownStartTimeRef.current = now;
        meltdownExplosionTimeRef.current = now + REACTOR_MELTDOWN_ESCAPE_MS;
        console.log('[REACTOR_MELTDOWN] triggered! planet explodes in ' + REACTOR_MELTDOWN_ESCAPE_MS + 'ms');
      }
    };

    // Finalize death after the explosion animation: lose a life, respawn or game over
    const finalizeDeath = () => {
      // In editor test mode, don't lose lives (infinite lives)
      if (isEditorTestMode) {
        respawnShipAndPod();
        return;
      }
      const newLives = livesRef.current - 1;
      setLives(newLives);
      livesRef.current = newLives;
      if (onLivesChange) onLivesChange(newLives);
      if (newLives <= 0) {
        setGameState('gameover');
        if (onGameOver) onGameOver();
        if (networkRole === 'host' && networkManager) networkManager.sendEvent({ type: 'gameover' });
      } else {
        // Respawn at restart point with the pod back on its holder
        respawnShipAndPod();
      }
    };

    // Draw a glowing spiral wormhole at world coordinates (wx, wy) with progress 0..1
    const drawWormhole = (ctx, wx, wy, progress, time) => {
      const screenX = wx - camera.x;
      const screenY = wy - camera.y;
      const maxRadius = 120;
      const radius = maxRadius * (0.2 + 0.8 * progress);
      const spin = time * 0.004;
      const arms = 6;

      // Dark core that swallows the ship
      const coreGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius);
      coreGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
      coreGradient.addColorStop(0.25, 'rgba(10, 0, 40, 0.95)');
      coreGradient.addColorStop(0.6, 'rgba(60, 20, 120, 0.4)');
      coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Spiral arms
      for (let i = 0; i < arms; i++) {
        const baseAngle = (i / arms) * Math.PI * 2 + spin;
        ctx.beginPath();
        for (let r = 0; r <= radius; r += 3) {
          const angle = baseAngle + (r / radius) * Math.PI * 3;
          const x = screenX + Math.cos(angle) * r;
          const y = screenY + Math.sin(angle) * r;
          if (r === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const hue = (i * 60 + time * 0.05) % 360;
        ctx.strokeStyle = `hsla(${hue}, 90%, 70%, ${0.8 - progress * 0.5})`;
        ctx.lineWidth = 3 - progress * 2;
        ctx.stroke();
      }

      // Bright outer glow
      const glow = ctx.createRadialGradient(screenX, screenY, radius * 0.5, screenX, screenY, radius * 1.5);
      glow.addColorStop(0, `rgba(255, 255, 255, ${0.6 * progress})`);
      glow.addColorStop(0.5, `rgba(100, 200, 255, ${0.35 * progress})`);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(screenX, screenY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Bright center
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + 0.5 * Math.sin(time * 0.01)})`;
      ctx.beginPath();
      ctx.arc(screenX, screenY, 8 + 4 * progress, 0, Math.PI * 2);
      ctx.fill();
    };

    const currentTime = performance.now();
    const frameElapsedMs = currentTime - lastTimeRef.current;
    let deltaTime = frameElapsedMs / 16.67; // Normalize to 1.0 at 60fps
    // Cap delta to avoid a "spiral of death" if a single frame is very slow
    if (deltaTime > 3) deltaTime = 3;
    // Apply global game speed multiplier
    deltaTime *= GAME_SPEED;
    lastTimeRef.current = currentTime;

    // Update god mode timer and log state changes
    if (godModeEndTimeRef.current > currentTime) {
      if (!godModeActiveRef.current) {
        godModeActiveRef.current = true;
        console.log('[GOD_MODE] Activated until', (godModeEndTimeRef.current / 1000).toFixed(2));
      }
    } else {
      if (godModeActiveRef.current) {
        godModeActiveRef.current = false;
        console.log('[GOD_MODE] Ended');
      }
    }

      // Death animation: explode for ~1s with debris, then game over or respawn
      const isDying = deathAnim.current.active;
      if (isDying) {
        deathAnim.current.timeLeft -= deltaTime;
        // Keep spawning debris for a lively explosion
        if (Math.random() < 0.4) {
          particleSystem.current.spawnExplosion(
            ship.x + (Math.random() - 0.5) * 40,
            ship.y + (Math.random() - 0.5) * 40,
            6, '#ff9900'
          );
        }
        if (deathAnim.current.timeLeft <= 0) {
          deathAnim.current.active = false;
          finalizeDeath();
        }
      }

      // Player 2 input: host uses network input, client captures local input to send to host.
      const p2Left = networkRole === 'host'
        ? networkInputRef.current.left
        : (keys['a'] || keys['A'] || p2RotateLeftActive);
      const p2Right = networkRole === 'host'
        ? networkInputRef.current.right
        : (keys['d'] || keys['D'] || p2RotateRightActive);
      const p2Thrust = networkRole === 'host'
        ? networkInputRef.current.thrust
        : (keys['w'] || keys['W'] || p2ThrustActive);
      const p2Fire = networkRole === 'host'
        ? networkInputRef.current.fire
        : (keys['Shift'] || keys['ShiftLeft'] || keys['ShiftRight'] || p2FireActive);

      // Handle input (skipped while the ship is exploding)
      if (!isDying) {

        // Stop joystick rotation if the finger has held still (no pointermove events) for a short
        // window. pointermove only fires on movement, so silence means the finger stopped sliding.
        if (networkRole !== 'client' && joystickRotationSpeedRef.current !== 0 &&
            performance.now() - joystickLastMoveTimeRef.current > JOYSTICK_STOP_MS) {
          joystickRotationSpeedRef.current = 0;
        }
        // Joystick rotation speed control
        if (networkRole !== 'client') {
          if (joystickRotationSpeedRef.current !== 0) {
            ship.angle += joystickRotationSpeedRef.current;
            ship.rotation = (ship.angle * 180 / Math.PI) % 360;
          } else {
          // Keyboard/button rotation (continuous)
          // Single player: arrow keys or WASD. Two-player: player 1 uses arrow keys,
          // player 2 uses WASD for the turret/pod, so WASD must not rotate the ship.
          const shipRotateLeft = keys['ArrowLeft'] || ((!twoPlayer || networkRole === 'host') && (keys['a'] || keys['A'])) || rotateLeftActive || (tiltSteering && tiltRotateLeftRef.current);
          const shipRotateRight = keys['ArrowRight'] || ((!twoPlayer || networkRole === 'host') && (keys['d'] || keys['D'])) || rotateRightActive || (tiltSteering && tiltRotateRightRef.current);
          const isRotating = shipRotateLeft || shipRotateRight;
          // Record angle when rotation STARTS (transition from not rotating to rotating)
          if (isRotating && !wasRotatingRef.current) {
            rotationStartAngleRef.current = ship.angle;
            // Check if starting near vertical (within threshold) -> activate slow mode
            const angleDeg = (ship.angle * 180 / Math.PI) % 360;
            const normalizedAngle = angleDeg < 0 ? angleDeg + 360 : angleDeg;
            const distToVertical = Math.min(normalizedAngle, 360 - normalizedAngle);
            if (distToVertical < ROTATION_SLOW_ANGLE_THRESHOLD) {
              rotationSlowModeRef.current = true;
              console.log('[ROTATION] Slow mode activated: start angle', normalizedAngle.toFixed(1) + '°, threshold', ROTATION_SLOW_ANGLE_THRESHOLD + '°, multiplier', ROTATION_SLOW_MULTIPLIER);
            }
            // Disable snapping for this rotation if started at exact 0°
            if (distToVertical === 0) {
              rotationSnapDisabledRef.current = true;
              console.log('[ROTATION] Snapping disabled: started at exact 0°');
            } else if (distToVertical < ROTATION_SNAP_ANGLE_THRESHOLD) {
              // Check if rotating AWAY from 0° (not towards it)
              const isRotatingLeft = shipRotateLeft;
              const isRotatingRight = shipRotateRight;
              // If angle is in upper half (0-180): left = towards 0°, right = away from 0°
              // If angle is in lower half (180-360): left = away from 0°, right = towards 0°
              const isUpperHalf = normalizedAngle < 180;
              const rotatingAway = (isUpperHalf && isRotatingRight) || (!isUpperHalf && isRotatingLeft);
              if (rotatingAway) {
                rotationSnapDisabledRef.current = true;
                console.log('[ROTATION] Snapping disabled: rotating away from 0°, start angle', normalizedAngle.toFixed(1) + '°');
              } else {
                rotationSnapDisabledRef.current = false;
              }
            } else {
              rotationSnapDisabledRef.current = false;
            }
          }
          // Check if rotation stops
          if (!isRotating && wasRotatingRef.current) {
            if (tiltSteering) vibrateIfEnabled(VIBRATE_ROTATE_STOP);
            // Snap to vertical if current angle is close to vertical and snapping is not disabled
            if (!rotationSnapDisabledRef.current) {
              const currentAngleDeg = (ship.angle * 180 / Math.PI) % 360;
              const normalizedCurrent = currentAngleDeg < 0 ? currentAngleDeg + 360 : currentAngleDeg;
              const distToVertical = Math.min(normalizedCurrent, 360 - normalizedCurrent);
              if (distToVertical < ROTATION_SNAP_ANGLE_THRESHOLD && distToVertical != 0) {
                ship.setAngle(0);
                console.log('[ROTATION] snap from ' + normalizedCurrent.toFixed(1) + '° to 0°');
              }
            }
            rotationStartAngleRef.current = null;
            rotationSlowModeRef.current = false;
            rotationSnapDisabledRef.current = false;
          }
          // Check if slow mode should end (rotated threshold degrees from start)
          if (rotationSlowModeRef.current && rotationStartAngleRef.current !== null) {
            const angleDiff = Math.abs(ship.angle - rotationStartAngleRef.current);
            const angleDiffDeg = (angleDiff * 180 / Math.PI) % 360;
            if (angleDiffDeg > ROTATION_SLOW_ANGLE_THRESHOLD) {
              rotationSlowModeRef.current = false;
              console.log('[ROTATION] Slow mode ended: rotated', angleDiffDeg.toFixed(1) + '° from start, returning to normal speed');
            }
          }
          wasRotatingRef.current = isRotating;
          // Track rotation direction for haptic feedback on direction change
          const currentDir = shipRotateLeft ? 'left' : (shipRotateRight ? 'right' : null);
          if (currentDir && currentDir !== wasRotationDirRef.current) {
            vibrateIfEnabled(VIBRATE_ROTATE);
          }
          wasRotationDirRef.current = currentDir;
          if (shipRotateLeft) {
            if (rotationSlowModeRef.current) {
              ship.angle -= ROTATION_SPEED * ROTATION_SLOW_MULTIPLIER;
              ship.rotation = (ship.angle * 180 / Math.PI) % 360;
            } else {
              ship.rotateLeft();
            }
          }
          if (shipRotateRight) {
            if (rotationSlowModeRef.current) {
              ship.angle += ROTATION_SPEED * ROTATION_SLOW_MULTIPLIER;
              ship.rotation = (ship.angle * 180 / Math.PI) % 360;
            } else {
              ship.rotateRight();
            }
          }
        }
        }
        if (twoPlayer) {
          // Player 2 uses WASD: A/D rotates, W thrusts the pod once docked, Shift fires.
          // p2Left/p2Right/p2Thrust/p2Fire are computed at the top of the input block.
          if (!pod || pod.onHolder) {
            if (p2Left) turretAngleRef.current -= TURRET_ROTATION_SPEED;
            if (p2Right) turretAngleRef.current += TURRET_ROTATION_SPEED;
          } else {
            if (p2Left) pod.setAngle(pod.angle - POD_ROTATION_SPEED);
            if (p2Right) pod.setAngle(pod.angle + POD_ROTATION_SPEED);
            // Pod thrust only when ship has fuel
            pod.setAccelerate(ship.fuel > 0 && p2Thrust);
            if (pod.accelerate > 0) {
              ship.fuel -= POD_FUEL_CONSUMPTION * deltaTime;
              particleSystem.current.spawnAccelerate(
                pod.x - Math.sin(pod.angle) * 12,
                pod.y + Math.cos(pod.angle) * 12,
                pod.angle
              );
            }
          }
        }
        // Single player: arrow keys or WASD. Two-player: player 1 uses arrow keys.
        // In network mode the client receives ship acceleration from the host's snapshot.
        if (networkRole !== 'client') {
          const isAccelerating = ship.fuel > 0 && (keys['ArrowUp'] || ((!twoPlayer || networkRole === 'host') && (keys['w'] || keys['W'])) || accelerateActive || (tiltSteering && tiltThrustRef.current));
          if (isAccelerating) {
            ship.setAccelerate(true);
            // Spawn accelerate particles
            const accelerateX = ship.x - Math.sin(ship.angle) * 15;
            const accelerateY = ship.y + Math.cos(ship.angle) * 15;
            particleSystem.current.spawnAccelerate(accelerateX, accelerateY, ship.angle);
          } else {
            ship.setAccelerate(false);
          }
          if (isAccelerating && !wasAcceleratingRef.current) {
            vibrateIfEnabled(VIBRATE_THRUST);
          }
          if (!isAccelerating && wasAcceleratingRef.current && tiltSteering) {
            vibrateIfEnabled(VIBRATE_THRUST_STOP);
          }
          wasAcceleratingRef.current = isAccelerating;
        }
      }

      // Door state machine: handle opening/closing animation and auto-close
      if (level) {
        for (const door of doorsRef.current) {
          switch (door.state) {
            case 'closed':
              // Door is solid (p tiles), waiting for trigger
              break;
            case 'opening':
              door.slideAccum += deltaTime * 16.67; // Convert to ms
              if (door.slideAccum >= DOOR_SLIDE_MS_PER_COL) {
                door.slideAccum = 0;
                door.filledCols--;
                // Clear one column from the left side
                const colToClear = door.colStart + door.filledCols;
                for (const row of door.rows) {
                  const rowStr = level.layout[row];
                  level.layout[row] = rowStr.substring(0, colToClear) + ' ' + rowStr.substring(colToClear + 1);
                }
                if (door.filledCols === 0) {
                  door.state = 'open';
                  door.timer = DOOR_AUTO_CLOSE_MS;
                }
              }
              break;
            case 'open':
              door.timer -= deltaTime * 16.67; // Convert to ms
              if (door.timer <= 0) {
                door.state = 'closing';
              }
              break;
            case 'closing':
              door.slideAccum += deltaTime * 16.67; // Convert to ms
              if (door.slideAccum >= DOOR_SLIDE_MS_PER_COL) {
                door.slideAccum = 0;
                door.filledCols++;
                // Fill one column from the left side
                const colToFill = door.colStart + door.filledCols - 1;
                for (const row of door.rows) {
                  const rowStr = level.layout[row];
                  level.layout[row] = rowStr.substring(0, colToFill) + 'p' + rowStr.substring(colToFill + 1);
                }
                if (door.filledCols === door.colEnd - door.colStart - 1) {
                  door.state = 'closed';
                }
              }
              break;
          }
        }
      }

      // Tractor beam (Space key, Ctrl key, or on-screen touch button)
      // Includes shieldActive for network sync (client receives host's shield state)
      const tractorBeamActive = keys[' '] || keys['Space'] || ((!twoPlayer || networkRole === 'host') && (keys['Control'] || keys['ControlLeft'] || keys['ControlRight'])) || touchActive || shieldActive;
      if (tractorBeamActive && !wasTractorBeamRef.current) {
        vibrateIfEnabled(VIBRATE_POD);
      }
      wasTractorBeamRef.current = tractorBeamActive;

      // Tractor beam raycast: beam shoots straight down until it hits the first obstacle.
      const beamActive = tractorBeamActive;
      // Disabled while the pod is being towed (docked):
      // && !(pod && pod.towed)
      let beamEndY = ship.y;
      let isRefueling = false;
      if (beamActive && level && tilesetLoaded) {
        const maxBeam = 240;
        const step = 4;
        beamEndY = ship.y + maxBeam;
        for (let d = 10; d <= maxBeam; d += step) {
          const checkY = ship.y + d;
          const tile = tileRenderer.current.getTileAt(level, ship.x, checkY, 'beam');
          if (tile === '`' || tile === "a") {
            // Fuel depot inside the beam: recharge ship by depleting the depot
            const scaledSize = tileRenderer.current.getScaledTileSize();
            const tileX = Math.floor(ship.x / scaledSize);
            const tileY = Math.floor(checkY / scaledSize);
            const depotX = tile === 'a' ? tileX - 1 : tileX;
            const depotY = tileY;
            const depot = fuelDepotsRef.current.get(`${depotX},${depotY}`);
            if (depot && depot.fuel > 0 && ship.fuel < FUEL_MAX) {
              const needed = FUEL_MAX - ship.fuel;
              const transfer = Math.max(0, Math.min(depot.fuel, needed, FUEL_DEPOT_REFUEL_RATE * deltaTime * GAME_SPEED));
              if (transfer > 0) {
                depot.fuel -= transfer;
                ship.fuel += transfer;
                isRefueling = true;
                console.log('[FUEL_DEPOT] Refueled', transfer.toFixed(2), 'depot fuel left:', depot.fuel.toFixed(2));
              }
            }
            beamEndY = checkY;
            break;
          }
          if (tileRenderer.current.isWall(tile)) {
            beamEndY = checkY;
            break;
          }
        }
      }

      // Player shooting (X key or Shift)
      // Determine firing input this frame.
      // Single player: X / Shift. Two-player: player 1 Ctrl (after pod docked), player 2 Shift.
      // In network mode the client never fires locally; it receives bullets from the host.
      const tapFire = fireTapRef.current;
      fireTapRef.current = false;
      const playerOneFire = networkRole === 'client' ? false : (
        ((!twoPlayer || networkRole === 'host') && (keys['x'] || keys['X'] || keys['Shift'] || keys['ShiftLeft'] || keys['ShiftRight'] || fireActive || multiTouchFireRef.current || tapFire)) ||
        (twoPlayer && !networkRole && pod && pod.towed && (keys['Control'] || keys['ControlLeft'] || keys['ControlRight'] || fireActive || multiTouchFireRef.current || tapFire))
      );
      const playerTwoFire = networkRole === 'client' ? false : (twoPlayer && (keys['Shift'] || keys['ShiftLeft'] || keys['ShiftRight'] || p2FireActive || p2Fire));
      // Firing requires fuel
      const playerOneCanFire = playerOneFire && ship.fuel > 0;
      const playerTwoCanFire = playerTwoFire && ship.fuel > 0;

      // All shooting side effects (ship mutation, fuel, sound) run OUTSIDE the state
      // updater so they execute exactly once per frame. React may invoke a state
      // updater multiple times (StrictMode), which would otherwise duplicate or skip shots.
      const spawnedBullets = [];
      if (!isDying && (playerOneCanFire || playerTwoCanFire)) {
        const now = performance.now();
        const bulletSpeed = BULLET_SPEED;

        // Player 1 (ship) fires independently
        if (playerOneCanFire && now - (ship.p1LastShotTime || 0) > SHOOT_COOLDOWN_MS) {
          const firingAngle = ship.angle;
          spawnedBullets.push({
            x: ship.x + Math.sin(firingAngle) * 20,
            y: ship.y - Math.cos(firingAngle) * 20,
            vx: Math.sin(firingAngle) * bulletSpeed,
            vy: -Math.cos(firingAngle) * bulletSpeed,
            owner: 'ship',
            time: now
          });
          ship.p1LastShotTime = now;
          ship.fuel -= FIRE_FUEL_CONSUMPTION;
          vibrateIfEnabled(VIBRATE_FIRE);
          if (soundManager.current) soundManager.current.playOnce('shipFire');
        }

        // Player 2 (turret or pod) fires independently
        if (playerTwoCanFire && now - (ship.p2LastShotTime || 0) > SHOOT_COOLDOWN_MS) {
          const podCannon = pod && pod.towed;
          const turretCannon = !podCannon;
          const firingBody = podCannon ? pod : ship;
          const firingAngle = turretCannon ? ship.angle + turretAngleRef.current : (podCannon ? pod.angle : ship.angle);
          spawnedBullets.push({
            x: firingBody.x + Math.sin(firingAngle) * 20,
            y: firingBody.y - Math.cos(firingAngle) * 20,
            vx: Math.sin(firingAngle) * bulletSpeed,
            vy: -Math.cos(firingAngle) * bulletSpeed,
            owner: turretCannon ? 'turret' : 'pod',
            time: now
          });
          ship.p2LastShotTime = now;
          ship.fuel -= FIRE_FUEL_CONSUMPTION;
          vibrateIfEnabled(VIBRATE_FIRE);
          if (soundManager.current) soundManager.current.playOnce(podCannon ? 'podFire' : 'shipFire');
        }
      }

      // [NETWORK] Host broadcasts spawned bullets so the client can mirror them.
      if (networkRole === 'host' && networkManager && spawnedBullets.length > 0) {
        for (const bullet of spawnedBullets) {
          networkManager.sendEvent({ type: 'bullet', ...bullet });
        }
      }

      // [NETWORK] Client appends player bullets received from the host.
      if (networkRole === 'client' && networkBulletQueueRef.current.length) {
        const remaining = [];
        for (const item of networkBulletQueueRef.current.splice(0)) {
          if (item.type === 'bullet') {
            spawnedBullets.push(item);
          } else {
            remaining.push(item);
          }
        }
        networkBulletQueueRef.current.push(...remaining);
      }

      // Pure updater: only appends the bullets spawned/received above.
      if (spawnedBullets.length > 0) {
        setPlayerBullets(prev => [...prev, ...spawnedBullets]);
      }

      // Check if 0.5 seconds have passed after pod explosion, then destroy ship
      if (podExploded && podExplosionTime) {
        const timeSinceExplosion = performance.now() - podExplosionTime;
        if (timeSinceExplosion >= 500 && !isDying) {
          if (!godModeActiveRef.current && networkRole !== 'client') {
            destroyShip();
          }
          setPodExploded(false);
          setPodExplosionTime(null);
        }
      }

      // [NETWORK] Client applies the host's authoritative state before rendering.
      if (networkRole === 'client' && networkSnapshotRef.current) {
        const s = networkSnapshotRef.current;
        if (s.ship) {
          ship.setPosition(s.ship.x, s.ship.y);
          ship.setVelocity(s.ship.vx, s.ship.vy);
          ship.setAngle(s.ship.angle);
          ship.setAccelerate(!!s.ship.accelerate);
          ship.fuel = typeof s.ship.fuel === 'number' ? s.ship.fuel : ship.fuel;
          // [NETWORK] Sync shield/tractor beam state from host
          if (typeof s.shieldActive === 'boolean') {
            setShieldActive(s.shieldActive);
          }
        }
        if (s.pod && pod) {
          const prevTowed = pod.towed;
          pod.setPosition(s.pod.x, s.pod.y);
          pod.setVelocity(s.pod.vx, s.pod.vy);
          pod.setAngle(s.pod.angle);
          pod.setAccelerate(!!s.pod.accelerate);
          pod.towed = !!s.pod.towed;
          pod.onHolder = !!s.pod.onHolder;
          if (pod.towed && !prevTowed && onPodDockedChange) onPodDockedChange(true);
        }
        if (typeof s.turretAngle === 'number') turretAngleRef.current = s.turretAngle;
        // [NETWORK] Sync enemy mines from host
        if (Array.isArray(s.enemyMines)) {
          for (let i = 0; i < enemyMines.length && i < s.enemyMines.length; i++) {
            const m = s.enemyMines[i];
            if (m && enemyMines[i].active) {
              enemyMines[i].x = m.x;
              enemyMines[i].y = m.y;
              enemyMines[i].vx = m.vx;
              enemyMines[i].vy = m.vy;
              enemyMines[i].angle = m.angle;
            }
          }
        }
      }

      // [SOUND] Drive the looping sounds from the current game state each frame.
      // Gameplay loops are silenced while frozen, dying or during the wormhole animation.
      // Thrust loops are not stopped here; they are faded out when the wormhole starts.
      if (soundManager.current) {
        const sm = soundManager.current;
        const soundInactive = frozen || isDying || wormholeRef.current.active;
        if (!wormholeRef.current.active) {
          const shipThrusting = networkRole === 'client'
            ? !frozen && !isDying && !!networkSnapshotRef.current?.ship?.accelerate
            : !frozen && !isDying &&
              (keys['ArrowUp'] || (!twoPlayer && (keys['w'] || keys['W'])) || accelerateActive || (tiltSteering && tiltThrustRef.current));
          const podThrusting = !frozen && !isDying && twoPlayer && pod && pod.towed && !pod.onHolder && p2Thrust;
          sm.setLoop('shipThrust', shipThrusting);
          sm.setLoop('podThrust', podThrusting);
        }
        sm.setLoop('podWobble', !soundInactive && (shieldActive || touchActive));
        sm.setLoop('fuelDrain', !soundInactive && isRefueling);
      }

      // Track active level play time. Paused while frozen (menus/overlays/tutorial) or during wormhole.
      if (!frozen && gameState === 'playing') {
        activeLevelTimeRef.current += frameElapsedMs;
      }

      // Skip all updates if frozen or during the wormhole level-complete animation
      if (frozen || wormholeRef.current.active) {
        // Still render the scene but don't update anything
      } else {
      if (networkRole !== 'client') {
      // Update ship (frozen while exploding)
      if (!isDying) {
        ship.update(deltaTime, GRAVITY, gravityMultiplier);

        // Consume fuel when shield is active
        if (shieldActive) {
          ship.fuel -= SHIELD_FUEL_CONSUMPTION * deltaTime;
        }
      }

      // Check collision with level - touching a wall destroys the ship
      if (level && tilesetLoaded && gameState === 'playing') {
        const collisionResult = collision.current.checkShipCollision(ship, level);
        if (collisionResult.collided) {
          if (godModeActiveRef.current) {
            // In god mode, bounce off walls, bunkers, fuel depots and reactors
            collision.current.resolveCollision(ship, collisionResult);
          } else {
            destroyShip();
          }
        }
      }

      // Update pod
      if (pod && pod.active) {
        // Tractor beam grabs the pod once the ship is close enough.
        // Grabbing the pod permanently takes it off the holder; while the beam
        // stays active the pod remains towed (the tether keeps them together).
        if (tractorBeamActive && !isDying) {
          if (pod.onHolder) {
            const distance = Math.sqrt((ship.x - pod.x) ** 2 + (ship.y - pod.y) ** 2);
            if (distance < 50) {
              connectPod(); // [POD_HOLDER] leaving the holder for good
              // Reset joystick rotation when pod is docked to prevent spinning
              joystickRotationSpeedRef.current = 0;
            }
          } else {
            // Check if pod was not towed before and is now being towed
            if (!pod.towed) {
              connectPod();
              // Reset joystick rotation when pod is docked to prevent spinning
              joystickRotationSpeedRef.current = 0;
            }
          }
        } else {
          // If POD_DROPPABLE is false, pod stays towed once docked (cannot be released)
          // If POD_DROPPABLE is true, pod can be released when tractor beam is off
          if (!POD_DROPPABLE && !pod.onHolder) {
            // Pod has been docked once, keep it towed permanently
            connectPod();
          } else {
            pod.towed = false;
          }
        }

        // Apply physically-correct tow tether forces (affects both ship and pod)
        if (pod.towed) {
          pod.applyTether(ship, deltaTime);
        }

        // Pod collision with walls/obstacles: only when off the holder.
        // On the holder the pod is completely safe.
        if (!podExploded && gameState === 'playing' && !pod.onHolder) {
          const podCollision = collision.current.checkPodCollision(pod, level);
          if (podCollision.collided) {
            if (godModeActiveRef.current) {
              // In god mode, the pod bounces off walls instead of exploding
              collision.current.resolveCollision(pod, podCollision);
              console.log('[POD_COLLISION] Pod bounced off wall tile in god mode:', podCollision.tile, 'at', podCollision.point, 'podPos:', { x: pod.x, y: pod.y });
            } else {
              console.log('[POD_COLLISION] Pod hit wall tile:', podCollision.tile, 'at', podCollision.point, 'podPos:', { x: pod.x, y: pod.y });
              detonatePod('wall');
            }
          }
        }

        pod.update(deltaTime);
      }

      // Trigger the delayed pod detonation 0.5s after the ship was destroyed.
      if (podDelayedExplosionRef.current && !podExploded && pod && pod.active) {
        const timeUntilDetonation = podDelayedExplosionRef.current - performance.now();
        if (timeUntilDetonation <= 0) {
          detonatePod('ship-destruction');
          podDelayedExplosionRef.current = null;
        }
      }

      }

      // Update bunkers and spawn bullets
      if (gameState === 'playing') {
        // Update enemy mines (host is authoritative; client only checks collisions)
        enemyMines.forEach((es, i) => {
          if (es.active) {
            if (networkRole !== 'client') {
              es.update(deltaTime, level, tileRenderer.current, ship.x, ship.y);
              if (Math.random() < 0.01) {
                console.log('[ENEMY_MINE]', i, 'pos:', es.x.toFixed(0), es.y.toFixed(0), 'angle:', es.angle.toFixed(2), 'active:', es.active);
              }
            }
            // Collision with player ship
            const dx = es.x - ship.x;
            const dy = es.y - ship.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < es.radius + 12) {
              if (!godModeActiveRef.current && !isDying) {
                destroyShip();
              }
            }
            // Collision with pod (only when off the holder and not already exploded)
            if (pod && pod.active && !pod.onHolder && !podExploded) {
              const pdx = es.x - pod.x;
              const pdy = es.y - pod.y;
              const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
              if (pdist < es.radius + 10) {
                if (godModeActiveRef.current) {
                  es.active = false;
                  particleSystem.current.spawnExplosion(es.x, es.y, 25, '#ff3333');
                  if (soundManager.current) soundManager.current.playOnce('explosion');
                } else {
                  detonatePod('mine');
                }
              }
            }
          }
        });

        const newBullets = [...bullets];
        if (networkRole !== 'client') {
          bunkers.forEach(bunker => {
            if (bunker.active) {
              const shot = bunker.update(deltaTime, ship.x, ship.y);
              if (shot) {
                newBullets.push(new Bullet(bunker.x, bunker.y, shot.angle, shot.speed));
                if (soundManager.current) soundManager.current.playOnce('bunkerFire');
                // [NETWORK] Host broadcasts bunker bullets to the client
                if (networkRole === 'host' && networkManager) {
                  networkManager.sendEvent({ type: 'bunkerBullet', x: bunker.x, y: bunker.y, angle: shot.angle, speed: shot.speed });
                }
              }
            }
          });
        }
        // [NETWORK] Client appends bunker bullets received from the host
        if (networkRole === 'client' && networkBulletQueueRef.current.length) {
          for (const item of networkBulletQueueRef.current.splice(0)) {
            if (item.type === 'bunkerBullet') {
              newBullets.push(new Bullet(item.x, item.y, item.angle, item.speed));
              if (soundManager.current) soundManager.current.playOnce('bunkerFire');
            }
          }
        }
        setBullets(newBullets);

        // Update player bullets and check collision with bunkers
        setPlayerBullets(prev => {
          return prev.filter(bullet => {
            // Update position
            bullet.x += bullet.vx * deltaTime;
            bullet.y += bullet.vy * deltaTime;

            // Only the ship's own shots can destroy the pod - watch out!
            if (pod && pod.active && bullet.owner !== 'turret' && bullet.owner !== 'pod') {
              const pdx = bullet.x - pod.x;
              const pdy = bullet.y - pod.y;
              if (Math.sqrt(pdx * pdx + pdy * pdy) < 12) {
                // Active shield/tractor beam also protects the attached pod
                if (shieldActive && pod.towed) {
                  console.log('[POD_SHIELD] Own bullet hit pod but was blocked by shield');
                  return false; // Remove bullet without detonating pod
                }
                if (detonatePod('own-bullet')) {
                  return false; // Remove bullet
                }
              }
            }

            // Check collision with bunkers
            let bulletHit = false;
            const newBunkers = bunkers.filter(bunker => {
              if (!bunker.active) return false; // Remove inactive bunkers
              const dx = bullet.x - bunker.x;
              const dy = bullet.y - bunker.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < 20) {
                bulletHit = true;
                bunker.active = false; // Mark bunker as inactive
                if (onScoreChange) onScoreChange({ points: SCORE_BUNKER_DESTROYED, type: 'bunker' });
                particleSystem.current.spawnExplosion(bunker.x, bunker.y, 20, '#ff6600');
                if (soundManager.current) soundManager.current.playOnce('explosion');
                return false; // Remove bunker
              }
              return true;
            });
            setBunkers(newBunkers);

            // Check collision with enemy mines
            enemyMines.forEach(es => {
              if (!es.active) return;
              const dx = bullet.x - es.x;
              const dy = bullet.y - es.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < es.radius + 3) {
                bulletHit = true;
                es.active = false;
                particleSystem.current.spawnExplosion(es.x, es.y, 25, '#ff3333');
                if (soundManager.current) soundManager.current.playOnce('explosion');
                if (onScoreChange) onScoreChange({ points: SCORE_BUNKER_DESTROYED, type: 'enemy-ship' });
              }
            });

            // Check collision with buttons (shot trigger)
            let buttonHit = false;
            buttons.forEach(button => {
              const dx = bullet.x - button.x;
              const dy = bullet.y - button.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < 15) {
                buttonHit = true;
                console.log('[BUTTON_HIT] Button hit:', button.type, 'tag:', button.tag, 'door:', button.door ? 'yes' : 'no');
                // Trigger door opening if button has an assigned door
                if (button.door && button.door.state === 'closed') {
                  console.log('[DOOR] Opening door, state:', button.door.state);
                  button.door.state = 'opening';
                  if (onScoreChange) onScoreChange({ points: SCORE_BUTTON_SLIDER, type: 'button' });
                } else if (button.door) {
                  console.log('[DOOR] Door not closed, state:', button.door.state);
                } else {
                  console.log('[DOOR] No door assigned to button');
                }
              }
            });

            // Remove bullet if it goes too far off-screen (out of bounds)
            // Check this BEFORE collision checks to avoid getTileAt() on out-of-bounds coords
            const BULLET_MAX_Y = SKY_FULL_STAR_DENSITY + 300;
            if (bulletHit) return false;
            if (bullet.x < -100 || bullet.x > level.width * 16 + 100 ||
                bullet.y < -BULLET_MAX_Y || bullet.y > level.height * 16 + 100) {
              return false;
            }

            // The reactor tile 'd' is a no-collision "ceiling", so bullets fly through it
            // instead of colliding. Detect hits by sampling the tile at the bullet position.
            const reactorTileHere = tileRenderer.current.getTileAt(level, bullet.x, bullet.y, 'reactor-check');
            if (REACTOR_TILES.includes(reactorTileHere)) {
              registerReactorHit({ x: bullet.x, y: bullet.y });
              return false;
            }

            // Check collision with walls
            const wallCollision = collision.current.checkBulletCollision(bullet, level, 'player');
            if (wallCollision.collided) {
              if (wallCollision.tile === GOD_MODE_TILE) {
                const tileSize = tileRenderer.current.getScaledTileSize();
                const tileX = Math.floor(wallCollision.point.x / tileSize);
                const tileY = Math.floor(wallCollision.point.y / tileSize);
                activateGodMode(tileX, tileY);
              } else if (REACTOR_TILES.includes(wallCollision.tile)) {
                registerReactorHit(wallCollision.point);
              }
              return false;
            }

            return true;
          });
        });

        // Update screen shake
        if (screenShake.intensity > 0) {
          const shakeX = (Math.random() - 0.5) * screenShake.intensity;
          const shakeY = (Math.random() - 0.5) * screenShake.intensity;
          setScreenShake(prev => ({
            x: shakeX,
            y: shakeY,
            intensity: Math.max(0, prev.intensity - 0.5)
          }));
        }

        // Update particles
        particleSystem.current.update(deltaTime);

        // Reactor meltdown: one-time effects, countdown, planet explosion
        if (meltdownActiveRef.current) {
          const now = performance.now();

          // Trigger one-time meltdown start effects
          if (!meltdownEffectsTriggeredRef.current) {
            meltdownEffectsTriggeredRef.current = true;
            setScreenShake({ x: 0, y: 0, intensity: 12 });
            particleSystem.current.spawnExplosion(reactorLastHitPointRef.current.x, reactorLastHitPointRef.current.y, 40, '#ffcc00');
            if (soundManager.current) soundManager.current.playOnce('explosion');
          }

          // Time until the planet explodes
          const remaining = meltdownExplosionTimeRef.current - now;
          if (remaining <= 0 && !meltdownEscapedRef.current && !planetExplosionRef.current.active) {
            // Planet explodes
            planetExplosionRef.current = {
              active: true,
              startTime: now,
              alpha: 0,
              x: reactorLastHitPointRef.current.x,
              y: reactorLastHitPointRef.current.y
            };
            setScreenShake({ x: 0, y: 0, intensity: 60 });
            if (soundManager.current) soundManager.current.playOnce('explosion');
          }

          if (planetExplosionRef.current.active) {
            planetExplosionRef.current.alpha = Math.min(1, (now - planetExplosionRef.current.startTime) / 1500);
            if (now - planetExplosionRef.current.startTime > 2500 && !meltdownGameOverCalledRef.current) {
              meltdownGameOverCalledRef.current = true;
              if (onGameOver) onGameOver();
              setGameState('gameover');
              return true;
            }
          }
        }
      }
      } // End of frozen else block

      // Update bullets and check collision with ship
      setBullets(prev => {
        const activeBullets = prev.filter(bullet => {
          if (!bullet.active) return false;
          bullet.update(deltaTime);

          // Remove bullet if it goes too far off-screen (out of bounds)
          // Check this BEFORE collision checks to avoid getTileAt() on out-of-bounds coords
          const BULLET_MAX_Y = SKY_FULL_STAR_DENSITY + 300;
          if (bullet.x < -100 || bullet.x > level.width * 16 + 100 ||
              bullet.y < -BULLET_MAX_Y || bullet.y > level.height * 16 + 100) {
            bullet.active = false;
            return false;
          }

          // Check collision with walls
          const wallCollision = collision.current.checkBulletCollision(bullet, level, 'bunker');
          if (wallCollision.collided) {
            bullet.active = false;
            return false;
          }

          // Check collision with pod
          if (pod && pod.active) {
            const pdx = bullet.x - pod.x;
            const pdy = bullet.y - pod.y;
            const distance = Math.sqrt(pdx * pdx + pdy * pdy);
            if (distance < 12) {
              // Active shield/tractor beam protects the attached pod from bunker fire
              if (shieldActive && pod.towed) {
                console.log('[POD_SHIELD] Bunker bullet hit pod but was blocked by shield');
                bullet.active = false;
                return false;
              }
              if (godModeActiveRef.current) {
                // God mode protects the pod from bunker fire
                console.log('[POD_GODMODE] Bunker bullet hit pod but was blocked by god mode');
                bullet.active = false;
                return false;
              }
              if (detonatePod('bunker-bullet')) {
                return false; // Remove bullet
              }
            }
          }

          // Check collision with tow tether (pod string) — bunker bullet hits the cable
          if (pod && pod.active && pod.towed && !shieldActive && !godModeActiveRef.current) {
            const tetherDist = pointToSegmentDistance(bullet.x, bullet.y, ship.x, ship.y, pod.x, pod.y);
            if (tetherDist < 3) {
              console.log('[TETHER_HIT] Bunker bullet hit pod string at', { x: bullet.x.toFixed(1), y: bullet.y.toFixed(1) });
              if (networkRole !== 'client') destroyShip();
              bullet.active = false;
              return false;
            }
          }

          // Check collision with ship
          const dx = bullet.x - ship.x;
          const dy = bullet.y - ship.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 15) {
            // Ship hit by bullet - check if shield is active or god mode is active
            if (shieldActive || godModeActiveRef.current) {
              // Shield/god mode blocks the bullet
              bullet.active = false;
              return false;
            }
            // Ship hit by bullet = destroy ship (host-authoritative in network mode)
            if (networkRole !== 'client') destroyShip();
            return false;
          }

          return true;
        });
        return activeBullets;
      });

      // Lose condition: fuel empty — delayed explosion after 3 seconds without thrust
      if (ship.fuel <= 0 && !fuelEmptyTimeRef.current && !isDying) {
        fuelEmptyTimeRef.current = performance.now();
        console.log('[FUEL_EMPTY] Ship ran out of fuel at', ship.x.toFixed(0), ship.y.toFixed(0), '| explosion in', FUEL_EMPTY_DESTROY_DELAY_MS, 'ms');
        if (soundManager.current) soundManager.current.playOnce('noFuel');
      }

      if (fuelEmptyTimeRef.current && !isDying) {
        const elapsed = performance.now() - fuelEmptyTimeRef.current;
        if (elapsed >= FUEL_EMPTY_DESTROY_DELAY_MS) {
          fuelEmptyTimeRef.current = null;
          console.log('[FUEL_EMPTY] Delay expired, destroying ship');
          destroyShip();
        }
      }

      // Update camera to follow ship with smooth interpolation
      if (level) {
        const scaledSize = tileRenderer.current.getScaledTileSize();
        const levelWidth = level.width * scaledSize;
        const levelHeight = level.height * scaledSize;

        // Target camera position: center on ship, or on the wormhole during the level-complete animation
        const isWormholeActive = wormholeRef.current.active;
        const targetX = isWormholeActive ? wormholeRef.current.x - width / 2 : ship.x - width / 2;
        const targetY = isWormholeActive ? wormholeRef.current.y - height / 2 : ship.y - height / 2;

        // Smooth camera interpolation (lerp)
        const lerpFactor = 0.1;
        const clampedTargetX = Math.max(0, Math.min(targetX, Math.max(0, levelWidth - width)));
        // Allow camera to go above level (sky), but clamp bottom to show full level
        // If level is taller than canvas, clamp bottom to levelHeight - height
        // If level is shorter than canvas, clamp bottom to 0 (center level vertically)
        const clampedTargetY = Math.min(targetY, levelHeight - height + CAMERA_BOTTOM_OFFSET);
        
        setCamera(prev => ({
          x: prev.x + (clampedTargetX - prev.x) * lerpFactor,
          y: prev.y + (clampedTargetY - prev.y) * lerpFactor
        }));
      }

      // Check if flying into sky (above level top at y=0)
      if (level && tilesetLoaded && gameState === 'playing') {
        // The sky is above the level top (y=0). Full density is reached at
        // -SKY_FULL_STAR_DENSITY; the delivery threshold is that plus SKY_DELIVERY_THRESHOLD.
        const skyThreshold = -(SKY_FULL_STAR_DENSITY - SKY_DELIVERY_THRESHOLD);
        
        if (ship.y < skyThreshold) {
          // Check if pod is close to ship (within towing distance)
          const podDistance = pod ? Math.sqrt((ship.x - pod.x) ** 2 + (ship.y - pod.y) ** 2) : Infinity;
          const podClose = pod && (pod.towed || podDistance < 80);
          if (podClose) {
            // Flying into sky with pod = start wormhole level-complete animation
            if (!levelCompleteTriggered.current && !wormholeRef.current.active) {
              levelCompleteTriggered.current = true;
              wormholeRef.current = {
                active: true,
                progress: 0,
                x: ship.x,
                y: ship.y - 120,
                startTime: performance.now()
              };
              // Escaping with the pod during an active meltdown grants a large bonus.
              if (meltdownActiveRef.current && !meltdownEscapedRef.current) {
                meltdownEscapedRef.current = true;
                if (onScoreChange) onScoreChange({ points: SCORE_REACTOR_ESCAPE, type: 'reactor' });
                if (soundManager.current) soundManager.current.playOnce('wormholeComplete');
              }
              setScreenShake({ x: 0, y: 0, intensity: 0 });
              setGameState('wormhole');
              // [SOUND] Fade thrust loops out while starting the wormhole ambient loop.
              if (soundManager.current) {
                const sm = soundManager.current;
                sm.fadeLoop('shipThrust', 1.0);
                sm.fadeLoop('podThrust', 1.0);
                sm.stopLoop('podWobble');
                sm.stopLoop('fuelDrain');
                sm.startLoop('wormholeAmbient');
              }
            }
          } else if (!godModeActiveRef.current) {
            // Flying into sky without pod = explosion then respawn
            destroyShip();
          }
        }
      }

      // Wormhole level-complete animation
      if (gameState === 'wormhole' && wormholeRef.current.active) {
        const now = performance.now();
        const duration = 2500; // ms
        const elapsed = now - wormholeRef.current.startTime;
        const progress = Math.min(1, elapsed / duration);
        wormholeRef.current.progress = progress;

        const wx = wormholeRef.current.x;
        const wy = wormholeRef.current.y;

        // Capture ship/pod start state on the first frame
        if (!wormholeRef.current.started) {
          wormholeRef.current.started = true;
          wormholeRef.current.shipStart = { x: ship.x, y: ship.y, vx: ship.vx, vy: ship.vy, angle: ship.angle };
        }

        const start = wormholeRef.current.shipStart;
        const drag = Math.pow(0.97, deltaTime);

        // Pull ship toward the wormhole with strong gravity while it keeps flying
        const shipDx = wx - ship.x;
        const shipDy = wy - ship.y;
        const shipDist = Math.hypot(shipDx, shipDy) || 1;
        const shipPull = WORMHOLE_GRAVITY * deltaTime;
        ship.vx += (shipDx / shipDist) * shipPull;
        ship.vy += (shipDy / shipDist) * shipPull;
        ship.vx *= drag;
        ship.vy *= drag;
        ship.x += ship.vx * deltaTime;
        ship.y += ship.vy * deltaTime;
        ship.angle = start.angle; // keep original orientation, no forced rotation

        // Pull pod with the same strong wormhole gravity
        if (pod && pod.active) {
          const podDx = wx - pod.x;
          const podDy = wy - pod.y;
          const podDist = Math.hypot(podDx, podDy) || 1;
          const podPull = (WORMHOLE_GRAVITY / pod.mass) * deltaTime;
          pod.vx += (podDx / podDist) * podPull;
          pod.vy += (podDy / podDist) * podPull;
          pod.vx *= drag;
          pod.vy *= drag;
          pod.x += pod.vx * deltaTime;
          pod.y += pod.vy * deltaTime;
        }

        // Spawn vortex particles around the wormhole
        if (Math.random() < 0.6) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 30 + Math.random() * 60;
          const px = wx + Math.cos(angle) * radius;
          const py = wy + Math.sin(angle) * radius;
          particleSystem.current.spawnExplosion(px, py, 4, `rgba(${100 + Math.random() * 155}, 200, 255, 0.7)`);
        }

        if (progress >= 1) {
          wormholeRef.current.active = false;
          setGameState('levelcomplete');
          // [SOUND] End the ambient loop and play the level-complete sound.
          if (soundManager.current) {
            soundManager.current.stopLoop('wormholeAmbient');
            soundManager.current.playOnce('wormholeComplete');
          }
          if (onLevelComplete) {
            const nd = pendingLevelCompleteData.current;
            if (nd) {
              onLevelComplete(nd.level, nd.time, nd.width, nd.height, { breakdown: nd.breakdown, totalScore: nd.totalScore, newHighscore: nd.newHighscore, levelNumber: nd.levelNumber });
              pendingLevelCompleteData.current = null;
            } else {
              onLevelComplete(currentLevel, activeLevelTimeRef.current, level.width, level.height);
            }
          }
        }
      }

      // [NETWORK] Host streams authoritative state; client streams P2 inputs.
      networkSendTimerRef.current += frameElapsedMs;
      if (networkSendTimerRef.current > 50 && networkManager && networkRole) {
        networkSendTimerRef.current = 0;
        if (networkRole === 'host') {
          networkManager.sendState({
            t: currentTime,
            ship: {
              x: ship.x,
              y: ship.y,
              vx: ship.vx,
              vy: ship.vy,
              angle: ship.angle,
              accelerate: ship.accelerate,
              fuel: ship.fuel
            },
            pod: pod && pod.active ? {
              x: pod.x,
              y: pod.y,
              vx: pod.vx,
              vy: pod.vy,
              angle: pod.angle,
              accelerate: pod.accelerate,
              towed: pod.towed,
              onHolder: pod.onHolder
            } : null,
            turretAngle: turretAngleRef.current,
            shieldActive: shieldActive || touchActive,
            enemyMines: enemyMines.filter(m => m.active).map(m => ({
              x: m.x,
              y: m.y,
              vx: m.vx,
              vy: m.vy,
              angle: m.angle
            }))
          });
        } else if (networkRole === 'client') {
          networkManager.sendInput({
            left: p2Left,
            right: p2Right,
            thrust: p2Thrust,
            fire: p2Fire
          });
        }
      }

      // Report fuel to parent
      if (onFuelChange) {
        onFuelChange(ship.fuel);
      }

      // Wormhole state is needed for rendering decisions below
      const isWormhole = wormholeRef.current.active;

      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Apply screen shake (disabled during the wormhole animation)
      ctx.save();
      if (!isWormhole && screenShake.intensity > 0) {
        ctx.translate(screenShake.x, screenShake.y);
      }

      // Draw stars in the sky (before level tiles)
      if (level && tilesetLoaded && stars.length > 0) {
        const time = performance.now();
        stars.forEach(star => {
          // Slight flicker around the star's base brightness
          const flicker = 0.85 + 0.15 * Math.sin(time * star.flickerSpeed + star.flickerOffset);
          const alpha = Math.max(0, Math.min(1, star.brightness * flicker));
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(star.x - camera.x, star.y - camera.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Draw level with camera offset
      if (level && tilesetLoaded) {
        tileRenderer.current.render(ctx, level, -camera.x, -camera.y);
      }

      // Draw fuel depots with their remaining fuel fill
      if (level && tilesetLoaded) {
        const scaledSize = tileRenderer.current.getScaledTileSize();
        const palette = tileRenderer.current.palette || [];
        const fuelColor = palette[50] || [255, 255, 0];
        ctx.fillStyle = `rgba(${fuelColor[0]}, ${fuelColor[1]}, ${fuelColor[2]}, 1)`;
        for (const depot of fuelDepotsRef.current.values()) {
          const x = depot.x * scaledSize;
          const y = depot.y * scaledSize;
          const w = scaledSize * 2;
          const h = scaledSize * 2;
          // The top tile's upper half is transparent, so the fuel fill can only occupy
          // the bottom tile plus the lower half of the top tile.
          const maxFillHeight = scaledSize * 1.5;
          const fillHeight = Math.max(0, maxFillHeight * (depot.fuel / depot.maxFuel));
          const fillY = y + h - fillHeight;
          ctx.fillRect(x - camera.x, fillY - camera.y, w, fillHeight);
          // Draw the depot border tiles on top (black interior made transparent)
          const chars = ['`', 'a', 'b', 'c'];
          const offsets = [[0, 0], [1, 0], [0, 1], [1, 1]];
          for (let i = 0; i < chars.length; i++) {
            const tileCanvas = tileRenderer.current.getTileBorderCanvas(chars[i].charCodeAt(0));
            if (tileCanvas) {
              ctx.drawImage(
                tileCanvas,
                x + offsets[i][0] * scaledSize - camera.x,
                y + offsets[i][1] * scaledSize - camera.y
              );
            }
          }
        }
      }

      // Draw wormhole during level-complete animation
      const wormholeProgress = isWormhole ? wormholeRef.current.progress : 0;
      const wormholeTime = performance.now();
      if (isWormhole) {
        drawWormhole(ctx, wormholeRef.current.x, wormholeRef.current.y, wormholeProgress, wormholeTime);
      }

      // Wormhole scale/alpha: ship and pod shrink and fade as they are pulled in
      const easeIn = t => t * t * t;
      const wormholeScale = isWormhole ? Math.max(0, 1 - easeIn(wormholeProgress)) : 1;
      const wormholeAlpha = isWormhole ? Math.max(0, 1 - wormholeProgress) : 1;

      // Draw ship with camera offset (hidden while exploding)
      if (!isDying) {
        ctx.save();
        ctx.translate(ship.x - camera.x, ship.y - camera.y);
        ctx.rotate(ship.angle);
        ctx.scale(wormholeScale, wormholeScale);
        ctx.globalAlpha = wormholeAlpha;

        // Ship body
        const SHIP_SPRITE_WIDTH = 20;
        const SHIP_SPRITE_HEIGHT = 27;
        const shipSprite = ship.accelerate > 0 ? shipOnImageRef.current : shipOffImageRef.current;
        if (shipSprite && shipSprite.complete) {
          ctx.drawImage(shipSprite, -SHIP_SPRITE_WIDTH / 2, -SHIP_SPRITE_HEIGHT / 2, SHIP_SPRITE_WIDTH, SHIP_SPRITE_HEIGHT);
        } else {
          // Fallback green triangle while the sprite is still loading
          ctx.fillStyle = '#00ff00';
          ctx.beginPath();
          ctx.moveTo(0, -15);
          ctx.lineTo(10, 10);
          ctx.lineTo(0, 5);
          ctx.lineTo(-10, 10);
          ctx.closePath();
          ctx.fill();
        }

        if (twoPlayer && (!pod || !pod.towed)) {
          ctx.save();
          ctx.rotate(turretAngleRef.current);
          ctx.fillStyle = '#bbbbbb';
          ctx.fillRect(-2, -18, 4, 16);
          ctx.fillStyle = '#666';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();

        // Draw shield circle around ship (when pod button is pressed)
        if (shieldActive && !isWormhole) {
          ctx.save();
          ctx.translate(ship.x - camera.x, ship.y - camera.y);
          ctx.beginPath();
          ctx.arc(0, 0, SHIELD_RADIUS, 0, Math.PI * 2);
          const shieldColor = levelColors ? `rgb(${levelColors.shield.join(',')})` : SHIELD_COLOR;
          ctx.strokeStyle = shieldColor;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }

        // Draw god mode aura around the ship (golden pulsing ring)
        if (godModeActiveRef.current && !isWormhole) {
          ctx.save();
          ctx.translate(ship.x - camera.x, ship.y - camera.y);
          const pulse = Math.sin(performance.now() / 150) * 4;
          ctx.beginPath();
          ctx.arc(0, 0, SHIELD_RADIUS + 4 + pulse, 0, Math.PI * 2);
          ctx.strokeStyle = GOD_MODE_COLOR;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Buttons are rendered by tileRenderer.render() using their actual tile appearance (L, N)

      // Draw enemy mines with camera offset
      const showRedDot = Math.floor(performance.now() / 500) % 2 === 0;
      enemyMines.forEach((es, i) => {
        if (!es.active) return;
        ctx.save();
        ctx.translate(es.x - camera.x, es.y - camera.y);
        ctx.rotate(es.angle);
        const MINE_SIZE = 20;
        const mineSprite = (showRedDot && mineRedImageRef.current && mineRedImageRef.current.complete)
          ? mineRedImageRef.current
          : mineImageRef.current;
        if (mineSprite && mineSprite.complete) {
          ctx.drawImage(mineSprite, -MINE_SIZE / 2, -MINE_SIZE / 2, MINE_SIZE, MINE_SIZE);
        } else {
          // Fallback red circle
          ctx.fillStyle = '#ff3333';
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#aa0000';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      });

      // Draw sliders with camera offset
      sliders.forEach(slider => {
        ctx.save();
        ctx.translate(slider.x - camera.x, slider.y - camera.y);
        
        // Slider body (orange)
        ctx.fillStyle = '#ff9900';
        ctx.fillRect(-16, -8, 32, 16);
        
        // Slider outline
        ctx.strokeStyle = '#cc6600';
        ctx.lineWidth = 2;
        ctx.strokeRect(-16, -8, 32, 16);
        
        // Movement indicator
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(-4, -4, 8, 8);
        
        ctx.restore();
      });

      // Draw bunkers with camera offset
      bunkers.forEach((bunker, bunkerIndex) => {
        if (!bunker.destroyed) {
          ctx.save();
          ctx.translate(bunker.x - camera.x, bunker.y - camera.y);

          // Blinking red dot for active bunkers. Offset the phase by the bunker index so
          // they don't all blink at the same time.
          const blinkPhase = (Math.floor(Date.now() / 100) + bunkerIndex) % 15;
          if (blinkPhase === 0) {
            const offset = BUNKER_INDICATOR_OFFSETS[bunker.type] || { x: 0, y: -8 };
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(offset.x, offset.y, 3, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      });

      // Draw bullets with camera offset
      bullets.forEach(bullet => {
        ctx.save();
        ctx.translate(bullet.x - camera.x, bullet.y - camera.y);
        
        // Bullet (yellow circle)
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Bullet glow
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, bullet.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });

      // Draw player bullets with camera offset
      playerBullets.forEach(bullet => {
        ctx.save();
        ctx.translate(bullet.x - camera.x, bullet.y - camera.y);
        
        // Player bullet (cyan circle)
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Player bullet glow
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });

      // Draw the tow tether (visible line between ship and pod when being towed)
      if (pod && pod.active && pod.towed && !isWormhole) {
        ctx.save();
        ctx.strokeStyle = '#00ffff'; // Ship color (cyan)
        ctx.lineWidth = POD_TETHER_WIDTH;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ship.x - camera.x, ship.y - camera.y);
        ctx.lineTo(pod.x - camera.x, pod.y - camera.y);
        ctx.stroke();
        ctx.restore();
      }

      // Draw pod with camera offset
      if (pod && pod.active) {
        ctx.save();
        ctx.translate(pod.x - camera.x, pod.y - camera.y);
        ctx.scale(wormholeScale, wormholeScale);
        ctx.globalAlpha = wormholeAlpha;

        const podRgb = levelColors ? ensureBrightPodColor(levelColors.pod) : [0, 255, 0];
        const podColor = `rgb(${podRgb.join(',')})`;
        const podDarkColor = `rgb(${podRgb.map(c => Math.floor(c * 0.7)).join(',')})`;

        // Pod body (green circle)
        ctx.fillStyle = podColor;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Pod outline
        ctx.strokeStyle = podDarkColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (twoPlayer && pod.towed) {
          ctx.save();
          ctx.rotate(pod.angle);
          ctx.fillStyle = '#bbbbbb';
          ctx.fillRect(-2, -13, 4, 8);
          ctx.fillStyle = '#555';
          ctx.fillRect(-4, 6, 8, 3);
          ctx.restore();
        }

        ctx.restore();

        // If pod is close (not yet docked), draw a subtle connection to the pod
        if (beamActive && !isWormhole) {
          const distance = Math.sqrt((ship.x - pod.x) ** 2 + (ship.y - pod.y) ** 2);
          if (distance < 50) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ship.x - camera.x, ship.y - camera.y);
            ctx.lineTo(pod.x - camera.x, pod.y - camera.y);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Draw a small shield circle around the attached pod when the shield/tractor beam is active
        if (shieldActive && pod.towed && !isWormhole) {
          ctx.save();
          ctx.translate(pod.x - camera.x, pod.y - camera.y);
          ctx.beginPath();
          ctx.arc(0, 0, SHIELD_RADIUS * 0.5, 0, Math.PI * 2);
          const podShieldColor = levelColors ? `rgb(${levelColors.shield.join(',')})` : SHIELD_COLOR;
          ctx.strokeStyle = podShieldColor;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Draw fine iridescent tractor beam spiral (down to first obstacle only)
      if (beamActive) {
        const sx = ship.x - camera.x;
        const sy = ship.y - camera.y;
        const length = beamEndY - ship.y;
        if (length > 0) {
          const t = performance.now() / 300;
          ctx.save();
          ctx.lineWidth = 1.2;
          // Two intertwined strands form a delicate helix/spiral
          for (let strand = 0; strand < 2; strand++) {
            ctx.beginPath();
            for (let d = 0; d <= length; d += 3) {
              const phase = d * 0.18 + t + strand * Math.PI;
              const amp = 5 * (1 - (d / length) * 0.25); // gently tapering
              const x = sx + Math.sin(phase) * amp;
              const y = sy + d;
              if (d === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            // Iridescent shifting hue, very low alpha so it is barely perceptible
            const hue = (t * 50 + strand * 140) % 360;
            ctx.strokeStyle = `hsla(${hue}, 95%, 72%, 0.22)`;
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // Meltdown warning overlay (screen coordinates, drawn on top of gameplay)
      if (meltdownActiveRef.current && !planetExplosionRef.current.active) {
        ctx.save();
        // Reset all transforms so we can draw in true screen/canvas pixel coordinates
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const cw = canvas.width;
        const ch = canvas.height;
        const now = performance.now();
        const remaining = Math.max(0, (meltdownExplosionTimeRef.current - now) / 1000);
        const pulse = 0.5 + 0.5 * Math.sin(now / 100);

        // Full-screen pulsing red warning tint
        ctx.fillStyle = `rgba(255, 0, 0, ${0.18 + pulse * 0.18})`;
        ctx.fillRect(0, 0, cw, ch);

        // Large centered warning text
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 20;
        ctx.font = 'bold 42px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`CORE MELTDOWN: ${remaining.toFixed(2)}s`, cw / 2, ch / 3);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('ESCAPE WITH POD!', cw / 2, ch / 3 + 52);
        ctx.restore();
      }

      // Restore screen shake
      if (screenShake.intensity > 0) {
        ctx.restore();
      }

      // Draw all touch control buttons (inside canvas).
      // Geometry comes from the shared helper so rendering and hit-testing stay in sync (DRY).
      // Transparent buttons, highlight when active.
      // Render after screen shake restore to ensure they are in correct position.
      ctx.textAlign = 'center';
      // Measure geometry live each frame so the buttons stay pinned a
      // fixed screen-pixel distance from the on-screen canvas top on any
      // aspect ratio, independent of resize/orientation event timing.
      const { ratio: liveRatio, topOffset: liveTopOffset, topGap: liveTopGap } = getLiveTouchGeom(canvasRef.current, width, height);
      const touchButtons = getTouchButtons(width, height, liveRatio, liveTopOffset, liveTopGap, showTouchButtons, isMobile, twoPlayer, pod && pod.towed, tiltSteering, networkRole);
      for (const btn of touchButtons) {
        let active = false;
        switch (btn.type) {
          case 'pod': active = touchActive; break;
          case 'accelerate': active = accelerateActive; break;
          case 'fire': active = fireActive; break;
          case 'rotateLeft': active = rotateLeftActive; break;
          case 'rotateRight': active = rotateRightActive; break;
          case 'p2RotateLeft': active = p2RotateLeftActive; break;
          case 'p2RotateRight': active = p2RotateRightActive; break;
          case 'p2Thrust': active = p2ThrustActive; break;
          case 'p2Fire': active = p2FireActive; break;
        }
        drawTouchButton(ctx, btn, active, touchButtonOpacity, podIconRef.current, crosshairIconRef.current);
      }
      // Render particles
      particleSystem.current.render(ctx, camera.x, camera.y);

      // X-axis wrapping based on level width, not canvas width.
      // Only wrap if the crossing body is not blocked by a wall at the boundary.
      // While the pod is docked (towed), ship and pod must wrap in the SAME frame
      // by the SAME offset. Otherwise the tether vector keeps the length it had
      // before only one of them teleported, stretching across the whole level and
      // springing the pair back violently. So as soon as either one crosses an
      // edge, both are shifted together and the tether vector stays identical.
      if (level && tilesetLoaded) {
        const levelWidth = level.width * 16; // scaled tile size
        const isWall = (tile) => !(!tile || [' ', '.'].includes(tile));
        // Offset that would wrap a body to the opposite side (0 if not over an edge).
        const crossingOffset = (body) => {
          if (body.x < 0) return levelWidth;
          if (body.x > levelWidth) return -levelWidth;
          return 0;
        };
        // Tile in the boundary column the body enters after wrapping by `offset`.
        const boundaryTile = (body, offset) => {
          const col = offset > 0 ? levelWidth - 1 : 0;
          return tileRenderer.current.getTileAt(level, col, Math.floor(body.y / 16), 'boundary-wrap');
        };

        if (pod && pod.active && pod.towed) {
          // Whichever of the two reaches the edge first drags the other along.
          const offset = crossingOffset(ship) || crossingOffset(pod);
          if (offset !== 0 && !isWall(boundaryTile(ship, offset)) && !isWall(boundaryTile(pod, offset))) {
            ship.x += offset;
            pod.x += offset;
          }
        } else {
          const shipOffset = crossingOffset(ship);
          if (shipOffset !== 0 && !isWall(boundaryTile(ship, shipOffset))) {
            ship.x += shipOffset;
          }
          // A free (off-holder, untethered) pod wraps on its own too.
          if (pod && pod.active && !pod.onHolder) {
            const podOffset = crossingOffset(pod);
            if (podOffset !== 0 && !isWall(boundaryTile(pod, podOffset))) {
              pod.x += podOffset;
            }
          }
        }
      }

    // Planet explosion: large full-screen flash and expanding shockwave.
    // The blast starts at the reactor's on-screen position and expands until it covers the canvas.
    if (planetExplosionRef.current.active) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const now = performance.now();
      const time = now - planetExplosionRef.current.startTime;
      const alpha = planetExplosionRef.current.alpha;
      const cw = canvas.width;
      const ch = canvas.height;
      // Start the explosion at the reactor's on-screen position and grow to cover the canvas
      const reactorX = planetExplosionRef.current.x;
      const reactorY = planetExplosionRef.current.y;
      const cx = (reactorX - camera.x) * dpr;
      const cy = (reactorY - camera.y) * dpr;
      const maxDistance = Math.max(
        Math.hypot(cx, cy),
        Math.hypot(cw - cx, cy),
        Math.hypot(cx, ch - cy),
        Math.hypot(cw - cx, ch - cy)
      ) * 1.05;
      const radius = maxDistance * (0.2 + 1.2 * alpha);

      // White/bright flash covering the whole screen
      ctx.fillStyle = `rgba(255, 255, 220, ${alpha * 0.85})`;
      ctx.fillRect(0, 0, cw, ch);

      // Expanding fireball gradient from bottom-left
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, `rgba(255, 255, 230, ${alpha})`);
      gradient.addColorStop(0.25, `rgba(255, 220, 80, ${alpha})`);
      gradient.addColorStop(0.55, `rgba(255, 100, 20, ${alpha * 0.9})`);
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Expanding crack streaks
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * 1.2)})`;
      ctx.lineWidth = 3;
      const streaks = 12;
      const rotation = time * 0.002;
      for (let i = 0; i < streaks; i++) {
        const base = (i / streaks) * Math.PI * 2;
        const angle = base + rotation;
        const r1 = radius * 0.1;
        const r2 = radius * (1.0 + 0.15 * Math.sin(base * 5 + time * 0.005));
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
        ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
        ctx.stroke();
      }

      // Random flying debris
      for (let i = 0; i < 20; i++) {
        const base = (i / 20) * Math.PI * 2;
        const angle = base + rotation * (1 + 0.5 * Math.sin(base));
        const distance = radius * (0.9 + 0.6 * Math.sin(base * 3 + time * 0.003));
        const size = 2 + 5 * Math.sin(base * 7);
        const x = cx + Math.cos(angle) * distance;
        const y = cy + Math.sin(angle) * distance;
        ctx.fillStyle = `rgba(255, ${100 + i * 7}, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, size), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    return true;
  };

  // Single stable RAF loop for the whole component lifetime.
  // It always calls the latest render logic via renderFnRef, so the loop is never torn down/recreated.
  useEffect(() => {
    let animationId;
    const loop = () => {
      let shouldContinue = true;
      try {
        shouldContinue = renderFnRef.current();
      } catch (e) {
        console.error('[GAME_LOOP] Error in render loop:', e);
      }
      if (shouldContinue) {
        animationId = requestAnimationFrame(loop);
      }
    };
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          backgroundColor: levelColors ? `rgb(${levelColors.background.join(',')})` : '#000',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          userSelect: 'none',
          touchAction: 'none'
        }}
        onContextMenu={(e) => e.preventDefault()}
        tabIndex={0}
      />
      {bonusLifeDisplay && (
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.9), rgba(0, 204, 102, 0.9))',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '12px',
          fontSize: '18px',
          fontWeight: '700',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 1100,
          boxShadow: '0 4px 20px rgba(0, 255, 136, 0.4)',
          animation: 'bonusLifePop 0.3s ease-out'
        }}>
          +1 LIFE
          <div style={{ fontSize: '12px', fontWeight: '400', marginTop: '2px', opacity: 0.9 }}>
            Bonus Life!
          </div>
        </div>
      )}
    </div>
  );
}

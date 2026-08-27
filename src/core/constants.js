// Game constants
export const GRAVITY = 0.055; // base gravity
export const ACCELERATE_POWER = 0.3; // thrust strength per dt
export const ROTATION_SPEED = 0.05; // 50% slower than original
export const TURRET_ROTATION_SPEED = 0.06; // Player 2 turret rotation speed
export const POD_ROTATION_SPEED = 0.05; // Player 2 pod rotation speed
export const POD_THRUST = 0.1; // Player 2 pod thruster strength
export const ROTATION_SLOW_ANGLE_THRESHOLD = 15; // degrees: when starting rotation within this threshold of vertical, use slow rotation
export const ROTATION_SLOW_MULTIPLIER = 0.4; // multiplier for rotation speed when in slow mode
export const ROTATION_SNAP_ANGLE_THRESHOLD = 10; // degrees: when stopping rotation within this threshold of vertical, snap to 0°
export const MAX_SPEED = 5; // maximum speed for the ship
export const FRICTION = 0.99; // friction coefficient
export const SHIELD_DURATION = 300; // frames
export const FUEL_MAX = 100;
export const FUEL_CONSUMPTION = 0.1;
export const POD_FUEL_CONSUMPTION = 0.05;
export const FIRE_FUEL_CONSUMPTION = 0.2; // Fuel consumed per shot fired
export const BULLET_SPEED = 8; // Speed of fired bullets

// Fuel depots
export const FUEL_DEPOT_CAPACITY = 80; // Max fuel a 2x2 depot can hold
export const FUEL_DEPOT_INITIAL = FUEL_DEPOT_CAPACITY; // Fuel level when a depot is first loaded
export const FUEL_DEPOT_REFUEL_RATE = 2.2; // Fuel transferred to ship per frame while refueling

// Sky event
// The star start height is controlled by the level header 'height of empty space'.
// The value is read in GameCanvas.jsx; no constant needed.
export const SKY_FULL_STAR_DENSITY = 700; // pixels above level top (y=0) where stars are rendered to full density
export const SKY_DELIVERY_THRESHOLD = 100; // additional pixels above SKY_FULL_STAR_DENSITY to trigger sky delivery

export const WORMHOLE_GRAVITY = 1.4; // strong gravitational pull during the level-complete wormhole animation
export const GAME_SPEED = 0.5; // Global game speed multiplier (1.0 = full speed, 0.5 = half speed)

// Canvas internal resolution (fixed aspect ratio 4:3)
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const HUD_HEIGHT = 22; // TODO: calculate this dynamiclly instead of just fix. this only affects the button position distance from top


// Camera scrolling
// Additional offset for camera bottom limit to ensure full level is visible
// Accounts for HUD height, bottom gap, and padding
export const CAMERA_BOTTOM_OFFSET = 200;

// Portrait zoom: in portrait orientation the canvas is very tall, so zoom in
// to show a smaller portion of the level at a larger scale.
// portraitZoom = min(PORTRAIT_ZOOM_MAX, height/width * PORTRAIT_ZOOM_FACTOR)
// Example: a foldable phone in unfolded portrait mode at 800x2800 would yield
// 3.5 * 1.9 = 6.65x zoom without a cap, showing almost nothing but the ship.
// PORTRAIT_ZOOM_MAX clamps this so the level stays playable on extreme aspect ratios.
export const PORTRAIT_ZOOM_MAX = 3;
export const PORTRAIT_ZOOM_FACTOR = 1.9;

// Pod physics
export const POD_MASS_FACTOR = 2; // Pod is 2x heavier than the ship (affects tow physics / center of mass)
export const POD_GRAVITY = 0.055; // Gravity applied to the pod when free-falling (off the holder)
export const POD_TETHER_LENGTH = 50; // Rest length of the tow tether (pixels)
export const POD_TETHER_STIFFNESS = 0.18; // Spring stiffness of the tow tether
export const POD_TETHER_DAMPING = 0.12; // Damping of the tow tether to prevent oscillation
export const POD_HOLDER_OFFSET = -13; // Pixels the pod sits ABOVE its holder marker (avoids holder collision)
export const POD_TETHER_WIDTH = 1; // Width of the visible tether line (pixels)
export const POD_HOLDER_CHAR = 'm'; // Character used for pod holder marker in level files (original it was 'm)
export const POD_DROPPABLE = false; // If true, pod can be released after docking (for future missions); if false, pod stays docked once activated

// Touch controls
// Screen aspect ratio (width / height) at which the tractor-beam touch button switches position:
// ratio > threshold -> side buttons (left & right), ratio <= threshold -> single bottom button
export const TOUCH_BUTTON_RATIO_THRESHOLD = 1.9;
// Virtual joystick: minimum movement (pixels) to activate direction control
export const JOYSTICK_THRESHOLD = 30;
// Virtual joystick: scale factor mapping horizontal pointer velocity (px/event) to rotation speed
export const JOYSTICK_VELOCITY_FACTOR = 0.004;
// Virtual joystick: time (ms) without horizontal movement after which rotation stops
export const JOYSTICK_STOP_MS = 60;
// Virtual joystick: max press duration (ms) for a tap to count as fire instead of joystick
export const JOYSTICK_TAP_FIRE_MS = 200;

// Door system: automatic close timeout (ms) after door fully opens
export const DOOR_AUTO_CLOSE_MS = 6000;
// Door system: animation step time (ms) per column slide
export const DOOR_SLIDE_MS_PER_COL = 50;
// Touch button size factor - base thickness for all buttons
export const BUTTON_SIZE_FACTOR = 40;
// Touch button margin factor - transparent margin around buttons for hit area
export const BUTTON_MARGIN_FACTOR = 10;

// Scoring
export const SCORE_LEVEL_COMPLETE = 1000; // for each live left when completing a level, maximum: LEVEL_NR*1000 (if more lives are left)
export const SCORE_BUNKER_DESTROYED = 50;
export const SCORE_BUTTON_SLIDER = 100; // for each slider opened (only once)
export const SCORE_POD_CONNECT = 100; // once the pod is collected
export const SCORE_FUEL_REMAINING = 10; // per percent remaining when reaching the sky

// Time bonus
export const TIME_BONUS_HEIGHT_SECONDS_PER_TILE = 0.4; // seconds allowed per level height tile
export const TIME_BONUS_WIDTH_SECONDS_PER_TILE = 0.04; // small width influence on allowed time
export const TIME_BONUS_POINTS_PER_SECOND = 10; // points for each remaining full second
export const TIME_BONUS_MAX = 1000; // maximum time bonus points per level
export const SCORING_VERSION = '1.3'; // version of the scoring calculation rule

// Bonus life thresholds: when total score reaches each value, the player gains an extra life.
// The gaps grow larger so later bonus lives are harder to earn.
export const BONUS_LIFE_THRESHOLDS = [2000, 4000, 7000,10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 65000, 70000, 75000, 80000, 85000, 90000, 95000, 100000,105000,110000,115000,120000,125000,130000,135000,140000,145000,150000];

// Shooting
export const SHOOT_COOLDOWN_MS = 250; // Cooldown between shots in milliseconds

// Bunker indicator offsets (x, y) for each bunker type (relative to bunker center)
export const BUNKER_INDICATOR_OFFSETS = {
  'P': { x: 24, y: -5 },   // Up-right-facing bunker
  'U': { x: 8, y: -6 },    // Up-left-facing bunker
  '[': { x: -8, y: 19 },   // Down-right-facing bunker
  '\\': { x: 8, y: 19 }    // Down-left-facing bunker
};

export const SHIP_COLLISION_RADIUS = 8; // Collision radius for the ship in unscaled screen-space pixels. To make collision tighter or wider relative to the visual ship, adjust this value.

// Shield
export const SHIELD_RADIUS = 25; // Radius of the shield circle around the ship
export const POD_COLLISION_RADIUS = 6; // Collision radius for the pod in unscaled screen-space pixels. To make collision tighter or wider relative to the visual pod, adjust this value.
export const SHIELD_COLOR = 'rgba(0, 255, 255, 0.5)'; // Color of the shield
export const SHIELD_FUEL_CONSUMPTION = 0.3; // Fuel consumed per frame when shield is active

// Enemy mines
export const MINE_RADIUS = 10;
export const MINE_SPEED_MIN = 1.5;
export const MINE_SPEED_MAX = 2.5;
export const MINE_CHANGE_DIR_MIN_FRAMES = 60;
export const MINE_CHANGE_DIR_MAX_FRAMES = 180;
export const MINE_BOUNCE_DAMPING = 0.8;
export const MINE_TURN_RATE = 0.01; // How fast mine velocity interpolates toward target direction (0-1, higher = sharper turn)
export const MINE_STUCK_BOUNCE_THRESHOLD = 4; // Number of bounces within MINE_STUCK_BOUNCE_WINDOW frames to trigger stuck detection
export const MINE_STUCK_BOUNCE_WINDOW = 30; // Frame window for counting bounces
export const MINE_UNSTUCK_FRAMES = 20; // How many frames collision is disabled while escaping
export const MINE_ACTIVATION_DISTANCE = 500; // Mines only start moving when ship is within this distance (in pixels)
export const MINE_MAX_DISTANCE_FROM_START = 500; // Max distance a mine can travel from its start point before reversing 180°

// God mode power-up
export const GOD_MODE_TILE = 'ý'; // Tile that grants god mode when shot
export const GOD_MODE_DURATION_MS = 600000; // Duration of god mode in milliseconds
export const GOD_MODE_COLOR = 'rgba(0, 255, 174, 0.55)'; // Golden aura around the ship in god mode

// Multi-shot power-up (6-way star shot)
export const MULTI_SHOT_TILE = '§'; // Tile that grants 6-way shot when shot
export const MULTI_SHOT_COLOR = 'rgba(255, 128, 53, 0.55)'; // Orange aura around the ship with multi-shot

// Level editor
export const ENABLE_LEVEL_EDITOR = true; // Enable/disable level editor button

// Game settings
export const INITIAL_LIVES = 3; // Starting number of lives
export const FUEL_EMPTY_DESTROY_DELAY_MS = 11000; // Delay before ship explodes after fuel runs out

// Reactor meltdown
export const REACTOR_TILES = ['d', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']; // Shootable reactor core tiles
export const REACTOR_MELTDOWN_TRIGGER_MS = 1000; // Shoot the reactor this long to trigger meltdown
export const REACTOR_MELTDOWN_ESCAPE_MS = 15000; // Time until planet explodes after meltdown begins
export const REACTOR_HIT_TIMEOUT_MS = 400; // Max gap between hits to keep meltdown charging
export const SCORE_REACTOR_ESCAPE = 2000; // Bonus for escaping with the pod during meltdown

// Haptic feedback vibration patterns (duration in ms)
export const VIBRATE_ROTATE = 30;       // Rotation start
export const VIBRATE_ROTATE_STOP = 20;   // Rotation stop (tilt only)
export const VIBRATE_THRUST = 50;       // Thrust/accelerate start
export const VIBRATE_THRUST_STOP = 40;   // Thrust stop (tilt only)
export const VIBRATE_FIRE = 10;         // Each shot fired
export const VIBRATE_POD = 80;          // Tractor beam / pod activation

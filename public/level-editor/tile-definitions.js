// Tile character definitions for the level editor
// Each tile has a character, display color, name, and category

const TILE_CATEGORIES = {
  BASIC: 'Basic',
  SLOPES: 'Slopes',
  SLIDERS: 'Sliders',
  BUTTONS: 'Buttons',
  BUNKERS: 'Bunkers',
  POD: 'Pod',
  FUEL: 'Fuel',
  REACTOR: 'Reactor',
  WALLS: 'Walls',
  SPECIAL_SLOPES: 'Special Walls',
  DECORATIVE: 'Decorative',
  POWERUP: 'Powerup',
  ENEMIES: 'Enemies',
  HIDDEN: 'Hidden Passage',
  OTHER: 'OTHER',
};

const char = (code) => String.fromCharCode(code);

const TILE_DEFINITIONS = [
  // Basic tiles
  { char: ' ', color: '#1a1a2e', name: 'Empty', category: TILE_CATEGORIES.BASIC },
  { char: 'p', color: '#4a4a5a', name: 'Solid', category: TILE_CATEGORIES.BASIC },
  { char: '*', color: '#ffcc00', name: 'Start Point', category: TILE_CATEGORIES.BASIC },
  { char: '#', color: '#666666', name: 'Respawn Area Border', category: TILE_CATEGORIES.BASIC },

  // ### Bunkers  
  // Floor Bunker Left (PQRS)
  { char: 'P', color: '#ff4444', name: 'Bunker (left cannon)', category: TILE_CATEGORIES.BUNKERS },
  { char: 'Q', color: '#888888', name: 'Bunker (left)', category: TILE_CATEGORIES.BUNKERS },
  { char: 'R', color: '#888888', name: 'Bunker (left)', category: TILE_CATEGORIES.BUNKERS },
  { char: 'S', color: '#888888', name: 'Bunker (left)', category: TILE_CATEGORIES.BUNKERS },
  
  // Floor Bunker Right (UVWT)
  { char: 'U', color: '#ff4444', name: 'Bunker (right cannon)', category: TILE_CATEGORIES.BUNKERS },
  { char: 'V', color: '#888888', name: 'Bunker (right)', category: TILE_CATEGORIES.BUNKERS },
  { char: 'T', color: '#888888', name: 'Bunker (right)', category: TILE_CATEGORIES.BUNKERS },
  { char: 'W', color: '#888888', name: 'Bunker (right)', category: TILE_CATEGORIES.BUNKERS },
  
  // Bunker Ceiling Left (]^_\\)
  { char: '\\', color: '#ff4444', name: 'Bunker (ceiling left cannon)', category: TILE_CATEGORIES.BUNKERS },
  { char: '^', color: '#555555', name: 'Bunker (ceiling left)', category: TILE_CATEGORIES.BUNKERS },
  { char: '_', color: '#555555', name: 'Bunker (ceiling left)', category: TILE_CATEGORIES.BUNKERS },
  { char: ']', color: '#555555', name: 'Bunker (ceiling left)', category: TILE_CATEGORIES.BUNKERS },
  
  // Bunker Ceiling Right ([XYZ)
  { char: '[', color: '#ff4444', name: 'Bunker (ceiling right cannon)', category: TILE_CATEGORIES.BUNKERS },
  { char: 'X', color: '#555555', name: 'Bunker (ceiling right)', category: TILE_CATEGORIES.BUNKERS },
  { char: 'Y', color: '#555555', name: 'Bunker (ceiling right)', category: TILE_CATEGORIES.BUNKERS },
  { char: 'Z', color: '#555555', name: 'Bunker (ceiling right)', category: TILE_CATEGORIES.BUNKERS },
  
  // Pod holder
  { char: 'm', color: '#00ff00', name: 'Pod Holder (POD_HOLDER_CHAR)', category: TILE_CATEGORIES.POD },
  { char: '0', color: '#00ff00', name: 'Pod Holder Ball 0 (ignored)', category: TILE_CATEGORIES.POD },
  { char: '1', color: '#00ff00', name: 'Pod Holder Ball 1 (ignored)', category: TILE_CATEGORIES.POD },
  { char: '2', color: '#00ff00', name: 'Pod Holder Ball 2 (ignored)', category: TILE_CATEGORIES.POD },
  { char: '3', color: '#33cc33', name: 'Pod Stand 3', category: TILE_CATEGORIES.POD },
  { char: '4', color: '#33cc33', name: 'Pod Stand 4', category: TILE_CATEGORIES.POD },
  
  // Fuel alcoves
  { char: '`', color: '#00ffff', name: 'Fuel alcove top left (no-collision)', category: TILE_CATEGORIES.FUEL },
  { char: 'a', color: '#00cccc', name: 'Fuel Alcove top right (no-collision)', category: TILE_CATEGORIES.FUEL },
  { char: 'b', color: '#00cccc', name: 'Fuel Alcove bottom left', category: TILE_CATEGORIES.FUEL },
  { char: 'c', color: '#00cccc', name: 'Fuel Alcove top right', category: TILE_CATEGORIES.FUEL },
  
  // Reactor
  { char: 'd', color: '#ff8800', name: 'Reactor ceiling no-collision (core)', category: TILE_CATEGORIES.REACTOR },
  { char: 'e', color: '#cc6600', name: 'Reactor ceiling no-collision middle', category: TILE_CATEGORIES.REACTOR },
  { char: 'f', color: '#cc6600', name: 'Reactor ceiling no-collision right', category: TILE_CATEGORIES.REACTOR },
  { char: 'g', color: '#cc6600', name: 'Reactor G', category: TILE_CATEGORIES.REACTOR },
  { char: 'h', color: '#cc6600', name: 'Reactor H', category: TILE_CATEGORIES.REACTOR },
  { char: 'i', color: '#cc6600', name: 'Reactor I', category: TILE_CATEGORIES.REACTOR },
  { char: 'j', color: '#cc6600', name: 'Reactor J', category: TILE_CATEGORIES.REACTOR },
  { char: 'k', color: '#cc6600', name: 'Reactor K', category: TILE_CATEGORIES.REACTOR },
  { char: 'l', color: '#cc6600', name: 'Reactor L', category: TILE_CATEGORIES.REACTOR },
  
  // Sliders (doors)
  // In the original C engine each slider is a moving solid block that is paired
  // with a stationary blocker and connected to a button. The full families are:
  //   - Backslash shape: '@' (opens right), 'A' (opens left), 'B' (blocker)
  //   - Slash shape:     'C' (opens right), 'D' (opens left), 'E' (blocker)
  //   - Vertical bar:    'F' (opens right), 'G' (opens left), 'H' (blocker)
  //   - Horizontal bar:  'I' (opens down),  'J' (opens up),   'K' (blocker)
  // Below are the characters used by this port; the rest of each family is
  // kept here for completeness.
  { char: '@', color: '#ff00ff', name: 'Slider @ (backslash, opens right)', category: TILE_CATEGORIES.OTHER },
  { char: 'I', color: '#cc00cc', name: 'Slider I (horizontal bar, opens down)', category: TILE_CATEGORIES.OTHER },
  { char: 'K', color: '#cc00cc', name: 'Slider K (horizontal bar blocker)', category: TILE_CATEGORIES.OTHER },
  { char: 'H', color: '#ff00ff', name: 'Slider H (vertical bar blocker)', category: TILE_CATEGORIES.SLIDERS },
  { char: 'G', color: '#ff00ff', name: 'Slider G (vertical bar, opens left)', category: TILE_CATEGORIES.SLIDERS },
  // Blockers and moving parts for the backslash and slash doors
  { char: 'B', color: '#8888ff', name: 'Slider B (backslash blocker)', category: TILE_CATEGORIES.OTHER },
  { char: 'A', color: '#8888ff', name: 'Slider A (backslash, opens left)', category: TILE_CATEGORIES.OTHER },
  { char: 'E', color: '#8888ff', name: 'Slider E (slash blocker)', category: TILE_CATEGORIES.OTHER },
  { char: 'D', color: '#8888ff', name: 'Slider D (slash, opens left)', category: TILE_CATEGORIES.OTHER },
  
  // Buttons
  { char: 'L', color: '#ffff00', name: 'Button L (left wall)', category: TILE_CATEGORIES.BUTTONS },
  { char: 'M', color: '#cccc00', name: 'Button lower half (left wall)', category: TILE_CATEGORIES.BUTTONS },
  { char: 'O', color: '#ff00ff', name: 'Button O (right wall)', category: TILE_CATEGORIES.BUTTONS },
  { char: 'N', color: '#ffff00', name: 'Button upper half (right wall)', category: TILE_CATEGORIES.BUTTONS },
  
  // God Mode Tile
  { char: 'ý', color: '#ffd700', name: 'God Mode Power-up', category: TILE_CATEGORIES.POWERUP },
  
  // Enemies
  { char: '+', color: '#ff3333', name: 'Enemy Mine (random movement)', category: TILE_CATEGORIES.ENEMIES },

  // ### Walls
    
  // half walls
  { char: 'y', color: '#666666', name: 'Half Wall right', category: TILE_CATEGORIES.WALLS },
  { char: '}', color: '#666666', name: 'quarter Wall left-bottom (no-collision)', category: TILE_CATEGORIES.WALLS },
  { char: 'z', color: '#666666', name: 'quarter Wall right-bottom (no-collision)', category: TILE_CATEGORIES.WALLS },
  { char: '{', color: '#888888', name: 'quarter wall right top (no-collision)', category: TILE_CATEGORIES.WALLS },
  { char: '~', color: '#888888', name: 'quarter wall left top (no-collision)', category: TILE_CATEGORIES.WALLS },
  { char: '|', color: '#666666', name: 'Half Wall left', category: TILE_CATEGORIES.WALLS },
  { char: char(128), color: '#888888', name: 'half wall top (C1-PAD)', category: TILE_CATEGORIES.WALLS },
  { char: char(129), color: '#888888', name: 'half wall bottom (C1-HOP)', category: TILE_CATEGORIES.WALLS },
  { char: 'ï', color: '#888888', name: 'three quarter wall bottom', category: TILE_CATEGORIES.WALLS },
  
  
  // Slopes
  { char: 'q', color: '#5a5a6a', name: 'descending slope left', category: TILE_CATEGORIES.SLOPES },
  { char: 'r', color: '#5a5a6a', name: 'descending slope right (no-collision)', category: TILE_CATEGORIES.SLOPES },
  { char: 's', color: '#5a5a6a', name: 'ascending slope left (no-collision)', category: TILE_CATEGORIES.SLOPES },
  { char: 't', color: '#5a5a6a', name: 'ascending slope right', category: TILE_CATEGORIES.SLOPES },
  { char: 'u', color: '#4a4a5a', name: 'ascending slope left', category: TILE_CATEGORIES.SLOPES },
  { char: 'v', color: '#4a4a5a', name: 'ascending slope right (no-collision)', category: TILE_CATEGORIES.SLOPES },
  { char: 'w', color: '#4a4a5a', name: 'descending slope left', category: TILE_CATEGORIES.SLOPES },
  { char: 'x', color: '#4a4a5a', name: 'descending slope right (no-collision)', category: TILE_CATEGORIES.SLOPES },

  // Cave wall slopes
  // Hidden wall passage: looks like a solid wall but has no collision
  // (the ship can fly through it, useful for secret passages)
  { char: 'à', color: '#888888', name: 'Hidden wall passage (fly-through)', category: TILE_CATEGORIES.HIDDEN },
  { char: 'á', color: '#888888', name: 'Hidden descending slope left', category: TILE_CATEGORIES.HIDDEN },
  { char: 'â', color: '#888888', name: 'Hidden descending slope right', category: TILE_CATEGORIES.HIDDEN },
  { char: 'ã', color: '#888888', name: 'Hidden ascending slope left', category: TILE_CATEGORIES.HIDDEN },
  { char: 'ä', color: '#888888', name: 'Hidden ascending slope right', category: TILE_CATEGORIES.HIDDEN },
  { char: 'å', color: '#888888', name: 'Hidden ascending ceiling left', category: TILE_CATEGORIES.HIDDEN },
  { char: 'æ', color: '#888888', name: 'Hidden ascending ceiling right', category: TILE_CATEGORIES.HIDDEN },
  { char: 'ç', color: '#888888', name: 'Hidden descending ceiling left', category: TILE_CATEGORIES.HIDDEN },
  { char: 'è', color: '#888888', name: 'Hidden descending ceiling right', category: TILE_CATEGORIES.HIDDEN },
  { char: 'ê', color: '#888888', name: 'Hidden quarter wall bottom right', category: TILE_CATEGORIES.HIDDEN },
  { char: 'ë', color: '#888888', name: 'Hidden quarter wall top right', category: TILE_CATEGORIES.HIDDEN },
  { char: 'í', color: '#888888', name: 'Hidden quarter wall bottom left', category: TILE_CATEGORIES.HIDDEN },
  { char: 'î', color: '#888888', name: 'Hidden quarter wall top left', category: TILE_CATEGORIES.HIDDEN },
  { char: 'é', color: '#888888', name: 'hidden half wall right', category: TILE_CATEGORIES.HIDDEN },
  { char: 'ì', color: '#888888', name: 'hidden half wall left', category: TILE_CATEGORIES.HIDDEN },
  { char: 'þ', color: '#888888', name: 'hidden half wall top', category: TILE_CATEGORIES.HIDDEN },
  { char: 'ÿ', color: '#888888', name: 'hidden half wall bottom', category: TILE_CATEGORIES.HIDDEN },
  { char: '', color: '#888888', name: 'hidden three quarter wall bottom', category: TILE_CATEGORIES.HIDDEN },
  
  // ### Special slopes
  // offset slopes
  { char: char(130), color: '#888888', name: 'descending slope left offset (C1-0x82 Break Permitted Here)', category: TILE_CATEGORIES.SPECIAL_SLOPES },
  { char: char(131), color: '#888888', name: 'descending slope right offset (no-collision) (C1-0x83 No Break Here)', category: TILE_CATEGORIES.SPECIAL_SLOPES },
  { char: char(132), color: '#888888', name: 'ascending slope offset (no-collision) (C1-0x84 Index)', category: TILE_CATEGORIES.SPECIAL_SLOPES },
  { char: char(133), color: '#888888', name: 'ascending slope offset (C1-0x85 Next Line)', category: TILE_CATEGORIES.SPECIAL_SLOPES },
  { char: char(134), color: '#888888', name: 'ascending slope offset ceiling left (C1-0x86 Start of Selected Area)', category: TILE_CATEGORIES.SPECIAL_SLOPES },
  { char: char(135), color: '#888888', name: 'ascending slope offset ceiling right (no-collision) (C1-0x87 End of Selected Area) ', category: TILE_CATEGORIES.SPECIAL_SLOPES },
  { char: 'n', color: '#5a5a6a', name: 'descending slope left offset', category: TILE_CATEGORIES.SPECIAL_SLOPES },
  { char: 'o', color: '#5a5a6a', name: 'descending slope right offset (no-collision)', category: TILE_CATEGORIES.SPECIAL_SLOPES },  
  // steep slopes
  { char: '$', color: '#888888', name: 'Slope steep descending', category: TILE_CATEGORIES.SPECIAL_SLOPES },
  { char: '%', color: '#888888', name: 'Slope steep ascending', category: TILE_CATEGORIES.SPECIAL_SLOPES }, // percent 

  { char: '(', color: '#888888', name: 'ceiling Slope steep descending', category: TILE_CATEGORIES.SPECIAL_SLOPES },
  { char: ')', color: '#888888', name: 'ceiling Slope steep ascending', category: TILE_CATEGORIES.SPECIAL_SLOPES },

  // useless slope tiles with celing and bottom on one tile
  { char: char(136), color: '#888888', name: 'descending slope and ceiling (C1-0x88, Character Tabulation Set)', category: TILE_CATEGORIES.SPECIAL_SLOPES },
  { char: char(137), color: '#888888', name: 'descending half slope and ceiling (C1-0x89, Character Tabulation with Justification)', category: TILE_CATEGORIES.SPECIAL_SLOPES },
  { char: char(138), color: '#888888', name: 'C1-0x8a (Line Tabulation Set)', category: TILE_CATEGORIES.SPECIAL_SLOPES },
  { char: char(139), color: '#888888', name: 'C1-0x8b (Partial Line Forward)', category: TILE_CATEGORIES.SPECIAL_SLOPES },
  { char: char(140), color: '#888888', name: 'C1-0x8c (Partial Line Backward)', category: TILE_CATEGORIES.SPECIAL_SLOPES },
  { char: char(141), color: '#888888', name: 'C1-0x8d (Reverse Line Feed)', category: TILE_CATEGORIES.SPECIAL_SLOPES },
  { char: '', color: '#888888', name: 'quarter wall bottom', category: TILE_CATEGORIES.SPECIAL_SLOPES },
  

  // OTHER (other tiles from blocks.json)
  { char: '!', color: '#888888', name: 'Tile !', category: TILE_CATEGORIES.OTHER },
  { char: '"', color: '#888888', name: 'Tile "', category: TILE_CATEGORIES.OTHER },
  { char: '&', color: '#888888', name: 'Tile &', category: TILE_CATEGORIES.OTHER },
  { char: ',', color: '#888888', name: 'Tile ,', category: TILE_CATEGORIES.OTHER },
  { char: '-', color: '#888888', name: 'Tile -', category: TILE_CATEGORIES.OTHER },
  { char: '.', color: '#888888', name: 'Tile .', category: TILE_CATEGORIES.OTHER },
  { char: '/', color: '#888888', name: 'Tile /', category: TILE_CATEGORIES.OTHER },
  { char: ':', color: '#888888', name: 'Tile :', category: TILE_CATEGORIES.OTHER },
  { char: ';', color: '#888888', name: 'Tile ;', category: TILE_CATEGORIES.OTHER },
  { char: '<', color: '#888888', name: 'Tile <', category: TILE_CATEGORIES.OTHER },
  { char: '=', color: '#888888', name: 'Tile =', category: TILE_CATEGORIES.OTHER },
  { char: '>', color: '#888888', name: 'Tile >', category: TILE_CATEGORIES.OTHER },
  { char: '?', color: '#888888', name: 'Tile ?', category: TILE_CATEGORIES.OTHER },
  { char: '5', color: '#888888', name: 'Tile 5', category: TILE_CATEGORIES.OTHER },
  { char: '6', color: '#888888', name: 'Tile 6', category: TILE_CATEGORIES.OTHER },
  { char: '7', color: '#888888', name: 'Tile 7', category: TILE_CATEGORIES.OTHER },
  { char: '8', color: '#888888', name: 'Tile 8', category: TILE_CATEGORIES.OTHER },
  { char: '9', color: '#888888', name: 'Tile 9', category: TILE_CATEGORIES.OTHER },
  { char: 'C', color: '#888888', name: 'Tile C', category: TILE_CATEGORIES.OTHER },
  { char: 'F', color: '#888888', name: 'Tile F', category: TILE_CATEGORIES.OTHER },
  { char: 'J', color: '#888888', name: 'Tile J', category: TILE_CATEGORIES.OTHER },
  
  { char: '', color: '#888888', name: 'Tile ', category: TILE_CATEGORIES.OTHER },
  { char: '', color: '#888888', name: 'Tile ', category: TILE_CATEGORIES.OTHER },
  { char: '', color: '#888888', name: 'Tile ', category: TILE_CATEGORIES.OTHER },
  { char: '', color: '#888888', name: 'Tile ', category: TILE_CATEGORIES.OTHER },
  { char: '', color: '#888888', name: 'Tile ', category: TILE_CATEGORIES.OTHER },
  { char: '', color: '#888888', name: 'Tile ', category: TILE_CATEGORIES.OTHER },
  { char: '', color: '#888888', name: 'Tile ', category: TILE_CATEGORIES.OTHER },
  { char: '', color: '#888888', name: 'Tile ', category: TILE_CATEGORIES.OTHER },
  { char: '', color: '#888888', name: 'Tile ', category: TILE_CATEGORIES.OTHER },
  { char: '', color: '#888888', name: 'Tile ', category: TILE_CATEGORIES.OTHER },
  { char: '', color: '#888888', name: 'Tile ', category: TILE_CATEGORIES.OTHER },
  { char: '', color: '#888888', name: 'Tile ', category: TILE_CATEGORIES.OTHER },
  { char: '', color: '#888888', name: 'Tile ', category: TILE_CATEGORIES.OTHER },
  { char: '', color: '#888888', name: 'Tile ', category: TILE_CATEGORIES.OTHER },
  { char: '', color: '#888888', name: 'Tile ', category: TILE_CATEGORIES.OTHER },
  { char: '', color: '#888888', name: 'Tile ', category: TILE_CATEGORIES.OTHER },
  { char: ' ', color: '#888888', name: 'Tile  ', category: TILE_CATEGORIES.OTHER },
  { char: '¡', color: '#888888', name: 'Tile ¡', category: TILE_CATEGORIES.OTHER },
  { char: '¢', color: '#888888', name: 'Tile ¢', category: TILE_CATEGORIES.OTHER },
  { char: '£', color: '#888888', name: 'Tile £', category: TILE_CATEGORIES.OTHER },
  { char: '¤', color: '#888888', name: 'Tile ¤', category: TILE_CATEGORIES.OTHER },
  { char: '¥', color: '#888888', name: 'Tile ¥', category: TILE_CATEGORIES.OTHER },
  { char: '¦', color: '#888888', name: 'Tile ¦', category: TILE_CATEGORIES.OTHER },
  { char: '§', color: '#888888', name: 'Tile §', category: TILE_CATEGORIES.OTHER },
  { char: '¨', color: '#888888', name: 'Tile ¨', category: TILE_CATEGORIES.OTHER },
  { char: '©', color: '#888888', name: 'Tile ©', category: TILE_CATEGORIES.OTHER },
  { char: 'ª', color: '#888888', name: 'Tile ª', category: TILE_CATEGORIES.OTHER },
  { char: '«', color: '#888888', name: 'Tile «', category: TILE_CATEGORIES.OTHER },
  { char: '¬', color: '#888888', name: 'Tile ¬', category: TILE_CATEGORIES.OTHER },
  { char: '­', color: '#888888', name: 'Tile ­', category: TILE_CATEGORIES.OTHER },
  { char: '®', color: '#888888', name: 'Tile ®', category: TILE_CATEGORIES.OTHER },
  { char: '¯', color: '#888888', name: 'Tile ¯', category: TILE_CATEGORIES.OTHER },
  { char: '°', color: '#888888', name: 'Tile °', category: TILE_CATEGORIES.OTHER },
  { char: '±', color: '#888888', name: 'Tile ±', category: TILE_CATEGORIES.OTHER },
  { char: '²', color: '#888888', name: 'Tile ²', category: TILE_CATEGORIES.OTHER },
  { char: '³', color: '#888888', name: 'Tile ³', category: TILE_CATEGORIES.OTHER },
  { char: '´', color: '#888888', name: 'Tile ´', category: TILE_CATEGORIES.OTHER },
  { char: 'µ', color: '#888888', name: 'Tile µ', category: TILE_CATEGORIES.OTHER },
  { char: '¶', color: '#888888', name: 'Tile ¶', category: TILE_CATEGORIES.OTHER },
  { char: '·', color: '#888888', name: 'Tile ·', category: TILE_CATEGORIES.OTHER },
  { char: '¸', color: '#888888', name: 'Tile ¸', category: TILE_CATEGORIES.OTHER },
  { char: '¹', color: '#888888', name: 'Tile ¹', category: TILE_CATEGORIES.OTHER },
  { char: 'º', color: '#888888', name: 'Tile º', category: TILE_CATEGORIES.OTHER },
  { char: '»', color: '#888888', name: 'Tile »', category: TILE_CATEGORIES.OTHER },
  { char: '¼', color: '#888888', name: 'Tile ¼', category: TILE_CATEGORIES.OTHER },
  { char: '½', color: '#888888', name: 'Tile ½', category: TILE_CATEGORIES.OTHER },
  { char: '¾', color: '#888888', name: 'Tile ¾', category: TILE_CATEGORIES.OTHER },
  { char: '¿', color: '#888888', name: 'Tile ¿', category: TILE_CATEGORIES.OTHER },
  { char: 'À', color: '#888888', name: 'Tile À', category: TILE_CATEGORIES.OTHER },
  { char: 'Á', color: '#888888', name: 'Tile Á', category: TILE_CATEGORIES.OTHER },
  { char: 'Â', color: '#888888', name: 'Tile Â', category: TILE_CATEGORIES.OTHER },
  { char: 'Ã', color: '#888888', name: 'Tile Ã', category: TILE_CATEGORIES.OTHER },
  { char: 'Ä', color: '#888888', name: 'Tile Ä', category: TILE_CATEGORIES.OTHER },
  { char: 'Å', color: '#888888', name: 'Tile Å', category: TILE_CATEGORIES.OTHER },
  { char: 'Æ', color: '#888888', name: 'Tile Æ', category: TILE_CATEGORIES.OTHER },
  { char: 'Ç', color: '#888888', name: 'Tile Ç', category: TILE_CATEGORIES.OTHER },
  { char: 'È', color: '#888888', name: 'Tile È', category: TILE_CATEGORIES.OTHER },
  { char: 'É', color: '#888888', name: 'Tile É', category: TILE_CATEGORIES.OTHER },
  { char: 'Ê', color: '#888888', name: 'Tile Ê', category: TILE_CATEGORIES.OTHER },
  { char: 'Ë', color: '#888888', name: 'Tile Ë', category: TILE_CATEGORIES.OTHER },
  { char: 'Ì', color: '#888888', name: 'Tile Ì', category: TILE_CATEGORIES.OTHER },
  { char: 'Í', color: '#888888', name: 'Tile Í', category: TILE_CATEGORIES.OTHER },
  { char: 'Î', color: '#888888', name: 'Tile Î', category: TILE_CATEGORIES.OTHER },
  { char: 'Ï', color: '#888888', name: 'Tile Ï', category: TILE_CATEGORIES.OTHER },
  { char: 'Ð', color: '#888888', name: 'Tile Ð', category: TILE_CATEGORIES.OTHER },
  { char: 'Ñ', color: '#888888', name: 'Tile Ñ', category: TILE_CATEGORIES.OTHER },
  { char: 'Ò', color: '#888888', name: 'Tile Ò', category: TILE_CATEGORIES.OTHER },
  { char: 'Ó', color: '#888888', name: 'Tile Ó', category: TILE_CATEGORIES.OTHER },
  { char: 'Ô', color: '#888888', name: 'Tile Ô', category: TILE_CATEGORIES.OTHER },
  { char: 'Õ', color: '#888888', name: 'Tile Õ', category: TILE_CATEGORIES.OTHER },
  { char: 'Ö', color: '#888888', name: 'Tile Ö', category: TILE_CATEGORIES.OTHER },
  { char: '×', color: '#888888', name: 'Tile ×', category: TILE_CATEGORIES.OTHER },
  { char: 'Ø', color: '#888888', name: 'Tile Ø', category: TILE_CATEGORIES.OTHER },
  { char: 'Ù', color: '#888888', name: 'Tile Ù', category: TILE_CATEGORIES.OTHER },
  { char: 'Ú', color: '#888888', name: 'Tile Ú', category: TILE_CATEGORIES.OTHER },
  { char: 'Û', color: '#888888', name: 'Tile Û', category: TILE_CATEGORIES.OTHER },
  { char: 'Ü', color: '#888888', name: 'Tile Ü', category: TILE_CATEGORIES.OTHER },
  { char: 'Ý', color: '#888888', name: 'Tile Ý', category: TILE_CATEGORIES.OTHER },
  { char: 'Þ', color: '#888888', name: 'Tile Þ', category: TILE_CATEGORIES.OTHER },
  { char: 'ß', color: '#888888', name: 'Tile ß', category: TILE_CATEGORIES.OTHER },
  { char: 'ð', color: '#888888', name: 'Tile ð', category: TILE_CATEGORIES.OTHER },
  { char: 'ñ', color: '#888888', name: 'Tile ñ', category: TILE_CATEGORIES.OTHER },
  { char: 'ò', color: '#888888', name: 'Tile ò', category: TILE_CATEGORIES.OTHER },
  { char: 'ó', color: '#888888', name: 'Tile ó', category: TILE_CATEGORIES.OTHER },
  { char: 'ô', color: '#888888', name: 'Tile ô', category: TILE_CATEGORIES.OTHER },
  { char: 'õ', color: '#888888', name: 'Tile õ', category: TILE_CATEGORIES.OTHER },
  { char: 'ö', color: '#888888', name: 'Tile ö', category: TILE_CATEGORIES.OTHER },
  { char: '÷', color: '#888888', name: 'Tile ÷', category: TILE_CATEGORIES.OTHER },
  { char: 'ø', color: '#888888', name: 'Tile ø', category: TILE_CATEGORIES.OTHER },
  { char: 'ù', color: '#888888', name: 'Tile ù', category: TILE_CATEGORIES.OTHER },
  { char: 'ú', color: '#888888', name: 'Tile ú', category: TILE_CATEGORIES.OTHER },
  { char: 'û', color: '#888888', name: 'Tile û', category: TILE_CATEGORIES.OTHER },
  { char: 'ü', color: '#888888', name: 'Tile ü', category: TILE_CATEGORIES.OTHER },
];

// Create a map for quick lookup by character
const TILE_MAP = {};
TILE_DEFINITIONS.forEach(tile => {
  TILE_MAP[tile.char] = tile;
});

// Group tiles by category
const TILES_BY_CATEGORY = {};
TILE_DEFINITIONS.forEach(tile => {
  if (!TILES_BY_CATEGORY[tile.category]) {
    TILES_BY_CATEGORY[tile.category] = [];
  }
  TILES_BY_CATEGORY[tile.category].push(tile);
});

export const TILE_SIZE = 35;
export const PING = 200; // Expected latency for tweening

// Bomb
export const EXPLOSION_TIME = 2000;

// Tile Indices
export const EMPTY_CELL = 0;
export const DESTRUCTIBLE_CELL = 2;
export const NON_DESTRUCTIBLE_CELL = 1;

// Map Layers
export const TILESET = 'tiles';
export const LAYER = 'layer_1';

export const AVAILABLE_MAPS = [
  'hot_map', 'cold_map', 'arena_map', 'open_map',
  'rune_lab', 'mirror_temple', 'trap_garden'
];

export const MAX_PLAYERS = 4;

// Player stats (keep in sync with server/constants.js)
export const INITIAL_SPEED = 150;
export const STEP_SPEED = 50;
export const MAX_SPEED = 350;

export const INITIAL_DELAY = 2000;
export const STEP_DELAY = 500;
export const MIN_DELAY = 500;

export const INITIAL_POWER = 1;
export const STEP_POWER = 1;

// Spoil Types (Must match server)
// New-style constants used by newer code
export const SPOIL_SPEED = 0;
export const SPOIL_POWER = 1;
export const SPOIL_DELAY = 2;
export const SPOIL_SHIELD = 3;
export const SPOIL_REMOTE = 4;
export const SPOIL_KICK = 5;
export const SPOIL_GHOST = 6;
export const SPOIL_DISEASE = 7;
export const SPOIL_LIFE = 8;
export const SPOIL_PASSWALL = 9;
export const SPOIL_REVERSE = 10;
export const SPOIL_BOMB_UP = 11;
export const SPOIL_BOMB_PASS = 12;
export const SPOIL_SLOW = 13;
export const SPOIL_CONFUSE = 14;
export const SPOIL_MINE = 15;
export const SPOIL_THROW = 16;
export const SPOIL_MAGNET = 17;

// Back-compat constants used by legacy client code
export const SPEED = SPOIL_SPEED;
export const POWER = SPOIL_POWER;
export const DELAY = SPOIL_DELAY;
export const SHIELD = SPOIL_SHIELD;
export const REMOTE = SPOIL_REMOTE;
export const KICK = SPOIL_KICK;
export const GHOST = SPOIL_GHOST;
export const LIFE = SPOIL_LIFE;
export const PASSWALL = SPOIL_PASSWALL;
export const REVERSE = SPOIL_REVERSE;
export const BOMB_UP = SPOIL_BOMB_UP;
export const BOMB_PASS = SPOIL_BOMB_PASS;
export const SLOW = SPOIL_SLOW;
export const CONFUSE = SPOIL_CONFUSE;
export const MINE = SPOIL_MINE;
export const THROW = SPOIL_THROW;
export const MAGNET = SPOIL_MAGNET;

// Timed powerups
export const SHIELD_DURATION_MS = 3000;
export const GHOST_DURATION_MS = 15000;

// Special Tile IDs (from Tiled map)
export const TILE_PORTAL = 2; // Usually the balk tile id, need check
export const TILE_SPEED_FLOOR = 3; // Example id

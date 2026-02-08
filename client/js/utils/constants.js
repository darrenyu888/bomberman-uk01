export const TILE_SIZE = 35;
export const PING = 200; // Expected latency for tweening

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

export const INITIAL_SPEED = 150;

// Spoil Types (Must match server)
export const SPOIL_SPEED = 0;
export const SPOIL_POWER = 1;
export const SPOIL_DELAY = 2;
export const SPOIL_SHIELD = 3;
export const SPOIL_REMOTE = 4;
export const SPOIL_KICK = 5;
export const SPOIL_GHOST = 6;
export const SPOIL_DISEASE = 7;

// Special Tile IDs (from Tiled map)
export const TILE_PORTAL = 2; // Usually the balk tile id, need check
export const TILE_SPEED_FLOOR = 3; // Example id

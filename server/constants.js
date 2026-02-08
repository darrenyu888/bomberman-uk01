const TILE_SIZE = 35;

const EXPLOSION_TIME = 2000;

const SPOIL_CHANCE = 50;
const SPEED = 0;
const POWER = 1;
const DELAY = 2;
const SHIELD = 3;
const REMOTE = 4;
const KICK = 5;
const GHOST = 6;
const DISEASE = 7; // Skull Item
const LIFE = 8; // +1 life
const PASSWALL = 9; // pass through destructible blocks (temporary)
const REVERSE = 10; // reverse controls (temporary)

// Classic add-ons
const BOMB_UP = 11; // increase simultaneous bombs
const BOMB_PASS = 12; // walk through bombs
const SLOW = 13; // slow movement (temporary)
const CONFUSE = 14; // swap left/right, up/down (temporary)
const MINE = 15; // mine ammo (+1)
const THROW = 16; // enable throwing bombs
const MAGNET = 17; // attract nearby spoils (temporary)

const SHIELD_DURATION_MS = 3000;
const GHOST_DURATION_MS = 15000;
const DISEASE_DURATION_MS = 20000; // Disease lasts 20s

// Player stats (keep roughly in sync with client constants)
const INITIAL_SPEED = 150;
const STEP_SPEED = 50;
const MAX_SPEED = 350;

const INITIAL_DELAY = 2000;
const STEP_DELAY = 500;
const MIN_DELAY = 500;

const EMPTY_CELL = 0;
const DESTRUCTIBLE_CELL = 2;
const NON_DESTRUCTIBLE_CELL = 1;

const INITIAL_POWER = 1
const STEP_POWER = 1

// Disease Types (Client needs to know these or just server logic?)
// 0: Diarrhea (Auto Bomb)
// 1: Constipation (No Bomb)
// 2: Fast Run (Uncontrollable speed)
// 3: Slow Potion
// 4: Reverse Controls (Client side mostly, need flag)
const DISEASE_TYPES = {
  AUTO_BOMB: 0,
  NO_BOMB: 1,
  FAST: 2,
  SLOW: 3,
  REVERSE: 4,
};

const SKINS = [
  'Theodora', 'Ringo', 'Jeniffer', 'Godard',
  'Biarid', 'Solia', 'Kedan', 'Nigob', 'Baradir', 'Raviel', 'Valpo'
]

module.exports = {
  TILE_SIZE,
  EXPLOSION_TIME,
  SPOIL_CHANCE,
  SPEED,
  POWER,
  DELAY,
  SHIELD,
  REMOTE,
  KICK,
  GHOST,
  DISEASE,
  LIFE,
  PASSWALL,
  REVERSE,
  BOMB_UP,
  BOMB_PASS,
  SLOW,
  CONFUSE,
  MINE,
  THROW,
  MAGNET,
  DISEASE_TYPES,
  SHIELD_DURATION_MS,
  GHOST_DURATION_MS,
  DISEASE_DURATION_MS,
  EMPTY_CELL,
  DESTRUCTIBLE_CELL,
  NON_DESTRUCTIBLE_CELL,
  INITIAL_POWER,
  STEP_POWER,
  INITIAL_SPEED,
  STEP_SPEED,
  MAX_SPEED,
  INITIAL_DELAY,
  STEP_DELAY,
  MIN_DELAY,
  SKINS
}

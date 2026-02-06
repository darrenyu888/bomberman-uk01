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

const SHIELD_DURATION_MS = 1500;
const GHOST_DURATION_MS = 4500;

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
  SHIELD_DURATION_MS,
  GHOST_DURATION_MS,
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

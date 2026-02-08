const {
  SPEED,
  POWER,
  DELAY,
  INITIAL_POWER,
  STEP_POWER,
  INITIAL_SPEED,
  STEP_SPEED,
  MAX_SPEED,
  INITIAL_DELAY,
  STEP_DELAY,
  MIN_DELAY,
  SHIELD,
  REMOTE,
  KICK,
  GHOST,
  DISEASE,
  DISEASE_TYPES,
  SHIELD_DURATION_MS,
  GHOST_DURATION_MS,
  DISEASE_DURATION_MS,
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
} = require('../constants');

class Player {

  constructor({ id, skin, spawn, spawnOnGrid }) {
    this.id          = id;
    this.skin        = skin;
    this.spawn       = spawn;
    this.spawnOnGrid = spawnOnGrid;

    this.isAlive = true;

    this.power = INITIAL_POWER;
    this.speed = INITIAL_SPEED;
    this.delay = INITIAL_DELAY;

    // Powerups
    this.shield_until = 0;
    this.hasRemote = false;
    this.hasKick = false;
    this.ghost_until = 0;
    
    // Disease (Skull)
    this.disease_until = 0;
    this.disease_type = -1; // -1: None

    this.lives = 3; // Lives
    this.maxLives = 5;

    // Bomb capacity
    this.maxBombs = 1;

    // Temporary classic effects
    this.passwall_until = 0;
    this.reverse_until = 0;
    this.slow_until = 0;
    this.confuse_until = 0;

    // Permanent-ish perks
    this.hasBombPass = false;

    // Ammo
    this.mineAmmo = 0;

    // Abilities
    this.hasThrow = false;
    this.magnet_until = 0;

    // last known position (pixels + grid), updated by server on 'update player position'
    this.position = { x: spawn.x, y: spawn.y, col: spawnOnGrid.col, row: spawnOnGrid.row, ts: Date.now() };
  }

  pickSpoil(spoil_type) {
    if (spoil_type === POWER) {
      this.power += STEP_POWER;
      return;
    }

    if (spoil_type === SPEED) {
      if (this.speed < MAX_SPEED) {
        this.speed += STEP_SPEED;
      }
      return;
    }

    if (spoil_type === DELAY) {
      if (this.delay > MIN_DELAY) {
        this.delay -= STEP_DELAY;
      }
      return;
    }

    if (spoil_type === SHIELD) {
      this.shield_until = Date.now() + SHIELD_DURATION_MS;
      return;
    }

    if (spoil_type === REMOTE) {
      this.hasRemote = true;
      return;
    }

    if (spoil_type === KICK) {
      this.hasKick = true;
      return;
    }

    if (spoil_type === GHOST) {
      this.ghost_until = Date.now() + GHOST_DURATION_MS;
      return;
    }

    if (spoil_type === DISEASE) {
      this.disease_until = Date.now() + DISEASE_DURATION_MS;
      // Pick random disease
      const types = Object.values(DISEASE_TYPES);
      this.disease_type = types[Math.floor(Math.random() * types.length)];
      // If reverse disease chosen, also set reverse_until for client-side effect.
      if (this.disease_type === DISEASE_TYPES.REVERSE) {
        this.reverse_until = this.disease_until;
      }
      return;
    }

    if (spoil_type === LIFE) {
      this.lives = Math.min(this.maxLives || 5, (this.lives || 0) + 1);
      return;
    }

    if (spoil_type === PASSWALL) {
      this.passwall_until = Date.now() + 10000; // 10s
      return;
    }

    if (spoil_type === REVERSE) {
      this.reverse_until = Date.now() + 8000; // 8s
      return;
    }

    if (spoil_type === BOMB_UP) {
      this.maxBombs = Math.min(5, (this.maxBombs || 1) + 1);
      return;
    }

    if (spoil_type === BOMB_PASS) {
      this.hasBombPass = true;
      return;
    }

    if (spoil_type === SLOW) {
      this.slow_until = Date.now() + 9000; // 9s
      return;
    }

    if (spoil_type === CONFUSE) {
      this.confuse_until = Date.now() + 8000; // 8s
      return;
    }

    if (spoil_type === MINE) {
      this.mineAmmo = Math.min(5, (this.mineAmmo || 0) + 1);
      return;
    }

    if (spoil_type === THROW) {
      this.hasThrow = true;
      return;
    }

    if (spoil_type === MAGNET) {
      this.magnet_until = Date.now() + 10000; // 10s
      return;
    }
  }

  dead() {
    if (this.lives > 1) {
      this.lives--;
      this.shield_until = Date.now() + 3000; // 3s invulnerability
      return false; // Not dead yet
    }
    this.lives = 0;
    this.isAlive = false;
    return true; // Actually dead
  }

}

exports.Player = Player;

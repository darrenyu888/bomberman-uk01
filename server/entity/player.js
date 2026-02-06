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
  SHIELD_DURATION_MS,
  GHOST_DURATION_MS,
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
  }

  dead() {
    this.isAlive = false;
  }

}

exports.Player = Player;

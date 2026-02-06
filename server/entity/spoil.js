const { SPEED, POWER, DELAY, SHIELD, REMOTE, KICK, GHOST } = require('../constants');

const { v4: uuidv4 } = require('uuid');

class Spoil {

  constructor(row, col) {
    this.id = uuidv4();

    this.row = row;
    this.col = col;

    this.spoil_type = this.spoilType()
  }

  spoilType(){
    // Keep common stat boosts frequent; add rarer powerups.
    const pool = [
      SPEED, POWER, DELAY,
      SPEED, POWER, DELAY,
      SHIELD,
      REMOTE,
      KICK,
      GHOST,
    ];
    return pool[Math.floor(Math.random() * pool.length)]
  }
}

exports.Spoil = Spoil;

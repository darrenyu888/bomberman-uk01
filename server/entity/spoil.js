const { SPEED, POWER, DELAY, SHIELD, REMOTE, KICK, GHOST, DISEASE, LIFE, PASSWALL, REVERSE } = require('../constants');

const { v4: uuidv4 } = require('uuid');

class Spoil {

  constructor(row, col, weights) {
    this.id = uuidv4();

    this.row = row;
    this.col = col;

    this.spoil_type = this.spoilType(weights)
  }

  spoilType(weights){
    if (weights) {
      let total = weights.reduce((sum, item) => sum + item.weight, 0);
      let r = Math.random() * total;
      for (const w of weights) {
        if (r < w.weight) return w.type;
        r -= w.weight;
      }
      return 0; // fallback to speed
    }

    // Default pool (classic-ish; weighted by repetition)
    const pool = [
      SPEED, POWER, DELAY,
      SPEED, POWER, DELAY,
      SHIELD,
      REMOTE,
      KICK,
      GHOST,
      DISEASE,
      LIFE,
      PASSWALL,
      REVERSE,
    ];
    return pool[Math.floor(Math.random() * pool.length)]
  }
}

exports.Spoil = Spoil;

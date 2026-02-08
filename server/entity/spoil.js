const { SPEED, POWER, DELAY, SHIELD, REMOTE, KICK, GHOST, DISEASE, LIFE, PASSWALL, REVERSE } = require('../constants');

const { v4: uuidv4 } = require('uuid');

class Spoil {

  constructor(row, col, weights, game) {
    this.id = uuidv4();

    this.row = row;
    this.col = col;

    this.spoil_type = this.spoilType(weights, game)
  }

  spoilType(weights, game){
    // Rough global curse limiter (prevents curse spam). User requested limit=5.
    const curseLimit = (game && typeof game.curseLimit === 'number') ? game.curseLimit : null;
    const countActiveCurses = () => {
      try {
        if (!game || !game.players) return 0;
        let n = 0;
        const now = Date.now();
        for (const p of Object.values(game.players)) {
          if (!p) continue;
          if (p.reverse_until && now < p.reverse_until) n++;
          if (p.disease_until && now < p.disease_until) n++;
          if (p.slow_until && now < p.slow_until) n++;
          if (p.confuse_until && now < p.confuse_until) n++;
        }
        return n;
      } catch (_) { return 0; }
    };

    if (weights) {
      let total = weights.reduce((sum, item) => sum + item.weight, 0);
      let r = Math.random() * total;
      for (const w of weights) {
        if (r < w.weight) {
          // If we are over the curse limit, avoid spawning additional curse types.
          if (curseLimit != null && countActiveCurses() >= curseLimit) {
            if (w.type === 7 || w.type === 10 || w.type === 13 || w.type === 14) {
              return 0; // fallback to Speed
            }
          }
          return w.type;
        }
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

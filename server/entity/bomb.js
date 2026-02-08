const { EXPLOSION_TIME, DESTRUCTIBLE_CELL, NON_DESTRUCTIBLE_CELL, SPOIL_CHANCE } = require('../constants');

const { Spoil } = require('./spoil.js');

const { v4: uuidv4 } = require('uuid');

class Bomb {

  constructor({ game, col, row, power, owner_id }) {
    this.id = uuidv4();

    this.game = game;
    this.power = power
    this.owner_id = owner_id
    this.explosion_time = EXPLOSION_TIME

    this.col = col
    this.row = row

    this.blastedCells = [];
  }

  detonate() {
    let row   = this.row;
    let col   = this.col;
    let power = this.power;

    this.game.nullifyMapCell(row, col);
    this.addToBlasted(row, col, 'center', false)

    let explosionDirections = [
      { x:  0, y: -1, end: 'up',    plumb: 'vertical'   },
      { x:  1, y:  0, end: 'right', plumb: 'horizontal' },
      { x:  0, y:  1, end: 'down',  plumb: 'vertical'   },
      { x: -1, y:  0, end: 'left',  plumb: 'horizontal' }
    ]

    for (let direction of explosionDirections ) {
      for(let i = 1; i <= power; i++) {
        let currentRow = row + (direction.y * i);
        let currentCol = col + (direction.x * i);

        let cell   = this.game.getMapCell(currentRow, currentCol);
        let isWall = cell == NON_DESTRUCTIBLE_CELL
        let isBalk = cell == DESTRUCTIBLE_CELL
        let isLast = (i == power);

        if (cell == DESTRUCTIBLE_CELL) {
          this.game.nullifyMapCell(currentRow, currentCol);
        }

        if (isBalk || isWall || isLast) {
          this.addToBlasted(currentRow, currentCol, direction.end, isBalk)

          break;
        }

        this.addToBlasted(currentRow, currentCol, direction.plumb, isBalk)
      }
    }

    return this.blastedCells;
  }

  addToBlasted(row, col, direction, destroyed) {
    let spoil = this.craftSpoil(row, col);

    this.blastedCells.push({
      row: row,
      col: col,
      type: 'explosion_'+direction,
      destroyed: destroyed,
      spoil: spoil
    })
  }

  craftSpoil(row, col) {
    var randomNumber = Math.floor(Math.random() * 100)

    if (randomNumber < SPOIL_CHANCE) {
      let spoil = new Spoil(row, col, this.game.spoilWeights)
      this.game.addSpoil(spoil)
      return spoil
    }

    return null;
  }
}

exports.Bomb = Bomb;

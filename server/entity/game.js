const { TILE_SIZE, EMPTY_CELL, DESTRUCTIBLE_CELL, NON_DESTRUCTIBLE_CELL, SKINS } = require('../constants');

var { Player } = require('./player');
var { Bomb } = require('./bomb.js');

const { v4: uuidv4 } = require('uuid');
const { faker } = require('@faker-js/faker');

class Game {

  constructor({ map_name, mode }) {
    this.id           = uuidv4();
    // @faker-js/faker v8+: commerce.color() removed; use color.human()
    this.name         = faker.color.human()
    this.map_name     = map_name;
    this.mode         = (mode || 'classic').toString().toLowerCase() === 'horde' ? 'horde' : 'classic';

    // Match stats (server-authoritative)
    this.startedAt     = null;
    this.endedAt       = null;
    this.stats         = {
      teamKills: 0,
      perPlayerKills: {}, // playerId -> number
      perPlayerSurvivalMs: {}, // playerId -> ms
    };

    this.layer_info   = require('../../client/maps/' + this.map_name + '.json').layers[0]
    this.max_players  = this.layer_info.properties.max_players

    // NOTE: we can`t use new Map - because Socket.io do not support such format
    this.players     = {}

    // NOTE: Copy objct - not reference
    this.playerSkins = SKINS.slice()

    // NOTE: Copy objct - not reference
    this.playerSpawns = this.layer_info.properties.spawns.slice()

    this.shadow_map   = this.createMapData();
    this.spoils       = new Map();
    this.bombs        = new Map();

    // Spoil generation weights
    this.spoilWeights = [
      { type: 0, weight: 28 }, // Speed
      { type: 1, weight: 30 }, // Power
      { type: 2, weight: 12 }, // Delay
      { type: 3, weight: 5 },  // Shield
      { type: 4, weight: 5 },  // Remote
      { type: 5, weight: 6 },  // Kick
      { type: 6, weight: 3 },  // Ghost
      { type: 7, weight: 8 },  // Disease (Skull)
      { type: 8, weight: 2 },  // Life
      { type: 9, weight: 4 },  // PassWall
      { type: 10, weight: 4 }, // Reverse
      { type: 11, weight: 8 }, // BombUp
      { type: 12, weight: 6 }, // BombPass
      { type: 13, weight: 6 }, // Slow
      { type: 14, weight: 6 }, // Confuse
      { type: 15, weight: 6 }, // Mine
      { type: 16, weight: 5 }, // Throw
      { type: 17, weight: 5 }, // Magnet
    ];

    // Limit active curse effects globally (rough safety valve)
    this.curseLimit = 5;
  }

  addPlayer(id) {
    let skin = this.getAndRemoveSkin()
    let [spawn, spawnOnGrid] = this.getAndRemoveSpawn()

    let player = new Player({ id: id, skin: skin, spawn: spawn, spawnOnGrid: spawnOnGrid })
    this.players[player.id] = player
  }

  removePlayer(id) {
    let player = this.players[id];

    this.playerSkins.push(player.skin)
    this.playerSpawns.push(player.spawnOnGrid)

    delete this.players[id];
  }

  isEmpty() {
    return Object.keys(this.players).length === 0
  }

  isFull() {
    return Object.keys(this.players).length === this.max_players
  }

  getAndRemoveSkin() {
    // NOTE: we can user here simple .pop()
    let index = Math.floor(Math.random() * this.playerSkins.length);
    let randomSkin = this.playerSkins[index];
    this.playerSkins.splice(index, 1);

    return randomSkin;
  }

  getAndRemoveSpawn() {
    let index = Math.floor(Math.random() * this.playerSpawns.length);
    let spawnOnGrid = this.playerSpawns[index];
    this.playerSpawns.splice(index, 1);

    let spawn = { x: spawnOnGrid.col * TILE_SIZE, y: spawnOnGrid.row * TILE_SIZE };
    return [spawn, spawnOnGrid];
  }

  createMapData() {
    let tiles  = this.layer_info.data
    let width  = this.layer_info.width
    let height = this.layer_info.height
    let empty  = this.layer_info.properties.empty
    let wall   = this.layer_info.properties.wall
    let balk   = this.layer_info.properties.balk

    let mapMatrix = [];
    let i = 0;

    for(let row = 0; row < height; row++) {
      mapMatrix.push([]);

      for(let col = 0; col < width; col++) {
        mapMatrix[row][col] = EMPTY_CELL;

        if(tiles[i] == balk) {
          mapMatrix[row][col] = DESTRUCTIBLE_CELL;
        } else if(tiles[i] == wall) {
          mapMatrix[row][col] = NON_DESTRUCTIBLE_CELL;
        }

        i++;
      }
    }

    return mapMatrix;
  }

  addBomb({ col, row, power, owner_id, kind, passable }) {
    // disallow stacking bombs
    for (const b of this.bombs.values()) {
      if (b && b.col === col && b.row === row) return false;
    }

    // only allow bombs on empty cells
    if (this.getMapCell(row, col) !== EMPTY_CELL) return false;

    let bomb = new Bomb({ game: this, col: col, row: row, power: power, owner_id, kind, passable });
    if ( this.bombs.get(bomb.id) ) {
      return false
    }
    this.bombs.set(bomb.id, bomb);
    return bomb
  }

  deleteBomb(bomb_id) {
    this.bombs.delete(bomb_id);
  }

  findBomb(bomb_id) {
    return this.bombs.get(bomb_id);
  }

  findBombAt(row, col) {
    for (const b of this.bombs.values()) {
      if (b && b.row === row && b.col === col) return b;
    }
    return null;
  }

  getMapCell(row, col) {
    return this.shadow_map[row][col]
  }

  nullifyMapCell(row, col) {
    this.shadow_map[row][col] = EMPTY_CELL
  }

  findSpoil(spoil_id){
    return this.spoils.get(spoil_id)
  }

  addSpoil(spoil) {
    this.spoils.set(spoil.id, spoil);
  }

  deleteSpoil(spoil_id){
    this.spoils.delete(spoil_id)
  }
}

exports.Game = Game;

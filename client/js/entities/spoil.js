import { SPEED, POWER, DELAY, SHIELD, REMOTE, KICK, GHOST, TILE_SIZE } from '../utils/constants';

export default class Spoil extends Phaser.Sprite {

  constructor(game, spoil) {

    // UK01: spoil_tileset now contains 7 frames (0..6) matching constants
    let frame = 0;
    if (spoil.spoil_type === SPEED) frame = 0;
    if (spoil.spoil_type === POWER) frame = 1;
    if (spoil.spoil_type === DELAY) frame = 2;
    if (spoil.spoil_type === SHIELD) frame = 3;
    if (spoil.spoil_type === REMOTE) frame = 4;
    if (spoil.spoil_type === KICK) frame = 5;
    if (spoil.spoil_type === GHOST) frame = 6;

    super(game, (spoil.col * TILE_SIZE), (spoil.row * TILE_SIZE), 'spoil_tileset', frame);

    this.id = spoil.id

    this.game.physics.arcade.enable(this);
  }

}

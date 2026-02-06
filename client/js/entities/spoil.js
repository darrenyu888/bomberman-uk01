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

    // Light glow/pulse to make spoils more visible (mobile-friendly)
    this.alpha = 0.92;
    this.scale.setTo(1.0);
    try {
      const t1 = this.game.add.tween(this).to({ alpha: 0.62 }, 420, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);
      const t2 = this.game.add.tween(this.scale).to({ x: 1.08, y: 1.08 }, 520, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);
      // keep refs to avoid GC issues in some Phaser builds
      this._glowTween = t1;
      this._scaleTween = t2;
    } catch (_) {}
  }

}

import { TILE_SIZE, EXPLOSION_TIME } from '../utils/constants';

export default class Bomb extends Phaser.Sprite {

  constructor(game, id, col, row, meta = {}) {
    let centerCol = (col * TILE_SIZE) + TILE_SIZE / 2
    let centerRow = (row * TILE_SIZE) + TILE_SIZE / 2

    super(game, centerCol, centerRow, 'bomb_tileset');

    // Visual variants by kind (no extra spritesheet needed)
    this.kind = (meta && meta.kind) ? meta.kind : 'normal';
    if (this.kind === 'sky') {
      // Sudden death sky bomb: more aggressive color
      this.tint = 0xff5544;
    } else if (this.kind === 'remote') {
      // Remote-enabled player: blue-ish bomb
      this.tint = 0x66ccff;
    }

    // Optional label overlay (lightweight, helps differentiate)
    try {
      if (this.kind === 'remote') {
        const t = this.game.add.text(0, 0, 'R', { font: '14px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
        t.anchor.setTo(0.5);
        t.x = 0;
        t.y = -2;
        this.addChild(t);
      }
      if (this.kind === 'sky') {
        const t = this.game.add.text(0, 0, '!', { font: '16px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
        t.anchor.setTo(0.5);
        t.x = 0;
        t.y = -2;
        this.addChild(t);
      }
    } catch (_) {}
    this.scale.setTo(0.7);
    this.anchor.setTo(0.5);

    this.game = game
    this.id = id;

    this.game.physics.arcade.enable(this);

    this.game.add.tween(this.scale).to({ x: 1.2, y: 1.2 }, EXPLOSION_TIME, Phaser.Easing.Linear.None, true);

    this.body.immovable = true;
    // TODO: https://phaser.io/docs/2.4.4/Phaser.AnimationManager.html#add
    this.animations.add('bomb', [0,1,2,3,4,5,6,7,8,9,10,11,12,13], 6, true);
    this.animations.play('bomb');
  }

  update() {
    // this.game.debug.body(this);
  }

}

import { TILE_SIZE, EXPLOSION_TIME } from '../utils/constants';

export default class Bomb extends Phaser.Sprite {

  constructor(game, id, col, row, meta = {}) {
    let centerCol = (col * TILE_SIZE) + TILE_SIZE / 2
    let centerRow = (row * TILE_SIZE) + TILE_SIZE / 2

    super(game, centerCol, centerRow, 'bomb_tileset');

    // Visual variants by kind (no extra spritesheet needed)
    this.kind = (meta && meta.kind) ? meta.kind : 'normal';
    if (meta && meta.mine) this.kind = 'mine';
    this.power = (meta && typeof meta.power === 'number') ? meta.power : null;

    // Base tint
    if (this.kind === 'sky') {
      this.tint = 0xff5544;
    } else if (this.kind === 'remote') {
      this.tint = 0x66ccff;
    } else if (this.kind === 'disease') {
      this.tint = 0x55ff55;
    } else if (this.kind === 'mine') {
      this.tint = 0xffaa55;
    }

    // High-power bombs: slightly larger + faster pulse
    try {
      const p = (this.power == null) ? 1 : this.power;
      if (p >= 4) {
        this.scale.setTo(0.85);
        this._big = true;
      }
    } catch (_) {}

    // Optional label overlay (lightweight, helps differentiate)
    try {
      const mk = (txt, style) => {
        const t = this.game.add.text(0, 0, txt, style);
        t.anchor.setTo(0.5);
        t.x = 0;
        t.y = -2;
        this.addChild(t);
        return t;
      };

      if (this.kind === 'remote') mk('R', { font: '14px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
      if (this.kind === 'sky') mk('!', { font: '16px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
      if (this.kind === 'disease') mk('☠', { font: '14px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
      if (this.kind === 'mine') mk('M', { font: '14px Arial', fill: '#000000', stroke: '#ffffff', strokeThickness: 3 });
      if (this.kind === 'throw') {
        this.tint = 0xb36bff;
        mk('T', { font: '14px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
      }

      if (this._big) mk('P', { font: '12px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    } catch (_) {}

    // Kicked arrow overlay
    this._kickedArrow = null;
    this.setKicked = (dir) => {
      try {
        if (this._kickedArrow) { this._kickedArrow.destroy(); this._kickedArrow = null; }
        const map = { left: '←', right: '→', up: '↑', down: '↓' };
        const arrow = map[dir] || '→';
        const t = this.game.add.text(0, 0, arrow, { font: '18px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
        t.anchor.setTo(0.5);
        t.x = 0;
        t.y = 14;
        this.addChild(t);
        this._kickedArrow = t;
        // auto-hide
        this.game.time.events.add(900, () => {
          try { if (this._kickedArrow) { this._kickedArrow.destroy(); this._kickedArrow = null; } } catch (_) {}
        });
      } catch (_) {}
    };

    // If bomb was already kicked at spawn
    try {
      if (meta && meta.kicked && meta.dir) this.setKicked(meta.dir);
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

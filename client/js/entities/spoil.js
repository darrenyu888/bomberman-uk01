import { SPOIL_SPEED, SPOIL_POWER, SPOIL_DELAY, SPOIL_SHIELD, SPOIL_REMOTE, SPOIL_KICK, SPOIL_GHOST, SPOIL_DISEASE, SPOIL_LIFE, SPOIL_PASSWALL, SPOIL_REVERSE, SPOIL_BOMB_UP, SPOIL_BOMB_PASS, SPOIL_SLOW, SPOIL_CONFUSE, SPOIL_MINE, TILE_SIZE } from '../utils/constants';

export default class Spoil extends Phaser.Sprite {

  constructor(game, spoil) {

    // UK01: spoil_tileset now contains 7 frames (0..6) matching constants
    let frame = 0;
    if (spoil.spoil_type === SPOIL_SPEED) frame = 0;
    if (spoil.spoil_type === SPOIL_POWER) frame = 1;
    if (spoil.spoil_type === SPOIL_DELAY) frame = 2;
    if (spoil.spoil_type === SPOIL_SHIELD) frame = 3;
    if (spoil.spoil_type === SPOIL_REMOTE) frame = 4;
    if (spoil.spoil_type === SPOIL_KICK) frame = 5;
    if (spoil.spoil_type === SPOIL_GHOST) frame = 6;
    
    // For types beyond frame range, reuse an existing frame + overlay a small icon/text.
    if (spoil.spoil_type === SPOIL_DISEASE) frame = 2;
    if (spoil.spoil_type === SPOIL_LIFE) frame = 1;
    if (spoil.spoil_type === SPOIL_PASSWALL) frame = 3;
    if (spoil.spoil_type === SPOIL_REVERSE) frame = 2;
    if (spoil.spoil_type === SPOIL_BOMB_UP) frame = 1;
    if (spoil.spoil_type === SPOIL_BOMB_PASS) frame = 4;
    if (spoil.spoil_type === SPOIL_SLOW) frame = 0;
    if (spoil.spoil_type === SPOIL_CONFUSE) frame = 2;
    if (spoil.spoil_type === SPOIL_MINE) frame = 5;

    super(game, (spoil.col * TILE_SIZE), (spoil.row * TILE_SIZE), 'spoil_tileset', frame);

    if (spoil.spoil_type === SPOIL_DISEASE) {
       this.tint = 0x55ff00; // Toxic Green tint for Disease
       try {
         const skull = this.game.add.sprite(0, 0, 'disease_icon');
         skull.width = 35; skull.height = 35;
         skull.anchor.setTo(0,0);
         this.addChild(skull);
       } catch(_) {}
    }

    // LIFE: simple +1 overlay
    if (spoil.spoil_type === SPOIL_LIFE) {
      this.tint = 0xff6bd6;
      try {
        const t = this.game.add.text(6, 4, '+1', { font: '16px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
        this.addChild(t);
      } catch (_) {}
    }

    // PASSWALL: show "PW" label
    if (spoil.spoil_type === SPOIL_PASSWALL) {
      this.tint = 0x00e5ff;
      try {
        const t = this.game.add.text(3, 6, 'PW', { font: '14px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
        this.addChild(t);
      } catch (_) {}
    }

    // REVERSE: show "R" label
    if (spoil.spoil_type === SPOIL_REVERSE) {
      this.tint = 0xffbb00;
      try {
        const t = this.game.add.text(10, 6, 'R', { font: '16px Arial', fill: '#000000', stroke: '#ffffff', strokeThickness: 3 });
        this.addChild(t);
      } catch (_) {}
    }

    // BOMB_UP: show "+B"
    if (spoil.spoil_type === SPOIL_BOMB_UP) {
      this.tint = 0xff6bd6;
      try {
        const t = this.game.add.text(2, 6, '+B', { font: '14px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
        this.addChild(t);
      } catch (_) {}
    }

    // BOMB_PASS: show "BP"
    if (spoil.spoil_type === SPOIL_BOMB_PASS) {
      this.tint = 0x66ccff;
      try {
        const t = this.game.add.text(2, 6, 'BP', { font: '14px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
        this.addChild(t);
      } catch (_) {}
    }

    // SLOW: show "S"
    if (spoil.spoil_type === SPOIL_SLOW) {
      this.tint = 0x6aa3ff;
      try {
        const t = this.game.add.text(10, 6, 'S', { font: '16px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
        this.addChild(t);
      } catch (_) {}
    }

    // CONFUSE: show "?"
    if (spoil.spoil_type === SPOIL_CONFUSE) {
      this.tint = 0xffffff;
      try {
        const t = this.game.add.text(10, 6, '?', { font: '16px Arial', fill: '#000000', stroke: '#ffffff', strokeThickness: 3 });
        this.addChild(t);
      } catch (_) {}
    }

    // MINE: show "M"
    if (spoil.spoil_type === SPOIL_MINE) {
      this.tint = 0xffaa55;
      try {
        const t = this.game.add.text(8, 6, 'M', { font: '16px Arial', fill: '#000000', stroke: '#ffffff', strokeThickness: 3 });
        this.addChild(t);
      } catch (_) {}
    }

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

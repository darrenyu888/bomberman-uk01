import { SPOIL_SPEED, SPOIL_POWER, SPOIL_DELAY, SPOIL_SHIELD, SPOIL_REMOTE, SPOIL_KICK, SPOIL_GHOST, SPOIL_DISEASE, TILE_SIZE } from '../utils/constants';

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
    
    // For Disease (7), we don't have frame 7 in tileset yet. 
    // Overlay the SVG icon or assume spritesheet updated.
    // For now, reuse frame 2 (Delay) but tint it Green/Purple.
    if (spoil.spoil_type === 7) { // SPOIL_DISEASE
       frame = 2; 
    }

    super(game, (spoil.col * TILE_SIZE), (spoil.row * TILE_SIZE), 'spoil_tileset', frame);

    if (spoil.spoil_type === 7) {
       this.tint = 0x55ff00; // Toxic Green tint for Disease
       // Optional: Add skull icon overlay
       try {
         const skull = this.game.add.sprite(0, 0, 'disease_icon');
         skull.width = 35; skull.height = 35;
         skull.anchor.setTo(0,0);
         this.addChild(skull);
       } catch(_) {}
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

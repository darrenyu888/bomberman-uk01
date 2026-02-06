import { TILE_SIZE, PING } from '../utils/constants';
import { Text } from '../helpers/elements';

export default class EnemyPlayer extends Phaser.Sprite {

  constructor({ game, id, spawn, skin, displayName, avatarParts }) {
    super(game, spawn.x, spawn.y, 'bomberman_' + skin);

    this.game = game
    this.id = id;

    this.currentPosition = spawn;
    this.lastMoveAt = 0;

    this.game.physics.arcade.enable(this);
    this.body.setSize(20, 20, 6, 6);
    this.body.immovable = true;

    this.animations.add('up', [9, 10, 11], 15, true);
    this.animations.add('down', [0, 1, 2], 15, true);
    this.animations.add('right', [6, 7, 8], 15, true);
    this.animations.add('left', [3, 4, 5], 15, true);

    this.defineSelf(displayName || skin)

    // cosmetics for enemies too
    this.applyAvatarParts(avatarParts || null);
  }

  update () {
    // this.game.debug.body(this);
  }

  goTo(newPosition) {
    this.lastMoveAt = this.game.time.now;

    this.animateFace(newPosition);

    this.game.add.tween(this).to(newPosition, PING, Phaser.Easing.Linear.None, true);
  }

  animateFace(newPosition) {
    let face = 'down';
    let diffX = newPosition.x - this.currentPosition.x;
    let diffY = newPosition.y - this.currentPosition.y;

    if (diffX < 0) {
      face = 'left'
    } else if (diffX > 0) {
      face = 'right'
    } else if (diffY < 0) {
      face = 'up'
    } else if (diffY > 0) {
      face = 'down'
    }

    this.animations.play(face)
    this.currentPosition = newPosition;
  }

  applyAvatarParts(parts) {
    try {
      if (this._cosmetics) {
        for (const s of this._cosmetics) { try { s.destroy(); } catch (_) {} }
      }
      this._cosmetics = [];
      if (!parts) return;

      const add = (key, x, y, alpha=1) => {
        if (!key) return;
        const spr = this.game.add.sprite(x, y, key);
        spr.anchor.setTo(0.5);
        spr.scale.setTo(0.25);
        spr.alpha = alpha;
        this.addChild(spr);
        this._cosmetics.push(spr);
      };

      add('cosmetic_base', 16, 16, 1);

      const hair = parts.hair ? ('cosmetic_' + parts.hair) : null;
      const outfit = parts.outfit ? ('cosmetic_' + parts.outfit) : null;
      const hat = parts.hat ? ('cosmetic_' + parts.hat) : null;
      const face = parts.face ? ('cosmetic_' + parts.face) : null;
      const pattern = parts.pattern ? ('cosmetic_' + parts.pattern) : null;

      try { this.loadTexture('cosmetic_transparent'); } catch (_) {}

      add(outfit, 16, 16, 0.98);
      add(pattern,16, 16, 0.99);
      add(face,   16, 16, 0.995);
      add(hair,   16, 16, 0.999);
      add(hat,    16, 16, 0.999);
    } catch (_) {}
  }

  defineSelf(name) {
    let playerText = new Text({
      game: this.game,
      x: TILE_SIZE / 2,
      y: -10,
      text: name,
      style: {
        font: '14px Areal',
        fill: '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 3
      }
    })

    this.addChild(playerText);
  }
}

import {
  PING, TILE_SIZE, MAX_SPEED, STEP_SPEED, INITIAL_SPEED, SPEED, POWER, DELAY,
  MIN_DELAY, STEP_DELAY, INITIAL_DELAY, INITIAL_POWER, STEP_POWER,
  SHIELD, REMOTE, KICK, GHOST, SHIELD_DURATION_MS, GHOST_DURATION_MS
} from '../utils/constants';

import Info from './info';
import { SpoilNotification, Text } from '../helpers/elements';

export default class Player extends Phaser.Sprite {

  constructor({ game, id, spawn, skin, displayName, avatarParts }) {
    super(game, spawn.x, spawn.y, 'bomberman_' + skin);

    this.game = game;
    this.id = id;

    this.prevPosition = { x: spawn.x, y: spawn.y };

    this.delay = INITIAL_DELAY;
    this.power = INITIAL_POWER;
    this.speed = INITIAL_SPEED;
    this.tileSpeedMultiplier = 1.0;
    this._lastBombTime = 0;

    // powerups
    this.shieldUntil = 0;
    this.ghostUntil = 0;
    this.hasRemote = false;
    this.hasKick = false;

    this.game.add.existing(this);
    this.game.physics.arcade.enable(this);
    this.body.setSize(20, 20, 6, 6);

    // Touch controls state (set by Play state UI)
    this.touchLeft = false;
    this.touchRight = false;
    this.touchUp = false;
    this.touchDown = false;
    this.touchBomb = false;

    game.time.events.loop(PING , this.positionUpdaterLoop.bind(this));

    this.animations.add('up', [9, 10, 11], 15, true);
    this.animations.add('down', [0, 1, 2], 15, true);
    this.animations.add('right', [6, 7, 8], 15, true);
    this.animations.add('left', [3, 4, 5], 15, true);

    this.info = new Info({ game: this.game, player: this });

    this.defineKeyboard()
    this.defineSelf(displayName || skin)

    // Paper-doll cosmetics (hair/outfit/hat): simple layered images above base sprite
    this.avatarParts = avatarParts || null;
    this.applyAvatarParts(this.avatarParts);
  }

  update() {
    if (this.alive) {
      this.handleMoves()
      this.handleBombs()
    }

    this.animateCosmetics();

    // this.game.debug.body(this);
    // this.game.debug.spriteInfo(this, 32, 32);
  }

  defineKeyboard() {
    // Arrow keys
    this.upKey    = this.game.input.keyboard.addKey(Phaser.Keyboard.UP)
    this.downKey  = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN)
    this.leftKey  = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT)
    this.rightKey = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT)

    // WASD
    this.wKey = this.game.input.keyboard.addKey(Phaser.Keyboard.W)
    this.aKey = this.game.input.keyboard.addKey(Phaser.Keyboard.A)
    this.sKey = this.game.input.keyboard.addKey(Phaser.Keyboard.S)
    this.dKey = this.game.input.keyboard.addKey(Phaser.Keyboard.D)

    // Bomb
    this.spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)
  }

  handleMoves() {
    this.body.velocity.set(0);
    let animationsArray = []

    const effectiveSpeed = this.speed * (this.tileSpeedMultiplier || 1.0);

    const left  = this.leftKey.isDown  || (this.aKey && this.aKey.isDown) || this.touchLeft;
    const right = this.rightKey.isDown || (this.dKey && this.dKey.isDown) || this.touchRight;
    const up    = this.upKey.isDown    || (this.wKey && this.wKey.isDown) || this.touchUp;
    const down  = this.downKey.isDown  || (this.sKey && this.sKey.isDown) || this.touchDown;

    if (left){
      this.body.velocity.x = -effectiveSpeed;
      animationsArray.push('left')
    } else if (right) {
      this.body.velocity.x = effectiveSpeed;
      animationsArray.push('right')
    }

    if (up) {
      this.body.velocity.y = -effectiveSpeed;
      animationsArray.push('up')
    } else if (down) {
      this.body.velocity.y = effectiveSpeed;
      animationsArray.push('down')
    }

    let currentAnimation = animationsArray[0]
    if (currentAnimation){
      this.animations.play(currentAnimation)
      return
    }

    this.animations.stop();
  }

  handleBombs() {
    const bombDown = this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) || this.touchBomb;

    if (bombDown) {
      let now = this.game.time.now;

      if (now > this._lastBombTime) {
        this._lastBombTime = now + this.delay;

        clientSocket.emit('create bomb', { col: this.currentCol(), row: this.currentRow() });
      }
    }
  }

  currentCol() {
    return Math.floor(this.body.position.x / TILE_SIZE)
  }

  currentRow() {
    return Math.floor(this.body.position.y / TILE_SIZE)
  }

  positionUpdaterLoop() {
    let newPosition = { x: this.position.x, y: this.position.y }

    if (this.prevPosition.x !== newPosition.x || this.prevPosition.y !== newPosition.y) {
      clientSocket.emit('update player position', newPosition);
      this.prevPosition = newPosition;
    }
  }

  becomesDead() {
    this.info.showDeadInfo()
    this.kill();
  }

  pickSpoil( spoil_type ){
    if ( spoil_type === SPEED ){ this.increaseSpeed() }
    if ( spoil_type === POWER ){ this.increasePower() }
    if ( spoil_type === DELAY ){ this.increaseDelay() }
    if ( spoil_type === SHIELD ){ this.activateShield() }
    if ( spoil_type === REMOTE ){ this.enableRemote() }
    if ( spoil_type === KICK ){ this.enableKick() }
    if ( spoil_type === GHOST ){ this.activateGhost() }
  }

  isShielded() {
    return this.shieldUntil && this.game.time.now < this.shieldUntil;
  }

  isGhosted() {
    return this.ghostUntil && this.game.time.now < this.ghostUntil;
  }

  increaseSpeed(){
    let asset = 'speed_up_no_bonus'

    if (this.speed < MAX_SPEED) {
      this.speed = this.speed + STEP_SPEED;
      this.info.refreshStatistic();
      asset = 'speed_up_bonus'
    }

    new SpoilNotification({ game: this.game, asset: asset, x: this.position.x, y: this.position.y })
  }

  increaseDelay(){
    let asset = 'delay_up_no_bonus'

    if (this.delay > MIN_DELAY){
      this.delay -= STEP_DELAY;
      this.info.refreshStatistic();
      asset = 'delay_up_bonus'
    }

    new SpoilNotification({ game: this.game, asset: asset, x: this.position.x, y: this.position.y })
  }

  increasePower(){
    let asset = 'power_up_bonus'

    this.power += STEP_POWER;
    this.info.refreshStatistic();

    new SpoilNotification({ game: this.game, asset: asset, x: this.position.x, y: this.position.y })
  }

  activateShield() {
    this.shieldUntil = this.game.time.now + SHIELD_DURATION_MS;

    // Simple visual: flash tint while shielded
    this.tint = 0x66ccff;
    this.game.time.events.add(SHIELD_DURATION_MS, () => {
      // If ghost is active, keep ghost visual
      if (this.isGhosted && this.isGhosted()) {
        this.tint = 0xa7f7ff;
        this.alpha = 0.65;
      } else {
        this.tint = 0xffffff;
      }
    });

    new SpoilNotification({ game: this.game, asset: 'placeholder_time', x: this.position.x, y: this.position.y })
  }

  enableRemote() {
    this.hasRemote = true;
    new SpoilNotification({ game: this.game, asset: 'placeholder_power', x: this.position.x, y: this.position.y })
  }

  enableKick() {
    this.hasKick = true;
    new SpoilNotification({ game: this.game, asset: 'placeholder_speed', x: this.position.x, y: this.position.y })
  }

  applyAvatarParts(parts) {
    try {
      // clear old
      if (this._cosmetics) {
        for (const s of this._cosmetics) {
          try { s.destroy(); } catch (_) {}
        }
      }
      this._cosmetics = [];

      if (!parts) return;
      const add = (key, x, y, alpha=1) => {
        if (!key) return;
        const spr = this.game.add.sprite(x, y, key);
        spr.anchor.setTo(0.5);
        // cosmetics assets are 128x128 but we display them slightly larger than 32x32
        spr.scale.setTo(0.34);
        spr.alpha = alpha;
        spr._baseY = y;
        this.addChild(spr);
        this._cosmetics.push(spr);
      };

      // Base (cute original)
      add('cosmetic_base', 16, 16, 1);

      // Preloaded as images: cosmetic_hair_X, cosmetic_outfit_X, cosmetic_hat_X
      const hair = parts.hair ? ('cosmetic_' + parts.hair) : null;
      const outfit = parts.outfit ? ('cosmetic_' + parts.outfit) : null;
      const hat = parts.hat ? ('cosmetic_' + parts.hat) : null;
      const face = parts.face ? ('cosmetic_' + parts.face) : null;
      const pattern = parts.pattern ? ('cosmetic_' + parts.pattern) : null;

      // Hide legacy bomberman sprite underneath (keep physics/body) without affecting children.
      try { this.loadTexture('cosmetic_transparent'); } catch (_) {}

      // tuned offsets so accessories don't cover the face by default
      add(outfit, 16, 22, 0.98);
      add(pattern,16, 22, 0.99);
      add(face,   16, 14, 0.995);
      add(hair,   16, 12, 0.999);
      add(hat,    16, 6,  0.999);
    } catch (_) {}
  }

  animateCosmetics() {
    try {
      if (!this._cosmetics || !this._cosmetics.length) return;

      const moving = Math.abs(this.body.velocity.x) > 1 || Math.abs(this.body.velocity.y) > 1;
      if (!this._cosBobT) this._cosBobT = 0;

      if (moving) {
        this._cosBobT += (this.game.time.elapsedMS || 16);
      } else {
        // decay to rest
        this._cosBobT = 0;
      }

      const bob = moving ? Math.sin(this._cosBobT / 90.0) * 1.6 : 0;

      for (const s of this._cosmetics) {
        if (!s) continue;
        const by = (typeof s._baseY === 'number') ? s._baseY : s.y;
        s.y = by + bob;
      }
    } catch (_) {}
  }

  activateGhost() {
    this.ghostUntil = this.game.time.now + GHOST_DURATION_MS;

    // Visual: semi-transparent + cool tint
    this.alpha = 0.65;
    this.tint = 0xa7f7ff;

    // HUD indicator + countdown
    if (this.info && this.info.showGhost) {
      this.info.showGhost(this.ghostUntil);
    }

    // Clear visual at end (unless shield overwrote tint, reset to white)
    this.game.time.events.add(GHOST_DURATION_MS, () => {
      this.alpha = 1;
      // if shield is still on, keep its tint
      if (!(this.isShielded && this.isShielded())) {
        this.tint = 0xffffff;
      }
      if (this.info && this.info.hideGhost) {
        this.info.hideGhost();
      }
    });

    new SpoilNotification({ game: this.game, asset: 'ghost_icon', x: this.position.x, y: this.position.y })
  }

  defineSelf(name) {
    let playerText = new Text({
      game: this.game,
      x: TILE_SIZE / 2,
      y: -10,
      text: `\u272E ${name} \u272E`,
      style: {
        font: '15px Areal',
        fill: '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 3
      }
    })

    this.addChild(playerText);
  }
}

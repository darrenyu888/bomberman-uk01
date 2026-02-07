/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./client/js/entities/bomb.js"
/*!************************************!*\
  !*** ./client/js/entities/bomb.js ***!
  \************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Bomb)
/* harmony export */ });
/* harmony import */ var _utils_constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/constants */ "./client/js/utils/constants.js");

class Bomb extends Phaser.Sprite {
  constructor(game, id, col, row) {
    let centerCol = col * _utils_constants__WEBPACK_IMPORTED_MODULE_0__.TILE_SIZE + _utils_constants__WEBPACK_IMPORTED_MODULE_0__.TILE_SIZE / 2;
    let centerRow = row * _utils_constants__WEBPACK_IMPORTED_MODULE_0__.TILE_SIZE + _utils_constants__WEBPACK_IMPORTED_MODULE_0__.TILE_SIZE / 2;
    super(game, centerCol, centerRow, 'bomb_tileset');
    this.scale.setTo(0.7);
    this.anchor.setTo(0.5);
    this.game = game;
    this.id = id;
    this.game.physics.arcade.enable(this);
    this.game.add.tween(this.scale).to({
      x: 1.2,
      y: 1.2
    }, _utils_constants__WEBPACK_IMPORTED_MODULE_0__.EXPLOSION_TIME, Phaser.Easing.Linear.None, true);
    this.body.immovable = true;
    // TODO: https://phaser.io/docs/2.4.4/Phaser.AnimationManager.html#add
    this.animations.add('bomb', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], 6, true);
    this.animations.play('bomb');
  }
  update() {
    // this.game.debug.body(this);
  }
}

/***/ },

/***/ "./client/js/entities/bone.js"
/*!************************************!*\
  !*** ./client/js/entities/bone.js ***!
  \************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Bone)
/* harmony export */ });
/* harmony import */ var _utils_constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/constants */ "./client/js/utils/constants.js");

class Bone extends Phaser.Sprite {
  constructor(game, col, row) {
    super(game, col * _utils_constants__WEBPACK_IMPORTED_MODULE_0__.TILE_SIZE, row * _utils_constants__WEBPACK_IMPORTED_MODULE_0__.TILE_SIZE, 'bone_tileset');
  }
}

/***/ },

/***/ "./client/js/entities/enemy_player.js"
/*!********************************************!*\
  !*** ./client/js/entities/enemy_player.js ***!
  \********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ EnemyPlayer)
/* harmony export */ });
/* harmony import */ var _utils_constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/constants */ "./client/js/utils/constants.js");
/* harmony import */ var _helpers_elements__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../helpers/elements */ "./client/js/helpers/elements.js");


class EnemyPlayer extends Phaser.Sprite {
  constructor({
    game,
    id,
    spawn,
    skin,
    displayName,
    avatarParts
  }) {
    super(game, spawn.x, spawn.y, 'bomberman_' + skin);
    this.game = game;
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
    this.defineSelf(displayName || skin);

    // cosmetics for enemies too
    this.applyAvatarParts(avatarParts || null);
  }
  update() {
    this.animateCosmetics();
    // this.game.debug.body(this);
  }
  goTo(newPosition) {
    this.lastMoveAt = this.game.time.now;
    this._movingUntil = this.game.time.now + _utils_constants__WEBPACK_IMPORTED_MODULE_0__.PING;
    this.animateFace(newPosition);
    this.game.add.tween(this).to(newPosition, _utils_constants__WEBPACK_IMPORTED_MODULE_0__.PING, Phaser.Easing.Linear.None, true);
  }
  animateFace(newPosition) {
    let face = 'down';
    let diffX = newPosition.x - this.currentPosition.x;
    let diffY = newPosition.y - this.currentPosition.y;
    if (diffX < 0) {
      face = 'left';
    } else if (diffX > 0) {
      face = 'right';
    } else if (diffY < 0) {
      face = 'up';
    } else if (diffY > 0) {
      face = 'down';
    }
    this.animations.play(face);
    this.currentPosition = newPosition;
  }
  applyAvatarParts(parts) {
    try {
      if (this._cosmetics) {
        for (const s of this._cosmetics) {
          try {
            s.destroy();
          } catch (_) {}
        }
      }
      this._cosmetics = [];
      if (!parts) return;
      const add = (key, x, y, alpha = 1) => {
        if (!key) return;
        const spr = this.game.add.sprite(x, y, key);
        spr.anchor.setTo(0.5);
        spr.scale.setTo(0.34);
        spr.alpha = alpha;
        spr._baseY = y;
        this.addChild(spr);
        this._cosmetics.push(spr);
      };
      const baseKey = parts && parts.character ? 'cosmetic_' + parts.character : 'cosmetic_base';
      add(baseKey, 16, 16, 1);
      const hair = parts.hair ? 'cosmetic_' + parts.hair : null;
      const outfit = parts.outfit ? 'cosmetic_' + parts.outfit : null;
      const hat = parts.hat ? 'cosmetic_' + parts.hat : null;
      const face = parts.face ? 'cosmetic_' + parts.face : null;
      const pattern = parts.pattern ? 'cosmetic_' + parts.pattern : null;
      try {
        this.loadTexture('cosmetic_transparent');
      } catch (_) {}
      add(outfit, 16, 22, 0.98);
      add(pattern, 16, 22, 0.99);
      add(face, 16, 14, 0.995);
      add(hair, 16, 12, 0.999);
      add(hat, 16, 6, 0.999);
    } catch (_) {}
  }
  animateCosmetics() {
    try {
      if (!this._cosmetics || !this._cosmetics.length) return;
      if (!this._cosBobT) this._cosBobT = 0;

      // If position changed since last frame, consider moving
      const moving = !!(this._movingUntil && this.game.time.now < this._movingUntil);
      if (moving) this._cosBobT += this.game.time.elapsedMS || 16;else this._cosBobT = 0;
      const bob = moving ? Math.sin(this._cosBobT / 90.0) * 1.6 : 0;
      for (const s of this._cosmetics) {
        if (!s) continue;
        const by = typeof s._baseY === 'number' ? s._baseY : s.y;
        s.y = by + bob;
      }
    } catch (_) {}
  }
  defineSelf(name) {
    let playerText = new _helpers_elements__WEBPACK_IMPORTED_MODULE_1__.Text({
      game: this.game,
      x: _utils_constants__WEBPACK_IMPORTED_MODULE_0__.TILE_SIZE / 2,
      y: -10,
      text: name,
      style: {
        font: '14px Areal',
        fill: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3
      }
    });
    this.addChild(playerText);
  }
}

/***/ },

/***/ "./client/js/entities/fire_blast.js"
/*!******************************************!*\
  !*** ./client/js/entities/fire_blast.js ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ FireBlast)
/* harmony export */ });
/* harmony import */ var _utils_constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/constants */ "./client/js/utils/constants.js");

class FireBlast extends Phaser.Sprite {
  constructor(game, cell) {
    super(game, cell.col * _utils_constants__WEBPACK_IMPORTED_MODULE_0__.TILE_SIZE, cell.row * _utils_constants__WEBPACK_IMPORTED_MODULE_0__.TILE_SIZE, cell.type, 0);
    this.game = game;
    this.animations.add('blast', [0, 1, 2, 3, 4]);

    // 15 - framerate, loop, kill_on_complete
    this.play('blast', 15, false, true);
    this.game.physics.arcade.enable(this);
  }
}

/***/ },

/***/ "./client/js/entities/info.js"
/*!************************************!*\
  !*** ./client/js/entities/info.js ***!
  \************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Info)
/* harmony export */ });
class Info {
  constructor({
    game,
    player
  }) {
    this.game = game;
    this.player = player;
    this.style = {
      font: '14px Arial',
      fill: '#ffffff',
      align: 'left'
    };
    this.redStyle = {
      font: '30px Arial',
      fill: '#ff0044',
      align: 'center'
    };

    // HUD group (sticks to camera)
    this.hud = this.game.add.group();
    this.hud.fixedToCamera = true;
    let bootsIcon = new Phaser.Image(this.game, 5, 2, 'placeholder_speed');
    this.speedText = new Phaser.Text(this.game, 35, 7, this.speedLabel(), this.style);
    bootsIcon.addChild(this.speedText);
    this.hud.add(bootsIcon);
    let powerIcon = new Phaser.Image(this.game, 110, 2, 'placeholder_power');
    this.powerText = new Phaser.Text(this.game, 35, 7, this.powerLabel(), this.style);
    powerIcon.addChild(this.powerText);
    this.hud.add(powerIcon);
    let delayIcon = new Phaser.Image(this.game, 215, 2, 'placeholder_time');
    this.delayText = new Phaser.Text(this.game, 35, 7, this.delayLabel(), this.style);
    delayIcon.addChild(this.delayText);
    this.hud.add(delayIcon);

    // Ghost powerup indicator (hidden unless active)
    let ghostIcon = new Phaser.Image(this.game, 320, 2, 'ghost_icon');
    ghostIcon.alpha = 0.85;
    this.ghostText = new Phaser.Text(this.game, 35, 7, '', this.style);
    ghostIcon.addChild(this.ghostText);
    ghostIcon.visible = false;
    this.ghostIcon = ghostIcon;
    this.hud.add(ghostIcon);
    this._ghostTimer = null;
    this.deadText = this.game.add.text(this.game.world.centerX, this.game.world.height - 30, 'You died :(', this.redStyle);
    this.deadText.anchor.set(0.5);
    this.deadText.visible = false;
    this.deadText.fixedToCamera = true;
  }
  refreshStatistic() {
    this.speedText.text = this.speedLabel();
    this.powerText.text = this.powerLabel();
    this.delayText.text = this.delayLabel();
  }
  showGhost(ghostUntilMs) {
    if (!this.ghostIcon) return;
    this.ghostIcon.visible = true;
    if (this._ghostTimer) {
      try {
        this.game.time.events.remove(this._ghostTimer);
      } catch (_) {}
      this._ghostTimer = null;
    }
    const tick = () => {
      const left = Math.max(0, ghostUntilMs - this.game.time.now);
      this.ghostText.text = `${(left / 1000).toFixed(1)}s`;
      if (left <= 0) {
        this.hideGhost();
      }
    };
    tick();
    this._ghostTimer = this.game.time.events.loop(150, tick);
  }
  hideGhost() {
    if (this.ghostIcon) this.ghostIcon.visible = false;
    if (this._ghostTimer) {
      try {
        this.game.time.events.remove(this._ghostTimer);
      } catch (_) {}
      this._ghostTimer = null;
    }
  }
  showDeadInfo() {
    this.deadText.visible = true;
  }
  speedLabel() {
    return this.player.speed;
  }
  powerLabel() {
    return `x ${this.player.power}`;
  }
  delayLabel() {
    return `${this.player.delay / 1000} sec.`;
  }
}

/***/ },

/***/ "./client/js/entities/player.js"
/*!**************************************!*\
  !*** ./client/js/entities/player.js ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Player)
/* harmony export */ });
/* harmony import */ var _utils_constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/constants */ "./client/js/utils/constants.js");
/* harmony import */ var _info__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./info */ "./client/js/entities/info.js");
/* harmony import */ var _helpers_elements__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../helpers/elements */ "./client/js/helpers/elements.js");



class Player extends Phaser.Sprite {
  constructor({
    game,
    id,
    spawn,
    skin,
    displayName,
    avatarParts
  }) {
    super(game, spawn.x, spawn.y, 'bomberman_' + skin);
    this.game = game;
    this.id = id;
    this.prevPosition = {
      x: spawn.x,
      y: spawn.y
    };
    this.delay = _utils_constants__WEBPACK_IMPORTED_MODULE_0__.INITIAL_DELAY;
    this.power = _utils_constants__WEBPACK_IMPORTED_MODULE_0__.INITIAL_POWER;
    this.speed = _utils_constants__WEBPACK_IMPORTED_MODULE_0__.INITIAL_SPEED;
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
    game.time.events.loop(_utils_constants__WEBPACK_IMPORTED_MODULE_0__.PING, this.positionUpdaterLoop.bind(this));
    this.animations.add('up', [9, 10, 11], 15, true);
    this.animations.add('down', [0, 1, 2], 15, true);
    this.animations.add('right', [6, 7, 8], 15, true);
    this.animations.add('left', [3, 4, 5], 15, true);
    this.info = new _info__WEBPACK_IMPORTED_MODULE_1__["default"]({
      game: this.game,
      player: this
    });
    this.defineKeyboard();
    this.defineSelf(displayName || skin);

    // Paper-doll cosmetics (hair/outfit/hat): simple layered images above base sprite
    this.avatarParts = avatarParts || null;
    this.applyAvatarParts(this.avatarParts);
  }
  update() {
    if (this.alive) {
      this.handleMoves();
      this.handleBombs();
    }
    this.animateCosmetics();

    // this.game.debug.body(this);
    // this.game.debug.spriteInfo(this, 32, 32);
  }
  defineKeyboard() {
    // Arrow keys
    this.upKey = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
    this.downKey = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
    this.leftKey = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    this.rightKey = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

    // WASD
    this.wKey = this.game.input.keyboard.addKey(Phaser.Keyboard.W);
    this.aKey = this.game.input.keyboard.addKey(Phaser.Keyboard.A);
    this.sKey = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
    this.dKey = this.game.input.keyboard.addKey(Phaser.Keyboard.D);

    // Bomb
    this.spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  }
  handleMoves() {
    this.body.velocity.set(0);
    let animationsArray = [];
    const effectiveSpeed = this.speed * (this.tileSpeedMultiplier || 1.0);
    const left = this.leftKey.isDown || this.aKey && this.aKey.isDown || this.touchLeft;
    const right = this.rightKey.isDown || this.dKey && this.dKey.isDown || this.touchRight;
    const up = this.upKey.isDown || this.wKey && this.wKey.isDown || this.touchUp;
    const down = this.downKey.isDown || this.sKey && this.sKey.isDown || this.touchDown;
    if (left) {
      this.body.velocity.x = -effectiveSpeed;
      animationsArray.push('left');
    } else if (right) {
      this.body.velocity.x = effectiveSpeed;
      animationsArray.push('right');
    }
    if (up) {
      this.body.velocity.y = -effectiveSpeed;
      animationsArray.push('up');
    } else if (down) {
      this.body.velocity.y = effectiveSpeed;
      animationsArray.push('down');
    }
    let currentAnimation = animationsArray[0];
    if (currentAnimation) {
      this.animations.play(currentAnimation);
      return;
    }
    this.animations.stop();
  }
  handleBombs() {
    const bombDown = this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) || this.touchBomb;
    if (bombDown) {
      let now = this.game.time.now;
      if (now > this._lastBombTime) {
        this._lastBombTime = now + this.delay;
        clientSocket.emit('create bomb', {
          col: this.currentCol(),
          row: this.currentRow()
        });
      }
    }
  }
  currentCol() {
    return Math.floor(this.body.position.x / _utils_constants__WEBPACK_IMPORTED_MODULE_0__.TILE_SIZE);
  }
  currentRow() {
    return Math.floor(this.body.position.y / _utils_constants__WEBPACK_IMPORTED_MODULE_0__.TILE_SIZE);
  }
  positionUpdaterLoop() {
    let newPosition = {
      x: this.position.x,
      y: this.position.y
    };
    if (this.prevPosition.x !== newPosition.x || this.prevPosition.y !== newPosition.y) {
      clientSocket.emit('update player position', newPosition);
      this.prevPosition = newPosition;
    }
  }
  becomesDead() {
    this.info.showDeadInfo();
    this.kill();
  }
  pickSpoil(spoil_type) {
    if (spoil_type === _utils_constants__WEBPACK_IMPORTED_MODULE_0__.SPEED) {
      this.increaseSpeed();
    }
    if (spoil_type === _utils_constants__WEBPACK_IMPORTED_MODULE_0__.POWER) {
      this.increasePower();
    }
    if (spoil_type === _utils_constants__WEBPACK_IMPORTED_MODULE_0__.DELAY) {
      this.increaseDelay();
    }
    if (spoil_type === _utils_constants__WEBPACK_IMPORTED_MODULE_0__.SHIELD) {
      this.activateShield();
    }
    if (spoil_type === _utils_constants__WEBPACK_IMPORTED_MODULE_0__.REMOTE) {
      this.enableRemote();
    }
    if (spoil_type === _utils_constants__WEBPACK_IMPORTED_MODULE_0__.KICK) {
      this.enableKick();
    }
    if (spoil_type === _utils_constants__WEBPACK_IMPORTED_MODULE_0__.GHOST) {
      this.activateGhost();
    }
  }
  isShielded() {
    return this.shieldUntil && this.game.time.now < this.shieldUntil;
  }
  isGhosted() {
    return this.ghostUntil && this.game.time.now < this.ghostUntil;
  }
  increaseSpeed() {
    let asset = 'speed_up_no_bonus';
    if (this.speed < _utils_constants__WEBPACK_IMPORTED_MODULE_0__.MAX_SPEED) {
      this.speed = this.speed + _utils_constants__WEBPACK_IMPORTED_MODULE_0__.STEP_SPEED;
      this.info.refreshStatistic();
      asset = 'speed_up_bonus';
    }
    new _helpers_elements__WEBPACK_IMPORTED_MODULE_2__.SpoilNotification({
      game: this.game,
      asset: asset,
      x: this.position.x,
      y: this.position.y
    });
  }
  increaseDelay() {
    let asset = 'delay_up_no_bonus';
    if (this.delay > _utils_constants__WEBPACK_IMPORTED_MODULE_0__.MIN_DELAY) {
      this.delay -= _utils_constants__WEBPACK_IMPORTED_MODULE_0__.STEP_DELAY;
      this.info.refreshStatistic();
      asset = 'delay_up_bonus';
    }
    new _helpers_elements__WEBPACK_IMPORTED_MODULE_2__.SpoilNotification({
      game: this.game,
      asset: asset,
      x: this.position.x,
      y: this.position.y
    });
  }
  increasePower() {
    let asset = 'power_up_bonus';
    this.power += _utils_constants__WEBPACK_IMPORTED_MODULE_0__.STEP_POWER;
    this.info.refreshStatistic();
    new _helpers_elements__WEBPACK_IMPORTED_MODULE_2__.SpoilNotification({
      game: this.game,
      asset: asset,
      x: this.position.x,
      y: this.position.y
    });
  }
  activateShield() {
    this.shieldUntil = this.game.time.now + _utils_constants__WEBPACK_IMPORTED_MODULE_0__.SHIELD_DURATION_MS;

    // Simple visual: flash tint while shielded
    this.tint = 0x66ccff;
    this.game.time.events.add(_utils_constants__WEBPACK_IMPORTED_MODULE_0__.SHIELD_DURATION_MS, () => {
      // If ghost is active, keep ghost visual
      if (this.isGhosted && this.isGhosted()) {
        this.tint = 0xa7f7ff;
        this.alpha = 0.65;
      } else {
        this.tint = 0xffffff;
      }
    });
    new _helpers_elements__WEBPACK_IMPORTED_MODULE_2__.SpoilNotification({
      game: this.game,
      asset: 'placeholder_time',
      x: this.position.x,
      y: this.position.y
    });
  }
  enableRemote() {
    this.hasRemote = true;
    new _helpers_elements__WEBPACK_IMPORTED_MODULE_2__.SpoilNotification({
      game: this.game,
      asset: 'placeholder_power',
      x: this.position.x,
      y: this.position.y
    });
  }
  enableKick() {
    this.hasKick = true;
    new _helpers_elements__WEBPACK_IMPORTED_MODULE_2__.SpoilNotification({
      game: this.game,
      asset: 'placeholder_speed',
      x: this.position.x,
      y: this.position.y
    });
  }
  applyAvatarParts(parts) {
    try {
      // clear old
      if (this._cosmetics) {
        for (const s of this._cosmetics) {
          try {
            s.destroy();
          } catch (_) {}
        }
      }
      this._cosmetics = [];
      if (!parts) return;
      const add = (key, x, y, alpha = 1) => {
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

      // Base character
      const baseKey = parts && parts.character ? 'cosmetic_' + parts.character : 'cosmetic_base';
      add(baseKey, 16, 16, 1);

      // Preloaded as images: cosmetic_hair_X, cosmetic_outfit_X, cosmetic_hat_X
      const hair = parts.hair ? 'cosmetic_' + parts.hair : null;
      const outfit = parts.outfit ? 'cosmetic_' + parts.outfit : null;
      const hat = parts.hat ? 'cosmetic_' + parts.hat : null;
      const face = parts.face ? 'cosmetic_' + parts.face : null;
      const pattern = parts.pattern ? 'cosmetic_' + parts.pattern : null;

      // Hide legacy bomberman sprite underneath (keep physics/body) without affecting children.
      try {
        this.loadTexture('cosmetic_transparent');
      } catch (_) {}

      // tuned offsets so accessories don't cover the face by default
      add(outfit, 16, 22, 0.98);
      add(pattern, 16, 22, 0.99);
      add(face, 16, 14, 0.995);
      add(hair, 16, 12, 0.999);
      add(hat, 16, 6, 0.999);
    } catch (_) {}
  }
  animateCosmetics() {
    try {
      if (!this._cosmetics || !this._cosmetics.length) return;
      const moving = Math.abs(this.body.velocity.x) > 1 || Math.abs(this.body.velocity.y) > 1;
      if (!this._cosBobT) this._cosBobT = 0;
      if (moving) {
        this._cosBobT += this.game.time.elapsedMS || 16;
      } else {
        // decay to rest
        this._cosBobT = 0;
      }
      const bob = moving ? Math.sin(this._cosBobT / 90.0) * 1.6 : 0;
      for (const s of this._cosmetics) {
        if (!s) continue;
        const by = typeof s._baseY === 'number' ? s._baseY : s.y;
        s.y = by + bob;
      }
    } catch (_) {}
  }
  activateGhost() {
    this.ghostUntil = this.game.time.now + _utils_constants__WEBPACK_IMPORTED_MODULE_0__.GHOST_DURATION_MS;

    // Visual: semi-transparent + cool tint
    this.alpha = 0.65;
    this.tint = 0xa7f7ff;

    // HUD indicator + countdown
    if (this.info && this.info.showGhost) {
      this.info.showGhost(this.ghostUntil);
    }

    // Clear visual at end (unless shield overwrote tint, reset to white)
    this.game.time.events.add(_utils_constants__WEBPACK_IMPORTED_MODULE_0__.GHOST_DURATION_MS, () => {
      this.alpha = 1;
      // if shield is still on, keep its tint
      if (!(this.isShielded && this.isShielded())) {
        this.tint = 0xffffff;
      }
      if (this.info && this.info.hideGhost) {
        this.info.hideGhost();
      }
    });
    new _helpers_elements__WEBPACK_IMPORTED_MODULE_2__.SpoilNotification({
      game: this.game,
      asset: 'ghost_icon',
      x: this.position.x,
      y: this.position.y
    });
  }
  defineSelf(name) {
    let playerText = new _helpers_elements__WEBPACK_IMPORTED_MODULE_2__.Text({
      game: this.game,
      x: _utils_constants__WEBPACK_IMPORTED_MODULE_0__.TILE_SIZE / 2,
      y: -10,
      text: `\u272E ${name} \u272E`,
      style: {
        font: '15px Areal',
        fill: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3
      }
    });
    this.addChild(playerText);
  }
}

/***/ },

/***/ "./client/js/entities/spoil.js"
/*!*************************************!*\
  !*** ./client/js/entities/spoil.js ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Spoil)
/* harmony export */ });
/* harmony import */ var _utils_constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/constants */ "./client/js/utils/constants.js");

class Spoil extends Phaser.Sprite {
  constructor(game, spoil) {
    // UK01: spoil_tileset now contains 7 frames (0..6) matching constants
    let frame = 0;
    if (spoil.spoil_type === _utils_constants__WEBPACK_IMPORTED_MODULE_0__.SPEED) frame = 0;
    if (spoil.spoil_type === _utils_constants__WEBPACK_IMPORTED_MODULE_0__.POWER) frame = 1;
    if (spoil.spoil_type === _utils_constants__WEBPACK_IMPORTED_MODULE_0__.DELAY) frame = 2;
    if (spoil.spoil_type === _utils_constants__WEBPACK_IMPORTED_MODULE_0__.SHIELD) frame = 3;
    if (spoil.spoil_type === _utils_constants__WEBPACK_IMPORTED_MODULE_0__.REMOTE) frame = 4;
    if (spoil.spoil_type === _utils_constants__WEBPACK_IMPORTED_MODULE_0__.KICK) frame = 5;
    if (spoil.spoil_type === _utils_constants__WEBPACK_IMPORTED_MODULE_0__.GHOST) frame = 6;
    super(game, spoil.col * _utils_constants__WEBPACK_IMPORTED_MODULE_0__.TILE_SIZE, spoil.row * _utils_constants__WEBPACK_IMPORTED_MODULE_0__.TILE_SIZE, 'spoil_tileset', frame);
    this.id = spoil.id;
    this.game.physics.arcade.enable(this);

    // Light glow/pulse to make spoils more visible (mobile-friendly)
    this.alpha = 0.92;
    this.scale.setTo(1.0);
    try {
      const t1 = this.game.add.tween(this).to({
        alpha: 0.62
      }, 420, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);
      const t2 = this.game.add.tween(this.scale).to({
        x: 1.08,
        y: 1.08
      }, 520, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);
      // keep refs to avoid GC issues in some Phaser builds
      this._glowTween = t1;
      this._scaleTween = t2;
    } catch (_) {}
  }
}

/***/ },

/***/ "./client/js/helpers/elements.js"
/*!***************************************!*\
  !*** ./client/js/helpers/elements.js ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Button: () => (/* binding */ Button),
/* harmony export */   GameSlots: () => (/* binding */ GameSlots),
/* harmony export */   PlayerSlots: () => (/* binding */ PlayerSlots),
/* harmony export */   SpoilNotification: () => (/* binding */ SpoilNotification),
/* harmony export */   Text: () => (/* binding */ Text),
/* harmony export */   TextButton: () => (/* binding */ TextButton)
/* harmony export */ });
class Text extends Phaser.Text {
  constructor({
    game,
    x,
    y,
    text,
    style
  }) {
    super(game, x, y, text, style);
    this.anchor.setTo(0.5);
    this.game.add.existing(this);
  }
}
class Button extends Phaser.Button {
  constructor({
    game,
    x,
    y,
    asset,
    callback,
    callbackContext,
    overFrame,
    outFrame,
    downFrame,
    upFrame
  }) {
    super(game, x, y, asset, callback, callbackContext, overFrame, outFrame, downFrame, upFrame);
    this.anchor.setTo(0.5);
    this.game.add.existing(this);
  }
}
class TextButton extends Phaser.Button {
  constructor({
    game,
    x,
    y,
    asset,
    callback,
    callbackContext,
    overFrame,
    outFrame,
    downFrame,
    upFrame,
    label,
    style
  }) {
    super(game, x, y, asset, callback, callbackContext, overFrame, outFrame, downFrame, upFrame);
    this.anchor.setTo(0.5);
    this.text = new Phaser.Text(this.game, 0, 0, label, style);
    this.text.anchor.setTo(0.5);
    this.addChild(this.text);
    this.game.add.existing(this);
  }
  disable() {
    this.setFrames(3, 3);
    this.inputEnabled = false;
    this.input.useHandCursor = false;
  }
  enable() {
    this.setFrames(1, 0, 2);
    this.inputEnabled = true;
    this.input.useHandCursor = true;
  }
}
class GameSlots extends Phaser.Group {
  constructor({
    game,
    availableGames,
    callback,
    callbackContext,
    x,
    y,
    style
  }) {
    super(game);
    let game_slot_asset = 'slot_backdrop';
    let game_enter_asset = 'list_icon';
    let yOffset = y;
    for (let availableGame of availableGames) {
      let gameBox = new Phaser.Image(this.game, x, yOffset, game_slot_asset);
      let button = new Phaser.Button(this.game, gameBox.width - 100, 12, game_enter_asset, callback.bind(callbackContext, {
        game_id: availableGame.id
      }), null, 1, 0, 2, 1);
      let text = new Phaser.Text(this.game, 30, 25, `Join Game: ${availableGame.name}`, style);
      gameBox.addChild(button);
      gameBox.addChild(text);
      this.add(gameBox);
      yOffset += 105;
    }
  }
  destroy() {
    this.callAll('kill'); // destroy
  }
}
class PlayerSlots extends Phaser.Group {
  constructor({
    game,
    max_players,
    players,
    x,
    y,
    asset_empty,
    asset_player,
    style
  }) {
    super(game);
    let xOffset = x;
    for (let i = 0; i < max_players; i++) {
      let slotBox;
      let slotName;
      let _player = players[i];
      if (_player) {
        slotBox = new Phaser.Image(this.game, xOffset, y, asset_player + _player.skin);
        const label = _player.displayName || _player.skin;
        slotName = new Phaser.Text(this.game, slotBox.width / 2, slotBox.height + 15, label, style);
        slotName.anchor.setTo(0.5);
        slotBox.addChild(slotName);
      } else {
        slotBox = new Phaser.Image(this.game, xOffset, y, asset_empty);
      }
      this.add(slotBox);
      xOffset += 170;
    }
  }
  destroy() {
    this.callAll('kill');
  }
}
class SpoilNotification extends Phaser.Group {
  constructor({
    game,
    asset,
    x,
    y
  }) {
    super(game);
    this.picture = new Phaser.Image(this.game, x, y - 20, asset);
    this.picture.anchor.setTo(0.5);
    this.add(this.picture);
    this.tween = this.game.add.tween(this.picture);
    this.tween.to({
      y: this.picture.y - 25,
      alpha: 0
    }, 600);
    this.tween.onComplete.add(this.finish, this);
    this.tween.start();
  }
  finish() {
    this.callAll('kill');
  }
}

/***/ },

/***/ "./client/js/states/boot.js"
/*!**********************************!*\
  !*** ./client/js/states/boot.js ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _helpers_elements__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../helpers/elements */ "./client/js/helpers/elements.js");

class Boot extends Phaser.State {
  create() {
    // Make the game keep reacting to messages from the server even when the game window doesn’t have focus.
    // The game pauses when I open a new tab in the same window, but does not pause when I focus on another application
    this.game.stage.disableVisibilityChange = true;

    // Responsive scaling (stable on mobile, keeps aspect ratio)
    // SHOW_ALL avoids distortion and keeps input coordinates consistent.
    // It may add letterboxing on some aspect ratios, but gameplay + touch controls remain reliable.
    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.game.scale.pageAlignHorizontally = true;
    this.game.scale.pageAlignVertically = true;
    const refresh = () => {
      try {
        this.game.scale.refresh();
      } catch (_) {}
    };
    window.addEventListener('resize', refresh);
    refresh();
    new _helpers_elements__WEBPACK_IMPORTED_MODULE_0__.Text({
      game: this.game,
      x: this.game.world.centerX,
      y: this.game.world.centerY,
      text: 'Loading...',
      style: {
        font: '30px Areal',
        fill: '#FFFFFF'
      }
    });

    // Mobile browsers often block audio until a user gesture.
    // Unlock/resume audio on first tap/click.
    try {
      this.game.sound.mute = false;
      this.game.input.onDown.addOnce(() => {
        try {
          if (this.game.sound && this.game.sound.context && this.game.sound.context.state === 'suspended') {
            this.game.sound.context.resume();
          }
          if (this.game.sound && this.game.sound.unlock) {
            this.game.sound.unlock();
          }
        } catch (_) {}
      });
    } catch (_) {}
    this.state.start('Preload');
  }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Boot);

/***/ },

/***/ "./client/js/states/menu.js"
/*!**********************************!*\
  !*** ./client/js/states/menu.js ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _helpers_elements__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../helpers/elements */ "./client/js/helpers/elements.js");

class Menu extends Phaser.State {
  init() {
    this.slotsWithGame = null;
    clientSocket.on('display pending games', this.displayPendingGames.bind(this));
  }
  create() {
    // Keep the background so the canvas isn't blank behind HTML overlay
    let background = this.add.image(this.game.world.centerX, this.game.world.centerY, 'main_menu');
    background.anchor.setTo(0.5);

    // Use HTML overlay for mobile reliability
    try {
      if (window.UK01Menu && window.UK01Menu.showMenu) {
        window.UK01Menu.showMenu();
      }
    } catch (_) {}
    clientSocket.emit('enter lobby', this.displayPendingGames.bind(this));
  }
  update() {}
  hostGameAction() {
    clientSocket.emit('leave lobby');
    this.state.start('SelectMap');
  }
  displayPendingGames(availableGames) {
    // NOTE: That is not optimal way to preview slots,
    //       we should implement AddSlotToGroup, RemoveSlotFromGroup

    // I triying to care about readability, not about performance.
    if (this.slotsWithGame) {
      this.slotsWithGame.destroy();
    }
    this.slotsWithGame = new _helpers_elements__WEBPACK_IMPORTED_MODULE_0__.GameSlots({
      game: this.game,
      availableGames: availableGames,
      callback: this.joinGameAction,
      callbackContext: this,
      x: this.game.world.centerX - 220,
      y: 160,
      style: {
        font: '35px Areal',
        fill: '#efefef',
        stroke: '#ae743a',
        strokeThickness: 3
      }
    });
  }
  joinGameAction(game_id) {
    clientSocket.emit('leave lobby');
    // https://phaser.io/docs/2.6.2/Phaser.StateManager.html#start
    this.state.start('PendingGame', true, false, game_id);
  }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Menu);

/***/ },

/***/ "./client/js/states/pending_game.js"
/*!******************************************!*\
  !*** ./client/js/states/pending_game.js ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _helpers_elements__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../helpers/elements */ "./client/js/helpers/elements.js");

class PendingGame extends Phaser.State {
  init(payload) {
    this.slotsWithPlayer = null;

    // Phaser may pass init params as a plain value (game_id) or as an object { game_id }
    this.game_id = payload && payload.game_id ? payload.game_id : payload;
    clientSocket.on('update game', this.displayGameInfo.bind(this));
    clientSocket.on('launch game', this.launchGame.bind(this));
    clientSocket.emit('enter pending game', {
      game_id: this.game_id
    });
  }
  create() {
    let background = this.add.image(this.game.world.centerX, this.game.world.centerY, 'main_menu');
    background.anchor.setTo(0.5);

    // Use HTML overlay for mobile reliability
    try {
      if (window.UK01Pending && window.UK01Pending.show) {
        window.UK01Pending.show();
      }
      // hide main menu overlay if visible
      if (window.UK01Menu && window.UK01Menu.hideMenu) {
        window.UK01Menu.hideMenu();
      }
    } catch (_) {}

    // keep minimal title text in canvas (optional)
    this.gameTitle = new _helpers_elements__WEBPACK_IMPORTED_MODULE_0__.Text({
      game: this.game,
      x: this.game.world.centerX,
      y: this.game.world.centerY - 215,
      text: '',
      style: {
        font: '35px Areal',
        fill: '#9ec0ba',
        stroke: '#6f7975',
        strokeThickness: 3
      }
    });
  }
  setAICount(n) {
    this.aiCount = Math.max(0, Math.min(3, n));
    if (this.aiText) this.aiText.text = `AI: ${this.aiCount}`;
    clientSocket.emit('set ai count', {
      count: this.aiCount
    });
  }
  setAIDifficulty(difficulty) {
    this.aiDifficulty = difficulty;
    if (this.aiDiffText) this.aiDiffText.text = `難度: ${this.aiDifficulty}`;
    clientSocket.emit('set ai difficulty', {
      difficulty: this.aiDifficulty
    });
  }
  displayGameInfo({
    current_game
  }) {
    let players = Object.values(current_game.players);
    this.gameTitle.text = current_game.name;
    if (this.slotsWithPlayer) {
      this.slotsWithPlayer.destroy();
    }
    this.slotsWithPlayer = new _helpers_elements__WEBPACK_IMPORTED_MODULE_0__.PlayerSlots({
      game: this.game,
      max_players: current_game.max_players,
      players: players,
      x: this.game.world.centerX - 245,
      y: this.game.world.centerY - 80,
      asset_empty: 'bomberman_head_blank',
      asset_player: 'bomberman_head_',
      style: {
        font: '20px Areal',
        fill: '#48291c'
      }
    });

    // Update HTML overlay
    try {
      if (window.UK01Pending && window.UK01Pending.updateFromGame) {
        window.UK01Pending.updateFromGame(current_game);
      }
    } catch (_) {}
  }
  leaveGameAction() {
    clientSocket.emit('leave pending game');
    this.state.start('Menu');
  }
  startGameAction() {
    clientSocket.emit('start game');
  }
  launchGame(game) {
    this.state.start('Play', true, false, game);
  }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (PendingGame);

/***/ },

/***/ "./client/js/states/play.js"
/*!**********************************!*\
  !*** ./client/js/states/play.js ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/utils */ "./client/js/utils/utils.js");
/* harmony import */ var _utils_constants__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/constants */ "./client/js/utils/constants.js");
/* harmony import */ var _entities_player__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../entities/player */ "./client/js/entities/player.js");
/* harmony import */ var _entities_enemy_player__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../entities/enemy_player */ "./client/js/entities/enemy_player.js");
/* harmony import */ var _entities_bomb__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../entities/bomb */ "./client/js/entities/bomb.js");
/* harmony import */ var _entities_spoil__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../entities/spoil */ "./client/js/entities/spoil.js");
/* harmony import */ var _entities_fire_blast__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../entities/fire_blast */ "./client/js/entities/fire_blast.js");
/* harmony import */ var _entities_bone__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../entities/bone */ "./client/js/entities/bone.js");








class Play extends Phaser.State {
  init(game) {
    this.currentGame = game;
  }
  create() {
    this.createMap();
    this.createPlayers();
    this.setEventHandlers();

    // Keep player in view on mobile / resized canvas
    if (this.player) {
      this.game.camera.follow(this.player);
    }

    // hide overlays during gameplay
    try {
      if (window.UK01Pending && window.UK01Pending.hide) window.UK01Pending.hide();
    } catch (_) {}
    try {
      if (window.UK01Menu && window.UK01Menu.hideMenu) window.UK01Menu.hideMenu();
    } catch (_) {}

    // Use HTML touch overlay on mobile (works even when canvas is letterboxed)
    try {
      if (window.UK01Touch && window.UK01Touch.show) window.UK01Touch.show();
    } catch (_) {}

    // Keep Phaser touch controls disabled to avoid double-input on mobile
    // this.createTouchControls();

    // SFX / BGM
    this.sfxPortal = this.game.add.audio('sfx_portal');
    this.sfxSpeed = this.game.add.audio('sfx_speed');
    this.sfxExplosion = this.game.add.audio('sfx_explosion');
    this.sfxDeath = this.game.add.audio('sfx_death');

    // Background music (loop)
    // On mobile, playback may be blocked until a user gesture; we create the sound here
    // and (re)start it on first joystick tap via tryUnlockAudio() in index.html.
    try {
      if (this.game._bgm && this.game._bgm.stop) {
        this.game._bgm.stop();
      }
      this.game._bgm = this.game.add.audio('bgm_main');
      this.game._bgm.loop = true;
      this.game._bgm.volume = 0.28;
      // attempt to play (may fail silently if locked)
      this.game._bgm.play();
    } catch (_) {}
    this.game.time.events.loop(400, this.stopAnimationLoop.bind(this));
  }
  update() {
    this.refreshGhostCollision();
    this.game.physics.arcade.collide(this.player, this.blockLayer);
    this.game.physics.arcade.collide(this.player, this.enemies);
    this.game.physics.arcade.collide(this.player, this.bombs, this.onPlayerVsBomb, null, this);
    this.game.physics.arcade.overlap(this.player, this.spoils, this.onPlayerVsSpoil, null, this);
    this.game.physics.arcade.overlap(this.player, this.blasts, this.onPlayerVsBlast, null, this);
    this.handleSpecialTiles();
  }
  createMap() {
    this.map = this.add.tilemap(this.currentGame.map_name);
    this.map.addTilesetImage(_utils_constants__WEBPACK_IMPORTED_MODULE_1__.TILESET);
    this.blockLayer = this.map.createLayer(_utils_constants__WEBPACK_IMPORTED_MODULE_1__.LAYER);
    this.blockLayer.resizeWorld();
    this.baseCollisionTiles = (this.blockLayer.layer.properties.collisionTiles || []).slice();
    this.wallTileIndex = this.blockLayer.layer.properties.wall;
    this.balkTileIndex = this.blockLayer.layer.properties.balk;
    this.map.setCollision(this.baseCollisionTiles, true, this.blockLayer);
    this._ghostCollisionEnabled = false;

    // Special tiles cache
    this.portalCells = [];
    this.speedCells = new Set();

    // Visual overlays (magic style placeholder)
    this.specialFx = this.game.add.group();
    const layer = this.map.layers[0];
    const w = layer.width;
    const h = layer.height;
    const data = layer.data;
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const tile = data[r][c];
        if (!tile) continue;
        const idx = tile.index;

        // Portal tile id must NOT conflict with balk (destructible) tile id.
        // cold_map uses balk=2, which would otherwise create "too many portals".
        if (idx === _utils_constants__WEBPACK_IMPORTED_MODULE_1__.TILE_PORTAL && idx !== this.balkTileIndex) {
          this.portalCells.push({
            col: c,
            row: r
          });
        } else if (idx === _utils_constants__WEBPACK_IMPORTED_MODULE_1__.TILE_SPEED_FLOOR) {
          this.speedCells.add(`${c},${r}`);
        }
      }
    }

    // Special tiles visuals (animated spritesheets)
    // NOTE: We keep them as a separate group so they sit above the map.
    for (const p of this.portalCells) {
      const x = p.col * _utils_constants__WEBPACK_IMPORTED_MODULE_1__.TILE_SIZE;
      const y = p.row * _utils_constants__WEBPACK_IMPORTED_MODULE_1__.TILE_SIZE;
      const s = this.game.add.sprite(x, y, 'portal_fx');
      s.alpha = 0.95;
      s.blendMode = Phaser.blendModes.ADD;
      s.animations.add('spin', [0, 1, 2, 3, 4, 5], 10, true);
      s.animations.play('spin');
      this.specialFx.add(s);
    }
    for (const key of this.speedCells) {
      const [c, r] = key.split(',').map(Number);
      const x = c * _utils_constants__WEBPACK_IMPORTED_MODULE_1__.TILE_SIZE;
      const y = r * _utils_constants__WEBPACK_IMPORTED_MODULE_1__.TILE_SIZE;
      const s = this.game.add.sprite(x, y, 'speed_fx');
      s.alpha = 0.75;
      s.animations.add('flow', [0, 1, 2, 3, 4, 5], 12, true);
      s.animations.play('flow');
      this.specialFx.add(s);
    }
    this.player = null;
    this.bones = this.game.add.group();
    this.bombs = this.game.add.group();
    this.spoils = this.game.add.group();
    this.blasts = this.game.add.group();
    this.enemies = this.game.add.group();
    this.game.physics.arcade.enable(this.blockLayer);
  }
  createPlayers() {
    const all = Object.values(this.currentGame.players || {});

    // Prefer socket id match
    let local = all.find(p => p && p.id === clientSocket.id);

    // Fallback: match by authenticated userId (useful if socket id changed)
    if (!local) {
      try {
        const uid = window.currentUser && window.currentUser.id;
        if (uid) {
          local = all.find(p => p && p.userId && p.userId === uid);
        }
      } catch (_) {}
    }
    for (let player of all) {
      if (!player) continue;
      let setup = {
        game: this.game,
        id: player.id,
        spawn: player.spawn,
        skin: player.skin,
        displayName: player.displayName || player.skin,
        avatarParts: player.avatarParts || null
      };
      if (local && player === local || player.id === clientSocket.id) {
        this.player = new _entities_player__WEBPACK_IMPORTED_MODULE_2__["default"](setup);
      } else {
        this.enemies.add(new _entities_enemy_player__WEBPACK_IMPORTED_MODULE_3__["default"](setup));
      }
    }

    // If still not found (anonymous + mismatch), pick first non-bot as local to avoid a blank screen
    if (!this.player && all.length) {
      const first = all.find(p => p && !(typeof p.id === 'string' && p.id.startsWith('bot:'))) || all[0];
      if (first) {
        this.player = new _entities_player__WEBPACK_IMPORTED_MODULE_2__["default"]({
          game: this.game,
          id: first.id,
          spawn: first.spawn,
          skin: first.skin,
          avatarParts: first.avatarParts || null
        });
      }
    }
  }
  setEventHandlers() {
    clientSocket.on('move player', this.onMovePlayer.bind(this));
    clientSocket.on('player win', this.onPlayerWin.bind(this));
    clientSocket.on('show bomb', this.onShowBomb.bind(this));
    clientSocket.on('detonate bomb', this.onDetonateBomb.bind(this));
    clientSocket.on('move bomb', this.onMoveBomb.bind(this));
    clientSocket.on('spoil was picked', this.onSpoilWasPicked.bind(this));
    clientSocket.on('show bones', this.onShowBones.bind(this));
    clientSocket.on('player disconnect', this.onPlayerDisconnect.bind(this));
    clientSocket.on('sudden death tiles', this.onSuddenDeathTiles.bind(this));
    clientSocket.on('match summary', this.onMatchSummary.bind(this));
  }
  onPlayerVsSpoil(player, spoil) {
    clientSocket.emit('pick up spoil', {
      spoil_id: spoil.id
    });
    spoil.kill();
  }
  onPlayerVsBlast(player, blast) {
    if (!player.alive) return;
    // Shield powerup: brief invulnerability
    if (player.isShielded && player.isShielded()) return;
    try {
      if (this.sfxDeath) this.sfxDeath.play();
    } catch (_) {}
    clientSocket.emit('player died', {
      col: player.currentCol(),
      row: player.currentRow()
    });
    player.becomesDead();
  }
  onMovePlayer({
    player_id,
    x,
    y
  }) {
    let enemy = (0,_utils_utils__WEBPACK_IMPORTED_MODULE_0__.findFrom)(player_id, this.enemies);
    if (!enemy) {
      return;
    }
    enemy.goTo({
      x: x,
      y: y
    });
  }
  onPlayerVsBomb(player, bomb) {
    if (!player || !bomb) return;
    if (!player.hasKick) return;

    // Determine movement direction intent (keyboard + touch)
    const left = player.leftKey.isDown || player.aKey && player.aKey.isDown || player.touchLeft;
    const right = player.rightKey.isDown || player.dKey && player.dKey.isDown || player.touchRight;
    const up = player.upKey.isDown || player.wKey && player.wKey.isDown || player.touchUp;
    const down = player.downKey.isDown || player.sKey && player.sKey.isDown || player.touchDown;
    let dir = null;
    if (left) dir = 'left';else if (right) dir = 'right';else if (up) dir = 'up';else if (down) dir = 'down';
    if (!dir) return;

    // Throttle: avoid spamming server every physics tick
    const now = this.game.time.now;
    if (!player._lastKickAt) player._lastKickAt = 0;
    if (now - player._lastKickAt < 110) return;
    player._lastKickAt = now;
    clientSocket.emit('kick bomb', {
      bomb_id: bomb.id,
      dir
    });
  }
  onMoveBomb({
    bomb_id,
    col,
    row
  }) {
    const b = (0,_utils_utils__WEBPACK_IMPORTED_MODULE_0__.findFrom)(bomb_id, this.bombs);
    if (!b) return;
    const x = col * _utils_constants__WEBPACK_IMPORTED_MODULE_1__.TILE_SIZE + _utils_constants__WEBPACK_IMPORTED_MODULE_1__.TILE_SIZE / 2;
    const y = row * _utils_constants__WEBPACK_IMPORTED_MODULE_1__.TILE_SIZE + _utils_constants__WEBPACK_IMPORTED_MODULE_1__.TILE_SIZE / 2;
    b.x = x;
    b.y = y;
    if (b.body) {
      b.body.reset(x, y);
    }
  }
  stopAnimationLoop() {
    for (let enemy of this.enemies.children) {
      if (enemy.lastMoveAt < this.game.time.now - 200) {
        enemy.animations.stop();
      }
    }
  }
  createTouchControls() {
    if (!this.player) return;

    // Only show on touch-capable devices (Phaser detection can be flaky on some mobile browsers)
    const isTouchCapable = this.game.device && (this.game.device.touch || this.game.device.iOS || this.game.device.android) || typeof window !== 'undefined' && 'ontouchstart' in window || typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
    if (!isTouchCapable) return;
    const g = this.game.add.group();
    g.fixedToCamera = true;
    g.cameraOffset.setTo(0, 0);
    const mkBtn = ({
      x,
      y,
      r = 44,
      label,
      onDown,
      onUp,
      fill = 0x111111,
      alpha = 0.35,
      stroke = 0xffffff,
      strokeAlpha = 0.22
    }) => {
      const btn = this.game.add.graphics(0, 0);
      btn.beginFill(fill, alpha);
      btn.lineStyle(3, stroke, strokeAlpha);
      btn.drawCircle(0, 0, r * 2);
      btn.endFill();
      btn.x = x;
      btn.y = y;
      const t = this.game.add.text(0, 0, label, {
        font: '26px Arial',
        fill: '#ffffff'
      });
      t.anchor.setTo(0.5);
      btn.addChild(t);
      btn.inputEnabled = true;
      btn.events.onInputDown.add(() => onDown && onDown());
      const up = () => onUp && onUp();
      btn.events.onInputUp.add(up);
      btn.events.onInputOut.add(up);
      g.add(btn);
      return btn;
    };
    const w = this.game.width;
    const h = this.game.height;

    // iOS/Android safe-area padding (home indicator / browser UI)
    const cssSafeBottom = (() => {
      try {
        const v = getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)');
        const n = parseInt((v || '0').toString().replace('px', '').trim(), 10);
        return Number.isFinite(n) ? n : 0;
      } catch (_) {
        return 0;
      }
    })();
    const padBottom = Math.max(28, cssSafeBottom + 18);

    // Scale controls a bit based on screen size
    const s = Math.max(0.85, Math.min(1.15, Math.min(w, h) / 700));

    // Virtual joystick (4-direction snap)
    const baseX = 125 * s;
    const baseY = h - 185 * s - padBottom;
    const baseR = 70 * s;
    const knobR = 36 * s;
    const base = this.game.add.graphics(0, 0);
    base.beginFill(0x111111, 0.22);
    base.lineStyle(3, 0xffffff, 0.18);
    base.drawCircle(0, 0, baseR * 2);
    base.endFill();
    base.x = baseX;
    base.y = baseY;
    base.inputEnabled = true;
    base.input.enableDrag(false);
    g.add(base);
    const knob = this.game.add.graphics(0, 0);
    knob.beginFill(0x00e5ff, 0.18);
    knob.lineStyle(3, 0x00e5ff, 0.25);
    knob.drawCircle(0, 0, knobR * 2);
    knob.endFill();
    knob.x = baseX;
    knob.y = baseY;
    g.add(knob);
    const resetDir = () => {
      this.player.touchLeft = this.player.touchRight = this.player.touchUp = this.player.touchDown = false;
    };
    const setDirFromVector = (dx, dy) => {
      resetDir();
      const dead = 14;
      if (Math.abs(dx) < dead && Math.abs(dy) < dead) {
        knob.x = baseX;
        knob.y = baseY;
        return;
      }

      // snap to 4 directions
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) this.player.touchRight = true;else this.player.touchLeft = true;
        knob.x = baseX + Math.max(-baseR + knobR, Math.min(baseR - knobR, dx));
        knob.y = baseY;
      } else {
        if (dy > 0) this.player.touchDown = true;else this.player.touchUp = true;
        knob.x = baseX;
        knob.y = baseY + Math.max(-baseR + knobR, Math.min(baseR - knobR, dy));
      }
    };
    const onPointer = pointer => {
      const dx = pointer.x - baseX;
      const dy = pointer.y - baseY;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const max = baseR - knobR;
      const clamped = Math.min(max, len);
      const ndx = dx / len * clamped;
      const ndy = dy / len * clamped;
      setDirFromVector(ndx, ndy);
    };
    base.events.onInputDown.add((sprite, pointer) => onPointer(pointer));
    base.events.onInputUp.add(() => {
      resetDir();
      knob.x = baseX;
      knob.y = baseY;
    });
    base.events.onInputOut.add(() => {
      resetDir();
      knob.x = baseX;
      knob.y = baseY;
    });

    // Track drag/move globally while pressed
    this.game.input.addMoveCallback(pointer => {
      if (!pointer.isDown) return;
      onPointer(pointer);
    }, this);

    // Bomb button (right side)
    mkBtn({
      x: w - 115 * s,
      y: h - 165 * s - padBottom,
      r: 54 * s,
      label: '💣',
      fill: 0x7a1cff,
      alpha: 0.32,
      stroke: 0x00e5ff,
      strokeAlpha: 0.35,
      onDown: () => this.player.touchBomb = true,
      onUp: () => this.player.touchBomb = false
    });

    // Reposition on resize (RESIZE scale mode)
    this.game.scale.onSizeChange.add(() => {
      const w2 = this.game.width;
      const h2 = this.game.height;
      // update camera-fixed positions by moving the whole group
      // easiest: clear & recreate
      g.destroy(true);
      this.createTouchControls();
    });
  }
  onSuddenDeathTiles({
    level,
    tiles
  }) {
    if (!tiles || !tiles.length) return;

    // Visual: place walls on map; keep collision as-is (walls are already collidable)
    const wallIdx = this.wallTileIndex;
    for (const t of tiles) {
      try {
        this.map.putTile(wallIdx, t.col, t.row, this.blockLayer);
      } catch (_) {}
    }

    // Optional: show a tiny hint
    try {
      if (!this._sdText) {
        this._sdText = this.game.add.text(10, 10, '', {
          font: '16px Arial',
          fill: '#ffdf7a',
          stroke: '#000',
          strokeThickness: 3
        });
        this._sdText.fixedToCamera = true;
      }
      this._sdText.text = `SUDDEN DEATH Lv.${level}`;
      this.game.time.events.add(1200, () => {
        try {
          if (this._sdText) this._sdText.text = '';
        } catch (_) {}
      });
    } catch (_) {}
  }
  refreshGhostCollision() {
    if (!this.player) return;
    const ghost = this.player.isGhosted && this.player.isGhosted();
    if (ghost === this._ghostCollisionEnabled) return;

    // Ghost: phase through destructible blocks ("balk") only.
    // We keep walls solid.
    this._ghostCollisionEnabled = ghost;
    if (ghost) {
      this.map.setCollision([this.wallTileIndex], true, this.blockLayer);
      if (this.balkTileIndex != null) {
        this.map.setCollision([this.balkTileIndex], false, this.blockLayer);
      }
    } else {
      this.map.setCollision(this.baseCollisionTiles, true, this.blockLayer);
    }
  }
  handleSpecialTiles() {
    if (!this.player) return;
    const col = Math.floor(this.player.body.position.x / _utils_constants__WEBPACK_IMPORTED_MODULE_1__.TILE_SIZE);
    const row = Math.floor(this.player.body.position.y / _utils_constants__WEBPACK_IMPORTED_MODULE_1__.TILE_SIZE);

    // Speed floor
    const onSpeed = this.speedCells.has(`${col},${row}`);
    this.player.tileSpeedMultiplier = onSpeed ? 1.65 : 1.0;
    if (!this.player._wasOnSpeed) this.player._wasOnSpeed = false;
    if (onSpeed && !this.player._wasOnSpeed) {
      try {
        if (this.sfxSpeed) this.sfxSpeed.play();
      } catch (_) {}
    }
    this.player._wasOnSpeed = onSpeed;

    // Portal (pair portals in order: 0<->1, 2<->3, ...)
    if (this.portalCells.length >= 2) {
      const now = this.game.time.now;
      if (!this.player._lastPortalAt) this.player._lastPortalAt = 0;
      const isBlockedCell = (c, r) => {
        try {
          const t = this.map.getTile(c, r, this.blockLayer);
          if (!t) return false;
          // Treat walls/balks as blocked
          if (t.index === this.wallTileIndex) return true;
          if (this.balkTileIndex != null && t.index === this.balkTileIndex) return true;
          // Some maps may mark additional collision tiles
          if (t.collides) return true;
          return false;
        } catch (_) {
          return false;
        }
      };
      const hasBombAt = (c, r) => {
        try {
          return (this.bombs && this.bombs.children || []).some(b => b && b.col === c && b.row === r);
        } catch (_) {
          return false;
        }
      };
      const findSafeLanding = (c0, r0) => {
        // Prefer exact target, else search nearby in small radius
        const tryCell = (c, r) => {
          if (isBlockedCell(c, r)) return null;
          if (hasBombAt(c, r)) return null;
          return {
            col: c,
            row: r
          };
        };
        let ok = tryCell(c0, r0);
        if (ok) return ok;
        for (let rad = 1; rad <= 2; rad++) {
          for (let dr = -rad; dr <= rad; dr++) {
            for (let dc = -rad; dc <= rad; dc++) {
              const c = c0 + dc;
              const r = r0 + dr;
              ok = tryCell(c, r);
              if (ok) return ok;
            }
          }
        }
        return null;
      };
      const portalIndex = this.portalCells.findIndex(p => p.col === col && p.row === row);
      if (portalIndex >= 0 && now - this.player._lastPortalAt > 950) {
        const pairIndex = portalIndex % 2 === 0 ? portalIndex + 1 : portalIndex - 1;
        const target = this.portalCells[pairIndex];
        if (target) {
          const landing = findSafeLanding(target.col, target.row);
          if (landing) {
            // Teleport to tile top-left (sprite origin). Keep body fully inside the tile.
            this.player.x = landing.col * _utils_constants__WEBPACK_IMPORTED_MODULE_1__.TILE_SIZE;
            this.player.y = landing.row * _utils_constants__WEBPACK_IMPORTED_MODULE_1__.TILE_SIZE;
            this.player.body.velocity.set(0);
            this.player.body.reset(this.player.x, this.player.y);
            this.player.prevPosition = {
              x: this.player.x,
              y: this.player.y
            };
            this.player._lastPortalAt = now;
            try {
              if (this.sfxPortal) this.sfxPortal.play();
            } catch (_) {}
          }
        }
      }
    }
  }
  onShowBomb({
    bomb_id,
    col,
    row
  }) {
    this.bombs.add(new _entities_bomb__WEBPACK_IMPORTED_MODULE_4__["default"](this.game, bomb_id, col, row));
  }
  onDetonateBomb({
    bomb_id,
    blastedCells
  }) {
    // Remove Bomb:
    (0,_utils_utils__WEBPACK_IMPORTED_MODULE_0__.findAndDestroyFrom)(bomb_id, this.bombs);
    try {
      if (this.sfxExplosion) this.sfxExplosion.play();
    } catch (_) {}

    // Render Blast:
    for (let cell of blastedCells) {
      this.blasts.add(new _entities_fire_blast__WEBPACK_IMPORTED_MODULE_6__["default"](this.game, cell));
    }
    ;

    // Destroy Tiles:
    for (let cell of blastedCells) {
      if (!cell.destroyed) {
        continue;
      }
      this.map.putTile(this.blockLayer.layer.properties.empty, cell.col, cell.row, this.blockLayer);
    }
    ;

    // Add Spoils:
    for (let cell of blastedCells) {
      if (!cell.destroyed) {
        continue;
      }
      if (!cell.spoil) {
        continue;
      }
      this.spoils.add(new _entities_spoil__WEBPACK_IMPORTED_MODULE_5__["default"](this.game, cell.spoil));
    }
    ;
  }
  onSpoilWasPicked({
    player_id,
    spoil_id,
    spoil_type
  }) {
    if (player_id === this.player.id) {
      this.player.pickSpoil(spoil_type);
    }
    (0,_utils_utils__WEBPACK_IMPORTED_MODULE_0__.findAndDestroyFrom)(spoil_id, this.spoils);
  }
  onShowBones({
    player_id,
    col,
    row
  }) {
    this.bones.add(new _entities_bone__WEBPACK_IMPORTED_MODULE_7__["default"](this.game, col, row));
    (0,_utils_utils__WEBPACK_IMPORTED_MODULE_0__.findAndDestroyFrom)(player_id, this.enemies);
  }
  onMatchSummary({
    summary,
    reason
  }) {
    try {
      if (window.UK01Touch && window.UK01Touch.hide) window.UK01Touch.hide();
    } catch (_) {}
    try {
      clientSocket.emit('leave game');
    } catch (_) {}
    this.state.start('Win', true, false, {
      mode: 'horde',
      summary,
      reason: reason || 'horde_end'
    });
  }
  onPlayerWin(payload) {
    try {
      if (window.UK01Touch && window.UK01Touch.hide) window.UK01Touch.hide();
    } catch (_) {}
    clientSocket.emit('leave game');

    // Backward compatible: server may send a skin string or { skin, player_id, reason }
    const winner_skin = payload && payload.skin ? payload.skin : payload;
    const reason = payload && payload.reason ? payload.reason : null;
    this.state.start('Win', true, false, {
      skin: winner_skin,
      reason
    });
  }
  onPlayerDisconnect({
    player_id
  }) {
    (0,_utils_utils__WEBPACK_IMPORTED_MODULE_0__.findAndDestroyFrom)(player_id, this.enemies);
    if (this.enemies.children.length >= 1) {
      return;
    }
    this.onPlayerWin();
  }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Play);

/***/ },

/***/ "./client/js/states/preload.js"
/*!*************************************!*\
  !*** ./client/js/states/preload.js ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
class Preload extends Phaser.State {
  preload() {
    // Debug loader issues on mobile (use ?debug=1)
    try {
      this.load.onFileError.add((key, file) => {
        try {
          if (window.UK01Log) window.UK01Log(`LOAD_ERR key=${key} url=${file && file.url}`);
        } catch (_) {}
      });
      this.load.onFileComplete.add((progress, key) => {
        try {
          if (window.UK01Loading) window.UK01Loading.set(progress, `載入中：${key}`);
          if (window.UK01Log && progress < 100) window.UK01Log(`LOAD ${progress}% ${key}`);
        } catch (_) {}
      });
      this.load.onLoadComplete.add(() => {
        try {
          if (window.UK01Loading) window.UK01Loading.set(100, '完成');
          if (window.UK01Log) window.UK01Log('LOAD_DONE');
        } catch (_) {}
      });
    } catch (_) {}
    // Menu:
    this.load.image('main_menu', 'images/menu/main_menu.png');
    this.load.image('slot_backdrop', 'images/menu/slot_backdrop.png');
    this.load.spritesheet('buttons', 'images/menu/buttons.png', 200, 75);
    this.load.spritesheet('check_icon', 'images/menu/accepts.png', 75, 75);
    this.load.spritesheet('list_icon', 'images/menu/game_enter.png', 75, 75);
    this.load.image('hot_map_preview', 'images/menu/hot_map_preview.png');
    this.load.image('cold_map_preview', 'images/menu/cold_map_preview.png');
    // cache-bust to ensure clients fetch the updated preview
    this.load.image('arena_map_preview', 'images/menu/arena_map_preview.png?v=2');
    // cache-bust to ensure clients fetch the updated preview
    this.load.image('open_map_preview', 'images/menu/open_map_preview.png?v=3');
    this.load.image('rune_lab_preview', 'images/menu/rune_lab_preview.png?v=1');
    this.load.image('mirror_temple_preview', 'images/menu/mirror_temple_preview.png?v=1');
    this.load.image('trap_garden_preview', 'images/menu/trap_garden_preview.png?v=1');
    this.load.image('prev', 'images/menu/left_arrow.png');
    this.load.image('next', 'images/menu/right_arrow.png');

    // Map:
    this.load.image('tiles', 'maps/tileset.png');
    this.load.tilemap('hot_map', 'maps/hot_map.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('cold_map', 'maps/cold_map.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('arena_map', 'maps/arena_map.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('open_map', 'maps/open_map.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('rune_lab', 'maps/rune_lab.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('mirror_temple', 'maps/mirror_temple.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('trap_garden', 'maps/trap_garden.json', null, Phaser.Tilemap.TILED_JSON);

    // Game:
    this.load.spritesheet('explosion_center', 'images/game/explosion_center.png', 35, 35);
    this.load.spritesheet('explosion_horizontal', 'images/game/explosion_horizontal.png', 35, 35);
    this.load.spritesheet('explosion_vertical', 'images/game/explosion_vertical.png', 35, 35);
    this.load.spritesheet('explosion_up', 'images/game/explosion_up.png', 35, 35);
    this.load.spritesheet('explosion_right', 'images/game/explosion_right.png', 35, 35);
    this.load.spritesheet('explosion_down', 'images/game/explosion_down.png', 35, 35);
    this.load.spritesheet('explosion_left', 'images/game/explosion_left.png', 35, 35);
    this.load.spritesheet('spoil_tileset', 'images/game/spoil_tileset.png', 35, 35);
    this.load.spritesheet('bone_tileset', 'images/game/bone_tileset.png', 35, 35);
    this.load.spritesheet('bomb_tileset', 'images/game/bombs.png', 35, 35);
    this.load.image('speed_up_bonus', 'images/game/speed_up_bonus.png');
    this.load.image('speed_up_no_bonus', 'images/game/speed_up_no_bonus.png');
    this.load.image('delay_up_bonus', 'images/game/delay_up_bonus.png');
    this.load.image('delay_up_no_bonus', 'images/game/delay_up_no_bonus.png');
    this.load.image('power_up_bonus', 'images/game/power_up_bonus.png');
    this.load.image('placeholder_power', 'images/game/placeholder_power.png');
    this.load.image('placeholder_speed', 'images/game/placeholder_speed.png');
    this.load.image('placeholder_time', 'images/game/placeholder_time.png');

    // Special tiles FX
    this.load.spritesheet('portal_fx', 'images/game/portal_fx.png', 35, 35);
    this.load.spritesheet('speed_fx', 'images/game/speed_fx.png', 35, 35);
    this.load.image('ghost_icon', 'images/game/ghost_icon.png');

    // SFX / BGM (mobile may require user gesture to unlock audio)
    this.load.audio('sfx_portal', ['sfx/portal.wav']);
    this.load.audio('sfx_speed', ['sfx/speed.wav']);
    this.load.audio('sfx_explosion', ['sfx/explosion.wav']);
    this.load.audio('sfx_death', ['sfx/death.wav']);
    this.load.audio('bgm_main', ['sfx/bgm.wav']);

    // Cosmetics (paper-doll overlays)
    // Cache-bust so clients reliably see updated PNGs
    const COS_V = '20260206_14';
    const cos = p => `images/game/cosmetics/${p}?v=${COS_V}`;

    // Character bases
    this.load.image('cosmetic_base', cos('base.png'));
    this.load.image('cosmetic_char_1', cos('characters/char_1_pink_happy.png'));
    this.load.image('cosmetic_char_2', cos('characters/char_2_pink_cry.png'));
    this.load.image('cosmetic_char_3', cos('characters/char_3_yellow_happy.png'));
    this.load.image('cosmetic_char_4', cos('characters/char_4_yellow_cry.png'));
    this.load.image('cosmetic_char_5', cos('characters/char_5_blue_happy.png'));
    this.load.image('cosmetic_char_6', cos('characters/char_6_blue_cry.png'));
    this.load.image('cosmetic_char_7', cos('characters/char_7_mint_happy.png'));
    this.load.image('cosmetic_char_8', cos('characters/char_8_mint_cry.png'));
    // keep same footprint as original player sprite so children won't get culled
    this.load.image('cosmetic_transparent', cos('transparent35.png'));
    for (let i = 1; i <= 10; i++) {
      this.load.image(`cosmetic_hat_${i}`, cos(`hat_${i}.png`));
      this.load.image(`cosmetic_hair_${i}`, cos(`hair_${i}.png`));
      this.load.image(`cosmetic_outfit_${i}`, cos(`outfit_${i}.png`));
    }
    for (let i = 1; i <= 4; i++) {
      this.load.image(`cosmetic_face_${i}`, cos(`face_${i}.png`));
    }
    for (let i = 1; i <= 6; i++) {
      this.load.image(`cosmetic_pattern_${i}`, cos(`pattern_${i}.png`));
    }

    // Skins:
    this.load.image('bomberman_head_blank', 'images/game/chars/0-face.png');
    this.load.image('bomberman_head_Theodora', 'images/game/chars/1-face.png');
    this.load.image('bomberman_head_Ringo', 'images/game/chars/2-face.png');
    this.load.image('bomberman_head_Jeniffer', 'images/game/chars/3-face.png');
    this.load.image('bomberman_head_Godard', 'images/game/chars/4-face.png');
    this.load.image('bomberman_head_Biarid', 'images/game/chars/5-face.png');
    this.load.image('bomberman_head_Solia', 'images/game/chars/6-face.png');
    this.load.image('bomberman_head_Kedan', 'images/game/chars/7-face.png');
    this.load.image('bomberman_head_Nigob', 'images/game/chars/8-face.png');
    this.load.image('bomberman_head_Baradir', 'images/game/chars/9-face.png');
    this.load.image('bomberman_head_Raviel', 'images/game/chars/10-face.png');
    this.load.image('bomberman_head_Valpo', 'images/game/chars/11-face.png');
    this.load.spritesheet('bomberman_Theodora', 'images/game/chars/1-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Ringo', 'images/game/chars/2-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Jeniffer', 'images/game/chars/3-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Godard', 'images/game/chars/4-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Biarid', 'images/game/chars/5-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Solia', 'images/game/chars/6-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Kedan', 'images/game/chars/7-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Nigob', 'images/game/chars/8-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Baradir', 'images/game/chars/9-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Raviel', 'images/game/chars/10-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Valpo', 'images/game/chars/11-preview.png', 32, 32);
  }
  create() {
    // Hide loading overlay
    try {
      if (window.UK01Loading) window.UK01Loading.done();
    } catch (_) {}
    this.state.start('Menu');
  }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Preload);

/***/ },

/***/ "./client/js/states/select_map.js"
/*!****************************************!*\
  !*** ./client/js/states/select_map.js ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _utils_constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/constants */ "./client/js/utils/constants.js");
/* harmony import */ var _helpers_elements__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../helpers/elements */ "./client/js/helpers/elements.js");


class SelectMap extends Phaser.State {
  init() {
    this.slider = new phaseSlider(this);
  }
  create() {
    // Select map is handled by HTML overlay now.
    // Keep background to avoid blank canvas and immediately return to Menu.
    let background = this.add.image(this.game.world.centerX, this.game.world.centerY, 'main_menu');
    background.anchor.setTo(0.5);
    try {
      if (window.UK01Menu && window.UK01Menu.showMaps) {
        window.UK01Menu.showMaps();
      }
    } catch (_) {}

    // no-op
  }
  confirmStageSelection() {
    let map_name = _utils_constants__WEBPACK_IMPORTED_MODULE_0__.AVAILABLE_MAPS[this.slider.getCurrentIndex()];
    clientSocket.emit('create game', map_name, this.joinToNewGame.bind(this));
  }
  joinToNewGame(payload) {
    // server callback may return either a plain id string or an object { game_id }
    if (payload && payload.error) {
      // Minimal UX: browser alert (works in Phaser environment)
      alert(payload.message || payload.error);
      return;
    }
    const game_id = payload && payload.game_id ? payload.game_id : payload;
    this.state.start('PendingGame', true, false, game_id);
  }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (SelectMap);

/***/ },

/***/ "./client/js/states/win.js"
/*!*********************************!*\
  !*** ./client/js/states/win.js ***!
  \*********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _helpers_elements__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../helpers/elements */ "./client/js/helpers/elements.js");

class Win extends Phaser.State {
  init(payload) {
    // payload may be a string skin or { skin, reason, summary, mode }
    if (payload && typeof payload === 'object') {
      this.skin = payload.skin;
      this.reason = payload.reason;
      this.summary = payload.summary || null;
      this.mode = payload.mode || null;
    } else {
      this.skin = payload;
      this.reason = null;
      this.summary = null;
      this.mode = null;
    }
  }
  create() {
    // Hide touch overlay on end screen
    try {
      if (window.UK01Touch && window.UK01Touch.hide) window.UK01Touch.hide();
    } catch (_) {}

    // Stop BGM on end screen
    try {
      const g = this.game;
      if (g && g._bgm && g._bgm.stop) g._bgm.stop();
    } catch (_) {}
    new _helpers_elements__WEBPACK_IMPORTED_MODULE_0__.Text({
      game: this.game,
      x: this.game.world.centerX,
      y: this.game.world.centerY,
      text: this.winnerText(),
      style: {
        font: '30px Areal',
        fill: '#FFFFFF'
      }
    });

    // Mobile-friendly: tap anywhere to return
    try {
      this.game.input.onTap.addOnce(() => this.returnToMenu());
    } catch (_) {}

    // Also allow pointer click
    try {
      this.game.input.onDown.addOnce(() => this.returnToMenu());
    } catch (_) {}

    // Auto return after a short delay (avoid getting stuck)
    try {
      this.game.time.events.add(3500, () => this.returnToMenu());
    } catch (_) {}
  }
  update() {
    if (this.game.input.keyboard.isDown(Phaser.Keyboard.ENTER)) {
      this.returnToMenu();
    }
  }
  returnToMenu() {
    this.state.start('Menu');
  }
  winnerText() {
    if (this.summary && (this.summary.mode === 'horde' || this.mode === 'horde')) {
      const s = this.summary;
      const dur = s.durationMs != null ? (s.durationMs / 1000).toFixed(1) : null;
      const teamKills = s.teamKills != null ? s.teamKills : 0;
      const top = s.perPlayer && s.perPlayer[0] ? s.perPlayer[0] : null;
      const topLine = top ? `${top.displayName || top.skin}: ${(top.survivalMs / 1000).toFixed(1)}s, ${top.kills} kills` : '';
      return `HORDE ended. Time: ${dur || '?'}s  Team Kills: ${teamKills}\n${topLine}\nTap to return to main menu.`;
    }
    if (this.skin) {
      const why = this.reason ? ` (reason: ${this.reason})` : '';
      return `Player: "${this.skin}" won!${why} Tap to return to main menu.`;
    }
    return 'Opponent left! Tap to return to main menu.';
  }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Win);

/***/ },

/***/ "./client/js/utils/constants.js"
/*!**************************************!*\
  !*** ./client/js/utils/constants.js ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AVAILABLE_MAPS: () => (/* binding */ AVAILABLE_MAPS),
/* harmony export */   DELAY: () => (/* binding */ DELAY),
/* harmony export */   EXPLOSION_TIME: () => (/* binding */ EXPLOSION_TIME),
/* harmony export */   GHOST: () => (/* binding */ GHOST),
/* harmony export */   GHOST_DURATION_MS: () => (/* binding */ GHOST_DURATION_MS),
/* harmony export */   INITIAL_DELAY: () => (/* binding */ INITIAL_DELAY),
/* harmony export */   INITIAL_POWER: () => (/* binding */ INITIAL_POWER),
/* harmony export */   INITIAL_SPEED: () => (/* binding */ INITIAL_SPEED),
/* harmony export */   KICK: () => (/* binding */ KICK),
/* harmony export */   LAYER: () => (/* binding */ LAYER),
/* harmony export */   MAX_SPEED: () => (/* binding */ MAX_SPEED),
/* harmony export */   MIN_DELAY: () => (/* binding */ MIN_DELAY),
/* harmony export */   PING: () => (/* binding */ PING),
/* harmony export */   POWER: () => (/* binding */ POWER),
/* harmony export */   REMOTE: () => (/* binding */ REMOTE),
/* harmony export */   SHIELD: () => (/* binding */ SHIELD),
/* harmony export */   SHIELD_DURATION_MS: () => (/* binding */ SHIELD_DURATION_MS),
/* harmony export */   SPEED: () => (/* binding */ SPEED),
/* harmony export */   STEP_DELAY: () => (/* binding */ STEP_DELAY),
/* harmony export */   STEP_POWER: () => (/* binding */ STEP_POWER),
/* harmony export */   STEP_SPEED: () => (/* binding */ STEP_SPEED),
/* harmony export */   TILESET: () => (/* binding */ TILESET),
/* harmony export */   TILE_PORTAL: () => (/* binding */ TILE_PORTAL),
/* harmony export */   TILE_SIZE: () => (/* binding */ TILE_SIZE),
/* harmony export */   TILE_SPEED_FLOOR: () => (/* binding */ TILE_SPEED_FLOOR)
/* harmony export */ });
const AVAILABLE_MAPS = ['hot_map', 'cold_map', 'arena_map', 'open_map', 'rune_lab', 'mirror_temple', 'trap_garden'];
const TILESET = 'tiles';
const LAYER = 'Blocks';
const TILE_SIZE = 35;

// Special floor tiles (must not be in collisionTiles)
const TILE_PORTAL = 2;
const TILE_SPEED_FLOOR = 3;
const EXPLOSION_TIME = 2000;
const PING = 100;
const SPEED = 0;
const POWER = 1;
const DELAY = 2;
const SHIELD = 3;
const REMOTE = 4;
const KICK = 5;
const GHOST = 6;
const SHIELD_DURATION_MS = 1500;
const GHOST_DURATION_MS = 4500;
const INITIAL_SPEED = 150;
const STEP_SPEED = 50;
const MAX_SPEED = 350;
const INITIAL_DELAY = 2000;
const STEP_DELAY = 500;
const MIN_DELAY = 500;
const INITIAL_POWER = 1;
const STEP_POWER = 1;

/***/ },

/***/ "./client/js/utils/utils.js"
/*!**********************************!*\
  !*** ./client/js/utils/utils.js ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   findAndDestroyFrom: () => (/* binding */ findAndDestroyFrom),
/* harmony export */   findFrom: () => (/* binding */ findFrom)
/* harmony export */ });
const findFrom = function (id, entities) {
  for (let entity of entities.children) {
    if (entity.id !== id) {
      continue;
    }
    return entity;
  }
  return null;
};
const findAndDestroyFrom = function (id, entities) {
  let entity = findFrom(id, entities);
  if (!entity) {
    return;
  }
  entity.destroy();
};

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Check if module exists (development only)
/******/ 		if (__webpack_modules__[moduleId] === undefined) {
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**************************!*\
  !*** ./client/js/app.js ***!
  \**************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _states_boot__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./states/boot */ "./client/js/states/boot.js");
/* harmony import */ var _states_preload__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./states/preload */ "./client/js/states/preload.js");
/* harmony import */ var _states_menu__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./states/menu */ "./client/js/states/menu.js");
/* harmony import */ var _states_select_map__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./states/select_map */ "./client/js/states/select_map.js");
/* harmony import */ var _states_pending_game__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./states/pending_game */ "./client/js/states/pending_game.js");
/* harmony import */ var _states_play__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./states/play */ "./client/js/states/play.js");
/* harmony import */ var _states_win__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./states/win */ "./client/js/states/win.js");







class Game extends Phaser.Game {
  constructor() {
    // Use a fixed logical resolution; CSS + ScaleManager will scale to fit mobile screens.
    // Map size is 28x18 tiles at 35px => 980x630.
    super(980, 630, Phaser.AUTO, 'game-container');

    // Tell Phaser to use setTimeOut even if RAF(request animation frame) is available.
    this.config['forceSetTimeOut'] = true;
    this.state.add('Boot', _states_boot__WEBPACK_IMPORTED_MODULE_0__["default"]);
    this.state.add('Preload', _states_preload__WEBPACK_IMPORTED_MODULE_1__["default"]);
    this.state.add('Menu', _states_menu__WEBPACK_IMPORTED_MODULE_2__["default"]);
    this.state.add('SelectMap', _states_select_map__WEBPACK_IMPORTED_MODULE_3__["default"]);
    this.state.add('PendingGame', _states_pending_game__WEBPACK_IMPORTED_MODULE_4__["default"]);
    this.state.add('Play', _states_play__WEBPACK_IMPORTED_MODULE_5__["default"]);
    this.state.add('Win', _states_win__WEBPACK_IMPORTED_MODULE_6__["default"]);
    this.state.start('Boot');
  }
}

// keep a reference for HTML overlay to control states
window.__phaserGame = new Game();
})();

/******/ })()
;
//# sourceMappingURL=bundle.js.map
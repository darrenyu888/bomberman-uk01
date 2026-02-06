import { findFrom, findAndDestroyFrom } from '../utils/utils';
import { TILESET, LAYER, TILE_SIZE, TILE_PORTAL, TILE_SPEED_FLOOR } from '../utils/constants';

import Player from '../entities/player';
import EnemyPlayer from '../entities/enemy_player';
import Bomb from '../entities/bomb';
import Spoil from '../entities/spoil';
import FireBlast from '../entities/fire_blast';
import Bone from '../entities/bone';

class Play extends Phaser.State {
  init(game) {
    this.currentGame = game
  }

  create() {
    this.createMap();
    this.createPlayers();
    this.setEventHandlers();

    // Keep player in view on mobile / resized canvas
    if (this.player) {
      this.game.camera.follow(this.player);
    }

    this.createTouchControls();

    // SFX
    this.sfxPortal = this.game.add.audio('sfx_portal');
    this.sfxSpeed = this.game.add.audio('sfx_speed');

    this.game.time.events.loop(400 , this.stopAnimationLoop.bind(this));
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

    this.map.addTilesetImage(TILESET);

    this.blockLayer = this.map.createLayer(LAYER);
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

        if (idx === TILE_PORTAL) {
          this.portalCells.push({ col: c, row: r });
        } else if (idx === TILE_SPEED_FLOOR) {
          this.speedCells.add(`${c},${r}`);
        }
      }
    }

    // Special tiles visuals (animated spritesheets)
    // NOTE: We keep them as a separate group so they sit above the map.
    for (const p of this.portalCells) {
      const x = p.col * TILE_SIZE;
      const y = p.row * TILE_SIZE;
      const s = this.game.add.sprite(x, y, 'portal_fx');
      s.alpha = 0.95;
      s.blendMode = Phaser.blendModes.ADD;
      s.animations.add('spin', [0, 1, 2, 3, 4, 5], 10, true);
      s.animations.play('spin');
      this.specialFx.add(s);
    }

    for (const key of this.speedCells) {
      const [c, r] = key.split(',').map(Number);
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;
      const s = this.game.add.sprite(x, y, 'speed_fx');
      s.alpha = 0.75;
      s.animations.add('flow', [0, 1, 2, 3, 4, 5], 12, true);
      s.animations.play('flow');
      this.specialFx.add(s);
    }

    this.player  = null;
    this.bones   = this.game.add.group();
    this.bombs   = this.game.add.group();
    this.spoils  = this.game.add.group();
    this.blasts  = this.game.add.group();
    this.enemies = this.game.add.group();

    this.game.physics.arcade.enable(this.blockLayer);
  }

  createPlayers() {
    for (let player of Object.values(this.currentGame.players)) {
      let setup = {
        game:   this.game,
        id:     player.id,
        spawn:  player.spawn,
        skin:   player.skin
      }

      if (player.id === clientSocket.id) {
        this.player = new Player(setup);
      } else {
        this.enemies.add(new EnemyPlayer(setup))
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
  }

  onPlayerVsSpoil(player, spoil) {
    clientSocket.emit('pick up spoil', { spoil_id: spoil.id });
    spoil.kill();
  }

  onPlayerVsBlast(player, blast) {
    if (!player.alive) return;
    // Shield powerup: brief invulnerability
    if (player.isShielded && player.isShielded()) return;

    clientSocket.emit('player died', { col: player.currentCol(), row: player.currentRow() });
    player.becomesDead()
  }

  onMovePlayer({ player_id, x, y }) {
    let enemy = findFrom(player_id, this.enemies);
    if (!enemy) { return }

    enemy.goTo({ x: x, y: y })
  }

  onPlayerVsBomb(player, bomb) {
    if (!player || !bomb) return;
    if (!player.hasKick) return;

    // Determine movement direction intent (keyboard + touch)
    const left  = player.leftKey.isDown  || (player.aKey && player.aKey.isDown) || player.touchLeft;
    const right = player.rightKey.isDown || (player.dKey && player.dKey.isDown) || player.touchRight;
    const up    = player.upKey.isDown    || (player.wKey && player.wKey.isDown) || player.touchUp;
    const down  = player.downKey.isDown  || (player.sKey && player.sKey.isDown) || player.touchDown;

    let dir = null;
    if (left) dir = 'left';
    else if (right) dir = 'right';
    else if (up) dir = 'up';
    else if (down) dir = 'down';

    if (!dir) return;

    // Throttle: avoid spamming server every physics tick
    const now = this.game.time.now;
    if (!player._lastKickAt) player._lastKickAt = 0;
    if (now - player._lastKickAt < 110) return;
    player._lastKickAt = now;

    clientSocket.emit('kick bomb', { bomb_id: bomb.id, dir });
  }

  onMoveBomb({ bomb_id, col, row }) {
    const b = findFrom(bomb_id, this.bombs);
    if (!b) return;

    const x = (col * TILE_SIZE) + TILE_SIZE / 2;
    const y = (row * TILE_SIZE) + TILE_SIZE / 2;
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

    // Only show on touch devices
    if (!this.game.device || !this.game.device.touch) return;

    const g = this.game.add.group();
    g.fixedToCamera = true;
    g.cameraOffset.setTo(0, 0);

    const mkBtn = ({ x, y, r = 44, label, onDown, onUp, fill = 0x111111, alpha = 0.35, stroke = 0xffffff, strokeAlpha = 0.22 }) => {
      const btn = this.game.add.graphics(0, 0);
      btn.beginFill(fill, alpha);
      btn.lineStyle(3, stroke, strokeAlpha);
      btn.drawCircle(0, 0, r * 2);
      btn.endFill();
      btn.x = x;
      btn.y = y;

      const t = this.game.add.text(0, 0, label, { font: '26px Arial', fill: '#ffffff' });
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

    // Virtual joystick (4-direction snap)
    const baseX = 125;
    const baseY = h - 160;
    const baseR = 70;
    const knobR = 36;

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
        if (dx > 0) this.player.touchRight = true;
        else this.player.touchLeft = true;
        knob.x = baseX + Math.max(-baseR + knobR, Math.min(baseR - knobR, dx));
        knob.y = baseY;
      } else {
        if (dy > 0) this.player.touchDown = true;
        else this.player.touchUp = true;
        knob.x = baseX;
        knob.y = baseY + Math.max(-baseR + knobR, Math.min(baseR - knobR, dy));
      }
    };

    const onPointer = (pointer) => {
      const dx = pointer.x - baseX;
      const dy = pointer.y - baseY;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const max = baseR - knobR;
      const clamped = Math.min(max, len);
      const ndx = (dx / len) * clamped;
      const ndy = (dy / len) * clamped;
      setDirFromVector(ndx, ndy);
    };

    base.events.onInputDown.add((sprite, pointer) => onPointer(pointer));
    base.events.onInputUp.add(() => { resetDir(); knob.x = baseX; knob.y = baseY; });
    base.events.onInputOut.add(() => { resetDir(); knob.x = baseX; knob.y = baseY; });

    // Track drag/move globally while pressed
    this.game.input.addMoveCallback((pointer) => {
      if (!pointer.isDown) return;
      onPointer(pointer);
    }, this);

    // Bomb button (right side)
    mkBtn({
      x: w - 110,
      y: h - 140,
      r: 54,
      label: '💣',
      fill: 0x7a1cff,
      alpha: 0.32,
      stroke: 0x00e5ff,
      strokeAlpha: 0.35,
      onDown: () => (this.player.touchBomb = true),
      onUp: () => (this.player.touchBomb = false),
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

    const col = Math.floor(this.player.body.position.x / TILE_SIZE);
    const row = Math.floor(this.player.body.position.y / TILE_SIZE);

    // Speed floor
    const onSpeed = this.speedCells.has(`${col},${row}`);
    this.player.tileSpeedMultiplier = onSpeed ? 1.65 : 1.0;

    if (!this.player._wasOnSpeed) this.player._wasOnSpeed = false;
    if (onSpeed && !this.player._wasOnSpeed) {
      try { if (this.sfxSpeed) this.sfxSpeed.play(); } catch (_) {}
    }
    this.player._wasOnSpeed = onSpeed;

    // Portal (pair portals in order: 0<->1, 2<->3, ...)
    if (this.portalCells.length >= 2) {
      const now = this.game.time.now;
      if (!this.player._lastPortalAt) this.player._lastPortalAt = 0;

      const portalIndex = this.portalCells.findIndex(p => p.col === col && p.row === row);
      if (portalIndex >= 0 && now - this.player._lastPortalAt > 900) {
        const pairIndex = (portalIndex % 2 === 0) ? portalIndex + 1 : portalIndex - 1;
        const target = this.portalCells[pairIndex];
        if (target) {
          // Teleport to tile center
          this.player.x = target.col * TILE_SIZE;
          this.player.y = target.row * TILE_SIZE;
          this.player.body.velocity.set(0);
          this.player.body.reset(this.player.x, this.player.y);
          this.player.prevPosition = { x: this.player.x, y: this.player.y };
          this.player._lastPortalAt = now;

          try { if (this.sfxPortal) this.sfxPortal.play(); } catch (_) {}
        }
      }
    }
  }

  onShowBomb({ bomb_id, col, row }) {
    this.bombs.add(new Bomb(this.game, bomb_id, col, row));
  }

  onDetonateBomb({ bomb_id, blastedCells }) {
    // Remove Bomb:
    findAndDestroyFrom(bomb_id, this.bombs)

    // Render Blast:
    for (let cell of blastedCells) {
      this.blasts.add(new FireBlast(this.game, cell));
    };

    // Destroy Tiles:
    for (let cell of blastedCells) {
      if (!cell.destroyed) { continue }

      this.map.putTile(this.blockLayer.layer.properties.empty, cell.col, cell.row, this.blockLayer);
    };

    // Add Spoils:
    for (let cell of blastedCells) {
      if (!cell.destroyed) { continue }
      if (!cell.spoil) { continue }

      this.spoils.add(new Spoil(this.game, cell.spoil));
    };
  }

  onSpoilWasPicked({ player_id, spoil_id, spoil_type }){
    if (player_id === this.player.id){
      this.player.pickSpoil(spoil_type)
    }

    findAndDestroyFrom(spoil_id, this.spoils)
  }

  onShowBones({ player_id, col, row }) {
    this.bones.add(new Bone(this.game, col, row));

    findAndDestroyFrom(player_id, this.enemies)
  }

  onPlayerWin(winner_skin) {
    clientSocket.emit('leave game');

    this.state.start('Win', true, false, winner_skin);
  }

  onPlayerDisconnect({ player_id }) {
    findAndDestroyFrom(player_id, this.enemies);

    if (this.enemies.children.length >= 1) { return }

    this.onPlayerWin()
  }
}

export default Play;

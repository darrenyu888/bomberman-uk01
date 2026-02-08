export default class Info {

  constructor({ game, player }) {
    this.game = game;
    this.player = player;

    this.style    = { font: '14px Arial', fill: '#ffffff', align: 'left' }
    this.redStyle = { font: '30px Arial', fill: '#ff0044', align: 'center' };

    // HUD group (sticks to camera)
    this.hud = this.game.add.group();
    this.hud.fixedToCamera = true;

    let bootsIcon  = new Phaser.Image(this.game, 5, 2, 'placeholder_speed');
    this.speedText = new Phaser.Text(this.game, 35, 7, this.speedLabel(), this.style);
    bootsIcon.addChild(this.speedText)
    this.hud.add(bootsIcon);

    let powerIcon  = new Phaser.Image(this.game, 110, 2, 'placeholder_power');
    this.powerText = new Phaser.Text(this.game, 35, 7, this.powerLabel(), this.style);
    powerIcon.addChild(this.powerText)
    this.hud.add(powerIcon);

    let delayIcon  = new Phaser.Image(this.game, 215, 2, 'placeholder_time');
    this.delayText = new Phaser.Text(this.game, 35, 7, this.delayLabel(), this.style);
    delayIcon.addChild(this.delayText)
    this.hud.add(delayIcon);

    // Lives
    let lifeIcon = new Phaser.Image(this.game, 320, 2, 'placeholder_power');
    lifeIcon.alpha = 0.7;
    this.lifeText = new Phaser.Text(this.game, 35, 7, this.lifeLabel(), this.style);
    lifeIcon.addChild(this.lifeText);
    this.hud.add(lifeIcon);

    // Bomb capacity + mine ammo (compact)
    let bombIcon = new Phaser.Image(this.game, 425, 2, 'placeholder_time');
    bombIcon.alpha = 0.6;
    this.bombText = new Phaser.Text(this.game, 35, 7, this.bombLabel(), this.style);
    bombIcon.addChild(this.bombText);
    this.hud.add(bombIcon);

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
    if (this.lifeText) this.lifeText.text = this.lifeLabel();
    if (this.bombText) this.bombText.text = this.bombLabel();
  }

  refreshLives() {
    if (this.lifeText) this.lifeText.text = this.lifeLabel();
  }

  refreshBombs() {
    if (this.bombText) this.bombText.text = this.bombLabel();
  }

  showGhost(ghostUntilMs) {
    if (!this.ghostIcon) return;

    this.ghostIcon.visible = true;

    if (this._ghostTimer) {
      try { this.game.time.events.remove(this._ghostTimer); } catch (_) {}
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
      try { this.game.time.events.remove(this._ghostTimer); } catch (_) {}
      this._ghostTimer = null;
    }
  }

  showDeadInfo() {
    this.deadText.visible = true
  }

  speedLabel() {
    return this.player.speed
  }

  powerLabel() {
    return `x ${this.player.power}`
  }

  delayLabel() {
    return `${this.player.delay / 1000} sec.`
  }

  lifeLabel() {
    return `x ${this.player.lives || 0}`
  }

  bombLabel() {
    const mb = this.player.maxBombs || 1;
    const mine = this.player.mineAmmo || 0;
    return `${mb}B ${mine}M`;
  }
}

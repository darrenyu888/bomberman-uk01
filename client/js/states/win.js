import { Text } from '../helpers/elements';

class Win extends Phaser.State {

  init(payload) {
    // payload may be a string skin or { skin, reason }
    if (payload && typeof payload === 'object') {
      this.skin = payload.skin;
      this.reason = payload.reason;
    } else {
      this.skin = payload;
      this.reason = null;
    }
  }

  create() {
    // Hide touch overlay on end screen
    try { if (window.UK01Touch && window.UK01Touch.hide) window.UK01Touch.hide(); } catch (_) {}

    new Text({
      game: this.game,
      x: this.game.world.centerX,
      y: this.game.world.centerY,
      text: this.winnerText(),
      style: {
        font: '30px Areal',
        fill: '#FFFFFF'
      }
    })

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
    if( this.game.input.keyboard.isDown(Phaser.Keyboard.ENTER) ) {
      this.returnToMenu();
    }
  }

  returnToMenu() {
    this.state.start('Menu');
  }

  winnerText() {
    if (this.skin) {
      const why = this.reason ? ` (reason: ${this.reason})` : '';
      return `Player: "${this.skin}" won!${why} Tap to return to main menu.`
    }

    return 'Opponent left! Tap to return to main menu.'
  }
}

export default Win;

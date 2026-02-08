import { Text } from '../helpers/elements';

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
    try { if (window.UK01Touch && window.UK01Touch.hide) window.UK01Touch.hide(); } catch (_) {}

    // Stop BGM on end screen
    try {
      const g = this.game;
      if (g && g._bgm && g._bgm.stop) g._bgm.stop();
    } catch (_) {}

    new Text({
      game: this.game,
      x: this.game.world.centerX,
      y: this.game.world.centerY,
      text: this.winnerText(),
      style: {
        font: '30px Arial, "Noto Sans TC", "Microsoft JhengHei", sans-serif',
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
    if (this.summary && (this.summary.mode === 'horde' || this.mode === 'horde')) {
      const s = this.summary;
      const dur = (s.durationMs != null) ? (s.durationMs / 1000).toFixed(1) : null;
      const teamKills = (s.teamKills != null) ? s.teamKills : 0;
      const top = (s.perPlayer && s.perPlayer[0]) ? s.perPlayer[0] : null;
      const topLine = top ? `${top.displayName || top.skin}: ${(top.survivalMs/1000).toFixed(1)}s, ${top.kills} kills` : '';
      return `HORDE ended. Time: ${dur || '?'}s  Team Kills: ${teamKills}\n${topLine}\nTap to return to main menu.`;
    }

    if (this.skin) {
      const why = this.reason ? ` (reason: ${this.reason})` : '';
      return `Player: "${this.skin}" won!${why} Tap to return to main menu.`
    }

    return 'Opponent left! Tap to return to main menu.'
  }
}

export default Win;

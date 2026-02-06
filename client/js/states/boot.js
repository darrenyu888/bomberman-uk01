import { Text } from '../helpers/elements';

class Boot extends Phaser.State {

  create() {
    // Make the game keep reacting to messages from the server even when the game window doesn’t have focus.
    // The game pauses when I open a new tab in the same window, but does not pause when I focus on another application
    this.game.stage.disableVisibilityChange = true;

    // Responsive scaling (keep a fixed logical resolution; scale to fit viewport)
    // RESIZE mode can create large blank areas on tall mobile screens because the world is smaller than the viewport.
    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.game.scale.pageAlignHorizontally = true;
    this.game.scale.pageAlignVertically = true;

    const refresh = () => {
      try { this.game.scale.refresh(); } catch (_) {}
    };

    window.addEventListener('resize', refresh);
    refresh();

    new Text({
      game: this.game,
      x: this.game.world.centerX,
      y: this.game.world.centerY,
      text: 'Loading...',
      style: {
        font: '30px Areal',
        fill: '#FFFFFF'
      }
    })

    this.state.start('Preload');
  }

}

export default Boot;

import { Text } from '../helpers/elements';

class Boot extends Phaser.State {

  create() {
    // Make the game keep reacting to messages from the server even when the game window doesn’t have focus.
    // The game pauses when I open a new tab in the same window, but does not pause when I focus on another application
    this.game.stage.disableVisibilityChange = true;

    // Responsive scaling (mobile-friendly, no distortion)
    // Use USER_SCALE with a "cover" strategy:
    // - keep aspect ratio (no stretch)
    // - fill the screen (may crop a bit)
    this.game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
    this.game.scale.pageAlignHorizontally = true;
    this.game.scale.pageAlignVertically = true;

    const baseW = this.game.width;
    const baseH = this.game.height;

    const applyCoverScale = () => {
      const w = window.innerWidth || baseW;
      const h = window.innerHeight || baseH;
      const s = Math.max(w / baseW, h / baseH);
      try {
        this.game.scale.setUserScale(s, s);
        this.game.scale.refresh();
      } catch (_) {}
    };

    window.addEventListener('resize', applyCoverScale);
    applyCoverScale();

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

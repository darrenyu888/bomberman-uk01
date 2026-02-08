import { Text } from '../helpers/elements';

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
      try { this.game.scale.refresh(); } catch (_) {}
    };

    window.addEventListener('resize', refresh);
    refresh();

    const loadingText = new Text({
      game: this.game,
      x: this.game.world.centerX,
      y: this.game.world.centerY,
      text: 'Loading...',
      style: {
        font: '30px Arial, "Noto Sans TC", "Microsoft JhengHei", sans-serif',
        fill: '#FFFFFF'
      }
    });

    // Ensure CJK fonts are loaded before moving on; otherwise Phaser text may render as tofu.
    const startNext = () => {
      try { loadingText && loadingText.destroy && loadingText.destroy(); } catch (_) {}
      this.state.start('Preload');
    };

    try {
      if (document && document.fonts && document.fonts.load) {
        Promise.all([
          document.fonts.load('16px "Noto Sans TC"'),
          document.fonts.load('16px "Microsoft JhengHei"'),
          document.fonts.load('16px Arial'),
        ]).then(startNext).catch(startNext);
      } else {
        startNext();
      }
    } catch (_) {
      startNext();
    }

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

    // Transition to Preload happens via startNext() after fonts load.
  }

}

export default Boot;

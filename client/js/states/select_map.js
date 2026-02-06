import { AVAILABLE_MAPS } from '../utils/constants';
import { Text, Button } from '../helpers/elements';

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
    let map_name = AVAILABLE_MAPS[this.slider.getCurrentIndex()]

    clientSocket.emit('create game', map_name, this.joinToNewGame.bind(this));
  }

  joinToNewGame(payload) {
    // server callback may return either a plain id string or an object { game_id }
    if (payload && payload.error) {
      // Minimal UX: browser alert (works in Phaser environment)
      alert(payload.message || payload.error);
      return;
    }

    const game_id = (payload && payload.game_id) ? payload.game_id : payload;
    this.state.start('PendingGame', true, false, game_id);
  }
}

export default SelectMap;

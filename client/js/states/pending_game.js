import { Text, Button, TextButton, PlayerSlots } from '../helpers/elements';

class PendingGame extends Phaser.State {

  init(payload) {
    this.slotsWithPlayer = null;

    // Phaser may pass init params as a plain value (game_id) or as an object { game_id }
    this.game_id = (payload && payload.game_id) ? payload.game_id : payload;

    clientSocket.on('update game', this.displayGameInfo.bind(this));
    clientSocket.on('launch game', this.launchGame.bind(this));

    clientSocket.emit('enter pending game', { game_id: this.game_id });
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
    this.gameTitle = new Text({
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
    })
  }

  setAICount(n) {
    this.aiCount = Math.max(0, Math.min(3, n));
    if (this.aiText) this.aiText.text = `AI: ${this.aiCount}`;

    clientSocket.emit('set ai count', { count: this.aiCount });
  }

  setAIDifficulty(difficulty) {
    this.aiDifficulty = difficulty;
    if (this.aiDiffText) this.aiDiffText.text = `難度: ${this.aiDifficulty}`;

    clientSocket.emit('set ai difficulty', { difficulty: this.aiDifficulty });
  }

  displayGameInfo({ current_game }) {
    let players = Object.values(current_game.players);

    this.gameTitle.text = current_game.name

    if (this.slotsWithPlayer) {
      this.slotsWithPlayer.destroy()
    }

    this.slotsWithPlayer = new PlayerSlots({
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
    })

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

export default PendingGame;

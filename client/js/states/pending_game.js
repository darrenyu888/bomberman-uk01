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

    this.startGameButton = new TextButton({
      game: this.game,
      x: this.game.world.centerX + 105,
      y: this.game.world.centerY + 195,
      asset: 'buttons',
      callback: this.startGameAction,
      callbackContext: this,
      overFrame: 1,
      outFrame: 0,
      downFrame: 2,
      upFrame: 0,
      label: 'Start Game',
      style: {
        font: '20px Areal',
        fill: '#000000'
      }
    });

    this.startGameButton.disable()

    // Touch-friendly AI count selector (0..3)
    this.aiCount = 3;

    this.aiText = new Text({
      game: this.game,
      x: this.game.world.centerX,
      y: this.game.world.centerY + 100,
      text: `AI: ${this.aiCount}`,
      style: { font: '24px Areal', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    });

    // AI difficulty selector
    this.aiDifficulty = 'normal';

    // Place difficulty controls above AI count and keep enough horizontal spacing
    const diffY = this.game.world.centerY + 40;

    this.aiDiffText = new Text({
      game: this.game,
      x: this.game.world.centerX,
      y: diffY,
      text: `難度: ${this.aiDifficulty}`,
      style: { font: '22px Areal', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    });

    const diffStepX = 230;

    this.aiEasy = new TextButton({
      game: this.game,
      x: this.game.world.centerX - diffStepX,
      y: diffY,
      asset: 'buttons',
      callback: () => this.setAIDifficulty('easy'),
      callbackContext: this,
      overFrame: 1,
      outFrame: 0,
      downFrame: 2,
      upFrame: 0,
      label: 'Easy',
      style: { font: '20px Areal', fill: '#000000' }
    });

    this.aiNormal = new TextButton({
      game: this.game,
      x: this.game.world.centerX,
      y: diffY,
      asset: 'buttons',
      callback: () => this.setAIDifficulty('normal'),
      callbackContext: this,
      overFrame: 1,
      outFrame: 0,
      downFrame: 2,
      upFrame: 0,
      label: 'Normal',
      style: { font: '18px Areal', fill: '#000000' }
    });

    this.aiHard = new TextButton({
      game: this.game,
      x: this.game.world.centerX + diffStepX,
      y: diffY,
      asset: 'buttons',
      callback: () => this.setAIDifficulty('hard'),
      callbackContext: this,
      overFrame: 1,
      outFrame: 0,
      downFrame: 2,
      upFrame: 0,
      label: 'Hard',
      style: { font: '20px Areal', fill: '#000000' }
    });

    this.aiMinus = new TextButton({
      game: this.game,
      x: this.game.world.centerX - 120,
      y: this.game.world.centerY + 120,
      asset: 'buttons',
      callback: () => this.setAICount(this.aiCount - 1),
      callbackContext: this,
      overFrame: 1,
      outFrame: 0,
      downFrame: 2,
      upFrame: 0,
      label: '-',
      style: { font: '34px Areal', fill: '#000000' }
    });

    this.aiPlus = new TextButton({
      game: this.game,
      x: this.game.world.centerX + 120,
      y: this.game.world.centerY + 120,
      asset: 'buttons',
      callback: () => this.setAICount(this.aiCount + 1),
      callbackContext: this,
      overFrame: 1,
      outFrame: 0,
      downFrame: 2,
      upFrame: 0,
      label: '+',
      style: { font: '30px Areal', fill: '#000000' }
    });

    new TextButton({
      game: this.game,
      x: this.game.world.centerX - 105,
      y: this.game.world.centerY + 195,
      asset: 'buttons',
      callback: this.leaveGameAction,
      callbackContext: this,
      overFrame: 1,
      outFrame: 0,
      downFrame: 2,
      upFrame: 0,
      label: 'Leave Game',
      style: {
        font: '20px Areal',
        fill: '#000000'
      }
    });

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

    // Allow single-player start (useful on mobile / solo testing)
    if(players.length >= 1) {
      this.startGameButton.enable();
    } else {
      this.startGameButton.disable();
    }
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

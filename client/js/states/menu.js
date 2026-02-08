import { Text, TextButton, GameSlots } from '../helpers/elements';

class Menu extends Phaser.State {

  init() {
    this.slotsWithGame = null;

    clientSocket.on('display pending games', this.displayPendingGames.bind(this));
  }

  create() {
    // Keep the background so the canvas isn't blank behind HTML overlay
    let background = this.add.image(this.game.world.centerX, this.game.world.centerY, 'main_menu');
    background.anchor.setTo(0.5);

    // Use HTML overlay for mobile reliability
    try {
      if (window.UK01Menu && window.UK01Menu.showMenu) {
        window.UK01Menu.showMenu();
      }
    } catch (_) {}

    clientSocket.emit('enter lobby', this.displayPendingGames.bind(this));
  }

  update() {
  }

  hostGameAction() {
    clientSocket.emit('leave lobby');
    this.state.start('SelectMap');
  }

  displayPendingGames(availableGames) {
    // NOTE: That is not optimal way to preview slots,
    //       we should implement AddSlotToGroup, RemoveSlotFromGroup

    // I triying to care about readability, not about performance.
    if (this.slotsWithGame) {
      this.slotsWithGame.destroy()
    }

    this.slotsWithGame = new GameSlots({
      game: this.game,
      availableGames: availableGames,
      callback: this.joinGameAction,
      callbackContext: this,
      x: this.game.world.centerX - 220,
      y: 160,
      style: {
        font: '35px Arial, "Noto Sans TC", "Microsoft JhengHei", sans-serif',
        fill: '#efefef',
        stroke: '#ae743a',
        strokeThickness: 3
      }
    })
  }

  joinGameAction(game_id) {
    clientSocket.emit('leave lobby');
    // https://phaser.io/docs/2.6.2/Phaser.StateManager.html#start
    this.state.start('PendingGame', true, false, game_id);
  }
}

export default Menu;

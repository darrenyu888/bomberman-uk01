var { Game } = require('./entity/game');
var Bots = require('./bots');

var lobbyId = 'lobby_room';

var pendingGames = new Map();


var Lobby = {
  onEnterLobby: function (callback) {
    // this == socket
    this.join(lobbyId);

    callback( Lobby.availablePendingGames() )
  },

  onLeaveLobby: function () {
    this.leave(lobbyId);
  },

  onCreateGame: function(map_name, callback) {
    // Limit: same IP + same user (socket) can create at most 2 pending games.
    // Note: there is no auth layer, so we treat "user" as the current socket connection.
    const headers = (this.handshake && this.handshake.headers) || {};
    const xff = headers['x-forwarded-for'];
    const ip = (xff && xff.split(',')[0].trim()) || (this.handshake && this.handshake.address) || this.conn?.remoteAddress || 'unknown';

    const existingCount = [...pendingGames.values()].filter(g => g && g.creator && g.creator.ip === ip && g.creator.socketId === this.id).length;
    if (existingCount >= 2) {
      callback({ error: 'ROOM_LIMIT', message: '同一個使用者（同IP）最多同時建立 2 個房間。請先離開/刪除其中一個房間再建立新的。' });
      return;
    }

    var newGame = new Game({ map_name: map_name });
    // track creator for rate-limiting
    newGame.creator = { ip, socketId: this.id, createdAt: Date.now() };

    pendingGames.set(newGame.id, newGame);

    Lobby.updateLobbyGames()

    callback({ game_id: newGame.id });
  },

  onEnterPendingGame: function ({ game_id }) {
    let current_game = pendingGames.get(game_id);

    if (!current_game) {
      console.warn('enter pending game: unknown game_id', game_id);
      return;
    }

    this.join(current_game.id);

    // NOTE: We save current_game_id inside Socket connection.
    //       We should knew it on disconnect
    this.socket_game_id = current_game.id;

    current_game.addPlayer(this.id);

    // Auto-fill with server-side bots up to max players (Normal difficulty)
    if (!current_game.isFull()) {
      Bots.ensureBotsInPendingGame(current_game);
    }

    if ( current_game.isFull() ){
      Lobby.updateLobbyGames();
    }

    Lobby.updateCurrentGame(current_game)
  },

  onSetAICount: function({ count }) {
    let current_game = pendingGames.get(this.socket_game_id);
    if (!current_game) return;

    Bots.setDesiredBots(current_game, count);
    Bots.ensureBotsInPendingGame(current_game);
    Lobby.updateCurrentGame(current_game);
    Lobby.updateLobbyGames();
  },

  onSetAIDifficulty: function({ difficulty }) {
    let current_game = pendingGames.get(this.socket_game_id);
    if (!current_game) return;

    Bots.setDifficulty(current_game, difficulty);
    Lobby.updateCurrentGame(current_game);
  },

  onLeavePendingGame: function() {
    let current_game = pendingGames.get(this.socket_game_id);

    if (current_game) {
      this.leave(current_game.id);
      this.socket_game_id = null;

      current_game.removePlayer(this.id);

      // If only bots left in a pending game, remove them too and delete the game.
      if (Bots.hasOnlyBots(current_game)) {
        Bots.removeBotsFromGame(current_game);
      }

      if( current_game.isEmpty() ){
        pendingGames.delete(current_game.id);
        Lobby.updateLobbyGames();
        return
      }

      if ( !current_game.isFull() ){
        Lobby.updateLobbyGames();
      }

      Lobby.updateCurrentGame(current_game)
    }
  },

  deletePendingGame: function(game_id) {
    let game = pendingGames.get(game_id);
    if (!game) {
      console.warn('deletePendingGame: unknown game_id', game_id);
      return null;
    }

    pendingGames.delete(game.id);
    Lobby.updateLobbyGames();

    return game
  },

  availablePendingGames: function() {
    return [...pendingGames.values()].filter(item => item.isFull() === false );
  },

  updateLobbyGames: function() {
    serverSocket.sockets.in(lobbyId).emit('display pending games', Lobby.availablePendingGames() );
  },

  updateCurrentGame: function(game) {
    // Emit to ALL including ME
    serverSocket.sockets.in(game.id).emit('update game', { current_game: game });
  }
}

module.exports = Lobby;

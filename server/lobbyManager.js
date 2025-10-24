class LobbyManager {
  constructor() {
    this.lobbies = new Map();
    this.playerToLobby = new Map();
    this.lobbyIdCounter = 1;

    // Start cleanup interval for lonely lobbies
    setInterval(() => this.cleanupLonelyLobbies(), 10000); // Check every 10 seconds
  }

  createLobby(hostId, hostName, gameType, isPrivate = false) {
    const lobbyId = `lobby_${this.lobbyIdCounter++}`;
    const lobby = {
      id: lobbyId,
      gameType,
      hostId,
      isPrivate,
      players: [
        { id: hostId, name: hostName, ready: false }
      ],
      state: 'waiting', // waiting, playing, finished
      createdAt: Date.now(),
      lonelyStartTime: Date.now(), // Track when lobby became lonely
      gameState: null
    };

    this.lobbies.set(lobbyId, lobby);
    this.playerToLobby.set(hostId, lobbyId);
    return lobby;
  }

  joinLobby(lobbyId, playerId, playerName) {
    const lobby = this.lobbies.get(lobbyId);

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    if (lobby.state !== 'waiting') {
      throw new Error('Game already in progress');
    }

    if (lobby.players.length >= 2) {
      throw new Error('Lobby is full');
    }

    // Check if player is already in this lobby
    if (lobby.players.some(p => p.id === playerId)) {
      return lobby;
    }

    lobby.players.push({ id: playerId, name: playerName, ready: false });
    this.playerToLobby.set(playerId, lobbyId);

    // Reset lonely timer since we now have 2 players
    lobby.lonelyStartTime = null;

    return lobby;
  }

  leaveLobby(playerId) {
    const lobbyId = this.playerToLobby.get(playerId);
    if (!lobbyId) return null;

    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return null;

    // If host leaves, delete the lobby
    if (lobby.hostId === playerId) {
      this.deleteLobby(lobbyId);
      return { deleted: true, lobbyId };
    }

    // Remove player from lobby
    lobby.players = lobby.players.filter(p => p.id !== playerId);
    this.playerToLobby.delete(playerId);

    // Start lonely timer if only one player left
    if (lobby.players.length === 1) {
      lobby.lonelyStartTime = Date.now();
    }

    return { deleted: false, lobbyId, lobby };
  }

  deleteLobby(lobbyId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return;

    // Remove all players from playerToLobby map
    lobby.players.forEach(player => {
      this.playerToLobby.delete(player.id);
    });

    this.lobbies.delete(lobbyId);
  }

  cleanupLonelyLobbies() {
    const now = Date.now();
    const LONELY_TIMEOUT = 2 * 60 * 1000; // 2 minutes

    for (const [lobbyId, lobby] of this.lobbies.entries()) {
      if (lobby.players.length === 1 && lobby.lonelyStartTime) {
        if (now - lobby.lonelyStartTime >= LONELY_TIMEOUT) {
          console.log(`Cleaning up lonely lobby: ${lobbyId}`);
          this.deleteLobby(lobbyId);
        }
      }
    }
  }

  getLobby(lobbyId) {
    return this.lobbies.get(lobbyId);
  }

  getPlayerLobby(playerId) {
    const lobbyId = this.playerToLobby.get(playerId);
    return lobbyId ? this.lobbies.get(lobbyId) : null;
  }

  getPublicLobbies(gameType) {
    return Array.from(this.lobbies.values())
      .filter(lobby =>
        !lobby.isPrivate &&
        lobby.gameType === gameType &&
        lobby.state === 'waiting' &&
        lobby.players.length < 2
      );
  }

  setPlayerReady(playerId, ready) {
    const lobby = this.getPlayerLobby(playerId);
    if (!lobby) return null;

    const player = lobby.players.find(p => p.id === playerId);
    if (player) {
      player.ready = ready;
    }

    return lobby;
  }

  canStartGame(lobbyId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return false;

    return lobby.players.length === 2 &&
           lobby.players.every(p => p.ready) &&
           lobby.state === 'waiting';
  }

  startGame(lobbyId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return null;

    lobby.state = 'playing';
    return lobby;
  }

  endGame(lobbyId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return null;

    lobby.state = 'finished';
    return lobby;
  }

  updateGameState(lobbyId, gameState) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return null;

    lobby.gameState = gameState;
    return lobby;
  }
}

module.exports = LobbyManager;

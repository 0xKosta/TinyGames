const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const LobbyManager = require('./lobbyManager');
const GameLogic = require('./gameLogic');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Initialize lobby manager
const lobbyManager = new LobbyManager();

// Store connected players
const connectedPlayers = new Map(); // socketId -> { id, name }

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle player registration
  socket.on('register', (playerName) => {
    connectedPlayers.set(socket.id, {
      id: socket.id,
      name: playerName || `Player_${socket.id.substring(0, 5)}`
    });

    socket.emit('registered', {
      playerId: socket.id,
      playerName: connectedPlayers.get(socket.id).name
    });
  });

  // Create lobby
  socket.on('createLobby', ({ gameType, isPrivate, playerName }) => {
    try {
      const player = connectedPlayers.get(socket.id) || { id: socket.id, name: playerName };
      connectedPlayers.set(socket.id, player);

      const lobby = lobbyManager.createLobby(socket.id, player.name, gameType, isPrivate);

      socket.join(lobby.id);
      socket.emit('lobbyCreated', lobby);

      // Broadcast updated public lobbies for this game type
      if (!isPrivate) {
        io.emit('publicLobbiesUpdate', {
          gameType,
          lobbies: lobbyManager.getPublicLobbies(gameType)
        });
      }

      console.log(`Lobby created: ${lobby.id} for game: ${gameType}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Join lobby
  socket.on('joinLobby', ({ lobbyId, playerName }) => {
    try {
      const player = connectedPlayers.get(socket.id) || { id: socket.id, name: playerName };
      connectedPlayers.set(socket.id, player);

      const lobby = lobbyManager.joinLobby(lobbyId, socket.id, player.name);

      socket.join(lobbyId);

      // Notify all players in the lobby
      io.to(lobbyId).emit('lobbyUpdate', lobby);

      // Update public lobbies list
      if (!lobby.isPrivate) {
        io.emit('publicLobbiesUpdate', {
          gameType: lobby.gameType,
          lobbies: lobbyManager.getPublicLobbies(lobby.gameType)
        });
      }

      console.log(`Player ${player.name} joined lobby: ${lobbyId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Leave lobby
  socket.on('leaveLobby', () => {
    handlePlayerLeave(socket.id);
  });

  // Get public lobbies for a game
  socket.on('getPublicLobbies', ({ gameType }) => {
    const lobbies = lobbyManager.getPublicLobbies(gameType);
    socket.emit('publicLobbiesUpdate', { gameType, lobbies });
  });

  // Player ready
  socket.on('playerReady', ({ ready }) => {
    try {
      const lobby = lobbyManager.setPlayerReady(socket.id, ready);

      if (lobby) {
        io.to(lobby.id).emit('lobbyUpdate', lobby);

        // Check if game can start
        if (lobbyManager.canStartGame(lobby.id)) {
          lobbyManager.startGame(lobby.id);

          // Initialize game state
          const gameState = GameLogic.initGame(lobby.gameType, lobby.players);
          lobbyManager.updateGameState(lobby.id, gameState);

          io.to(lobby.id).emit('gameStart', {
            lobby,
            gameState,
            players: lobby.players
          });

          console.log(`Game starting in lobby: ${lobby.id}`);
        }
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Game move
  socket.on('gameMove', ({ moveData }) => {
    try {
      const lobby = lobbyManager.getPlayerLobby(socket.id);

      if (!lobby) {
        socket.emit('error', { message: 'Not in a lobby' });
        return;
      }

      if (lobby.state !== 'playing') {
        socket.emit('error', { message: 'Game not in progress' });
        return;
      }

      const result = GameLogic.processMove(
        lobby.gameType,
        lobby.gameState,
        socket.id,
        moveData,
        lobby.players
      );

      if (!result.valid) {
        socket.emit('error', { message: result.error });
        return;
      }

      // Update game state
      lobbyManager.updateGameState(lobby.id, result.gameState);

      // Emit game update to all players
      io.to(lobby.id).emit('gameUpdate', {
        gameState: result.gameState,
        complete: result.complete,
        winner: result.winner,
        winnerName: result.winnerName,
        draw: result.draw,
        choices: result.choices // For RPS
      });

      if (result.complete) {
        lobbyManager.endGame(lobby.id);
        console.log(`Game ended in lobby: ${lobby.id}`);
      }
    } catch (error) {
      console.error('Game move error:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Rematch
  socket.on('rematch', () => {
    try {
      const lobby = lobbyManager.getPlayerLobby(socket.id);

      if (!lobby) {
        socket.emit('error', { message: 'Not in a lobby' });
        return;
      }

      // Reset lobby state
      lobby.state = 'waiting';
      lobby.players.forEach(p => p.ready = false);
      lobby.gameState = null;

      io.to(lobby.id).emit('lobbyUpdate', lobby);
      io.to(lobby.id).emit('rematchInitiated');

      console.log(`Rematch initiated in lobby: ${lobby.id}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    handlePlayerLeave(socket.id);
    connectedPlayers.delete(socket.id);
  });

  function handlePlayerLeave(playerId) {
    const result = lobbyManager.leaveLobby(playerId);

    if (result) {
      if (result.deleted) {
        // Notify remaining players that lobby was deleted
        io.to(result.lobbyId).emit('lobbyClosed', {
          message: 'Host left the lobby'
        });

        // Update public lobbies
        io.emit('publicLobbiesUpdate', {
          gameType: 'all',
          lobbies: []
        });

        console.log(`Lobby deleted: ${result.lobbyId}`);
      } else {
        // Notify remaining players
        io.to(result.lobbyId).emit('lobbyUpdate', result.lobby);

        // Update public lobbies if it was public
        if (!result.lobby.isPrivate) {
          io.emit('publicLobbiesUpdate', {
            gameType: result.lobby.gameType,
            lobbies: lobbyManager.getPublicLobbies(result.lobby.gameType)
          });
        }

        console.log(`Player left lobby: ${result.lobbyId}`);
      }
    }
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

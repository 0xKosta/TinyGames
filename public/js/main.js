// Main App State
const AppState = {
  socket: null,
  playerId: null,
  playerName: null,
  currentLobby: null,
  currentGame: null,
  currentGameType: null,
  isHost: false
};

// Initialize Socket Connection
function initSocket() {
  AppState.socket = io();

  // Connection events
  AppState.socket.on('connect', () => {
    console.log('Connected to server');
  });

  AppState.socket.on('disconnect', () => {
    console.log('Disconnected from server');
    showError('Connection lost. Please refresh the page.');
  });

  // Registration
  AppState.socket.on('registered', (data) => {
    AppState.playerId = data.playerId;
    AppState.playerName = data.playerName;
    console.log('Registered as:', data.playerName);
  });

  // Error handling
  AppState.socket.on('error', (data) => {
    showError(data.message);
  });

  // Lobby closed
  AppState.socket.on('lobbyClosed', (data) => {
    showError(data.message);
    returnToHome();
  });
}

// Screen Navigation
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

function returnToHome() {
  if (AppState.currentLobby) {
    AppState.socket.emit('leaveLobby');
  }

  AppState.currentLobby = null;
  AppState.currentGame = null;
  AppState.currentGameType = null;
  AppState.isHost = false;

  showScreen('homeScreen');
}

// Error Toast
function showError(message) {
  const toast = document.getElementById('errorToast');
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// Modal Management
function showResultModal(title, message, showRematch = true) {
  const modal = document.getElementById('resultModal');
  const titleEl = document.getElementById('resultTitle');
  const messageEl = document.getElementById('resultMessage');
  const rematchBtn = document.getElementById('rematchBtn');

  titleEl.textContent = title;
  messageEl.textContent = message;
  rematchBtn.style.display = showRematch ? 'inline-block' : 'none';

  modal.classList.add('active');
}

function hideResultModal() {
  document.getElementById('resultModal').classList.remove('active');
}

// Game Cards Click Handler
function setupGameCards() {
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      const gameType = card.dataset.game;
      const playerName = document.getElementById('playerNameInput').value.trim();

      if (!playerName) {
        showError('Please enter your name first!');
        document.getElementById('playerNameInput').focus();
        return;
      }

      // Register player
      if (!AppState.playerName) {
        AppState.socket.emit('register', playerName);
        AppState.playerName = playerName;
      }

      AppState.currentGameType = gameType;

      // Update game title
      const gameTitles = {
        rps: 'Rock Paper Scissors',
        tictactoe: 'Tic Tac Toe',
        connect4: 'Connect 4',
        checkers: 'Checkers'
      };

      document.getElementById('gameTitle').textContent = gameTitles[gameType];

      // Get public lobbies
      AppState.socket.emit('getPublicLobbies', { gameType });

      showScreen('lobbySelectionScreen');
    });
  });
}

// Lobby Selection Handlers
function setupLobbySelection() {
  // Back button
  document.getElementById('backToHome').addEventListener('click', () => {
    showScreen('homeScreen');
  });

  // Create public lobby
  document.getElementById('createPublicLobby').addEventListener('click', () => {
    const playerName = document.getElementById('playerNameInput').value.trim();
    AppState.socket.emit('createLobby', {
      gameType: AppState.currentGameType,
      isPrivate: false,
      playerName
    });
    AppState.isHost = true;
  });

  // Create private lobby
  document.getElementById('createPrivateLobby').addEventListener('click', () => {
    const playerName = document.getElementById('playerNameInput').value.trim();
    AppState.socket.emit('createLobby', {
      gameType: AppState.currentGameType,
      isPrivate: true,
      playerName
    });
    AppState.isHost = true;
  });
}

// Result Modal Handlers
function setupResultModal() {
  document.getElementById('rematchBtn').addEventListener('click', () => {
    hideResultModal();
    AppState.socket.emit('rematch');
  });

  document.getElementById('exitBtn').addEventListener('click', () => {
    hideResultModal();
    returnToHome();
  });
}

// Copy Lobby ID
function setupCopyLobbyId() {
  document.getElementById('copyLobbyId').addEventListener('click', () => {
    const lobbyId = document.getElementById('lobbyIdDisplay').textContent;
    navigator.clipboard.writeText(lobbyId).then(() => {
      showError('Lobby ID copied to clipboard!');
    }).catch(() => {
      showError('Failed to copy lobby ID');
    });
  });
}

// Utility: Get Player Name by ID
function getPlayerName(playerId) {
  if (!AppState.currentLobby) return 'Unknown';
  const player = AppState.currentLobby.players.find(p => p.id === playerId);
  return player ? player.name : 'Unknown';
}

// Utility: Is Current Player
function isCurrentPlayer(playerId) {
  return playerId === AppState.playerId;
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initSocket();
  setupGameCards();
  setupLobbySelection();
  setupResultModal();
  setupCopyLobbyId();

  // Set default name input behavior
  const nameInput = document.getElementById('playerNameInput');
  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      nameInput.blur();
    }
  });

  // Auto-focus name input
  nameInput.focus();
});

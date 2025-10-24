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
  console.log('Initializing socket connection...');
  AppState.socket = io();

  // Connection events
  AppState.socket.on('connect', () => {
    console.log('✓ Connected to server with ID:', AppState.socket.id);
  });

  AppState.socket.on('disconnect', () => {
    console.log('✗ Disconnected from server');
    showError('Connection lost. Please refresh the page.');
  });

  AppState.socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    showError('Failed to connect to server. Please check if the server is running.');
  });

  // Registration
  AppState.socket.on('registered', (data) => {
    AppState.playerId = data.playerId;
    AppState.playerName = data.playerName;
    console.log('✓ Registered as:', data.playerName, 'with ID:', data.playerId);
  });

  // Error handling
  AppState.socket.on('error', (data) => {
    console.error('Server error:', data.message);
    showError(data.message);
  });

  // Lobby closed
  AppState.socket.on('lobbyClosed', (data) => {
    console.log('Lobby closed:', data.message);
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
    createLobby(false);
  });

  // Create private lobby
  document.getElementById('createPrivateLobby').addEventListener('click', () => {
    createLobby(true);
  });

  // Join private lobby
  document.getElementById('joinPrivateLobby').addEventListener('click', () => {
    joinPrivateLobby();
  });

  // Allow Enter key to join private lobby
  document.getElementById('privateLobbyIdInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      joinPrivateLobby();
    }
  });
}

// Create lobby function with validation
function createLobby(isPrivate) {
  const playerName = document.getElementById('playerNameInput').value.trim();

  // Validation
  if (!playerName) {
    showError('Please enter your name first!');
    return;
  }

  if (!AppState.socket || !AppState.socket.connected) {
    showError('Not connected to server. Please refresh the page.');
    return;
  }

  if (!AppState.currentGameType) {
    showError('Please select a game first!');
    returnToHome();
    return;
  }

  console.log('Creating lobby:', {
    gameType: AppState.currentGameType,
    isPrivate,
    playerName
  });

  AppState.socket.emit('createLobby', {
    gameType: AppState.currentGameType,
    isPrivate: isPrivate,
    playerName: playerName
  });
  AppState.isHost = true;
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

// Join private lobby function
function joinPrivateLobby() {
  const playerName = document.getElementById('playerNameInput').value.trim();
  const lobbyId = document.getElementById('privateLobbyIdInput').value.trim();

  // Validation
  if (!playerName) {
    showError('Please enter your name first!');
    document.getElementById('playerNameInput').focus();
    return;
  }

  if (!lobbyId) {
    showError('Please enter a lobby ID!');
    document.getElementById('privateLobbyIdInput').focus();
    return;
  }

  if (!AppState.socket || !AppState.socket.connected) {
    showError('Not connected to server. Please refresh the page.');
    return;
  }

  console.log('Joining private lobby:', lobbyId);

  AppState.socket.emit('joinLobby', {
    lobbyId: lobbyId,
    playerName: playerName
  });

  // Clear the input
  document.getElementById('privateLobbyIdInput').value = '';
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

  // Copy invite link
  document.getElementById('copyInviteLink').addEventListener('click', () => {
    const lobbyId = document.getElementById('lobbyIdDisplay').textContent;
    const gameType = AppState.currentGameType;
    const inviteLink = `${window.location.origin}?lobby=${lobbyId}&game=${gameType}`;

    navigator.clipboard.writeText(inviteLink).then(() => {
      showError('Invite link copied to clipboard!');
    }).catch(() => {
      showError('Failed to copy invite link');
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

// Check for invite link in URL
function checkInviteLink() {
  const urlParams = new URLSearchParams(window.location.search);
  const lobbyId = urlParams.get('lobby');
  const gameType = urlParams.get('game');

  if (lobbyId && gameType) {
    console.log('Invite link detected:', { lobbyId, gameType });

    // Set the game type
    AppState.currentGameType = gameType;

    // Show a prompt for the player to enter their name
    setTimeout(() => {
      const playerName = document.getElementById('playerNameInput').value.trim();

      if (!playerName) {
        showError('Please enter your name to join the lobby!');
        document.getElementById('playerNameInput').focus();

        // Store invite info for after name is entered
        AppState.pendingInvite = { lobbyId, gameType };
      } else {
        // Auto-join the lobby
        joinLobbyFromInvite(lobbyId, playerName);
      }
    }, 500); // Wait a bit for socket to connect
  }
}

// Join lobby from invite link
function joinLobbyFromInvite(lobbyId, playerName) {
  if (!AppState.socket || !AppState.socket.connected) {
    showError('Connecting to server...');
    setTimeout(() => joinLobbyFromInvite(lobbyId, playerName), 500);
    return;
  }

  console.log('Auto-joining lobby from invite:', lobbyId);

  AppState.socket.emit('joinLobby', {
    lobbyId: lobbyId,
    playerName: playerName
  });

  // Clear URL parameters
  window.history.replaceState({}, document.title, window.location.pathname);
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initSocket();
  setupGameCards();
  setupLobbySelection();
  setupResultModal();
  setupCopyLobbyId();
  setupLobbyEventListeners(); // Setup lobby socket event listeners
  setupLeaveLobbyButton(); // Setup leave lobby button

  // Set default name input behavior
  const nameInput = document.getElementById('playerNameInput');
  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      nameInput.blur();

      // Check if there's a pending invite
      if (AppState.pendingInvite) {
        const playerName = nameInput.value.trim();
        if (playerName) {
          joinLobbyFromInvite(AppState.pendingInvite.lobbyId, playerName);
          AppState.pendingInvite = null;
        }
      }
    }
  });

  // Auto-focus name input
  nameInput.focus();

  // Check for invite link in URL
  checkInviteLink();
});

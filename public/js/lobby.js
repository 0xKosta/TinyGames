// Lobby Management

// Setup lobby event listeners - called after socket is initialized
function setupLobbyEventListeners() {
  // Handle lobby created
  AppState.socket.on('lobbyCreated', (lobby) => {
    console.log('Lobby created:', lobby);
    AppState.currentLobby = lobby;
    showWaitingRoom(lobby);
  });

  // Handle lobby update
  AppState.socket.on('lobbyUpdate', (lobby) => {
    console.log('Lobby updated:', lobby);
    AppState.currentLobby = lobby;

    // If we're not on the waiting room screen yet, go there (for joiners)
    const currentScreen = document.querySelector('.screen.active');
    if (currentScreen && currentScreen.id !== 'waitingRoomScreen') {
      showWaitingRoom(lobby);
    } else {
      updateWaitingRoom(lobby);
    }
  });

  // Handle public lobbies update
  AppState.socket.on('publicLobbiesUpdate', (data) => {
    console.log('Public lobbies updated:', data);
    if (data.gameType === AppState.currentGameType || data.gameType === 'all') {
      updatePublicLobbiesList(data.lobbies);
    }
  });

  // Handle rematch
  AppState.socket.on('rematchInitiated', () => {
    hideResultModal();
    showScreen('waitingRoomScreen');
  });

  // Handle game start
  AppState.socket.on('gameStart', (data) => {
    console.log('Game starting:', data);
    AppState.currentLobby = data.lobby;
    const { gameState, players } = data;

    // Initialize the appropriate game
    showScreen('gameScreen');

    // Hide all game containers
    document.querySelectorAll('.game-container').forEach(container => {
      container.style.display = 'none';
    });

    // Show and initialize the correct game
    const gameType = AppState.currentLobby.gameType;

    switch (gameType) {
      case 'rps':
        initRPSGame(gameState, players);
        break;
      case 'tictactoe':
        initTicTacToeGame(gameState, players);
        break;
      case 'connect4':
        initConnect4Game(gameState, players);
        break;
      case 'checkers':
        initCheckersGame(gameState, players);
        break;
    }
  });

  // Handle game update
  AppState.socket.on('gameUpdate', (data) => {
    console.log('Game update:', data);
    const { gameState, complete, winner, winnerName, draw, choices } = data;
    const gameType = AppState.currentLobby.gameType;

    // Update the lobby's game state
    AppState.currentLobby.gameState = gameState;

    // Update the game UI
    switch (gameType) {
      case 'rps':
        updateRPSGame(gameState, choices);
        break;
      case 'tictactoe':
        updateTicTacToeGame(gameState);
        break;
      case 'connect4':
        updateConnect4Game(gameState);
        break;
      case 'checkers':
        updateCheckersGame(gameState);
        break;
    }

    // Handle game completion
    if (complete) {
      let message = '';

      // For RPS, show the choices
      if (gameType === 'rps' && choices) {
        const players = AppState.currentLobby.players;
        const myChoice = choices[AppState.playerId];
        const opponentId = players.find(p => p.id !== AppState.playerId)?.id;
        const opponentChoice = choices[opponentId];
        const opponentName = players.find(p => p.id !== AppState.playerId)?.name;

        const icons = { rock: '✊', paper: '✋', scissors: '✌️' };

        message = `You chose ${icons[myChoice]} ${myChoice}\n${opponentName} chose ${icons[opponentChoice]} ${opponentChoice}`;
      }

      if (draw) {
        showResultModal('Draw!', message || "It's a tie! Nobody wins this time.", true);
      } else if (winner === AppState.playerId) {
        showResultModal('Victory! 🎉', message || `You won the game!`, true);
      } else {
        showResultModal('Defeat', message || `${winnerName} won the game.`, true);
      }
    }
  });
}

// Show waiting room
function showWaitingRoom(lobby) {
  const lobbyIdEl = document.getElementById('lobbyIdDisplay');
  const lobbyGameEl = document.getElementById('lobbyGameDisplay');
  const inviteLinkSection = document.getElementById('inviteLinkSection');

  lobbyIdEl.textContent = lobby.id;

  const gameTitles = {
    rps: 'Rock Paper Scissors',
    tictactoe: 'Tic Tac Toe',
    connect4: 'Connect 4',
    checkers: 'Checkers'
  };

  lobbyGameEl.textContent = gameTitles[lobby.gameType];

  // Show invite link section for private lobbies
  if (lobby.isPrivate) {
    inviteLinkSection.style.display = 'flex';
  } else {
    inviteLinkSection.style.display = 'none';
  }

  updateWaitingRoom(lobby);
  showScreen('waitingRoomScreen');
}

// Update waiting room
function updateWaitingRoom(lobby) {
  const player1Slot = document.getElementById('player1Slot');
  const player2Slot = document.getElementById('player2Slot');
  const readyBtn = document.getElementById('readyBtn');

  // Update player slots
  const players = lobby.players;

  if (players[0]) {
    updatePlayerSlot(player1Slot, players[0]);
  } else {
    resetPlayerSlot(player1Slot);
  }

  if (players[1]) {
    updatePlayerSlot(player2Slot, players[1]);
    readyBtn.disabled = false;
  } else {
    resetPlayerSlot(player2Slot);
    readyBtn.disabled = true;
  }

  // Update ready button
  const currentPlayer = players.find(p => p.id === AppState.playerId);
  if (currentPlayer) {
    readyBtn.textContent = currentPlayer.ready ? 'Cancel Ready' : 'Ready Up!';
    readyBtn.onclick = () => {
      AppState.socket.emit('playerReady', { ready: !currentPlayer.ready });
    };
  }
}

// Update player slot
function updatePlayerSlot(slotEl, player) {
  const nameEl = slotEl.querySelector('.player-name');
  const statusEl = slotEl.querySelector('.player-status');

  nameEl.textContent = player.name;

  if (player.ready) {
    statusEl.textContent = 'Ready!';
    statusEl.classList.add('ready');
    slotEl.classList.add('ready');
  } else {
    statusEl.textContent = 'Not Ready';
    statusEl.classList.remove('ready');
    slotEl.classList.remove('ready');
  }
}

// Reset player slot
function resetPlayerSlot(slotEl) {
  const nameEl = slotEl.querySelector('.player-name');
  const statusEl = slotEl.querySelector('.player-status');

  nameEl.textContent = 'Waiting...';
  statusEl.textContent = 'Not Ready';
  statusEl.classList.remove('ready');
  slotEl.classList.remove('ready');
}

// Update public lobbies list
function updatePublicLobbiesList(lobbies) {
  const listEl = document.getElementById('publicLobbiesList');

  if (lobbies.length === 0) {
    listEl.innerHTML = '<p class="empty-message">No public lobbies available. Create one!</p>';
    return;
  }

  listEl.innerHTML = '';

  lobbies.forEach(lobby => {
    const lobbyItem = document.createElement('div');
    lobbyItem.className = 'lobby-item';

    const info = document.createElement('div');
    info.className = 'lobby-item-info';

    const title = document.createElement('h4');
    title.textContent = `${lobby.players[0].name}'s Lobby`;

    const details = document.createElement('p');
    details.textContent = `${lobby.players.length}/2 Players`;

    info.appendChild(title);
    info.appendChild(details);

    const joinBtn = document.createElement('button');
    joinBtn.className = 'btn btn-primary';
    joinBtn.textContent = 'Join';
    joinBtn.onclick = () => {
      const playerName = document.getElementById('playerNameInput').value.trim();
      AppState.socket.emit('joinLobby', {
        lobbyId: lobby.id,
        playerName
      });
    };

    lobbyItem.appendChild(info);
    lobbyItem.appendChild(joinBtn);

    listEl.appendChild(lobbyItem);
  });
}

// Leave lobby button - setup in DOMContentLoaded
function setupLeaveLobbyButton() {
  document.getElementById('leaveLobby').addEventListener('click', () => {
    returnToHome();
  });
}

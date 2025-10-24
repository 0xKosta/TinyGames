// Connect 4 Game

function initConnect4Game(gameState, players) {
  const gameContainer = document.getElementById('connect4Game');
  gameContainer.style.display = 'block';

  const board = document.getElementById('connect4Board');
  board.innerHTML = '';

  // Create 6 rows x 7 columns (42 cells)
  // Display from top to bottom
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const cell = document.createElement('div');
      cell.className = 'connect4-cell';
      cell.dataset.row = row;
      cell.dataset.col = col;

      // Only add click handler to cells, but we'll click on column
      if (row === 0) {
        cell.style.cursor = 'pointer';
      }

      cell.onclick = () => {
        // Check current game state, not closure
        const currentGameState = AppState.currentLobby.gameState;
        if (currentGameState.currentPlayer === AppState.playerId) {
          AppState.socket.emit('gameMove', {
            moveData: { column: col }
          });
        }
      };

      board.appendChild(cell);
    }
  }

  updateConnect4Game(gameState);
}

function updateConnect4Game(gameState) {
  const cells = document.querySelectorAll('.connect4-cell');

  cells.forEach(cell => {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const value = gameState.board[row][col];

    // Remove existing color classes
    cell.classList.remove('red', 'yellow');

    if (value) {
      cell.classList.add(value);
    }
  });

  // Update turn indicator
  const isMyTurn = gameState.currentPlayer === AppState.playerId;
  const opponentName = getOpponentName();

  // Determine player colors
  const playerIndex = AppState.currentLobby.players.findIndex(p => p.id === AppState.playerId);
  const myColor = playerIndex === 0 ? 'Red' : 'Yellow';
  const opponentColor = playerIndex === 0 ? 'Yellow' : 'Red';

  if (isMyTurn) {
    updateTurnIndicator(`Your Turn (${myColor})`);
  } else {
    updateTurnIndicator(`${opponentName}'s Turn (${opponentColor})`);
  }
}

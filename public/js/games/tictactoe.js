// Tic Tac Toe Game

function initTicTacToeGame(gameState, players) {
  const gameContainer = document.getElementById('tictactoeGame');
  gameContainer.style.display = 'block';

  const board = document.getElementById('tictactoeBoard');
  board.innerHTML = '';

  // Create 9 cells
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'tictactoe-cell';
    cell.dataset.position = i;

    cell.onclick = () => {
      if (gameState.currentPlayer === AppState.playerId && !cell.classList.contains('filled')) {
        AppState.socket.emit('gameMove', {
          moveData: { position: i }
        });
      }
    };

    board.appendChild(cell);
  }

  updateTicTacToeGame(gameState);
}

function updateTicTacToeGame(gameState) {
  const cells = document.querySelectorAll('.tictactoe-cell');

  cells.forEach((cell, index) => {
    const value = gameState.board[index];

    if (value) {
      cell.textContent = value;
      cell.classList.add('filled');
    } else {
      cell.textContent = '';
      cell.classList.remove('filled');
    }
  });

  // Update turn indicator
  const isMyTurn = gameState.currentPlayer === AppState.playerId;
  const opponentName = getOpponentName();

  if (isMyTurn) {
    updateTurnIndicator('Your Turn');
  } else {
    updateTurnIndicator(`${opponentName}'s Turn`);
  }
}

function getOpponentName() {
  if (!AppState.currentLobby) return 'Opponent';

  const opponent = AppState.currentLobby.players.find(p => p.id !== AppState.playerId);
  return opponent ? opponent.name : 'Opponent';
}

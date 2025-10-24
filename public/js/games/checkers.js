// Checkers Game

let selectedPiece = null;

// Helper to determine if board should be flipped
function shouldFlipBoard() {
  const playerIndex = AppState.currentLobby.players.findIndex(p => p.id === AppState.playerId);
  // Player 1 (Black) is at rows 0-2 (top), needs flip to see pieces at bottom
  // Player 2 (Red) is at rows 5-7 (bottom), doesn't need flip
  return playerIndex === 0; // Flip for player 1 (Black)
}

// Transform coordinates for flipped board
function transformCoords(row, col) {
  if (shouldFlipBoard()) {
    return { row: 7 - row, col: 7 - col };
  }
  return { row, col };
}

function initCheckersGame(gameState, players) {
  const gameContainer = document.getElementById('checkersGame');
  gameContainer.style.display = 'block';

  const board = document.getElementById('checkersBoard');
  board.innerHTML = '';

  selectedPiece = null;

  const isFlipped = shouldFlipBoard();

  // Create 8x8 board
  for (let displayRow = 0; displayRow < 8; displayRow++) {
    for (let displayCol = 0; displayCol < 8; displayCol++) {
      const cell = document.createElement('div');
      cell.className = 'checkers-cell';
      cell.classList.add((displayRow + displayCol) % 2 === 0 ? 'light' : 'dark');

      // Store the actual game coordinates
      const actualCoords = isFlipped ?
        { row: 7 - displayRow, col: 7 - displayCol } :
        { row: displayRow, col: displayCol };

      cell.dataset.row = actualCoords.row;
      cell.dataset.col = actualCoords.col;

      cell.onclick = () => handleCheckersClick(actualCoords.row, actualCoords.col);

      board.appendChild(cell);
    }
  }

  updateCheckersGame(gameState);
}

function updateCheckersGame(gameState) {
  const cells = document.querySelectorAll('.checkers-cell');

  cells.forEach(cell => {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const piece = gameState.board[row][col];

    // Clear previous content
    cell.innerHTML = '';
    cell.classList.remove('selected', 'valid-move');

    // Add piece if exists
    if (piece) {
      const pieceEl = document.createElement('div');
      pieceEl.className = `checkers-piece ${piece.color}`;

      if (piece.isKing) {
        pieceEl.classList.add('king');
      }

      cell.appendChild(pieceEl);
    }
  });

  // Update turn indicator
  const isMyTurn = gameState.currentPlayer === AppState.playerId;
  const opponentName = getOpponentName();

  // Determine player colors
  const playerIndex = AppState.currentLobby.players.findIndex(p => p.id === AppState.playerId);
  const myColor = playerIndex === 0 ? 'Black' : 'Red';
  const opponentColor = playerIndex === 0 ? 'Red' : 'Black';

  if (isMyTurn) {
    updateTurnIndicator(`Your Turn (${myColor})`);
  } else {
    updateTurnIndicator(`${opponentName}'s Turn (${opponentColor})`);
  }
}

function handleCheckersClick(row, col) {
  // Check current game state, not closure
  const gameState = AppState.currentLobby.gameState;

  if (gameState.currentPlayer !== AppState.playerId) {
    return; // Not your turn
  }

  const playerIndex = AppState.currentLobby.players.findIndex(p => p.id === AppState.playerId);
  const playerColor = playerIndex === 0 ? 'black' : 'red';
  const piece = gameState.board[row][col];

  // If clicking on own piece
  if (piece && piece.color === playerColor) {
    // Select this piece
    selectedPiece = { row, col };
    highlightSelectedPiece(row, col);
    highlightValidMoves(gameState, row, col, playerColor);
    return;
  }

  // If a piece is selected and clicking on empty square
  if (selectedPiece && !piece) {
    // Try to move
    AppState.socket.emit('gameMove', {
      moveData: {
        from: selectedPiece,
        to: { row, col }
      }
    });

    // Clear selection
    clearSelection();
    return;
  }

  // Clear selection if clicking on invalid square
  clearSelection();
}

function highlightSelectedPiece(row, col) {
  const cells = document.querySelectorAll('.checkers-cell');

  cells.forEach(cell => {
    const cellRow = parseInt(cell.dataset.row);
    const cellCol = parseInt(cell.dataset.col);

    if (cellRow === row && cellCol === col) {
      cell.classList.add('selected');
    }
  });
}

function highlightValidMoves(gameState, fromRow, fromCol, playerColor) {
  const piece = gameState.board[fromRow][fromCol];

  if (!piece) return;

  // Calculate valid moves (simple version - just basic moves)
  const directions = [];

  if (piece.isKing) {
    directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
  } else if (playerColor === 'black') {
    directions.push([1, -1], [1, 1]); // Black moves down
  } else {
    directions.push([-1, -1], [-1, 1]); // Red moves up
  }

  const cells = document.querySelectorAll('.checkers-cell');

  // Check regular moves (1 square)
  directions.forEach(([dRow, dCol]) => {
    const newRow = fromRow + dRow;
    const newCol = fromCol + dCol;

    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      if (!gameState.board[newRow][newCol]) {
        highlightCell(cells, newRow, newCol);
      }
    }

    // Check capture moves (2 squares)
    const captureRow = fromRow + dRow * 2;
    const captureCol = fromCol + dCol * 2;
    const midRow = fromRow + dRow;
    const midCol = fromCol + dCol;

    if (captureRow >= 0 && captureRow < 8 && captureCol >= 0 && captureCol < 8) {
      const midPiece = gameState.board[midRow][midCol];
      const targetSquare = gameState.board[captureRow][captureCol];

      if (midPiece && midPiece.color !== playerColor && !targetSquare) {
        highlightCell(cells, captureRow, captureCol);
      }
    }
  });
}

function highlightCell(cells, row, col) {
  cells.forEach(cell => {
    const cellRow = parseInt(cell.dataset.row);
    const cellCol = parseInt(cell.dataset.col);

    if (cellRow === row && cellCol === col) {
      cell.classList.add('valid-move');
    }
  });
}

function clearSelection() {
  selectedPiece = null;

  const cells = document.querySelectorAll('.checkers-cell');
  cells.forEach(cell => {
    cell.classList.remove('selected', 'valid-move');
  });
}

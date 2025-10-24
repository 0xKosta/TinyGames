class GameLogic {
  // Initialize game state for different game types
  static initGame(gameType, players) {
    switch (gameType) {
      case 'rps':
        return {
          choices: {},
          round: 1
        };

      case 'tictactoe':
        return {
          board: Array(9).fill(null),
          currentPlayer: players[0].id,
          moves: 0
        };

      case 'connect4':
        return {
          board: Array(6).fill(null).map(() => Array(7).fill(null)),
          currentPlayer: players[0].id,
          moves: 0
        };

      case 'checkers':
        return {
          board: this.initCheckersBoard(),
          currentPlayer: players[0].id,
          selectedPiece: null,
          mustCapture: false
        };

      default:
        return {};
    }
  }

  static initCheckersBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));

    // Place black pieces (player 1) on top
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { color: 'black', isKing: false };
        }
      }
    }

    // Place red pieces (player 2) on bottom
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { color: 'red', isKing: false };
        }
      }
    }

    return board;
  }

  // Process game moves and return result
  static processMove(gameType, gameState, playerId, moveData, players) {
    switch (gameType) {
      case 'rps':
        return this.processRPS(gameState, playerId, moveData, players);
      case 'tictactoe':
        return this.processTicTacToe(gameState, playerId, moveData, players);
      case 'connect4':
        return this.processConnect4(gameState, playerId, moveData, players);
      case 'checkers':
        return this.processCheckers(gameState, playerId, moveData, players);
      default:
        return { valid: false, error: 'Unknown game type' };
    }
  }

  static processRPS(gameState, playerId, moveData, players) {
    const { choice } = moveData;

    if (!['rock', 'paper', 'scissors'].includes(choice)) {
      return { valid: false, error: 'Invalid choice' };
    }

    gameState.choices[playerId] = choice;

    // Check if both players have chosen
    if (Object.keys(gameState.choices).length === 2) {
      const [p1Id, p2Id] = players.map(p => p.id);
      const p1Choice = gameState.choices[p1Id];
      const p2Choice = gameState.choices[p2Id];

      const winner = this.determineRPSWinner(p1Choice, p2Choice);

      return {
        valid: true,
        gameState,
        complete: true,
        winner: winner === 0 ? null : players[winner - 1].id,
        winnerName: winner === 0 ? null : players[winner - 1].name,
        choices: gameState.choices
      };
    }

    return { valid: true, gameState, complete: false };
  }

  static determineRPSWinner(p1Choice, p2Choice) {
    if (p1Choice === p2Choice) return 0; // Draw

    const wins = {
      rock: 'scissors',
      paper: 'rock',
      scissors: 'paper'
    };

    return wins[p1Choice] === p2Choice ? 1 : 2;
  }

  static processTicTacToe(gameState, playerId, moveData, players) {
    const { position } = moveData;

    if (gameState.currentPlayer !== playerId) {
      return { valid: false, error: 'Not your turn' };
    }

    if (position < 0 || position > 8 || gameState.board[position] !== null) {
      return { valid: false, error: 'Invalid move' };
    }

    const playerIndex = players.findIndex(p => p.id === playerId);
    const symbol = playerIndex === 0 ? 'X' : 'O';

    gameState.board[position] = symbol;
    gameState.moves++;

    // Check for winner
    const winner = this.checkTicTacToeWinner(gameState.board);

    if (winner) {
      return {
        valid: true,
        gameState,
        complete: true,
        winner: playerId,
        winnerName: players[playerIndex].name
      };
    }

    // Check for draw
    if (gameState.moves === 9) {
      return {
        valid: true,
        gameState,
        complete: true,
        winner: null,
        draw: true
      };
    }

    // Switch player
    gameState.currentPlayer = players[(playerIndex + 1) % 2].id;

    return { valid: true, gameState, complete: false };
  }

  static checkTicTacToeWinner(board) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    return null;
  }

  static processConnect4(gameState, playerId, moveData, players) {
    const { column } = moveData;

    if (gameState.currentPlayer !== playerId) {
      return { valid: false, error: 'Not your turn' };
    }

    if (column < 0 || column > 6) {
      return { valid: false, error: 'Invalid column' };
    }

    // Find the lowest empty row in the column
    let row = -1;
    for (let r = 5; r >= 0; r--) {
      if (gameState.board[r][column] === null) {
        row = r;
        break;
      }
    }

    if (row === -1) {
      return { valid: false, error: 'Column is full' };
    }

    const playerIndex = players.findIndex(p => p.id === playerId);
    const color = playerIndex === 0 ? 'red' : 'yellow';

    gameState.board[row][column] = color;
    gameState.moves++;

    // Check for winner
    if (this.checkConnect4Winner(gameState.board, row, column, color)) {
      return {
        valid: true,
        gameState,
        complete: true,
        winner: playerId,
        winnerName: players[playerIndex].name
      };
    }

    // Check for draw
    if (gameState.moves === 42) {
      return {
        valid: true,
        gameState,
        complete: true,
        winner: null,
        draw: true
      };
    }

    // Switch player
    gameState.currentPlayer = players[(playerIndex + 1) % 2].id;

    return { valid: true, gameState, complete: false };
  }

  static checkConnect4Winner(board, row, col, color) {
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1] // Horizontal, Vertical, Diagonal, Anti-diagonal
    ];

    for (const [dx, dy] of directions) {
      let count = 1;

      // Check positive direction
      for (let i = 1; i < 4; i++) {
        const r = row + dx * i;
        const c = col + dy * i;
        if (r >= 0 && r < 6 && c >= 0 && c < 7 && board[r][c] === color) {
          count++;
        } else {
          break;
        }
      }

      // Check negative direction
      for (let i = 1; i < 4; i++) {
        const r = row - dx * i;
        const c = col - dy * i;
        if (r >= 0 && r < 6 && c >= 0 && c < 7 && board[r][c] === color) {
          count++;
        } else {
          break;
        }
      }

      if (count >= 4) return true;
    }

    return false;
  }

  static processCheckers(gameState, playerId, moveData, players) {
    const { from, to } = moveData;

    if (gameState.currentPlayer !== playerId) {
      return { valid: false, error: 'Not your turn' };
    }

    const playerIndex = players.findIndex(p => p.id === playerId);
    const playerColor = playerIndex === 0 ? 'black' : 'red';

    // Validate move
    const validation = this.validateCheckersMove(gameState.board, from, to, playerColor);

    if (!validation.valid) {
      return { valid: false, error: validation.error };
    }

    // Execute move
    const piece = gameState.board[from.row][from.col];
    gameState.board[to.row][to.col] = piece;
    gameState.board[from.row][from.col] = null;

    // Handle capture
    if (validation.captured) {
      gameState.board[validation.captured.row][validation.captured.col] = null;
    }

    // Check for king promotion
    if (playerColor === 'black' && to.row === 7) {
      piece.isKing = true;
    } else if (playerColor === 'red' && to.row === 0) {
      piece.isKing = true;
    }

    // Check for winner
    const winner = this.checkCheckersWinner(gameState.board, players);

    if (winner) {
      return {
        valid: true,
        gameState,
        complete: true,
        winner: winner.id,
        winnerName: winner.name
      };
    }

    // Switch player (unless there's a multi-capture available)
    if (!validation.captured || !this.hasMoreCaptures(gameState.board, to, playerColor)) {
      gameState.currentPlayer = players[(playerIndex + 1) % 2].id;
    }

    return { valid: true, gameState, complete: false };
  }

  static validateCheckersMove(board, from, to, playerColor) {
    const piece = board[from.row][from.col];

    if (!piece || piece.color !== playerColor) {
      return { valid: false, error: 'Not your piece' };
    }

    if (board[to.row][to.col] !== null) {
      return { valid: false, error: 'Target square occupied' };
    }

    const rowDiff = to.row - from.row;
    const colDiff = to.col - from.col;

    // Regular move (1 square diagonally)
    if (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 1) {
      // Check direction based on piece type
      if (!piece.isKing) {
        if (playerColor === 'black' && rowDiff < 0) {
          return { valid: false, error: 'Invalid direction' };
        }
        if (playerColor === 'red' && rowDiff > 0) {
          return { valid: false, error: 'Invalid direction' };
        }
      }
      return { valid: true };
    }

    // Capture move (2 squares diagonally)
    if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
      const midRow = from.row + rowDiff / 2;
      const midCol = from.col + colDiff / 2;
      const capturedPiece = board[midRow][midCol];

      if (!capturedPiece || capturedPiece.color === playerColor) {
        return { valid: false, error: 'Invalid capture' };
      }

      // Check direction for non-kings
      if (!piece.isKing) {
        if (playerColor === 'black' && rowDiff < 0) {
          return { valid: false, error: 'Invalid direction' };
        }
        if (playerColor === 'red' && rowDiff > 0) {
          return { valid: false, error: 'Invalid direction' };
        }
      }

      return { valid: true, captured: { row: midRow, col: midCol } };
    }

    return { valid: false, error: 'Invalid move' };
  }

  static hasMoreCaptures(board, pos, playerColor) {
    const directions = [[-2, -2], [-2, 2], [2, -2], [2, 2]];
    const piece = board[pos.row][pos.col];

    for (const [dRow, dCol] of directions) {
      const to = { row: pos.row + dRow, col: pos.col + dCol };

      if (to.row < 0 || to.row > 7 || to.col < 0 || to.col > 7) continue;

      const validation = this.validateCheckersMove(board, pos, to, playerColor);
      if (validation.valid && validation.captured) {
        return true;
      }
    }

    return false;
  }

  static checkCheckersWinner(board, players) {
    let blackPieces = 0;
    let redPieces = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          if (piece.color === 'black') blackPieces++;
          if (piece.color === 'red') redPieces++;
        }
      }
    }

    if (blackPieces === 0) return players[1]; // Red wins
    if (redPieces === 0) return players[0]; // Black wins

    return null;
  }
}

module.exports = GameLogic;

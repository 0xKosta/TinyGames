// Rock Paper Scissors Game

function initRPSGame(gameState, players) {
  const gameContainer = document.getElementById('rpsGame');
  gameContainer.style.display = 'block';

  // Reset UI
  document.querySelectorAll('.rps-btn').forEach(btn => {
    btn.disabled = false;
  });

  document.getElementById('rpsWaiting').style.display = 'none';

  // Update turn indicator
  updateTurnIndicator('Make your choice!');

  // Add click handlers
  document.querySelectorAll('.rps-btn').forEach(btn => {
    btn.onclick = () => {
      const choice = btn.dataset.choice;

      // Disable all buttons after choice
      document.querySelectorAll('.rps-btn').forEach(b => {
        b.disabled = true;
      });

      // Show waiting message
      document.getElementById('rpsWaiting').style.display = 'block';

      // Send move to server
      AppState.socket.emit('gameMove', {
        moveData: { choice }
      });
    };
  });
}

function updateRPSGame(gameState, choices) {
  if (choices && Object.keys(choices).length === 2) {
    // Both players have chosen - game is over, no need to update UI
    // The result modal will be shown by lobby.js
  }
}

function updateTurnIndicator(message) {
  document.getElementById('turnIndicator').textContent = message;
}

# 🎮 Multiplayer Games Web App

A lightweight, real-time multiplayer games platform featuring classic games with a modern, sleek design. Built with vanilla JavaScript and Socket.io for optimal performance.

## 🎯 Features

### Games Included
- **Rock Paper Scissors** - Classic hand game
- **Tic Tac Toe** - Three in a row wins
- **Connect 4** - Four in a row wins
- **Checkers** - Strategic board game

### Core Features
- ✅ Real-time multiplayer gameplay
- ✅ Public and private lobby system
- ✅ Automatic lobby cleanup (2-minute timeout for single players)
- ✅ Host-controlled lobbies (lobby closes when host leaves)
- ✅ Mobile-responsive design
- ✅ Modern, sleek UI with fun color scheme
- ✅ Win/Loss/Draw notifications
- ✅ Rematch functionality
- ✅ Copy lobby ID for easy sharing

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TinyGames
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎮 How to Play

### Starting a Game

1. **Enter your name** on the home screen
2. **Select a game** from the available options
3. **Choose lobby type:**
   - **Public Lobby** - Visible to all players
   - **Private Lobby** - Share the lobby ID with friends

### Joining a Game

1. **Join from the lobby list** - Click on any available public lobby
2. **Join via lobby ID** - Have a friend share their private lobby ID and join directly

### In the Waiting Room

1. Wait for a second player to join
2. Click "Ready Up!" when you're ready to play
3. Game starts when both players are ready

### Playing

- Follow the game-specific rules
- Take turns (except in Rock Paper Scissors where you choose simultaneously)
- Win, lose, or draw messages will appear when the game ends
- Choose to rematch or return to the main menu

## 🏗️ Technical Architecture

### Backend
- **Express.js** - Web server
- **Socket.io** - Real-time bidirectional communication
- **Node.js** - Runtime environment

### Frontend
- **Vanilla JavaScript** - No framework overhead for maximum performance
- **CSS Grid & Flexbox** - Responsive layouts
- **Socket.io Client** - Real-time communication

### Project Structure
```
TinyGames/
├── server/
│   ├── server.js          # Main server and Socket.io setup
│   ├── lobbyManager.js    # Lobby management logic
│   └── gameLogic.js       # Game rules and validation
├── public/
│   ├── index.html         # Main HTML structure
│   ├── css/
│   │   └── styles.css     # All styling
│   └── js/
│       ├── main.js        # App initialization and state
│       ├── lobby.js       # Lobby UI management
│       └── games/
│           ├── rps.js
│           ├── tictactoe.js
│           ├── connect4.js
│           └── checkers.js
├── package.json
└── README.md
```

## 🎨 Design Features

### Color Scheme
- Primary: Indigo gradient (`#6366f1` → `#4f46e5`)
- Secondary: Pink (`#ec4899`)
- Accent: Teal (`#14b8a6`)
- Dark theme background for reduced eye strain

### Responsive Design
- Mobile-first approach
- Touch-friendly controls
- Optimized for screens from 320px to 1920px+
- Automatic layout adjustments for tablets and phones

## 🔧 Configuration

### Port Configuration
Default port is `3000`. To change:
```bash
PORT=8080 npm start
```

### Lobby Timeout
Lobbies with a single player are automatically deleted after 2 minutes. To modify this, edit `LONELY_TIMEOUT` in `server/lobbyManager.js`:

```javascript
const LONELY_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds
```

## 🎯 Game Rules

### Rock Paper Scissors
- Both players choose simultaneously
- Rock beats Scissors
- Scissors beats Paper
- Paper beats Rock

### Tic Tac Toe
- Players alternate placing X and O
- First to get 3 in a row (horizontal, vertical, or diagonal) wins
- Draw if all 9 squares are filled with no winner

### Connect 4
- Players alternate dropping colored discs
- First to get 4 in a row (horizontal, vertical, or diagonal) wins
- Draw if all 42 squares are filled with no winner

### Checkers
- Black pieces start at the top (player 1)
- Red pieces start at the bottom (player 2)
- Pieces move diagonally on dark squares
- Capture opponent pieces by jumping over them
- Pieces become "kings" when reaching the opposite end
- Kings can move in any diagonal direction
- Win by capturing all opponent pieces

## 🐛 Error Handling

The application includes comprehensive error handling for:
- Connection failures
- Invalid moves
- Full lobbies
- Lobby not found
- Network timeouts
- Player disconnections

## 📱 Mobile Support

Fully tested and optimized for:
- iOS Safari
- Android Chrome
- Mobile Firefox
- Responsive touch controls
- Portrait and landscape orientations

## 🚀 Performance

- **Lightweight**: No heavy frameworks
- **Fast**: Vanilla JS for optimal speed
- **Efficient**: Socket.io for minimal data transfer
- **Scalable**: In-memory state management

## 🔒 Security Considerations

- Input validation on both client and server
- Move validation on the server
- No client-side game state manipulation
- Automatic cleanup of abandoned lobbies

## 📝 License

MIT License - Feel free to use this project for learning or production!

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Add new games

## 📧 Support

For issues or questions, please open an issue on the repository.

---

Made with ❤️ using vanilla JavaScript and Socket.io
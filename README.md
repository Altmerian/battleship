# NodeJS websocket task. Battleship.
> Static http server and base task packages. 
> By default WebSocket client tries to connect to the 3000 port.

## Installation
1. Clone/download repo
2. `npm install`

## Launch Instructions

Run the following command to start the backend and serve the UI:

```
npm run start
```

- UI app served at: [http://localhost:8181](http://localhost:8181)
- WebSocket server runs on port 3000

---

## Game Instructions

### 1. Registration / Login
- Enter a unique player name and password in the UI to register or log in.
- Your win count is tracked by your player name.

### 2. Creating or Joining a Room
- Click "Create Room" to start a new game room, or select an available room from the list to join.
- A game starts when two players are present in a room.

### 3. Placing Ships
- Each player places their ships on their board according to Battleship rules.
- Ships cannot overlap or be placed outside the board.
- Confirm your ship placement to proceed.
- Ships could be placed automatically in the UI.

### 4. Playing the Game
- Players take turns attacking cells on the opponent's board.
- The server will indicate if an attack is a miss, hit, or if a ship is sunk.
- If you hit or sink a ship, you get another turn.
- The game continues until all ships of one player are sunk.

### 5. Winning
- The first player to sink all of the opponent's ships wins the game.
- The winner's name and win count are updated on the leaderboard.

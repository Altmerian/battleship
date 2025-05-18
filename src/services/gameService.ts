import { ClientConnection } from "../websocket_server/clientConnection";
import { GameInstance, GamePlayer, GameBoard, Cell, GameState, Ship, Position } from "../types/game.types";

// Helper to create an empty 10x10 game board
const createEmptyBoard = (): GameBoard => {
  const board: GameBoard = [];
  for (let y = 0; y < 10; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < 10; x++) {
      row.push(new Cell(x, y, "empty"));
    }
    board.push(row);
  }
  return board;
};

export interface InGamePlayerData {
  idPlayer: string; // "0" or "1"
  client: ClientConnection;
  playerIndex: string;
  name: string;
}

export class GameService {
  private activeGames: Map<string, GameInstance> = new Map();

  constructor() {
    console.log("GameService initialized");
  }

  public createGame(gameId: string, playersData: [InGamePlayerData, InGamePlayerData]): GameInstance | null {
    if (this.activeGames.has(gameId)) {
      console.error(`Game with ID ${gameId} already exists.`);
      return null;
    }

    const gamePlayers: [GamePlayer, GamePlayer] = [
      {
        ...playersData[0],
        ships: [],
        board: createEmptyBoard(),
        shipsPlaced: false,
      },
      {
        ...playersData[1],
        ships: [],
        board: createEmptyBoard(),
        shipsPlaced: false,
      },
    ];

    const newGame: GameInstance = {
      gameId,
      players: gamePlayers,
      currentPlayerId: null,
      gameState: "placing_ships" as GameState,
    };

    this.activeGames.set(gameId, newGame);
    console.log(
      `Game created: ${gameId} with players ${playersData[0].name} (idPlayer: ${playersData[0].idPlayer}) and ${playersData[1].name} (idPlayer: ${playersData[1].idPlayer})`,
    );
    return newGame;
  }

  public getGame(gameId: string): GameInstance | undefined {
    return this.activeGames.get(gameId);
  }

  public addShips(
    gameId: string,
    playerId: string,
    shipsData: Ship[],
  ): {
    success: boolean;
    error?: string;
    gameStarted?: boolean;
    currentPlayerId?: string | null;
    gameInstance?: GameInstance;
  } {
    const game = this.activeGames.get(gameId);
    if (!game) {
      return { success: false, error: "Game not found." };
    }

    if (game.gameState !== "placing_ships") {
      return { success: false, error: "Ships can only be placed during 'placing_ships' state." };
    }

    const player = game.players.find((p) => p.idPlayer === playerId);
    if (!player) {
      return { success: false, error: "Player not found in this game." };
    }

    if (player.shipsPlaced) {
      return { success: false, error: "Player has already placed ships." };
    }

    if (!shipsData || shipsData.length === 0) {
      return { success: false, error: "No ships data provided." };
    }

    player.ships = shipsData.map((ship) => ({ ...ship, hits: 0, isSunk: false }));
    player.board = createEmptyBoard();

    for (const ship of player.ships) {
      for (let i = 0; i < ship.length; i++) {
        const x = ship.position.x + (ship.direction ? 0 : i);
        const y = ship.position.y + (ship.direction ? i : 0);

        if (x < 0 || x >= 10 || y < 0 || y >= 10) {
          console.error(`Ship part out of bounds for ship type ${ship.type} at ${x},${y}`);
          return { success: false, error: `Ship type ${ship.type} is out of bounds.` };
        }
        if (player.board[y][x].status !== "empty") {
          console.error(`Ship overlap for ship type ${ship.type} at ${x},${y}`);
          return { success: false, error: `Ship type ${ship.type} overlaps with another ship.` };
        }
        player.board[y][x].status = "ship";
      }
    }

    player.shipsPlaced = true;
    console.log(`Player ${player.name} (idPlayer: ${playerId}) in game ${gameId} placed ships.`);

    const opponent = game.players.find((p) => p.idPlayer !== playerId);
    if (!opponent) {
      return { success: false, error: "Opponent not found." };
    }

    if (opponent.shipsPlaced) {
      game.gameState = "active";
      game.currentPlayerId = game.players[0].idPlayer;
      console.log(`Game ${gameId} state changed to 'active'. Current player: ${game.currentPlayerId}`);
      return {
        success: true,
        gameStarted: true,
        currentPlayerId: game.currentPlayerId,
        gameInstance: game,
      };
    }

    return { success: true, gameStarted: false, gameInstance: game };
  }

  public handleAttack(
    gameId: string,
    attackingPlayerId: string,
    position: Position,
  ): {
    status?: "miss" | "hit" | "killed";
    position: Position;
    currentPlayerId: string | null;
    shipKilled?: { ship: Ship; cellsAround: { x: number; y: number }[] };
    gameOver?: boolean;
    winnerId?: string | null;
    error?: string;
  } {
    const game = this.activeGames.get(gameId);
    const { x, y } = position;

    if (!game) {
      return { error: "Game not found.", position: position, currentPlayerId: null };
    }

    if (game.gameState !== "active") {
      return { error: "Game is not active.", position: position, currentPlayerId: game.currentPlayerId };
    }

    if (game.currentPlayerId !== attackingPlayerId) {
      return { error: "Not your turn.", position: position, currentPlayerId: game.currentPlayerId };
    }

    if (x < 0 || x >= 10 || y < 0 || y >= 10) {
      return { error: "Coordinates out of bounds.", position: position, currentPlayerId: game.currentPlayerId };
    }

    const attacker = game.players.find((p) => p.idPlayer === attackingPlayerId);
    const opponent = game.players.find((p) => p.idPlayer !== attackingPlayerId);

    if (!opponent || !attacker) {
      return { error: "Player not found.", position: position, currentPlayerId: game.currentPlayerId };
    }

    const targetCell = opponent.board[y][x];

    if (targetCell.isAlreadyAttacked()) {
      return {
        error: "Cell already attacked.",
        position: position,
        currentPlayerId: game.currentPlayerId,
      };
    }

    if (targetCell.status === "empty") {
      opponent.board[y][x].status = "miss";
      game.currentPlayerId = opponent.idPlayer; // Switch turn
      console.log(
        `Game ${gameId}: Player ${attackingPlayerId} MISS at (${x},${y}). Next turn: ${game.currentPlayerId}`,
      );
      return { status: "miss", position: position, currentPlayerId: game.currentPlayerId };
    }

    if (targetCell.status === "ship") {
      opponent.board[y][x].status = "hit";
      let hitShip: Ship | undefined = undefined;

      // Find which ship was hit and update its hit count
      for (const ship of opponent.ships) {
        let partOfThisShip = false;
        for (let i = 0; i < ship.length; i++) {
          const shipX = ship.position.x + (ship.direction ? 0 : i);
          const shipY = ship.position.y + (ship.direction ? i : 0);
          if (shipX === x && shipY === y) {
            hitShip = ship;
            partOfThisShip = true;
            break;
          }
        }
        if (partOfThisShip && hitShip) {
          hitShip.hits = (hitShip.hits || 0) + 1;
          break;
        }
      }

      if (!hitShip) {
        console.error(`Game ${gameId}: Hit a 'ship' cell at (${x},${y}) but couldn't find the ship object.`);
        return {
          error: "Internal server error: Ship data inconsistent.",
          position: position,
          currentPlayerId: game.currentPlayerId,
        };
      }

      if (hitShip.hits && hitShip.hits >= hitShip.length) {
        // SHIP KILLED
        hitShip.isSunk = true;
        const cellsAroundSunkShip: { x: number; y: number }[] = [];

        for (let i = 0; i < hitShip.length; i++) {
          const shipX = hitShip.position.x + (hitShip.direction ? 0 : i);
          const shipY = hitShip.position.y + (hitShip.direction ? i : 0);
          if (opponent.board[shipY] && opponent.board[shipY][shipX]) {
            opponent.board[shipY][shipX].status = "sunk_ship_part";
          }
        }

        this.markAroundSunkShip(opponent.board, hitShip, cellsAroundSunkShip);

        console.log(
          `Game ${gameId}: Player ${attackingPlayerId} KILLED ship type ${hitShip.type} at (${x},${y}). Player ${attackingPlayerId} shoots again.`,
        );

        const allOpponentShipsSunk = opponent.ships.every((s) => s.isSunk);
        if (allOpponentShipsSunk) {
          game.gameState = "finished";
          console.log(`Game ${gameId}: All ships of player ${opponent.name} sunk. Player ${attacker.name} WINS!`);
          return {
            status: "killed",
            position: position,
            shipKilled: { ship: hitShip, cellsAround: cellsAroundSunkShip },
            currentPlayerId: attackingPlayerId,
            gameOver: true,
            winnerId: attackingPlayerId,
          };
        }

        game.currentPlayerId = attackingPlayerId;
        return {
          status: "killed",
          position: position,
          shipKilled: { ship: hitShip, cellsAround: cellsAroundSunkShip },
          currentPlayerId: attackingPlayerId,
        };
      } else {
        // SHIP HIT, NOT KILLED
        console.log(
          `Game ${gameId}: Player ${attackingPlayerId} HIT ship at (${x},${y}). Player ${attackingPlayerId} shoots again.`,
        );
        game.currentPlayerId = attackingPlayerId; // Attacker shoots again
        return { status: "hit", position: position, currentPlayerId: attackingPlayerId };
      }
    }
    return { error: "Unknown cell status encountered.", position: position, currentPlayerId: game.currentPlayerId };
  }

  private markAroundSunkShip(board: GameBoard, sunkShip: Ship, cellsMarked: { x: number; y: number }[]): void {
    for (let i = 0; i < sunkShip.length; i++) {
      const shipX = sunkShip.position.x + (sunkShip.direction ? 0 : i);
      const shipY = sunkShip.position.y + (sunkShip.direction ? i : 0);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;

          const checkX = shipX + dx;
          const checkY = shipY + dy;

          if (checkX >= 0 && checkX < 10 && checkY >= 0 && checkY < 10) {
            const cell = board[checkY][checkX];
            if (cell.status === "empty") {
              cell.status = "around_sunk_ship";
              cellsMarked.push({ x: checkX, y: checkY });
            }
          }
        }
      }
    }
  }

  public handleRandomAttack(gameId: string, attackingPlayerId: string): ReturnType<typeof this.handleAttack> {
    const game = this.activeGames.get(gameId);
    if (!game) {
      return { error: "Game not found.", position: { x: -1, y: -1 }, currentPlayerId: null };
    }

    if (game.gameState !== "active") {
      return { error: "Game is not active.", position: { x: -1, y: -1 }, currentPlayerId: game.currentPlayerId };
    }
    if (game.currentPlayerId !== attackingPlayerId) {
      return {
        error: "Not your turn for random attack.",
        position: { x: -1, y: -1 },
        currentPlayerId: game.currentPlayerId,
      };
    }

    const opponent = game.players.find((p) => p.idPlayer !== attackingPlayerId);
    if (!opponent) {
      return { error: "Opponent not found.", position: { x: -1, y: -1 }, currentPlayerId: game.currentPlayerId };
    }

    const validCells: { x: number; y: number }[] = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const cell = opponent.board[r][c];
        if (cell.status === "empty" || cell.status === "ship") {
          validCells.push({ x: c, y: r });
        }
      }
    }

    if (validCells.length === 0) {
      console.warn(`Game ${gameId}: No valid cells left for random attack by ${attackingPlayerId}.`);
      return {
        error: "No valid cells left to attack.",
        position: { x: -1, y: -1 },
        currentPlayerId: game.currentPlayerId,
      };
    }

    const randomIndex = Math.floor(Math.random() * validCells.length);
    const randomCell = validCells[randomIndex];

    console.log(
      `Game ${gameId}: Player ${attackingPlayerId} performing random attack at (${randomCell.x},${randomCell.y}).`,
    );
    return this.handleAttack(gameId, attackingPlayerId, { x: randomCell.x, y: randomCell.y });
  }
}

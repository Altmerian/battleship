import { ClientConnection } from "../websocket_server/clientConnection";
import { GameInstance, GamePlayer, GameBoard, Cell, CellStatus, GameState, Ship } from "../types/game.types";

// Helper to create an empty 10x10 game board
const createEmptyBoard = (): GameBoard => {
  const board: GameBoard = [];
  for (let y = 0; y < 10; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < 10; x++) {
      row.push({ x, y, status: "empty" as CellStatus });
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

  // TODO: Further methods for attack, etc.
}

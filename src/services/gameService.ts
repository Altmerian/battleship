import { ClientConnection } from "../websocket_server/clientConnection";
import { GameInstance, GamePlayer, GameBoard, Cell, CellStatus, GameState } from "../types/game.types";

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
      currentPlayerId: gamePlayers[0].idPlayer,
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

  // TODO: Further methods for addShips, attack, etc.
}

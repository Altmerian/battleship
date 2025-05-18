import { ClientConnection } from "../websocket_server/clientConnection";

export interface Position {
  x: number;
  y: number;
}

export type ShipType = "small" | "medium" | "large" | "huge";

export interface Ship {
  position: Position;
  direction: boolean; // true for vertical, false for horizontal
  length: number;
  type: ShipType;
  hits?: number;
  isSunk?: boolean;
}

export interface AddShipsRequestData {
  gameId: string;
  ships: Ship[];
  indexPlayer: string;
}

export interface StartGameResponseData {
  ships: Ship[];
  currentPlayerIndex: string;
}

export type AttackStatus = "miss" | "killed" | "shot";

export interface AttackRequestData {
  gameId: string;
  position: Position;
  indexPlayer: string;
}

export interface AttackResponseData {
  position: Position;
  currentPlayer: string;
  status: AttackStatus;
}

export interface RandomAttackRequestData {
  gameId: string;
  indexPlayer: string;
}

export interface TurnResponseData {
  currentPlayer: string;
}

export interface FinishGameResponseData {
  winPlayer: string;
}

export type CellStatus = "empty" | "ship" | "hit" | "miss" | "sunk_ship_part" | "around_sunk_ship";

export class Cell {
  x: number;
  y: number;
  status: CellStatus;

  constructor(x: number, y: number, status: CellStatus) {
    this.x = x;
    this.y = y;
    this.status = status;
  }

  isAlreadyAttacked(): boolean {
    return (
      this.status === "hit" ||
      this.status === "miss" ||
      this.status === "sunk_ship_part" ||
      this.status === "around_sunk_ship"
    );
  }
}

export type GameBoard = Cell[][];

export interface GamePlayer {
  idPlayer: string; // Game-specific ID ("0" or "1")
  client: ClientConnection;
  playerIndex: string;
  name: string;
  ships: Ship[];
  board: GameBoard;
  shipsPlaced: boolean;
}

export type GameState = "placing_ships" | "active" | "finished";

export interface GameInstance {
  gameId: string;
  players: [GamePlayer, GamePlayer];
  currentPlayerId: string | null;
  gameState: GameState;
}

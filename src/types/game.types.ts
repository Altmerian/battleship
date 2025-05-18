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
  x: number;
  y: number;
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

export interface Cell {
  x: number;
  y: number;
  status: CellStatus;
  shipId?: string;
}

export type GameBoard = Cell[][];

// Represents a player within a game instance on the server
export interface GamePlayer {
  idPlayer: string;
  name: string;
  playerIndex: string;
  ships: Ship[];
  board: GameBoard;
  shipsPlaced: boolean;
  isReady?: boolean;
}

export type GameState = "pending_players" | "placing_ships" | "active" | "finished";

export interface GameInstance {
  gameId: string;
  players: [GamePlayer, GamePlayer];
  currentPlayerId: string;
  gameState: GameState;
  winnerId?: string;
}

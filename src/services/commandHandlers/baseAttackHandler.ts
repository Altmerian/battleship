import {
  AttackResponseData,
  AttackStatus,
  TurnResponseData,
  FinishGameResponseData,
  Ship,
  Position,
} from "../../types/game.types";
import { CommandHandlerDependencies } from "./commandHandler.interface";

export interface AttackServiceResult {
  status?: "miss" | "hit" | "killed";
  position: Position;
  currentPlayerId: string | null;
  shipKilled?: { ship: Ship; cellsAround: Position[] };
  gameOver?: boolean;
  winnerId?: string | null;
  error?: string;
}

export class BaseAttackHandler {
  protected processAttackResult(
    result: AttackServiceResult,
    gameId: string,
    attackingPlayerId: string,
    dependencies: CommandHandlerDependencies,
    commandTypeForError: "attack" | "random_attack",
  ): void {
    const { gameService, responseService } = dependencies;

    if (!result.status || !result.position || result.currentPlayerId === undefined) {
      console.error(
        `Invalid result from gameService attack call for player ${attackingPlayerId} in game ${gameId}: Missing status, position, or currentPlayerId`,
      );
      return;
    }

    const game = gameService.getGame(gameId);
    if (!game) {
      console.error(`BaseAttackHandler: Game ${gameId} not found after successful attack processing logic.`);
      return;
    }

    let responseAttackStatus: AttackStatus;
    if (result.status === "hit") {
      responseAttackStatus = "shot";
    } else {
      responseAttackStatus = result.status as AttackStatus;
    }

    const attackResponseData: AttackResponseData = {
      position: result.position,
      currentPlayer: attackingPlayerId,
      status: responseAttackStatus,
    };

    game.players.forEach((playerInGame) => {
      responseService.sendToClient(playerInGame.client, "attack", attackResponseData, 0);
    });
    console.log(
      `Sent attack response (from ${commandTypeForError}) to players in game ${gameId} for attack at (${result.position.x},${result.position.y}) by ${attackingPlayerId}, result: ${responseAttackStatus}, next player: ${result.currentPlayerId}`,
    );

    if (result.shipKilled && result.shipKilled.cellsAround.length > 0) {
      console.log(
        `Ship killed (from ${commandTypeForError}). Sending updates for ${result.shipKilled.cellsAround.length} cells around the ship.`,
      );
      result.shipKilled.cellsAround.forEach((cellPos) => {
        const aroundAttackData: AttackResponseData = {
          position: cellPos,
          currentPlayer: attackingPlayerId,
          status: "miss",
        };
        game.players.forEach((playerInGame) => {
          responseService.sendToClient(playerInGame.client, "attack", aroundAttackData, 0);
        });
      });
    }

    if (result.gameOver) {
      if (result.winnerId) {
        console.log(`Game ${gameId} finished (from ${commandTypeForError}). Winner: ${result.winnerId}.`);
        const finishData: FinishGameResponseData = { winPlayer: result.winnerId };
        game.players.forEach((playerInGame) => {
          responseService.sendToClient(playerInGame.client, "finish", finishData, 0);
        });
      }
    } else {
      if (result.currentPlayerId) {
        const turnData: TurnResponseData = { currentPlayer: result.currentPlayerId };
        game.players.forEach((playerInGame) => {
          responseService.sendToClient(playerInGame.client, "turn", turnData, 0);
        });
        console.log(
          `Sent turn update (from ${commandTypeForError}) to players in game ${gameId}. Current player: ${result.currentPlayerId}`,
        );
      } else {
        console.warn(
          `Game ${gameId} is not over (from ${commandTypeForError}), but currentPlayerId is null after an attack.`,
        );
      }
    }
  }
}

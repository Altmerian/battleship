import { ICommandHandler, CommandHandlerDependencies } from "./commandHandler.interface";
import { AttackRequestData, Position } from "../../types/game.types";
import { ClientConnection } from "../../websocket_server/clientConnection";
import { BaseAttackHandler, AttackServiceResult } from "./baseAttackHandler";

export class AttackHandler extends BaseAttackHandler implements ICommandHandler<AttackRequestData> {
  execute(
    client: ClientConnection,
    data: AttackRequestData,
    messageId: number,
    dependencies: CommandHandlerDependencies,
  ): void {
    const { gameService, responseService } = dependencies;
    const { gameId, x, y, indexPlayer: attackingPlayerId } = data;

    if (gameId === undefined || x === undefined || y === undefined || attackingPlayerId === undefined) {
      responseService.sendError(
        client,
        "Invalid attack request data: gameId, x, y, and indexPlayer are required.",
        "attack",
        messageId,
      );
      return;
    }

    const position: Position = { x, y };
    const result: AttackServiceResult = gameService.handleAttack(gameId, attackingPlayerId, position);

    if (result.error) {
      console.warn(`Attack error for player ${attackingPlayerId} in game ${gameId} at (${x},${y}): ${result.error}`);
      responseService.sendError(client, result.error, "attack", messageId);
      return;
    }

    this.processAttackResult(result, gameId, attackingPlayerId, dependencies, "attack");
  }
}

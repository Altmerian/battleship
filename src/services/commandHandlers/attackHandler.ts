import { ICommandHandler, CommandHandlerDependencies } from "./commandHandler.interface";
import { AttackRequestData } from "../../types/game.types";
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
    const { gameId, position, indexPlayer: attackingPlayerId } = data;

    if (gameId === undefined || position === undefined || attackingPlayerId === undefined) {
      responseService.sendError(
        client,
        "Invalid attack request data: gameId, position, and indexPlayer are required.",
        "attack",
        messageId,
      );
      return;
    }

    const result: AttackServiceResult = gameService.handleAttack(gameId, attackingPlayerId, position);

    if (result.error) {
      console.warn(
        `Attack error for player ${attackingPlayerId} in game ${gameId} at (${position.x},${position.y}): ${result.error}`,
      );
      responseService.sendError(client, result.error, "attack", messageId);
      return;
    }

    this.processAttackResult(result, gameId, attackingPlayerId, dependencies, "attack");
  }
}

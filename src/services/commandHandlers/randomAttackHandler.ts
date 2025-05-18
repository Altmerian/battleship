import { ICommandHandler, CommandHandlerDependencies } from "./commandHandler.interface";
import { RandomAttackRequestData } from "../../types/game.types";
import { ClientConnection } from "../../websocket_server/clientConnection";
import { BaseAttackHandler, AttackServiceResult } from "./baseAttackHandler"; // Import base class and result type

export class RandomAttackHandler extends BaseAttackHandler implements ICommandHandler<RandomAttackRequestData> {
  execute(
    client: ClientConnection,
    data: RandomAttackRequestData,
    messageId: number,
    dependencies: CommandHandlerDependencies,
  ): void {
    const { gameService, responseService } = dependencies;
    const { gameId, indexPlayer: attackingPlayerId } = data;

    if (gameId === undefined || attackingPlayerId === undefined) {
      responseService.sendError(
        client,
        "Invalid random_attack request data: gameId and indexPlayer are required.",
        "random_attack",
        messageId,
      );
      return;
    }

    const result: AttackServiceResult = gameService.handleRandomAttack(gameId, attackingPlayerId);

    if (result.error) {
      console.warn(`Random Attack error for player ${attackingPlayerId} in game ${gameId}: ${result.error}`);
      responseService.sendError(client, result.error, "random_attack", messageId);
      return;
    }

    this.processAttackResult(result, gameId, attackingPlayerId, dependencies, "random_attack");
  }
}

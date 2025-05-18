import { ICommandHandler, CommandHandlerDependencies } from "./commandHandler.interface";
import { AddShipsRequestData, StartGameResponseData, TurnResponseData } from "../../types/game.types";
import { ClientConnection } from "../../websocket_server/clientConnection";

export class AddShipsHandler implements ICommandHandler<AddShipsRequestData> {
  execute(
    client: ClientConnection,
    data: AddShipsRequestData,
    messageId: number,
    dependencies: CommandHandlerDependencies,
  ): void {
    const { gameService, responseService } = dependencies;
    const { gameId, ships, indexPlayer } = data;

    if (!gameId || !ships || indexPlayer === undefined) {
      responseService.sendError(client, "Invalid add_ships request data.", "add_ships", messageId);
      return;
    }

    const result = gameService.addShips(gameId, indexPlayer, ships);

    if (!result.success || !result.gameInstance) {
      responseService.sendError(client, result.error || "Failed to add ships.", "add_ships", messageId);
      return;
    }

    console.log(
      `Player ${client.playerId} (idPlayer: ${indexPlayer}) successfully submitted ships for game ${gameId}.`,
    );

    if (result.gameStarted && result.currentPlayerId && result.gameInstance) {
      const game = result.gameInstance;
      console.log(`Game ${gameId} starting. Current player: ${result.currentPlayerId}`);

      game.players.forEach((player) => {
        const startGameData: StartGameResponseData = {
          ships: player.ships,
          currentPlayerIndex: result.currentPlayerId!,
        };
        responseService.sendToClient(player.client, "start_game", startGameData, 0);
      });

      const turnData: TurnResponseData = {
        currentPlayer: result.currentPlayerId!,
      };
      game.players.forEach((player) => {
        responseService.sendToClient(player.client, "turn", turnData, 0);
      });

      console.log(`Sent start_game and turn to players in game ${gameId}`);
    } else {
      console.log(
        `Player ${client.playerId} (idPlayer: ${indexPlayer}) placed ships in game ${gameId}. Waiting for opponent.`,
      );
    }
  }
}

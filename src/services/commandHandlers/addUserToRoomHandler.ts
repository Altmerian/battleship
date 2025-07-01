import { ClientConnection } from "../../websocket_server/clientConnection";
import { ICommandHandler, CommandHandlerDependencies } from "./commandHandler.interface";
import { AddUserToRoomRequestData, CreateGameResponseData } from "../../types/room.types";
import { RoomData } from "../../types/room.types";

export class AddUserToRoomHandler implements ICommandHandler<AddUserToRoomRequestData> {
  public execute(
    client: ClientConnection,
    data: AddUserToRoomRequestData,
    messageId: number,
    dependencies: CommandHandlerDependencies,
  ): void {
    const { roomService, responseService } = dependencies;

    if (!client.playerId) {
      console.error(`Player ${client.clientId} attempting to join room without being registered.`);
      responseService.sendError(client, "Player not registered. Please register first.", "add_user_to_room", messageId);
      return;
    }

    if (!data || typeof data.indexRoom !== "string") {
      console.error("Invalid 'add_user_to_room' data received:", data);
      responseService.sendError(
        client,
        "Invalid request data. 'indexRoom' (roomId) is required.",
        "add_user_to_room",
        messageId,
      );
      return;
    }

    const roomId = data.indexRoom;
    const result = roomService.addUserToRoom(client, client.playerId, roomId);

    if (result.error || !result.room) {
      console.warn(`Failed to add player ${client.playerId} to room ${roomId}: ${result.errorText}`);
      responseService.sendError(client, result.errorText || "Failed to join room.", "add_user_to_room", messageId);
      return;
    }

    console.log(`Player ${client.playerId} successfully added to room ${roomId}.`);

    if (result.gameReady && result.room) {
      console.log(`Room ${roomId} is ready for a game. Sending create_game responses.`);
      this.sendCreateGameResponses(result.room, dependencies);
    }

    this.broadcastRoomUpdates(dependencies);
  }
  private broadcastRoomUpdates(dependencies: CommandHandlerDependencies): void {
    const availableRooms = dependencies.roomService.getAvailableRooms();
    dependencies.responseService.broadcast(dependencies.allClients, "update_room", availableRooms);
  }

  private sendCreateGameResponses(room: RoomData, dependencies: CommandHandlerDependencies): void {
    if (!room.gameId) {
      console.error(`Cannot send create_game response, gameId missing for room ${room.roomId}`);
      return;
    }

    room.roomUsers.forEach((user) => {
      if (!user.idPlayer) {
        console.error(
          `Cannot send create_game response, idPlayer missing for user ${user.index} in room ${room.roomId}`,
        );
        return;
      }
      const createGameResponse: CreateGameResponseData = {
        idGame: room.gameId as string,
        idPlayer: user.idPlayer,
      };
      dependencies.responseService.sendToClient(user.client, "create_game", createGameResponse, 0);
      console.log(`Sent create_game to player ${user.index} (idPlayer: ${user.idPlayer}) for game ${room.gameId}`);
    });
  }
}

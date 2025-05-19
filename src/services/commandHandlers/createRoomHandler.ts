import { ClientConnection } from "../../websocket_server/clientConnection";
import { ICommandHandler, CommandHandlerDependencies } from "./commandHandler.interface";

export class CreateRoomHandler implements ICommandHandler {
  private broadcastRoomUpdates(dependencies: CommandHandlerDependencies): void {
    const availableRooms = dependencies.roomService.getAvailableRooms();
    dependencies.responseService.broadcast(dependencies.allClients, "update_room", availableRooms);
  }

  public execute(
    client: ClientConnection,
    data: null,
    messageId: number,
    dependencies: CommandHandlerDependencies,
  ): void {
    const { roomService, responseService } = dependencies;

    if (!client.playerId) {
      console.error(`Player ${client.clientId} attempting to create room without being registered.`);
      responseService.sendError(client, "Player not registered. Please register first.", "create_room", messageId);
      return;
    }

    const currentRoomPlayerIsIn = roomService.getPlayerRoom(client.playerId);
    if (currentRoomPlayerIsIn) {
      console.warn(
        `Player ${client.playerId} trying to create a room while already in room ${currentRoomPlayerIsIn.roomId}.`,
      );
      responseService.sendError(
        client,
        `You are already in room ${currentRoomPlayerIsIn.roomId}. Cannot create a new room.`,
        "create_room",
        messageId,
      );
      return;
    }

    const newRoom = roomService.createRoom();
    console.log(`Player ${client.playerId} created new room ${newRoom.roomId}.`);

    const addUserResult = roomService.addUserToRoom(client, client.playerId, newRoom.roomId);

    if (addUserResult.error || !addUserResult.room) {
      console.error(
        `Failed to automatically add creator ${client.playerId} to their new room ${newRoom.roomId}: ${addUserResult.errorText}`,
      );
      responseService.sendError(
        client,
        addUserResult.errorText || "Failed to join the room you created.",
        "create_room",
        messageId,
      );
    } else {
      console.log(`Creator ${client.playerId} automatically added to room ${newRoom.roomId}.`);
    }

    this.broadcastRoomUpdates(dependencies);
  }
}

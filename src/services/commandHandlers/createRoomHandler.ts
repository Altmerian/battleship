import { ClientConnection } from "../../websocket_server/clientConnection";
import { ICommandHandler, CommandHandlerDependencies } from "./commandHandler.interface";

export class CreateRoomHandler implements ICommandHandler {
  private broadcastRoomUpdates(dependencies: CommandHandlerDependencies): void {
    const availableRooms = dependencies.roomService.getAvailableRooms();
    dependencies.responseService.broadcast(dependencies.allClients, "update_room", availableRooms);
    console.log("Broadcasted update_room with rooms:", JSON.stringify(availableRooms));
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

    const existingRoom = roomService.getPlayerRoom(client.playerId);
    if (existingRoom) {
      console.warn(`Player ${client.playerId} trying to create a room while already in room ${existingRoom.roomId}.`);
      responseService.sendError(
        client,
        `You are already in room ${existingRoom.roomId}. Cannot create a new room.`,
        "create_room",
        messageId,
      );
      return;
    }

    const newRoom = roomService.createRoom(client, client.playerId);
    console.log(`Player ${client.playerId} created room ${newRoom.roomId}. Initiating room update broadcast.`);

    this.broadcastRoomUpdates(dependencies);
  }
}

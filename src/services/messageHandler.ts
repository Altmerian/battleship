import { ClientConnection } from "../websocket_server/clientConnection";
import { responseService } from "./responseService";
import { WebSocketCommandRequest, RegRequestData, RegResponseData, WinnerData } from "../types";
import { PlayerService } from "./playerService";
import { RoomService } from "./roomService";

export class MessageHandler {
  private playerService: PlayerService;
  private roomService: RoomService;
  private clients: Map<string, ClientConnection>;

  constructor(clients: Map<string, ClientConnection>) {
    this.playerService = new PlayerService();
    this.roomService = new RoomService();
    this.clients = clients;
  }

  /**
   * Handles incoming messages from clients
   * @param client - The client that sent the message
   * @param rawMessage - The raw message string
   */
  public handleMessage(client: ClientConnection, rawMessage: string): void {
    let parsedMessage: WebSocketCommandRequest<unknown> | undefined;

    try {
      const rawObject = JSON.parse(rawMessage);
      if (rawObject.data && typeof rawObject.data === "string") {
        rawObject.data = JSON.parse(rawObject.data);
      }
      if (typeof rawObject.type !== "string" || (typeof rawObject.id !== "number" && rawObject.id !== 0)) {
        throw new Error("Invalid message structure: type or id missing/invalid.");
      }
      parsedMessage = rawObject as WebSocketCommandRequest<unknown>;
      console.log(
        `Received command from client ${client.clientId} (PlayerID: ${client.playerId ?? "N/A"}): Type: ${parsedMessage.type}, ID: ${parsedMessage.id}, Data: ${JSON.stringify(parsedMessage.data)}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid message format.";
      console.error(`Failed to parse message from client ${client.clientId}:`, rawMessage, "Error:", errorMessage);
      const messageId = parsedMessage?.id ?? 0;
      responseService.sendError(client, "Invalid message format or structure.", undefined, messageId);
      return;
    }

    switch (parsedMessage.type) {
      case "reg":
        const regData = parsedMessage.data as RegRequestData;
        if (!this.validateRegData(client, regData)) {
          responseService.sendToClient<RegResponseData>(
            client,
            "reg",
            { name: "", index: "", error: true, errorText: "Invalid registration data format." },
            parsedMessage.id,
          );
          break;
        }

        const regResult = this.playerService.registerOrLogin(regData.name, regData.password);

        if (regResult.error || !regResult.player) {
          responseService.sendToClient<RegResponseData>(
            client,
            "reg",
            { name: regData.name, index: "", error: true, errorText: regResult.errorText || "Registration failed." },
            parsedMessage.id,
          );
          break;
        }

        client.playerId = regResult.player.index;
        responseService.sendToClient<RegResponseData>(
          client,
          "reg",
          { name: regResult.player.name, index: regResult.player.index, error: false },
          parsedMessage.id,
        );
        console.log(`Client ${client.clientId} successfully logged in as PlayerID: ${client.playerId}`);

        const winnersList = this.playerService.getWinnerList();
        responseService.broadcast<WinnerData[]>(this.clients, "update_winners", winnersList);

        this.broadcastRoomUpdates();

        break;

      case "create_room":
        if (!client.playerId) {
          console.error(
            `Player ${client.clientId} attempting to create room without being registered or name missing.`,
          );
          responseService.sendError(
            client,
            "Player not registered or player name is missing. Please register first.",
            "create_room",
            parsedMessage.id,
          );
          break;
        }

        // Check if player is already in a room
        const existingRoom = this.roomService.getPlayerRoom(client.playerId);
        if (existingRoom) {
          console.warn(
            `Player ${client.playerId} trying to create a room while already in room ${existingRoom.roomId}.`,
          );
          responseService.sendError(
            client,
            `You are already in room ${existingRoom.roomId}. Cannot create a new room.`,
            "create_room",
            parsedMessage.id,
          );
          break;
        }

        const newRoom = this.roomService.createRoom(client, client.playerId);
        console.log(`Player ${client.playerId} created room ${newRoom.roomId}. Initiating room update broadcast.`);

        this.broadcastRoomUpdates();
        break;

      // TODO: Add other cases for add_ships, attack, randomAttack etc.
      default:
        console.warn(`Unknown message type received: ${parsedMessage.type} from client ${client.clientId}`);
        responseService.sendError(
          client,
          `Unknown message type: ${parsedMessage.type}`,
          parsedMessage.type,
          parsedMessage.id,
        );
        break;
    }
  }

  public handleDisconnect(client: ClientConnection): void {
    if (client.playerId) {
      console.log(`Handling disconnection for player ${client.playerId}`);
      const { wasPlayerInRoom } = this.roomService.removePlayerFromRooms(client.playerId);

      if (wasPlayerInRoom) {
        console.log(`Player ${client.playerId} was removed from a room. Broadcasting room updates.`);
        this.broadcastRoomUpdates();
      }
      // TODO: Handle game state if player was in an active game
    } else {
      console.log(`Client ${client.clientId} disconnected without being a registered player.`);
    }
  }

  private broadcastRoomUpdates(): void {
    const availableRooms = this.roomService.getAvailableRooms();
    responseService.broadcast(this.clients, "update_room", availableRooms);
  }

  private validateRegData(client: ClientConnection, regData: RegRequestData): boolean {
    if (!regData || typeof regData.name !== "string" || typeof regData.password !== "string") {
      console.error(`Invalid 'reg' data from client ${client.clientId}:`, regData);
      return false;
    }
    return true;
  }
}

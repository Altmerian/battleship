import { ClientConnection } from "../websocket_server/clientConnection";
import { responseService } from "./responseService";
import { WebSocketCommandRequest } from "../types";
import { PlayerService } from "./playerService";
import { RoomService } from "./roomService";
import { GameService } from "./gameService";
import { ICommandHandler, CommandHandlerDependencies } from "./commandHandlers/commandHandler.interface";
import { RegistrationHandler } from "./commandHandlers/registrationHandler";
import { CreateRoomHandler } from "./commandHandlers/createRoomHandler";
import { AddUserToRoomHandler } from "./commandHandlers/addUserToRoomHandler";
import { AddShipsHandler } from "./commandHandlers/addShipsHandler";
import { AttackHandler } from "./commandHandlers/attackHandler";
import { RandomAttackHandler } from "./commandHandlers/randomAttackHandler";

export class MessageHandler {
  private playerService: PlayerService;
  private roomService: RoomService;
  private gameService: GameService;
  private clients: Map<string, ClientConnection>;
  private commandHandlerDependencies: CommandHandlerDependencies;
  private commandHandlers: Map<string, ICommandHandler<unknown>> = new Map();

  constructor(clients: Map<string, ClientConnection>) {
    this.playerService = new PlayerService();
    this.gameService = new GameService();
    this.roomService = new RoomService(this.playerService, this.gameService);
    this.clients = clients;

    this.commandHandlerDependencies = {
      playerService: this.playerService,
      roomService: this.roomService,
      gameService: this.gameService,
      responseService: responseService,
      allClients: this.clients,
    };

    this.commandHandlers.set("reg", new RegistrationHandler());
    this.commandHandlers.set("create_room", new CreateRoomHandler());
    this.commandHandlers.set("add_user_to_room", new AddUserToRoomHandler());
    this.commandHandlers.set("add_ships", new AddShipsHandler());
    this.commandHandlers.set("attack", new AttackHandler());
    this.commandHandlers.set("randomAttack", new RandomAttackHandler());
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

    const handler = this.commandHandlers.get(parsedMessage.type);

    if (handler) {
      try {
        handler.execute(client, parsedMessage.data, parsedMessage.id, this.commandHandlerDependencies);
      } catch (executionError) {
        console.error(`Error executing command '${parsedMessage.type}' for client ${client.clientId}:`, executionError);
        responseService.sendError(
          client,
          `An error occurred while processing your request for command '${parsedMessage.type}'.`,
          parsedMessage.type,
          parsedMessage.id,
        );
      }
    } else {
      console.warn(`Unknown message type received: ${parsedMessage.type} from client ${client.clientId}`);
      responseService.sendError(
        client,
        `Unknown message type: ${parsedMessage.type}`,
        parsedMessage.type,
        parsedMessage.id,
      );
    }
  }

  public handleDisconnect(client: ClientConnection): void {
    if (client.playerId) {
      console.log(`Handling disconnection for player ${client.playerId}`);
      const { wasPlayerInRoom } = this.roomService.removePlayerFromRooms(client.playerId);

      if (wasPlayerInRoom) {
        console.log(`Player ${client.playerId} was removed from a room. Broadcasting room updates.`);
        const availableRooms = this.roomService.getAvailableRooms();
        responseService.broadcast(this.clients, "update_room", availableRooms);
        console.log("Broadcasted update_room due to disconnect, with rooms:", JSON.stringify(availableRooms));
      }
      // TODO: Handle game state if player was in an active game
    } else {
      console.log(`Client ${client.clientId} disconnected without being a registered player.`);
    }
  }
}

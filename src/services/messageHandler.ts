import { ClientConnection } from "../websocket_server/clientConnection";
import { responseService } from "./responseService";
import { WebSocketCommandRequest } from "../types/websocket.types";

export class MessageHandler {
  // TODO: Add services here
  constructor() {}

  /**
   * Handles incoming messages from clients
   * @param client - The client that sent the message
   * @param rawMessage - The raw message string
   */
  public handleMessage(client: ClientConnection, rawMessage: string): void {
    let parsedMessage: WebSocketCommandRequest;

    try {
      const rawObject = JSON.parse(rawMessage);
      if (typeof rawObject.type !== "string" || typeof rawObject.id !== "number") {
        throw new Error("Invalid message structure: type or id missing/invalid.");
      }
      parsedMessage = rawObject as WebSocketCommandRequest;
      console.log(
        `Received command from client ${client.clientId} (PlayerID: ${client.playerId ?? "N/A"}): Type: ${parsedMessage.type}, ID: ${parsedMessage.id}, Data: ${JSON.stringify(parsedMessage.data)}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid message format.";
      console.error(`Failed to parse message from client ${client.clientId}:`, rawMessage, "Error:", errorMessage);
      responseService.sendError(client, "Invalid message format or structure.", undefined, 0);
      return;
    }

    // Route message to appropriate handler based on type
    switch (parsedMessage.type) {
      case "reg":
        console.log(`Placeholder for 'reg' message handling. Data:`, parsedMessage.data);
        responseService.sendToClient(
          client,
          "reg",
          { name: "test", index: "123", error: false, errorText: "" },
          parsedMessage.id,
        );
        //
        break;
      // TODO: Add other cases for create_room, add_user_to_room, add_ships, attack, randomAttack etc.
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
}

export const messageHandler = new MessageHandler();

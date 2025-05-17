import { ClientConnection } from "../websocket_server/clientConnection";
import { WebSocketCommandResponse } from "../types/index";

export class ResponseService {
  /**
   * Sends a message to a single client
   * @param client - The client to send the message to
   * @param type - The type of the message
   * @param data - The data to send
   * @param id - The id of the message
   */

  public sendToClient<T>(client: ClientConnection, type: string, data: T, id: 0 = 0): void {
    const response: WebSocketCommandResponse<T> = { type, data, id };
    console.log(
      `Sending message to client ${client.clientId} (PlayerID: ${client.playerId ?? "N/A"}):`,
      JSON.stringify(response),
    );
    client.send(response);
  }

  /**
   * Sends the same message to all clients in a provided list/map
   * @param clients - The clients to send the message to
   * @param type - The type of the message
   * @param data - The data to send
   * @param id - The id of the message
   */
  public broadcast<T>(
    clients: Map<string, ClientConnection> | ClientConnection[],
    type: string,
    data: T,
    id: 0 = 0,
  ): void {
    const response: WebSocketCommandResponse<T> = { type, data, id };
    const stringifiedResponse = JSON.stringify(response);
    console.log(`Broadcasting message type ${type}:`, stringifiedResponse);

    const clientCollection = clients instanceof Map ? Array.from(clients.values()) : clients;

    clientCollection.forEach((client) => {
      // console.log(`Sending broadcast to client ${client.clientId} (PlayerID: ${client.playerId ?? 'N/A'}):`, stringifiedResponse);
      client.sendRaw(stringifiedResponse);
    });
  }

  /**
   * Sends a message to all clients in a specific game room (list of clients)
   * @param roomClients - The clients to send the message to
   * @param type - The type of the message
   * @param data - The data to send
   * @param id - The id of the message
   */
  public sendToRoom<T>(roomClients: ClientConnection[], type: string, data: T, id: 0 = 0): void {
    const response: WebSocketCommandResponse<T> = { type, data, id };
    const stringifiedResponse = JSON.stringify(response);
    console.log(`Sending message to room (type ${type}, ${roomClients.length} clients):`, stringifiedResponse);

    roomClients.forEach((client) => {
      // console.log(`Sending room message to client ${client.clientId} (PlayerID: ${client.playerId ?? 'N/A'}):`, stringifiedResponse);
      client.sendRaw(stringifiedResponse);
    });
  }

  /**
   * Helper to send a generic error response to a client
   * @param client - The client to send the message to
   * @param errorText - The error text to send
   * @param originalType - The type of the request that caused the error
   * @param requestId - The id of the message
   */
  public sendError(
    client: ClientConnection,
    errorText: string,
    originalType?: string,
    requestId: 0 = 0,
  ): void {
    const errorData = {
      error: true,
      errorText,
    };
    const type = originalType === "reg" ? "reg" : "error";
    const responseData = originalType === "reg" ? { name: "", index: "", ...errorData } : errorData;

    this.sendToClient(client, type, responseData, requestId);
  }
}

export const responseService = new ResponseService();

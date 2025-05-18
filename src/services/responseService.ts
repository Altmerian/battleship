import { ClientConnection } from "../websocket_server/clientConnection";
import { WebSocketCommandResponse, ErrorResponseData } from "../types/index";

export class ResponseService {
  /**
   * Sends a message to a single client. The data object is stringified.
   * @param client - The client to send the message to
   * @param type - The type of the message
   * @param dataObj - The data object to send (will be stringified)
   * @param id - The id of the message
   */
  public sendToClient<TDataObj>(client: ClientConnection, type: string, dataObj: TDataObj, id: number = 0): void {
    const stringifiedData = JSON.stringify(dataObj);
    const response: WebSocketCommandResponse = { type, data: stringifiedData, id };
    console.log(
      `Sending message to client ${client.clientId} (PlayerID: ${client.playerId ?? "N/A"}): Type: ${response.type}, ID: ${response.id}, Data: ${response.data}`,
    );
    client.send(response);
  }

  /**
   * Sends the same message to all clients in a provided list/map. The data object is stringified.
   * @param clients - The clients to send the message to
   * @param type - The type of the message
   * @param dataObj - The data object to send (will be stringified)
   * @param id - The id of the message
   */
  public broadcast<TDataObj>(
    clients: Map<string, ClientConnection> | ClientConnection[],
    type: string,
    dataObj: TDataObj,
    id: number = 0,
  ): void {
    const stringifiedData = JSON.stringify(dataObj);
    const response: WebSocketCommandResponse = { type, data: stringifiedData, id };

    console.log(`Broadcasting message type ${type}: ID: ${id}, Data: ${stringifiedData}`);

    const clientCollection = clients instanceof Map ? Array.from(clients.values()) : clients;

    clientCollection.forEach((client) => {
      client.send(response);
    });
  }

  /**
   * Sends a message to all clients in a specific game room. The data object is stringified.
   * @param roomClients - The clients to send the message to
   * @param type - The type of the message
   * @param dataObj - The data object to send (will be stringified)
   * @param id - The id of the message
   */
  public sendToRoom<TDataObj>(roomClients: ClientConnection[], type: string, dataObj: TDataObj, id: number = 0): void {
    const stringifiedData = JSON.stringify(dataObj);
    const response: WebSocketCommandResponse = { type, data: stringifiedData, id };
    console.log(
      `Sending message to room (type ${type}, ${roomClients.length} clients): ID: ${id}, Data: ${stringifiedData}`,
    );

    roomClients.forEach((client) => {
      client.send(response);
    });
  }

  /**
   * Helper to send a generic error response to a client. The error data object is stringified.
   * @param client - The client to send the message to
   * @param errorText - The error text to send
   * @param originalType - The type of the request that caused the error
   * @param requestId - The id of the message
   */
  public sendError(client: ClientConnection, errorText: string, originalType?: string, requestId: number = 0): void {
    let errorPayload: ErrorResponseData | (ErrorResponseData & { name: string; index: string });
    let responseType = "error";

    if (originalType === "reg") {
      responseType = "reg";
      errorPayload = { name: "", index: "", error: true, errorText };
    } else {
      errorPayload = { error: true, errorText };
    }

    this.sendToClient(client, responseType, errorPayload, requestId);
  }
}

export const responseService = new ResponseService();

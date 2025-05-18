/* eslint-disable prettier/prettier */
import { WebSocketServer, WebSocket, RawData } from "ws";
import { ClientConnection } from "./clientConnection";
import { MessageHandler } from "../services/messageHandler";

export const initWebSocketServer = (wsPort: number) => {
  const wss = new WebSocketServer({ port: wsPort });
  const clients = new Map<string, ClientConnection>();

  const messageHandler = new MessageHandler(clients);

  console.log(`WebSocket server started on port ${wsPort}`);

  wss.on("connection", (ws: WebSocket) => {
    const client = new ClientConnection(ws);
    clients.set(client.clientId, client);
    console.log(`New client connected: ${client.clientId}. Total clients: ${clients.size}`);

    ws.on("message", (rawMessage: RawData, isBinary: boolean) => {
      if (isBinary) {
        console.log(`Received binary message from client ${client.clientId}, ignoring.`);
        return;
      }
      messageHandler.handleMessage(client, rawMessage.toString());
    });

    ws.on("close", (code, reason) => {
      console.log(
        `Client ${client.clientId} (PlayerID: ${client.playerId ?? "N/A"}) connection closing. Code: ${code}, Reason: ${reason ? reason.toString() : "N/A"}`,
      );
      messageHandler.handleDisconnect(client);
      clients.delete(client.clientId);
      console.log(`Client ${client.clientId} fully disconnected. Total clients: ${clients.size}`);
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error on client ${client.clientId} (PlayerID: ${client.playerId ?? "N/A"}):`, error);
      messageHandler.handleDisconnect(client);
      if (clients.has(client.clientId)) {
        clients.delete(client.clientId);
        console.log(`Client ${client.clientId} removed due to error. Total clients: ${clients.size}`);
      }
    });
  });

  wss.on("close", () => {
    console.log("WebSocket server instance closed.");
  });

  return wss;
};

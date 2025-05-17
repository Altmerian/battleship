import WebSocket from "ws";
import { WebSocketCommandResponse } from "../types/websocket.types";
import crypto from "crypto";

export class ClientConnection {
  public readonly ws: WebSocket;
  public readonly clientId: string;
  public playerId?: string;

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.clientId = crypto.randomUUID();
  }

  send<T>(message: WebSocketCommandResponse<T>): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.logWarn();
    }
  }

  sendRaw(rawMessage: string): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(rawMessage);
    } else {
      this.logWarn();
    }
  }

  close(code?: number, reason?: string): void {
    this.ws.close(code, reason);
    console.log(`Client connection ${this.clientId} (PlayerID: ${this.playerId ?? "N/A"}) closed.`);
  }

  private logWarn() {
    console.warn(
      `Attempted to send message to client ${this.clientId} (PlayerID: ${this.playerId ?? "N/A"}) but WebSocket was not open. State: ${this.ws.readyState}`,
    );
  }
}

import { ClientConnection } from "../websocket_server/clientConnection";

export interface RoomUser {
  client: ClientConnection;
  index: string;
}

export interface AddUserToRoomRequestData {
  indexRoom: string;
}

export interface CreateGameResponseData {
  idGame: string;
  idPlayer: string;
}

export interface RoomData {
  roomId: string;
  roomUsers: RoomUser[];
}

export interface AvailableRoomInfo {
  roomId: string;
  roomUsers: Array<{ index: string }>;
}

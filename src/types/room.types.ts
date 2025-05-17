export interface RoomUser {
  name: string;
  index: string;
}

export interface RoomInfo {
  roomId: string;
  roomUsers: RoomUser[];
}

export interface AddUserToRoomRequestData {
  indexRoom: string;
}

export interface CreateGameResponseData {
  idGame: string;
  idPlayer: string;
}

// Actual data stored per room on the server
// This will evolve as RoomService is implemented.
export interface RoomData extends RoomInfo {
} 
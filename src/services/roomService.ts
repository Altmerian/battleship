import crypto from "crypto";
import { ClientConnection } from "../websocket_server/clientConnection";
import { RoomData, RoomUser, AvailableRoomInfo } from "../types/room.types";

export class RoomService {
  private rooms: Map<string, RoomData> = new Map();

  constructor() {}

  public createRoom(playerClient: ClientConnection, playerIndex: string): RoomData {
    const roomId = crypto.randomUUID();
    const user: RoomUser = {
      client: playerClient,
      index: playerIndex,
    };
    const newRoom: RoomData = {
      roomId,
      roomUsers: [user],
    };

    this.rooms.set(roomId, newRoom);
    console.log(`Room created: ${roomId} by player ${playerIndex}`);
    return newRoom;
  }

  public getAvailableRooms(): AvailableRoomInfo[] {
    const availableRooms: AvailableRoomInfo[] = [];
    this.rooms.forEach((room) => {
      if (room.roomUsers.length < 2) {
        availableRooms.push({
          roomId: room.roomId,
          roomUsers: room.roomUsers.map((user) => ({
            index: user.index,
          })),
        });
      }
    });
    return availableRooms;
  }

  public getPlayerRoom(playerIndex: string): RoomData | undefined {
    for (const room of this.rooms.values()) {
      if (room.roomUsers.some((user) => user.index === playerIndex)) {
        return room;
      }
    }
    return undefined;
  }

  public removePlayerFromRooms(playerIndex: string): {
    updatedRoomId?: string;
    isRoomRemoved?: boolean;
    wasPlayerInRoom?: boolean;
  } {
    let updatedRoomId: string | undefined;
    let isRoomRemoved = false;
    let wasPlayerInRoom = false;

    for (const [roomId, room] of this.rooms.entries()) {
      const playerInRoomIndex = room.roomUsers.findIndex((user) => user.index === playerIndex);
      if (playerInRoomIndex !== -1) {
        wasPlayerInRoom = true;
        room.roomUsers.splice(playerInRoomIndex, 1);
        console.log(`Player ${playerIndex} removed from room ${roomId}`);

        if (room.roomUsers.length === 0) {
          this.rooms.delete(roomId);
          isRoomRemoved = true;
          updatedRoomId = roomId; // The room that was removed
          console.log(`Room ${roomId} is empty and has been removed.`);
        } else {
          updatedRoomId = roomId; // The room that was updated
        }
        // A player can only be in one room at a time
        break;
      }
    }
    return { updatedRoomId, isRoomRemoved, wasPlayerInRoom };
  }
}

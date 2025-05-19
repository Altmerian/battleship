import crypto from "crypto";
import { ClientConnection } from "../websocket_server/clientConnection";
import { RoomData, RoomUser, AvailableRoomInfo } from "../types/room.types";
import { PlayerService } from "./playerService";
import { GameService, InGamePlayerData } from "./gameService";

export class RoomService {
  private rooms: Map<string, RoomData> = new Map();
  private playerService: PlayerService;
  private gameService: GameService;

  constructor(playerService: PlayerService, gameService: GameService) {
    this.playerService = playerService;
    this.gameService = gameService;
  }

  public createRoom(): RoomData {
    const roomId = crypto.randomUUID();
    const newRoom: RoomData = {
      roomId,
      roomUsers: [],
    };

    this.rooms.set(roomId, newRoom);
    console.log(`Empty room created: ${roomId}`);
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

  public addUserToRoom(
    playerClient: ClientConnection,
    playerIndex: string,
    roomId: string,
  ): { room?: RoomData; error?: boolean; errorText?: string; gameReady?: boolean } {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { error: true, errorText: "Room not found." };
    }

    if (room.roomUsers.length >= 2) {
      return { error: true, errorText: "Room is full." };
    }

    if (this.getPlayerRoom(playerIndex)) {
      return { error: true, errorText: "Player already in a room." };
    }

    const newUser: RoomUser = {
      client: playerClient,
      index: playerIndex,
    };
    room.roomUsers.push(newUser);
    console.log(`Player ${playerIndex} added to room ${roomId}`);

    let gameReady = false;
    if (room.roomUsers.length === 2) {
      room.roomUsers[0].idPlayer = "0";
      room.roomUsers[1].idPlayer = "1";
      room.gameId = crypto.randomUUID();
      gameReady = true;
      console.log(
        `Room ${roomId} is now full. Game ID ${room.gameId} assigned. Players: ${room.roomUsers[0].index} (idPlayer: 0), ${room.roomUsers[1].index} (idPlayer: 1)`,
      );

      const playersForGame: [InGamePlayerData, InGamePlayerData] = [
        {
          client: room.roomUsers[0].client,
          idPlayer: room.roomUsers[0].idPlayer as string,
          playerIndex: room.roomUsers[0].index,
          name: this.playerService.getPlayerByIndex(room.roomUsers[0].index)?.name || "Player 1",
        },
        {
          client: room.roomUsers[1].client,
          idPlayer: room.roomUsers[1].idPlayer as string,
          playerIndex: room.roomUsers[1].index,
          name: this.playerService.getPlayerByIndex(room.roomUsers[1].index)?.name || "Player 2",
        },
      ];

      const gameInstance = this.gameService.createGame(room.gameId, playersForGame);
      if (!gameInstance) {
        console.error(`Failed to create game instance for room ${room.roomId} with game ID ${room.gameId}`);
        return { room, error: true, errorText: "Failed to initialize game.", gameReady: false };
      }
      console.log(`Game instance ${gameInstance.gameId} created via GameService.`);
    }

    return { room, gameReady };
  }

  public handleGameFinished(gameId: string): { roomRemoved: boolean; roomId?: string } {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.gameId === gameId) {
        this.rooms.delete(roomId);
        console.log(`Game ${gameId} finished. Room ${roomId} has been removed.`);
        return { roomRemoved: true, roomId };
      }
    }
    console.warn(`handleGameFinished: Could not find room associated with finished game ID ${gameId}`);
    return { roomRemoved: false };
  }
}

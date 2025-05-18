import { ClientConnection } from "../../websocket_server/clientConnection";
import { PlayerService } from "../playerService";
import { RoomService } from "../roomService";
import { ResponseService } from "../responseService";
import { GameService } from "../gameService";

export interface CommandHandlerDependencies {
  playerService: PlayerService;
  roomService: RoomService;
  gameService: GameService;
  responseService: ResponseService;
  allClients: Map<string, ClientConnection>;
}

export interface ICommandHandler<TRequestData = null> {
  execute(
    client: ClientConnection,
    data: TRequestData,
    messageId: number,
    dependencies: CommandHandlerDependencies,
  ): void;
}

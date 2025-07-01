import { ClientConnection } from "../../websocket_server/clientConnection";
import { RegRequestData, RegResponseData, WinnerData } from "../../types";
import { ICommandHandler, CommandHandlerDependencies } from "./commandHandler.interface";

export class RegistrationHandler implements ICommandHandler<RegRequestData> {
  private validateRegData(client: ClientConnection, regData: RegRequestData): boolean {
    if (!regData || typeof regData.name !== "string" || typeof regData.password !== "string") {
      console.error(`Invalid 'reg' data from client ${client.clientId}:`, regData);
      return false;
    }
    return true;
  }

  private broadcastRoomUpdates(dependencies: CommandHandlerDependencies): void {
    const availableRooms = dependencies.roomService.getAvailableRooms();
    dependencies.responseService.broadcast(dependencies.allClients, "update_room", availableRooms);
  }

  public execute(
    client: ClientConnection,
    data: RegRequestData,
    messageId: number,
    dependencies: CommandHandlerDependencies,
  ): void {
    const { playerService, responseService, allClients } = dependencies;

    if (!this.validateRegData(client, data)) {
      responseService.sendToClient<RegResponseData>(
        client,
        "reg",
        { name: "", index: "", error: true, errorText: "Invalid registration data format." },
        messageId,
      );
      return;
    }

    const regResult = playerService.registerOrLogin(data.name, data.password);

    if (regResult.error || !regResult.player) {
      responseService.sendToClient<RegResponseData>(
        client,
        "reg",
        { name: data.name, index: "", error: true, errorText: regResult.errorText || "Registration failed." },
        messageId,
      );
      return;
    }

    client.playerId = regResult.player.index;

    responseService.sendToClient<RegResponseData>(
      client,
      "reg",
      { name: regResult.player.name, index: regResult.player.index, error: false },
      messageId,
    );
    console.log(`Client ${client.clientId} successfully logged in as PlayerID: ${client.playerId}`);

    const winnersList = playerService.getWinnerList();
    responseService.broadcast<WinnerData[]>(allClients, "update_winners", winnersList);

    this.broadcastRoomUpdates(dependencies);
  }
}

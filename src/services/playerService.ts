import { PlayerData, WinnerData } from "../types";

export class PlayerService {
  private players: Map<string, PlayerData> = new Map(); // Key is player name
  private nextPlayerId = 1;

  public registerOrLogin(name: string, password: string): { player?: PlayerData; error?: boolean; errorText?: string } {
    if (!name || !password) {
      return { error: true, errorText: "Username and password are required." };
    }

    const existingPlayerByName = this.players.get(name);

    if (existingPlayerByName) {
      if (existingPlayerByName.password === password) {
        return { player: existingPlayerByName };
      } else {
        return { error: true, errorText: "Incorrect password." };
      }
    } else {
      const newPlayerIndex = `player-${this.nextPlayerId++}`;
      const newPlayer: PlayerData = {
        name,
        password,
        index: newPlayerIndex,
        wins: 0,
      };
      this.players.set(name, newPlayer);
      console.log(`Player registered: ${name}, index: ${newPlayerIndex}, wins: ${newPlayer.wins}`);
      return { player: newPlayer };
    }
  }

  public getWinnerList(): WinnerData[] {
    const winnersList: WinnerData[] = Array.from(this.players.values()).map((player) => ({
      name: player.name,
      wins: player.wins,
    }));
    return winnersList.sort((a, b) => {
      if (b.wins === a.wins) {
        return a.name.localeCompare(b.name);
      }
      return b.wins - a.wins;
    });
  }

  public updateWins(playerIndex: string): void {
    const playerToUpdate = this.getPlayerByIndex(playerIndex);

    if (playerToUpdate) {
      playerToUpdate.wins += 1;
      console.log(`Wins updated for player ${playerToUpdate.name} (index: ${playerIndex}): ${playerToUpdate.wins}`);
    } else {
      console.error(`Attempted to update wins for non-existent player index: ${playerIndex}`);
    }
  }

  public getPlayerByIndex(playerIndex: string): PlayerData | undefined {
    for (const player of this.players.values()) {
      if (player.index === playerIndex) {
        return player;
      }
    }
    return undefined;
  }
}

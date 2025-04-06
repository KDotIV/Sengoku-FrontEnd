import { Injectable } from "@angular/core";
import { LeagueByOrgData, PlayerRegisterData } from "./league.service";

@Injectable({ providedIn: 'root' })
export class LeagueStateService {
    private selectedLeague: LeagueByOrgData | undefined;
    private selectedPlayer: PlayerRegisterData | undefined;
    private leagueCache: Map<number, LeagueByOrgData> = new Map();
    private playerCache: Map<number, PlayerRegisterData> = new Map();

    setSelectedLeague(league: LeagueByOrgData): void {
        this.selectedLeague = league;
    }
    getSelectedLeague(): LeagueByOrgData | undefined {
        return this.selectedLeague;
    }

    cacheLeague(league: LeagueByOrgData): void {
        this.leagueCache.set(league.leagueId, league);
    }
    getCachedLeague(leagueId: number): LeagueByOrgData | undefined {
        return this.leagueCache.get(leagueId);
    }
    setPlayer(player: PlayerRegisterData): void {
        this.selectedPlayer = player;
    }
    getPlayer(): PlayerRegisterData | undefined {
        return this.selectedPlayer;
    }
    cachePlayer(player: PlayerRegisterData): void {
        this.playerCache.set(player.PlayerId, player);
    }
    getCachedPlayer(playerId: number): PlayerRegisterData | undefined {
        return this.playerCache.get(playerId);
    }
}
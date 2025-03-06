import { Injectable } from "@angular/core";
import { LeagueByOrgData } from "./league.service";

@Injectable({ providedIn: 'root' })
export class LeagueStateService {
    private selectedLeague: LeagueByOrgData | undefined;
    private leagueCache: Map<number, LeagueByOrgData> = new Map();

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
}
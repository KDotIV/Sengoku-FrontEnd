import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment-api";
import { GameDictionary } from "../../environments/environment-api.prod";
import { HttpClient, HttpHeaders, HttpParams, HttpRequest } from "@angular/common/http";
import { map, Observable } from "rxjs";

export interface LeagueTournamentData {
    leagueId: number;
    tournamentLinkId: number;
    tournamentName: string;
    urlSlug: string;
    playerIds: number[];
    entrantsNum: number;
    lastUpdated: Date | null;
    viewerShipUrls: string[];
    gameId: number;
    gameName: string;
    startTime: Date | null;
    isPast?: boolean;
}
export interface LeaguePlayerRankingData {
    playerId: number;
    leagueId: number;
    leagueName: string;
    playerName: string;
    currentScore: number;
    scoreDifference: number;
    tournamentCount: number;
    gameId: number;
    gameName: string;
    lastUpdated: Date | null;
}
export interface LeagueByOrgData {
    leagueId: number;
    leagueName: string;
    orgId: number;
    startDate: Date | null;
    endDate: Date | null;
    lastUpdated: Date | null;
    isActive: boolean;
}
export interface PlayerRegisterData {
    PlayerId: number;
    PlayerName: string;
    PlayerEmail: string;
    GameIds: number[];
    LeagueId: number | undefined;
}
export interface PlayerStartggSyncRequest {
    PlayerName: string;
    userSlug: string;
}
@Injectable({
    providedIn: 'root'
})
export class LeagueService {
    private currentGameDictionary = new GameDictionary([
        { key: 33945, value: 'Guilty Gear Strive' },
        { key: 1386, value: 'Smash Ultimate' },
        { key: 43868, value: 'Street Fighter 6'},
        { key: 49783, value: 'Tekken 8'},
        { key: 48548, value: 'Granblue Versus Rising'},
        { key: 610, value: 'Third Strike'},
        { key: 36963, value: 'KoF XV'},
        { key: 5582, value: 'Soul Calibur 2'},
        { key: 48599, value: 'Mortal Kombat 1'},
        { key: 287, value: 'Dragon Ball FighterZ'},
        { key: 1, value: 'Smash Melee'}
    ]);

    constructor(private http: HttpClient) {}

    // Utility function to safely parse date strings
    private parseDate(date: string | Date | null): Date | null {
        if (!date) {
        return null; // Handle null or undefined input
        }

        // If input is already a Date object, use it directly
        if (date instanceof Date) {
        // Format to local timezone explicitly
        const localizedDateStr = date.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
        return new Date(localizedDateStr);
        }

        // Parse as UTC explicitly
        const utcDate = new Date(`${date}Z`); // Append 'Z' to ensure UTC parsing
        if (isNaN(utcDate.getTime())) {
        return null; // Handle invalid dates
        }

        // Format to local timezone explicitly
        const localizedDateStr = utcDate.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
        console.log(localizedDateStr)
        return new Date(localizedDateStr);
    }
    private parseGameId(gameId: number): string {
        return this.currentGameDictionary.tryGetValue(gameId);
    }
    //Add League to User
    addLeagueToUser(leagueId: number, userId: number): void {

    }
    getLeagueById(leagueIdNum: number) {
        throw new Error('Method not implemented.');
      }
    //Query Available Leagues
    queryAvailableLeagues(): Observable<LeagueByOrgData[]> {
    let params = new HttpParams()

    const headers = new HttpHeaders({
        'Accept': 'application/json'
    });

    return this.http.get<LeagueByOrgData[]>(`${environment.apiUrl}/leagues/GetAvailableLeagues`, {params, headers})
    .pipe(
        map(availableLeagues => availableLeagues.map(league => ({
            ...league,
            startDate: this.parseDate(league.startDate),
            endDate: this.parseDate(league.endDate),
            lastUpdated: this.parseDate(league.lastUpdated)
        })))
    );
    }
    //Query Tournaments for League
    queryTournamentsByLeague(leagueIds: number[]): Observable<LeagueTournamentData[]> {
    let params = new HttpParams()

    leagueIds.forEach(leagueId =>{
        params = params.append('leagueIds', leagueId)
    })
    const headers = new HttpHeaders({
        'Accept': 'application/json'
    });

    return this.http.get<LeagueTournamentData[]>(`${environment.apiUrl}/leagues/GetLeagueTournamentSchedule`, {params, headers})
    .pipe(
        map(leagueEvents => leagueEvents.map(leagueEvent => ({
            ...leagueEvent,
            startTime: this.parseDate(leagueEvent.startTime),
            lastUpdated: this.parseDate(leagueEvent.lastUpdated),
            gameName: this.parseGameId(leagueEvent.gameId),
            isPast: leagueEvent.startTime ? new Date(leagueEvent.startTime) < new Date() : false
        })))
    );
    }
    //Query Player Rankings for given League
    queryPlayerRankings(leagueIds: number[], topN: number): Observable<LeaguePlayerRankingData[]> {
    let params = new HttpParams()
    .set('topN', topN);
    leagueIds.forEach(leagueId => {
        params = params.append('leagueIds', leagueId)
    });

    const headers = new HttpHeaders({
        'Accept': 'application/json'
    });

    return this.http.get<LeaguePlayerRankingData[]>(`${environment.apiUrl}/leagues/GetLeaderboardResultsByLeagueId`, {params, headers})
    .pipe(
        map(playerRankings => playerRankings.map(playerRanking => ({
            ...playerRanking,
            lastUpdated: this.parseDate(playerRanking.lastUpdated),
            gameName: this.parseGameId(playerRanking.gameId)
        })))
    )
    }
    //Register Player for League
    registerPlayerForLeague(playerData: PlayerRegisterData | undefined): Observable<string> {
        if (!playerData) {
            throw new Error('Player data is missing');
        }
        const requestBody: PlayerRegisterData = {
            PlayerId: playerData.PlayerId,
            PlayerName: playerData.PlayerName,
            PlayerEmail: playerData.PlayerEmail,
            GameIds: playerData.GameIds,
            LeagueId: playerData.LeagueId
        }
        const headers = new HttpHeaders({
            'Accept': 'application/json'
        });
        return this.http.post<string>(`${environment.apiUrl}/leagues/RegisterUserToLeague`, requestBody, {headers});
    }
    //Sync Startgg Data to Register Player
    syncStartggDataToRegisterPlayer(PlayerName: string, userSlug: string): Observable<{ data: PlayerRegisterData; response: string }> {
        const requestBody: PlayerStartggSyncRequest = {
            PlayerName: PlayerName,
            userSlug: userSlug
        }
        const headers = new HttpHeaders({
        'Accept': 'application/json'});
        
        return this.http.post<{ data: PlayerRegisterData; response: string }>(`${environment.apiUrl}/user/SyncStartggDataToPlayer`, requestBody, {headers});
    }
}

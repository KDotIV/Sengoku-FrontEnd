import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment-api";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { map, Observable } from "rxjs";

export interface LeagueTournamentData {
    leagueId: number;
    tournamentLinkId: number;
    tournamentName: string;
    urlSlug: string;
    playerIds: number[];
    entrants: number;
    lastUpdated: Date | null;
    viewerShipUrls: string[];
    gameId: number;
    startTime: Date | null;
}

@Injectable({
    providedIn: 'root'
})
export class LeagueService {
    private apiUrl = `${environment.alexandriaUrl}/leagues/GetLeagueTournamentSchedule`;

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
  //Query Tournaments for League
  queryTournamentsByLeague(leagueIds: number[]): Observable<LeagueTournamentData[]> {
    let params = new HttpParams()

    leagueIds.forEach(leagueId =>{
        params = params.append('LeagueId', leagueId)
    })
    const headers = new HttpHeaders({
        'Accept': 'application/json'
    });

    return this.http.get<LeagueTournamentData[]>(this.apiUrl, {params, headers})
    .pipe(
        map(events => events.map(event => ({
            ...event,
            start: this.parseDate(event.startTime),
            lastUpdated: this.parseDate(event.lastUpdated)
        })))
    );
  }
}

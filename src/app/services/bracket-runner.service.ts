import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment-api';

export interface TournamentData {
  tournamentId: number;
  urlSlug: string;
  gameId: number;
  eventId: number;
  entrantsNum: number;
  lastUpdated: Date | null;
}
export interface OnboardTournamentData {
  tournamentIds: number[];
  eventId: number;
  eventUrlSlug: string;
  entrantsNum: number;
  leagueId: number;
  gameIds: number[];
  open: boolean;
}
export interface AddNewTournamentToBoardRequest {
  tournamentIds: number[];
  userId: number;
  orgId: number;
}
export interface UploadTournamentStandingsRequest {
  tournamentIds: number[];
  eventLinkSlug: string;
  leagueId: number;
  gameIds: number[];
  open: boolean;
}
@Injectable({
  providedIn: 'root'
})
export class BracketRunnerService {
  constructor(private http: HttpClient) { }

  addTournamentToRunnerBoard(tournamentIds: number[], userId: number, orgId: number): Observable<HttpResponse<any>> {
    const requestBody: AddNewTournamentToBoardRequest = {
      tournamentIds: tournamentIds,
      userId: userId,
      orgId: orgId,
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<AddNewTournamentToBoardRequest>(
      `${environment.apiUrl}/api/leagues/AddTournamentToRunnerBoard`, requestBody, { headers, observe: 'response', responseType: 'json'})
  }
  uploadTournamentStandingsToLeague(tournamentIds: number[], eventLinkSlug: string, leagueId: number,
    gameIds: number[], open: boolean): Observable<HttpResponse<any>> {
      const requestBody: UploadTournamentStandingsRequest = {
        tournamentIds: tournamentIds,
        eventLinkSlug: eventLinkSlug,
        leagueId: leagueId,
        gameIds: gameIds,
        open: open
      }
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      return this.http.post<UploadTournamentStandingsRequest>(
        `${environment.apiUrl}/api/leagues/OnboardTournamentStandingstoLeague`, requestBody, { headers, observe: 'response', responseType: 'json'})
    }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment-api';
import { Observable } from 'rxjs';

export interface TournamentBoardResult {
  tournamentId: number;
  tournamentName: string;
  urlSlug: string;
  entrantsNum: number;
  lastUpdated: Date;
  gameId: number;
}
export interface AddTournamentRequest {
  tournamentIds: number[];
  userId: number;
}
@Injectable({
  providedIn: 'root'
})
export class TournamentBoardService {

  private apiUrl = `${environment.apiUrl}/`;

  constructor(private http: HttpClient) { }

  getTournamentBoard(): Observable<TournamentBoardResult[]> {
    return this.http.get<TournamentBoardResult[]>(this.apiUrl + 'leagues/GetCurrentRunnerBoard');
  }
  addTournament(tournamentIds: number[], userId: number): Observable<AddTournamentRequest> {
    const requestBody: AddTournamentRequest = {
      tournamentIds: tournamentIds,
      userId: userId
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<AddTournamentRequest>(
      this.apiUrl + 'leagues/AddBracketToRunnerBoard',
      requestBody,
      { headers }
    );
  }
}

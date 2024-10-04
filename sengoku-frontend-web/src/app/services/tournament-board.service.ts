import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TournamentBoardResult {
  tournamentId: number;
  tournamentName: string;
  urlSlug: string;
  entrantsNum: number;
  lastUpdated: Date;
  gameId: number;
}

@Injectable({
  providedIn: 'root'
})
export class TournamentBoardService {

  private apiUrl = 'https://sengoku-alexandria-qa.azurewebsites.net/api/leagues/GetCurrentRunnerBoard';

  constructor(private http: HttpClient) { }

  getTournamentBoard(): Observable<TournamentBoardResult[]> {
    return this.http.get<TournamentBoardResult[]>(this.apiUrl);
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, exhaustMap, map, take, takeWhile, timer } from 'rxjs';
import { environment } from '../../environments/environment-api';
import { normalizeBracketUrl } from '../shared/startgg-url';
import { BracketVictoryPathData, PlayerOnboardResult, isPending } from './bracket-runner.models';

const STORAGE_KEY = 'sengoku.bracket-runner.v1';
interface RunnerSelection { playerId: number; operationId: string | null; bracketUrl: string; }
const validId = (value: number): boolean => Number.isSafeInteger(value) && value > 0 && value <= 2147483647;
const validOperation = (value: string): boolean => /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(value);

@Injectable({ providedIn: 'root' })
export class PlayerBracketService {
  private readonly url = `${environment.apiUrl}/players`;
  // This is a public player selection, never authentication or proof of account ownership.
  selection: RunnerSelection | null = this.restoreSelection();

  constructor(private readonly http: HttpClient) {}

  select(playerId: number): void {
    if (!validId(playerId)) throw new Error('Enter a valid Sengoku player ID.');
    if (this.selection?.playerId === playerId) return;
    this.selection = { playerId, operationId: null, bracketUrl: '' };
    this.persistSelection();
  }

  rememberOperation(operationId: string | null, bracketUrl: string): void {
    if (operationId !== null && !validOperation(operationId)) throw new Error('The import did not return a valid progress reference.');
    if (!this.selection) throw new Error('Choose a player first.');
    this.selection = { ...this.selection, operationId, bracketUrl };
    this.persistSelection();
  }

  getPaths(playerId: number): Observable<BracketVictoryPathData[]> {
    if (!validId(playerId)) throw new Error('Enter a valid Sengoku player ID.');
    // Use the plural endpoint; the singular method cannot represent multiple paths.
    return this.http.get<BracketVictoryPathData[]>(`${this.url}/GetBracketPathByPlayerIds`, {
      params: new HttpParams().append('playerIds', playerId)
    }).pipe(map(paths => {
      if (!Array.isArray(paths)) throw new Error('Tournament paths could not be read. Please try again.');
      for (const path of paths) {
        if (!path?.playerTournamentCard || path.playerTournamentCard.playerID !== playerId ||
            !Array.isArray(path.entrantSetCards) || !Array.isArray(path.playerTournamentCard.playerResults)) {
          throw new Error('The returned tournament paths do not match this player.');
        }
        // The current backend groups only by player, potentially merging tournaments.
        // Do not label those opponents as belonging to the first returned tournament.
        if (path.playerTournamentCard.playerResults.some(result =>
          result.standingDetails?.tournamentId > 0 && result.standingDetails.tournamentId !== path.tournamentLinkID)) {
          throw new Error('Sengoku returned combined tournament data. Separate tournament paths are temporarily unavailable.');
        }
      }
      return paths;
    }));
  }

  onboard(bracketUrl: string, playerId: number): Observable<PlayerOnboardResult> {
    if (!validId(playerId)) throw new Error('Choose an existing Sengoku player first.');
    return this.http.post<PlayerOnboardResult>(`${this.url}/OnboardBracketPathByBracketSlug`, {
      bracketSlug: normalizeBracketUrl(bracketUrl), playerId
    }).pipe(map(result => this.validateResult(result)));
  }

  watchOperation(operationId: string): Observable<PlayerOnboardResult> {
    if (!validOperation(operationId)) throw new Error('Invalid import progress reference.');
    return timer(0, 5000).pipe(
      exhaustMap(() => this.http.get<PlayerOnboardResult>(`${this.url}/BracketProcessing/${operationId}`)),
      map(result => this.validateResult(result)),
      takeWhile(isPending, true),
      take(121) // Pause after about ten minutes; the user may resume checking.
    );
  }

  private validateResult(result: PlayerOnboardResult): PlayerOnboardResult {
    if (!result || typeof result.response !== 'string') throw new Error('The import returned an unexpected response.');
    return result;
  }

  private restoreSelection(): RunnerSelection | null {
    try {
      const value: RunnerSelection = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
      if (!value || !validId(value.playerId) ||
          (value.operationId !== null && (typeof value.operationId !== 'string' || !validOperation(value.operationId))) ||
          typeof value.bracketUrl !== 'string') return null;
      return value;
    } catch { return null; }
  }

  private persistSelection(): void {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.selection)); }
    catch { /* Browsing still works when session storage is unavailable. */ }
  }
}

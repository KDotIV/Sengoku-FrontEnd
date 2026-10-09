import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, effect, signal, untracked } from '@angular/core';
import { Observable, catchError, exhaustMap, map, of, take, takeWhile, throwError, timer } from 'rxjs';
import { environment } from '../../environments/environment-api';
import { normalizeBracketUrl, normalizeTournamentSlug } from '../shared/startgg-url';
import { BracketVictoryPathData, PlayerLegend, PlayerOnboardResult, isPending } from './bracket-runner.models';
import { AccountIdentity, UserService } from './user.service';

export interface RunnerOperation {
  userId: number; playerId: number; operationId: string; bracketUrl: string;
  status: 'Pending' | 'Failed' | 'Expired';
}
const STORAGE_KEY = 'sengoku.bracket-runner.v2';
const validOperation = (value: string): boolean => /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(value);

@Injectable({ providedIn: 'root' })
export class PlayerBracketService {
  private readonly url = `${environment.apiUrl}/players`;
  readonly operation = signal<RunnerOperation | null>(null);

  constructor(private readonly http: HttpClient, private readonly users: UserService) {
    effect(() => {
      const account = this.users.account();
      if (this.users.ready()) untracked(() => this.setOwner(account));
    });
  }

  setOwner(account: AccountIdentity | null): void {
    let saved: RunnerOperation | null = null;
    try {
      sessionStorage.removeItem('sengoku.bracket-runner.v1');
      saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
    } catch { /* Storage is optional. */ }
    const candidate = this.operation() ?? saved;
    this.operation.set(account && candidate && candidate.userId === account.userId &&
      candidate.playerId === account.playerId && validOperation(candidate.operationId) &&
      ['Pending', 'Failed', 'Expired'].includes(candidate.status) ? candidate : null);
    this.persist();
  }

  remember(result: PlayerOnboardResult, bracketUrl: string): void {
    const owner = this.users.account();
    if (!owner || !result.operationId || !validOperation(result.operationId)) return;
    if (result.status === 'Pending' || result.status === 'Failed' || result.status === 'Expired') {
      this.operation.set({ userId: owner.userId, playerId: owner.playerId, operationId: result.operationId, bracketUrl, status: result.status });
      this.persist();
    }
  }

  clearOperation(): void { this.operation.set(null); this.persist(); }

  getPaths(playerId: number): Observable<BracketVictoryPathData[]> {
    return this.readPaths('GetBracketPathByPlayerIds', new HttpParams().append('playerIds', playerId));
  }

  searchByName(playerName: string): Observable<BracketVictoryPathData[]> {
    return this.readPaths('GetBracketPathByPlayerName', new HttpParams().set('playerName', playerName.trim()));
  }

  searchByTournament(slug: string): Observable<BracketVictoryPathData[]> {
    return this.readPaths('GetBracketPathByTournamentSlug', new HttpParams().set('tournamentSlug', normalizeTournamentSlug(slug)));
  }

  getLegend(playerId: number): Observable<PlayerLegend[]> {
    return this.http.get<PlayerLegend[]>(`${this.url}/GetLegendByPlayerId`, { params: { playerId } });
  }

  onboard(bracketUrl: string): Observable<PlayerOnboardResult> {
    const account = this.users.account();
    if (!account) return throwError(() => new Error('Sign in before importing a bracket.'));
    // Account identity comes only from the authenticated Session endpoint.
    return this.users.protectedPost<PlayerOnboardResult>('/players/OnboardBracketPathByBracketSlug', {
      bracketSlug: normalizeBracketUrl(bracketUrl), playerId: account.playerId
    }).pipe(catchError(error => this.processingError(error)));
  }

  retry(operationId: string): Observable<PlayerOnboardResult> {
    if (!validOperation(operationId)) throw new Error('Invalid import progress reference.');
    return this.users.protectedPost<PlayerOnboardResult>(`/players/BracketProcessing/${operationId}/Retry`, {})
      .pipe(catchError(error => this.processingError(error)));
  }

  watchOperation(operationId: string): Observable<PlayerOnboardResult> {
    if (!validOperation(operationId)) throw new Error('Invalid import progress reference.');
    return timer(0, 5000).pipe(
      exhaustMap(() => this.users.authenticatedGet<PlayerOnboardResult>(`/players/BracketProcessing/${operationId}`)),
      takeWhile(isPending, true),
      take(121)
    );
  }

  private readPaths(route: string, params: HttpParams): Observable<BracketVictoryPathData[]> {
    return this.http.get<BracketVictoryPathData[]>(`${this.url}/${route}`, { params }).pipe(map(paths => {
      if (!Array.isArray(paths)) throw new Error('Tournament paths could not be read. Please try again.');
      return paths;
    }));
  }

  private processingError(error: unknown): Observable<PlayerOnboardResult> {
    // Failed/expired imports can be HTTP 400 and still include an owner-scoped retry reference.
    if (error instanceof HttpErrorResponse && error.status === 400 &&
        ['Failed', 'Expired'].includes(error.error?.status) && typeof error.error?.response === 'string') {
      return of(error.error as PlayerOnboardResult);
    }
    return throwError(() => error);
  }

  private persist(): void {
    try {
      if (this.operation()) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.operation()));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch { /* Progress still works in memory if storage is unavailable. */ }
  }
}

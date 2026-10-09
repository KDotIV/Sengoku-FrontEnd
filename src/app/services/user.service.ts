import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, catchError, defer, finalize, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment-api';
import { startggDebug } from '../shared/startgg-debug';
import { normalizeUserSlug } from '../shared/startgg-url';

export interface CreateUserRequest { userName: string; email: string; password: string; }
export interface RegistrationResult { userId: number; playerId: number; response: string; }
export interface AccountIdentity { userId: number; playerId: number; userName: string; }
export interface VerifiedStartggLink {
  userId: number; playerId: number; startggUserId: number; startggPlayerId: number; slug: string; verifiedAt: string;
}
export interface StartggLinkStatus { enabled: boolean; link: VerifiedStartggLink | null; }
export interface StartggProfilePreview {
  data: {
    playerId: number; localPlayerId: number | null; startggPlayerId: number; verified: boolean;
    playerName: string; playerEmail: string; userLink: number; gameIds: number[];
  } | null;
  response: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly url = environment.apiUrl;
  readonly account = signal<AccountIdentity | null>(null);
  readonly ready = signal(false);
  readonly sessionError = signal('');
  readonly startgg = signal<StartggLinkStatus | null>(null);
  private epoch = 0;
  private csrfRequest?: Observable<string>;
  private initialRequest?: Observable<AccountIdentity | null>;

  constructor(private readonly http: HttpClient) {}

  initialize(): Observable<AccountIdentity | null> {
    return this.initialRequest ??= this.restoreSession().pipe(shareReplay({ bufferSize: 1, refCount: false }));
  }

  restoreSession(): Observable<AccountIdentity | null> {
    this.sessionError.set('');
    const epoch = this.epoch;
    return this.http.get<AccountIdentity>(`${this.url}/user/Session`, { withCredentials: true }).pipe(
      tap(account => { if (epoch === this.epoch) this.setAccount(account); }),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.clearSession();
          return of(null);
        }
        this.sessionError.set('Your sign-in status could not be checked. Please try again.');
        return throwError(() => error);
      }),
      finalize(() => this.ready.set(true))
    );
  }

  private setAccount(account: AccountIdentity): void {
    const previous = this.account();
    if (previous?.userId !== account.userId || previous?.playerId !== account.playerId) {
      this.csrfRequest = undefined;
      this.startgg.set(null);
    }
    this.account.set(account);
  }

  clearSession(): void {
    this.epoch++;
    this.account.set(null);
    this.startgg.set(null);
    this.csrfRequest = undefined;
    this.ready.set(true);
  }

  private csrf(): Observable<string> {
    return this.csrfRequest ??= this.http.get<{ requestToken: string }>(`${this.url}/user/Csrf`, { withCredentials: true }).pipe(
      map(result => {
        if (!result.requestToken) throw new Error('Unable to prepare this request. Please try again.');
        return result.requestToken;
      }),
      catchError(error => { this.csrfRequest = undefined; return throwError(() => error); }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  // Only explicit user actions call this. Never replay a mutation after a network/CSRF failure.
  protectedPost<T>(path: string, body: unknown): Observable<T> {
    return defer(() => this.csrf()).pipe(
      tap(() => { if (path === '/user/Startgg/Authorize') startggDebug('CSRF ready; sending authorization POST'); }),
      switchMap(token => this.http.post<T>(`${this.url}${path}`, body, {
        withCredentials: true, headers: { 'X-CSRF-TOKEN': token }
      })),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) this.clearSession();
        if (error instanceof HttpErrorResponse && error.status === 400) this.csrfRequest = undefined;
        return throwError(() => error);
      })
    );
  }

  authenticatedGet<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.url}${path}`, { withCredentials: true }).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) this.clearSession();
        return throwError(() => error);
      })
    );
  }

  createNewUser(request: CreateUserRequest): Observable<RegistrationResult> {
    return this.protectedPost('/user/CreateUser', {
      ...request, userName: request.userName.trim(), email: request.email.trim()
    });
  }

  login(email: string, password: string): Observable<AccountIdentity> {
    return this.protectedPost<AccountIdentity>('/user/Login', { email: email.trim(), password }).pipe(
      tap(() => { this.csrfRequest = undefined; }),
      switchMap(() => this.restoreSession()),
      switchMap(account => {
        if (!account) return throwError(() => new Error('Your account was not signed in. Please try signing in again.'));
        return this.csrf().pipe(map(() => account));
      })
    );
  }

  logout(): Observable<void> {
    return this.protectedPost<void>('/user/Logout', {}).pipe(
      tap(() => this.clearSession()),
      switchMap(() => this.csrf().pipe(map(() => undefined)))
    );
  }

  loadStartggLink(): Observable<StartggLinkStatus> {
    const userId = this.account()?.userId;
    return this.authenticatedGet<StartggLinkStatus>('/user/Startgg/Link').pipe(tap(status => {
      if (userId && this.account()?.userId === userId) this.startgg.set(status);
    }));
  }

  authorizeStartgg(): Observable<{ authorizationUrl: string }> {
    return this.protectedPost('/user/Startgg/Authorize', {});
  }

  refreshAfterLink(): Observable<StartggLinkStatus> {
    // Verified identity can adopt an imported player, changing the local player ID.
    return this.restoreSession().pipe(switchMap(account => {
      if (!account) return throwError(() => new Error('Please sign in again to finish linking.'));
      return this.csrf().pipe(switchMap(() => this.loadStartggLink()));
    }));
  }

  previewStartggProfile(slug: string): Observable<StartggProfilePreview> {
    return this.http.post<StartggProfilePreview>(`${this.url}/user/SyncStartggDataToPlayer`, {
      playerName: '', userSlug: normalizeUserSlug(slug)
    }, { withCredentials: true }).pipe(map(result => {
      if (!result?.data?.playerName || result.data.startggPlayerId <= 0) {
        throw new Error('No Start.gg player profile was found. Check the profile link and try again.');
      }
      return result;
    }));
  }
}

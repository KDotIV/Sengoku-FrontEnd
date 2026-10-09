import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment-api';
import { normalizeUserSlug } from '../shared/startgg-url';

export interface CreateUserRequest {
  userName: string;
  email: string;
  password: string;
}

export interface StartggProfilePreview {
  data: {
    // The legacy endpoint may return a LOCAL or EXTERNAL ID. Never treat this as a local identity.
    playerId: number;
    playerName: string;
    playerEmail: string;
    userLink: number;
    gameIds: number[];
  } | null;
  response: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly http: HttpClient) {}

  createNewUser(request: CreateUserRequest): Observable<string> {
    // The controller returns a message, not an account or login session.
    return this.http.post(`${environment.apiUrl}/user/CreateUser`, {
      ...request, userName: request.userName.trim(), email: request.email.trim(), topic: 401
    }, { responseType: 'text' });
  }

  previewStartggProfile(slug: string): Observable<StartggProfilePreview> {
    return this.http.post<StartggProfilePreview>(`${environment.apiUrl}/user/SyncStartggDataToPlayer`, {
      playerName: '', userSlug: normalizeUserSlug(slug)
    }).pipe(map(result => {
      if (!result?.data?.playerName || result.data.userLink <= 0 || result.data.playerId <= 0) {
        throw new Error('No Start.gg player profile was found. Check the profile link and try again.');
      }
      return result;
    }));
  }
}

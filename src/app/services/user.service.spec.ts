import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../../environments/environment-api';

describe('Account HTTP contracts', () => {
  let users: UserService;
  let http: HttpTestingController;
  const url = environment.apiUrl;
  const account = { userId: 1, playerId: 42, userName: 'Oni_Shogi' };
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    users = TestBed.inject(UserService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function csrf(token: string): void {
    const request = http.expectOne(url + '/user/Csrf');
    expect(request.request.withCredentials).toBeTrue();
    request.flush({ requestToken: token });
  }

  it('registers with JSON and credentialed CSRF without starting a session', () => {
    let id = 0;
    users.createNewUser({ userName: ' Oni ', email: ' oni@example.com ', password: 'long password!123' }).subscribe(result => id = result.playerId);
    csrf('anonymous');
    const request = http.expectOne(url + '/user/CreateUser');
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.get('X-CSRF-TOKEN')).toBe('anonymous');
    expect(request.request.body).toEqual({ userName: 'Oni', email: 'oni@example.com', password: 'long password!123' });
    request.flush({ userId: 1, playerId: 42, response: 'Created' });
    expect(id).toBe(42);
    expect(users.account()).toBeNull();
  });

  it('restores an authenticated identity and rotates CSRF after login and logout', () => {
    users.login('oni@example.com', 'long password!123').subscribe();
    csrf('anonymous');
    const login = http.expectOne(url + '/user/Login');
    expect(login.request.headers.get('X-CSRF-TOKEN')).toBe('anonymous');
    login.flush(account);
    const session = http.expectOne(url + '/user/Session');
    expect(session.request.withCredentials).toBeTrue();
    session.flush(account);
    csrf('signed-in');
    expect(users.account()).toEqual(account);
    users.logout().subscribe();
    const logout = http.expectOne(url + '/user/Logout');
    expect(logout.request.headers.get('X-CSRF-TOKEN')).toBe('signed-in');
    expect(logout.request.withCredentials).toBeTrue();
    logout.flush(null, { status: 204, statusText: 'No Content' });
    csrf('new-anonymous');
    expect(users.account()).toBeNull();
  });

  it('treats Session 401 as signed out without inventing an account', () => {
    users.initialize().subscribe();
    http.expectOne(url + '/user/Session').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(users.ready()).toBeTrue();
    expect(users.account()).toBeNull();
    expect(users.sessionError()).toBe('');
  });

  it('clears the session when a protected read expires', () => {
    users.account.set(account);
    users.authenticatedGet('/players/BracketProcessing/test').subscribe({ error: () => {} });
    http.expectOne(url + '/players/BracketProcessing/test').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(users.account()).toBeNull();
  });

  it('never retries an ambiguous registration failure', () => {
    users.createNewUser({ userName: 'Oni', email: 'oni@example.com', password: 'long password!123' }).subscribe({ error: () => {} });
    csrf('anonymous');
    http.expectOne(url + '/user/CreateUser').error(new ProgressEvent('error'));
    http.expectNone(url + '/user/CreateUser');
  });

  it('supports public previews with no local player and never marks them verified', () => {
    let name = '';
    users.previewStartggProfile('start.gg/user/b1a179d8').subscribe(result => name = result.data!.playerName);
    http.expectOne(url + '/user/SyncStartggDataToPlayer').flush({
      data: { playerId: 0, localPlayerId: null, startggPlayerId: 900, playerName: 'Oni_Shogi', verified: false },
      response: 'Success'
    });
    expect(name).toBe('Oni_Shogi');
    expect(users.startgg()).toBeNull();
  });

  it('refreshes an adopted player ID after linking', () => {
    users.account.set(account);
    users.refreshAfterLink().subscribe();
    http.expectOne(url + '/user/Session').flush({ ...account, playerId: 99 });
    csrf('adopted');
    http.expectOne(url + '/user/Startgg/Link').flush({
      enabled: true, link: { userId: 1, playerId: 99, startggUserId: 8, startggPlayerId: 9, slug: 'user/oni', verifiedAt: '2026-10-09' }
    });
    expect(users.account()?.playerId).toBe(99);
    expect(users.startgg()?.link?.playerId).toBe(99);
  });

  it('does not restore stale identity or linking responses after logout', () => {
    users.account.set(account);
    users.restoreSession().subscribe();
    users.loadStartggLink().subscribe();
    users.clearSession();
    http.expectOne(url + '/user/Session').flush(account);
    http.expectOne(url + '/user/Startgg/Link').flush({ enabled: true, link: { userId: 1 } });
    expect(users.account()).toBeNull();
    expect(users.startgg()).toBeNull();
  });
});

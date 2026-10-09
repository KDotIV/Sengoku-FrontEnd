import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PlayerBracketService } from './player-bracket.service';
import { UserService } from './user.service';
import { environment } from '../../environments/environment-api';

const operationId = '11111111-2222-3333-4444-555555555555';
const bracket = 'https://start.gg/tournament/test/event/singles/brackets/123/456';
const owner = { userId: 1, playerId: 42, userName: 'Oni_Shogi' };

describe('PlayerBracketService', () => {
  let runner: PlayerBracketService;
  let users: UserService;
  let http: HttpTestingController;
  beforeEach(() => {
    sessionStorage.removeItem('sengoku.bracket-runner.v2');
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    users = TestBed.inject(UserService); runner = TestBed.inject(PlayerBracketService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); sessionStorage.removeItem('sengoku.bracket-runner.v2'); });

  it('searches exact player names with encoded query params', () => {
    runner.searchByName(' Oni & Shogi ').subscribe();
    const request = http.expectOne(req => req.url.endsWith('/GetBracketPathByPlayerName'));
    expect(request.request.params.get('playerName')).toBe('Oni & Shogi');
    request.flush([]);
  });

  it('converts the user-facing event/slug shorthand to the backend suffix contract', () => {
    runner.searchByTournament('event/street-fighter-6-ps5').subscribe();
    const request = http.expectOne(req => req.url.endsWith('/GetBracketPathByTournamentSlug'));
    expect(request.request.params.get('tournamentSlug')).toBe('street-fighter-6-ps5');
    request.flush([]);
  });

  it('sends only the signed-in player identity with credentials and CSRF', () => {
    users.account.set(owner);
    runner.onboard(bracket).subscribe();
    http.expectOne(environment.apiUrl + '/user/Csrf').flush({ requestToken: 'csrf' });
    const request = http.expectOne(environment.apiUrl + '/players/OnboardBracketPathByBracketSlug');
    expect(request.request.body).toEqual({ bracketSlug: bracket, playerId: 42 });
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.get('X-CSRF-TOKEN')).toBe('csrf');
    request.flush({ status: 'Pending', response: 'Waiting', operationId, successful: [], failures: [] }, { status: 202, statusText: 'Accepted' });
  });

  it('does not allow an anonymous import', () => {
    let failed = false;
    runner.onboard(bracket).subscribe({ error: () => failed = true });
    expect(failed).toBeTrue();
    http.expectNone(environment.apiUrl + '/players/OnboardBracketPathByBracketSlug');
  });

  it('preserves separate pools and paths without deduplication', () => {
    let count = 0;
    runner.getPaths(42).subscribe(paths => count = paths.length);
    http.expectOne(req => req.url.endsWith('/GetBracketPathByPlayerIds')).flush([
      { bracketPathId: 1, tournamentLinkID: 10 }, { bracketPathId: 2, tournamentLinkID: 10 }
    ]);
    expect(count).toBe(2);
  });

  it('polls with credentials and stops at completion', fakeAsync(() => {
    const statuses: string[] = [];
    runner.watchOperation(operationId).subscribe(result => statuses.push(result.status!));
    tick(0);
    let request = http.expectOne(req => req.url.endsWith(operationId));
    expect(request.request.withCredentials).toBeTrue();
    request.flush({ status: 'Pending', response: 'Waiting' });
    tick(5000);
    request = http.expectOne(req => req.url.endsWith(operationId));
    request.flush({ status: 'Completed', response: 'Saved', successful: [], failures: [] });
    tick(10000);
    expect(statuses).toEqual(['Pending', 'Completed']);
  }));

  it('stops on failure/expiry and uses the explicit Retry route', fakeAsync(() => {
    runner.watchOperation(operationId).subscribe();
    tick(0);
    http.expectOne(req => req.url.endsWith(operationId)).flush({ status: 'Expired', response: 'Expired' });
    tick(5000);
    runner.retry(operationId).subscribe();
    http.expectOne(environment.apiUrl + '/user/Csrf').flush({ requestToken: 'csrf' });
    const retry = http.expectOne(environment.apiUrl + '/players/BracketProcessing/' + operationId + '/Retry');
    expect(retry.request.method).toBe('POST');
    retry.flush({ status: 'Pending', operationId, response: 'Waiting' });
  }));

  it('drops progress when the account or adopted player changes', () => {
    users.account.set(owner);
    runner.remember({ operationId, status: 'Pending', response: '', successful: [], failures: [] }, bracket);
    runner.setOwner(owner);
    expect(runner.operation()?.operationId).toBe(operationId);
    runner.setOwner({ ...owner, playerId: 99 });
    expect(runner.operation()).toBeNull();
    expect(sessionStorage.getItem('sengoku.bracket-runner.v2')).toBeNull();
  });
});

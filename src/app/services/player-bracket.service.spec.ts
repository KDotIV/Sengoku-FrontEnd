import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PlayerBracketService } from './player-bracket.service';
import { environment } from '../../environments/environment-api';
import { PlayerOnboardResult } from './bracket-runner.models';

const operationId = '11111111-2222-3333-4444-555555555555';
const bracket = 'https://start.gg/tournament/test/event/singles/brackets/123/456';

describe('PlayerBracketService', () => {
  let service: PlayerBracketService;
  let http: HttpTestingController;
  beforeEach(() => {
    sessionStorage.removeItem('sengoku.bracket-runner.v1');
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PlayerBracketService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); sessionStorage.removeItem('sengoku.bracket-runner.v1'); });

  it('uses the actual onboarding route and local player ID', () => {
    service.onboard(bracket, 42).subscribe();
    const request = http.expectOne(environment.apiUrl + '/players/OnboardBracketPathByBracketSlug');
    expect(request.request.body).toEqual({ bracketSlug: bracket, playerId: 42 });
    request.flush({ status: 'Pending', response: 'Waiting for legends', operationId, successful: [], failures: [] }, { status: 202, statusText: 'Accepted' });
  });

  it('queries all paths for a player with the plural endpoint', () => {
    let paths: unknown;
    service.getPaths(42).subscribe(result => paths = result);
    const request = http.expectOne(request => request.url.endsWith('/GetBracketPathByPlayerIds'));
    expect(request.request.params.getAll('playerIds')).toEqual(['42']);
    request.flush([]);
    expect(paths).toEqual([]);
  });

  it('does not show merged tournaments as one reliable path', () => {
    let message = '';
    service.getPaths(42).subscribe({ error: error => message = error.message });
    http.expectOne(request => request.url.endsWith('/GetBracketPathByPlayerIds')).flush([{
      tournamentLinkID: 10, entrantSetCards: [],
      playerTournamentCard: { playerID: 42, playerResults: [{ standingDetails: { tournamentId: 20 } }] }
    }]);
    expect(message).toContain('combined tournament data');
  });

  it('polls pending operations and stops after completion', fakeAsync(() => {
    const statuses: string[] = [];
    service.watchOperation(operationId).subscribe(result => statuses.push(result.status!));
    tick(0);
    http.expectOne(environment.apiUrl + '/players/BracketProcessing/' + operationId)
      .flush({ status: 'Pending', response: 'Waiting for legends' });
    tick(5000);
    http.expectOne(environment.apiUrl + '/players/BracketProcessing/' + operationId)
      .flush({ status: 'Completed', response: 'Saved', successful: ['7'], failures: [] });
    tick(15000);
    http.expectNone(environment.apiUrl + '/players/BracketProcessing/' + operationId);
    expect(statuses).toEqual(['Pending', 'Completed']);
  }));

  it('stops on failure or expiry without resubmitting onboarding', fakeAsync(() => {
    for (const status of ['Failed', 'Expired'] as const) {
      let result: PlayerOnboardResult | undefined;
      service.watchOperation(operationId).subscribe(value => result = value);
      tick(0);
      http.expectOne(environment.apiUrl + '/players/BracketProcessing/' + operationId).flush({ status, response: 'Unavailable' });
      tick(5000);
      expect(result?.status).toBe(status);
    }
  }));

  it('pauses polling after ten minutes, allowing a later check', fakeAsync(() => {
    let complete = false;
    service.watchOperation(operationId).subscribe({ complete: () => complete = true });
    for (let index = 0; index < 121; index++) {
      tick(index === 0 ? 0 : 5000);
      http.expectOne(environment.apiUrl + '/players/BracketProcessing/' + operationId).flush({ status: 'Pending', response: 'Waiting for legends' });
    }
    expect(complete).toBeTrue();
  }));

  it('retains only the public player selection and progress reference', () => {
    service.select(42);
    service.rememberOperation(operationId, bracket);
    expect(JSON.parse(sessionStorage.getItem('sengoku.bracket-runner.v1')!))
      .toEqual({ playerId: 42, operationId, bracketUrl: bracket });
    expect(() => service.select(0)).toThrow();
    expect(() => service.onboard(bracket, 1.5)).toThrow();
  });
});

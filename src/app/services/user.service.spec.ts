import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../../environments/environment-api';

describe('UserService contracts', () => {
  let service: UserService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('posts the current CreateUser command and accepts a plain-text success', () => {
    let message = '';
    service.createNewUser({ userName: ' Oni_Shogi ', email: ' oni@example.com ', password: 'secret_123' })
      .subscribe(result => message = result);
    const request = http.expectOne(environment.apiUrl + '/user/CreateUser');
    expect(request.request.body).toEqual({ userName: 'Oni_Shogi', email: 'oni@example.com', password: 'secret_123', topic: 401 });
    expect(request.request.responseType).toBe('text');
    request.flush('User Oni_Shogi created successfully.');
    expect(message).toContain('successfully');
  });

  it('looks up a normalized profile without treating its ambiguous ID as a local account', () => {
    let name = '';
    service.previewStartggProfile('start.gg/user/b1a179d8').subscribe(result => name = result.data!.playerName);
    const request = http.expectOne(environment.apiUrl + '/user/SyncStartggDataToPlayer');
    expect(request.request.body).toEqual({ playerName: '', userSlug: 'user/b1a179d8' });
    request.flush({ data: { playerId: 9001, playerName: 'Oni_Shogi', userLink: 123, playerEmail: '', gameIds: [] }, response: 'Successfully Retrieved User' });
    expect(name).toBe('Oni_Shogi');
  });

  it('rejects successful HTTP responses that contain no profile', () => {
    let failed = false;
    service.previewStartggProfile('missing').subscribe({ error: () => failed = true });
    http.expectOne(environment.apiUrl + '/user/SyncStartggDataToPlayer').flush({ data: null, response: 'Failed to Retrieve User' });
    expect(failed).toBeTrue();
  });
});

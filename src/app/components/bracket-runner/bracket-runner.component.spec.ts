import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { PlayerBracketService, RunnerOperation } from '../../services/player-bracket.service';
import { UserService, AccountIdentity, StartggLinkStatus } from '../../services/user.service';
import { BracketVictoryPathData, PlayerOnboardResult } from '../../services/bracket-runner.models';
import { BracketRunnerComponent } from './bracket-runner.component';
import { PathListComponent } from './path-list.component';

const path: BracketVictoryPathData = {
  bracketPathId: 1, bracketId: 10, playerStartggLink: 9, tournamentSlug: 'tournament/test/event/singles',
  startTime: null, endTime: null, lifecycle: 'Upcoming',
  tournamentLinkID: 10, eventLinkID: 20, tournamentName: 'Autumn Showdown', roundNum: 'A1',
  playerTournamentCard: { playerID: 42, playerName: 'Oni_Shogi', entrantID: 8, playerResults: [] },
  entrantSetCards: [{ setID: '5', entrantOneID: 8, playerOneID: 42, entrantOneName: 'Oni_Shogi',
    entrantTwoID: 9, playerTwoID: 43, entrantTwoName: 'Rival', pathStep: 1, pathSetId: 'x', matchStatus: 'Candidate' }]
};

describe('BracketRunner states', () => {
  const account = { userId: 1, playerId: 42, userName: 'Oni_Shogi' };
  let fixture: ComponentFixture<BracketRunnerComponent>;
  let users: { account: ReturnType<typeof signal<AccountIdentity | null>>; ready: ReturnType<typeof signal<boolean>>; startgg: ReturnType<typeof signal<StartggLinkStatus | null>>; loadStartggLink: jasmine.Spy };
  let runner: Omit<jasmine.SpyObj<PlayerBracketService>, 'operation'> & { operation: ReturnType<typeof signal<RunnerOperation | null>> };
  beforeEach(async () => {
    users = { account: signal<AccountIdentity | null>(null), ready: signal(true), startgg: signal<StartggLinkStatus | null>(null),
      loadStartggLink: jasmine.createSpy().and.returnValue(of({ enabled: true, link: null })) };
    runner = jasmine.createSpyObj('runner', ['getPaths', 'getLegend', 'searchByName', 'searchByTournament', 'onboard', 'watchOperation', 'retry', 'setOwner', 'remember', 'clearOperation']);
    runner.operation = signal<RunnerOperation | null>(null);
    runner.getPaths.and.returnValue(of([path]));
    runner.getLegend.and.returnValue(of([]));
    runner.searchByName.and.returnValue(of([path]));
    runner.searchByTournament.and.returnValue(of([path]));
    runner.clearOperation.and.callFake(() => runner.operation.set(null));
    runner.setOwner.and.callFake(owner => { if (!owner) runner.operation.set(null); });
    await TestBed.configureTestingModule({ imports: [BracketRunnerComponent], providers: [
      provideRouter([]), { provide: UserService, useValue: users }, { provide: PlayerBracketService, useValue: runner }
    ] }).compileComponents();
    fixture = TestBed.createComponent(BracketRunnerComponent);
    fixture.detectChanges();
  });

  it('defaults to public player/name or event-slug search without player-ID inputs', () => {
    expect(fixture.nativeElement.querySelector('#search-type')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#runner-player')).toBeNull();
    fixture.componentInstance.query = 'Oni_Shogi';
    fixture.componentInstance.search();
    expect(runner.searchByName).toHaveBeenCalledWith('Oni_Shogi');
    expect(runner.getPaths).not.toHaveBeenCalled();
  });

  it('loads the signed-in player paths and restricts search to tournament slugs', () => {
    users.account.set(account); fixture.detectChanges();
    expect(runner.getPaths).toHaveBeenCalledWith(42);
    expect(fixture.nativeElement.querySelector('#search-type')).toBeNull();
    fixture.componentInstance.query = 'event/street-fighter-6-ps5';
    fixture.componentInstance.search();
    expect(runner.searchByTournament).toHaveBeenCalledWith('street-fighter-6-ps5');
    expect(runner.searchByName).not.toHaveBeenCalled();
  });

  it('does not label unknown schedules as upcoming or discard separate pools', () => {
    fixture.componentInstance.myPaths = [path, { ...path, bracketPathId: 2, lifecycle: 'Unknown' }, { ...path, bracketPathId: 3, lifecycle: 'Completed' }];
    expect(fixture.componentInstance.visibleMyPaths.length).toBe(2);
    fixture.componentInstance.showCompleted = true;
    expect(fixture.componentInstance.visibleMyPaths.length).toBe(3);
  });

  it('clears paths and unsubscribes from polling on logout', () => {
    users.account.set(account); fixture.detectChanges();
    const progress = new Subject<PlayerOnboardResult>();
    runner.operation.set({ ...account, operationId: '11111111-2222-3333-4444-555555555555', bracketUrl: '', status: 'Pending' });
    runner.watchOperation.and.returnValue(progress);
    fixture.componentInstance.resumeProgress();
    expect(progress.observed).toBeTrue();
    users.account.set(null); fixture.detectChanges();
    expect(progress.observed).toBeFalse();
    expect(fixture.componentInstance.myPaths).toEqual([]);
  });
});

describe('Path cards', () => {
  it('groups same-step candidates as alternatives and retains legacy order', () => {
    const view = TestBed.runInInjectionContext(() => new PathListComponent());
    const first = path.entrantSetCards[0];
    const groups = view.groups({ ...path, entrantSetCards: [
      { ...first, setID: '2', pathStep: 2 }, first, { ...first, setID: '3', pathStep: 1 },
      { ...first, setID: 'legacy-a', pathStep: null }, { ...first, setID: 'legacy-b', pathStep: null }
    ] });
    expect(groups.map(group => group.step)).toEqual([1, 2, null]);
    expect(groups[0].cards.length).toBe(2);
    expect(groups[2].cards.map(card => card.setID)).toEqual(['legacy-a', 'legacy-b']);
  });

  it('renders independent, keyboard-accessible expandable pools with stable IDs', async () => {
    await TestBed.configureTestingModule({ imports: [PathListComponent] }).compileComponents();
    const fixture = TestBed.createComponent(PathListComponent);
    fixture.componentRef.setInput('paths', [path, { ...path, bracketPathId: 2, roundNum: 'A2' }]);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('details');
    expect(cards.length).toBe(2);
    (cards[0].querySelector('summary') as HTMLElement).click();
    expect(cards[0].open).toBeTrue();
    expect(cards[1].open).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Rival');
  });
});

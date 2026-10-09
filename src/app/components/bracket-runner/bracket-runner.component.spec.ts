import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { PlayerBracketService } from '../../services/player-bracket.service';
import { BracketVictoryPathData, PlayerOnboardResult } from '../../services/bracket-runner.models';
import { BracketRunnerComponent } from './bracket-runner.component';

const path: BracketVictoryPathData = {
  tournamentLinkID: 10, eventLinkID: 20, tournamentName: 'Autumn Showdown', roundNum: 'A1',
  playerTournamentCard: { playerID: 42, playerName: 'Oni_Shogi', entrantID: 8, playerResults: [] },
  entrantSetCards: [{ setID: '5', entrantOneID: 8, playerOneID: 42, entrantOneName: 'Oni_Shogi',
    entrantTwoID: 9, playerTwoID: 43, entrantTwoName: 'Rival' }]
};

describe('BracketRunner view', () => {
  let runner: PlayerBracketService;
  let fixture: ComponentFixture<BracketRunnerComponent>;
  beforeEach(async () => {
    sessionStorage.removeItem('sengoku.bracket-runner.v1');
    runner = new PlayerBracketService({} as never);
    runner.select(42);
    spyOn(runner, 'getPaths').and.returnValue(of([path]));
    await TestBed.configureTestingModule({
      imports: [BracketRunnerComponent],
      providers: [provideRouter([]), { provide: PlayerBracketService, useValue: runner }]
    }).compileComponents();
    fixture = TestBed.createComponent(BracketRunnerComponent);
    fixture.detectChanges();
  });
  afterEach(() => sessionStorage.removeItem('sengoku.bracket-runner.v1'));

  it('expands and collapses a tournament to reveal candidate opponents', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.tournament-toggle');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('.opponent-list')).toBeNull();
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.opponent-list').textContent).toContain('Rival');
    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.opponent-list')).toBeNull();
  });

  it('handles the current player in either slot', () => {
    expect(fixture.componentInstance.opponentName(path, {
      ...path.entrantSetCards[0], playerOneID: 43, entrantOneName: 'Rival', playerTwoID: 42, entrantTwoName: 'Oni_Shogi'
    })).toBe('Rival');
  });

  it('tracks pending work, prevents duplicate imports, and refreshes on completion', () => {
    const operationId = '11111111-2222-3333-4444-555555555555';
    const progress = new Subject<PlayerOnboardResult>();
    const onboard = spyOn(runner, 'onboard').and.returnValue(of({
      status: 'Pending', response: 'Waiting', operationId, successful: [], failures: []
    }));
    spyOn(runner, 'watchOperation').and.returnValue(progress);
    fixture.componentInstance.bracketUrl = 'start.gg/tournament/test/event/singles/brackets/1/2';
    fixture.componentInstance.importBracket();
    fixture.componentInstance.importBracket();
    expect(onboard).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.watching).toBeTrue();
    progress.next({ status: 'Completed', response: 'Saved', operationId, successful: ['5'], failures: [] });
    progress.complete();
    expect(runner.getPaths).toHaveBeenCalledTimes(2);
    expect(runner.selection?.operationId).toBeNull();
    expect(fixture.componentInstance.watching).toBeFalse();
  });
  it('replaces an in-flight path load when a resumed import completes', () => {
    const oldPaths = new Subject<BracketVictoryPathData[]>();
    (runner.getPaths as jasmine.Spy).and.returnValues(oldPaths, of([path]));
    fixture.componentInstance.loadPaths();
    const operationId = '11111111-2222-3333-4444-555555555555';
    runner.rememberOperation(operationId, 'https://start.gg/tournament/test/event/singles/brackets/1/2');
    spyOn(runner, 'watchOperation').and.returnValue(of({
      status: 'Completed', response: 'Saved', operationId, successful: ['5'], failures: []
    }));
    fixture.componentInstance.resumeProgress();
    oldPaths.next([]);
    expect(fixture.componentInstance.paths).toEqual([path]);
    expect(fixture.componentInstance.loading).toBeFalse();
    expect(oldPaths.observed).toBeFalse();
  });

  it('keeps separate tournament cards when the API supplies separate paths', () => {
    fixture.componentInstance.paths = [path, { ...path, tournamentLinkID: 11, tournamentName: 'Winter Showdown' }];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.tournament-toggle').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Winter Showdown');
  });

});

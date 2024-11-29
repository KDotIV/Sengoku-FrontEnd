import { TestBed } from '@angular/core/testing';

import { TournamentBoardService } from './tournament-board.service';

describe('TournamentBoardService', () => {
  let service: TournamentBoardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TournamentBoardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

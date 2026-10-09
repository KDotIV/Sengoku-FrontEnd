import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HomeComponent } from './home.component';
import { UserService } from '../../services/user.service';
import { EventLocationService } from '../../services/event-location.service';
import { LeagueService } from '../../services/league.service';
import { PlayerBracketService } from '../../services/player-bracket.service';

describe('Feature landing page', () => {
  it('shows three distinct feature previews with working route links', async () => {
    await TestBed.configureTestingModule({ imports: [HomeComponent], providers: [
      provideRouter([]),
      { provide: UserService, useValue: { account: signal(null) } },
      { provide: EventLocationService, useValue: {} },
      { provide: LeagueService, useValue: { queryAvailableLeagues: () => of([]) } },
      { provide: PlayerBracketService, useValue: {} }
    ] }).compileComponents();
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.feature-grid > article').length).toBe(3);
    const links = [...fixture.nativeElement.querySelectorAll('.feature-link')] as HTMLAnchorElement[];
    expect(links.map(link => link.getAttribute('href'))).toEqual(['/tournament-finder', '/leaderboards', '/bracket-runner']);
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TournamentFinderComponent } from './tournament-finder.component';
import type { AddressEventResult } from '../../services/event-location.service';
import { getTournamentCardHeader } from './tournament-games';

const event = (overrides: Partial<AddressEventResult> = {}): AddressEventResult => ({
  tournamentId: 1, address: '', latitude: 0, longitude: 0, distance: 0,
  eventName: 'Weekly Singles', region: 1, startTime: null, endTime: null,
  linkId: 1, closingRegistration: null, urlSlug: 'tournament/weekly/event/singles',
  isOnline: false, ...overrides
});

describe('Tournament card game matching', () => {
  it('uses game IDs and explicit game names before a multi-game event description', () => {
    expect(getTournamentCardHeader(event({ gameId: 610, eventName: 'Street Fighter 6 / Third Strike' })).className)
      .toBe('game-third-strike');
    expect(getTournamentCardHeader(event({ videoGameName: 'Avatar Legends', eventDescription: 'Also featuring SF6 and GGST' })).className)
      .toBe('game-avatar');
  });

  it('recognizes accented TOKON, Avatar aliases, and punctuation in event slugs', () => {
    for (const name of ['MARVEL TŌKON: Fighting Souls', 'TOKON Singles', 'Marvel Tokon']) {
      expect(getTournamentCardHeader(event({ eventName: name })).className).toBe('game-tokon');
    }
    expect(getTournamentCardHeader(event({ eventName: 'Avatar: The Last Airbender Singles' })).className)
      .toBe('game-avatar');
    expect(getTournamentCardHeader(event({ urlSlug: 'tournament/weekly/event/granblue-fantasy-versus-rising' })).className)
      .toBe('game-gbvsr');
  });

  it('distinguishes sequels and uses whole-word abbreviations', () => {
    expect(getTournamentCardHeader(event({ eventName: 'Street Fighter III: 3rd Strike' })).className).toBe('game-third-strike');
    expect(getTournamentCardHeader(event({ eventName: 'Super Smash Bros. Melee' })).className).toBe('game-melee');
    for (const name of ['Street Fighter V', 'Street Fighter III: 2nd Impact', 'Tekken 7', 'KOF XIV', 'MK11', 'SSBUltimateFans weekly']) {
      expect(getTournamentCardHeader(event({ eventName: name })).className).toBe('game-default');
    }
  });

  it('uses a single filter only when metadata is missing and leaves ambiguous events generic', () => {
    expect(getTournamentCardHeader(event(), [114292]).className).toBe('game-avatar');
    expect(getTournamentCardHeader(event(), [107706, 114292]).className).toBe('game-default');
    expect(getTournamentCardHeader(event({ gameId: 999999 }), [114292]).className).toBe('game-default');
    expect(getTournamentCardHeader(event({ gameName: 'Tekken 7' }), [49783]).className).toBe('game-default');
    expect(getTournamentCardHeader(event({ eventName: 'TOKON / Avatar Legends' })).className).toBe('game-default');
  });
});

describe('Tournament finder game filters', () => {
  it('sends both new IDs, renders their headers, and clears the visible checkboxes', async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentFinderComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    const fixture = TestBed.createComponent(TournamentFinderComponent);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    for (const id of [107706, 114292]) {
      root.querySelector<HTMLInputElement>(`#game-${id}`)!.click();
    }
    fixture.componentInstance.zipcode = '10001';
    fixture.componentInstance.searchEvents();
    const request = http.expectOne(req => req.url.endsWith('/events/QueryEventsByLocation'));
    expect(request.request.params.getAll('GameIds')).toEqual(['107706', '114292']);
    request.flush([event({ gameId: 107706 }), event({ gameId: 114292 })]);
    fixture.detectChanges();
    expect(root.querySelector<HTMLElement>('.game-tokon')!.style.getPropertyValue('--event-card-image'))
      .toContain('TOKONheader.jpg');
    expect(root.querySelector<HTMLElement>('.game-avatar')!.style.getPropertyValue('--event-card-image'))
      .toContain('AvatarLegendsheader.jpg');
    expect(root.querySelector('.game-avatar .event-game')!.textContent).toContain('Avatar Legends');
    root.querySelector<HTMLButtonElement>('.games-checkboxes button')!.click();
    fixture.detectChanges();
    expect(root.querySelectorAll('input[type="checkbox"]:checked').length).toBe(0);
    expect(fixture.componentInstance.selectedGames).toEqual([]);
    http.verify();
  });
});

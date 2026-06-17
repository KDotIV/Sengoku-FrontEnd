import { Component, QueryList, ViewChildren, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { EventLocationService, AddressEventResult } from '../../services/event-location.service';  // Adjust path as necessary
import { catchError, EMPTY, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tournament-finder',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './tournament-finder.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./tournament-finder.component.css']
})
export class TournamentFinderComponent {
  title = 'Tournament Finder';
  zipcode: string = '';
  events: AddressEventResult[] = [];
  selectedGames: number[] = [];
  searchRadius: string[] = ['local'];
  availableGames = [
    { id: 33945, name: 'Guilty Gear Strive' },
    { id: 1386, name: 'Smash Ultimate' },
    { id: 43868, name: 'Street Fighter 6'},
    { id: 49783, name: 'Tekken 8'},
    { id: 48548, name: 'Granblue Versus Rising'},
    { id: 610, name: 'Third Strike'},
    { id: 36963, name: 'KoF XV'},
    { id: 5582, name: 'Soul Calibur 2'},
    { id: 48599, name: 'Mortal Kombat 1'},
    { id: 287, name: 'Dragon Ball FighterZ'},
    { id: 1, name: 'Smash Melee'}
  ];
  currentPriorities = [
    { value: 'local', name: 'Local'},
    { value: 'default', name: 'Regional'},
    { value: 'national', name: "National (Inactive)"}
  ];
  tournamentCardHeaders: Record<string, { image: string; className: string; label: string }> = {
    strive: {
      image: '/TournamentCards/Striveheader.jpg',
      className: 'game-strive',
      label: 'Guilty Gear Strive'
    },
    sf6: {
      image: '/TournamentCards/SF6header.jpg',
      className: 'game-sf6',
      label: 'Street Fighter 6'
    },
    t8: {
      image: '/TournamentCards/T8header.png',
      className: 'game-t8',
      label: 'Tekken 8'
    },
    smashUltimate: {
      image: '/TournamentCards/SmashUltimateheader.jpg',
      className: 'game-smash',
      label: 'Smash Ultimate'
    },
    default: {
      image: '',
      className: 'game-default',
      label: 'Tournament'
    }
  };
  errorMessage: string = '';

  @ViewChildren('gameCheckbox') gameCheckboxes!: QueryList<HTMLInputElement>;

  constructor(private eventLocationService: EventLocationService, private http: HttpClient) { }

  loading: boolean = false;

  toggleGameSelection(gameId: number, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const isChecked = inputElement.checked;

    if (isChecked) {
      this.selectedGames.push(gameId);
    } else {
      this.selectedGames = this.selectedGames.filter(id => id !== gameId);
    }
  }
  clearAllGames() {
    this.selectedGames = [];
    this.gameCheckboxes.forEach((checkbox: HTMLInputElement) => {
      checkbox.checked = false;
    })
  }
  searchEvents(): void {
    if (!this.zipcode || !/^\d{5}$/.test(this.zipcode)) {
      this.errorMessage = 'Please enter a valid 5-digit zipcode.';
      return;
    }
    this.errorMessage = '';
    this.loading = true;

    this.eventLocationService.queryEventsByLocation(this.zipcode, this.selectedGames, this.searchRadius)
        .pipe(
          tap((data: AddressEventResult[]) => {
            this.events = data;
            this.loading = false;
            if(data.length === 0) {
              this.errorMessage = 'No Events found for the given zipcode.';
            } else {
              this.errorMessage = '';
            }
          }),
          catchError(error => {
            console.error('Failed to load events', error);
            this.errorMessage = 'Failed to load events. Please try again later.';
            this.loading = false;
            return EMPTY;
          })
        ).subscribe();
  }

  getTournamentCardStyle(event: AddressEventResult) {
    const card = this.getTournamentCardHeader(event);

    return card.image ? { '--event-card-image': `url("${card.image}")` } : {};
  }

  getTournamentCardClass(event: AddressEventResult): string {
    return this.getTournamentCardHeader(event).className;
  }

  getTournamentCardLabel(event: AddressEventResult): string {
    return this.getTournamentCardHeader(event).label;
  }

  private getTournamentCardHeader(event: AddressEventResult) {
    const key = this.getTournamentGameKey(event);
    return this.tournamentCardHeaders[key] ?? this.tournamentCardHeaders['default'];
  }

  private getTournamentGameKey(event: AddressEventResult): string {
    const gameIds = this.getEventGameIds(event);

    if (gameIds.includes(33945)) {
      return 'strive';
    }
    if (gameIds.includes(43868)) {
      return 'sf6';
    }
    if (gameIds.includes(49783)) {
      return 't8';
    }
    if (gameIds.includes(1386)) {
      return 'smashUltimate';
    }

    const searchableText = this.getEventSearchableText(event);

    if (searchableText.includes('guilty gear') || searchableText.includes('strive') || searchableText.includes('ggst')) {
      return 'strive';
    }
    if (searchableText.includes('street fighter') || searchableText.includes('sf6')) {
      return 'sf6';
    }
    if (searchableText.includes('tekken')) {
      return 't8';
    }
    if (
      searchableText.includes('smash ultimate') ||
      searchableText.includes('super smash bros. ultimate') ||
      searchableText.includes('super smash bros ultimate') ||
      searchableText.includes('ssbu')
    ) {
      return 'smashUltimate';
    }

    if (this.selectedGames.length === 1) {
      const selectedGameId = this.selectedGames[0];

      if (selectedGameId === 33945) {
        return 'strive';
      }
      if (selectedGameId === 43868) {
        return 'sf6';
      }
      if (selectedGameId === 49783) {
        return 't8';
      }
      if (selectedGameId === 1386) {
        return 'smashUltimate';
      }
    }

    return 'default';
  }

  private getEventGameIds(event: AddressEventResult): number[] {
    return [
      event.gameId,
    ]
      .map(id => Number(id))
      .filter(id => Number.isFinite(id));
  }

  private getEventSearchableText(event: AddressEventResult): string {
    return [
      event.gameName,
      event.videoGameName,
      event.videogameName,
      event.eventName,
      event.eventDescription,
      JSON.stringify(event)
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }
}

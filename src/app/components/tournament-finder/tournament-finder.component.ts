import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { EventLocationService, AddressEventResult } from '../../services/event-location.service';  // Adjust path as necessary
import { catchError, EMPTY, tap } from 'rxjs';
import { TOURNAMENT_GAMES, getTournamentCardHeader } from './tournament-games';

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
  readonly availableGames = TOURNAMENT_GAMES;
  currentPriorities = [
    { value: 'local', name: 'Local'},
    { value: 'default', name: 'Regional'},
    { value: 'national', name: "National (Inactive)"}
  ];
  errorMessage: string = '';
  constructor(private eventLocationService: EventLocationService) { }

  loading: boolean = false;

  toggleGameSelection(gameId: number, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const isChecked = inputElement.checked;

    if (isChecked) {
      this.selectedGames = [...new Set([...this.selectedGames, gameId])];
    } else {
      this.selectedGames = this.selectedGames.filter(id => id !== gameId);
    }
  }
  clearAllGames() {
    this.selectedGames = [];
  }
  searchEvents(): void {
    //Remove previous results first
    this.events = [];

    if (!this.zipcode || !/^\d{5}$/.test(this.zipcode)) {
      this.errorMessage = 'Please enter a valid 5-digit zipcode.';
      this.loading = false;
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
            this.events = [];
            this.errorMessage = 'Failed to load events. Please try again later.';
            this.loading = false;
            return EMPTY;
          })
        ).subscribe();
  }

  getTournamentCardStyle(event: AddressEventResult) {
    const card = getTournamentCardHeader(event, this.selectedGames);

    return card.image ? { '--event-card-image': `url("${card.image}")` } : {};
  }

  getTournamentCardClass(event: AddressEventResult): string {
    return getTournamentCardHeader(event, this.selectedGames).className;
  }

  getTournamentCardLabel(event: AddressEventResult): string {
    return getTournamentCardHeader(event, this.selectedGames).name;
  }
}

import { Component, QueryList, ViewChildren } from '@angular/core';
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
  styleUrls: ['./tournament-finder.component.css']
})
export class TournamentFinderComponent {
  title = 'Tournament Finder';
  zipcode: string = '';
  events: AddressEventResult[] = [];
  selectedGames: number[] = [];
  searchRadius: string[] = [];
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
}

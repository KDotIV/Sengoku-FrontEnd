import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';  // Add this for the date pipe
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, tap } from 'rxjs';
import { EventLocationService, AddressEventResult } from './services/event-location.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'sengoku-frontend-web';
  zipcode: string = '';
  events: AddressEventResult[] = [];
  errorMessage: string = '';

  constructor(private eventLocationService: EventLocationService) { }

  searchEvents(): void {
    if (this.zipcode) {
      this.eventLocationService.queryEventsByLocation(this.zipcode)
        .pipe(
          tap(data => {
            console.log('Events Data:', data); // Log the data to verify
            this.events = data;  // handle the result
          }),
          catchError(error => {
            console.error('Failed to load events', error);
            this.errorMessage = 'Failed to load events. Please try again later.';
            return EMPTY;  // return an empty observable if there's an error
          })
        ).subscribe();
    }
  }
}

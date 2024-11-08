import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { EventLocationService, AddressEventResult } from '../../services/event-location.service';  // Adjust path as necessary
import { catchError, EMPTY, tap } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  title = 'Tournament Finder';
  zipcode: string = '';
  events: any[] = [];
  errorMessage: string = '';

  constructor(private eventLocationService: EventLocationService) { }

  searchEvents(): void {
    if (this.zipcode) {
      this.eventLocationService.queryEventsByLocation(this.zipcode)
        .pipe(
          tap(data => {
            console.log('Events Data:', data);
            this.events = data;
          }),
          catchError(error => {
            console.error('Failed to load events', error);
            this.errorMessage = 'Failed to load events. Please try again later.';
            return EMPTY;
          })
        ).subscribe();
    }
  }
}

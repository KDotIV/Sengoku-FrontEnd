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
  events: AddressEventResult[] = [];
  errorMessage: string = '';

  constructor(private eventLocationService: EventLocationService) { }

  loading: boolean = false;

  searchEvents(): void {
    if (!this.zipcode || !/^\d{5}$/.test(this.zipcode)) {
      this.errorMessage = 'Please enter a valid 5-digit zipcode.';
    return;
    }
    this.errorMessage = '';
    this.loading = true;

    this.eventLocationService.queryEventsByLocation(this.zipcode)
        .pipe(
          tap((data: AddressEventResult[]) => {
            console.log('Events Data:', data);
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

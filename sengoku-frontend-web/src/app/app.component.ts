import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';  // Add this for the date pipe
import { FormsModule } from '@angular/forms';
import { EventLocationService, AddressEventResult } from './services/event-location.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],  // No HttpClientModule needed
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'sengoku-frontend-web';
  zipcode: string = '';
  events: AddressEventResult[] = [];

  constructor(private eventLocationService: EventLocationService) { }

  searchEvents(): void {
    if (this.zipcode) {
      this.eventLocationService.queryEventsByLocation(this.zipcode).subscribe(
        (data) => this.events = data,
        (error) => console.error('Failed to load events', error)
      );
    }
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment-api';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AddressEventResult {
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
  eventName: string;
  eventDescription?: string;
  region: number;
  startTime: Date | null;
  endTime: Date | null;
  linkId: number;
  closingRegistration: Date | null;
  urlSlug: string;
  isOnline: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EventLocationService {

  private apiUrl = `${environment.apiUrl}/events/QueryEventsByLocation`;

  constructor(private http: HttpClient) { }

  // Utility function to safely parse date strings
  private parseDate(date: string | Date | null): Date | null {
    if (!date) {
      return null; // Handle null or undefined input
    }
  
    // If input is already a Date object, use it directly
    if (date instanceof Date) {
      // Format to local timezone explicitly
      const localizedDateStr = date.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      return new Date(localizedDateStr);
    }
  
    // Parse UTC explicitly
    const utcDate = new Date(`${date}Z`); // Append 'Z' to ensure UTC parsing
    if (isNaN(utcDate.getTime())) {
      return null; 
    }
  
    // Format to local timezone explicitly
    const localizedDateStr = utcDate.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    return new Date(localizedDateStr);
  }
  // Query events parsed correctly
  queryEventsByLocation(regionId: string, games: number[], priorities: string[],
    perPage: number = 50): Observable<AddressEventResult[]> {
    let params = new HttpParams()
    .set('RegionId', regionId)
    .set('PerPage', perPage.toString())

    games.forEach(gameId => {
      params = params.append('GameIds', gameId)
    })
    priorities.forEach(currentPriority => {
      params = params.append('Priority', currentPriority)
    })
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });
  
    return this.http.get<AddressEventResult[]>(this.apiUrl, {params, headers})
      .pipe(
        map(events => events.map(event => ({
          ...event,
          startTime: this.parseDate(event.startTime),
          endTime: this.parseDate(event.endTime),
          closingRegistration: this.parseDate(event.closingRegistration)
        })))
      );
  }  
}

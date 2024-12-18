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

  private apiUrl = `${environment.alexandriaUrl}/events/QueryEventsByLocation`;

  constructor(private http: HttpClient) { }

  // Utility function to safely parse date strings
  private parseDate(date: any): Date | null {
    if (!date) {
      return null; // If the date is null or empty, return null
    }
  
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return null; // Check for valid date
    }
  
    // Convert UTC to local time
    return new Date(
      parsedDate.getUTCFullYear(),
      parsedDate.getUTCMonth(),
      parsedDate.getUTCDate(),
      parsedDate.getUTCHours(),
      parsedDate.getUTCMinutes(),
      parsedDate.getUTCSeconds()
    );
  }

  // Query events and ensure date fields are parsed correctly
  queryEventsByLocation(regionId: string, games: string[], priorities: string[],
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

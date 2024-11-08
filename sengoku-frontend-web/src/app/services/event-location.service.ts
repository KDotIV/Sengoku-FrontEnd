import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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

  private apiUrl = 'https://sengoku-alexandria-qa.azurewebsites.net/api/events/QueryEventsByLocation';

  constructor(private http: HttpClient) { }

  // Utility function to safely parse date strings
  private parseDate(date: any): Date | null {
    if (!date) {
      return null;  // If the date is null or empty, return null
    }
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;  // Check for valid date
  }

  // Query events and ensure date fields are parsed correctly
  queryEventsByLocation(regionId: string, perPage: number = 50, priority: string = 'date'): Observable<AddressEventResult[]> {
    const params = new HttpParams()
    .set('RegionId', regionId)
    .set('PerPage', perPage.toString())
    .set('Priority', priority);

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

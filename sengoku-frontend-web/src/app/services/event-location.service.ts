import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AddressEventResult {
  Address: string;
  Latitude: number;
  Longitude: number;
  Distance: number;
  EventName: string;
  EventDescription?: string;
  Region: number;
  StartTime: Date | null;
  EndTime: Date | null;
  LinkId: number;
  ClosingRegistration: Date | null;
  UrlSlug: string;
  IsOnline: boolean;
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
    const requestBody = {
      RegionId: regionId,
      PerPage: perPage,
      Priority: priority
    };
  
    return this.http.post<AddressEventResult[]>(this.apiUrl, requestBody)
      .pipe(
        map(events => events.map(event => ({
          ...event,
          startTime: this.parseDate(event.StartTime),
          endTime: this.parseDate(event.EndTime),
          closingRegistration: this.parseDate(event.ClosingRegistration)
        })))
      );
  }  
}

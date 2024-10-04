import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AddressEventResult {
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
  eventName: string;
  eventDescription?: string;
  region: number;
  startTime: Date;
  endTime: Date;
  linkId: number;
  closingRegistration: Date;
  urlSlug: string;
  isOnline: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EventLocationService {

  private apiUrl = 'https://sengoku-alexandria-qa.azurewebsites.net/api/events/QueryEventsByLocation';

  constructor(private http: HttpClient) { }

  queryEventsByLocation(regionId: string, perPage: number = 50, priority: string = 'date'): Observable<AddressEventResult[]> {
    const requestBody = {
      RegionId: regionId,
      PerPage: perPage,
      Priority: priority
    };
    return this.http.post<AddressEventResult[]>(this.apiUrl, requestBody);
  }
}

import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment-api';
import { map, Observable } from 'rxjs';

export interface CreateNewSubscriptionRequest {
  serverName: string;
  subscribedChannel: string;
  webhookUrl: string;
  feedId: string;
}
export interface FeedData {
  feedId: string;
  feedType: number;
  feedName: string;
  userOwner: string;
  userId: number;
  lastUpdated: Date | null;
}
@Injectable({
  providedIn: 'root'
})
export class FeedsService {

  constructor(private http: HttpClient) { }

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

    // Parse as UTC explicitly
    const utcDate = new Date(`${date}Z`); // Append 'Z' to ensure UTC parsing
    if (isNaN(utcDate.getTime())) {
    return null; // Handle invalid dates
    }

    // Format to local timezone explicitly
    const localizedDateStr = utcDate.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    console.log(localizedDateStr)
    return new Date(localizedDateStr);
}
  subscribeToFeed(serverName: string, subscribedChannel: string, webhookUrl: string, feedId: string): Observable<HttpResponse<any>> {
    const requestBody: CreateNewSubscriptionRequest = {
      serverName: serverName,
      subscribedChannel: subscribedChannel,
      webhookUrl: webhookUrl,
      feedId: feedId
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<CreateNewSubscriptionRequest>(
      `${environment.apiUrl}/core/SubscribeDiscordWebhookToFeed`, requestBody, { headers, observe: 'response', responseType: 'json' });
  }
  getFeedByFeedId(feedId: string): Observable<FeedData> {
    let params = new HttpParams()
      .set('feedId', feedId);

    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    return this.http.get<FeedData>(`${environment.apiUrl}/core/GetFeedById`, { params, headers })
      .pipe(
        map(feed => {
          console.log('API response:', feed);
          return {
            ...feed,
            lastUpdated: this.parseDate(feed.lastUpdated)
          };
        })
      );
  }
}

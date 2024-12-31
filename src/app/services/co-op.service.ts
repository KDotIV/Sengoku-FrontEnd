import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment-api';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CoOpTravelResult {
    operationName: string;
    userId: number;
    userName: string;
    fundingGoal: number;
    coOpItems: number[];
    collabUserIds: number[];
    currentFunding: number;
    lastUpdated: Date | null;
}

@Injectable({
    providedIn: 'root'
})
export class CoOpsServices {
    private apiUrl = `${environment.apiUrl}/orgs/GetCoOpResultsUser`

    constructor(private http: HttpClient){}

    private parseDate(date: string | Date | null): Date | null {
        //Handle null or undefined dates
        if(!date) {
            return null;
        }

        if(date instanceof Date) {
            const localizedDateStr = date.toLocaleDateString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone});
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
    //Queries CoOps and parses dates correctly
    queryCoOpsByUserId(userId: number): Observable<CoOpTravelResult[]>
    {
        let params = new HttpParams()
        .set('UserId', userId)
        const headers = new HttpHeaders({
            'Accept': 'application/json'
          });
        
          return this.http.get<CoOpTravelResult[]>(this.apiUrl, {params, headers})
            .pipe(
                map(coOps => coOps.map(coOp => ({
                    ...coOp,
                    lastUpdate: this.parseDate(coOp.lastUpdated)
                })))
            );
    }
}
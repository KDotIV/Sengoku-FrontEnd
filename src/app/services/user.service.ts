import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment-api";
import { Observable } from "rxjs";

export interface UserData {
    UserId: number;
    UserName: string;
    Display: string;
    Password: string;
    Email: string;
    permissionChecksum: string;
}
export interface CreateUserRequest {
    UserName: string;
    Display: string;
    Password: string;
    Email: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    constructor(private http: HttpClient) {}

    createNewUser(userName: string, display: string, email: string, password:string): Observable<CreateUserRequest> {
        const requestBody: CreateUserRequest = {
            UserName: userName,
            Display: display,
            Password: password,
            Email: email
        };
        let params = new HttpParams()
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        return this.http.post<CreateUserRequest>(
            `${environment.alexandriaUrl}/users/CreateUser`, requestBody, { headers });
    }
    
}
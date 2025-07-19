import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string): Observable<T> {
    const url = this.apiUrl + endpoint;
    return this.http.get<T>(url);
  }

  post<T>(endpoint: string, payload: any): Observable<T> {
    const url = this.apiUrl + endpoint;
    return this.http.post<T>(url, payload);
  }

  put<T>(endpoint: string, payload: any): Observable<T> {
    const url = this.apiUrl + endpoint;
    return this.http.put<T>(url, payload);
  }

  getFilteroption<T>(
    endpoint: string,
    options: { params?: any } = {}
  ): Observable<T> {
    const url = this.apiUrl + endpoint;

    return this.http.get<T>(url, {
      ...options,
      observe: 'body' as const, // Ensure response is typed as T, not HttpEvent<T>
    });
  }
}

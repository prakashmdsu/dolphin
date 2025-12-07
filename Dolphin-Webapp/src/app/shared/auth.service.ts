// app/shared/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from './http-serve.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private router: Router, private http: HttpService) {}

  getUserData(): any {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  }

  getToken(): string | null {
    return this.getUserData()?.authToken || null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserRole(): string {
    return this.getUserData()?.profile?.role || '';
  }

  getUserName(): string {
    return (
      this.getUserData()?.profile?.userName ||
      this.getUserData()?.email ||
      'User'
    );
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  logout(): void {
    // Call backend (optional for stateless JWT)
    this.http.post('Auth/logout', {}).subscribe({
      next: () => console.log('Logged out from server'),
      error: () => console.log('Server logout failed, continuing local logout'),
    });

    this.clearSession();
  }

  clearSession(): void {
    localStorage.removeItem('userData');
    this.router.navigate(['/login']);
  }
}

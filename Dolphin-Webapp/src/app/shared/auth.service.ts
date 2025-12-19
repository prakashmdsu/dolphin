// app/shared/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from './http-serve.service';

export type UserRole = 'member' | 'admin' | 'superadmin';

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

  getUserRole(): UserRole {
    return this.getUserData()?.profile?.role || 'member';
  }

  getUserName(): string {
    return (
      this.getUserData()?.profile?.userName ||
      this.getUserData()?.email ||
      'User'
    );
  }

  // Role checks
  isMember(): boolean {
    return this.getUserRole() === 'member';
  }

  isAdmin(): boolean {
    return (
      this.getUserRole() === 'admin' || this.getUserRole() === 'superadmin'
    );
  }

  isSuperAdmin(): boolean {
    return this.getUserRole() === 'superadmin';
  }

  // Check if user has required role
  hasRole(allowedRoles: UserRole[]): boolean {
    return allowedRoles.includes(this.getUserRole());
  }

  // Check minimum access level
  hasMinimumRole(minimumRole: UserRole): boolean {
    const roleHierarchy: UserRole[] = ['member', 'admin', 'superadmin'];
    const userRoleIndex = roleHierarchy.indexOf(this.getUserRole());
    const minimumRoleIndex = roleHierarchy.indexOf(minimumRole);
    return userRoleIndex >= minimumRoleIndex;
  }

  logout(): void {
    this.http.post('Auth/logout', {}).subscribe({
      next: () => {
        console.log('Logged out from server');
        this.clearSession();
      },
      error: () => {
        console.log('Server logout failed, continuing local logout');
        this.clearSession();
      },
    });
  }

  clearSession(): void {
    localStorage.removeItem('userData');
    this.router.navigate(['/login']);
  }
}

// app/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../shared/auth.service';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    if (authService.hasRole(allowedRoles)) {
      return true;
    }

    // Redirect to appropriate page based on role
    const userRole = authService.getUserRole();
    if (userRole === 'member') {
      router.navigate(['/features/granitestocks']);
    } else {
      router.navigate(['/features/dashboard']);
    }

    return false;
  };
};

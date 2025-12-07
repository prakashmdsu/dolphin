import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Skip authentication for these endpoints
  const skipAuth =
    req.url.includes('/login') ||
    req.url.includes('/register') ||
    req.url.includes('/passwordrequest');

  if (skipAuth) {
    console.log('Auth interceptor - Skipping auth for:', req.url);
    return next(req);
  }

  const userData = localStorage.getItem('userData');

  if (userData) {
    try {
      const data = JSON.parse(userData);
      const token = data?.authToken;

      if (token) {
        console.log('Auth interceptor - Adding token to:', req.url);

        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });

        return next(clonedReq).pipe(
          catchError((error) => {
            console.log('Auth interceptor - Error:', error.status);
            if (error.status === 401) {
              console.log(
                'Auth interceptor - Unauthorized, redirecting to login'
              );
              localStorage.removeItem('userData');
              router.navigate(['/login']);
            }
            return throwError(() => error);
          })
        );
      } else {
        console.log('Auth interceptor - No token found in userData');
      }
    } catch (error) {
      console.error('Auth interceptor - Error parsing userData:', error);
    }
  } else {
    console.log('Auth interceptor - No userData in localStorage');
  }

  return next(req);
};

// auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const skipAuth =
      req.url.includes('/login') ||
      req.url.includes('/register') ||
      req.url.includes('/passwordrequest');

    if (skipAuth) {
      return next.handle(req);
    }

    const token = localStorage.getItem('userData');
    let clonedReq = req;

    if (token) {
      try {
        const data = JSON.parse(token);
        const authToken = data?.authToken;

        if (authToken) {
          clonedReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${authToken}`,
            },
          });
        }
      } catch (error) {
        console.error('Error parsing userData:', error);
      }
    }

    return next.handle(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('userData');
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}

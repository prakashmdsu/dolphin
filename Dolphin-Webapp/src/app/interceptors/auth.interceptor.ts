import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip authentication for login and register endpoints
    const skipAuth = req.url.includes('/login') || 
                     req.url.includes('/register') || 
                     req.url.includes('/passwordrequest');
    
    if (skipAuth) {
      return next.handle(req);
    }

    const token = localStorage.getItem('userData');
    
    if (token) {
      try {
        const data = JSON.parse(token);
        const authToken = data?.authToken || data?.token || data?.Token; // Try different property names
        
        if (authToken) {
          console.log('Adding token to request:', authToken.substring(0, 20) + '...'); // Debug log
          
          const cloned = req.clone({
            setHeaders: {
              Authorization: `Bearer ${authToken}`
            }
          });
          return next.handle(cloned);
        } else {
          console.warn('No auth token found in userData');
        }
      } catch (error) {
        console.error('Error parsing userData from localStorage:', error);
      }
    } else {
      console.warn('No userData found in localStorage');
    }
    
    return next.handle(req);
  }
}
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SpinnerService } from '../shared/spinner.service';
// import { SpinnerService } from '../shared/spinner.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private spinnerService: SpinnerService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.spinnerService.show();
    return next.handle(request).pipe(
      finalize(() => this.spinnerService.hide())
    );
  }
}

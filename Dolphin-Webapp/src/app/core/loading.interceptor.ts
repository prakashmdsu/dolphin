import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { SpinnerService } from '../shared/spinner.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const spinnerService = inject(SpinnerService);

  console.log('Loading interceptor - Request started:', req.url);
  spinnerService.show();

  return next(req).pipe(
    finalize(() => {
      console.log('Loading interceptor - Request completed:', req.url);
      spinnerService.hide();
    })
  );
};

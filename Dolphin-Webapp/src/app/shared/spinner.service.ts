import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpinnerService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private requestCount = 0;

  loading$ = this.loadingSubject.asObservable();

  show(): void {
    this.requestCount++;
    console.log('SpinnerService - show, count:', this.requestCount);
    this.loadingSubject.next(true);
  }

  hide(): void {
    this.requestCount--;
    console.log('SpinnerService - hide, count:', this.requestCount);

    if (this.requestCount <= 0) {
      this.requestCount = 0;
      this.loadingSubject.next(false);
    }
  }
}

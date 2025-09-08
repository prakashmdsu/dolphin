import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SpinnerService } from '../spinner.service';

@Component({
  selector: 'app-spinner',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  isLoading: boolean = false;
constructor(private spinnerService: SpinnerService) 
{
  spinnerService.loading$.subscribe(res=>{
    this.isLoading=res
  })
}
  show() {
    this.isLoading = true;
  }

  hide() {
    this.isLoading = true;
  }
}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpinnerComponent } from "./shared/spinner/spinner.component";
import { SpinnerService } from './shared/spinner.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SpinnerComponent,CommonModule],
  standalone:true,

  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  isLoading=false;
  currentDate = new Date();
  constructor(private spinnerService: SpinnerService) {
   this.spinnerService.loading$.subscribe(res=>{
    this.isLoading=res
   })
  }

}

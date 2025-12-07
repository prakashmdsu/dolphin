import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login/login.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
// REMOVE: import { HttpClientModule } from '@angular/common/http';
// REMOVE: import { HttpService } from '../shared/http-serve.service';

@NgModule({
  declarations: [LoginComponent],
  imports: [
    CommonModule,
    RouterModule,
    LoginRoutingModule,
    FormsModule,
    // REMOVE HttpClientModule from here!
  ],
  // REMOVE providers array - HttpService already has providedIn: 'root'
})
export class LoginModule {}

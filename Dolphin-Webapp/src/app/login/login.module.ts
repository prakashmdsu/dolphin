import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login/login.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
// import { HttpServeService } from '../Shared/http-service.service';
import { RouterModule } from '@angular/router';
import { HttpService } from '../shared/http-serve.service';

@NgModule({
  declarations: [LoginComponent],
  imports: [
    CommonModule,
    RouterModule,
    LoginRoutingModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [HttpService],
})
export class LoginModule {}

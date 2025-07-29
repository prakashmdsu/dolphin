import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
// import { HttpServeService } from '../../Shared/http-service.service';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { HttpService } from '../../shared/http-serve.service';
@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  apiUrl: string = environment.apiUrl; // Set this to your .NET Core API base URL

  isForgotPassword: boolean = false;
  constructor(private services: HttpService, private router: Router) {}
  onSubmit() {
    if (!this.isForgotPassword) {
      const loginData = { Email: this.username, Password: this.password };
      this.services.post('auth/login', loginData).subscribe(
        (response: any) => {
          console.log('Login successful:', response);
          this.services
            .get<any>('Auth/profile?email=' + this.username)
            .subscribe((profileResponse) => {
              var userDataandToken = {
                email: this.username,
                authToken: response.token,
                profile: profileResponse,
              };
              // Store the user data in localStorage
              localStorage.setItem(
                'userData',
                JSON.stringify(userDataandToken)
              );
              if (profileResponse.role == 'admin')
                this.router.navigate(['/features/dashboard']);
              else this.router.navigate(['/user/dashboard']);
            });
          // Store the JWT token in localStorage
          // Navigate to the dashboard or protected route
        },
        (error) => {
          alert('Login failed');
        }
      );
    } else {
      this.services
        .get('Auth/passwordrequest?email=' + this.username)
        .subscribe(
          (res) => {
            alert('Your password has been send to your registered email');
          },
          (err) => {
            alert('Email address does not exist please contact admin');
          }
        );
    }
  }

  toggleForgotPassword() {
    this.isForgotPassword = !this.isForgotPassword;
    this.password = ''; // Clear the password field when toggling
  }
}

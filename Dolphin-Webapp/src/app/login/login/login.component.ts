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
  // login.component.ts
  onSubmit() {
    if (!this.isForgotPassword) {
      const loginData = { Email: this.username, Password: this.password };

      this.services.post('auth/login', loginData).subscribe({
        next: (response: any) => {
          console.log('Login successful:', response);

          // Step 1: Save token FIRST
          const initialUserData = {
            email: this.username,
            authToken: response.token,
            profile: null,
          };
          localStorage.setItem('userData', JSON.stringify(initialUserData));

          // Step 2: Now fetch profile (token will be attached by interceptor)
          this.services
            .get<any>('Auth/profile?email=' + this.username)
            .subscribe({
              next: (profileResponse) => {
                // Step 3: Update localStorage with profile data
                const fullUserData = {
                  email: this.username,
                  authToken: response.token,
                  profile: profileResponse,
                };
                localStorage.setItem('userData', JSON.stringify(fullUserData));

                // Step 4: Navigate based on role
                if (profileResponse.role === 'admin') {
                  this.router.navigate(['/features/dashboard']);
                } else {
                  this.router.navigate(['/user/dashboard']);
                }
              },
              error: (err) => {
                console.error('Profile fetch failed:', err);
                // Still navigate since login was successful
                if (response.user?.role === 'admin') {
                  this.router.navigate(['/features/dashboard']);
                } else {
                  this.router.navigate(['/user/dashboard']);
                }
              },
            });
        },
        error: (error) => {
          console.error('Login failed:', error);
          alert('Login failed');
        },
      });
    } else {
      // Forgot password - should be POST, not GET
      this.services
        .post('Auth/passwordrequest', { email: this.username })
        .subscribe({
          next: (res) => {
            alert('Your password has been sent to your registered email');
          },
          error: (err) => {
            alert('Email address does not exist, please contact admin');
          },
        });
    }
  }
  toggleForgotPassword() {
    this.isForgotPassword = !this.isForgotPassword;
    this.password = ''; // Clear the password field when toggling
  }
}

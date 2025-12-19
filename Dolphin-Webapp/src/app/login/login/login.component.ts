import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { HttpService } from '../../shared/http-serve.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  apiUrl: string = environment.apiUrl;
  isForgotPassword: boolean = false;

  constructor(private services: HttpService, private router: Router) {}

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

          // Step 2: Fetch profile
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
                this.navigateByRole(profileResponse.role);
              },
              error: (err) => {
                console.error('Profile fetch failed:', err);
                // Fallback: use role from login response if available
                const fallbackRole = response.user?.role || 'member';
                this.navigateByRole(fallbackRole);
              },
            });
        },
        error: (error) => {
          console.error('Login failed:', error);
          alert('Login failed. Please check your credentials.');
        },
      });
    } else {
      this.services
        .post('Auth/passwordrequest', { email: this.username })
        .subscribe({
          next: () => {
            alert('Your password has been sent to your registered email');
            this.toggleForgotPassword();
          },
          error: () => {
            alert('Email address does not exist, please contact admin');
          },
        });
    }
  }

  // Navigate based on user role
  private navigateByRole(role: string): void {
    switch (role?.toLowerCase()) {
      case 'superadmin':
        this.router.navigate(['/features/dashboard']);
        break;
      case 'admin':
        this.router.navigate(['/features/dashboard']);
        break;
      case 'member':
        this.router.navigate(['/features/granitestocks']);
        break;
      default:
        // Default to member access
        this.router.navigate(['/features/granitestocks']);
        break;
    }
  }

  toggleForgotPassword() {
    this.isForgotPassword = !this.isForgotPassword;
    this.password = '';
  }
}

import { Component, HostListener } from '@angular/core';
import { AuthService } from '../../shared/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  isExpanded = false;
  isMobile = false;

  constructor(public authService: AuthService) {
    this.checkIfMobile();
  }

  @HostListener('window:resize', [])
  checkIfMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  navItems = [
    { label: 'Dashboard', route: '/features/dashboard', icon: 'dashboard' },
    {
      label: 'Granite Stocks',
      route: '/features/granitestocks',
      icon: 'inventory',
    },
    {
      label: 'Add Client',
      route: '/features/addclient',
      icon: 'person_add',
      adminOnly: true,
    },
    { label: 'Billing', route: '/features/billing', icon: 'receipt' },
    {
      label: 'Billed Invoices',
      route: '/features/reports',
      icon: 'description',
    },
  ];

  get userName(): string {
    return this.authService.getUserName();
  }

  get userRole(): string {
    return this.authService.getUserRole();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  toggleNavbar(expand: boolean): void {
    this.isExpanded = expand;
  }

  logout(): void {
    this.authService.logout();
  }
}

// app/features/navbar/navbar.component.ts
import { Component, HostListener } from '@angular/core';
import { AuthService, UserRole } from '../../shared/auth.service';

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

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/features/dashboard',
      icon: 'dashboard',
      allowedRoles: ['admin', 'superadmin'],
    },
    {
      label: 'Granite Stocks',
      route: '/features/granitestocks',
      icon: 'inventory',
      allowedRoles: ['member', 'admin', 'superadmin'], // All roles
    },
    {
      label: 'Add Client',
      route: '/features/addclient',
      icon: 'person_add',
      allowedRoles: ['admin', 'superadmin'], // SuperAdmin only
    },
    {
      label: 'Dispatch',
      route: '/features/billing',
      icon: 'receipt',
      allowedRoles: ['admin', 'superadmin'],
    },
    {
      label: 'Billed Invoices',
      route: '/features/reports',
      icon: 'description',
      allowedRoles: ['admin', 'superadmin'],
    },
    {
      label: 'Summary',
      route: '/features/summary',
      icon: 'summarize',
      allowedRoles: ['admin', 'superadmin'],
    },
  ];

  get userName(): string {
    return this.authService.getUserName();
  }

  get userRole(): string {
    return this.authService.getUserRole();
  }

  // Check if current user can see nav item
  canAccess(item: NavItem): boolean {
    return this.authService.hasRole(item.allowedRoles);
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  toggleNavbar(expand: boolean): void {
    this.isExpanded = expand;
  }

  logout(): void {
    this.authService.logout();
  }
}

interface NavItem {
  label: string;
  route: string;
  icon: string;
  allowedRoles: UserRole[];
}

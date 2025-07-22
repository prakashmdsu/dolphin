import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  isExpanded = false;

  isMobile = false;
  @HostListener('window:resize', [])
  checkIfMobile() {
    this.isMobile = window.innerWidth <= 768;
  }
  navItems = [
    { label: 'Dashboard', route: '/features/dashboard', icon: 'fas fa-home' },

    // { label: 'Dashboard', route: '/analytics/sector', icon: 'fas fa-industry' },
    {
      label: 'Granite Stocks',
      route: '/features/granitestocks',
      icon: 'fas fa-industry',
    },
    {
      label: 'Add Client',
      route: '/features/addclient',
      icon: 'fas fa-exchange-alt',
    },
    {
      label: 'Billing',
      route: '/features/billing',
      icon: 'fas fa-industry',
    },
    {
      label: 'Enter stock',
      route: '/features/stockentry',
      icon: 'fas fa-exchange-alt',
    },

    // { label: 'Settings', route: '/settings', icon: 'fas fa-cog' },
    // { label: 'Help', route: '/help', icon: 'fas fa-question-circle' },
  ];

  toggleNavbar(expand: boolean): void {
    this.isExpanded = expand;
  }
}

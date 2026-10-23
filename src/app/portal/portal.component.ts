import { AuthService } from '../services/auth/auth.service';
import { Component, AfterViewInit, inject } from '@angular/core';
import { SidebarService } from './sidebar.service';

/**
 * Defines the overall app layout
 */
@Component({
    selector: 'app-portal',
    templateUrl: './portal.component.html',
    styleUrls: ['./portal.component.scss'],
    standalone: false
})
export class PortalComponent implements AfterViewInit {
  private authService = inject(AuthService);
  private sidebarService = inject(SidebarService);
  readonly isSidebarOpen = this.sidebarService.isSidebarOpen;
  featuredLayersCheckbox = true;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.featuredLayersCheckbox = true;
    }, 10);
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  openAppStore(): void {
    window.open('https://avre.auscope.org.au');
  }

  /**
   * Check is a user is logged in.
   *
   * @returns true if user logged in, false otherwise
   */
  isUserLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

}

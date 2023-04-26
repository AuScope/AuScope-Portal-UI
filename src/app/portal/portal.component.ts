import { Component } from '@angular/core';
import { AuthService } from 'app/services/auth/auth.service';
/**
 * Defines the overall app layout
 */
@Component({
    selector: 'app-portal',
    templateUrl: './portal.component.html',
    styleUrls: ['../../styles.scss']
})
export class PortalComponent {

  featuredLayersCheckbox: boolean;

  constructor(private authService: AuthService) {}

  /**
   * Check is a user is logged in.
   *
   * @returns true if user logged in, false otherwise
   */
  isUserLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

}

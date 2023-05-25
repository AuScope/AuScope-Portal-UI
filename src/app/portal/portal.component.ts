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

  featuredLayersCheckbox: boolean = true;

  constructor(private authService: AuthService) {}

  /**
   * Featured layers would not display after logging in due to a strange UI bug, so by binding
   * the panel checkbox to a variable we can set it immediately after display to ensure the
   * panel is always expanded after a page refresh
   */
  ngAfterViewInit() {
    setTimeout(() => {
      this.featuredLayersCheckbox = true;
    }, 10);
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

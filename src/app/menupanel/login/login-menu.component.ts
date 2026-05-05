import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PermanentLinksModalComponent } from 'app/modalwindow/permanentlink/permanentlinks.modal.component';
import { PermanentLink } from 'app/models/permanentlink.model';
import { User } from 'app/models/user.model';
import { AuthService } from 'app/services/auth/auth.service';
import { UserStateService } from '../../services/user/user-state.service';
import { ROIModalComponent } from 'app/modalwindow/roi/roi.modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: '[app-login-menu]',
    templateUrl: './login-menu.component.html',
    styleUrls: ['./login-menu.component.scss', '../../toppanel/help-menu/help-menu.component.scss'],
    standalone: false
})
export class LoginMenuComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private userStateService = inject(UserStateService);
  private dialog = inject(MatDialog);

  user: User;
  states: PermanentLink[];

  constructor() {
    this.userStateService.user.subscribe(user => {
      this.user = user;
    });
    this.userStateService.states.subscribe(states => {
      this.states = states;
    });
  }

  /**
   * Redirect to login page
   */
  login() {
    this.router.navigate(['login']).catch(
        (navError) => console.error("Could not navigate to login page", navError)
    );
  }

  /**
   * Logout current user
   */
  logOut() {
    this.authService.logout();
  }
  /**
   * Manage user's ROI list
   */
  manageROI() {
    this.dialog.open(ROIModalComponent, {
    });
  }
  /**
   * Test if user has ROI
   *
   * @returns true if user has saved ROI, false otherwise
   */
  public userHasROI(): boolean {
    return this.userStateService.roiList.length > 0;
  }

  /**
   * Test if user has states
   *
   * @returns true if user has saved states, false otherwise
   */
  public userHasStates(): boolean {
    return this.states.length > 0;
  }

  /**
   * Manage user's permanent links
   */
  manageStates() {
    this.dialog.open(PermanentLinksModalComponent, {
      width: '800px',
      maxWidth: '800px',
    });
  }

}

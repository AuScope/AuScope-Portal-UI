import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PermanentLinksModalComponent } from 'app/modalwindow/permanentlink/permanentlinks.modal.component';
import { PermanentLink } from 'app/models/permanentlink.model';
import { User } from 'app/models/user.model';
import { AuthService } from 'app/services/auth/auth.service';
import { UserStateService } from '../../services/user/user-state.service';
import { ROIModalComponent } from 'app/modalwindow/roi/roi.modal.component';
import { CsClipboardService } from '@auscope/portal-core-ui';
@Component({
    selector: '[app-login-menu]',
    templateUrl: './login-menu.component.html',
    styleUrls: ['./login-menu.component.scss']
})
export class LoginMenuComponent {

  user: User;
  states: PermanentLink[];

  constructor(private router: Router, private authService: AuthService, private userStateService: UserStateService, private csClipboardService: CsClipboardService, private modalService: NgbModal) {
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
    this.router.navigate(['login']);
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
    this.modalService.open(ROIModalComponent, {
      size: 'sm',
      backdrop: false
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
    this.modalService.open(PermanentLinksModalComponent, {
      size: 'lg',
      backdrop: false
    });
  }

}

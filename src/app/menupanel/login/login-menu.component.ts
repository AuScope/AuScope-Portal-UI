import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'app/services/auth/auth.service';
import { UserStateService } from '../../services/user/user-state.service';

@Component({
    selector: '[app-login-menu]',
    templateUrl: './login-menu.component.html',
    styleUrls: ['./login-menu.component.scss']
})
export class LoginMenuComponent {

  username: string;

  constructor(private router: Router, private authService: AuthService, private userStateService: UserStateService) {
    this.authService.checkServerLogin();
    this.userStateService.user.subscribe(user => {
      if (user) {
        this.username = user.fullName;
      }
    });
  }

  /**
   * Check is a user is logged in.
   *
   * @returns true if user logged in, false otherwise
   */
  isUserLoggedIn(): boolean {
    return this.authService.isLoggedIn;
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

}

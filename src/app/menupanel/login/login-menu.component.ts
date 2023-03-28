import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'app/models/user.model';
import { AuthService } from 'app/services/auth/auth.service';
import { UserStateService } from '../../services/user/user-state.service';

@Component({
    selector: '[app-login-menu]',
    templateUrl: './login-menu.component.html',
    styleUrls: ['./login-menu.component.scss']
})
export class LoginMenuComponent {

  user: User;

  constructor(private router: Router, private authService: AuthService, private userStateService: UserStateService) {
    this.userStateService.user.subscribe(user => {
      this.user = user;
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

}

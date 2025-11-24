import { Component } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    animations: [routerTransition()],
    standalone: false
})
export class LoginComponent {

  // TODO: We may need to store some user site settings to local storage if not saved to DB for post-auth

  /**
   * Google login
   */
  loginGoogle() {
    window.location.href = environment.authBaseUrl + 'oauth2/authorization/google'
  }

  /**
   * Australia Access Federation (AAF) login
   */
  loginAaf() {
    window.location.href = environment.authBaseUrl + 'login/aaf';
  }

  /**
   * Github login
   */
  loginGithub() {
    window.location.href = environment.authBaseUrl + 'oauth2/authorization/github';
  }

}

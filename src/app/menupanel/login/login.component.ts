import { Component } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { environment } from '../../../environments/environment';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
declare let rudderanalytics: any;

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
    if (environment.rudderStackWriteKey && typeof rudderanalytics !== 'undefined') {
      rudderanalytics.track('login', { auth_provider: 'google' });
    }
    window.location.href = environment.authBaseUrl + 'oauth2/authorization/google'
  }

  /**
   * Australia Access Federation (AAF) login
   */
  loginAaf() {
    if (environment.rudderStackWriteKey && typeof rudderanalytics !== 'undefined') {
      rudderanalytics.track('login', { auth_provider: 'aaf' });
    }
    window.location.href = environment.authBaseUrl + 'login/aaf';
  }

  /**
   * Github login
   */
  loginGithub() {
    if (environment.rudderStackWriteKey && typeof rudderanalytics !== 'undefined') {
      rudderanalytics.track('login', { auth_provider: 'github' });
    }
    window.location.href = environment.authBaseUrl + 'oauth2/authorization/github';
  }

}

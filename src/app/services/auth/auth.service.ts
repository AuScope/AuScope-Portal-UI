import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserStateService } from '../user/user-state.service';
import { environment } from 'environments/environment';

@Injectable()
export class AuthService {

  constructor(private userStateService: UserStateService,
              private router: Router,
              private http: HttpClient) {}

  logout(): void {
    localStorage.removeItem('isLoggedIn');
    this.http.get(environment.portalProxyUrl + 'logout').subscribe(() => {
      this.userStateService.logoutUser();
      this.router.navigate(['']);
    });
  }

  /**
   * Update the local user object to see if the User has been logged out of
   * the server, but the front end doesn't know it yet
   */
  checkServerLogin(): void {
    this.userStateService.updateUser().subscribe(user => {
      if (user === null) {
        localStorage.removeItem('isLoggedIn');
      } else {
        localStorage.setItem('isLoggedIn', 'true');
      }
    }, () => {
      localStorage.removeItem('isLoggedIn');
    });
  }

  onLoggedIn() {
    this.userStateService.updateUser().subscribe(user => {
      localStorage.setItem('isLoggedIn', 'true');
      this.router.navigate(['/']);
    });
  }

  public get isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  public get redirectUrl(): string {
    return localStorage.getItem('redirectUrl');
  }

  public set redirectUrl(url: string) {
    localStorage.setItem('redirectUrl', url);
  }

  resetRedirectUrl(): string {
    const url = localStorage.getItem('redirectUrl');
    localStorage.removeItem('redirectUrl');
    return url;
  }

}

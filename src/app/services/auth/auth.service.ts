import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserStateService } from '../user/user-state.service';
import { environment } from 'environments/environment';
import { User } from 'app/models/user.model';

@Injectable()
export class AuthService {

  user: User;

  constructor(private userStateService: UserStateService,
              private router: Router,
              private http: HttpClient) {
    this.userStateService.user.subscribe(user => {
      this.user = user;
    });
  }

  logout(): void {
    this.http.get(environment.portalProxyUrl + 'logout').subscribe(() => {
      this.userStateService.logoutUser();
      await this.router.navigate(['']);
    });
  }

  onLoggedIn() {
    await this.router.navigate(['/']);
  }

  public get isLoggedIn(): boolean {
    return this.user !== undefined;
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

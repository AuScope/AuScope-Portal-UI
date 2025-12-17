import { Injectable, inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { UserStateService } from '../user/user-state.service';

/**
 * AuthGuard is not so useful at the moment with all pages available to the user,
 * but may become useful down the track if we want to limit access to pages (by adding
 * "canActivate [AuthGuard]" to the route deinfintion).
 */
@Injectable()
export class AuthGuard {
  private router = inject(Router);
  private authService = inject(AuthService);
  private userStateService = inject(UserStateService);


  canActivate(router: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    const url: string = state.url;
    return this.checkLogin(url);
  }

  checkLogin(_url: string): Observable<boolean> | boolean {
    if (this.authService.isLoggedIn) {
        return this.userStateService.user.pipe(map(
          // Later we can use returned user to check T&C's etc. if necessary
          () => {
            return true;
          }
        ));
    }
    // Navigate to the login page
    this.router.navigate(['/login']).catch(
        (navError) => console.error("Could not navigate to login page", navError)
    );
    return false;
  }

}

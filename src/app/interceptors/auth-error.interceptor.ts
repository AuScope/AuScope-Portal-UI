import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserStateService } from 'app/services/user/user-state.service';
import { Router } from '@angular/router';

/**
 * Adds a default error handler to all requests.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthErrorHandlerInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private userStateService = inject(UserStateService);


  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error) => this.errorHandler(error)));
  }

  // Customize the default error handler here if needed
  private errorHandler(error: HttpEvent<any>): Observable<HttpEvent<any>> {
    if (error instanceof HttpErrorResponse) {
        if (error.status === 403 && error.error.path !== '/api/secure/getUser.do') {
            this.userStateService.logoutUser();
            this.showSessionTimedOutAlert();
            this.router.navigate(['login']).catch(
                (navError) => console.error("Could not navigate to login page", navError)
            );
        } else {
             throw Error(error.message);
        }
    }
    throw Error("AuthErrorHandlerInterceptor returned error");
  }

  /**
   * Show an alert when the session has timed out
   */
  private showSessionTimedOutAlert() {
    alert('Session has timed out, please log in again.');
  }
}

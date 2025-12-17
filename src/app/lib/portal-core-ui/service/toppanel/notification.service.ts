
import { throwError as observableThrowError } from 'rxjs';

import { catchError, map } from 'rxjs/operators';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';

/**
 * Service class for the twitter notification
 */
@Injectable()
export class NotificationService {
  private http = inject(HttpClient);
  private env = inject<any>('env' as any);

  /**
   * gets the notification from twitter
   * @return a observable that contains the twitter notification
   */
  getNotifications() {
    return this.http.get(this.env.portalBaseUrl + 'getNotifications.do').pipe(
      map(
      (response: HttpResponse<string>) => {
          const data = JSON.parse(response.body);
          return data;
        }
      ),
      catchError(
      (error: HttpResponse<any>) => {
          return observableThrowError(error);
        }
      ),);
    }
}


import {throwError as observableThrowError } from 'rxjs';

import {catchError, map} from 'rxjs/operators';
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';

/**
 * Service class for the twitter notification
 */
@Injectable()
export class NotificationService {
  constructor(private http: HttpClient, @Inject('env') private env) {

  }
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
      ), );
    }
}

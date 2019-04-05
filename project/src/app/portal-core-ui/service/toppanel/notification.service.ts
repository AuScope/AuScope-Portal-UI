
import {throwError as observableThrowError } from 'rxjs';

import {catchError, map} from 'rxjs/operators';
import { Injectable, Inject } from '@angular/core';
import { Http, Response } from '@angular/http';

/**
 * Service class for the twitter notification
 */
@Injectable()
export class NotificationService {
  constructor(private http: Http, @Inject('env') private env) {

  }
  /**
   * gets the notification from twitter
   * @return a observable that contains the twitter notification
   */
  getNotifications() {
    return this.http.get(this.env.portalBaseUrl + 'getNotifications.do').pipe(
      map(
        (response: Response) => {
          const data = response.json();
          return data;
        }
      ),
      catchError(
        (error: Response) => {
          return observableThrowError(error);
        }
      ), );
    }
}

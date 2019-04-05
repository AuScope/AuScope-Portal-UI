
import {tap} from 'rxjs/operators';
import { Injectable, Inject } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable()
export class LegendService {

  private layerRecord;
  private getCSWUrl;

  constructor(private http: HttpClient, @Inject('env') private env) {
  }

  /**
   * Fetches legend given url
   * @param styleUrl URL string to get legend from local server
   */
  public getLegendStyle(styleUrl: string): Observable<any> {
    const me = this;
    return this.http.get(this.env.portalBaseUrl + styleUrl, {responseType: 'text'}).pipe(
      tap(result => result));
  }
}

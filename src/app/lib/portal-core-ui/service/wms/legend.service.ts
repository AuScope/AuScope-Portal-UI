import { tap } from 'rxjs/operators';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable()
export class LegendService {
  private http = inject(HttpClient);
  private env = inject<any>('env' as any);


  /**
   * Fetches legend given url
   * @param styleUrl URL string to get legend from local server
   */
  public getLegendStyle(styleUrl: string): Observable<any> {
    return this.http.get(this.env.portalBaseUrl + styleUrl, { responseType: 'text' }).pipe(
      tap(result => result));
  }
}

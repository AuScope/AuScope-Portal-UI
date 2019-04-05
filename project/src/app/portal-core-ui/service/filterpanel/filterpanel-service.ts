
import {map} from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Injectable, Inject } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';


/**
 * Service class to handle jobs relating to getting csw records from the server
 *
 */
@Injectable()
export class FilterPanelService {

  constructor(private http: HttpClient, @Inject('env') private env) {}

  /**
   * Helper service to retrieve remote options for the filter options
   */
  public getFilterRemoteParam(url: string): Observable<any> {
    switch (url) {
      case 'xxx.do':
        return // VT: in the event we need special handling this.xxx(url);
      default:
        return this.getRemoteParam(environment.portalBaseUrl + url);
    }
  }

  /**
   * Helper service to retrieve commodities options for the filter panel
   */
  public getRemoteParam(url: string): Observable<any> {
    return this.http.get(url).pipe(
      map(response => {
        const data = response['data'];
        const result = [];
        data.forEach(function(item, i, ar) {
          result.push({
            key: item[1],
            value: item[0]
          });
        });
        return result;
      }));
  }


}

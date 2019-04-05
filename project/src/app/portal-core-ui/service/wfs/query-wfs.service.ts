
import {throwError as observableThrowError,  Observable } from 'rxjs';

import {catchError, map} from 'rxjs/operators';
import { Injectable, Inject } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { OnlineResourceModel } from '../../model/data/onlineresource.model';

@Injectable()
export class QueryWFSService {

    constructor(private http: HttpClient, @Inject('env') private env) {
    }
    /**
     * A get feature info request
     * @param layer the wfs layer for the getfeatureinfo request to be made
     * @param onlineresource the wfs online resource
     * @return Observable the observable from the http request
     */
    public getFeatureInfo(onlineResource: OnlineResourceModel, featureId: string): Observable<any> {
      let httpParams = new HttpParams();
      httpParams = httpParams.append('serviceUrl', onlineResource.url);
      httpParams = httpParams.append('typeName', onlineResource.name);
      httpParams = httpParams.append('featureId', featureId);

      return this.http.get(this.env.portalBaseUrl + 'requestFeature.do', {
        params: httpParams
      }).pipe(map(response => {
        if (response['success']) {
          return response['data']['gml'];
        } else {
          return observableThrowError('error');
        }
      }), catchError(
        (error: Response) => {
          return observableThrowError(error);
        }
        ), );

  }
}


import {throwError as observableThrowError} from 'rxjs';

import {catchError, map} from 'rxjs/operators';

import { environment } from '../../../../../../environments/environment';
import { Injectable } from '@angular/core';
import {HttpClient, HttpParams, HttpHeaders} from '@angular/common/http';


@Injectable()
export class CapdfFilterService {


  constructor(private http: HttpClient) {

  }


  public doGetGroupOfInterest(serviceUrl: string) {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('serviceUrl', serviceUrl);

    return this.http.post(environment.portalBaseUrl + 'doGetGroupOfInterest.do', httpParams.toString(), {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
      responseType: 'json'
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['data'];
      } else {
        return observableThrowError(response['msg']);
      }
    }),catchError(
      (error: Response) => {
        return observableThrowError(error);
      }
      ),);
  }

  public doGetAOIParam(serviceUrl: string, featureType: string) {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('serviceUrl', serviceUrl);
    httpParams = httpParams.append('featureType', featureType);

    return this.http.post(environment.portalBaseUrl + 'doGetAOIParam.do', httpParams.toString(), {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
      responseType: 'json'
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['data'];
      } else {
        return observableThrowError(response['msg']);
      }
    }),catchError(
      (error: Response) => {
        return observableThrowError(error);
      }
      ),);
  }
}


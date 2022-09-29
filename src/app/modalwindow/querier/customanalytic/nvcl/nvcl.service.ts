
import {throwError as observableThrowError, Observable, BehaviorSubject, of, ReplaySubject, timer } from 'rxjs';

import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';
import {catchError, delay, map} from 'rxjs/operators';
import { UtilitiesService } from '@auscope/portal-core-ui';
import { Injectable, Inject} from '@angular/core';
import {HttpClient, HttpParams, HttpHeaders, HttpResponse} from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
declare var gtag: Function;
@Injectable()
export class NVCLService {

  public isAnalytic: BehaviorSubject<boolean>; // observable used in querier to control Analytic TAB

  /**
   * returns the observable of "isAnalytic" variable 
   */
  getAnalytic(): Observable<boolean> {
    //console.log("[nvclservice]getAnalytic().this.isAnalytic="+this.isAnalytic.asObservable()._isScalar);
    return this.isAnalytic.asObservable();
  }

  /**
   * sets the state of "isAnalytic" variable
   */
  setAnalytic(state:boolean): void {
    //console.log("[nvclservice]setAnalytic("+state+")");
    this.isAnalytic.next(state);
  }

  constructor(private http: HttpClient , @Inject(LOCAL_STORAGE) private storage: StorageService) {
    this.isAnalytic = new BehaviorSubject<boolean>(false);
  }

  public getNVCLDatasets(serviceUrl: string, holeIdentifier: string): Observable<any> {
    let httpParams = new HttpParams();
    const nvclUrl = this.getNVCLDataServiceUrl(serviceUrl);

    httpParams = httpParams.append('serviceUrl', nvclUrl);
    httpParams = httpParams.append('holeIdentifier',  holeIdentifier.replace('gsml.borehole.', ''));
    return this.http.get(environment.portalBaseUrl + 'getNVCLDatasets.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['data'];
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }

   public getNVCL2_0_Images(serviceUrl: string, datasetId: string): Observable<any> {
    let httpParams = new HttpParams();
    const nvclUrl = this.getNVCLDataServiceUrl(serviceUrl);
    httpParams = httpParams.append('serviceUrl', nvclUrl);
    httpParams = httpParams.append('datasetId',  datasetId);
    httpParams = httpParams.append('mosaicService',  'true');
    return this.http.get(environment.portalBaseUrl + 'getNVCL2_0_Logs.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['data'];
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }

  public getNVCLScalars(serviceUrl: string, datasetId: string): Observable<any> {
    let httpParams = new HttpParams();
    const nvclUrl = this.getNVCLDataServiceUrl(serviceUrl);
    httpParams = httpParams.append('serviceUrl', nvclUrl);
    httpParams = httpParams.append('datasetId',  datasetId);
    return this.http.get(environment.portalBaseUrl + 'getNVCLLogs.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['data'];
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }


  public getNVCL2_0_JSONDataBinned(serviceUrl: string, logIds: string[]): Observable<any> {
    let httpParams = new HttpParams();
    const nvclUrl = this.getNVCLDataServiceUrl(serviceUrl);
    httpParams = httpParams.append('serviceUrl', nvclUrl);
    for (const logId of logIds) {
      httpParams = httpParams.append('logIds', logId);
    }
    return this.http.get(environment.portalBaseUrl + 'getNVCL2_0_JSONDataBinned.do', {
      params: httpParams
    }).pipe(map(response => {
      return response;
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }

   public getNVCL2_0_JobsScalarBinned(boreholeId: string, jobIds: string[]): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('boreholeId', boreholeId.replace('gsml.borehole.', ''));
    for (const jobId of jobIds) {
      httpParams = httpParams.append('jobIds', jobId);
    }
    return this.http.get(environment.portalBaseUrl + 'getNVCL2_0_JobsScalarBinned.do', {
      params: httpParams
    }).pipe(map(response => {
      return response;
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }

  public getNVCL2_0_CSVDownload(serviceUrl: string, logIds: string[]): Observable<any> {
    let httpParams = new HttpParams();
    const nvclUrl = this.getNVCLDataServiceUrl(serviceUrl);
    httpParams = httpParams.append('serviceUrl', nvclUrl);
    for (const logId of logIds) {
      httpParams = httpParams.append('logIds', logId);
    }
    return this.http.post(environment.portalBaseUrl + 'getNVCL2_0_CSVDownload.do', httpParams.toString(), {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
      responseType: 'blob'
    }).pipe(map(response => {
      return response;
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }


  public getLogDefinition(logName): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('repository', 'nvcl-scalars');
    httpParams = httpParams.append('label',  logName);
    return this.http.get(environment.portalBaseUrl + 'getScalar.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['data'];
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }

  public getNVCLTSGDownload(serviceUrl: string, datasetId: string, downloadEmail: string) {
    let httpParams = new HttpParams();
    const nvclUrl = this.getNVCLDataServiceUrl(serviceUrl);
    httpParams = httpParams.append('serviceUrl', nvclUrl);
    httpParams = httpParams.append('datasetId', datasetId);
    httpParams = httpParams.append('tsg', 'on');
    httpParams = httpParams.append('email', downloadEmail);
    if (environment.googleAnalyticsKey && typeof gtag === 'function') {
      /**
       * do not "log" the "email" to "Google Analytics" - as this is an ethics issue
       * 
       * console.log("getNVCLTSGDownload() serviceUrl:"+serviceUrl+",downloadEmail:"+downloadEmail+",datasetId:"+datasetId);
       * gtag('event', 'NVCLDownload',  {'event_category': 'NVCLDownload', 'event_action': serviceUrl, 'event_label': downloadEmail, 'value': datasetId});
      */
      gtag('event', 'NVCLDownload',  {'event_category': 'NVCLDownload', 'event_action': serviceUrl, 'value': datasetId});
    }
    return this.http.post(environment.portalBaseUrl + 'getNVCLTSGDownload.do', httpParams.toString(), {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
      responseType: 'text'
    }).pipe(map(response => {
      return response;
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }

  public getNVCLTSGDownloadStatus(serviceUrl: string, downloadEmail: string) {
    let httpParams = new HttpParams();
    const nvclUrl = this.getNVCLDataServiceUrl(serviceUrl);
    httpParams = httpParams.append('serviceUrl', nvclUrl);
    httpParams = httpParams.append('email', downloadEmail);
      return this.http.post(environment.portalBaseUrl + 'getNVCLTSGDownloadStatus.do', httpParams.toString(), {
        headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
        responseType: 'text'
      }).pipe(map(response => {
        return response;
      }), catchError(
        (error: HttpResponse<any>) => {
          return observableThrowError(error);
        }
        ), );
  }

  public getNVCL2_0_TsgJobsByBoreholeId(boreholeId: string): Observable<any> {
    let httpParams = new HttpParams();

    httpParams = httpParams.append('boreholeId', boreholeId.replace('gsml.borehole.', ''));
    const email = this.storage.get('email');

    httpParams = httpParams.append('email', email);

    return this.http.get(environment.portalBaseUrl + 'getNVCL2_0_TsgJobsByBoreholeId.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['data'];
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }


  public getNVCLDataServiceUrl(serviceUrl: string): string {
    let nvclUrl = UtilitiesService.getBaseUrl(serviceUrl);
    if (nvclUrl.indexOf('pir.sa.gov.au') >= 0) {
      nvclUrl += '/nvcl';
    }
    nvclUrl = nvclUrl + '/NVCLDataServices/';
    return nvclUrl
  }

  /**
   * Returns true iff this is an NVCL v2 layer
   * 
   * @param layer layer id string
   * @returns true iff this is an NVCL v2 layer
   */
  public isNVCL(layer: string): boolean {
    return layer === 'nvcl-v2-borehole'
  }

}

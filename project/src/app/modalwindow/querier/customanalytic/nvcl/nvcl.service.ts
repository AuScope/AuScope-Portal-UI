
import {throwError as observableThrowError, Observable } from 'rxjs';

import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';
import {catchError, map} from 'rxjs/operators';
import { UtilitiesService } from '../../../../portal-core-ui/utility/utilities.service';
import { Injectable, Inject} from '@angular/core';
import {HttpClient, HttpParams, HttpHeaders} from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
declare var gtag: Function;
@Injectable()
export class NVCLService {


  constructor(private http: HttpClient , @Inject(LOCAL_STORAGE) private storage: StorageService) {

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
      (error: Response) => {
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
      (error: Response) => {
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
      (error: Response) => {
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
      (error: Response) => {
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
      (error: Response) => {
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
      (error: Response) => {
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
      (error: Response) => {
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
      gtag('event', 'NVCLDownload',  {'event_category': 'NVCLDownload', 'event_action': serviceUrl, 'event_label': downloadEmail, 'value': datasetId});
    }
    return this.http.post(environment.portalBaseUrl + 'getNVCLTSGDownload.do', httpParams.toString(), {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
      responseType: 'text'
    }).pipe(map(response => {
      return response;
    }), catchError(
      (error: Response) => {
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
        (error: Response) => {
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
      (error: Response) => {
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

}

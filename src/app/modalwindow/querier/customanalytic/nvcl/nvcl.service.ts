
import { throwError as observableThrowError, Observable, BehaviorSubject } from 'rxjs';

import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { UtilitiesService } from '../../../../lib/portal-core-ui/utility/utilities.service';
import { DownloadWfsService } from '../../../../lib/portal-core-ui/service/wfs/download/download-wfs.service';
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpResponse } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
declare let gtag: Function;
@Injectable()
export class NVCLService {

  public isAnalytic: BehaviorSubject<boolean>; // observable used in querier to control Analytic TAB

  /**
   * returns the observable of "isAnalytic" variable
   */
  getAnalytic(): Observable<boolean> {
    return this.isAnalytic.asObservable();
  }

  /**
   * sets the state of "isAnalytic" variable
   */
  setAnalytic(state:boolean): void {
    this.isAnalytic.next(state);
  }

  public isScalarLoaded: BehaviorSubject<boolean>; // observable used in querier to control loading of rickshaw chart

  /**
   * returns the observable of the "isScalarLoaded" variable
   */
  getScalarLoaded(): Observable<boolean> {
    return this.isScalarLoaded.asObservable();
  }

  /**
   * sets the state of the "isScalarLoaded" variable
   */
  setScalarLoaded(state:boolean): void {
    this.isScalarLoaded.next(state);
  }


  constructor(private http: HttpClient , @Inject(LOCAL_STORAGE) private storage: StorageService, private downloadWfsService: DownloadWfsService) {
    this.isAnalytic = new BehaviorSubject<boolean>(false);
    this.isScalarLoaded = new BehaviorSubject<boolean>(false);
  }

  public getNVCLDatasets(serviceUrl: string, holeIdentifier: string): Observable<any> {

    let httpParams = new HttpParams();
    const nvclUrl = this.getNVCLDataServiceUrl(serviceUrl);

    httpParams = httpParams.append('serviceUrl', nvclUrl);
    httpParams = httpParams.append('holeIdentifier', holeIdentifier.replace('gsml.borehole.', ''));
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
      ),);
  }

   public getNVCL2_0_Images(serviceUrl: string, datasetId: string): Observable<any> {

    let httpParams = new HttpParams();
    const nvclUrl = this.getNVCLDataServiceUrl(serviceUrl);
    httpParams = httpParams.append('serviceUrl', nvclUrl);
    httpParams = httpParams.append('datasetId', datasetId);
    httpParams = httpParams.append('mosaicService', 'true');
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
      ),);
  }

  public getNVCLScalars(serviceUrl: string, datasetId: string): Observable<any> {
    let httpParams = new HttpParams();
    const nvclUrl = this.getNVCLDataServiceUrl(serviceUrl);
    httpParams = httpParams.append('serviceUrl', nvclUrl);
    httpParams = httpParams.append('datasetId', datasetId);
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
      ),);
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
      ),);
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
      ),);
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
      ),);
  }


  public getLogDefinition(logName): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('repository', 'nvcl-scalars');
    httpParams = httpParams.append('label', logName);
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
      ),);
  }


  public getTSGCachedDownloadUrl(serviceUrl: string, datasetName: string,) {
    return this.downloadWfsService.checkTsgDownloadAvailable().pipe(map(response => {
      if (response['success'] === true) {
        const urlArrays: string[] = response['data'].split(",");
        let baseurl: string = "";
        let endpoint: string = "";
        let cacheUrl: string = "";
        const mp = new Map();
        let start = 0;
        if (urlArrays[0].indexOf("DEFAULT") >= 0) {
          baseurl = urlArrays[1].trim();
          start = 2; //skip the default;
        }
        for (let i = start; i < urlArrays.length; i += 2) {
          endpoint = urlArrays[i].trim();
          cacheUrl = urlArrays[i + 1].trim();
          if (baseurl.length > 0) {
            cacheUrl = cacheUrl.replace("$DEFAULT", baseurl);
          }
          mp.set(endpoint, cacheUrl);
        }

        let url: string = "";
        for (const [key, value] of mp) {
          if (serviceUrl.startsWith(key)) {
            url = value + datasetName + ".zip";
          }
        }
        return url
      }
    })).pipe(mergeMap(url => {
      return this.http.head(url).pipe(map(_response => {
        return url;
      },() => {
        url ="";
        return url;
      }));
    }));


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
      gtag('event', 'NVCLDownload', { 'event_category': 'NVCLDownload', 'event_action': serviceUrl, 'value': datasetId });
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
      ),);
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
        ),);
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
      ),);
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

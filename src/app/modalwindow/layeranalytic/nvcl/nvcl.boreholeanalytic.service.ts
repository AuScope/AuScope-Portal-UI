
import {throwError as observableThrowError,  Observable } from 'rxjs';

import {catchError, map} from 'rxjs/operators';
import { LayerModel } from '@auscope/portal-core-ui';
import { LayerHandlerService } from '@auscope/portal-core-ui';
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {config} from '../../../../environments/config';

import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';

@Injectable()
export class NVCLBoreholeAnalyticService {


  constructor(private http: HttpClient, private layerHandlerService: LayerHandlerService, @Inject(LOCAL_STORAGE) private storage: StorageService) {

  }

  public getNVCLAlgorithms(): Observable<any> {
    let httpParams = new HttpParams();
    const nvclUrl = config.nvclUrl;

    httpParams = httpParams.append('serviceUrl', nvclUrl);
    return this.http.get(environment.portalBaseUrl + 'getNVCLAlgorithms.do', {
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

  public getNVCLClassifications(algorithmOutputIds: string[]): Observable<any> {
    if (algorithmOutputIds.length <= 0) {
      return observableThrowError('No algorithmOUtputId specified');
    }
    let httpParams = new HttpParams();
    const nvclUrl = config.nvclUrl;

    for (const algorithmOutputId of algorithmOutputIds) {
      httpParams = httpParams.append('algorithmOutputId', algorithmOutputId);
    }

    httpParams = httpParams.append('serviceUrl', nvclUrl);
    return this.http.get(environment.portalBaseUrl + 'getNVCLClassifications.do', {
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

  public getTSGAlgorithmList(): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('outputFormat', 'json');
    return this.http.get(environment.nVCLAnalyticalUrl + 'listTsgAlgorithms.do', {
      params: httpParams
    }).pipe(map(response => {
        return response;
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }


  public getTSGAlgorithm(tsgAlgName: string): Observable<any> {

    let httpParams = new HttpParams();
    httpParams = httpParams.append('tsgAlgName', tsgAlgName);
    httpParams = httpParams.append('outputFormat', 'json');
    return this.http.get(environment.nVCLAnalyticalUrl + 'getTsgAlgorithms.do', {
      params: httpParams
    }).pipe(map(response => {
        return response;
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }

  public submitNVCLAnalyticalJob(parameters: any, layer: LayerModel): Observable<any> {
    let httpParams = new HttpParams();

    const wfsResources = this.layerHandlerService.getWFSResource(layer);
    for (const wfsUrl of layer.wfsUrls) {
      httpParams = httpParams.append('serviceurls', wfsUrl.toString());
    }

    httpParams = httpParams.append('email', parameters.email);
    httpParams = httpParams.append('jobname', parameters.jobName);

    for (const algorithmOutputId of parameters.algorithmOutputIds) {
      httpParams = httpParams.append('algorithmoutputid', algorithmOutputId);
    }

    httpParams = httpParams.append('classification', parameters.classification);
    if (parameters.logName) { httpParams = httpParams.append('logname', parameters.logName); }
    httpParams = httpParams.append('filter', parameters.ogcFilter);
    httpParams = httpParams.append('startdepth', parameters.startDepth);
    httpParams = httpParams.append('enddepth', parameters.endDepth);
    httpParams = httpParams.append('logicalop', parameters.operator);
    httpParams = httpParams.append('value', parameters.value);
    httpParams = httpParams.append('units', parameters.units);
    httpParams = httpParams.append('span', parameters.span);


    return this.http.get(environment.nVCLAnalyticalUrl + 'submitNVCLAnalyticalJob.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response['response'] ==="SUCCESS") {
        return true;
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }

  public submitNVCLTSGModJob(parameters: any, layer: LayerModel): Observable<any> {
    let httpParams = new HttpParams();

    for (const wfsUrl of layer.wfsUrls) {
      httpParams = httpParams.append('serviceurls', wfsUrl.toString());
    }
    httpParams = httpParams.append('email', parameters.email);
    httpParams = httpParams.append('jobname', parameters.jobName);
    httpParams = httpParams.append('tsgAlgName', parameters.tsgAlgName);
    httpParams = httpParams.append('tsgScript', parameters.tsgAlgorithm);
    httpParams = httpParams.append('filter', parameters.ogcFilter);
    httpParams = httpParams.append('startdepth', parameters.startDepth);
    httpParams = httpParams.append('enddepth', parameters.endDepth);
    httpParams = httpParams.append('logicalop', parameters.operator);
    httpParams = httpParams.append('value', parameters.value);
    httpParams = httpParams.append('units', parameters.units);
    httpParams = httpParams.append('span', parameters.span);


    return this.http.get(environment.nVCLAnalyticalUrl + 'submitNVCLTSGModJob.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response['response'] ==="SUCCESS") {
        return true;
      } else {
        return observableThrowError(response['msg']);
      }      
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }

  public checkNVCLAnalyticalJobStatus(email: string): Observable<any> {
    let httpParams = new HttpParams();

    httpParams = httpParams.append('email', email);


    return this.http.get(environment.nVCLAnalyticalUrl + 'checkNVCLAnalyticalJobStatus.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response === null) {
        return observableThrowError(response['msg']);
      } else {
        return response;
      }
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }

  public getNVCLJobPublishStatus(jobId: string): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('jobid', jobId);

    return this.http.get(environment.nVCLAnalyticalUrl + 'getNvclJobPublishStatus.do', {
      params: httpParams
    }).pipe(map(response => {
      return response;
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }

  public publishNvclJob(jobId: string, bPublished: boolean): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('jobid', jobId);
    httpParams = httpParams.append('publish', bPublished.toString());

    return this.http.get(environment.nVCLAnalyticalUrl + 'publishNvclJob.do', {
      params: httpParams
    }).pipe(map(response => {
      return response;
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }
// download TsgJob json result file
  public downloadNVCLJobResult(jobId: string): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('jobid', jobId);

    return this.http.get(environment.nVCLAnalyticalUrl + 'downloadNVCLJobResult.do', {
      params: httpParams,
      responseType: 'blob'
    }).pipe(map((response) => {
      return response;
    }), catchError((error: HttpResponse<any>) => {
      return observableThrowError(error);
    }), )
  }
  public downloadTsgJobData(jobId: string): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('jobid', jobId);

    return this.http.get(environment.nVCLAnalyticalUrl + 'downloadTsgJobData.do', {
      params: httpParams,
      responseType: 'blob'
    }).pipe(map((response) => { // download TsgJob scalar data csv file
      return response;
    }), catchError((error: HttpResponse<any>) => {
      return observableThrowError(error);
    }), )
  }

  public hasSavedEmail(): boolean {
    return this.storage.has('email');
  }

  public setUserEmail(email: string): void {
    this.storage.set('email', email);
  }

  public getUserEmail(): string {
    return this.storage.get('email');
  }
}
